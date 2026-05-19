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
      `${url}/rest/v1/subscriptions?user_id=eq.${user.id}&select=status,plan,current_period_end&order=updated_at.desc&limit=1`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } }
    );
    const rows = await r.json();
    if (!Array.isArray(rows) || rows.length === 0) return res.json({ isPremium: false, plan: null });
    const sub = rows[0];
    const now = new Date().toISOString();
    // Accès actif OU annulé mais période payée non expirée
    // past_due : paiement échoué mais Stripe relance — accès maintenu pendant la période de grâce
    const active = sub.status === 'active' || sub.status === 'past_due' ||
      (sub.status === 'canceled' && sub.current_period_end && sub.current_period_end > now);
    res.json({ isPremium: active, plan: active ? sub.plan : null });
  } catch (e) {
    res.status(500).json({ isPremium: false, error: e.message });
  }
};
