const ALLOWED_ORIGINS = ['https://sakinaap.com', 'http://localhost:3000'];

module.exports = async (req, res) => {
  const origin = req.headers['origin'];
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    return res.status(403).json({ valid: false, error: 'Origine non autorisée' });
  }

  const { id } = req.query;
  if (!id || !id.startsWith('cs_')) return res.status(400).json({ valid: false });

  // JWT obligatoire — vérifie que la session Stripe appartient à l'utilisatrice connectée
  const authHeader = req.headers['authorization'] || '';
  const jwt = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!jwt) return res.status(401).json({ valid: false, error: 'Non authentifiée' });

  const key   = process.env.STRIPE_SECRET_KEY;
  const sbUrl = process.env.SUPABASE_URL;
  const sbKey = process.env.SUPABASE_SERVICE_KEY;
  if (!key || !sbUrl || !sbKey) return res.status(500).json({ valid: false });

  let verifiedUserId;
  try {
    const userRes = await fetch(`${sbUrl}/auth/v1/user`, {
      headers: { apikey: sbKey, Authorization: `Bearer ${jwt}` }
    });
    if (!userRes.ok) return res.status(401).json({ valid: false, error: 'Token invalide' });
    const userData = await userRes.json();
    verifiedUserId = userData.id;
  } catch {
    return res.status(401).json({ valid: false, error: 'Vérification impossible' });
  }

  try {
    const r = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(id)}`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    const session = await r.json();
    if (!r.ok) return res.status(400).json({ valid: false });

    // Vérification critique : la session doit appartenir à l'utilisatrice connectée
    if (session.metadata?.user_id !== verifiedUserId) {
      return res.status(403).json({ valid: false, error: 'Session non autorisée' });
    }

    const valid = session.payment_status === 'paid';
    res.json({ valid, plan: session.metadata?.plan || 'premium' });
  } catch {
    res.status(400).json({ valid: false });
  }
};
