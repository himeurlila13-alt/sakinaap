const ALLOWED_ORIGINS = ['https://sakinaap.com', 'http://localhost:3000'];

module.exports = async (req, res) => {
  const origin = req.headers['origin'];
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    return res.status(403).json({ valid: false, error: 'Origine non autorisée' });
  }

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
    const normalizedCode = code.trim().toUpperCase();
    const validCodes = (process.env.PREMIUM_CODES || '')
      .split(',').map(c => c.trim().toUpperCase()).filter(Boolean);
    if (!validCodes.includes(normalizedCode)) {
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

    // Vérifie la limite globale d'utilisations du code
    const usageRes = await fetch(
      `${sbUrl}/rest/v1/redeemed_codes?code=eq.${encodeURIComponent(normalizedCode)}&select=user_id`,
      { headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` } }
    );
    const usage = await usageRes.json();
    const maxUses = parseInt(process.env.PREMIUM_CODE_MAX_USES || '1', 10);
    if (Array.isArray(usage) && usage.length >= maxUses) {
      return res.json({ valid: false, error: 'Code épuisé' });
    }

    // Enregistre l'activation du code
    await fetch(`${sbUrl}/rest/v1/redeemed_codes`, {
      method: 'POST',
      headers: {
        apikey: sbKey,
        Authorization: `Bearer ${sbKey}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=ignore-duplicates,return=minimal',
      },
      body: JSON.stringify({ code: normalizedCode, user_id: user.id }),
    });

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
