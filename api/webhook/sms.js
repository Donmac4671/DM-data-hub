// api/webhook/sms.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const webhookSecret = process.env.SMS_WEBHOOK_SECRET || process.env.WEBHOOK_SECRET || '';

const supabase =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : null;

function resolveRequestSecret(req) {
  const headerSecret = req.headers['x-webhook-secret'] || req.headers['x-secret'] || req.headers['x-api-key'] || req.headers['x-bot-secret'];
  const querySecret = req.query?.secret || req.query?.token || req.query?.botSecret;
  const bodySecret = req.body?.secret || req.body?.token || req.body?.botSecret;
  return (headerSecret || querySecret || bodySecret || '').toString();
}

function isBotRequest(req) {
  const headerBot = req.headers['x-bot'] || req.headers['x-bot-request'];
  const queryBot = req.query?.bot || req.query?.source;
  return Boolean(
    headerBot === 'true' ||
    headerBot === '1' ||
    queryBot === 'bot' ||
    queryBot === 'true' ||
    queryBot === '1'
  );
}

function getWebhookPayload(req) {
  const source = req.method === 'GET' ? req.query : req.body || {};
  return {
    text: source.text || source.message || source.sms || source.body || source.content || source.msg || source.rawSms || source.sms_body || source.msg_body || '',
    momoTxnId: source.momoTxnId || source.txnId || source.transaction_id || source.transactionId || source.ref || source.reference || '',
    amount: source.amount || source.value || 0,
    network: source.network || '',
    referenceCode: source.reference || source.refCode || source.ref || source.referenceCode || '',
    senderPhone: source.from || source.sender || source.phone || source.senderPhone || source.msisdn || source.address || '',
    rawSource: source.rawSms || source.sms || source.message || source.text || JSON.stringify(source),
  };
}

console.log('📡 SMS webhook module loaded');

