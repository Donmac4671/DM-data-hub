// api/webhook/sms.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // === CHECK IF THIS IS A POLLING REQUEST (GET without SMS data) ===
    const isPollingRequest = req.method === 'GET' && (
      !req.query.text && 
      !req.query.message && 
      !req.query.sms && 
      !req.query.body &&
      !req.query.momoTxnId &&
      !req.query.rawSms &&
      !req.query.msg
    );

    // If it's a polling request, return the webhook list
    if (isPollingRequest) {
      console.log('📋 Polling request - returning webhook list');
      
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
            date: row.created_at
          }));
          return res.status(200).json({ success: true, count: formatted.length, data: formatted });
        }
      }
      return res.status(200).json({ success: true, count: 0, data: [] });
    }

    // === PROCESS ACTUAL SMS WEBHOOK ===
    console.log('📨 Processing SMS webhook...');

    // Get SMS text
    let smsText = '';
    if (req.method === 'GET') {
      smsText = req.query.text || req.query.message || req.query.sms || req.query.body || '';
    } else if (req.method === 'POST') {
      smsText = req.body?.text || req.body?.message || req.body?.sms || req.body?.body || '';
    }

    console.log('📝 Raw SMS:', smsText);

    // If no SMS text, return error
    if (!smsText || smsText.length === 0) {
      console.log('⚠️ No SMS text found');
      return res.status(200).send('OK - No SMS text found');
    }

    // Extract data from SMS
    let momoTxnId = '';
    let amount = 0;
    let network = 'MTN';
    let referenceCode = '';

    // Extract Transaction ID
    const txnMatch = smsText.match(/\b(\d{11})\b/);
    if (txnMatch) momoTxnId = txnMatch[1];

    // Extract Amount
    const amountMatch = smsText.match(/GHS\s*([0-9.]+)/i);
    if (amountMatch) amount = parseFloat(amountMatch[1]) || 0;

    // Extract Reference Code
    const refMatch = smsText.match(/DMH-\d{6}/i);
    if (refMatch) {
      referenceCode = refMatch[0].toUpperCase();
    } else {
      const refMatch2 = smsText.match(/Reference[:\s]+([A-Za-z0-9_-]+)/i);
      if (refMatch2) {
        let code = refMatch2[1].trim();
        code = code.replace(/[,;.:!?]$/, '');
        if (code.length >= 4) {
          referenceCode = code.toUpperCase();
        }
      }
    }

    // Extract Network
    const lower = smsText.toLowerCase();
    if (lower.includes('telecel') || lower.includes('vodafone')) network = 'Telecel';
    else if (lower.includes('airtel') || lower.includes('tigo')) network = 'AirtelTigo';
    else network = 'MTN';

    console.log('📊 Extracted:', { momoTxnId, amount, network, referenceCode });

    // Check for duplicate webhook
    if (momoTxnId && supabase) {
      const { data: existing } = await supabase
        .from('sms_webhooks')
        .select('momo_txn_id')
        .eq('momo_txn_id', momoTxnId)
        .maybeSingle();

      if (existing) {
        console.log(`⏭️ Duplicate webhook for Txn ID: ${momoTxnId}, skipping...`);
        return res.status(200).send(`OK - Duplicate Txn ID ${momoTxnId}`);
      }
    }

    // Save webhook to Supabase
    if (supabase && momoTxnId) {
      try {
        await supabase
          .from('sms_webhooks')
          .upsert([{
            momo_txn_id: momoTxnId,
            amount: amount || 0,
            network: network || 'MTN',
            status: 'unclaimed',
            claimed_by: '-',
            reference_code: referenceCode || '',
            raw_sms: smsText || '',
            sender_phone: 'SMS Forwarder',
            created_at: new Date().toISOString()
          }], { onConflict: 'momo_txn_id' });
        console.log('✅ Webhook saved to Supabase');
      } catch (dbErr) {
        console.error('❌ DB save error:', dbErr);
      }
    }

    // === AUTO-CLAIM LOGIC ===
    if (referenceCode && supabase) {
      const cleanRef = referenceCode.trim().toUpperCase();
      console.log(`🔍 Looking for pending top-up: "${cleanRef}"`);

      try {
        // Find matching pending top-up (not expired)
        const { data: pending, error: pendingErr } = await supabase
          .from('pending_topups')
          .select('*')
          .eq('reference_code', cleanRef)
          .eq('status', 'pending')
          .gte('expires_at', new Date().toISOString());

        if (pendingErr) {
          console.error('❌ Query error:', pendingErr);
        } else if (pending && pending.length > 0) {
          const match = pending[0];
          console.log('✅ Found pending top-up:', match.reference_code);

          // Get user profile
          const { data: userData } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', match.user_email.toLowerCase().trim());

          if (userData && userData.length > 0) {
            const profile = userData[0];
            const currentBalance = Number(profile.wallet_balance || 0);
            const newBalance = Number((currentBalance + (amount || match.amount || 0)).toFixed(2));

            console.log(`💰 Updating wallet: ${currentBalance} -> ${newBalance}`);

            // Update wallet
            await supabase
              .from('profiles')
              .update({ wallet_balance: newBalance })
              .eq('id', profile.id);

            // Update pending top-up
            await supabase
              .from('pending_topups')
              .update({ status: 'completed' })
              .eq('id', match.id);

            // Update webhook
            await supabase
              .from('sms_webhooks')
              .update({
                status: 'claimed',
                claimed_by: `${match.user_name || 'Customer'} (${match.user_email}) via Auto-Ref ${cleanRef}`,
                reference_code: cleanRef
              })
              .eq('momo_txn_id', momoTxnId);

            // Insert wallet transaction
            await supabase
              .from('wallet_transactions')
              .insert([{
                user_id: profile.id,
                amount: amount || match.amount || 0,
                type: 'topup',
                description: `Auto-Credited via MoMo (Txn: ${momoTxnId}, Ref: ${cleanRef})`,
                reference_code: cleanRef,
                momo_txn_id: momoTxnId,
                balance_after: newBalance,
                created_at: new Date().toISOString()
              }]);

            console.log(`✅✅✅ SUCCESS! Credited ${match.user_email} with GHS ${amount || match.amount || 0}`);
          } else {
            console.log('❌ User profile not found for:', match.user_email);
          }
        } else {
          console.log(`❌ No active pending top-up found for: "${cleanRef}"`);
        }
      } catch (autoErr) {
        console.error('❌ Auto-credit error:', autoErr);
      }
    }

    return res.status(200).send(`OK - SMS Received: Txn ID ${momoTxnId || 'N/A'}, Amount GHS ${amount || 0}, Network ${network}`);
  } catch (err) {
    console.error('❌ Handler error:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
}
