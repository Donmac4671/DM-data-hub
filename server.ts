import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
process.env.SUPABASE_URL || '';

const supabaseKey =
process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseServer = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

interface ServerSmsWebhook {
  id: string;
  momoTxnId: string;
  amount: number;
  network: 'MTN' | 'Telecel' | 'AirtelTigo';
  status: 'unclaimed' | 'claimed';
  claimedBy: string;
  date: string;
  rawSms?: string;
  senderPhone?: string;
}

// In-memory store for server-received SMS webhooks with default sample data
const serverWebhooks: ServerSmsWebhook[] = [
  {
    id: 'wh-server-1',
    momoTxnId: '30291049182',
    amount: 50.00,
    network: 'MTN',
    status: 'unclaimed',
    claimedBy: '-',
    date: new Date().toISOString(),
    rawSms: 'Payment received for GHS 50.00 from 0241234567. Financial Transaction Id: 30291049182.',
    senderPhone: '0241234567'
  },
  {
    id: 'wh-server-2',
    momoTxnId: '88102948102',
    amount: 100.00,
    network: 'Telecel',
    status: 'unclaimed',
    claimedBy: '-',
    date: new Date(Date.now() - 3600000).toISOString(),
    rawSms: 'Cash Deposit received: GHS 100.00 from Telecel Cash. Txn ID: 88102948102.',
    senderPhone: '0200000000'
  }
];

function extractWebhookData(body: any): {
  momoTxnId: string | null;
  amount: number | null;
  network: 'MTN' | 'Telecel' | 'AirtelTigo' | null;
  referenceCode: string | null;
  rawSms: string;
  senderPhone: string;
} {
  if (!body) body = {};

  // Get raw SMS text
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

  const senderPhone = (typeof body === 'object' && (body.from || body.sender || body.phone || body.senderPhone || body.address)) || 'SMS Forwarder';

  let momoTxnId = (typeof body === 'object' && (body.momoTxnId || body.txnId || body.transaction_id || body.ref)) || null;
  let amount = (typeof body === 'object' && body.amount) ? Number(body.amount) : null;
  let network: 'MTN' | 'Telecel' | 'AirtelTigo' | null = (typeof body === 'object' && body.network) || null;
  let referenceCode: string | null = (typeof body === 'object' && (body.reference || body.refCode)) || null;

  if (rawSms) {
    // Extract Transaction ID (11 digits)
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
      } else if (smsLower.includes('airtel') || smsLower.includes('tigo') || smsLower.includes('at money') || smsLower.includes('at ')) {
        network = 'AirtelTigo';
      } else {
        network = 'MTN';
      }
    }

    // Extract Reference Code
    if (!referenceCode) {
      console.log('🔍 Looking for reference code in:', rawSms);
      
      // Try DMH-XXXXXX pattern
      const dmhMatch = rawSms.match(/DMH-\d{6}/i);
      if (dmhMatch) {
        referenceCode = dmhMatch[0].toUpperCase();
        console.log('📌 Extracted Reference Code:', referenceCode);
      }
      
      // Try DMH without dash
      if (!referenceCode) {
        const dmhNoDash = rawSms.match(/DMH\d{6}/i);
        if (dmhNoDash) {
          let code = dmhNoDash[0].toUpperCase();
          code = code.substring(0, 3) + '-' + code.substring(3);
          referenceCode = code;
          console.log('📌 Extracted Reference Code (no dash):', referenceCode);
        }
      }
      
      // Try "Reference: CODE" pattern
      if (!referenceCode) {
        const refMatch = rawSms.match(/Reference[:\s]+([A-Za-z0-9_-]+)/i);
        if (refMatch) {
          let code = refMatch[1].trim();
          code = code.replace(/[,;.:!?]$/, '');
          if (code.length >= 4) {
            referenceCode = code.toUpperCase();
            console.log('📌 Extracted from "Reference:" pattern:', referenceCode);
          }
        }
      }
    }
  }

  const result = { momoTxnId, amount, network, referenceCode, rawSms, senderPhone };
  console.log('📊 Final Result:', result);
  return result;
}

