const PRICES = {
  monthly: 'price_1TURF9BpdWP3jbdz75bLYC0w',
  annual:  'price_1TURH6BpdWP3jbdzH1HKUEtz',
};

module.exports = async (req, res) => {
  const { plan } = req.query;

  if (!PRICES[plan]) {
    return res.status(400).json({ error: 'Plan invalide' });
  }

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return res.status(500).json({ error: 'Clé Stripe manquante' });
  }

  const body = new URLSearchParams({
    mode: 'subscription',
    locale: 'fr',
    'payment_method_types[]': 'card',
    'line_items[0][price]': PRICES[plan],
    'line_items[0][quantity]': '1',
    success_url: 'https://sakinaap.com/?session_id={CHECKOUT_SESSION_ID}',
    cancel_url: 'https://sakinaap.com/',
    'metadata[plan]': plan,
  });

  try {
    const r = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    const data = await r.json();

    if (!r.ok) {
      return res.status(500).json({ error: data.error?.message || 'Erreur Stripe' });
    }

    res.json({ url: data.url });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
