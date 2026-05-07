module.exports = async (req, res) => {
  const { id } = req.query;

  if (!id || !id.startsWith('cs_')) {
    return res.status(400).json({ valid: false });
  }

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return res.status(500).json({ valid: false });
  }

  try {
    const r = await fetch(`https://api.stripe.com/v1/checkout/sessions/${id}`, {
      headers: { Authorization: `Bearer ${key}` },
    });

    const session = await r.json();
    const valid = session.payment_status === 'paid';
    res.json({ valid, plan: session.metadata?.plan || 'premium' });
  } catch {
    res.status(400).json({ valid: false });
  }
};