async function handleAutoCredit(
  momoTxnId: string,
  amount: number,
  network: string,
  referenceCode: string | null,
  rawSms: string,
  senderPhone: string,
  createdAt: string
) {
  if (!supabaseServer || !referenceCode) return;
  const cleanRef = referenceCode.trim().toUpperCase();
  if (!cleanRef) return;

  try {
    // 1. Find matching pending top-up
    const { data: pendingData, error: pendingErr } = await supabaseServer
      .from('pending_topups')
      .select('*')
      .eq('reference_code', cleanRef)
      .eq('status', 'pending');

    if (pendingErr || !pendingData || pendingData.length === 0) {
      console.log(`No pending top up matching reference: ${cleanRef}`);
      return;
    }

    const matchReq = pendingData[0];
    const userEmail = matchReq.user_email;
    const userName = matchReq.user_name || 'Customer';

    // 2. Fetch target user profile
    const { data: userData, error: userErr } = await supabaseServer
      .from('profiles')
      .select('*')
      .eq('email', userEmail.toLowerCase().trim());

    if (userErr || !userData || userData.length === 0) {
      console.error(`User profile not found for email: ${userEmail}`);
      return;
    }

    const profile = userData[0];
    const currentBalance = Number(profile.wallet_balance || 0);
    const newBalance = Number((currentBalance + amount).toFixed(2));

    // 3. Update User Profile balance
    const { error: updateErr } = await supabaseServer
      .from('profiles')
      .update({ wallet_balance: newBalance })
      .eq('id', profile.id);

    if (updateErr) {
      console.error('Failed to update user profile balance:', updateErr.message);
      return;
    }

    // 4. Update Pending Top-Up status
    await supabaseServer
      .from('pending_topups')
      .update({ status: 'completed' })
      .eq('id', matchReq.id);

    // 5. Insert Wallet Transaction record
    await supabaseServer
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
    await supabaseServer
      .from('sms_webhooks')
      .update({
        status: 'claimed',
        claimed_by: claimedString,
        reference_code: cleanRef
      })
      .eq('momo_txn_id', momoTxnId);

    // 7. Insert Payment Claim record as claimed
    await supabaseServer
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

    console.log(`Successfully auto-credited user ${userEmail} with GHS ${amount} via Ref ${cleanRef}`);
  } catch (err) {
    console.error('Error in handleAutoCredit:', err);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // CORS headers
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Health check API
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'Donmac Data Hub Server' });
  });

  // GET & POST Webhook endpoint supporting URL query parameters for SMS forwarders
