// api/webhook/sms.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })
    : null;
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Check if polling request
    const isPollingRequest = req.method === 'GET' && (
      !req.query.text && !req.query.message && !req.query.sms && !req.query.body &&
      !req.query.momoTxnId && !req.query.rawSms && !req.query.msg
    );

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
            date: row.created_at
          }));
          return res.status(200).json({ success: true, count: formatted.length, data: formatted });
        }
      }
      return res.status(200).json({ success: true, count: 0, data: [] });
    }

    // Process SMS webhook
    let smsText = '';
    if (req.method === 'GET') {
      smsText = req.query.text || req.query.message || req.query.sms || req.query.body || '';
    } else if (req.method === 'POST') {
      smsText = req.body?.text || req.body?.message || req.body?.sms || req.body?.body || '';
    }

    console.log('📝 Raw SMS:', smsText);

    if (!smsText || smsText.length === 0) {
      return res.status(200).send('OK - No SMS text found');
    }

    // Extract data
    let momoTxnId = '';
    let amount = 0;
    let network = 'MTN';
    let referenceCode = '';

    // Extract Transaction ID
    const txnMatch = smsText.match(/Transaction ID:\s*(\d+)/i);

if (txnMatch) {
  momoTxnId = txnMatch[1];
}

    // Extract Amount
    const amountMatch = smsText.match(/GHS\s*([0-9.]+)/i);
    if (amountMatch) amount = parseFloat(amountMatch[1]) || 0;

    // Extract Reference Code
const refMatch = smsText.match(/\bDMH-\d{6}\b/i);

if (refMatch) {
  referenceCode = refMatch[0].toUpperCase();
} else {
  const refMatch2 = smsText.match(/Reference:.*?,(DMH[-]?\d+)/i);

  if (refMatch2) {
    referenceCode = refMatch2[1]
      .replace('DMH', 'DMH-')
      .toUpperCase();
  }
}

    const lower = smsText.toLowerCase();
    if (lower.includes('telecel') || lower.includes('vodafone')) network = 'Telecel';
    else if (lower.includes('airtel') || lower.includes('tigo')) network = 'AirtelTigo';
    else network = 'MTN';

    console.log('📊 Extracted:', { momoTxnId, amount, network, referenceCode });

    // Save webhook
    let webhookStatus = 'unclaimed';
    let claimedBy = '-';

    if (supabase && momoTxnId) {
      // Check for duplicate
      const { data: existing } = await supabase
        .from('sms_webhooks')
        .select('momo_txn_id')
        .eq('momo_txn_id', momoTxnId)
        .maybeSingle();

      if (existing) {
        console.log(`⏭️ Duplicate webhook for Txn ID: ${momoTxnId}`);
        return res.status(200).send(`OK - Duplicate Txn ID ${momoTxnId}`);
      }

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
    }

    // === AUTO-CLAIM WITH EXPIRY HANDLING ===
    if (referenceCode && supabase) {
      const cleanRef = referenceCode.trim().toUpperCase();
      console.log(`🔍 Looking for pending top-up: "${cleanRef}"`);

      try {
        // Find any pending top-up with this reference
        const { data: pending, error: pendingErr } = await supabase
          .from('pending_topups')
          .select('*')
          .eq('reference_code', cleanRef)
          .eq('status', 'pending');

        if (pendingErr) {
          console.error('❌ Query error:', pendingErr);
        } else if (pending && pending.length > 0) {
          const match = pending[0];
          
          // Check if expired
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
                reference_code: cleanRef
              })
              .eq('momo_txn_id', momoTxnId);
            
            console.log(`❌ Auto-credit failed: Reference expired`);
          } else {
            // Reference is active - credit the user
            console.log(`✅ Found active pending top-up: ${match.reference_code}`);
            
            // Get user profile
            const { data: userData } = await supabase
              .from('profiles')
              .select('*')
              .eq('email', match.user_email.toLowerCase().trim());

            if (userData && userData.length > 0) {
              const profile = userData[0];
              const creditAmount = Number(amount || match.amount || 0);

const { data: latestProfile, error: profileError } =
await supabase
  .from('profiles')
  .select('wallet_balance')
  .eq('id', profile.id)
  .single();

if(profileError){
 console.error(profileError);
 return;
}

const currentBalance =
Number(latestProfile.wallet_balance || 0);

const newBalance =
Number((currentBalance + creditAmount).toFixed(2));
              console.log(`💰 Updating wallet: ${currentBalance} -> ${newBalance}`);

              // Update wallet
              await supabase
                .from('profiles')
                .update({ wallet_balance: newBalance })
                .eq('id', profile.id);

              // Update pending top-up
              const { error: topupUpdateError } = await supabase
  .from('pending_topups')
  .update({
    status: 'completed',
    completed_at: new Date().toISOString()
  })
  .eq('id', match.id);

if (topupUpdateError) {
  console.error(
    'Pending topup update failed:',
    topupUpdateError.message
  );
}

              // Update webhook
              webhookStatus = 'claimed';
              claimedBy = `${match.user_name || 'Customer'} (${match.user_email}) via Auto-Ref ${cleanRef}`;
              
              await supabase
                .from('sms_webhooks')
                .update({
                  status: webhookStatus,
                  claimed_by: claimedBy,
                  reference_code: cleanRef
                })
                .eq('momo_txn_id', momoTxnId);

              // Insert wallet transaction
              await supabase
                .from('wallet_transactions')
                .insert([{
                  user_id: profile.id,
                  amount: creditAmount,
                  type: 'topup',
                  description: `Auto-Credited via MoMo (Txn: ${momoTxnId}, Ref: ${cleanRef})`,
                  reference_code: cleanRef,
                  momo_txn_id: momoTxnId,
                  balance_after: newBalance,
                  created_at: new Date().toISOString()
                }]);

              console.log(`✅✅✅ SUCCESS! Auto-credited ${match.user_email} with GHS ${creditAmount}`);
            } else {
              console.log(`❌ User profile not found for: ${match.user_email}`);
            }
          }
        } else {
          // Check if it exists but is completed
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
.update({
 status: 'claimed',
 claimed_by: 'Customer Name'
})
.eq('momo_txn_id', momoTxnId);
          } else {
            console.log(`❌ No pending top-up found for: "${cleanRef}"`);
          }
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