export default async function handler(req, res) {
  const payload = getWebhookPayload(req);
  const botRequest = isBotRequest(req);
  const hasPayload = Boolean(payload.text || payload.momoTxnId || payload.amount || payload.referenceCode);

  console.log('📨 SMS webhook request', {
    method: req.method,
    url: req.url,
    query: req.query,
    body: req.body,
    botRequest,
    hasPayload,
    secretProvided: Boolean(resolveRequestSecret(req)),
  });
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Webhook-Secret, X-Secret');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const payload = getWebhookPayload(req);
    const botRequest = isBotRequest(req);
    const hasPayload = Boolean(payload.text || payload.momoTxnId || payload.amount || payload.referenceCode);
    const isPollingRequest = req.method === 'GET' && !hasPayload;

    const requestSecret = resolveRequestSecret(req);
    const shouldAuthenticate = !isPollingRequest && hasPayload;

    if (shouldAuthenticate) {
      if (!webhookSecret) {
        console.error('SMS webhook secret is not configured in environment.');
        return res.status(500).json({ error: 'SMS webhook secret not configured' });
      }
      if (!requestSecret || requestSecret !== webhookSecret) {
        console.warn('Unauthorized SMS webhook request.', {
          receivedSecret: requestSecret ? '[REDACTED]' : 'none',
          expectedSecretSet: Boolean(webhookSecret),
        });
        return res.status(401).json({ error: 'Unauthorized' });
      }
    }

    if (isPollingRequest) {
      if (supabase) {
        const { data, error } = await supabase
          .from('sms_webhooks')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        if (!error && data) {
          const formatted = data.map(row => ({
            id: row.id,
            momoTxnId: row.momo_txn_id,
            amount: Number(row.amount),
            network: row.network,
            status: row.status || 'unclaimed',
            claimedBy: row.claimed_by || '-',
            referenceCode: row.reference_code || '',
            rawSms: row.raw_sms || '',
            senderPhone: row.sender_phone || '',
            date: row.created_at,
          }));
          return res.status(200).json({ success: true, count: formatted.length, data: formatted });
        }
      }
      return res.status(200).json({ success: true, count: 0, data: [] });
    }

    const rawPayload = [
      req.method === 'GET' ? req.query.text : req.body?.text,
      req.method === 'GET' ? req.query.message : req.body?.message,
      req.method === 'GET' ? req.query.sms : req.body?.sms,
      req.method === 'GET' ? req.query.body : req.body?.body,
      req.method === 'GET' ? req.query.rawSms : req.body?.rawSms,
      req.method === 'GET' ? req.query.content : req.body?.content,
      req.method === 'GET' ? req.query.msg : req.body?.msg,
      req.method === 'GET' ? req.query.data : req.body?.data,
    ]
      .filter(Boolean)
      .join(' ')
      .trim();

    const sourceText = rawPayload || JSON.stringify(req.method === 'GET' ? req.query : req.body || {});
    console.log('📝 Raw SMS:', sourceText);

    if (!sourceText || sourceText.length === 0) {
      console.warn('No SMS content extracted from request.');
      return res.status(200).send('OK - No SMS text found');
    }

    let momoTxnId = '';
    let amount = 0;
    let network = 'MTN';
    let referenceCode = '';

    const senderPhone = req.method === 'GET'
      ? (req.query.from || req.query.sender || req.query.phone || req.query.senderPhone || req.query.msisdn || 'SMS Forwarder')
      : (req.body?.from || req.body?.sender || req.body?.phone || req.body?.senderPhone || req.body?.msisdn || 'SMS Forwarder');

    const txnMatch = sourceText.match(/(?:Transaction ID|Txn ID|Financial Transaction Id|Transaction Id|Ref|Reference\s*No\.?|MTN\s*Ref)[:\s]*([0-9A-Za-z]{6,16})/i) ||
      sourceText.match(/\b([0-9]{8,16})\b/);
    if (txnMatch) {
      momoTxnId = txnMatch[1] || txnMatch[0];
    }

    const amountMatch = sourceText.match(/(?:GHS|GHC|GH₵|₵)\s*([0-9]+(?:\.[0-9]{1,2})?)/i) ||
      sourceText.match(/([0-9]+(?:\.[0-9]{1,2})?)\s*(?:GHS|GHC|GH₵|₵)/i);
    if (amountMatch) amount = parseFloat(amountMatch[1]) || 0;

    const lower = sourceText.toLowerCase();
    if (lower.includes('telecel') || lower.includes('vodafone')) network = 'Telecel';
    else if (lower.includes('airtel') || lower.includes('tigo') || lower.includes('at money')) network = 'AirtelTigo';
    else network = 'MTN';

    const refMatch = sourceText.match(/\bDMH[- ]?\d{6}\b/i) || sourceText.match(/Reference[:\s]*([A-Za-z0-9-]{6,16})/i);
    if (refMatch) {
      referenceCode = (refMatch[1] || refMatch[0]).toString().replace(/\s+/g, '').replace(/DMH/i, 'DMH').replace(/DMH(\d{6})/i, 'DMH-$1').toUpperCase();
    }

    if (referenceCode && referenceCode.startsWith('DMH') && !referenceCode.startsWith('DMH-')) {
      referenceCode = referenceCode.replace(/^DMH/, 'DMH-');
    }

    console.log('📊 Extracted:', { momoTxnId, amount, network, referenceCode, senderPhone });

    let webhookStatus = 'unclaimed';
    let claimedBy = '-';
    const effectiveTxnId = momoTxnId || `sms-${Date.now()}-${Math.random().toString(36).substring(2,8)}`;

    if (supabase) {
      if (momoTxnId) {
        const { data: existing } = await supabase
          .from('sms_webhooks')
          .select('momo_txn_id')
          .eq('momo_txn_id', momoTxnId)
          .maybeSingle();

        if (existing) {
          console.log(`⏭️ Duplicate webhook for Txn ID: ${momoTxnId}`);
          return res.status(200).send(`OK - Duplicate Txn ID ${momoTxnId}`);
        }
      }

      const { error: webhookError } = await supabase
        .from('sms_webhooks')
        .upsert([
          {
            id: `sms-${Date.now()}-${Math.random().toString(36).substring(2,8)}`,
            momo_txn_id: effectiveTxnId,
            amount: Number(amount || 0),
            network: network || 'MTN',
            status: 'unclaimed',
            claimed_by: '-',
            reference_code: referenceCode || '',
            raw_sms: sourceText || '',
            sender_phone: senderPhone || 'SMS Forwarder',
            created_at: new Date().toISOString(),
          },
        ], { onConflict: 'momo_txn_id' });

      if (webhookError) {
        console.error('❌ SMS webhook insert failed:', webhookError);
        throw webhookError;
      }

      console.log('✅ Webhook saved to Supabase');

      if (referenceCode) {
        const cleanRef = referenceCode.trim().toUpperCase();
        console.log(`🔍 Looking for pending top-up: "${cleanRef}"`);

        try {
          const { data: pending, error: pendingErr } = await supabase
            .from('pending_topups')
            .select('*')
            .eq('reference_code', cleanRef)
            .eq('status', 'pending');

          if (pendingErr) {
            console.error('❌ Query error:', pendingErr);
          } else if (pending && pending.length > 0) {
            const match = pending[0];
            const now = new Date();
            const expiresAt = new Date(match.expires_at);
            const isExpired = expiresAt < now;

            console.log(`📅 Expires at: ${expiresAt.toISOString()}`);
            console.log(`📅 Current time: ${now.toISOString()}`);
            console.log(`⏰ Is expired: ${isExpired}`);

            if (isExpired) {
              console.log(`⚠️ Reference "${cleanRef}" has EXPIRED`);
              webhookStatus = 'unclaimed';
              claimedBy = `EXPIRED - Reference ${cleanRef} expired at ${match.expires_at}`;

              await supabase
                .from('sms_webhooks')
                .update({
                  status: webhookStatus,
                  claimed_by: claimedBy,
                  reference_code: cleanRef,
                })
                .eq('momo_txn_id', momoTxnId);

              console.log('❌ Auto-credit failed: Reference expired');
            } else {
              console.log(`✅ Found active pending top-up: ${match.reference_code}`);
              const { data: userData } = await supabase
                .from('profiles')
                .select('*')
                .eq('email', match.user_email.toLowerCase().trim());

              if (userData && userData.length > 0) {
                const profile = userData[0];
                const creditAmount = Number(amount || match.amount || 0);

                const { data: latestProfile, error: profileError } = await supabase
                  .from('profiles')
                  .select('wallet_balance')
                  .eq('id', profile.id)
                  .single();

                if (profileError) {
                  console.error('Profile lookup failed:', profileError);
                  await supabase
                    .from('sms_webhooks')
                    .update({
                      status: 'error',
                      claimed_by: profileError.message,
                    })
                    .eq('momo_txn_id', momoTxnId);
                  throw profileError;
                }

                const currentBalance = Number(latestProfile.wallet_balance || 0);
                const newBalance = Number((currentBalance + creditAmount).toFixed(2));
                console.log(`💰 Updating wallet: ${currentBalance} -> ${newBalance}`);

                const { error: walletError } = await supabase
                  .from('profiles')
                  .update({ wallet_balance: newBalance })
                  .eq('id', profile.id);

                if (walletError) {
                  console.error(walletError);
                  throw walletError;
                }

                const { error: topupUpdateError } = await supabase
                  .from('pending_topups')
                  .update({ status: 'completed', completed_at: new Date().toISOString() })
                  .eq('id', match.id);

                if (topupUpdateError) {
                  console.error('❌ Pending topup update failed:', topupUpdateError);
                  throw topupUpdateError;
                }

                console.log('✅ Pending topup marked completed');

                webhookStatus = 'claimed';
                claimedBy = `${match.user_name || 'Customer'} (${match.user_email}) via Auto-Ref ${cleanRef}`;

                await supabase
                  .from('sms_webhooks')
                  .update({ status: webhookStatus, claimed_by: claimedBy, reference_code: cleanRef })
                  .eq('momo_txn_id', momoTxnId);

                const { error: transactionError } = await supabase
                  .from('wallet_transactions')
                  .insert([
                    {
                      id: `wallet-${Date.now()}-${Math.random().toString(36).substring(2,8)}`,
                      user_id: profile.id,
                      amount: creditAmount,
                      type: 'topup',
                      description: `Auto-Credited via MoMo (Txn: ${momoTxnId}, Ref: ${cleanRef})`,
                      reference_code: cleanRef,
                      momo_txn_id: momoTxnId,
                      balance_after: newBalance,
                      created_at: new Date().toISOString(),
                    },
                  ]);

                if (transactionError) {
                  console.error('❌ Wallet transaction insert failed:', transactionError);
                  throw transactionError;
                }

                console.log('✅ Wallet transaction created');
                console.log(`✅✅✅ SUCCESS! Auto-credited ${match.user_email} with GHS ${creditAmount}`);
              } else {
                console.log(`❌ User profile not found for: ${match.user_email}`);
              }
            }
          } else {
            const { data: completed } = await supabase
              .from('pending_topups')
              .select('*')
              .eq('reference_code', cleanRef)
              .eq('status', 'completed');

            if (completed && completed.length > 0) {
              console.log(`⚠️ Reference "${cleanRef}" was already completed`);
              webhookStatus = 'claimed';
              claimedBy = `ALREADY COMPLETED - Reference ${cleanRef}`;

              await supabase
                .from('sms_webhooks')
                .update({ status: 'claimed', claimed_by: claimedBy })
                .eq('momo_txn_id', momoTxnId);
            } else {
              console.log(`❌ No pending top-up found for: "${cleanRef}"`);
            }
          }
        } catch (autoErr) {
          console.error('❌ Auto-credit error:', autoErr);
        }
      }
    }

    return res.status(200).send(`OK - SMS Received: Txn ID ${momoTxnId || 'N/A'}, Amount GHS ${amount || 0}, Network ${network}`);
  } catch (err) {
    console.error('❌ Handler error:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
}
