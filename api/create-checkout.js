module.exports = async (req, res) => {
  const { plan, user_id, email } = req.query;

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

  // Vérifie JWT et cohérence avec user_id
  const authHeader = req.headers['authorization'] || '';
  const jwt = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (jwt) {
    try {
      const userRes = await fetch(`${sbUrl}/auth/v1/user`, {
        headers: { apikey: sbKey, Authorization: `Bearer ${jwt}` }
      });
      if (userRes.ok) {
        const userData = await userRes.json();
        if (user_id && userData.id !== user_id) {
          return res.status(403).json({ error: 'Non autorisée' });
        }
      }
    } catch (_) {}
  }

  try {
    let customerId;
    if (email) {
      const search = await fetch(
        `https://api.stripe.com/v1/customers?email=${encodeURIComponent(email)}&limit=1`,
        { headers: { Authorization: `Bearer ${key}` } }
      );
      const searchData = await search.json();
      if (searchData.data && searchData.data.length > 0) {
        customerId = searchData.data[0].id;
      } else {
        const params = new URLSearchParams({ email });
        if (user_id) params.set('metadata[user_id]', user_id);
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
      'metadata[user_id]': user_id || '',
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
