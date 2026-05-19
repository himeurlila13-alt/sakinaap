const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://sakinaap.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // JWT obligatoire — seule l'utilisatrice authentifiée peut déclencher la notification
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
  let verifiedUserId: string;
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
    verifiedUserId = user.id;
  } catch {
    return new Response(JSON.stringify({ error: 'Vérification impossible' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (!resendKey) {
      return new Response(JSON.stringify({ error: 'RESEND_API_KEY manquante' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const date = new Date().toISOString();

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'SakinApp <noreply@sakinaap.com>',
        to: ['sakina.evolution.contact@gmail.com'],
        subject: 'Demande suppression compte SakinApp',
        html: `
          <h2>Demande de suppression de compte</h2>
          <p>Une utilisatrice demande la suppression de son compte.</p>
          <table>
            <tr><td><b>Email :</b></td><td>${verifiedEmail || 'non renseigné'}</td></tr>
            <tr><td><b>User ID :</b></td><td>${verifiedUserId || 'non connectée'}</td></tr>
            <tr><td><b>Date :</b></td><td>${date}</td></tr>
          </table>
        `,
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
