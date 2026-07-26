// Vercel Serverless Function Handler for SMS Webhooks
// Path: /api/webhook/sms.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

function extractWebhookData(body) {
  if (!body) body = {};

  // Get raw SMS text from various sources
  let rawSms = '';
  
  if (body.text) {
    rawSms = body.text;
  } else if (body.message) {
    rawSms = body.message;
  } else if (body.sms) {
    rawSms = body.sms;
  } else if (body.rawSms) {
    rawSms = body.rawSms;
  } else if (typeof body === 'string') {
    rawSms = body;
  } else if (body && typeof body === 'object') {
    rawSms = body.text || body.message || body.body || body.sms || body.content ||
             body.msg || body.rawSms || body.smsContent || body.sms_body ||
             body.msg_body || body.notification || body.data || '';
    
    if (!rawSms) {
      for (const val of Object.values(body)) {
        if (typeof val === 'string' && val.length > 10) {
          const lower = val.toLowerCase();
          if (lower.includes('ghs') || lower.includes('transaction') || lower.includes('momo') || 
              lower.includes('received') || lower.includes('payment') || lower.includes('reference')) {
            rawSms = val;
            break;
          }
        }
      }
    }
  }

  console.log('📝 Raw SMS:', rawSms);

  const senderPhone = (body && typeof body === 'object' && (body.from || body.sender || body.phone || body.senderPhone || body.address)) || 'SMS Forwarder';

  let momoTxnId = null;
  let amount = null;
  let network = null;
  let referenceCode = null;

  if (body && typeof body === 'object') {
    momoTxnId = body.momoTxnId || body.txnId || body.transaction_id || body.ref || null;
    amount = body.amount ? Number(body.amount) : null;
    network = body.network || null;
    referenceCode = body.reference || body.refCode || null;
  }

  // Extract from raw SMS if available
  if (rawSms) {
    // Extract Transaction ID
    if (!momoTxnId) {
      const txnMatch = rawSms.match(/\b(\d{11})\b/) || rawSms.match(/\b(\d{8,16})\b/);
      if (txnMatch) {
        momoTxnId = txnMatch[1];
        console.log('✅ Extracted Transaction ID:', momoTxnId);
      }
    }

    // Extract Amount
    if (!amount || isNaN(amount)) {
      const amountMatch = rawSms.match(/GHS\s*([0-9.]+)/i);
      if (amountMatch) {
        amount = parseFloat(amountMatch[1]);
        console.log('💰 Extracted Amount:', amount);
      }
    }

    // Extract Network
    if (!network) {
      const smsLower = rawSms.toLowerCase();
      if (smsLower.includes('telecel') || smsLower.includes('vodafone')) {
        network = 'Telecel';
      } else if (smsLower.includes('airtel') || smsLower.includes('tigo')) {
        network = 'AirtelTigo';
      } else {
        network = 'MTN';
      }
    }

    // Extract Reference Code
    if (!referenceCode) {
      console.log('🔍 Looking for reference code in:', rawSms);
      
      const dmhMatch = rawSms.match(/DMH-\d{6}/i);
      if (dmhMatch) {
        referenceCode = dmhMatch[0].toUpperCase();
        console.log('📌 Extracted Reference Code:', referenceCode);
      }
      
      if (!referenceCode) {
        const dmhNoDash = rawSms.match(/DMH\d{6}/i);
        if (dmhNoDash) {
          let code = dmhNoDash[0].toUpperCase();
          code = code.substring(0, 3) + '-' + code.substring(3);
          referenceCode = code;
          console.log('📌 Extracted Reference Code (no dash):', referenceCode);
        }
      }
      
      if (!referenceCode) {
        const refMatch = rawSms.match(/Reference[:\s]+([A-Za-z0-9_-]+)/i);
        if (refMatch) {
          let code = refMatch[1].trim();
          code = code.replace(/[,;.:!?]$/, '');
          if (code.length >= 4) {
            referenceCode = code.toUpperCase();
            console.log('📌 Extracted Reference from "Reference:" pattern:', referenceCode);
          }
        }
      }
    }
  }

  const result = { momoTxnId, amount, network, referenceCode, rawSms, senderPhone };
  console.log('📊 Final Result:', result);
  return result;
}

