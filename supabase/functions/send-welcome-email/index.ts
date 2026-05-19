const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://sakinaap.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // JWT obligatoire — seule l'utilisatrice authentifiée reçoit l'email, à son propre adresse
  const authHeader = req.headers.get('authorization') || '';
  const jwt = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!jwt) {
    return new Response(JSON.stringify({ error: 'Non authentifiée' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const sbUrl = Deno.env.get('SUPABASE_URL');
  const sbKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!sbUrl || !sbKey) {
    return new Response(JSON.stringify({ error: 'Config manquante' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let verifiedEmail: string;
  try {
    const userRes = await fetch(`${sbUrl}/auth/v1/user`, {
      headers: { apikey: sbKey, Authorization: `Bearer ${jwt}` },
    });
    if (!userRes.ok) {
      return new Response(JSON.stringify({ error: 'Token invalide' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const user = await userRes.json();
    verifiedEmail = user.email;
  } catch {
    return new Response(JSON.stringify({ error: 'Vérification impossible' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Seul le prénom est accepté depuis le corps — to/subject/html ignorés
    const body = await req.json().catch(() => ({}));
    const prenom: string = typeof body.prenom === 'string' ? body.prenom.slice(0, 50) : '';

    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (!resendKey) {
      return new Response(JSON.stringify({ error: 'RESEND_API_KEY manquante' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const p = prenom || 'sœur';
    const emailHtml = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Bienvenue dans SakinApp</title></head>
<body style="margin:0;padding:0;background:#FDF8F2;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FDF8F2;">
  <tr><td align="center" style="padding:32px 16px;">
    <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(74,124,89,0.10);">

      <!-- HEADER -->
      <tr><td style="background:#4A7C59;padding:40px 32px 32px;text-align:center;">
        <div style="font-family:Georgia,serif;font-size:36px;font-weight:700;color:#ffffff;letter-spacing:2px;margin-bottom:8px;">SakinApp</div>
        <div style="font-size:22px;color:rgba(255,255,255,0.85);margin-bottom:4px;">بِسْمِ اللَّه</div>
        <div style="font-size:13px;color:rgba(255,255,255,0.65);letter-spacing:3px;text-transform:uppercase;">Bien-être · Cycle · Foi</div>
      </td></tr>

      <!-- SALUTATION -->
      <tr><td style="padding:40px 40px 0;">
        <p style="font-family:Georgia,serif;font-size:26px;color:#2C2018;margin:0 0 8px;">As-salamu alaykum ${p} 🌸</p>
        <p style="font-size:16px;color:#5A4A3A;line-height:1.7;margin:12px 0 0;">
          Bienvenue dans <strong>SakinApp</strong> — ton espace de bien-être cyclique et de foi.<br>
          Tu viens de rejoindre une communauté de sœurs qui ont décidé de mieux se connaître et de prendre soin d'elles avec douceur et bienveillance.
        </p>
      </td></tr>

      <!-- LES 4 SAISONS -->
      <tr><td style="padding:32px 40px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="width:25%;text-align:center;padding:12px 6px;">
              <div style="font-size:28px;margin-bottom:6px;">🌙</div>
              <div style="font-size:12px;font-weight:700;color:#7B5EA7;letter-spacing:1px;">HIVER</div>
            </td>
            <td style="width:25%;text-align:center;padding:12px 6px;">
              <div style="font-size:28px;margin-bottom:6px;">🌿</div>
              <div style="font-size:12px;font-weight:700;color:#3DAE8A;letter-spacing:1px;">PRINTEMPS</div>
            </td>
            <td style="width:25%;text-align:center;padding:12px 6px;">
              <div style="font-size:28px;margin-bottom:6px;">☀️</div>
              <div style="font-size:12px;font-weight:700;color:#E8834A;letter-spacing:1px;">ÉTÉ</div>
            </td>
            <td style="width:25%;text-align:center;padding:12px 6px;">
              <div style="font-size:28px;margin-bottom:6px;">🍂</div>
              <div style="font-size:12px;font-weight:700;color:#C4694A;letter-spacing:1px;">AUTOMNE</div>
            </td>
          </tr>
        </table>
        <p style="font-size:15px;color:#5A4A3A;text-align:center;margin:8px 0 0;line-height:1.6;">
          Ton cycle a 4 saisons. Chaque matin SakinApp t'accompagne selon ta phase, ton énergie et ta foi.
        </p>
      </td></tr>

      <!-- CE QUI T'ATTEND -->
      <tr><td style="padding:28px 40px 0;">
        <div style="background:#F0F7F3;border-radius:14px;padding:24px 28px;">
          <p style="font-family:Georgia,serif;font-size:17px;font-weight:700;color:#4A7C59;margin:0 0 16px;">Chaque jour tu trouveras</p>
          <table width="100%" cellpadding="0" cellspacing="6" border="0">
            <tr><td style="padding:5px 0;font-size:15px;color:#2C2018;">✦ &nbsp;Une séance adaptée à ton énergie</td></tr>
            <tr><td style="padding:5px 0;font-size:15px;color:#2C2018;">✦ &nbsp;Des recettes pour tes hormones</td></tr>
            <tr><td style="padding:5px 0;font-size:15px;color:#2C2018;">✦ &nbsp;Une routine beauté de saison</td></tr>
            <tr><td style="padding:5px 0;font-size:15px;color:#2C2018;">✦ &nbsp;Tes prières et ton dhikr</td></tr>
            <tr><td style="padding:5px 0;font-size:15px;color:#2C2018;">✦ &nbsp;Un message du cœur</td></tr>
          </table>
        </div>
      </td></tr>

      <!-- INSTALLER L'APP -->
      <tr><td style="padding:28px 40px 0;">
        <p style="font-family:Georgia,serif;font-size:17px;font-weight:700;color:#2C2018;margin:0 0 16px;">Comment installer l'app 📱</p>
        <table width="100%" cellpadding="0" cellspacing="12" border="0">
          <tr>
            <td style="width:48%;vertical-align:top;background:#FDF8F2;border-radius:12px;padding:18px 20px;">
              <p style="font-size:14px;font-weight:700;color:#2C2018;margin:0 0 10px;">Sur iPhone (Safari)</p>
              <p style="font-size:13px;color:#5A4A3A;line-height:1.7;margin:0;">
                1. Ouvre sakinaap.com dans Safari<br>
                2. Appuie sur le bouton Partager ⬆️<br>
                3. Choisis « Sur l'écran d'accueil »<br>
                4. Appuie sur « Ajouter »
              </p>
            </td>
            <td style="width:4%;"></td>
            <td style="width:48%;vertical-align:top;background:#FDF8F2;border-radius:12px;padding:18px 20px;">
              <p style="font-size:14px;font-weight:700;color:#2C2018;margin:0 0 10px;">Sur Android (Chrome)</p>
              <p style="font-size:13px;color:#5A4A3A;line-height:1.7;margin:0;">
                1. Ouvre sakinaap.com dans Chrome<br>
                2. Menu ⋮ en haut à droite<br>
                3. « Ajouter à l'écran d'accueil »<br>
                4. Confirmer
              </p>
            </td>
          </tr>
        </table>
      </td></tr>

      <!-- ESSAI GRATUIT -->
      <tr><td style="padding:28px 40px 0;">
        <div style="background:linear-gradient(135deg,#4A7C59,#3DAE8A);border-radius:14px;padding:24px 28px;text-align:center;">
          <p style="font-family:Georgia,serif;font-size:20px;color:#ffffff;margin:0 0 10px;font-weight:700;">Ton essai gratuit · 20 jours</p>
          <p style="font-size:14px;color:rgba(255,255,255,0.88);margin:0 0 18px;line-height:1.6;">
            Sans carte bancaire. Sans engagement.<br>
            Explore toutes les fonctionnalités Premium.
          </p>
          <a href="https://sakinaap.com" style="display:inline-block;background:#ffffff;color:#4A7C59;text-decoration:none;font-size:15px;font-weight:700;padding:13px 32px;border-radius:50px;">Ouvrir SakinApp →</a>
        </div>
        <p style="font-size:13px;color:#5A4A3A;text-align:center;margin:14px 0 0;line-height:1.6;">
          L'onglet Âme — prières, dhikr, 99 noms d'Allah — reste <strong>gratuit pour toujours</strong>.<br>
          Parce que la foi n'a pas de prix. 🤍
        </p>
      </td></tr>

      <!-- MOT DE LA CRÉATRICE -->
      <tr><td style="padding:28px 40px 0;">
        <div style="border-left:3px solid #4A7C59;padding:16px 20px;background:#F8FBF9;border-radius:0 12px 12px 0;">
          <p style="font-family:Georgia,serif;font-size:15px;font-style:italic;color:#2C2018;line-height:1.7;margin:0;">
            « J'ai créé SakinApp pour partager ce que j'avais appris. Simplement. Au plus grand nombre. Pour avancer. Pour aller de l'avant. Pour se sentir bien. »
          </p>
        </div>
      </td></tr>

      <!-- ON EST LÀ -->
      <tr><td style="padding:28px 40px;">
        <div style="background:#FDF8F2;border-radius:14px;padding:20px 24px;text-align:center;">
          <p style="font-size:15px;color:#5A4A3A;margin:0 0 6px;">Une question ? Une suggestion ?</p>
          <p style="font-size:15px;color:#4A7C59;font-weight:700;margin:0;">
            Réponds directement à cet email 🌸<br>
            <a href="mailto:sakina.evolution.contact@gmail.com" style="color:#4A7C59;">sakina.evolution.contact@gmail.com</a>
          </p>
        </div>
      </td></tr>

      <!-- FOOTER -->
      <tr><td style="background:#F0F0EC;padding:20px 32px;text-align:center;border-radius:0 0 20px 20px;">
        <p style="font-size:12px;color:#8A8078;margin:0 0 6px;">© 2026 SakinApp · <a href="https://sakinaap.com" style="color:#4A7C59;text-decoration:none;">sakinaap.com</a></p>
        <p style="font-size:11px;color:#A09088;margin:0;">Données stockées sur ton téléphone · Jamais partagées · RGPD</p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'SakinApp <noreply@sakinaap.com>',
        to: [verifiedEmail],
        subject: `🌸 As-salamu alaykum ${p}, bienvenue dans SakinApp`,
        html: emailHtml,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return new Response(JSON.stringify({ error: err }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
