module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  const { code } = req.body || {};
  if (!code || typeof code !== 'string') return res.json({ valid: false });

  const authHeader = req.headers['authorization'] || '';
  const jwt = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!jwt) return res.status(401).json({ valid: false, error: 'Non authentifiée' });

  const sbUrl = process.env.SUPABASE_URL;
  const sbKey = process.env.SUPABASE_SERVICE_KEY;
  if (!sbUrl || !sbKey) return res.status(500).json({ valid: false });

  try {
    // Vérifie le JWT et récupère l'utilisatrice
    const userRes = await fetch(`${sbUrl}/auth/v1/user`, {
      headers: { apikey: sbKey, Authorization: `Bearer ${jwt}` }
    });
    if (!userRes.ok) return res.status(401).json({ valid: false, error: 'Token invalide' });
    const user = await userRes.json();

    // Valide le code contre les env vars
    const validCodes = (process.env.PREMIUM_CODES || '')
      .split(',').map(c => c.trim().toUpperCase()).filter(Boolean);
    if (!validCodes.includes(code.trim().toUpperCase())) {
      return res.json({ valid: false });
    }

    // Écrit l'abonnement dans Supabase — verifyPremiumFromDB le lira au prochain chargement
    await fetch(`${sbUrl}/rest/v1/subscriptions`, {
      method: 'POST',
      headers: {
        apikey: sbKey,
        Authorization: `Bearer ${sbKey}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        user_id: user.id,
        plan: 'code',
        status: 'active',
        updated_at: new Date().toISOString(),
      }),
    });

    res.json({ valid: true });
  } catch (e) {
    res.status(500).json({ valid: false, error: e.message });
  }
};
