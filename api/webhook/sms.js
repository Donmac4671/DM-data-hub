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
  let senderName = (typeof body === 'object' && (body.fromName || body.senderName || body.name)) || null;

  console.log('📝 Raw SMS Content:', rawSms);

  if (rawSms) {
    const smsCleaned = rawSms
      .replace(/(\d+)\.[OOoo]/g, '$1.00')
      .replace(/(\d+)\.[Oo]/g, '$1.00');

    // 1. TRANSACTION ID extraction - 11 digits
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

    // 4. Sender Name extraction
    if (!senderName) {
      const nameMatch = rawSms.match(/from\s+([A-Z\s]+?)(?:\s+Current|\s+Balance|\.)/i);
      if (nameMatch) {
        senderName = nameMatch[1].trim();
        console.log('📌 Extracted Sender Name:', senderName);
      }
    }

    // 5. REFERENCE CODE extraction - DMH-XXXXXX format
    if (!referenceCode) {
      // Priority 1: DMH-XXXXXX format
      const dmhMatch = rawSms.match(/\b(DMH-\d{6})\b/i);
      if (dmhMatch) {
        referenceCode = dmhMatch[1].toUpperCase();
        console.log('📌 Extracted DMH Reference Code:', referenceCode);
      } 
      // Priority 2: Any reference format in the SMS
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

  const result = { momoTxnId, amount, network, referenceCode, rawSms, senderPhone, senderName };
  console.log('📊 Final Extraction Result:', {
    momoTxnId,
    amount,
    network,
    referenceCode,
    senderName,
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
  senderName,
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
  console.log(`🔍 Reference: "${cleanRef}"`);
  console.log(`🔍 Sender: "${senderName}" (${senderPhone})`);

  try {
    // PRIMARY STRATEGY: Find by reference code in pending_topups
    console.log(`🔍 Strategy 1: Finding pending top-up by reference code`);
    let { data: pendingData, error: pendingErr } = await supabase
      .from('pending_topups')
      .select('*')
      .eq('reference_code', cleanRef)
      .eq('status', 'pending');

    if (pendingErr) {
      console.error('❌ Error fetching pending top-up:', pendingErr);
    }

    // If found by reference, use that user
    if (pendingData && pendingData.length > 0) {
      console.log(`✅ Found pending top-up by reference code!`);
      await processAutoCredit(pendingData[0], momoTxnId, amount, network, referenceCode, rawSms, senderPhone, createdAt);
      return;
    }

    // FALLBACK STRATEGY 1: Try to find user by phone number
    console.log(`🔍 Strategy 2: No pending top-up found. Looking for user by phone number: "${senderPhone}"`);
    
    let userProfile = null;
    
    if (senderPhone && senderPhone.trim().length > 0) {
      const cleanPhone = senderPhone.replace(/\s/g, '').replace(/^0/, '233');
      const { data: phoneMatch, error: phoneErr } = await supabase
        .from('profiles')
        .select('*')
        .or(`phone_number.ilike.%${cleanPhone}%,momo_number.ilike.%${cleanPhone}%`);

      if (!phoneErr && phoneMatch && phoneMatch.length > 0) {
        userProfile = phoneMatch[0];
        console.log(`✅ Found user by phone number: ${userProfile.full_name} (${userProfile.email})`);
      }
    }

    // FALLBACK STRATEGY 2: Try to find user by sender name
    if (!userProfile && senderName && senderName.trim().length > 0) {
      console.log(`🔍 Strategy 3: Looking for user by sender name: "${senderName}"`);
      const { data: nameMatch, error: nameErr } = await supabase
        .from('profiles')
        .select('*')
        .ilike('full_name', `%${senderName.trim()}%`);

      if (!nameErr && nameMatch && nameMatch.length > 0) {
        userProfile = nameMatch[0];
        console.log(`✅ Found user by sender name: ${userProfile.full_name} (${userProfile.email})`);
      }
    }

    // If found by sender info, create a pending top-up and credit
    if (userProfile) {
      console.log(`💰 Found user: ${userProfile.full_name} (${userProfile.email})`);
      console.log(`🔄 Creating pending top-up for this user...`);
      
      // Create a pending top-up record for this user
      const { data: newPending, error: createErr } = await supabase
        .from('pending_topups')
        .insert([{
          reference_code: cleanRef,
          amount: amount,
          user_email: userProfile.email,
          user_name: userProfile.full_name,
          status: 'pending',
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (createErr) {
        console.error('❌ Failed to create pending top-up:', createErr);
        return;
      }

      console.log(`✅ Created pending top-up for user: ${userProfile.email}`);
      
      // Now process the credit
      await processAutoCredit(newPending, momoTxnId, amount, network, referenceCode, rawSms, senderPhone, createdAt);
      return;
    }

    // No match found at all
    console.log(`❌ No user found to credit. Reference: ${cleanRef}, Sender: ${senderName || senderPhone}`);
    console.log(`⚠️ Webhook saved as 'unclaimed' - manual review required`);
    
    // Update webhook status to indicate manual review needed
    await supabase
      .from('sms_webhooks')
      .update({
        status: 'unclaimed',
        claimed_by: 'Manual review needed - no pending top-up or user found',
        reference_code: cleanRef
      })
      .eq('momo_txn_id', momoTxnId);

  } catch (err) {
    console.error('❌ Error in handleAutoCredit:', err);
    console.error('❌ Stack trace:', err.stack);
  }
}

// Helper function to process auto-credit
async function processAutoCredit(
  pendingRecord,
  momoTxnId,
  amount,
  network,
  referenceCode,
  rawSms,
  senderPhone,
  createdAt
) {
  const userEmail = pendingRecord.user_email;
  const userName = pendingRecord.user_name || 'Customer';

  console.log(`✅ Processing auto-credit for user: ${userEmail}`);

  // Fetch user profile
  const { data: userData, error: userErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', userEmail.toLowerCase().trim());

  if (userErr || !userData || userData.length === 0) {
    console.error(`❌ User profile not found for email: ${userEmail}`);
    return;
  }

  const profile = userData[0];
  const currentBalance = Number(profile.wallet_balance || 0);
  const newBalance = Number((currentBalance + amount).toFixed(2));

  console.log(`💰 Updating wallet: ${currentBalance} -> ${newBalance} for user ${userEmail}`);

  // Update User Profile balance
  const { error: updateErr } = await supabase
    .from('profiles')
    .update({ wallet_balance: newBalance })
    .eq('id', profile.id);

  if (updateErr) {
    console.error('❌ Failed to update user profile balance:', updateErr.message);
    return;
  }

  // Update Pending Top-Up status
  await supabase
    .from('pending_topups')
    .update({ 
      status: 'completed',
      completed_at: new Date().toISOString()
    })
    .eq('id', pendingRecord.id);

  // Insert Wallet Transaction
  await supabase
    .from('wallet_transactions')
    .insert([{
      user_id: profile.id,
      amount: amount,
      type: 'topup',
      description: `Auto-Credited via MoMo Webhook (Txn: ${momoTxnId}, Ref: ${referenceCode})`,
      reference_code: referenceCode,
      momo_txn_id: momoTxnId,
      balance_after: newBalance,
      created_at: createdAt
    }]);

  // Update Webhook as claimed
  const claimedString = `${userName} (${userEmail}) via Auto-Ref ${referenceCode}`;
  await supabase
    .from('sms_webhooks')
    .update({
      status: 'claimed',
      claimed_by: claimedString,
      reference_code: referenceCode
    })
    .eq('momo_txn_id', momoTxnId);

  // Insert Payment Claim
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
      admin_notes: `Auto-verified & claimed instantly via webhook with reference ${referenceCode}`,
      created_at: createdAt
    }]);

  console.log(`✅✅✅ SUCCESS! Auto-credited user ${userEmail} with GHS ${amount} via Ref ${referenceCode}`);
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

    // Handle GET with UUID (fetch specific webhook)
    const urlParts = req.url.split('/');
    const lastPart = urlParts[urlParts.length - 1];
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (uuidPattern.test(lastPart) && req.method === 'GET') {
      if (!supabase) {
        return res.status(500).json({ error: 'Supabase not configured' });
      }
      
      const { data, error } = await supabase
        .from('sms_webhooks')
        .select('*')
        .eq('id', lastPart)
        .single();
      
      if (error) {
        return res.status(404).json({ error: 'Webhook not found' });
      }
      
      return res.status(200).json({
        success: true,
        data: {
          id: data.id,
          momoTxnId: data.momo_txn_id,
          amount: Number(data.amount),
          network: data.network,
          status: data.status || 'unclaimed',
          claimedBy: data.claimed_by || '-',
          referenceCode: data.reference_code || '',
          rawSms: data.raw_sms || '',
          senderPhone: data.sender_phone || '',
          date: data.created_at
        }
      });
    }

    // Handle GET request to fetch all webhooks
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

    // Process incoming SMS Webhook (POST)
    const sourceData = req.method === 'GET' ? req.query : (req.body || {});
    console.log('📨 Webhook received data:', JSON.stringify(sourceData, null, 2));

    const { momoTxnId, amount, network, referenceCode, rawSms, senderPhone, senderName } = extractWebhookData(sourceData);

    const payload = {
      momoTxnId: momoTxnId || `SMS-${Date.now()}`,
      amount: amount || 0,
      network: network || 'MTN',
      referenceCode: referenceCode || '',
      rawSms: rawSms || JSON.stringify(sourceData),
      senderPhone: senderPhone || 'SMS Forwarder',
      senderName: senderName || '',
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
            payload.senderName,
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
    return res.status(500).json({ error: 'Internal server error' });
  }
}
