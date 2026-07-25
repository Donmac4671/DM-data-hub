import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

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
  const rawSms = typeof body === 'string'
    ? body
    : (body.text || body.message || body.body || body.sms || body.content || body.msg || body.rawSms || '');

  const senderPhone = body.from || body.sender || body.phone || body.senderPhone || 'SMS Forwarder';

  let momoTxnId = body.momoTxnId || body.txnId || body.transaction_id || body.ref || null;
  let amount = body.amount ? Number(body.amount) : null;
  let network: 'MTN' | 'Telecel' | 'AirtelTigo' | null = body.network || null;
  let referenceCode: string | null = body.reference || body.refCode || null;

  if (rawSms) {
    // Clean OCR typos like 18.OO -> 18.00
    const smsCleaned = rawSms
      .replace(/(\d+)\.[OOoo]/g, '$1.00')
      .replace(/(\d+)\.[Oo]/g, '$1.00');

    // 1. Transaction ID extraction
    if (!momoTxnId) {
      const txnMatch = smsCleaned.match(/(?:Financial Transaction Id|Transaction ID|Transaction Id|Txn ID|Ref ID|ID)[:\s]*([0-9A-Za-z]{8,16})/i) ||
                       smsCleaned.match(/(?:id|ref)[:\s]*([0-9]{8,14})/i) ||
                       smsCleaned.match(/\b([0-9]{9,12})\b/);
      if (txnMatch) {
        momoTxnId = txnMatch[1].trim();
      }
    }

    // 2. Amount extraction (e.g. GHS 8.00, GHS 18.OO, GHS 20.00, GHS92)
    if (!amount) {
      const amountMatch = smsCleaned.match(/(?:GHS|GHC|GH₵|₵|\$)\s*([0-9]+(?:\.[0-9]{1,2})?)/i) ||
                          smsCleaned.match(/([0-9]+(?:\.[0-9]{1,2})?)\s*(?:GHS|GHC)/i);
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
        network = 'MTN'; // Default fallback
      }
    }

    // 4. Reference Code extraction
    if (!referenceCode) {
      const refMatch = smsCleaned.match(/Reference[:\s]*([^\n\r.]+)/i);
      if (refMatch) {
        const fullRef = refMatch[1].trim();
        if (fullRef.includes(',')) {
          const parts = fullRef.split(',').map(p => p.trim());
          const lastPart = parts[parts.length - 1];
          const codeMatch = lastPart.match(/([A-Za-z0-9]+)/);
          if (codeMatch) referenceCode = codeMatch[1];
        } else {
          const codeMatch = fullRef.match(/([A-Za-z0-9_-]+)/);
          if (codeMatch) referenceCode = codeMatch[1];
        }
      }
    }
  }

  return { momoTxnId, amount, network, referenceCode, rawSms, senderPhone };
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
  const handleWebhookRequest = (req: express.Request, res: express.Response) => {
    try {
      const sourceData = req.method === 'GET' ? req.query : req.body;

      // If GET request has no SMS forwarding params, return list of webhooks
      if (req.method === 'GET' && !sourceData.text && !sourceData.message && !sourceData.msg && !sourceData.body && !sourceData.sms && !sourceData.content && !sourceData.momoTxnId && !sourceData.txnId) {
        return res.json({ success: true, count: serverWebhooks.length, data: serverWebhooks });
      }

      const { momoTxnId, amount, network, referenceCode, rawSms, senderPhone } = extractWebhookData(sourceData);

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

      if (supabaseServer) {
        supabaseServer.from('sms_webhooks').upsert([{
          momo_txn_id: effectiveTxnId,
          amount: effectiveAmount,
          network: effectiveNetwork,
          status: 'unclaimed',
          claimed_by: '-',
          reference_code: referenceCode || '',
          raw_sms: rawSms || JSON.stringify(sourceData),
          sender_phone: senderPhone || '',
          created_at: newWebhook.date
        }], { onConflict: 'momo_txn_id' }).then(({ error }) => {
          if (error) console.error('Supabase server webhook insert error:', error.message);
        });
      }

      // Return simple OK status string for SMS forwarders, or JSON if requested
      if (req.headers.accept?.includes('application/json')) {
        return res.status(200).json({
          success: true,
          message: `SMS payment webhook received and recorded: Txn ID ${momoTxnId}, Amount GHS ${amount}`,
          data: newWebhook
        });
      }

      return res.status(200).send(`OK - Payment Received: Txn ID ${momoTxnId}, Amount GHS ${amount}, Network ${effectiveNetwork}`);
    } catch (err: any) {
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
      serverWebhooks.splice(index, 1);
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
