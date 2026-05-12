module.exports = async (req, res) => {
  const { user_id } = req.query;
  if (!user_id) return res.status(400).json({ isPremium: false });

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  try {
    const r = await fetch(
      `${url}/rest/v1/subscriptions?user_id=eq.${user_id}&select=status,plan`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } }
    );
    const rows = await r.json();
    const active = Array.isArray(rows) && rows.length > 0 && rows[0].status === 'active';
    res.json({ isPremium: active, plan: active ? rows[0].plan : null });
  } catch (e) {
    res.status(500).json({ isPremium: false, error: e.message });
  }
};
