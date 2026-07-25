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

    // If still empty, search values for a string containing SMS keywords
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

  if (rawSms) {
    // Clean OCR typos e.g. 18.OO -> 18.00
    const smsCleaned = rawSms
      .replace(/(\d+)\.[OOoo]/g, '$1.00')
      .replace(/(\d+)\.[Oo]/g, '$1.00');

    // 1. Transaction ID extraction
    if (!momoTxnId) {
      const txnMatch = smsCleaned.match(/(?:Financial Transaction Id|Transaction ID|Transaction Id|Txn ID|Trans ID|Ref ID|ID|Ref)[:\s]*([0-9A-Za-z]{6,20})/i) ||
                       smsCleaned.match(/(?:id|ref)[:\s]*([0-9]{8,16})/i) ||
                       smsCleaned.match(/\b([0-9]{9,16})\b/);
      if (txnMatch) {
        momoTxnId = txnMatch[1].trim();
      }
    }

    // 2. Amount extraction (e.g. GHS 8.00, GHS 18.OO, GHS 20.00, GHS92, 10.00 GHS)
    if (!amount || isNaN(amount)) {
      const amountMatch = smsCleaned.match(/(?:GHS|GHC|GH₵|₵|\$)\s*([0-9]+(?:\.[0-9]{1,2})?)/i) ||
                          smsCleaned.match(/([0-9]+(?:\.[0-9]{1,2})?)\s*(?:GHS|GHC|GH₵|₵)/i) ||
                          smsCleaned.match(/(?:received|credited|payment of|amount|paid)\s+(?:GHS|GHC|GH₵|₵)?\s*([0-9]+(?:\.[0-9]{1,2})?)/i);
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
        network = 'MTN';
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
        await supabase.from('sms_webhooks').upsert([{
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
      } catch (dbErr) {
        console.error('Supabase SMS webhook insert error:', dbErr);
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
    return res.status(200).send(`OK - SMS Received with notice: ${err.message}`);
  }
}