const handleWebhookRequest = async (req: express.Request, res: express.Response) => {
  try {
    const sourceData = req.method === 'GET' ? req.query : req.body;

    console.log('📨 Webhook received:', sourceData);

    // If GET request has no SMS forwarding params, return list of webhooks
    if (req.method === 'GET' && !sourceData.text && !sourceData.message && !sourceData.msg && !sourceData.body && !sourceData.sms && !sourceData.content && !sourceData.momoTxnId && !sourceData.txnId) {
      return res.json({ success: true, count: serverWebhooks.length, data: serverWebhooks });
    }

    const { momoTxnId, amount, network, referenceCode, rawSms, senderPhone } = extractWebhookData(sourceData);

    console.log('📊 Extracted:', { momoTxnId, amount, network, referenceCode });

    const effectiveTxnId = momoTxnId || `SMS-${Date.now()}`;
    const effectiveAmount = amount || 0;
    const effectiveNetwork = network || 'MTN';

    // Check for duplicates
    const existing = serverWebhooks.find(w => w.momoTxnId.toLowerCase() === effectiveTxnId.toLowerCase());
    if (existing) {
      return res.status(200).send(`OK - Transaction ${effectiveTxnId} already recorded.`);
    }

    const newWebhook: ServerSmsWebhook = {
      id: `wh-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      momoTxnId: effectiveTxnId,
      amount: effectiveAmount,
      network: effectiveNetwork,
      status: 'unclaimed',
      claimedBy: '-',
      date: new Date().toISOString(),
      rawSms: rawSms || JSON.stringify(sourceData),
      senderPhone
    };

    serverWebhooks.unshift(newWebhook);

    // Save webhook first before auto-credit
if (supabaseServer) {
  const { error } = await supabaseServer
    .from('sms_webhooks')
    .upsert([{
      momo_txn_id: effectiveTxnId,
      amount: effectiveAmount,
      network: effectiveNetwork,
      status: 'unclaimed',
      claimed_by: '-',
      reference_code: referenceCode || '',
      raw_sms: rawSms || JSON.stringify(sourceData),
      sender_phone: senderPhone || '',
      created_at: new Date().toISOString()
    }], { onConflict: 'momo_txn_id' });

  if (error) {
    console.error('Failed saving webhook:', error.message);
  }
}

    // Try auto-credit if reference code exists
    if (referenceCode && supabaseServer) {
      console.log('🔍 Attempting auto-credit for reference:', referenceCode);
      
      try {
        const cleanRef = referenceCode.trim().toUpperCase();
        
        // Find pending top-up
        const { data: pendingData, error: pendingErr } = await supabaseServer
          .from('pending_topups')
          .select('*')
          .eq('reference_code', cleanRef)
          .eq('status', 'pending');

        if (!pendingErr && pendingData && pendingData.length > 0) {
          const match = pendingData[0];
          console.log('✅ Found pending top-up:', match.reference_code);

          // Get user profile
          const { data: userData } = await supabaseServer
            .from('profiles')
            .select('*')
            .eq('email', match.user_email.toLowerCase().trim());

          if (userData && userData.length > 0) {
            const profile = userData[0];
            const newBalance = Number((Number(profile.wallet_balance || 0) + effectiveAmount).toFixed(2));

            // Update wallet
            await supabaseServer
              .from('profiles')
              .update({ wallet_balance: newBalance })
              .eq('id', profile.id);

            // Update pending top-up
            await supabaseServer
              .from('pending_topups')
              .update({ status: 'completed' })
              .eq('id', match.id);

            // Update webhook
            await supabaseServer
              .from('sms_webhooks')
              .update({
                status: 'claimed',
                claimed_by: `${match.user_name || 'Customer'} (${match.user_email}) via Auto-Ref ${cleanRef}`,
                reference_code: cleanRef
              })
              .eq('momo_txn_id', effectiveTxnId);

            // Insert wallet transaction
            await supabaseServer
              .from('wallet_transactions')
              .insert([{
                user_id: profile.id,
                amount: effectiveAmount,
                type: 'topup',
                description: `Auto-Credited via MoMo Webhook (Txn: ${effectiveTxnId}, Ref: ${cleanRef})`,
                reference_code: cleanRef,
                momo_txn_id: effectiveTxnId,
                balance_after: newBalance,
                created_at: newWebhook.date
              }]);

            console.log(`✅✅✅ Auto-credited! ${match.user_email} with GHS ${effectiveAmount}`);
            
            // Update the webhook in memory
            const whIndex = serverWebhooks.findIndex(w => w.id === newWebhook.id);
            if (whIndex !== -1) {
              serverWebhooks[whIndex].status = 'claimed';
              serverWebhooks[whIndex].claimedBy = `${match.user_name || 'Customer'} (${match.user_email}) via Auto-Ref ${cleanRef}`;
            }
          }
        } else {
          console.log('❌ No pending top-up found for reference:', cleanRef);
        }
      } catch (autoErr) {
        console.error('❌ Auto-credit error:', autoErr);
      }
    }

    // Also save to Supabase (if not already saved by auto-credit)
    if (supabaseServer) {
      supabaseServer.from('sms_webhooks').upsert([{
        momo_txn_id: effectiveTxnId,
        amount: effectiveAmount,
        network: effectiveNetwork,
        status: newWebhook.status,
        claimed_by: newWebhook.claimedBy,
        reference_code: referenceCode || '',
        raw_sms: rawSms || JSON.stringify(sourceData),
        sender_phone: senderPhone || '',
        created_at: newWebhook.date
      }], { onConflict: 'momo_txn_id' }).then(({ error }) => {
        if (error) {
          console.error('Supabase server webhook insert error:', error.message);
        }
      });
    }

    // Return response
    if (req.headers.accept?.includes('application/json')) {
      return res.status(200).json({
        success: true,
        message: `SMS payment webhook received and recorded: Txn ID ${effectiveTxnId}, Amount GHS ${effectiveAmount}`,
        data: newWebhook
      });
    }

    return res.status(200).send(`OK - Payment Received: Txn ID ${effectiveTxnId}, Amount GHS ${effectiveAmount}, Network ${effectiveNetwork}`);
  } catch (err: any) {
    console.error('❌ Webhook error:', err);
    return res.status(500).send(`ERROR - ${err.message || 'Internal server error'}`);
  }
};

  app.get('/api/webhook/sms', handleWebhookRequest);
  app.post('/api/webhook/sms', handleWebhookRequest);

  // DELETE a webhook by ID (Admin Action)
  app.delete('/api/webhook/sms/:id', (req, res) => {
    const { id } = req.params;
    const index = serverWebhooks.findIndex(w => w.id === id || w.momoTxnId === id);
    if (index !== -1) {
      const target = serverWebhooks[index];
      serverWebhooks.splice(index, 1);

      if (supabaseServer) {
        supabaseServer.from('sms_webhooks').delete().eq('momo_txn_id', target.momoTxnId).then(({ error }) => {
          if (error) console.error('Error deleting webhook from Supabase in server:', error.message);
        });
      }

      return res.json({ success: true, message: `Webhook ${id} deleted.` });
    }
    return res.status(404).json({ success: false, error: 'Webhook not found.' });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Donmac Data Hub Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
