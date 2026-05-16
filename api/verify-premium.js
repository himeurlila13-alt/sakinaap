module.exports = async (req, res) => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  // Vérifie le JWT — seule l'utilisatrice peut consulter son propre statut
  const authHeader = req.headers['authorization'] || '';
  const jwt = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!jwt) return res.status(401).json({ isPremium: false, error: 'Non authentifiée' });

  try {
    const userRes = await fetch(`${url}/auth/v1/user`, {
      headers: { apikey: key, Authorization: `Bearer ${jwt}` }
    });
    if (!userRes.ok) return res.status(401).json({ isPremium: false, error: 'Token invalide' });
    const user = await userRes.json();

    const r = await fetch(
      `${url}/rest/v1/subscriptions?user_id=eq.${user.id}&select=status,plan`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } }
    );
    const rows = await r.json();
    const active = Array.isArray(rows) && rows.length > 0 && rows[0].status === 'active';
    res.json({ isPremium: active, plan: active ? rows[0].plan : null });
  } catch (e) {
    res.status(500).json({ isPremium: false, error: e.message });
  }
};
