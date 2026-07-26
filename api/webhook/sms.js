// Vercel Serverless Function Handler for SMS Webhooks
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
    // Get the SMS text from query (GET) or body (POST)
    let smsText = '';
    if (req.method === 'GET') {
      smsText = req.query.text || req.query.message || req.query.sms || '';
    } else if (req.method === 'POST') {
      smsText = req.body?.text || req.body?.message || req.body?.sms || '';
    }

    console.log('📝 SMS Text:', smsText);

    // Extract values from SMS
    let momoTxnId = '';
    let amount = 0;
    let network = 'MTN';
    let referenceCode = '';

    if (smsText) {
      // Extract Transaction ID (11 digits)
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
    }

    console.log('📊 Extracted:', { momoTxnId, amount, network, referenceCode });

    // Save to Supabase
    if (supabase && momoTxnId) {
      try {
        // Insert webhook record
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

        // Try to auto-credit if reference code found
        if (referenceCode) {
          const cleanRef = referenceCode.trim().toUpperCase();
          console.log('🔍 Looking for reference:', cleanRef);

          const { data: pending, error: pendingErr } = await supabase
            .from('pending_topups')
            .select('*')
            .eq('reference_code', cleanRef)
            .eq('status', 'pending');

          if (!pendingErr && pending && pending.length > 0) {
            const match = pending[0];
            console.log('✅ Found pending top-up:', match.reference_code);

            // Get user profile
            const { data: userData } = await supabase
              .from('profiles')
              .select('*')
              .eq('email', match.user_email.toLowerCase().trim());

            if (userData && userData.length > 0) {
              const profile = userData[0];
              const newBalance = Number((Number(profile.wallet_balance || 0) + (amount || 0)).toFixed(2));

              // Update wallet
              await supabase
                .from('profiles')
                .update({ wallet_balance: newBalance })
                .eq('id', profile.id);

              // Update pending top-up
              await supabase
                .from('pending_topups')
                .update({ status: 'completed', completed_at: new Date().toISOString() })
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

              console.log('✅✅✅ Auto-credited!', match.user_email, 'GHS', amount);
            }
          } else {
            console.log('❌ No pending top-up found for:', cleanRef);
          }
        }
      } catch (dbErr) {
        console.error('DB Error:', dbErr);
      }
    }

    return res.status(200).send(`OK - SMS Received: Txn ID ${momoTxnId || 'N/A'}, Amount GHS ${amount || 0}, Network ${network}`);
  } catch (err) {
    console.error('❌ Error:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
}
