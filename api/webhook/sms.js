import { createClient } from '@supabase/supabase-js';

// Securely pull credentials from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables on server.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { sender, message, secret } = req.body;

    // Optional webhook secret verification
    if (process.env.WEBHOOK_SECRET && secret !== process.env.WEBHOOK_SECRET) {
      return res.status(401).json({ error: 'Unauthorized webhook request' });
    }

    if (!message) {
      return res.status(400).json({ error: 'Message body is required' });
    }

    // 1. Extract Reference Code (6 to 10 alphanumeric pattern, e.g., REF-XXXXXX or 8-digit code)
    const refMatch = message.match(/\b([A-Z0-9]{6,10})\b/i);
    const extractedRef = refMatch ? refMatch[1].toUpperCase() : null;

    // 2. Extract Amount (e.g., GHS 50.00 or GH₵ 50)
    const amountMatch = message.match(/(?:GHS|GH₵|₵)\s*([\d,]+(?:\.\d{1,2})?)/i);
    const extractedAmount = amountMatch ? parseFloat(amountMatch[1].replace(',', '')) : null;

    // 3. Log raw SMS to DB
    const { data: smsLog, error: logError } = await supabase
      .from('sms_logs')
      .insert([{ sender, message, reference: extractedRef, amount: extractedAmount }])
      .select()
      .single();

    if (logError) throw logError;

    // 4. Auto-Claim Pending Top-up
    if (extractedRef) {
      const { data: pendingTopup, error: topupError } = await supabase
        .from('topups')
        .select('*')
        .eq('reference_code', extractedRef)
        .eq('status', 'pending')
        .maybeSingle();

      if (pendingTopup) {
        // Match verified: Approve topup & credit wallet
        const { error: updateError } = await supabase
          .from('topups')
          .update({ status: 'completed', updated_at: new Date().toISOString() })
          .eq('id', pendingTopup.id);

        if (!updateError) {
          // Increment user balance
          await supabase.rpc('increment_user_balance', {
            user_id_param: pendingTopup.user_id,
            amount_param: pendingTopup.amount
          });

          // Create Audit Log Entry
          await supabase.from('admin_audit_logs').insert([{
            action: 'AUTO_CLAIM_TOPUP',
            details: `Auto-credited ₵${pendingTopup.amount} for reference ${extractedRef}`,
            user_id: pendingTopup.user_id
          }]);
        }
      }
    }

    return res.status(200).json({ success: true, reference: extractedRef });
  } catch (error) {
    console.error('SMS Webhook Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
