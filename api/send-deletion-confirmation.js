module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  const adminToken = process.env.ADMIN_TOKEN;
  if (!adminToken || req.headers['x-admin-token'] !== adminToken) {
    return res.status(401).json({ error: 'Non autorisé' });
  }

  const { email, prenom } = req.body || {};
  if (!email || !email.includes('@')) return res.status(400).json({ error: 'Email invalide' });

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return res.status(500).json({ error: 'RESEND_API_KEY manquante' });

  const p = prenom || 'sœur';
  const date = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

  const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FDF8F2;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FDF8F2;">
  <tr><td align="center" style="padding:32px 16px;">
    <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(74,124,89,0.10);">

      <tr><td style="background:#4A7C59;padding:32px;text-align:center;">
        <div style="font-family:Georgia,serif;font-size:32px;font-weight:700;color:#ffffff;letter-spacing:2px;">SakinApp</div>
        <div style="font-size:13px;color:rgba(255,255,255,0.65);letter-spacing:3px;text-transform:uppercase;margin-top:6px;">Confirmation de suppression</div>
      </td></tr>

      <tr><td style="padding:40px 40px 0;">
        <p style="font-family:Georgia,serif;font-size:22px;color:#2C2018;margin:0 0 16px;">As-salamu alaykum ${p} 🌸</p>
        <p style="font-size:15px;color:#5A4A3A;line-height:1.8;margin:0 0 20px;">
          Nous te confirmons que ta demande de suppression de compte a bien été traitée le <strong>${date}</strong>.
        </p>
        <div style="background:#F0F7F3;border-radius:14px;padding:20px 24px;margin-bottom:20px;">
          <p style="font-size:14px;color:#2C2018;margin:0 0 8px;">✅ &nbsp;Ton compte a été fermé, tu n'as plus accès à ton espace SakinApp</p>
          <p style="font-size:14px;color:#2C2018;margin:0;">✅ &nbsp;Ton adresse e-mail a été supprimée de nos serveurs</p>
        </div>
        <p style="font-size:13px;color:#5A4A3A;line-height:1.8;margin:0 0 20px;background:#FDF8F2;border-radius:12px;padding:14px 18px;">
          ℹ️ Tes données de cycle et de pratique spirituelle n'ont jamais transité par nos serveurs — elles étaient stockées uniquement sur ton téléphone. Elles y restent tant que tu ne désinstalles pas l'application ni n'effaces les données de ton navigateur.
        </p>
        <p style="font-size:14px;color:#5A4A3A;line-height:1.8;margin:0 0 20px;">
          Jazakillah khayran d'avoir utilisé SakinApp. Si tu souhaites revenir un jour, tu seras toujours la bienvenue. 🤍
        </p>
      </td></tr>

      <tr><td style="padding:24px 40px;">
        <div style="background:#FDF8F2;border-radius:14px;padding:16px 20px;text-align:center;">
          <p style="font-size:13px;color:#5A4A3A;margin:0;">Une question ? <a href="mailto:sakina.evolution.contact@gmail.com" style="color:#4A7C59;font-weight:700;">sakina.evolution.contact@gmail.com</a></p>
        </div>
      </td></tr>

      <tr><td style="background:#F0F0EC;padding:18px 32px;text-align:center;border-radius:0 0 20px 20px;">
        <p style="font-size:11px;color:#A09088;margin:0;">© 2026 SakinApp · <a href="https://sakinaap.com" style="color:#4A7C59;text-decoration:none;">sakinaap.com</a></p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'SakinApp <noreply@sakinaap.com>',
        to: [email],
        subject: '✅ Ton compte SakinApp a été supprimé',
        html,
      }),
    });
    if (!r.ok) {
      const err = await r.text();
      return res.status(500).json({ error: err });
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
