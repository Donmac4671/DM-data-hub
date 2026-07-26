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
    // === CRITICAL FIX: Get SMS text from query parameters ===
    let smsText = '';
    
    if (req.method === 'GET') {
      // For GET requests, check query parameters
      smsText = req.query.text || req.query.message || req.query.sms || req.query.body || '';
      console.log('📝 GET query params:', req.query);
    } else if (req.method === 'POST') {
      // For POST requests, check body
      smsText = req.body?.text || req.body?.message || req.body?.sms || req.body?.body || '';
      console.log('📝 POST body:', req.body);
    }

    console.log('📝 Raw SMS Text:', smsText);
    console.log('📝 SMS Text length:', smsText?.length);

    // If no SMS text, return error
    if (!smsText || smsText.length === 0) {
      console.log('⚠️ No SMS text found in request');
      return res.status(200).send('OK - No SMS text found');
    }

    // Extract data from SMS
    let momoTxnId = '';
    let amount = 0;
    let network = 'MTN';
    let referenceCode = '';

    // Extract Transaction ID (11 digits)
    const txnMatch = smsText.match(/\b(\d{11})\b/);
    if (txnMatch) {
      momoTxnId = txnMatch[1];
      console.log('✅ Extracted Transaction ID:', momoTxnId);
    } else {
      // Try 8-16 digits
      const txnMatch2 = smsText.match(/\b(\d{8,16})\b/);
      if (txnMatch2) {
        momoTxnId = txnMatch2[1];
        console.log('✅ Extracted Transaction ID (8-16 digits):', momoTxnId);
      }
    }

    // Extract Amount
    const amountMatch = smsText.match(/GHS\s*([0-9.]+)/i);
    if (amountMatch) {
      amount = parseFloat(amountMatch[1]) || 0;
      console.log('💰 Extracted Amount:', amount);
    }

    // Extract Reference Code (DMH-XXXXXX)
    const refMatch = smsText.match(/DMH-\d{6}/i);
    if (refMatch) {
      referenceCode = refMatch[0].toUpperCase();
      console.log('📌 Extracted Reference Code:', referenceCode);
    } else {
      // Try "Reference: CODE" pattern
      const refMatch2 = smsText.match(/Reference[:\s]+([A-Za-z0-9_-]+)/i);
      if (refMatch2) {
        let code = refMatch2[1].trim();
        code = code.replace(/[,;.:!?]$/, '');
        if (code.length >= 4) {
          referenceCode = code.toUpperCase();
          console.log('📌 Extracted from "Reference:" pattern:', referenceCode);
        }
      }
    }

    // Extract Network
    const lower = smsText.toLowerCase();
    if (lower.includes('telecel') || lower.includes('vodafone')) {
      network = 'Telecel';
    } else if (lower.includes('airtel') || lower.includes('tigo')) {
      network = 'AirtelTigo';
    } else {
      network = 'MTN';
    }

    console.log('📊 Final Extraction:', { momoTxnId, amount, network, referenceCode });

    // Save to Supabase
    if (supabase && momoTxnId) {
      try {
        await supabase
          .from('sms_webhooks')
          .upsert([{
            momo_txn_id: momoTxnId || `SMS-${Date.now()}`,
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

    // AUTO-CLAIM: Try to credit if reference code exists
    if (referenceCode && supabase) {
      const cleanRef = referenceCode.trim().toUpperCase();
      console.log('🔍 Attempting auto-credit for:', cleanRef);

      try {
        const { data: pending, error: pendingErr } = await supabase
          .from('pending_topups')
          .select('*')
          .eq('reference_code', cleanRef)
          .eq('status', 'pending');

        if (pendingErr) {
          console.error('❌ Pending query error:', pendingErr);
        } else if (pending && pending.length > 0) {
          const match = pending[0];
          console.log('✅ Found pending top-up:', match.reference_code);

          const { data: userData } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', match.user_email.toLowerCase().trim());

          if (userData && userData.length > 0) {
            const profile = userData[0];
            const currentBalance = Number(profile.wallet_balance || 0);
            const newBalance = Number((currentBalance + (amount || 0)).toFixed(2));

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
                amount: amount || 0,
                type: 'topup',
                description: `Auto-Credited via MoMo Webhook (Txn: ${momoTxnId}, Ref: ${cleanRef})`,
                reference_code: cleanRef,
                momo_txn_id: momoTxnId,
                balance_after: newBalance,
                created_at: new Date().toISOString()
              }]);

            console.log(`✅✅✅ SUCCESS! Auto-credited ${match.user_email} with GHS ${amount || 0}`);
          }
        } else {
          console.log('❌ No pending top-up found for:', cleanRef);
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
