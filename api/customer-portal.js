module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).end();

  const { user_id } = req.query;
  if (!user_id) return res.status(400).json({ error: 'user_id manquant' });

  const key    = process.env.STRIPE_SECRET_KEY;
  const sbUrl  = process.env.SUPABASE_URL;
  const sbKey  = process.env.SUPABASE_SERVICE_KEY;
  if (!key || !sbUrl || !sbKey) return res.status(500).json({ error: 'Config manquante' });

  try {
    const sbRes = await fetch(
      `${sbUrl}/rest/v1/subscriptions?user_id=eq.${encodeURIComponent(user_id)}&select=stripe_customer_id&limit=1`,
      { headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` } }
    );
    const rows = await sbRes.json();
    const customerId = rows?.[0]?.stripe_customer_id;
    if (!customerId) return res.status(404).json({ error: 'Abonnement introuvable' });

    const body = new URLSearchParams({
      customer:   customerId,
      return_url: 'https://sakinaap.com/',
    });
    const r = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
      method:  'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    body.toString(),
    });
    const data = await r.json();
    if (!r.ok) return res.status(500).json({ error: data.error?.message || 'Erreur Stripe' });
    res.json({ url: data.url });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
