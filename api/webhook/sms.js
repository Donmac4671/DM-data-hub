// Vercel Serverless Function Handler for SMS Webhooks
// Path: /api/webhook/sms.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

function extractWebhookData(body) {
  if (!body) body = {};

  let rawSms = typeof body === 'string' ? body : '';

  if (!rawSms && typeof body === 'object') {
    rawSms = body.text || body.message || body.body || body.sms || body.content ||
             body.msg || body.rawSms || body.smsContent || body.sms_body ||
             body.msg_body || body.notification || body.data || '';

    // If still empty, search values for a string containing SMS keywords
    if (!rawSms) {
      for (const val of Object.values(body)) {
        if (typeof val === 'string' && val.length > 10) {
          const lower = val.toLowerCase();
          if (lower.includes('ghs') || lower.includes('transaction') || lower.includes('momo') || lower.includes('received') || lower.includes('payment')) {
            rawSms = val;
            break;
          }
        }
      }
    }

    if (!rawSms) {
      try {
        rawSms = JSON.stringify(body);
      } catch (e) {
        rawSms = '';
      }
    }
  }

  const senderPhone = (typeof body === 'object' && (body.from || body.sender || body.phone || body.senderPhone || body.address)) || 'SMS Forwarder';

  let momoTxnId = (typeof body === 'object' && (body.momoTxnId || body.txnId || body.transaction_id || body.ref)) || null;
  let amount = (typeof body === 'object' && body.amount) ? Number(body.amount) : null;
  let network = (typeof body === 'object' && body.network) || null;
  let referenceCode = (typeof body === 'object' && (body.reference || body.refCode)) || null;

  if (rawSms) {
    // Clean OCR typos e.g. 18.OO -> 18.00
    const smsCleaned = rawSms
      .replace(/(\d+)\.[OOoo]/g, '$1.00')
      .replace(/(\d+)\.[Oo]/g, '$1.00');

    // 1. Transaction ID extraction
    if (!momoTxnId) {
      const txnMatch = smsCleaned.match(/(?:Financial Transaction Id|Transaction ID|Transaction Id|Txn ID|Trans ID|Ref ID|ID|Ref)[:\s]*([0-9A-Za-z]{6,20})/i) ||
                       smsCleaned.match(/(?:id|ref)[:\s]*([0-9]{8,16})/i) ||
                       smsCleaned.match(/\b([0-9]{9,16})\b/);
      if (txnMatch) {
        momoTxnId = txnMatch[1].trim();
      }
    }

    // 2. Amount extraction (e.g. GHS 8.00, GHS 18.OO, GHS 20.00, GHS92, 10.00 GHS)
    if (!amount || isNaN(amount)) {
      const amountMatch = smsCleaned.match(/(?:GHS|GHC|GH₵|₵|\$)\s*([0-9]+(?:\.[0-9]{1,2})?)/i) ||
                          smsCleaned.match(/([0-9]+(?:\.[0-9]{1,2})?)\s*(?:GHS|GHC|GH₵|₵)/i) ||
                          smsCleaned.match(/(?:received|credited|payment of|amount|paid)\s+(?:GHS|GHC|GH₵|₵)?\s*([0-9]+(?:\.[0-9]{1,2})?)/i);
      if (amountMatch) {
        amount = parseFloat(amountMatch[1]);
      }
    }

    // 3. Network extraction
    if (!network) {
      const smsLower = rawSms.toLowerCase();
      if (smsLower.includes('telecel') || smsLower.includes('vodafone')) {
        network = 'Telecel';
      } else if (smsLower.includes('airtel') || smsLower.includes('tigo') || smsLower.includes('at money') || smsLower.includes('at ')) {
        network = 'AirtelTigo';
      } else {
        network = 'MTN';
      }
    }

    // 4. FIXED Reference Code extraction - Priority order
    if (!referenceCode) {
      // Log the SMS for debugging
      console.log('Raw SMS for ref extraction:', smsCleaned);
      
      // PRIORITY 1: Look for DMH pattern (your specific format)
      const dmhMatch = smsCleaned.match(/(DMH-\d{6})/i);
      if (dmhMatch) {
        referenceCode = dmhMatch[1].toUpperCase();
        console.log('Extracted DMH reference:', referenceCode);
      } else {
        // PRIORITY 2: Look for "Reference:" or "Ref:" followed by a code
        // This fixes the issue where it was capturing too much text
        const refPatterns = [
          // Pattern: Reference: CODE (stops at comma, space, newline, or period)
          /Reference[:\s]+([A-Za-z0-9_-]+)(?=[,\s.]|$)/i,
          // Pattern: Ref: CODE
          /Ref[:\s]+([A-Za-z0-9_-]+)(?=[,\s.]|$)/i,
          // Pattern: Reference Code: CODE
          /Reference Code[:\s]+([A-Za-z0-9_-]+)(?=[,\s.]|$)/i,
          // Pattern: Any alphanumeric code with hyphen (like ABC-123456)
          /\b([A-Z]{2,4}-\d{4,8})\b/,
          // Pattern: Any 6+ character alphanumeric code (fallback)
          /\b([A-Za-z0-9]{6,12})\b/
        ];
        
        for (const pattern of refPatterns) {
          const match = smsCleaned.match(pattern);
          if (match) {
            let code = match[1].trim();
            // Clean the code - remove any trailing punctuation
            code = code.replace(/[,;.:!?]$/, '');
            // Only accept codes that are alphanumeric with possible hyphens/underscores
            if (/^[A-Za-z0-9_-]+$/.test(code) && code.length >= 4) {
              referenceCode = code;
              console.log('Extracted reference from pattern:', referenceCode, 'Pattern:', pattern);
              break;
            }
          }
        }
      }
    }
  }

  const result = { momoTxnId, amount, network, referenceCode, rawSms, senderPhone };
  console.log('Extraction result:', result);
  return result;
}

