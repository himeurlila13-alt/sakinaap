module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).end();

  const { user_id } = req.query;
  if (!user_id) return res.status(400).json({ error: 'user_id manquant' });

  const key   = process.env.STRIPE_SECRET_KEY;
  const sbUrl = process.env.SUPABASE_URL;
  const sbKey = process.env.SUPABASE_SERVICE_KEY;
  if (!key || !sbUrl || !sbKey) return res.status(500).json({ error: 'Config manquante' });

  // Vérifie que le JWT fourni correspond bien à user_id (anti-IDOR)
  const authHeader = req.headers['authorization'] || '';
  const jwt = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!jwt) return res.status(401).json({ error: 'Non authentifiée' });

  try {
    const userRes = await fetch(`${sbUrl}/auth/v1/user`, {
      headers: { apikey: sbKey, Authorization: `Bearer ${jwt}` }
    });
    if (!userRes.ok) return res.status(401).json({ error: 'Token invalide' });
    const userData = await userRes.json();
    if (userData.id !== user_id) return res.status(403).json({ error: 'Non autorisée' });

    const sbRes = await fetch(
      `${sbUrl}/rest/v1/subscriptions?user_id=eq.${encodeURIComponent(user_id)}&select=stripe_customer_id&limit=1`,
      { headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` } }
    );
    const rows = await sbRes.json();
    const customerId = rows?.[0]?.stripe_customer_id;
    if (!customerId) return res.status(404).json({ error: 'Abonnement introuvable' });

    const body = new URLSearchParams({
      customer:      customerId,
      configuration: 'bpc_1TXPyyBXUGkW7IH3SZwY4unx',
      return_url:    'https://sakinaap.com/',
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
