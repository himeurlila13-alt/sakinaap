const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  const { id } = req.query;

  if (!id || !id.startsWith('cs_')) {
    return res.status(400).json({ valid: false });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(id);
    const valid = session.payment_status === 'paid';
    res.json({ valid, plan: session.metadata?.plan || 'premium' });
  } catch {
    res.status(400).json({ valid: false });
  }
};
