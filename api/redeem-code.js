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

    // Vérifie que l'utilisatrice n'a pas déjà un abonnement actif via code
    const existingRes = await fetch(
      `${sbUrl}/rest/v1/subscriptions?user_id=eq.${user.id}&plan=eq.code&status=eq.active&select=user_id`,
      { headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` } }
    );
    const existing = await existingRes.json();
    if (Array.isArray(existing) && existing.length > 0) {
      return res.json({ valid: true }); // Déjà actif — idempotent
    }

    // Écrit l'abonnement dans Supabase
    const sbWrite = await fetch(`${sbUrl}/rest/v1/subscriptions`, {
      method: 'POST',
      headers: {
        apikey: sbKey,
        Authorization: `Bearer ${sbKey}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify({
        user_id: user.id,
        plan: 'code',
        status: 'active',
        stripe_customer_id: null,
        stripe_subscription_id: null,
        updated_at: new Date().toISOString(),
      }),
    });

    if (!sbWrite.ok) {
      const errText = await sbWrite.text();
      return res.status(500).json({ valid: false, error: 'Erreur base de données : ' + errText });
    }

    res.json({ valid: true });
  } catch (e) {
    res.status(500).json({ valid: false, error: e.message });
  }
};