async function handleAutoCredit(momoTxnId, amount, network, referenceCode, rawSms, senderPhone, createdAt) {
  if (!supabase) {
    console.log('❌ Supabase not configured');
    return;
  }
  
  if (!referenceCode) {
    console.log('⚠️ No reference code');
    return;
  }

  const cleanRef = referenceCode.trim().toUpperCase();
  console.log(`🔍 Looking for reference: "${cleanRef}"`);

  try {
    const { data: pendingData, error: pendingErr } = await supabase
      .from('pending_topups')
      .select('*')
      .eq('reference_code', cleanRef)
      .eq('status', 'pending');

    if (pendingErr) {
      console.error('❌ Error:', pendingErr);
      return;
    }

    if (!pendingData || pendingData.length === 0) {
      console.log(`❌ No pending top-up found for: "${cleanRef}"`);
      return;
    }

    const matchReq = pendingData[0];
    console.log('✅ Found:', matchReq.reference_code, matchReq.user_email);
    
    const userEmail = matchReq.user_email;
    const userName = matchReq.user_name || 'Customer';

    const { data: userData, error: userErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', userEmail.toLowerCase().trim());

    if (userErr || !userData || userData.length === 0) {
      console.error('❌ User not found:', userEmail);
      return;
    }

    const profile = userData[0];
    const currentBalance = Number(profile.wallet_balance || 0);
    const newBalance = Number((currentBalance + amount).toFixed(2));

    console.log(`💰 Updating wallet: ${currentBalance} -> ${newBalance}`);

    await supabase
      .from('profiles')
      .update({ wallet_balance: newBalance })
      .eq('id', profile.id);

    await supabase
      .from('pending_topups')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', matchReq.id);

    await supabase
      .from('wallet_transactions')
      .insert([{
        user_id: profile.id,
        amount: amount,
        type: 'topup',
        description: `Auto-Credited (Txn: ${momoTxnId}, Ref: ${cleanRef})`,
        reference_code: cleanRef,
        momo_txn_id: momoTxnId,
        balance_after: newBalance,
        created_at: createdAt
      }]);

    const claimedString = `${userName} (${userEmail}) via Auto-Ref ${cleanRef}`;
    await supabase
      .from('sms_webhooks')
      .update({
        status: 'claimed',
        claimed_by: claimedString,
        reference_code: cleanRef
      })
      .eq('momo_txn_id', momoTxnId);

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
        admin_notes: `Auto-verified via webhook with reference ${cleanRef}`,
        created_at: createdAt
      }]);

    console.log(`✅✅✅ SUCCESS! Credited ${userEmail} with GHS ${amount}`);
  } catch (err) {
    console.error('❌ Error:', err);
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const query = req.query || {};

    // Handle fetch request (GET without SMS data)
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

    // Process SMS webhook (GET with parameters or POST)
    const sourceData = req.method === 'GET' ? req.query : (req.body || {});
    console.log('📨 Webhook data:', sourceData);

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
          console.error('❌ Insert error:', insertError);
        } else {
          console.log('✅ Webhook inserted');
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
        console.error('❌ DB error:', dbErr);
      }
    }

    return res.status(200).send(`OK - SMS Received: Txn ID ${payload.momoTxnId}, Amount GHS ${payload.amount}, Network ${payload.network}`);
  } catch (err) {
    console.error('❌ Handler error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}// Vercel Serverless Function Handler for SMS Webhooks
// Path: /api/webhook/sms.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

function extractWebhookData(body) {
  if (!body) body = {};

  // Get raw SMS text from various sources
  let rawSms = '';
  
  if (body.text) {
    rawSms = body.text;
  } else if (body.message) {
    rawSms = body.message;
  } else if (body.sms) {
    rawSms = body.sms;
  } else if (body.rawSms) {
    rawSms = body.rawSms;
  } else if (typeof body === 'string') {
    rawSms = body;
  } else if (body && typeof body === 'object') {
    rawSms = body.text || body.message || body.body || body.sms || body.content ||
             body.msg || body.rawSms || body.smsContent || body.sms_body ||
             body.msg_body || body.notification || body.data || '';
    
    if (!rawSms) {
      for (const val of Object.values(body)) {
        if (typeof val === 'string' && val.length > 10) {
          const lower = val.toLowerCase();
          if (lower.includes('ghs') || lower.includes('transaction') || lower.includes('momo') || 
              lower.includes('received') || lower.includes('payment') || lower.includes('reference')) {
            rawSms = val;
            break;
          }
        }
      }
    }
  }

  console.log('📝 Raw SMS:', rawSms);

  const senderPhone = (body && typeof body === 'object' && (body.from || body.sender || body.phone || body.senderPhone || body.address)) || 'SMS Forwarder';

  let momoTxnId = null;
  let amount = null;
  let network = null;
  let referenceCode = null;

  if (body && typeof body === 'object') {
    momoTxnId = body.momoTxnId || body.txnId || body.transaction_id || body.ref || null;
    amount = body.amount ? Number(body.amount) : null;
    network = body.network || null;
    referenceCode = body.reference || body.refCode || null;
  }

  // Extract from raw SMS if available
  if (rawSms) {
    // Extract Transaction ID
    if (!momoTxnId) {
      const txnMatch = rawSms.match(/\b(\d{11})\b/) || rawSms.match(/\b(\d{8,16})\b/);
      if (txnMatch) {
        momoTxnId = txnMatch[1];
        console.log('✅ Extracted Transaction ID:', momoTxnId);
      }
    }

    // Extract Amount
    if (!amount || isNaN(amount)) {
      const amountMatch = rawSms.match(/GHS\s*([0-9.]+)/i);
      if (amountMatch) {
        amount = parseFloat(amountMatch[1]);
        console.log('💰 Extracted Amount:', amount);
      }
    }

    // Extract Network
    if (!network) {
      const smsLower = rawSms.toLowerCase();
      if (smsLower.includes('telecel') || smsLower.includes('vodafone')) {
        network = 'Telecel';
      } else if (smsLower.includes('airtel') || smsLower.includes('tigo')) {
        network = 'AirtelTigo';
      } else {
        network = 'MTN';
      }
    }

    // Extract Reference Code
    if (!referenceCode) {
      console.log('🔍 Looking for reference code in:', rawSms);
      
      const dmhMatch = rawSms.match(/DMH-\d{6}/i);
      if (dmhMatch) {
        referenceCode = dmhMatch[0].toUpperCase();
        console.log('📌 Extracted Reference Code:', referenceCode);
      }
      
      if (!referenceCode) {
        const dmhNoDash = rawSms.match(/DMH\d{6}/i);
        if (dmhNoDash) {
          let code = dmhNoDash[0].toUpperCase();
          code = code.substring(0, 3) + '-' + code.substring(3);
          referenceCode = code;
          console.log('📌 Extracted Reference Code (no dash):', referenceCode);
        }
      }
      
      if (!referenceCode) {
        const refMatch = rawSms.match(/Reference[:\s]+([A-Za-z0-9_-]+)/i);
        if (refMatch) {
          let code = refMatch[1].trim();
          code = code.replace(/[,;.:!?]$/, '');
          if (code.length >= 4) {
            referenceCode = code.toUpperCase();
            console.log('📌 Extracted Reference from "Reference:" pattern:', referenceCode);
          }
        }
      }
    }
  }

  const result = { momoTxnId, amount, network, referenceCode, rawSms, senderPhone };
  console.log('📊 Final Result:', result);
  return result;
}

async function handleAutoCredit(momoTxnId, amount, network, referenceCode, rawSms, senderPhone, createdAt) {
  if (!supabase) {
    console.log('❌ Supabase not configured');
    return;
  }
  
  if (!referenceCode) {
    console.log('⚠️ No reference code');
    return;
  }

  const cleanRef = referenceCode.trim().toUpperCase();
  console.log(`🔍 Looking for reference: "${cleanRef}"`);

  try {
    const { data: pendingData, error: pendingErr } = await supabase
      .from('pending_topups')
      .select('*')
      .eq('reference_code', cleanRef)
      .eq('status', 'pending');

    if (pendingErr) {
      console.error('❌ Error:', pendingErr);
      return;
    }

    if (!pendingData || pendingData.length === 0) {
      console.log(`❌ No pending top-up found for: "${cleanRef}"`);
      return;
    }

    const matchReq = pendingData[0];
    console.log('✅ Found:', matchReq.reference_code, matchReq.user_email);
    
    const userEmail = matchReq.user_email;
    const userName = matchReq.user_name || 'Customer';

    const { data: userData, error: userErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', userEmail.toLowerCase().trim());

    if (userErr || !userData || userData.length === 0) {
      console.error('❌ User not found:', userEmail);
      return;
    }

    const profile = userData[0];
    const currentBalance = Number(profile.wallet_balance || 0);
    const newBalance = Number((currentBalance + amount).toFixed(2));

    console.log(`💰 Updating wallet: ${currentBalance} -> ${newBalance}`);

    await supabase
      .from('profiles')
      .update({ wallet_balance: newBalance })
      .eq('id', profile.id);

    await supabase
      .from('pending_topups')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', matchReq.id);

    await supabase
      .from('wallet_transactions')
      .insert([{
        user_id: profile.id,
        amount: amount,
        type: 'topup',
        description: `Auto-Credited (Txn: ${momoTxnId}, Ref: ${cleanRef})`,
        reference_code: cleanRef,
        momo_txn_id: momoTxnId,
        balance_after: newBalance,
        created_at: createdAt
      }]);

    const claimedString = `${userName} (${userEmail}) via Auto-Ref ${cleanRef}`;
    await supabase
      .from('sms_webhooks')
      .update({
        status: 'claimed',
        claimed_by: claimedString,
        reference_code: cleanRef
      })
      .eq('momo_txn_id', momoTxnId);

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
        admin_notes: `Auto-verified via webhook with reference ${cleanRef}`,
        created_at: createdAt
      }]);

    console.log(`✅✅✅ SUCCESS! Credited ${userEmail} with GHS ${amount}`);
  } catch (err) {
    console.error('❌ Error:', err);
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const query = req.query || {};

    // Handle fetch request (GET without SMS data)
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

    // Process SMS webhook (GET with parameters or POST)
    const sourceData = req.method === 'GET' ? req.query : (req.body || {});
    console.log('📨 Webhook data:', sourceData);

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
          console.error('❌ Insert error:', insertError);
        } else {
          console.log('✅ Webhook inserted');
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
        console.error('❌ DB error:', dbErr);
      }
    }

    return res.status(200).send(`OK - SMS Received: Txn ID ${payload.momoTxnId}, Amount GHS ${payload.amount}, Network ${payload.network}`);
  } catch (err) {
    console.error('❌ Handler error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
