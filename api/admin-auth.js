module.exports = (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  const { password } = req.body || {};
  const adminPwd = process.env.ADMIN_PASSWORD;
  const adminToken = process.env.ADMIN_TOKEN;
  if (!adminPwd || !adminToken) return res.status(500).json({ error: 'Config manquante' });
  if (password === adminPwd) {
    return res.json({ token: adminToken });
  }
  res.status(401).json({ error: 'Mot de passe incorrect' });
};
