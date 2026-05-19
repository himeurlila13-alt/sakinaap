const ALLOWED_ORIGINS = ['https://sakinaap.com', 'http://localhost:3000'];

module.exports = async (req, res) => {
  const origin = req.headers['origin'];
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    return res.status(403).json({ error: 'Origine non autorisée' });
  }

  const { plan } = req.query;

  const PRICES = {
    monthly: process.env.STRIPE_PRICE_MENSUEL,
    annual:  process.env.STRIPE_PRICE_ANNUEL,
  };

  if (!PRICES[plan]) {
    return res.status(400).json({ error: 'Plan invalide' });
  }

  const key   = process.env.STRIPE_SECRET_KEY;
  const sbUrl = process.env.SUPABASE_URL;
  const sbKey = process.env.SUPABASE_SERVICE_KEY;
  if (!key || !sbUrl || !sbKey) {
    return res.status(500).json({ error: 'Config manquante' });
  }

  // JWT obligatoire — l'ID de l'utilisatrice vient du token, pas du query param
  const authHeader = req.headers['authorization'] || '';
  const jwt = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!jwt) return res.status(401).json({ error: 'Non authentifiée' });

  let verifiedUserId, verifiedEmail;
  try {
    const userRes = await fetch(`${sbUrl}/auth/v1/user`, {
      headers: { apikey: sbKey, Authorization: `Bearer ${jwt}` }
    });
    if (!userRes.ok) return res.status(401).json({ error: 'Token invalide' });
    const userData = await userRes.json();
    verifiedUserId = userData.id;
    verifiedEmail = userData.email;
  } catch (_) {
    return res.status(401).json({ error: 'Vérification impossible' });
  }

  try {
    let customerId;
    if (verifiedEmail) {
      const search = await fetch(
        `https://api.stripe.com/v1/customers?email=${encodeURIComponent(verifiedEmail)}&limit=1`,
        { headers: { Authorization: `Bearer ${key}` } }
      );
      const searchData = await search.json();
      if (searchData.data && searchData.data.length > 0) {
        customerId = searchData.data[0].id;
      } else {
        const params = new URLSearchParams({ email: verifiedEmail });
        params.set('metadata[user_id]', verifiedUserId);
        const create = await fetch('https://api.stripe.com/v1/customers', {
          method: 'POST',
          headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params.toString(),
        });
        const createData = await create.json();
        customerId = createData.id;
      }
    }

    const body = new URLSearchParams({
      mode: 'subscription',
      locale: 'fr',
      'payment_method_types[]': 'card',
      'line_items[0][price]': PRICES[plan],
      'line_items[0][quantity]': '1',
      success_url: `https://sakinaap.com/?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: 'https://sakinaap.com/',
      'metadata[plan]': plan,
      'metadata[user_id]': verifiedUserId,
    });
    if (customerId) body.append('customer', customerId);

    const r = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    const data = await r.json();
    if (!r.ok) return res.status(500).json({ error: data.error?.message || 'Erreur Stripe' });
    res.json({ url: data.url });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
