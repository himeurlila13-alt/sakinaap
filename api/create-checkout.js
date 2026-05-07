const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const PRICES = {
  monthly: process.env.STRIPE_PRICE_MONTHLY,
  annual:  process.env.STRIPE_PRICE_ANNUAL,
};

module.exports = async (req, res) => {
  const { plan } = req.query;

  if (!PRICES[plan]) {
    return res.status(400).json({ error: 'Plan invalide' });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      locale: 'fr',
      line_items: [{ price: PRICES[plan], quantity: 1 }],
      success_url: `https://sakinaap.com/?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `https://sakinaap.com/`,
      metadata: { plan },
    });

    res.json({ url: session.url });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
