const crypto = require('crypto');

function verifyStripeSignature(payload, sigHeader, secret) {
  const parts = sigHeader.split(',');
  let timestamp = '';
  const signatures = [];
  for (const part of parts) {
    const [k, v] = part.split('=');
    if (k === 't') timestamp = v;
    if (k === 'v1') signatures.push(v);
  }
  if (!timestamp || signatures.length === 0) return false;
  // Rejette les webhooks de plus de 5 minutes (protection anti-replay)
  if (Math.abs(Date.now() / 1000 - parseInt(timestamp, 10)) > 300) return false;
  const signedPayload = `${timestamp}.${payload}`;
  const expected = crypto.createHmac('sha256', secret).update(signedPayload, 'utf8').digest('hex');
  const expectedBuf = Buffer.from(expected, 'hex');
  return signatures.some(sig => {
    try {
      const sigBuf = Buffer.from(sig, 'hex');
      return sigBuf.length === expectedBuf.length && crypto.timingSafeEqual(sigBuf, expectedBuf);
    } catch { return false; }
  });
}

async function sbUpsert(table, row) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  return fetch(`${url}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify(row),
  });
}

async function sbGetBySubId(subId) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  const r = await fetch(
    `${url}/rest/v1/subscriptions?stripe_subscription_id=eq.${subId}&select=user_id`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } }
  );
  return r.json();
}

async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const rawBody = Buffer.concat(chunks).toString('utf8');

  const sig = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret || !sig || !verifyStripeSignature(rawBody, sig, secret)) {
    return res.status(400).json({ error: 'Invalid signature' });
  }

  let event;
  try { event = JSON.parse(rawBody); } catch { return res.status(400).json({ error: 'Invalid JSON' }); }

  const obj = event.data.object;

  if (event.type === 'checkout.session.completed') {
    const userId = obj.metadata?.user_id;
    if (userId && obj.subscription) {
      await sbUpsert('subscriptions', {
        user_id: userId,
        stripe_customer_id: obj.customer,
        stripe_subscription_id: obj.subscription,
        plan: obj.metadata?.plan || 'monthly',
        status: 'active',
        updated_at: new Date().toISOString(),
      });
    }
  } else if (event.type === 'customer.subscription.updated') {
    const rows = await sbGetBySubId(obj.id);
    if (rows && rows.length > 0) {
      await sbUpsert('subscriptions', {
        user_id: rows[0].user_id,
        stripe_subscription_id: obj.id,
        status: obj.status,
        current_period_end: new Date(obj.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  } else if (event.type === 'customer.subscription.deleted') {
    const rows = await sbGetBySubId(obj.id);
    if (rows && rows.length > 0) {
      await sbUpsert('subscriptions', {
        user_id: rows[0].user_id,
        stripe_subscription_id: obj.id,
        status: 'canceled',
        updated_at: new Date().toISOString(),
      });
    }
  } else if (event.type === 'invoice.payment_failed') {
    // Échec de paiement (renouvellement ou première tentative)
    const subId = obj.subscription;
    if (subId) {
      const rows = await sbGetBySubId(subId);
      if (rows && rows.length > 0) {
        await sbUpsert('subscriptions', {
          user_id: rows[0].user_id,
          stripe_subscription_id: subId,
          status: 'past_due',
          updated_at: new Date().toISOString(),
        });
      }
    }
  }

  res.json({ received: true });
}

handler.config = { api: { bodyParser: false } };
module.exports = handler;
