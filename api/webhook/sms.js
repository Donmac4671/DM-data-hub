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

  console.log('📝 Raw SMS Content:', rawSms);

  if (rawSms) {
    const smsCleaned = rawSms
      .replace(/(\d+)\.[OOoo]/g, '$1.00')
      .replace(/(\d+)\.[Oo]/g, '$1.00');

    // 1. TRANSACTION ID extraction
    if (!momoTxnId) {
      const txnPatterns = [
        /\b(\d{11})\b/,
        /\b(\d{8,16})\b/,
        /(?:Transaction ID|Txn ID|Trans ID|Transaction Id|Ref ID)[:\s]*(\d{8,16})/i,
        /(?:ID|Ref)[:\s]*(\d{8,16})/i,
        /\b(\d{9,20})\b/
      ];

      for (const pattern of txnPatterns) {
        const match = smsCleaned.match(pattern);
        if (match) {
          const potentialId = match[1].trim();
          if (/^\d{8,16}$/.test(potentialId)) {
            momoTxnId = potentialId;
            console.log('✅ Extracted Transaction ID:', momoTxnId);
            break;
          }
        }
      }
    }

    // 2. Amount extraction
    if (!amount || isNaN(amount)) {
      const amountMatch = smsCleaned.match(/(?:GHS|GHC|GH₵|₵|\$)\s*([0-9]+(?:\.[0-9]{1,2})?)/i) ||
                          smsCleaned.match(/([0-9]+(?:\.[0-9]{1,2})?)\s*(?:GHS|GHC|GH₵|₵)/i) ||
                          smsCleaned.match(/(?:received|credited|payment of|amount|paid)\s+(?:GHS|GHC|GH₵|₵)?\s*([0-9]+(?:\.[0-9]{1,2})?)/i) ||
                          smsCleaned.match(/\b([0-9]+\.[0-9]{2})\b/);
      if (amountMatch) {
        amount = parseFloat(amountMatch[1]);
        console.log('💰 Extracted Amount:', amount);
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

    // 4. REFERENCE CODE extraction - Focused on DMH format
    if (!referenceCode) {
      // Priority 1: DMH-XXXXXX format (like DMH-684067)
      const dmhMatch = rawSms.match(/\b(DMH-\d{6})\b/i);
      if (dmhMatch) {
        referenceCode = dmhMatch[1].toUpperCase();
        console.log('📌 Extracted DMH Reference Code:', referenceCode);
      } 
      // Priority 2: DMHXXXXXX without dash (like DMH684067)
      else {
        const dmhNoDashMatch = rawSms.match(/\b(DMH\d{6})\b/i);
        if (dmhNoDashMatch) {
          const code = dmhNoDashMatch[1].toUpperCase();
          referenceCode = code.substring(0, 3) + '-' + code.substring(3);
          console.log('📌 Extracted and formatted DMH Reference Code:', referenceCode);
        } 
        // Priority 3: Other reference patterns
        else {
          const refPatterns = [
            /Reference[:\s]+([A-Za-z0-9_-]+)(?=[,\s.]|$)/i,
            /Ref[:\s]+([A-Za-z0-9_-]+)(?=[,\s.]|$)/i,
            /Code[:\s]+([A-Za-z0-9_-]+)(?=[,\s.]|$)/i,
            /\b([A-Z]{2,4}-\d{4,8})\b/,
            /\b([A-Za-z0-9]{6,12})\b/
          ];
          
          for (const pattern of refPatterns) {
            const match = rawSms.match(pattern);
            if (match) {
              let code = match[1].trim();
              code = code.replace(/[,;.:!?]$/, '');
              if (/^[A-Za-z0-9_-]+$/.test(code) && code.length >= 4 && !/^\d+$/.test(code)) {
                referenceCode = code.toUpperCase();
                console.log('📌 Extracted Reference Code:', referenceCode);
                break;
              }
            }
          }
        }
      }
    }
  }

  const result = { momoTxnId, amount, network, referenceCode, rawSms, senderPhone };
  console.log('📊 Final Extraction Result:', {
    momoTxnId,
    amount,
    network,
    referenceCode,
    senderPhone
  });
  
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
    console.log('❌ Supabase not configured, skipping auto-credit');
    return;
  }
  
  if (!referenceCode) {
    console.log('⚠️ No reference code found, skipping auto-credit');
    return;
  }

  const cleanRef = referenceCode.trim().toUpperCase();
  console.log(`🔍 ===== STARTING AUTO-CREDIT CHECK =====`);
  console.log(`🔍 Looking for pending top-up with reference: "${cleanRef}"`);
  console.log(`🔍 Original reference code: "${referenceCode}"`);

  try {
    // FIRST: Let's check ALL pending top-ups to see what's in the database
    const { data: allPendingData, error: allPendingErr } = await supabase
      .from('pending_topups')
      .select('*')
      .eq('status', 'pending');

    if (allPendingErr) {
      console.error('❌ Error fetching all pending top-ups:', allPendingErr);
    } else {
      console.log(`📋 Total pending top-ups in database: ${allPendingData?.length || 0}`);
      if (allPendingData && allPendingData.length > 0) {
        console.log('📋 All pending references with details:');
        allPendingData.forEach(p => {
          console.log(`  - Ref: "${p.reference_code}" (type: ${typeof p.reference_code}), Email: ${p.user_email}, Amount: ${p.amount}`);
        });
      } else {
        console.log('⚠️ No pending top-ups found in the database!');
        return;
      }
    }

    // Strategy 1: Try exact match with the clean reference
    console.log(`🔍 Strategy 1: Exact match for "${cleanRef}"`);
    let { data: pendingData, error: pendingErr } = await supabase
      .from('pending_topups')
      .select('*')
      .eq('reference_code', cleanRef)
      .eq('status', 'pending');

    if (pendingErr) {
      console.error('❌ Error fetching pending top-up:', pendingErr);
    }

    // Strategy 2: If no match, try case-insensitive using ilike
    if (!pendingData || pendingData.length === 0) {
      console.log(`🔍 Strategy 2: Case-insensitive match for "${cleanRef}"`);
      const { data: ilikeData, error: ilikeErr } = await supabase
        .from('pending_topups')
        .select('*')
        .ilike('reference_code', cleanRef)
        .eq('status', 'pending');

      if (!ilikeErr && ilikeData && ilikeData.length > 0) {
        pendingData = ilikeData;
        console.log(`✅ Found ${ilikeData.length} match(es) using ILIKE`);
      }
    }

    // Strategy 3: If still no match, try partial match (contains)
    if (!pendingData || pendingData.length === 0) {
      console.log(`🔍 Strategy 3: Partial match for "${cleanRef}"`);
      // Extract the numeric part if it's DMH-XXXXXX
      const numericPart = cleanRef.replace(/[^0-9]/g, '');
      if (numericPart.length >= 4) {
        const { data: partialData, error: partialErr } = await supabase
          .from('pending_topups')
          .select('*')
          .ilike('reference_code', `%${numericPart}%`)
          .eq('status', 'pending');

        if (!partialErr && partialData && partialData.length > 0) {
          pendingData = partialData;
          console.log(`✅ Found ${partialData.length} match(es) using partial match on "${numericPart}"`);
        }
      }
    }

    // Strategy 4: If still no match, check if the reference exists with any status
    if (!pendingData || pendingData.length === 0) {
      console.log(`🔍 Strategy 4: Check if reference exists with any status`);
      const { data: anyStatusData, error: anyStatusErr } = await supabase
        .from('pending_topups')
        .select('*')
        .ilike('reference_code', cleanRef);

      if (!anyStatusErr && anyStatusData && anyStatusData.length > 0) {
        console.log(`⚠️ Found reference "${cleanRef}" but status is: ${anyStatusData[0].status}`);
        if (anyStatusData[0].status === 'completed') {
          console.log('⚠️ This top-up has already been completed!');
        } else if (anyStatusData[0].status === 'pending') {
          console.log('⚠️ Found as pending but wasn\'t caught by previous queries!');
          pendingData = anyStatusData;
        }
      } else {
        console.log(`❌ No top-up with reference "${cleanRef}" exists at all in the database`);
        
        // Let's check if there are any references that are similar
        if (allPendingData && allPendingData.length > 0) {
          console.log('🔍 Looking for similar references:');
          const similar = allPendingData.filter(p => {
            const dbRef = p.reference_code?.toUpperCase() || '';
            return dbRef.includes(cleanRef.substring(0, 6)) || cleanRef.includes(dbRef.substring(0, 6));
          });
          if (similar.length > 0) {
            console.log('⚠️ Found similar references:', similar.map(p => p.reference_code));
          }
        }
        return;
      }
    }

    if (!pendingData || pendingData.length === 0) {
      console.log(`❌ No pending top up found matching reference: "${cleanRef}"`);
      return;
    }

    // Process the first match
    const matchReq = pendingData[0];
    console.log('✅ Found matching pending top-up:', {
      id: matchReq.id,
      reference_code: matchReq.reference_code,
      user_email: matchReq.user_email,
      user_name: matchReq.user_name,
      amount: matchReq.amount,
      status: matchReq.status,
      created_at: matchReq.created_at
    });
    
    const userEmail = matchReq.user_email;
    const userName = matchReq.user_name || 'Customer';

    // 2. Fetch target user profile
    console.log(`🔍 Fetching user profile for email: ${userEmail}`);
    const { data: userData, error: userErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', userEmail.toLowerCase().trim());

    if (userErr) {
      console.error('❌ Error fetching user profile:', userErr);
      return;
    }

    if (!userData || userData.length === 0) {
      console.error(`❌ User profile not found for email: ${userEmail}`);
      return;
    }

    const profile = userData[0];
    const currentBalance = Number(profile.wallet_balance || 0);
    const newBalance = Number((currentBalance + amount).toFixed(2));

    console.log(`💰 Updating wallet: ${currentBalance} -> ${newBalance} for user ${userEmail}`);

    // 3. Update User Profile balance
    const { error: updateErr } = await supabase
      .from('profiles')
      .update({ wallet_balance: newBalance })
      .eq('id', profile.id);

    if (updateErr) {
      console.error('❌ Failed to update user profile balance:', updateErr.message);
      return;
    }

    // 4. Update Pending Top-Up status
    console.log(`🔄 Updating pending top-up status to 'completed'`);
    const { error: updateTopupErr } = await supabase
      .from('pending_topups')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', matchReq.id);

    if (updateTopupErr) {
      console.error('❌ Failed to update pending top-up status:', updateTopupErr.message);
    } else {
      console.log('✅ Pending top-up status updated to completed');
    }

    // 5. Insert Wallet Transaction record
    console.log(`💳 Creating wallet transaction for ${amount} GHS`);
    const { error: txErr } = await supabase
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

    if (txErr) {
      console.error('❌ Failed to insert wallet transaction:', txErr.message);
    } else {
      console.log('✅ Wallet transaction created');
    }

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

    console.log(`✅✅✅ SUCCESS! Auto-credited user ${userEmail} with GHS ${amount} via Ref ${cleanRef}`);
    console.log(`✅✅✅ ===== AUTO-CREDIT COMPLETED =====`);
  } catch (err) {
    console.error('❌ Error in handleAutoCredit:', err);
    console.error('❌ Stack trace:', err.stack);
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
    console.log('📨 Webhook received data:', JSON.stringify(sourceData, null, 2));

    const { momoTxnId, amount, network, referenceCode, rawSms, senderPhone } = extractWebhookData(sourceData);

    const payload = {
      momoTxnId: momoTxnId || `SMS-${Date.now()}`,
      amount: amount || 0,
      network: network || 'MTN',
      referenceCode: referenceCode || '',
      rawSms: rawSms || JSON.stringify(sourceData),
      senderPhone: senderPhone || 'SMS Forwarder',
      receivedAt: new Date().toISOString()
    };

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
          console.error('❌ Supabase SMS webhook insert error:', insertError);
        } else {
          console.log('✅ Webhook inserted successfully');
          
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
        console.error('❌ Supabase operation error:', dbErr);
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
    console.error('❌ Webhook handler error:', err);
    return res.status(200).send(`OK - SMS Received with notice: ${err.message}`);
  }
}