async function handleAutoCredit(
  momoTxnId,
  amount,
  network,
  referenceCode,
  rawSms,
  senderPhone,
  createdAt
) {
  if (!supabase) {
    console.log('Supabase not configured, skipping auto-credit');
    return;
  }
  
  if (!referenceCode) {
    console.log('No reference code found, skipping auto-credit');
    return;
  }

  const cleanRef = referenceCode.trim().toUpperCase();
  console.log(`Looking for pending top-up with reference: "${cleanRef}"`);

  try {
    // 1. Find matching pending top-up
    const { data: pendingData, error: pendingErr } = await supabase
      .from('pending_topups')
      .select('*')
      .eq('reference_code', cleanRef)
      .eq('status', 'pending');

    if (pendingErr) {
      console.error('Error fetching pending top-up:', pendingErr);
      return;
    }

    if (!pendingData || pendingData.length === 0) {
      console.log(`No pending top up found matching reference: "${cleanRef}"`);
      // Log all pending top-ups for debugging
      const { data: allPending } = await supabase
        .from('pending_topups')
        .select('reference_code, status')
        .eq('status', 'pending');
      console.log('All pending references:', allPending?.map(p => p.reference_code) || []);
      return;
    }

    const matchReq = pendingData[0];
    console.log('Found matching pending top-up:', matchReq);
    
    const userEmail = matchReq.user_email;
    const userName = matchReq.user_name || 'Customer';

    // 2. Fetch target user profile
    const { data: userData, error: userErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', userEmail.toLowerCase().trim());

    if (userErr) {
      console.error('Error fetching user profile:', userErr);
      return;
    }

    if (!userData || userData.length === 0) {
      console.error(`User profile not found for email: ${userEmail}`);
      return;
    }

    const profile = userData[0];
    const currentBalance = Number(profile.wallet_balance || 0);
    const newBalance = Number((currentBalance + amount).toFixed(2));

    console.log(`Updating wallet: ${currentBalance} -> ${newBalance} for user ${userEmail}`);

    // 3. Update User Profile balance
    const { error: updateErr } = await supabase
      .from('profiles')
      .update({ wallet_balance: newBalance })
      .eq('id', profile.id);

    if (updateErr) {
      console.error('Failed to update user profile balance:', updateErr.message);
      return;
    }

    // 4. Update Pending Top-Up status
    await supabase
      .from('pending_topups')
      .update({ status: 'completed' })
      .eq('id', matchReq.id);

    // 5. Insert Wallet Transaction record
    await supabase
      .from('wallet_transactions')
      .insert([{
        user_id: profile.id,
        amount: amount,
        type: 'topup',
        description: `Auto-Credited via MoMo Webhook (Txn: ${momoTxnId}, Ref: ${cleanRef})`,
        reference_code: cleanRef,
        momo_txn_id: momoTxnId,
        balance_after: newBalance,
        created_at: createdAt
      }]);

    // 6. Update Webhook record as claimed
    const claimedString = `${userName} (${userEmail}) via Auto-Ref ${cleanRef}`;
    await supabase
      .from('sms_webhooks')
      .update({
        status: 'claimed',
        claimed_by: claimedString,
        reference_code: cleanRef
      })
      .eq('momo_txn_id', momoTxnId);

    // 7. Insert Payment Claim record as claimed
    await supabase
      .from('payment_claims')
      .insert([{
        user_id: profile.id,
        user_email: userEmail,
        user_name: userName,
        momo_txn_id: momoTxnId,
        momo_number: senderPhone || 'SMS Webhook',
        amount: amount,
        status: 'claimed',
        admin_notes: `Auto-verified & claimed instantly via webhook with reference ${cleanRef}`,
        created_at: createdAt
      }]);

    console.log(`✅ Successfully auto-credited user ${userEmail} with GHS ${amount} via Ref ${cleanRef}`);
  } catch (err) {
    console.error('Error in handleAutoCredit:', err);
  }
}

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const query = req.query || {};

    // Check if this is a GET request to FETCH webhooks list
    const isFetchRequest = req.method === 'GET' && (
      query.action === 'fetch' ||
      (!query.text && !query.message && !query.sms && !query.body && !query.content && !query.momoTxnId && !query.rawSms && !query.msg)
    );

    if (isFetchRequest) {
      if (supabase) {
        const { data, error } = await supabase.from('sms_webhooks').select('*').order('created_at', { ascending: false });
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
            date: row.created_at
          }));
          return res.status(200).json({ success: true, count: formatted.length, data: formatted });
        }
      }
      return res.status(200).json({ success: true, count: 0, data: [] });
    }

    // Otherwise, process incoming SMS Webhook (POST or GET with parameters)
    const sourceData = req.method === 'GET' ? req.query : (req.body || {});
    console.log('Webhook received data:', sourceData);

    const { momoTxnId, amount, network, referenceCode, rawSms, senderPhone } = extractWebhookData(sourceData);
    console.log('Extracted data:', { momoTxnId, amount, network, referenceCode, senderPhone });

    const payload = {
      momoTxnId: momoTxnId || `SMS-${Date.now()}`,
      amount: amount || 0,
      network: network || 'MTN',
      referenceCode: referenceCode || '',
      rawSms: rawSms || JSON.stringify(sourceData),
      senderPhone: senderPhone || 'SMS Forwarder',
      receivedAt: new Date().toISOString()
    };

    // Log to a webhook_logs table if it exists (optional)
    if (supabase) {
      try {
        // Check if webhook_logs table exists
        const { data: tableCheck } = await supabase
          .from('webhook_logs')
          .select('count')
          .limit(1)
          .maybeSingle()
          .catch(() => ({ data: null }));

        if (tableCheck !== null) {
          await supabase.from('webhook_logs').insert([{
            momo_txn_id: payload.momoTxnId,
            amount: payload.amount,
            reference_code: payload.referenceCode,
            raw_payload: JSON.stringify(sourceData),
            extracted_sms: payload.rawSms,
            created_at: payload.receivedAt
          }]);
        }
      } catch (logErr) {
        // Ignore logging errors
        console.debug('Webhook logging skipped:', logErr.message);
      }
    }

    if (supabase) {
      try {
        // Insert or update webhook
        const { error: insertError } = await supabase
          .from('sms_webhooks')
          .upsert([{
            momo_txn_id: payload.momoTxnId,
            amount: payload.amount,
            network: payload.network,
            status: 'unclaimed',
            claimed_by: '-',
            reference_code: payload.referenceCode,
            raw_sms: payload.rawSms,
            sender_phone: payload.senderPhone,
            created_at: payload.receivedAt
          }], { onConflict: 'momo_txn_id' });

        if (insertError) {
          console.error('Supabase SMS webhook insert error:', insertError);
        } else {
          console.log('Webhook inserted successfully');
          // Trigger auto credit verification!
          await handleAutoCredit(
            payload.momoTxnId,
            payload.amount,
            payload.network,
            payload.referenceCode,
            payload.rawSms,
            payload.senderPhone,
            payload.receivedAt
          );
        }
      } catch (dbErr) {
        console.error('Supabase operation error:', dbErr);
      }
    }

    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.status(200).json({
        success: true,
        message: 'SMS Webhook processed successfully.',
        data: payload
      });
    }

    return res.status(200).send(`OK - SMS Received: Txn ID ${payload.momoTxnId}, Amount GHS ${payload.amount}, Network ${payload.network}`);
  } catch (err) {
    console.error('Webhook handler error:', err);
    return res.status(200).send(`OK - SMS Received with notice: ${err.message}`);
  }
}
