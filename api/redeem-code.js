module.exports = (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  const { code } = req.body || {};
  if (!code || typeof code !== 'string') return res.json({ valid: false });

  const validCodes = (process.env.PREMIUM_CODES || '')
    .split(',')
    .map(c => c.trim().toUpperCase())
    .filter(Boolean);

  res.json({ valid: validCodes.includes(code.trim().toUpperCase()) });
};
