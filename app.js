function _esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// ═══════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════
let ST = {
  prenom: '',
  cycleStart: null,
  cycleDuration: 28,
  dureeRegles: null, // durée habituelle des règles déclarée par l'utilisatrice (jours) — null = non déclarée, fallback proportionnel dans phaseThresholds()
  checkin: null,
  checkinDate: null,
  prayers: {},
  // DHIKR → cases à cocher (true/false par jour)
  dhikrChecks: {},    // { 'date': { subhan: bool, alhamdu: bool, akbar: bool, istighfar: bool } }
  dhikrDate: null,
  coranDone: {},      // { 'date': bool }
  asmaKnown: [],
  glaire: null,
  glaireDate: null,
  symptomes: {},      // { 'date': ['fatigue','crampes',...] }
  autreSymptomesText: {}, // { 'date': 'texte libre' }
  currentSaison: 'printemps',
  currentDay: 1,
  selectedSugg: [],
  notifFreq: 2,
  feedbackSent: false,
  installBannerDismissed: false,
  lastDailyReset: null,
  lastWeeklyReset: null,
  eveningCheckinDate: null,
  eveningCheckinMood: null,
  cycleHistory: [],
  historiqueCycles: [],
  _lastCycleNum: null,
  weeklyObjChecks: {},
  customObjectifs: [],
  customObjChecks: {},
  marche: { phase: null, checks: {}, custom: [] },
  calmeOverride: null,
  _lastSaison: null,
  hiverEnd: null,
  supabaseUserId: null,
  supabaseEmail: null,
  isAuthenticated: false,
  userEmail: null,
  authDate: null,
  welcomeEmailSent: false,
  manualSignOut: false,
  consentDate: null,
  consentVersion: null,
  lastObjResetDate: null,
  lecturesLues: [],
};

// ═══════════════════════════════════════════════
// PWA INSTALLATION LOGIC
// ═══════════════════════════════════════════════
let _pwaPrompt = null;

function _pwaDetectBrowser() {
  const ua = navigator.userAgent;
  const isIos = /iPhone|iPad|iPod/.test(ua);
  const isAndroid = /Android/.test(ua);
  const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua);
  const isChrome = /CriOS|Chrome/.test(ua);
  const isStandalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches ||
                       window.navigator.standalone === true;

  let type = 'other';
  let canNativeInstall = false;

  if (isIos && isSafari) {
    type = 'ios-safari';
  } else if (isIos && isChrome) {
    type = 'ios-chrome';
  } else if (isAndroid && isChrome) {
    type = 'android-chrome';
    canNativeInstall = !!_pwaPrompt;
  } else if (isAndroid) {
    type = 'android-other';
  } else if (!isIos && !isAndroid) {
    type = 'desktop';
  }

  return {
    type,
    canNativeInstall,
    isIos,
    isAndroid,
    isSafari,
    isChrome,
    isStandalone
  };
}

function openPwaGuide(browserType) {
  const modal = document.getElementById('pwa-guide-modal');
  const overlay = document.getElementById('pwa-overlay');
  if (!modal) return;
  modal.setAttribute('data-browser', browserType || _pwaDetectBrowser().type);
  modal.classList.add('open');
  if (overlay) overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closePwaGuide() {
  const modal = document.getElementById('pwa-guide-modal');
  const overlay = document.getElementById('pwa-overlay');
  if (modal) modal.classList.remove('open');
  if (overlay) overlay.classList.remove('open');
  document.body.style.overflow = '';
  localStorage.setItem('pwa_dismissed_at', Date.now().toString());
}

function triggerPwaInstall() {
  if (!_pwaPrompt) return;

  _pwaPrompt.prompt();
  _pwaPrompt.userChoice.then((choiceResult) => {
    if (choiceResult.outcome === 'accepted') {
      localStorage.setItem('pwa_installed', '1');
      _pwaHideAll();
    }
    _pwaPrompt = null;
  });
}

function _pwaShowInstallHint() {
  const banner = document.getElementById('pwa-install-banner');
  if (!banner) return;

  const browser = _pwaDetectBrowser();
  if (browser.isStandalone) return;
  if (localStorage.getItem('pwa_installed') === '1') return;

  const dismissedAt = localStorage.getItem('pwa_dismissed_at');
  if (dismissedAt) {
    const daysSince = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24);
    if (daysSince < 7) return;
  }

  banner.style.display = 'flex';
}

function _pwaHideAll() {
  const banner = document.getElementById('pwa-install-banner');
  const modal = document.getElementById('pwa-guide-modal');
  if (banner) banner.style.display = 'none';
  if (modal) modal.classList.remove('open');
}

function _pwaInit() {
  // Compter les lancements de l'app (pas les vues de landing)
  const isAppPage = window.location.pathname === '/' || window.location.pathname === '/index.html';
  if (isAppPage) {
    const currentCount = parseInt(localStorage.getItem('pwa_launch_count') || '0');
    localStorage.setItem('pwa_launch_count', (currentCount + 1).toString());

    // Afficher la bannière au 2ème lancement dans l'onglet Moi
    if (currentCount >= 1) {
      setTimeout(_pwaShowInstallHintInApp, 2000);
    }
  }
}

function _pwaShowInstallHintInApp() {
  // Uniquement si on est dans l'onglet Moi et pas encore installé
  const currentTab = document.querySelector('.nav-item.active');
  const browser = _pwaDetectBrowser();

  if (!browser.isStandalone &&
      localStorage.getItem('pwa_installed') !== '1' &&
      currentTab && currentTab.id === 'nav-moi') {
    _pwaShowInstallHint();
  }
}

function _renderPwaInstallButton() {
  const browser = _pwaDetectBrowser();

  // Ne pas afficher si déjà en mode standalone ou déjà installé
  if (browser.isStandalone || localStorage.getItem('pwa_installed') === '1') {
    return;
  }

  // Chercher où insérer le bouton (après ps-auth-row)
  const authRow = document.getElementById('ps-auth-row');
  if (!authRow) return;

  const existingButton = document.getElementById('ps-pwa-row');
  if (existingButton) existingButton.remove();

  const pwaRow = document.createElement('div');
  pwaRow.id = 'ps-pwa-row';
  pwaRow.className = 'ps-row';
  pwaRow.style.cursor = 'pointer';

  let buttonText = 'Installer l\'app';
  let subText = 'Accès rapide depuis ton écran d\'accueil';
  let onClick = () => openPwaGuide(browser.type);

  // Sur Android Chrome, installation directe possible
  if (browser.type === 'android-chrome' && _pwaPrompt) {
    onClick = triggerPwaInstall;
  }

  pwaRow.innerHTML = `
    <div class="ps-ico">📱</div>
    <div>
      <div class="ps-lbl">${buttonText}</div>
      <div class="ps-sub">${subText}</div>
    </div>
    <div class="ps-arr">⚡</div>
  `;

  pwaRow.onclick = onClick;

  // Insérer après la ligne d'authentification
  authRow.parentNode.insertBefore(pwaRow, authRow.nextSibling);
}

// ═══════════════════════════════════════════════

function saveState() {
  // Ne jamais sauvegarder currentSaison/currentDay — recalculés a chaque lancement
  // Ne jamais persister manualSignOut — flag mémoire uniquement
  const toSave = {...ST};
  delete toSave.currentSaison;
  delete toSave.currentDay;
  delete toSave.manualSignOut;
  try { localStorage.setItem('sakinapp_v1', JSON.stringify(toSave)); } catch(e) {
    if (e && e.name === 'QuotaExceededError') showToast('Stockage presque plein — exporte tes données dans Paramètres.');
  }
  syncToSupabase();
}
function loadState() {
  try {
    const saved = localStorage.getItem('sakinapp_v1');
    if (saved) {
      const parsed = JSON.parse(saved);
      delete parsed.currentSaison;
      delete parsed.currentDay;
      delete parsed.manualSignOut; // jamais restaurer ce flag — mémoire uniquement
      ST = {...ST, ...parsed};
    }
  } catch(e) {}
  ST.manualSignOut = false; // garantir la valeur initiale après chargement
}

function checkDailyObjReset() {
  // Remise à zéro des coches chaque matin au premier lancement
  const todayStr = new Date().toISOString().slice(0, 10);
  if (ST.lastObjResetDate !== todayStr) {
    ST.lastObjResetDate = todayStr;
    // Reset visuel : vider les checks du jour actuel dans weeklyObjChecks et customObjChecks
    const weekKey = _getWeekKey();
    if (ST.weeklyObjChecks && ST.weeklyObjChecks[weekKey]) {
      // Pour chaque objectif, supprimer la date d'aujourd'hui des checks
      Object.keys(ST.weeklyObjChecks[weekKey]).forEach(objId => {
        const arr = ST.weeklyObjChecks[weekKey][objId];
        if (arr && Array.isArray(arr)) {
          const idx = arr.indexOf(todayStr);
          if (idx > -1) arr.splice(idx, 1);
        }
      });
    }
    if (ST.customObjChecks && ST.customObjChecks[weekKey]) {
      // Idem pour les objectifs perso
      Object.keys(ST.customObjChecks[weekKey]).forEach(objIdx => {
        const arr = ST.customObjChecks[weekKey][objIdx];
        if (arr && Array.isArray(arr)) {
          const idx = arr.indexOf(todayStr);
          if (idx > -1) arr.splice(idx, 1);
        }
      });
    }
    // NE PAS toucher à ST.objHistory — il conserve l'historique
    saveState();
  }
}

// ═══════════════════════════════════════════════
// SUPABASE AUTH
// ═══════════════════════════════════════════════
let _supabase = null;
let _supabaseLoading = null;
async function initSupabase() {
  if (_supabase) return _supabase;
  if (_supabaseLoading) return _supabaseLoading;
  _supabaseLoading = (async () => {
    try {
      const cfg = await fetch('/api/public-config').then(r => r.json());
      if (cfg.supabaseUrl && cfg.supabaseAnonKey) {
        _supabase = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
      }
    } catch(e) {}
    _supabaseLoading = null;
    return _supabase;
  })();
  return _supabaseLoading;
}

// ═══════════════════════════════════════════════
// EMAIL DE BIENVENUE
// ═══════════════════════════════════════════════
function _buildWelcomeEmailHtml(prenom, email) {
  const p = prenom || 'sœur';
  return `<!DOCTYPE html>
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
              <div style="font-size:12px;font-weight:700;color:#FF8A65;letter-spacing:1px;">ÉTÉ</div>
            </td>
            <td style="width:25%;text-align:center;padding:12px 6px;">
              <div style="font-size:28px;margin-bottom:6px;">🍂</div>
              <div style="font-size:12px;font-weight:700;color:#C82B4A;letter-spacing:1px;">AUTOMNE</div>
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
            <tr><td style="padding:5px 0;font-size:15px;color:#2C2018;">✦ &nbsp;Un conseil mouvement adapté à ton énergie</td></tr>
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
                3. Choisis «&nbsp;Sur l'écran d'accueil&nbsp;»<br>
                4. Appuie sur «&nbsp;Ajouter&nbsp;»
              </p>
            </td>
            <td style="width:4%;"></td>
            <td style="width:48%;vertical-align:top;background:#FDF8F2;border-radius:12px;padding:18px 20px;">
              <p style="font-size:14px;font-weight:700;color:#2C2018;margin:0 0 10px;">Sur Android (Chrome)</p>
              <p style="font-size:13px;color:#5A4A3A;line-height:1.7;margin:0;">
                1. Ouvre sakinaap.com dans Chrome<br>
                2. Menu ⋮ en haut à droite<br>
                3. «&nbsp;Ajouter à l'écran d'accueil&nbsp;»<br>
                4. Confirmer
              </p>
            </td>
          </tr>
        </table>
      </td></tr>

      <!-- APP GRATUITE -->
      <tr><td style="padding:28px 40px 0;">
        <div style="background:linear-gradient(135deg,#4A7C59,#3DAE8A);border-radius:14px;padding:24px 28px;text-align:center;">
          <p style="font-family:Georgia,serif;font-size:20px;color:#ffffff;margin:0 0 10px;font-weight:700;">SakinApp est gratuite</p>
          <p style="font-size:14px;color:rgba(255,255,255,0.88);margin:0 0 18px;line-height:1.6;">
            Sans carte bancaire. Sans engagement.<br>
            Toutes les fonctionnalités t'accompagnent dès aujourd'hui.
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
            «&nbsp;Quand j'ai découvert la beauté de mon cycle, j'ai voulu que chaque sœur puisse vivre cette même révélation. Comprendre son corps, c'est se reconnecter à sa force. C'est un cadeau que nous méritons toutes, insha'Allah.&nbsp;»
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
        <p style="font-size:11px;color:#A09088;margin:0 0 6px;">Tes données sont chiffrées · Jamais vendues · Protection RGPD</p>
        <p style="font-size:11px;color:#A09088;margin:0;"><a href="https://sakinaap.com/unsubscribe?email=${encodeURIComponent(email || '')}" style="color:#A09088;">Se désabonner des emails</a></p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

async function _doSendWelcomeEmail() {
  const email = ST.userEmail || ST.supabaseEmail;
  if (!email) return;
  const prenom = ST.prenom || 'sœur';
  const subject = '🌸 As-salamu alaykum ' + prenom + ', bienvenue dans SakinApp';
  try {
    const sb = await initSupabase();
    if (!sb) throw new Error('supabase not ready');
    await sb.functions.invoke('send-welcome-email', {
      body: { to: email, prenom, subject, html: _buildWelcomeEmailHtml(prenom, email) }
    });
    ST.welcomeEmailSent = true;
    saveState();
  } catch(e) {
    console.error('[welcome email]', e);
  }
}

async function sendWelcomeEmail() {
  if (ST.welcomeEmailSent) return;
  // Première tentative
  await _doSendWelcomeEmail();
  // Si toujours pas envoyé, réessayer une fois après 30s
  if (!ST.welcomeEmailSent) {
    setTimeout(async () => {
      if (!ST.welcomeEmailSent) await _doSendWelcomeEmail();
    }, 30000);
  }
}

// Cookies partagés Safari ↔ PWA iOS (localStorage est isolé sur iOS PWA)
const _COOKIE_MAX = 365 * 24 * 3600;
function setAuthCookie(email) {
  document.cookie = `sakina_auth=1; path=/; max-age=${_COOKIE_MAX}; SameSite=Strict; Secure`;
  if (email) document.cookie = `sakina_email=${encodeURIComponent(email)}; path=/; max-age=${_COOKIE_MAX}; SameSite=Strict; Secure`;
}
function clearAuthCookie() {
  document.cookie = 'sakina_auth=; path=/; max-age=0; SameSite=Strict';
  document.cookie = 'sakina_email=; path=/; max-age=0; SameSite=Strict';
}
function _getCookie(name) {
  const m = document.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'));
  return m ? m[1] : null;
}

function _fadeIn(el) {
  if (!el) return;
  el.classList.remove('screen-enter');
  void el.offsetWidth; // force reflow
  el.classList.add('screen-enter');
}

function _hideLoader() {
  const loader = document.getElementById('app-loader');
  if (loader) loader.classList.add('hidden');
}

function showAuthScreen(cas) {
  // cas 2 : a un prenom mais session expirée
  // cas 3 (défaut) : nouvelle utilisatrice
  const isReturning = cas === 2 || (!cas && ST.prenom && ST.cycleStart);
  const isPwa = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
  const hasEmail = !!(ST.userEmail || ST.supabaseEmail || _getCookie('sakina_email'));
  const isPwaFirstOpen = isPwa && hasEmail && !ST.prenom;

  const title = document.querySelector('#auth-screen [data-auth-title]');
  const sub   = document.querySelector('#auth-screen [data-auth-sub]');
  const emailEl = document.getElementById('auth-email');

  if (title) {
    title.textContent = isReturning
      ? 'Bon retour ' + (ST.prenom || '') + ' 🌸'
      : 'As-salamu alaykum 🌸';
  }
  if (sub) {
    if (isPwaFirstOpen) {
      sub.textContent = 'Une dernière étape pour retrouver ton espace — entre ton email, tu recevras un code. C\'est la seule fois. 🌸';
    } else {
      sub.textContent = isReturning
        ? 'Entre ton email pour te reconnecter.'
        : 'Entre ton adresse email pour accéder à ton espace SakinApp.';
    }
  }
  const savedEmail = ST.userEmail || ST.supabaseEmail || decodeURIComponent(_getCookie('sakina_email') || '');
  if (emailEl && (isReturning || isPwaFirstOpen) && savedEmail) {
    emailEl.value = savedEmail;
  }

  const screen = document.getElementById('auth-screen');
  screen.style.display = 'flex';
  _fadeIn(screen);
  document.getElementById('onboarding').style.display = 'none';
  document.getElementById('app').style.display = 'none';

  // Restaurer l'étape OTP si l'utilisatrice revient après avoir quitté pour consulter ses mails
  const pendingEmail = sessionStorage.getItem('sakina_otp_email');
  if (pendingEmail) {
    const emailEl = document.getElementById('auth-email');
    if (emailEl) emailEl.value = pendingEmail;
    document.getElementById('auth-step1').style.display = 'none';
    document.getElementById('auth-step2').style.display = 'block';
    document.getElementById('auth-howto').style.display = 'none';
    document.getElementById('auth-steps').style.display = 'none';
  }
}

function _showReconnectNudge() {
  const el = document.getElementById('reconnect-nudge');
  if (!el || ST.supabaseUserId) return;
  el.style.display = 'flex';
}

function dismissReconnectNudge() {
  const el = document.getElementById('reconnect-nudge');
  if (el) el.style.display = 'none';
}

function toggleAccordion(id) {
  const body = document.getElementById(id);
  const key = id.replace('acc-', 'arr-');
  const arrow = document.getElementById(key);
  if (!body) return;
  const isOpen = body.classList.toggle('open');
  if (arrow) arrow.style.transform = isOpen ? 'rotate(90deg)' : 'rotate(0deg)';
}

function openReconnectFromNudge() {
  dismissReconnectNudge();
  document.getElementById('reconnect-modal')?.classList.add('open');
}

async function handleReconnect() {
  const email = document.getElementById('reconnect-email')?.value.trim();
  if (!email || !email.includes('@')) { showToast('Entre une adresse email valide.'); return; }
  const btn = document.getElementById('reconnect-send-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Envoi…'; }
  try {
    const sb = await initSupabase();
    const { error } = await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
    if (error) throw error;
    document.getElementById('reconnect-step1').style.display = 'none';
    document.getElementById('reconnect-step2').style.display = 'block';
    const msg = document.getElementById('reconnect-msg');
    if (msg) msg.style.display = 'none';
  } catch(e) {
    if (btn) { btn.disabled = false; btn.textContent = 'Recevoir mon code 🌸'; }
    const msg = document.getElementById('reconnect-msg');
    const errMsg = (e.message || '').toLowerCase().includes('signup')
      ? 'Une erreur est survenue. Réessaie dans quelques instants.'
      : 'Erreur : ' + (e.message || 'Réessaie.');
    if (msg) { msg.style.display = 'block'; msg.textContent = errMsg; msg.style.color = '#C4694A'; msg.style.background = 'rgba(196,105,74,0.08)'; }
  }
}

async function verifyReconnectCode() {
  const email = document.getElementById('reconnect-email')?.value.trim();
  const code = document.getElementById('reconnect-otp')?.value.trim().replace(/\s/g, '');
  const msg = document.getElementById('reconnect-msg');
  if (!code || code.length < 8) {
    if (msg) { msg.style.display = 'block'; msg.textContent = 'Entre le code complet.'; msg.style.color = '#C4694A'; msg.style.background = 'rgba(196,105,74,0.08)'; }
    return;
  }
  const btn = document.getElementById('reconnect-verify-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Vérification…'; }
  try {
    const sb = await initSupabase();
    const { error } = await sb.auth.verifyOtp({ email, token: code, type: 'email' });
    if (error) throw error;
    if (msg) { msg.style.display = 'block'; msg.textContent = '✅ Reconnectée ! Tes données sont synchronisées.'; msg.style.color = '#3DAE8A'; msg.style.background = '#F0FAF6'; }
    setTimeout(() => document.getElementById('reconnect-modal')?.classList.remove('open'), 2000);
  } catch(e) {
    if (btn) { btn.disabled = false; btn.textContent = 'Valider ✓'; }
    if (msg) { msg.style.display = 'block'; msg.textContent = 'Code incorrect ou expiré — demande un nouveau code.'; msg.style.color = '#C4694A'; msg.style.background = 'rgba(196,105,74,0.08)'; }
  }
}

function resetReconnectStep() {
  document.getElementById('reconnect-step1').style.display = 'block';
  document.getElementById('reconnect-step2').style.display = 'none';
  const btn = document.getElementById('reconnect-send-btn');
  if (btn) { btn.disabled = false; btn.textContent = 'Recevoir mon code 🌸'; }
  const msg = document.getElementById('reconnect-msg');
  if (msg) msg.style.display = 'none';
}

async function handleMagicLink() {
  const email = document.getElementById('auth-email').value.trim();
  if (!email || !email.includes('@')) { showAuthMsg('Entre une adresse email valide.', 'error'); return; }
  const btn = document.getElementById('auth-magic-btn');
  btn.disabled = true;
  btn.textContent = 'Envoi en cours…';
  try {
    const sb = await initSupabase();
    if (!sb) throw new Error('Connexion au serveur impossible. Vérifie ta connexion internet et réessaie.');
    const { error } = await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
    if (error) throw error;
    sessionStorage.setItem('sakina_otp_email', email);
    document.getElementById('auth-step1').style.display = 'none';
    document.getElementById('auth-step2').style.display = 'block';
    document.getElementById('auth-howto').style.display = 'none';
    document.getElementById('auth-steps').style.display = 'none';
    document.getElementById('auth-msg').style.display = 'none';
  } catch(e) {
    showAuthMsg('Erreur : ' + (e.message || 'Réessaie dans quelques instants.'), 'error');
    btn.disabled = false;
    btn.textContent = 'Recevoir mon code 🌸';
  }
}

async function verifyAuthCode() {
  const email = document.getElementById('auth-email').value.trim();
  const code = document.getElementById('auth-otp-input').value.trim().replace(/\s/g, '');
  if (!code || code.length < 8) { showAuthMsg('Entre le code complet.', 'error'); return; }
  const btn = document.getElementById('auth-verify-btn');
  btn.disabled = true;
  btn.textContent = 'Vérification…';
  try {
    const sb = await initSupabase();
    if (!sb) throw new Error('Connexion au serveur impossible. Rafraîchis la page et réessaie.');
    const { error } = await sb.auth.verifyOtp({ email, token: code, type: 'email' });
    if (error) throw error;
    sessionStorage.removeItem('sakina_otp_email');
    ST.isAuthenticated = true;
    ST.userEmail = email;
    ST.authDate = Date.now();
    setAuthCookie(email);
    saveState();
    showAuthMsg('✅ Connectée !', 'success');
  } catch(e) {
    btn.disabled = false;
    btn.textContent = 'Valider le code ✓';
    showAuthMsg('Code incorrect ou expiré — réessaie ou demande un nouveau code.', 'error');
  }
}

function resetAuthStep() {
  sessionStorage.removeItem('sakina_otp_email');
  document.getElementById('auth-step1').style.display = 'block';
  document.getElementById('auth-step2').style.display = 'none';
  document.getElementById('auth-howto').style.display = 'flex';
  document.getElementById('auth-steps').style.display = 'flex';
  const btn = document.getElementById('auth-magic-btn');
  if (btn) { btn.disabled = false; btn.textContent = 'Recevoir mon code 🌸'; }
  document.getElementById('auth-msg').style.display = 'none';
}

function showAuthMsg(msg, type) {
  const el = document.getElementById('auth-msg');
  if (!el) return;
  el.style.display = 'block';
  el.textContent = msg;
  el.style.color = type === 'error' ? '#c0392b' : '#7B5EA7';
  el.style.background = type === 'error' ? 'rgba(192,57,43,0.08)' : 'rgba(123,94,167,0.08)';
}

function setupAuthListener(sb) {
  sb.auth.onAuthStateChange(async (event, session) => {
    if (ST.manualSignOut) return;
    if (event === 'SIGNED_IN' && session) {
      ST.supabaseUserId = session.user.id;
      ST.supabaseEmail = session.user.email;
      ST.isAuthenticated = true;
      ST.userEmail = ST.userEmail || session.user.email;
      setAuthCookie(ST.userEmail);
      document.getElementById('auth-screen').style.display = 'none';
      await loadFromSupabase(sb, session.user.id);
      ST.isAuthenticated = true;
      checkDailyReset();
      checkWeeklyReset();
      if (ST.prenom && ST.cycleStart) {
        document.getElementById('onboarding').style.display = 'none';
        const _appEl = document.getElementById('app');
        _appEl.style.display = 'flex';
        _fadeIn(_appEl);
        initApp();
        sendWelcomeEmail();
      } else {
        const _obEl = document.getElementById('onboarding');
        _obEl.style.display = 'block';
        _fadeIn(_obEl);
      }
    } else if (event === 'SIGNED_OUT') {
      if (!ST.isAuthenticated) showAuthScreen();
    }
  });
}

async function loadFromSupabase(sb, userId) {
  try {
    const { data } = await sb.from('user_data').select('data').eq('user_id', userId).single();
    if (!data || !data.data) return;
    const remote = data.data;
    delete remote.currentSaison;
    delete remote.currentDay;
    delete remote.isAuthenticated;
    delete remote.userEmail;
    delete remote.authDate;

    if (!ST.prenom || !ST.cycleStart) {
      // Réinstallation ou premier appareil : Supabase fait foi
      ST = { ...ST, ...remote };
    } else {
      // Les deux ont des données → fusionner en gardant l'historique le plus riche
      ST = {
        ...remote,
        ...ST,
        // Historiques : garder le plus long
        cycleHistory: ((remote.cycleHistory?.length || 0) > (ST.cycleHistory?.length || 0)
          ? remote.cycleHistory : ST.cycleHistory) || [],
        historiqueCycles: ((remote.historiqueCycles?.length || 0) > (ST.historiqueCycles?.length || 0)
          ? remote.historiqueCycles : ST.historiqueCycles) || [],
        // Données vitales du cycle : Supabase si local absent
        cycleStart: ST.cycleStart || remote.cycleStart,
        cycleDuration: ST.cycleDuration || remote.cycleDuration || 28,
        prenom: ST.prenom || remote.prenom,
      };
    }
    saveState();
  } catch(e) {}
}

let _syncTimer = null;
async function _doSyncToSupabase() {
  if (!ST.supabaseUserId || !_supabase) return;
  try {
    const toSave = { ...ST };
    delete toSave.currentSaison;
    delete toSave.currentDay;
    await _supabase.from('user_data').upsert({
      user_id: ST.supabaseUserId,
      data: toSave,
      updated_at: new Date().toISOString(),
    });
  } catch(e) {}
}
function syncToSupabase() {
  if (!ST.supabaseUserId || !_supabase) return;
  clearTimeout(_syncTimer);
  _syncTimer = setTimeout(_doSyncToSupabase, 800);
}

// ═══════════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════════

/* ── SYMPTÔMES par phase ── */
const SYMPTOMES_PAR_PHASE = {
  hiver: [
    { id: 'crampes',    emoji: '🌀', label: 'Crampes' },
    { id: 'fatigue',    emoji: '😴', label: 'Fatigue' },
    { id: 'saignement', emoji: '🩸', label: 'Flux (intensité)' },
    { id: 'dos',        emoji: '🦴', label: 'Douleur dos' },
    { id: 'tete',       emoji: '🤕', label: 'Maux de tête' },
    { id: 'humeur',     emoji: '🌊', label: 'Sautes d\'humeur' },
    { id: 'nausee',     emoji: '🤢', label: 'Nausées' },
    { id: 'aucun',      emoji: '✨', label: 'Pas de douleur' },
  ],
  printemps: [
    { id: 'energie',    emoji: '⚡', label: 'Énergie' },
    { id: 'bonne_humeur', emoji: '🌸', label: 'Bonne humeur' },
    { id: 'peau_eclat', emoji: '✨', label: 'Peau lumineuse' },
    { id: 'libido',     emoji: '💛', label: 'Désir présent' },
    { id: 'creux',      emoji: '😶', label: 'Légère baisse' },
    { id: 'seche',      emoji: '💧', label: 'Peau sèche' },
    { id: 'anxiete',    emoji: '😟', label: 'Anxiété' },
    { id: 'sommeil',    emoji: '🌙', label: 'Trouble sommeil' },
  ],
  ete: [
    { id: 'energie_max',emoji: '☀️', label: 'Énergie max' },
    { id: 'confiance',  emoji: '💪', label: 'Confiance' },
    { id: 'chaleur',    emoji: '🌡️', label: 'Chaleur corporelle' },
    { id: 'douleur_ovul', emoji: '🎯', label: 'Douleur ovulation' },
    { id: 'tete',       emoji: '🤕', label: 'Maux de tête' },
    { id: 'seins',      emoji: '🌷', label: 'Seins sensibles' },
    { id: 'mucus_pic',  emoji: '💧', label: 'Pic de mucus' },
    { id: 'acne',       emoji: '🔴', label: 'Acné légère' },
  ],
  automne: [
    { id: 'irritable',  emoji: '😤', label: 'Irritabilité' },
    { id: 'ballonnements', emoji: '🎈', label: 'Ballonnements' },
    { id: 'envies',     emoji: '🍫', label: 'Envies sucrées' },
    { id: 'seins_sensibles', emoji: '🌷', label: 'Seins sensibles' },
    { id: 'spm',        emoji: '🌊', label: 'SPM intense' },
    { id: 'fatigue',    emoji: '😴', label: 'Fatigue' },
    { id: 'insomnie',   emoji: '🌙', label: 'Insomnie' },
    { id: 'calme',      emoji: '✨', label: 'Je me sens bien' },
  ],
};

/* ── DHIKR cases à cocher ── */
const DHIKR_CHECKS = [
  { id: 'subhan',     arabic: 'سُبْحَانَ اللَّهِ',  fr: 'SubhanAllah · Gloire à Allah',          count: '33×' },
  { id: 'alhamdu',    arabic: 'اَلْحَمْدُ لِلَّهِ', fr: 'Alhamdulillah · Louange à Allah',        count: '33×' },
  { id: 'akbar',      arabic: 'اللَّهُ أَكْبَرُ',    fr: 'Allahu Akbar · Allah est le Plus Grand', count: '34×' },
  { id: 'istighfar',  arabic: 'أَسْتَغْفِرُ اللَّهَ', fr: 'Astaghfirullah · Je demande pardon à Allah', count: '100×', verse: '« Demandez pardon à votre Seigneur, puis revenez à Lui — Il vous enverra une pluie abondante du ciel et vous accordera force et enfants. » — Coran 71:10-11' },
];

const SAISONS = {
  hiver: {
    nom: 'Hiver', foodTeaser: 'Bouillons chauds, épices, fer', skinTeaser: 'Hydratation intense & réparation', emoji: '🌙', phase: 'Phase menstruelle',
    color: '#7B5EA7', light: '#B89FD4', soft: '#F0EBF8', dark: '#3D2060', rgb: '123,94,167',
    grad: 'linear-gradient(145deg, #3D2060, #7B5EA7)',
    messages: {
      bien: "Tu vas bien en Hiver — c'est précieux. Repose-toi vraiment, sans culpabilité. Ton corps travaille même quand tu ne le sens pas.",
      fatiguee: "Tu n'es pas paresseuse. Ton corps est en mode économie d'énergie — c'est biologique. Faire peu aujourd'hui, c'est déjà beaucoup.",
      difficile: "Merci de l'avoir dit. Tu n'as pas à aller bien tout le temps. Aujourd'hui, une chose douce suffit — pour toi.",
      foi: "Les hormones influencent ton état intérieur — c'est physiologique, pas de l'hypocrisie. Un seul dhikr aujourd'hui, c'est déjà immense.",
      calme: "Ton corps te demande du calme — c'est une sagesse, pas une faiblesse. Tisane, silence, douceur. Allah est avec toi dans ce repos."
    },
    suggestions: ['🌿 Étirements doux','😴 Repos — c\'est ton entraînement','📖 Tafsir ou livres islamiques','🤲 Dhikr doux','🫖 Tisane chaude'],
    invocation: { arabic:'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ', fr:'"Allah nous suffit, et Il est le meilleur garant."', source:'Coran 3:173' },
    suggTitle: '🌙 Suggestions de l\'Hiver',
    suggDesc: 'Douce, intentionnelle, sans pression.',
    alimentation: {
      nutriments: [
        {nom:'🩸 Fer', why:'Compense les pertes menstruelles'},
        {nom:'💊 Magnésium', why:'Réduit crampes et tensions'},
        {nom:'🫀 Oméga-3', why:'Anti-inflammatoire naturel'},
        {nom:'🌡️ Vitamine C', why:'Améliore l\'absorption du fer'},
      ],
      aliments: ['Lentilles','Épinards','Dattes','Chocolat noir 70%+','Amandes','Sardines','Betterave','Gingembre','Curcuma'],
      star: ['Lentilles','Épinards','Dattes'],
      eviter: ['Café en excès','Sel en excès','Sucre raffiné'],
    },
    skincare: {
      whatHappens: 'Les hormones sont au plus bas — ta peau est plus sèche, plus sensible et la barrière cutanée est affaiblie.',
      actifs: [
        {nom:'🌹 Huile de rose musquée', why:'Régénérante, nourrit la barrière cutanée', usage:'Quelques gouttes le soir'},
        {nom:'🍯 Miel brut', why:'Antibactérien, hydratant', usage:'Masque 10 min, 2×/semaine'},
        {nom:'🌿 Aloé vera', why:'Apaisant, anti-inflammatoire', usage:'Gel pur après nettoyage'},
      ],
      gestes: ['Nettoyage très doux','Hydratation renforcée','Masque nourrissant','Moins de maquillage'],
      eviter: ['Exfoliants agressifs','Acides forts','Chaleur excessive'],
      today: 'Huile de rose musquée + Aloé vera'
    }
  },
  printemps: {
    nom: 'Printemps', foodTeaser: 'Légumes verts, probiotiques, zinc', skinTeaser: 'Exfoliation douce & éclat', emoji: '🌸', phase: 'Phase folliculaire',
    color: '#3DAE8A', light: '#80D4B8', soft: '#E8F8F3', dark: '#1A6B52', rgb: '61,174,138',
    grad: 'linear-gradient(145deg, #1A6B52, #3DAE8A)',
    messages: {
      bien: "Tu remarques peut-être plus d'élan — profites-en pour avancer sur ce qui attend depuis un moment.",
      fatiguee: "La fatigue en Printemps mérite attention. Écoute ce que ton corps demande.",
      difficile: "Merci de l'avoir dit. Tu n'as pas à aller bien tout le temps. Aujourd'hui, une chose douce suffit.",
      foi: "La foi fluctue avec le corps — c'est humain. Un seul acte aujourd'hui, le plus simple que tu puisses faire.",
      calme: "Un moment de pause au milieu de l'élan du Printemps — tu sais ce dont tu as besoin. Écoute cette voix intérieure."
    },
    suggestions: ['☎️ Appeler un proche','🚀 Avancer un projet','✉️ Message de gratitude','🌸 Sortir marcher','📚 Apprendre quelque chose'],
    invocation: { arabic:'رَبِّ أَوْزِعْنِي أَنْ أَشْكُرَ نِعْمَتَكَ', fr:'"Seigneur, inspire-moi de remercier pour Tes bienfaits."', source:'Coran 27:19 (extrait)' },
    suggTitle: '🌸 Suggestions du Printemps',
    suggDesc: 'Des petits gestes adaptés à ton énergie du moment.',
    alimentation: {
      nutriments: [
        {nom:'🌱 Phytoœstrogènes', why:'Soutiennent la montée naturelle'},
        {nom:'🧠 Vitamines B', why:'Énergie et clarté mentale'},
        {nom:'🥬 Fibres', why:'Éliminent l\'excès d\'œstrogènes'},
        {nom:'💧 Hydratation', why:'Amplifie l\'énergie naturelle'},
      ],
      aliments: ['Graines de lin','Avocat','Œufs','Brocoli','Quinoa','Fruits rouges','Yaourt','Poulet','Noix','Pois chiches'],
      star: ['Graines de lin','Avocat','Quinoa'],
      eviter: ['Aliments trop lourds','Friture en excès','Sucre raffiné'],
    },
    skincare: {
      whatHappens: 'Les œstrogènes montent — ta peau devient plus lumineuse. C\'est la meilleure phase pour les soins actifs.',
      actifs: [
        {nom:'✨ Vitamine C naturelle', why:'Éclat et anti-oxydant', usage:'Sérum le matin'},
        {nom:'🌾 Argile blanche', why:'Exfoliante douce, purifiante', usage:'Masque 1×/semaine'},
        {nom:'🌺 Niacinamide', why:'Resserre les pores, unifie le teint', usage:'Sérum ou crème légère'},
      ],
      gestes: ['Exfoliation douce 1-2×/sem','Masque purifiant','Sérum vitamine C','Gua sha'],
      eviter: ['Sur-exfolier','Mélanger trop d\'actifs'],
      today: 'Vitamine C + Argile blanche'
    }
  },
  ete: {
    nom: 'Été', foodTeaser: 'Protéines, antioxydants, oméga-3', skinTeaser: 'Protection & légèreté', emoji: '☀️', phase: 'Phase ovulatoire',
    color: '#FF8A65', light: '#FFB4A0', soft: '#FFF3F0', dark: '#D85832', rgb: '255,138,101',
    grad: 'linear-gradient(145deg, #D85832, #FF8A65)',
    messages: {
      bien: "Tu es à ton pic. C'est le bon moment pour les efforts physiques, les conversations importantes.",
      fatiguee: "Si tu te sens fatiguée alors que ton cycle dit Été — c'est un signal. Le corps parle toujours juste.",
      difficile: "Merci de l'avoir dit. Tu n'as pas à aller bien tout le temps. Aujourd'hui, une chose douce suffit.",
      foi: "L'Été est une bonne fenêtre pour un petit acte de reconnexion. Pas une liste — juste un geste.",
      calme: "Même au pic, le cœur peut avoir besoin de silence. C'est de la sagesse, pas un recul. Prends ce calme comme un cadeau."
    },
    suggestions: ['🎁 Offrir quelque chose','💬 Conversation importante','🌍 Sortir et voir du monde','💝 Sadaqa','✍️ Écrire un mot doux'],
    invocation: { arabic:'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ', fr:'"Seigneur, accorde-nous le bien ici-bas et dans l\'au-delà, et préserve-nous du châtiment du feu."', source:'Coran 2:201' },
    suggTitle: '☀️ Suggestions de l\'Été',
    suggDesc: 'Tu rayonnes — donne, partage, connecte.',
    alimentation: {
      nutriments: [
        {nom:'🫐 Antioxydants', why:'Protègent les cellules à l\'ovulation'},
        {nom:'🐟 Zinc', why:'Soutient l\'ovulation et l\'immunité'},
        {nom:'💧 Hydratation++', why:'Corps naturellement moins assoiffé'},
        {nom:'🥗 Légèreté', why:'Appétit naturellement réduit'},
      ],
      aliments: ['Pastèque','Concombre','Tomates','Graines de courge','Poisson blanc','Salade verte','Myrtilles','Grenade'],
      star: ['Pastèque','Concombre','Graines de courge'],
      eviter: ['Plats trop lourds','Excès de caféine','Pro-inflammatoires'],
    },
    skincare: {
      whatHappens: 'Pic d\'œstrogènes — ta peau est au meilleur d\'elle-même. Mais le pic hormonal peut stimuler les glandes sébacées.',
      actifs: [
        {nom:'🌸 Eau de rose', why:'Tonifiante, légèrement astringente', usage:'Brume matin & soir'},
        {nom:'🌿 Hamamélis', why:'Resserre les pores dilatés', usage:'Tonique après nettoyage'},
        {nom:'🫧 Argile verte légère', why:'Absorbe l\'excès de sébum', usage:'Masque express 5 min'},
      ],
      gestes: ['Routine simplifiée','SPF renforcé','Brume fraîche','Moins de couches'],
      eviter: ['Produits occlusifs','Exfoliation agressive','Huiles lourdes'],
      today: 'Eau de rose + Hamamélis'
    }
  },
  automne: {
    nom: 'Automne', foodTeaser: 'Magnésium, complexe B, chocolat noir', skinTeaser: 'Apaisement & barrière cutanée', emoji: '🍂', phase: 'Phase lutéale',
    color: '#C82B4A', light: '#E87090', soft: '#FCF0F3', dark: '#961E36', rgb: '200,43,74',
    grad: 'linear-gradient(145deg, #961E36, #C82B4A)',
    messages: {
      bien: "Des fluctuations arrivent peut-être — maintenant que tu le sais, elles ne te surprendront pas.",
      fatiguee: "Peut-être que tout te semble plus lourd — c'est ton Automne. Une chose. La plus petite. Juste une.",
      difficile: "Ce que tu ressens — ce doute — c'est souvent ton Automne qui parle. Note tes pensées aujourd'hui et reviens-y dans quelques jours avec un regard plus frais.",
      foi: "Tenir malgré la lourdeur, c'est déjà un acte spirituel. Tu es vue.",
      calme: "Ton cœur cherche le calme — c'est la voix de ta sagesse intérieure. As-Salam est l'un des noms d'Allah. Invoque-Le."
    },
    suggestions: ['📞 Appeler ses parents','🌬️ Respiration profonde','📖 Cours islamique','✍️ Journaling profond','🛁 Se dorloter'],
    invocation: { arabic:'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ', fr:'"Ô Allah, je me réfugie en Toi contre l\'anxiété et la tristesse."', source:'Boukhari n°2893' },
    suggTitle: '🍂 Suggestions de l\'Automne',
    suggDesc: 'Ralentis, retourne vers toi.',
    alimentation: {
      nutriments: [
        {nom:'💊 Magnésium', why:'Réduit irritabilité, crampes, insomnie'},
        {nom:'😊 Tryptophane', why:'Précurseur de la sérotonine'},
        {nom:'🍬 Glucides complexes', why:'Stabilisent la glycémie'},
        {nom:'🌿 Vitamine B6', why:'Réduit les symptômes du SPM'},
      ],
      aliments: ['Chocolat noir 70%+','Amandes','Banane','Patate douce','Lentilles','Dattes','Avoine','Courge'],
      star: ['Chocolat noir','Amandes','Banane'],
      eviter: ['Café en excès','Sel (rétention)','Sucre raffiné'],
    },
    skincare: {
      whatHappens: 'La chute des œstrogènes et la dominance de la progestérone augmentent la sensibilité des glandes sébacées — d\'où les poussées d\'acné hormonale fréquentes en fin de cycle.',
      actifs: [
        {nom:'🌿 Tea tree', why:'Antibactérien, anti-poussées', usage:'1 goutte en soin local uniquement'},
        {nom:'🍵 Extrait de thé vert', why:'Anti-inflammatoire, calme les rougeurs', usage:'Tonique ou sérum'},
        {nom:'🌾 Zinc naturel', why:'Régule le sébum, aide à cicatriser', usage:'Crème ou sérum'},
      ],
      gestes: ['Nettoyage rigoureux le soir','Soin local anti-imperfections','Ne pas toucher le visage','Changer la taie d\'oreiller'],
      eviter: ['Percer les boutons','Huiles comédogènes','Exfoliation sur peau enflammée'],
      today: 'Tea tree + Thé vert + Zinc'
    }
  }
};

const ASMA = [
  {num:1,ar:'الرَّحْمَنُ',fr:'Ar-Rahman · Le Tout Miséricordieux'},{num:2,ar:'الرَّحِيمُ',fr:'Ar-Rahim · Le Très Miséricordieux'},{num:3,ar:'الْمَلِكُ',fr:'Al-Malik · Le Roi'},{num:4,ar:'الْقُدُّوسُ',fr:'Al-Quddous · Le Très Saint'},{num:5,ar:'السَّلَامُ',fr:'As-Salam · La Paix'},
  {num:6,ar:'الْمُؤْمِنُ',fr:"Al-Mu'min · Celui qui donne la sécurité"},{num:7,ar:'الْمُهَيْمِنُ',fr:'Al-Muhaimin · Le Surveillant Suprême'},{num:8,ar:'الْعَزِيزُ',fr:"Al-Aziz · Le Puissant"},{num:9,ar:'الْجَبَّارُ',fr:'Al-Jabbar · Le Contraignant'},{num:10,ar:'الْمُتَكَبِّرُ',fr:'Al-Mutakabbir · Le Très Grand'},
  {num:11,ar:'الْخَالِقُ',fr:'Al-Khaliq · Le Créateur'},{num:12,ar:'الْبَارِئُ',fr:"Al-Bari · Le Formateur"},{num:13,ar:'الْمُصَوِّرُ',fr:'Al-Mussawwir · Le Façonneur'},{num:14,ar:'الْغَفَّارُ',fr:'Al-Ghaffar · Le Grand Pardonneur'},{num:15,ar:'الْقَهَّارُ',fr:'Al-Qahhar · Le Dominateur Absolu'},
  {num:16,ar:'الْوَهَّابُ',fr:'Al-Wahhab · Le Donateur'},{num:17,ar:'الرَّزَّاقُ',fr:'Ar-Razzaq · Le Pourvoyeur'},{num:18,ar:'الْفَتَّاحُ',fr:'Al-Fattah · Le Grand Ouvreur'},{num:19,ar:'الْعَلِيمُ',fr:"Al-Alim · L'Omniscient"},{num:20,ar:'الْقَابِضُ',fr:'Al-Qabid · Celui qui retient'},
  {num:21,ar:'الْبَاسِطُ',fr:'Al-Basit · Celui qui étend'},{num:22,ar:'الْخَافِضُ',fr:'Al-Khafid · Celui qui abaisse'},{num:23,ar:'الرَّافِعُ',fr:"Ar-Rafi · Celui qui élève"},{num:24,ar:'الْمُعِزُّ',fr:"Al-Mu'izz · Celui qui honore"},{num:25,ar:'الْمُذِلُّ',fr:'Al-Mudhill · Celui qui humilie'},
  {num:26,ar:'السَّمِيعُ',fr:'As-Sami · Le Tout-Entendant'},{num:27,ar:'الْبَصِيرُ',fr:'Al-Basir · Le Clairvoyant'},{num:28,ar:'الْحَكَمُ',fr:'Al-Hakam · Le Juge'},{num:29,ar:'الْعَدْلُ',fr:"Al-Adl · Le Juste"},{num:30,ar:'اللَّطِيفُ',fr:'Al-Latif · Le Subtil'},
  {num:31,ar:'الْخَبِيرُ',fr:'Al-Khabir · Le Bien Informé'},{num:32,ar:'الْحَلِيمُ',fr:'Al-Halim · Le Clément'},{num:33,ar:'الْعَظِيمُ',fr:'Al-Azim · Le Très Grand'},{num:34,ar:'الْغَفُورُ',fr:'Al-Ghafur · Le Très Indulgent'},{num:35,ar:'الشَّكُورُ',fr:'Ash-Shakur · Le Très Reconnaissant'},
  {num:36,ar:'الْعَلِيُّ',fr:'Al-Ali · Le Très Haut'},{num:37,ar:'الْكَبِيرُ',fr:'Al-Kabir · Le Très Grand'},{num:38,ar:'الْحَفِيظُ',fr:'Al-Hafiz · Le Gardien'},{num:39,ar:'الْمُقِيتُ',fr:'Al-Muqit · Celui qui pourvoit à la subsistance'},{num:40,ar:'الْحَسِيبُ',fr:'Al-Hasib · Le Teneur de comptes'},
  {num:41,ar:'الْجَلِيلُ',fr:'Al-Jalil · Le Majestueux'},{num:42,ar:'الْكَرِيمُ',fr:'Al-Karim · Le Généreux'},{num:43,ar:'الرَّقِيبُ',fr:'Ar-Raqib · Le Vigilant'},{num:44,ar:'الْمُجِيبُ',fr:'Al-Mujib · Celui qui répond'},{num:45,ar:'الْوَاسِعُ',fr:'Al-Wasi · Le Vaste'},
  {num:46,ar:'الْحَكِيمُ',fr:'Al-Hakim · Le Sage'},{num:47,ar:'الْوَدُودُ',fr:"Al-Wadud · Le Plein d'Amour"},{num:48,ar:'الْمَجِيدُ',fr:'Al-Majid · Le Très Glorieux'},{num:49,ar:'الْبَاعِثُ',fr:"Al-Ba'ith · Le Ressuscitateur"},{num:50,ar:'الشَّهِيدُ',fr:'Ash-Shahid · Le Témoin'},
  {num:51,ar:'الْحَقُّ',fr:'Al-Haqq · La Vérité'},{num:52,ar:'الْوَكِيلُ',fr:'Al-Wakil · Le Garant'},{num:53,ar:'الْقَوِيُّ',fr:'Al-Qawi · Le Très Fort'},{num:54,ar:'الْمَتِينُ',fr:'Al-Matin · Le Ferme'},{num:55,ar:'الْوَلِيُّ',fr:'Al-Waliyy · Le Proche Protecteur'},
  {num:56,ar:'الْحَمِيدُ',fr:'Al-Hamid · Le Digne de louanges'},{num:57,ar:'الْمُحْصِي',fr:'Al-Muhsi · Le Dénombrateur'},{num:58,ar:'الْمُبْدِئُ',fr:"Al-Mubdi · Celui qui initie la création"},{num:59,ar:'الْمُعِيدُ',fr:"Al-Mu'id · Celui qui restaure"},{num:60,ar:'الْمُحْيِي',fr:'Al-Muhyi · Le Vivificateur'},
  {num:61,ar:'الْمُمِيتُ',fr:'Al-Mumit · Le Donneur de mort'},{num:62,ar:'الْحَيُّ',fr:'Al-Hayy · Le Vivant'},{num:63,ar:'الْقَيُّومُ',fr:'Al-Qayyum · Le Subsistant'},{num:64,ar:'الْوَاجِدُ',fr:'Al-Wajid · Celui qui trouve'},{num:65,ar:'الْمَاجِدُ',fr:'Al-Majid · Le Glorieux'},
  {num:66,ar:'الْوَاحِدُ',fr:"Al-Wahid · L'Unique"},{num:67,ar:'الأَحَدُ',fr:"Al-Ahad · L'Unique Absolu (Coran 112:1)"},{num:68,ar:'الصَّمَدُ',fr:"As-Samad · Le Soutien Absolu (Coran 112:2)"},{num:69,ar:'الْقَادِرُ',fr:'Al-Qadir · Le Puissant'},{num:70,ar:'الْمُقْتَدِرُ',fr:'Al-Muqtadir · Le Très Puissant'},
  {num:71,ar:'الْمُقَدِّمُ',fr:'Al-Muqaddim · Celui qui avance'},{num:72,ar:'الْمُؤَخِّرُ',fr:"Al-Mu'akhkhir · Celui qui retarde"},{num:73,ar:'الأَوَّلُ',fr:'Al-Awwal · Le Premier'},{num:74,ar:'الآخِرُ',fr:'Al-Akhir · Le Dernier'},{num:75,ar:'الظَّاهِرُ',fr:"Az-Zahir · L'Apparent"},
  {num:76,ar:'الْبَاطِنُ',fr:'Al-Batin · Le Caché'},{num:77,ar:'الْوَالِي',fr:'Al-Wālī · Le Maître de toute chose'},{num:78,ar:'الْمُتَعَالِي',fr:"Al-Muta'ali · Le Très Élevé"},{num:79,ar:'الْبَرُّ',fr:'Al-Barr · Le Bienfaisant'},{num:80,ar:'التَّوَّابُ',fr:'At-Tawwāb · Celui qui accepte le repentir'},
  {num:81,ar:'الْمُنْتَقِمُ',fr:'Al-Muntaqim · Celui qui punit'},{num:82,ar:'الْعَفُوُّ',fr:'Al-Afuww · Celui qui pardonne'},{num:83,ar:'الرَّؤُوفُ',fr:"Ar-Ra'uf · Le Très Compatissant"},{num:84,ar:'مَالِكُ الْمُلْكِ',fr:'Malik-ul-Mulk · Maître du Royaume'},{num:85,ar:'ذُو الْجَلَالِ وَالْإِكْرَامِ',fr:'Dhu-l-Jalali wal-Ikram · Maître de la Majesté et de la Générosité'},
  {num:86,ar:'الْمُقْسِطُ',fr:"Al-Muqsit · L'Équitable"},{num:87,ar:'الْجَامِعُ',fr:'Al-Jami · Le Rassembleur'},{num:88,ar:'الْغَنِيُّ',fr:'Al-Ghani · Le Riche'},{num:89,ar:'الْمُغْنِي',fr:'Al-Mughni · Celui qui enrichit'},{num:90,ar:'الْمَانِعُ',fr:"Al-Mani'u · Celui qui empêche"},
  {num:91,ar:'الضَّارُّ',fr:'Ad-Darr · Celui qui affecte'},{num:92,ar:'النَّافِعُ',fr:'An-Nafi · Le Bienfaiteur'},{num:93,ar:'النُّورُ',fr:'An-Nur · La Lumière'},{num:94,ar:'الْهَادِي',fr:'Al-Hadi · Le Guide'},{num:95,ar:'الْبَدِيعُ',fr:"Al-Badi · L'Innovateur Absolu"},
  {num:96,ar:'الْبَاقِي',fr:"Al-Baqi · L'Éternel"},{num:97,ar:'الْوَارِثُ',fr:"Al-Warith · L'Héritier"},{num:98,ar:'الرَّشِيدُ',fr:'Ar-Rashid · Le Guide Juste'},{num:99,ar:'الصَّبُورُ',fr:'As-Sabur · Le Patient'},
];

const ASMA_MEDITATIONS = {};

// ═══════════════════════════════════════════════
// CYCLE LOGIC
// ═══════════════════════════════════════════════
function effectiveCycleDur() {
  const past = [
    ...(ST.cycleHistory || []).map(c => Number(c.duration) || 0),
    ...(ST.historiqueCycles || []).map(c => Number(c.dureeCycle) || 0),
  ].filter(d => d >= 20 && d <= 60);
  if (past.length < 3) return Math.max(20, Math.min(60, ST.cycleDuration || 28));
  return Math.max(20, Math.min(60, Math.round(past.reduce((a, b) => a + b, 0) / past.length)));
}

// Source unique de vérité pour les seuils de phase (Hiver/Printemps/Été/Automne).
// Utilisée par computeCycle(), renderCycle(), phaseForDay(), drawCycleRing(),
// dayWithinPhase(), getAutomneMicroPhase() et _bilanStats() — aucune de ces
// fonctions ne doit recalculer ses propres seuils (RISQUE-01).
function phaseThresholds(dur) {
  // Durée d'Hiver (règles) : priorité à la durée habituelle déclarée par
  // l'utilisatrice (onboarding ou Moi > Modifier mon cycle). Si elle n'a rien
  // déclaré, on retombe sur une estimation proportionnelle de 20% du cycle —
  // un fallback par défaut explicite, pas la règle générale (FIQH-ROUGE3).
  const hiverDays  = (ST.dureeRegles && ST.dureeRegles >= 1 && ST.dureeRegles <= 15)
    ? ST.dureeRegles
    : Math.floor(dur * 0.20);
  const springDays = Math.floor(dur * 0.30);
  const eteDays    = Math.floor(dur * 0.15);
  let springStartD = hiverDays + 1;
  if (ST.hiverEnd && ST.cycleStart) {
    const [hey, hem, hed] = ST.hiverEnd.split('-').map(Number);
    const [sy, sm, sd]    = ST.cycleStart.split('-').map(Number);
    const hiverEndDiff = Math.floor((new Date(hey, hem-1, hed) - new Date(sy, sm-1, sd)) / 86400000);
    const eteStartRaw = hiverDays + springDays + 1;
    if (hiverEndDiff > 0 && hiverEndDiff < dur)
      springStartD = Math.max(2, Math.min(hiverEndDiff + 2, eteStartRaw - 1));
  }
  const eteStartD = hiverDays + springDays + 1;
  const eteEndD   = hiverDays + springDays + eteDays;
  return { springStartD, eteStartD, eteEndD };
}

function computeCycle() {
  if (!ST.cycleStart || !/^\d{4}-\d{2}-\d{2}$/.test(ST.cycleStart)) {
    ST.cycleStart = null; ST.currentDay = 1; ST.currentSaison = 'hiver'; return;
  }
  const now = new Date();
  const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const [sy, sm, sd] = ST.cycleStart.split('-').map(Number);
  const startLocal = new Date(sy, sm - 1, sd);
  const diff = Math.floor((todayLocal - startLocal) / 86400000);
  if (diff < 0) { ST.currentDay = 1; ST.currentSaison = 'hiver'; return; }
  const dur = effectiveCycleDur();
  const cycleNum = Math.floor(diff / dur);
  const day = (diff % dur) + 1;
  // Cycle écoulé sans clic "Premier jour" : archiver et avancer cycleStart
  let effectiveCycleNum = cycleNum;
  if (cycleNum > 0 && ST.cycleStart) {
    if (!ST.cycleHistory) ST.cycleHistory = [];
    // Archiver tous les cycles écoulés (stats réelles pour le 1er, vides pour les intermédiaires)
    for (let i = 0; i < cycleNum; i++) {
      const cStart = new Date(sy, sm - 1, sd + i * dur);
      const cStr = cStart.getFullYear() + '-' + String(cStart.getMonth()+1).padStart(2,'0') + '-' + String(cStart.getDate()).padStart(2,'0');
      const nextStart = new Date(sy, sm - 1, sd + (i + 1) * dur);
      const nextStr = nextStart.getFullYear() + '-' + String(nextStart.getMonth()+1).padStart(2,'0') + '-' + String(nextStart.getDate()).padStart(2,'0');
      if (!ST.cycleHistory.find(c => c.start === cStr)) {
        const snap = (i === 0) ? _bilanStats(cStr, nextStr) : { prayerDays: 0, symptomDays: 0 };
        ST.cycleHistory.unshift({ start: cStr, duration: dur,
          prayerDays: snap.prayerDays, symptomDays: snap.symptomDays });
        if (ST.cycleHistory.length > 6) ST.cycleHistory = ST.cycleHistory.slice(0, 6);
      }
    }
    const ns = new Date(sy, sm - 1, sd + cycleNum * dur);
    ST.cycleStart = ns.getFullYear() + '-' + String(ns.getMonth()+1).padStart(2,'0') + '-' + String(ns.getDate()).padStart(2,'0');
    ST.hiverEnd = null;
    ST._lastCycleNum = -1;
    effectiveCycleNum = 0;
    saveState();
  }
  // Detect new cycle
  if (ST._lastCycleNum !== effectiveCycleNum) {
    ST._lastCycleNum = effectiveCycleNum;
  }
  ST.currentDay = Math.max(1, Math.min(day, dur));

  const d = ST.currentDay;
  const { springStartD, eteStartD, eteEndD } = phaseThresholds(dur);

  if (d < springStartD) ST.currentSaison = 'hiver';
  else if (d < eteStartD) ST.currentSaison = 'printemps';
  else if (d <= eteEndD) ST.currentSaison = 'ete';
  else ST.currentSaison = 'automne';

  if (ST._lastSaison && ST._lastSaison !== ST.currentSaison) {
    const phaseToasts = {
      hiver:     ['❄️', 'Ton Hiver est là', 'Prends soin de toi, doucement.'],
      printemps: ['🌱', 'Bienvenue au Printemps !', 'L\'énergie revient — savoure-la.'],
      ete:       ['☀️', 'Tu entres en Été', 'Rayonne, c\'est ta saison.'],
      automne:   ['🍂', 'L\'Automne commence', 'Tourne-toi vers l\'intérieur.'],
    };
    const [emoji, title, sub] = phaseToasts[ST.currentSaison] || ['✨', 'Nouvelle phase', ''];
    setTimeout(() => showPhaseToast(emoji, title, sub), 1800);
  }
  ST._lastSaison = ST.currentSaison;
}

const BG_PHASE = { hiver: '#FAF0FF', printemps: '#F0FAF6', ete: '#FFF3F0', automne: '#FDF5F0' };

function showPhaseToast(emoji, title, sub) {
  const el = document.createElement('div');
  el.className = 'phase-toast';
  el.innerHTML = `<span class="phase-toast-emoji">${emoji}</span><div class="phase-toast-body"><div class="phase-toast-title">${title}</div><div class="phase-toast-sub">${sub}</div></div>`;
  document.body.appendChild(el);
  requestAnimationFrame(() => { requestAnimationFrame(() => el.classList.add('visible')); });
  setTimeout(() => {
    el.classList.remove('visible');
    setTimeout(() => el.remove(), 500);
  }, 4500);
}

function _bilanStats(startStr, endStr) {
  const effectiveStart = startStr || ST.cycleStart;
  let cycleStartDay = 0;
  if (effectiveStart) {
    const [csy, csm, csd] = effectiveStart.split('-').map(Number);
    cycleStartDay = csy * 10000 + csm * 100 + csd;
  }
  let cycleEndDay = 0;
  if (endStr) {
    const [ey, em, ed] = endStr.split('-').map(Number);
    cycleEndDay = ey * 10000 + em * 100 + ed;
  }
  const inCycle = key => {
    const d = new Date(key);
    if (isNaN(d)) return false;
    const keyDay = d.getFullYear() * 10000 + (d.getMonth()+1) * 100 + d.getDate();
    return keyDay >= cycleStartDay && (!cycleEndDay || keyDay < cycleEndDay);
  };

  const cycleDuration = ST.cycleDuration || 28;
  const { springStartD } = phaseThresholds(cycleDuration);
  const isHaidhDay = (dateStr) => {
    if (!effectiveStart) return false;
    const d = new Date(dateStr);
    if (isNaN(d)) return false;
    const [sy, sm, sd] = effectiveStart.split('-').map(Number);
    const cycleDay = Math.floor((d - new Date(sy, sm-1, sd)) / 86400000) + 1;
    return cycleDay >= 1 && cycleDay < springStartD;
  };

  const symptomDays = Object.keys(ST.symptomes || {}).filter(d => inCycle(d) && (ST.symptomes[d]||[]).length > 0).length;
  const prayerDays = Object.keys(ST.prayers || {}).filter(d => {
    if (!inCycle(d) || isHaidhDay(d)) return false;
    const p = ST.prayers[d] || {};
    return ['fajr','dohr','asr','maghrib','isha'].filter(n => p[n]).length >= 3;
  }).length;
  const allPrayersDays = Object.keys(ST.prayers || {}).filter(d => {
    if (!inCycle(d) || isHaidhDay(d)) return false;
    const p = ST.prayers[d] || {};
    return ['fajr','dohr','asr','maghrib','isha'].filter(n => p[n]).length === 5;
  }).length;
  const dhikrDays = Object.keys(ST.dhikrChecks || {}).filter(d =>
    inCycle(d) && Object.values(ST.dhikrChecks[d] || {}).filter(Boolean).length >= 3
  ).length;
  const coranDays = Object.keys(ST.coranDone || {}).filter(d => inCycle(d) && ST.coranDone[d]).length;

  // Compter les objectifs via l'historique (nouvelles entrées) + fallback ancien système
  const objHistory = (ST.objHistory || []).filter(entry => {
    if (!entry.date || !effectiveStart) return false;
    const entryDate = new Date(entry.date);
    if (isNaN(entryDate)) return false;
    const entryDay = entryDate.getFullYear() * 10000 + (entryDate.getMonth()+1) * 100 + entryDate.getDate();
    return entryDay >= cycleStartDay && (!cycleEndDay || entryDay < cycleEndDay);
  });

  // Fallback : compter via l'ancienne méthode si pas d'historique
  let objCheckCountFallback = 0;
  const _countObjChecks = (dict) => {
    Object.values(dict || {}).forEach(week => {
      Object.values(week).forEach(arr => {
        (arr || []).forEach(dateStr => {
          const d = new Date(dateStr);
          if (isNaN(d)) return;
          const objDay = d.getFullYear() * 10000 + (d.getMonth()+1) * 100 + d.getDate();
          if (!cycleStartDay || (objDay >= cycleStartDay && (!cycleEndDay || objDay < cycleEndDay))) objCheckCountFallback++;
        });
      });
    });
  };
  _countObjChecks(ST.weeklyObjChecks);
  _countObjChecks(ST.customObjChecks);

  // Prendre le maximum entre historique et fallback
  const objCheckCount = Math.max(objHistory.length, objCheckCountFallback);

  return { symptomDays, prayerDays, allPrayersDays, dhikrDays, coranDays, objCheckCount, cycleDuration };
}

function showBilanModal() {
  const el = document.getElementById('bilan-modal');
  const body = document.getElementById('bilan-body');
  if (!el) return;
  const { symptomDays, prayerDays, allPrayersDays, dhikrDays, coranDays, objCheckCount, cycleDuration } = _bilanStats();

  const joursSuivis = Math.min(ST.currentDay || 1, ST.cycleDuration || 28);
  const headerDays = document.getElementById('bilan-header-days');
  if (headerDays) headerDays.textContent = `tu as traversé ${joursSuivis} jour${joursSuivis > 1 ? 's' : ''}`;

  if (body) body.innerHTML = `
    <div class="bilan-journey">
      <span class="bilan-phase-chip bilan-hiver">❄️ Hiver</span>
      <span class="bilan-phase-arrow">→</span>
      <span class="bilan-phase-chip bilan-printemps">🌱 Printemps</span>
      <span class="bilan-phase-arrow">→</span>
      <span class="bilan-phase-chip bilan-ete">☀️ Été</span>
      <span class="bilan-phase-arrow">→</span>
      <span class="bilan-phase-chip bilan-automne">🍂 Automne</span>
    </div>
    <div class="bilan-strength-line">${joursSuivis} jour${joursSuivis > 1 ? 's' : ''} traversé${joursSuivis > 1 ? 's' : ''} ce cycle</div>

    <div class="bilan-section-lbl">🕌 Âme</div>
    <div class="bilan-grid-2">
      <div class="bilan-stat"><span class="bilan-stat-num">${prayerDays}</span><span class="bilan-stat-lbl">jours 3+ prières</span></div>
      <div class="bilan-stat"><span class="bilan-stat-num">${allPrayersDays}</span><span class="bilan-stat-lbl">prières 5/5 complètes</span></div>
      <div class="bilan-stat"><span class="bilan-stat-num">${dhikrDays}</span><span class="bilan-stat-lbl">jours de dhikr</span></div>
      <div class="bilan-stat"><span class="bilan-stat-num">${coranDays}</span><span class="bilan-stat-lbl">jours de Coran</span></div>
    </div>

    ${symptomDays > 0 ? `
    <div class="bilan-note">${symptomDays} jour${symptomDays > 1 ? 's' : ''} d'écoute de ton corps 🌸</div>
    ` : ''}

    ${objCheckCount > 0 ? `
    <div class="bilan-section-lbl">🎯 Objectifs</div>
    <div class="bilan-obj-line"><span class="bilan-obj-num">${objCheckCount}</span>objectifs cochés au fil du cycle</div>
    ` : ''}

    ${(() => {
      const histCycles = ST.historiqueCycles || [];
      if (!histCycles.length) return '';
      const allDurations = [ST.cycleDuration || 28, ...histCycles.map(c => Number(c.dureeCycle) || 28)];
      const avgDur = Math.round(allDurations.reduce((a, b) => a + b, 0) / allDurations.length);
      const avgRegles = Math.round(histCycles.map(c => Number(c.dureeRegles) || 5).reduce((a, b) => a + b, 0) / histCycles.length);
      const minD = Math.min(...allDurations);
      const maxD = Math.max(...allDurations);
      const isReg = (maxD - minD) <= 3;
      const intCounts = { legere: 0, normale: 0, abondante: 0 };
      histCycles.forEach(c => { if (c.intensite && intCounts[c.intensite] !== undefined) intCounts[c.intensite]++; });
      const topInt = Object.entries(intCounts).sort((a, b) => b[1] - a[1])[0];
      const intLabel = { legere: '🟢 Légères', normale: '🟡 Normales', abondante: '🔴 Abondantes' };
      return `
        <div class="bilan-section-lbl">📅 Sur tes ${1 + histCycles.length} derniers cycles</div>
        <div class="bilan-grid-3">
          <div class="bilan-stat"><span class="bilan-stat-num">${avgDur}j</span><span class="bilan-stat-lbl">durée moy.</span></div>
          <div class="bilan-stat"><span class="bilan-stat-num">${avgRegles}j</span><span class="bilan-stat-lbl">règles moy.</span></div>
          <div class="bilan-stat"><span class="bilan-stat-num">${isReg ? '🌿' : '〰️'}</span><span class="bilan-stat-lbl">${isReg ? 'Régulier' : 'Variable'}</span></div>
        </div>
        ${topInt && topInt[1] > 0 ? `<div class="bilan-note">Intensité habituelle&nbsp;: ${intLabel[topInt[0]] || topInt[0]}</div>` : ''}
      `;
    })()}

    <div class="bilan-quote">
      <div class="bilan-quote-text">&laquo;&nbsp;Et quiconque fait le bien, f&#251;t-ce du poids d&apos;un atome, le verra.&nbsp;&raquo;</div>
      <div class="bilan-quote-ref">— Coran 99:7</div>
    </div>
    <div class="bilan-ame-note">L&apos;onglet &#194;me reste toujours accessible gratuitement.<br>Tes pri&#232;res, ton dhikr et le Coran t&apos;appartiennent.</div>
  `;
  el.classList.add('open');
}
function closeBilanModal() {
  const el = document.getElementById('bilan-modal');
  if (el) el.classList.remove('open');
}

function applySaisonTheme() {
  const s = SAISONS[ST.currentSaison];
  const r = document.documentElement.style;
  r.setProperty('--season', s.color);
  r.setProperty('--season-light', s.light);
  r.setProperty('--season-soft', s.soft);
  r.setProperty('--season-grad', s.grad);
  r.setProperty('--season-dark', s.dark);
  r.setProperty('--season-rgb', s.rgb);
  r.setProperty('--bg-phase', BG_PHASE[ST.currentSaison] || '#FAF6F0');
  const av = document.querySelector('.av-btn');
  if (av) { av.style.background = s.grad; av.textContent = s.emoji; }

  const psCycle = document.getElementById('psCycle');
  if (psCycle) psCycle.textContent = s.nom + ' ' + s.emoji + ' · Jour ' + ST.currentDay;

  const softGrad = `linear-gradient(135deg, ${s.soft}, ${s.light})`;
  const softShadow = `0 3px 14px rgba(${s.rgb},.15)`;
  const iconBg = `rgba(${s.rgb},.15)`;

  const lc = document.getElementById('asma-livret-card');
  if (lc) { lc.style.background = softGrad; lc.style.boxShadow = softShadow; }
  const li = document.getElementById('asma-livret-icon-wrap');
  if (li) li.style.background = iconBg;
  const lt = document.getElementById('asma-livret-title');
  if (lt) lt.style.color = s.dark;
  const ls = document.getElementById('asma-livret-sub');
  if (ls) ls.style.color = s.color;
  const lb = document.getElementById('asma-livret-badge');
  if (lb) { lb.style.background = iconBg; lb.style.color = s.dark; }
  const la = document.getElementById('asma-livret-arrow');
  if (la) la.style.color = s.color;

  const lectureCard = document.getElementById('day-card-lecture');
  if (lectureCard) { lectureCard.style.background = softGrad; lectureCard.style.boxShadow = softShadow; }

  const wc = document.getElementById('wb-cta-card-el');
  if (wc) { wc.style.background = softGrad; wc.style.boxShadow = `0 8px 24px rgba(${s.rgb},.2)`; }
  const wbd = document.getElementById('wb-badge');
  if (wbd) { wbd.style.background = iconBg; wbd.style.color = s.dark; }
  const wt = document.getElementById('wb-title');
  if (wt) wt.style.color = s.dark;
  const wd = document.getElementById('wb-desc');
  if (wd) wd.style.color = s.color;
  const wm = document.getElementById('wb-meta');
  if (wm) wm.style.color = s.color;
  const wb = document.getElementById('wb-btn');
  if (wb) { wb.style.background = s.dark; wb.style.color = 'white'; }
}

// ═══════════════════════════════════════════════
// POPULATE ALL
// ═══════════════════════════════════════════════
function populateAll() {
  const s = SAISONS[ST.currentSaison];
  if (!s) return;

  // ── DASHBOARD ACCUEIL ──
  renderDashboard(s);

  // ── CYCLE ──
  renderCycle(s);

  // ── ÂME ──
  renderAme(s);

  // ── OBJECTIFS ──
  renderObjectifs();

  // ── MOI ──
  renderMoi(s);
  renderCycleHistory();
  renderHistoriqueCycles();
  restoreFeedback();

  // RESTORE
  restorePrayers();
  restoreDhikrChecks();
  restoreCoranCheck();
  restoreGlaire();
  restoreSymptomes();
  setTimeout(showInstallBanner, 1500);
}

// ═══════════════════════════════════════════════
// DASHBOARD ENGAGEANT
// ═══════════════════════════════════════════════
const _HOME_DECOS = {
  hiver: `<svg viewBox="0 0 110 80" fill="none"><circle cx="72" cy="28" r="20" fill="white" opacity="0.18"/><circle cx="22" cy="14" r="2.5" fill="white" opacity="0.16"/><circle cx="34" cy="7" r="1.8" fill="white" opacity="0.12"/><circle cx="12" cy="30" r="1.5" fill="white" opacity="0.1"/><circle cx="96" cy="60" r="1.5" fill="white" opacity="0.1"/><circle cx="104" cy="44" r="2" fill="white" opacity="0.13"/><circle cx="46" cy="5" r="1.2" fill="white" opacity="0.1"/></svg>`,
  printemps: `<svg viewBox="0 0 110 80" fill="none"><g transform="rotate(0 68 26)"><ellipse cx="68" cy="15" rx="5" ry="9" fill="white" opacity="0.15"/></g><g transform="rotate(72 68 26)"><ellipse cx="68" cy="15" rx="5" ry="9" fill="white" opacity="0.15"/></g><g transform="rotate(144 68 26)"><ellipse cx="68" cy="15" rx="5" ry="9" fill="white" opacity="0.15"/></g><g transform="rotate(216 68 26)"><ellipse cx="68" cy="15" rx="5" ry="9" fill="white" opacity="0.15"/></g><g transform="rotate(288 68 26)"><ellipse cx="68" cy="15" rx="5" ry="9" fill="white" opacity="0.15"/></g><circle cx="68" cy="26" r="5" fill="white" opacity="0.2"/><g transform="rotate(0 92 56)"><ellipse cx="92" cy="49" rx="3.5" ry="6" fill="white" opacity="0.1"/></g><g transform="rotate(72 92 56)"><ellipse cx="92" cy="49" rx="3.5" ry="6" fill="white" opacity="0.1"/></g><g transform="rotate(144 92 56)"><ellipse cx="92" cy="49" rx="3.5" ry="6" fill="white" opacity="0.1"/></g><g transform="rotate(216 92 56)"><ellipse cx="92" cy="49" rx="3.5" ry="6" fill="white" opacity="0.1"/></g><g transform="rotate(288 92 56)"><ellipse cx="92" cy="49" rx="3.5" ry="6" fill="white" opacity="0.1"/></g><circle cx="92" cy="56" r="3.5" fill="white" opacity="0.13"/></svg>`,
  ete: `<svg viewBox="0 0 110 80" fill="none"><circle cx="72" cy="30" r="14" fill="white" opacity="0.18"/><line x1="72" y1="6" x2="72" y2="12" stroke="white" stroke-width="2.5" stroke-linecap="round" opacity="0.15"/><line x1="72" y1="48" x2="72" y2="54" stroke="white" stroke-width="2.5" stroke-linecap="round" opacity="0.15"/><line x1="46" y1="30" x2="52" y2="30" stroke="white" stroke-width="2.5" stroke-linecap="round" opacity="0.15"/><line x1="92" y1="30" x2="98" y2="30" stroke="white" stroke-width="2.5" stroke-linecap="round" opacity="0.15"/><line x1="54" y1="12" x2="58" y2="16" stroke="white" stroke-width="2.5" stroke-linecap="round" opacity="0.12"/><line x1="86" y1="44" x2="90" y2="48" stroke="white" stroke-width="2.5" stroke-linecap="round" opacity="0.12"/><line x1="54" y1="48" x2="58" y2="44" stroke="white" stroke-width="2.5" stroke-linecap="round" opacity="0.12"/><line x1="86" y1="16" x2="90" y2="12" stroke="white" stroke-width="2.5" stroke-linecap="round" opacity="0.12"/></svg>`,
  automne: `<svg viewBox="0 0 110 80" fill="none"><path d="M64 8 C76 4 84 16 80 28 C76 40 64 42 60 36 C54 44 52 56 56 64 C50 56 50 44 56 36 C50 30 50 16 58 10 C60 8 64 8 64 8Z" fill="white" opacity="0.15"/><path d="M84 26 C92 22 96 32 93 40 C90 47 84 47 82 43 C79 49 79 57 82 63 C77 57 77 47 81 41 C75 37 75 27 82 22 C83 21 84 26 84 26Z" fill="white" opacity="0.12"/><circle cx="30" cy="14" r="1.5" fill="white" opacity="0.1"/><circle cx="20" cy="8" r="1" fill="white" opacity="0.08"/></svg>`,
};

function renderDashboard(s) {
  // ─ Header compact ─
  const nameEl = document.getElementById('home-name');
  if (nameEl) nameEl.textContent = ST.prenom || 'Ma sœur';
  const phaseEl = document.getElementById('home-phase-line');
  if (phaseEl) phaseEl.textContent = s.emoji + ' ' + s.nom + ' · Jour ' + ST.currentDay;
  const decoEl = document.getElementById('home-header-deco');
  if (decoEl) decoEl.innerHTML = _HOME_DECOS[ST.currentSaison] || '';
  const decoEl2 = document.getElementById('home-header-deco2');
  if (decoEl2) decoEl2.innerHTML = _HOME_DECOS[ST.currentSaison] || '';
  const msgIcon = document.getElementById('home-msg-icon');
  if (msgIcon) msgIcon.textContent = s.emoji;

  // Message
  updateMessage();

  // ─ Lecture du jour ─
  renderLectureDuJour();

  // ─ 3 cartes d'action ─
  renderCarteMouvement(s);
  renderCarteRepas(s);
  renderCarteSkincare(s);

  // ─ Suggestions engageantes ─
  renderSuggestionsEngage(s);
}

// ═══════════════════════════════════════════════
// CARTE MOUVEMENT — conseil ponctuel, pas de programme
// ═══════════════════════════════════════════════
function renderCarteMouvement(s) {
  const el = document.getElementById('mouv-conseil-text');
  if (el) el.textContent = (typeof MOUVEMENT_DU_JOUR !== 'undefined' && MOUVEMENT_DU_JOUR[ST.currentSaison]) || '';
}

// ═══════════════════════════════════════════════
// CARTES MANGER & PRENDRE SOIN — conseil ponctuel par phase, pas de programme
// ═══════════════════════════════════════════════
function renderCarteRepas(s) {
  const alim = s.alimentation;
  if (!alim) return;

  const dur = effectiveCycleDur();
  const dayIdx = dayWithinPhase(ST.currentDay, dur);
  const idees = (typeof REPAS_QUOTIDIENS !== 'undefined' && REPAS_QUOTIDIENS[ST.currentSaison]) || [];
  const ideeIdx = idees.length ? dayIdx % idees.length : 0;
  const idee = idees.length ? idees[ideeIdx] : null;

  const starsEl = document.getElementById('dc-repas-stars');
  if (starsEl) {
    starsEl.innerHTML = idee
      ? `<span class="day-card-chip">${idee.emoji} ${idee.nom}</span>`
      : (alim.star || []).map(f => `<span class="day-card-chip">⭐ ${f}</span>`).join('');
  }

  const nutrimEl = document.getElementById('dc-repas-nutriments');
  if (nutrimEl) {
    nutrimEl.innerHTML = idee
      ? `<div class="repas-pourquoi-block"><div class="repas-pourquoi-text">✨ ${idee.benefice}</div></div>`
      : (alim.nutriments || []).slice(0, 2).map(n => `
        <div class="day-card-nutriment-row">
          <span class="day-card-nutriment-nom">${n.nom}</span>
          <span class="day-card-nutriment-why">${n.why}</span>
        </div>`).join('');
  }

  const eviterEl = document.getElementById('dc-repas-eviter');
  if (eviterEl) {
    eviterEl.innerHTML = (alim.eviter || []).length
      ? `<span class="day-card-eviter-label">À éviter :</span> ` +
        alim.eviter.map(e => `<span class="day-card-chip-eviter">${e}</span>`).join('')
      : '';
  }

  const premEl = document.getElementById('action-manger-info');
  if (!premEl || !idee) return;
  premEl.innerHTML = `
    <div class="action-unlocked" onclick="openRecipeModal('${ST.currentSaison}',${ideeIdx})">
      <span class="action-prem-unlocked-emoji">${idee.emoji}</span>
      <div class="action-prem-unlocked-text">
        <div class="action-prem-unlocked-name">En savoir plus</div>
        <div class="action-prem-unlocked-sub">Pourquoi ce repas, pour toi →</div>
      </div>
      <span class="action-prem-unlocked-arrow">›</span>
    </div>`;
}

function openRecipeModal(phase, idx) {
  const idees = (typeof REPAS_QUOTIDIENS !== 'undefined' && REPAS_QUOTIDIENS[phase]) || [];
  const idee = idees[idx];
  if (!idee) return;
  const el = document.getElementById('recipe-modal-content');
  if (el) el.innerHTML = `
    <div style="font-size:48px;text-align:center;margin-bottom:14px;">${idee.emoji}</div>
    <div class="pmod-title">${idee.nom}</div>
    <div class="pmod-pourquoi">${idee.benefice}</div>
  `;
  document.getElementById('recipe-modal').classList.add('open');
}
function closeRecipeModal() { document.getElementById('recipe-modal').classList.remove('open'); }

function renderCarteSkincare(s) {
  const skin = s.skincare;
  if (!skin) return;

  const dur = effectiveCycleDur();
  const dayIdx = dayWithinPhase(ST.currentDay, dur);
  const soinPhase = (typeof SOINS_QUOTIDIENS !== 'undefined' && SOINS_QUOTIDIENS[ST.currentSaison]) || [];
  const soinJour = soinPhase.length ? soinPhase[dayIdx % soinPhase.length] : null;

  const actifEl = document.getElementById('dc-skin-actifs');
  if (actifEl) {
    if (soinJour) {
      const momentBadge = soinJour.moment
        ? `<span style="font-size:10px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;background:var(--season-light,#e8f7f2);color:var(--season,#3DAE8A);border-radius:4px;padding:2px 7px;margin-right:6px;">${soinJour.moment}</span>`
        : '';
      actifEl.innerHTML = `
        <div class="day-card-actif-row">
          <span class="day-card-actif-nom">${momentBadge}✨ ${soinJour.nom} <span class="dc-skin-duree">${soinJour.duree}</span></span>
          <span class="day-card-actif-usage">${soinJour.geste}</span>
        </div>`;
    } else {
      actifEl.innerHTML = (skin.actifs || []).slice(0, 2).map(a => `
        <div class="day-card-actif-row">
          <span class="day-card-actif-nom">${a.nom}</span>
          <span class="day-card-actif-usage">${a.usage}</span>
        </div>`).join('');
    }
  }

  const gestesEl = document.getElementById('dc-skin-gestes');
  if (gestesEl) {
    if (soinJour) {
      const sourceChip = soinJour.source
        ? `<span class="day-card-chip" style="opacity:.75;font-size:10px;">${soinJour.source}</span>`
        : '';
      gestesEl.innerHTML = `<span class="day-card-chip">💡 ${soinJour.benefice}</span>${sourceChip}`;
    } else {
      gestesEl.innerHTML = (skin.gestes || []).map(g => `<span class="day-card-chip">${g}</span>`).join('');
    }
  }

  const premEl = document.getElementById('action-soin-info');
  if (!premEl || !soinJour) return;
  const phaseEmoji = { hiver: '🌙', printemps: '🌿', ete: '☀️', automne: '🍂' }[ST.currentSaison] || '🌿';
  premEl.innerHTML = `
    <div class="action-unlocked" onclick="openSkinModal('${ST.currentSaison}')">
      <span class="action-prem-unlocked-emoji">${phaseEmoji}</span>
      <div class="action-prem-unlocked-text">
        <div class="action-prem-unlocked-name">En savoir plus</div>
        <div class="action-prem-unlocked-sub">Pourquoi ce soin, pour toi →</div>
      </div>
      <span class="action-prem-unlocked-arrow">›</span>
    </div>`;
}

function openSkinModal(phase) {
  const dur = effectiveCycleDur();
  const dayIdx = dayWithinPhase(ST.currentDay, dur);
  const soinPhase = (typeof SOINS_QUOTIDIENS !== 'undefined' && SOINS_QUOTIDIENS[phase]) || [];
  const soin = soinPhase.length ? soinPhase[dayIdx % soinPhase.length] : null;
  if (!soin) return;
  const el = document.getElementById('skin-modal-content');
  if (el) el.innerHTML = `
    <div style="font-size:40px;text-align:center;margin-bottom:12px;">✨</div>
    <div class="pmod-title">${soin.nom}</div>
    <div class="pmod-pourquoi">${soin.geste}</div>
    <div class="pmod-pourquoi" style="margin-top:8px;">${soin.benefice}</div>
    ${soin.source ? `<div style="font-size:11px;color:var(--gris);margin-top:14px;font-style:italic;">${soin.source}</div>` : ''}
  `;
  document.getElementById('skin-modal').classList.add('open');
}
function closeSkinModal() { document.getElementById('skin-modal').classList.remove('open'); }

function renderSuggestionsEngage(s) {
  const container = document.getElementById('sugg-engage-list');
  const countEl = document.getElementById('sugg-engage-count');
  if (!container) return;

  const selSugg = ST.selectedSugg || [];
  const done = selSugg.length;
  if (countEl) countEl.textContent = done + '/' + (s.suggestions?.length || 0) + ' faits';

  container.innerHTML = (s.suggestions || []).map((sg, i) => {
    const isSel = selSugg.includes(i);
    const emoji = sg.split(' ')[0];
    const label = sg.slice(sg.indexOf(' ') + 1);
    return `
      <div class="sugg-engage-item ${isSel ? 'done' : ''}" onclick="toggleHomeSuggestion(this, ${i})" data-idx="${i}">
        <div class="sugg-engage-chk">${isSel ? '✓' : ''}</div>
        <span class="sugg-engage-em">${emoji}</span>
        <span class="sugg-engage-lbl">${label}</span>
      </div>
    `;
  }).join('');
}

// ═══════════════════════════════════════════════
// CYCLE RENDER
// ═══════════════════════════════════════════════
function renderCycle(s) {
  const dur = effectiveCycleDur();
  const { springStartD: _spD, eteStartD: _etSF, eteEndD: _etEF } = phaseThresholds(dur);
  const _chs = document.getElementById('cycle-header-sub');
  if (_chs) _chs.textContent = s.nom + ' · Jour ' + ST.currentDay + ' sur ' + dur;
  const _cdn = document.getElementById('cycle-day-num'); if (_cdn) _cdn.textContent = ST.currentDay;
  const _csl = document.getElementById('cycle-season-label'); if (_csl) _csl.textContent = s.emoji + ' ' + s.nom;
  const remaining = Math.max(0, dur - ST.currentDay);
  const _cnu = document.getElementById('countdown-num'); if (_cnu) _cnu.textContent = remaining <= 0 ? '0' : remaining;
  const _clb = document.getElementById('countdown-label'); if (_clb) _clb.textContent = remaining <= 1 ? 'demain' : 'jours';
  const _cpn = document.getElementById('cycle-phase-name'); if (_cpn) _cpn.textContent = (s.phase||'').replace('Phase ','');
  const phaseMap = {
    hiver:     'J1 → J' + (_spD - 1),
    printemps: 'J' + _spD + ' → J' + (_etSF - 1),
    ete:       'J' + _etSF + ' → J' + _etEF,
    automne:   'J' + (_etEF + 1) + ' → J' + dur,
  };
  const _cpd = document.getElementById('cycle-phase-days'); if (_cpd) _cpd.textContent = phaseMap[ST.currentSaison] || '';

  // Afficher le bon bouton selon la saison actuelle
  const _bnh = document.getElementById('btn-nouveau-hiver');
  const _bfh = document.getElementById('btn-fin-hiver');
  const _isH = ST.currentSaison === 'hiver';
  if (_bnh) _bnh.style.display = (ST.currentSaison === 'automne') ? 'flex' : 'none';
  if (_bfh) _bfh.style.display = _isH ? 'flex' : 'none';

  drawCycleRing();

  // Symptômes
  renderSymptomes();
}

function startNewCycleToday() {
  const today = new Date();
  const todayStr = today.getFullYear() + '-' + String(today.getMonth()+1).padStart(2,'0') + '-' + String(today.getDate()).padStart(2,'0');
  if (ST.cycleStart === todayStr) return;
  if (!ST.cycleHistory) ST.cycleHistory = [];
  if (ST.cycleStart) {
    const snap = _bilanStats();
    ST.cycleHistory.unshift({
      start: ST.cycleStart,
      duration: ST.cycleDuration || 28,
      prayerDays: snap.prayerDays,
      symptomDays: snap.symptomDays,
    });
    if (ST.cycleHistory.length > 6) ST.cycleHistory = ST.cycleHistory.slice(0, 6);
  }
  ST.cycleStart = todayStr;
  ST.hiverEnd = null;
  ST._lastCycleNum = -1;

  saveState();
  computeCycle();
  applySaisonTheme();
  populateAll();
  showPhaseToast('🌙', 'Hiver déclaré', 'Prends soin de toi 🌙');
}

// dateStr optionnel (YYYY-MM-DD) : déclaration rétroactive de fin de règles.
// Sans argument, utilise la date du jour (comportement historique).
function declarerPrintemps(dateStr) {
  if (ST.currentSaison !== 'hiver') return;
  if (!ST.cycleStart) return;
  const today = new Date();
  const todayStr = today.getFullYear() + '-' + String(today.getMonth()+1).padStart(2,'0') + '-' + String(today.getDate()).padStart(2,'0');
  const finStr = dateStr || todayStr;
  if (finStr > todayStr) { showToast('Cette date ne peut pas être dans le futur 🌙'); return; }
  if (finStr < ST.cycleStart) { showToast('Cette date précède le début de tes règles 🌙'); return; }
  if (finStr === ST.cycleStart) { showToast('Les règles ne peuvent pas durer 0 jour.'); return; }
  if (ST.hiverEnd === finStr) { showToast('Printemps déjà déclaré à cette date ✓'); return; }
  ST.hiverEnd = finStr;
  saveState();
  computeCycle();
  applySaisonTheme();
  populateAll();
  showPhaseToast('🌸', 'Printemps déclaré', 'L\'énergie revient 🌸');
}

// Modale de sélection de date pour "Mon Hiver est terminé" — permet une
// déclaration rétroactive (règles terminées il y a X jours), pas seulement
// aujourd'hui.
function openFinHiverModal() {
  if (ST.currentSaison !== 'hiver') return;
  const today = new Date();
  const todayStr = today.getFullYear() + '-' + String(today.getMonth()+1).padStart(2,'0') + '-' + String(today.getDate()).padStart(2,'0');
  const dateInput = document.getElementById('fin-hiver-date');
  if (dateInput) {
    dateInput.value = todayStr;
    dateInput.max = todayStr;
    dateInput.min = ST.cycleStart || '';
  }
  const modal = document.getElementById('fin-hiver-modal');
  if (modal) modal.classList.add('open');
}
function closeFinHiverModal() {
  const modal = document.getElementById('fin-hiver-modal');
  if (modal) modal.classList.remove('open');
}
function confirmFinHiver() {
  const dateInput = document.getElementById('fin-hiver-date');
  const dateVal = dateInput ? dateInput.value : '';
  if (!dateVal) { showToast('Indique une date 🌙'); return; }
  closeFinHiverModal();
  declarerPrintemps(dateVal);
}

// ═══════════════════════════════════════════════
// SYMPTÔMES
// ═══════════════════════════════════════════════
function renderSymptomes() {
  const container = document.getElementById('symptomes-grid');
  if (!container) return;

  const liste = SYMPTOMES_PAR_PHASE[ST.currentSaison] || [];
  const today = new Date().toDateString();
  const selSymp = (ST.symptomes && ST.symptomes[today]) || [];

  const autreSelected = selSymp.includes('autre');
  const autreText = (ST.autreSymptomesText && ST.autreSymptomesText[today]) || '';

  container.innerHTML = liste.map(sy => {
    const isSel = selSymp.includes(sy.id);
    return `<div class="symptome-chip ${isSel ? 'selected' : ''}" onclick="toggleSymptome('${sy.id}', this)"><span class="symptome-chip-emoji">${sy.emoji}</span><span class="symptome-chip-text">${sy.label}</span></div>`;
  }).join('') + `<div class="symptome-chip ${autreSelected ? 'selected' : ''}" onclick="toggleSymptome('autre', this)"><span class="symptome-chip-emoji">✏️</span><span class="symptome-chip-text">Autre</span></div>`;

  const wrap = document.getElementById('autre-symptome-wrap');
  const inp = document.getElementById('autre-symptome-input');
  if (wrap) wrap.style.display = autreSelected ? 'block' : 'none';
  if (inp) inp.value = autreText;
}

function toggleSymptome(id, el) {
  const today = new Date().toDateString();
  if (!ST.symptomes) ST.symptomes = {};
  if (!ST.symptomes[today]) ST.symptomes[today] = [];
  const arr = ST.symptomes[today];
  const idx = arr.indexOf(id);
  if (idx > -1) arr.splice(idx, 1);
  else arr.push(id);
  el.classList.toggle('selected', arr.includes(id));
  if (id === 'autre') {
    const wrap = document.getElementById('autre-symptome-wrap');
    const inp = document.getElementById('autre-symptome-input');
    if (wrap) wrap.style.display = arr.includes('autre') ? 'block' : 'none';
    if (inp && arr.includes('autre')) setTimeout(() => inp.focus(), 50);
  }
  saveState();
}
function saveAutreSymptome(val) {
  const today = new Date().toDateString();
  if (!ST.autreSymptomesText) ST.autreSymptomesText = {};
  ST.autreSymptomesText[today] = val;
  saveState();
}
function validateAutreSymptome() {
  const inp = document.getElementById('autre-symptome-input');
  const confirm = document.getElementById('autre-symptome-confirm');
  if (inp) inp.blur();
  if (confirm) {
    confirm.style.display = 'block';
    setTimeout(() => { confirm.style.display = 'none'; }, 2000);
  }
}

function restoreSymptomes() {
  renderSymptomes();
}

// ═══════════════════════════════════════════════
// ÂME RENDER
// ═══════════════════════════════════════════════
function renderAme(s) {
  // Nom du jour
  showNomDuJour();
  updateAsmaCount();

  // Cacher les prières pendant hiver (règles)
  const prayersCard = document.getElementById('prayers-card');
  const hiverCard = document.getElementById('prayers-hiver-card');
  if (ST.currentSaison === 'hiver') {
    if (prayersCard) prayersCard.style.display = 'none';
    if (hiverCard) hiverCard.style.display = 'block';
  } else {
    if (prayersCard) prayersCard.style.display = '';
    if (hiverCard) hiverCard.style.display = 'none';
  }

  // Invocation du jour
  if (s.invocation) {
    const ia = document.getElementById('inv-arabic'); if (ia) ia.textContent = s.invocation.arabic;
    const it = document.getElementById('inv-translation'); if (it) it.textContent = s.invocation.fr;
    const isc = document.getElementById('inv-source'); if (isc) isc.textContent = s.invocation.source;
  }

  // Dhikr cases à cocher
  renderDhikrChecks();

  // Coran case à cocher — note juridique affichée pendant hiver (divergence savants)
  const coranNote = document.getElementById('coran-hiver-note');
  if (coranNote) coranNote.style.display = ST.currentSaison === 'hiver' ? 'block' : 'none';
  renderCoranCheck();

  // Lecture du jour
  renderLectureDuJour();
}

function _getLectureForPhase(phase) {
  if (typeof LECTURES === 'undefined') return null;
  return LECTURES.find(l => l.phase === phase) || null;
}

const _PHASE_LABELS = { hiver: 'HIVER', printemps: 'PRINTEMPS', ete: 'ÉTÉ', automne: 'AUTOMNE' };
const _PHASE_EMOJIS = { hiver: '🌙', printemps: '🌿', ete: '☀️', automne: '🍂' };

function renderLectureDuJour() {
  const card = document.getElementById('day-card-lecture');
  if (!card) return;

  const phase = ST.currentSaison || 'hiver';
  const lecture = _getLectureForPhase(phase);

  if (!lecture) { card.style.display = 'none'; return; }

  // Éléments existants
  const titreEl = document.getElementById('ldu-titre');
  const accrocheEl = document.getElementById('ldu-accroche');
  const dureeEl = document.getElementById('ldu-duree');

  // Nouveaux éléments
  const phaseEmojiEl = document.getElementById('ldu-phase-emoji');
  const statusIndicatorEl = document.getElementById('ldu-status-indicator');
  const checkEl = document.getElementById('ldu-check');
  const btnTextEl = document.getElementById('ldu-btn-text');

  // Remplir les données
  if (titreEl) titreEl.textContent = lecture.titre;
  if (accrocheEl) accrocheEl.textContent = lecture.accroche;
  if (dureeEl) dureeEl.textContent = lecture.duree + ' min';

  // Emoji de phase
  if (phaseEmojiEl) phaseEmojiEl.textContent = _PHASE_EMOJIS[phase] || '🌸';

  // Masquer la carte si déjà lue
  const isRead = ST.lecturesLues && ST.lecturesLues.some(l => l.id === lecture.id);
  if (isRead) { card.style.display = 'none'; return; }

  card.style.display = 'block';
}

let currentLectureInModal = null;

function openLectureModal(lectureId) {
  let lecture, phase;

  if (lectureId) {
    // Ouvrir une lecture spécifique par ID
    if (typeof LECTURES === 'undefined') return;
    lecture = LECTURES.find(l => l.id === lectureId);
    if (!lecture) return;
    phase = lecture.phase;
  } else {
    // Ouvrir la lecture du jour (comportement existant)
    phase = ST.currentSaison || 'hiver';
    lecture = _getLectureForPhase(phase);
    if (!lecture) return;
  }

  // Stocker la lecture actuelle pour le bouton "J'ai lu"
  currentLectureInModal = lecture;

  const el = (id) => document.getElementById(id);
  if (el('lm-emoji')) el('lm-emoji').textContent = _PHASE_EMOJIS[phase] || '';
  if (el('lm-phase')) el('lm-phase').textContent = _PHASE_LABELS[phase] || phase.toUpperCase();
  if (el('lm-duree')) el('lm-duree').textContent = lecture.duree + ' min';
  if (el('lm-titre')) el('lm-titre').textContent = lecture.titre;
  if (el('lm-accroche')) el('lm-accroche').textContent = lecture.accroche;
  if (el('lm-corps')) el('lm-corps').innerHTML = lecture.corps.replace(/\n\n/g, '</p><p style="margin-top:12px;">').replace(/^/, '<p>').replace(/$/, '</p>');
  if (el('lm-pensee')) el('lm-pensee').textContent = '« ' + lecture.aEmporter.pensee + ' »';
  if (el('lm-geste')) el('lm-geste').innerHTML = '🌿 ' + lecture.aEmporter.geste;

  const isSoi = lecture.type === 'soi';

  // Bloc source islamique (type ame) vs idée centrale (type soi)
  if (el('lm-source-block')) el('lm-source-block').style.display = isSoi ? 'none' : 'block';
  if (el('lm-idee-block'))   el('lm-idee-block').style.display   = isSoi ? 'block' : 'none';

  if (!isSoi && lecture.source) {
    if (el('lm-arabe')) el('lm-arabe').textContent = lecture.source.arabe || '';
    if (el('lm-fr'))    el('lm-fr').textContent    = lecture.source.fr ? '« ' + lecture.source.fr + ' »' : '';
    if (el('lm-ref'))   el('lm-ref').textContent   = lecture.source.ref || '';
  }
  if (isSoi) {
    if (el('lm-idee')) el('lm-idee').textContent = lecture.idee || '';
  }

  // Bloc du'a (type ame) vs question (type soi)
  if (el('lm-dua-block'))      el('lm-dua-block').style.display      = isSoi ? 'none' : 'block';
  if (el('lm-question-block')) el('lm-question-block').style.display = isSoi ? 'block' : 'none';

  if (!isSoi && lecture.aEmporter.dua) {
    if (el('lm-dua-arabe')) el('lm-dua-arabe').textContent = lecture.aEmporter.dua.arabe || '';
    if (el('lm-dua-fr'))    el('lm-dua-fr').textContent    = lecture.aEmporter.dua.fr    || '';
  }
  if (isSoi) {
    if (el('lm-question')) el('lm-question').textContent = lecture.aEmporter.question || '';
  }

  // Mettre à jour le bouton "J'ai lu"
  updateArchiveBtnInModal(lecture);

  const modal = el('lecture-modal');
  if (modal) { modal.classList.add('open'); document.body.style.overflow = 'hidden'; }
}

function updateArchiveBtnInModal(lecture) {
  const btn = document.getElementById('lm-archive-btn');
  if (!btn || !lecture) return;

  const dejaLue = ST.lecturesLues && ST.lecturesLues.find(l => l.id === lecture.id);

  if (dejaLue) {
    btn.textContent = 'Lu ✓';
    btn.style.background = 'var(--season-soft)';
    btn.style.color = 'var(--season)';
    btn.disabled = true;
  } else {
    btn.textContent = 'J\'ai lu ✓';
    btn.style.background = 'var(--season)';
    btn.style.color = 'white';
    btn.disabled = false;
  }
}

function archiverLectureFromModal() {
  if (!currentLectureInModal) return;

  archiverLecture(currentLectureInModal.id, currentLectureInModal.phase);
  updateArchiveBtnInModal(currentLectureInModal);
}

function closeLectureModal() {
  const modal = document.getElementById('lecture-modal');
  if (modal) { modal.classList.remove('open'); document.body.style.overflow = ''; }
  currentLectureInModal = null;
}

// ── Nouvelles fonctions Mes Lectures ──

// Fonction supprimée car la carte lecture de l'accueil n'existe plus

function archiverLecture(lectureId, phase) {
  if (!ST.lecturesLues) ST.lecturesLues = [];

  // Vérifier si déjà archivée
  const dejaArchivee = ST.lecturesLues.find(l => l.id === lectureId);
  if (dejaArchivee) return;

  const lecture = (typeof LECTURES !== 'undefined') ? LECTURES.find(l => l.id === lectureId) : null;
  if (!lecture) return;

  ST.lecturesLues.push({
    id: lectureId,
    titre: lecture.titre,
    phase: lecture.phase,
    date: new Date().toISOString()
  });

  saveState();
  showToast('Retrouve-la dans Mes Lectures 📚', 3000);
  renderLectureDuJour();
}

// Fonction supprimée car le bouton J'ai lu de l'accueil n'existe plus

function openMesLecturesModal() {
  const modal = document.getElementById('mes-lectures-modal');
  if (modal) { modal.style.display = 'flex'; renderMesLecturesModal(); }
}

function closeMesLecturesModal() {
  const modal = document.getElementById('mes-lectures-modal');
  if (modal) modal.style.display = 'none';
}

function openLectureModalById(id) {
  openLectureModal(id);
}

function renderMesLecturesModal() {
  if (typeof LECTURES === 'undefined') return;

  const content = document.getElementById('mes-lectures-modal-content');
  if (!content) return;

  const phases = ['hiver', 'printemps', 'ete', 'automne'];
  const emojis = { hiver: '🌙', printemps: '🌿', ete: '☀️', automne: '🍂' };
  const labels = { hiver: 'Hiver', printemps: 'Printemps', ete: 'Été', automne: 'Automne' };
  const currentPhase = ST.currentSaison || 'hiver';

  let html = '';

  phases.forEach(phase => {
    const lecturesPhase = LECTURES.filter(l => l.phase === phase);
    const lecturesLues = (ST.lecturesLues || []).filter(l => l.phase === phase);
    const isCurrentPhase = phase === currentPhase;

    html += `
      <div style="margin-bottom:12px;">
        <button onclick="toggleMesLecturesPhase('${phase}')"
                style="width:100%;display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:white;border:1.5px solid var(--sable);border-radius:16px;cursor:pointer;font-family:inherit;">
          <div style="display:flex;align-items:center;gap:10px;">
            <span style="font-size:16px;">${emojis[phase]}</span>
            <span style="font-size:14px;font-weight:600;color:var(--noir);">${labels[phase]}</span>
            <span style="font-size:10px;color:var(--gris);">(${lecturesLues.length}/${lecturesPhase.length})</span>
          </div>
          <span id="phase-arrow-${phase}" style="font-size:12px;color:var(--gris);transition:transform .25s;">${isCurrentPhase ? '▲' : '▼'}</span>
        </button>

        <div id="phase-body-${phase}" style="display:${isCurrentPhase ? 'block' : 'none'};padding:12px 0;">
    `;

    lecturesPhase.forEach(lecture => {
      const estLue = lecturesLues.find(l => l.id === lecture.id);

      html += `
        <div style="display:flex;align-items:center;gap:12px;padding:12px;background:${estLue ? 'var(--season-soft)' : 'white'};border-radius:12px;margin-bottom:8px;border:1px solid var(--sable);">
          <div style="flex:1;min-width:0;">
            <div style="font-size:13px;font-weight:600;color:var(--noir);margin-bottom:2px;display:flex;align-items:center;gap:6px;">
              ${lecture.titre}
              ${estLue ? '<span style="font-size:10px;color:var(--season);font-weight:700;">Lu ✓</span>' : ''}
            </div>
            <div style="font-size:11px;color:var(--gris);line-height:1.4;font-style:italic;">${lecture.accroche}</div>
            <div style="font-size:10px;color:var(--gris);margin-top:4px;">
              <span style="background:rgba(var(--season-rgb),.1);padding:2px 6px;border-radius:6px;">${lecture.duree} min</span>
            </div>
          </div>
          <button onclick="openLectureModalById('${lecture.id}')"
                  style="background:var(--season);color:white;border:none;border-radius:8px;padding:6px 12px;font-size:11px;font-weight:600;cursor:pointer;flex-shrink:0;">
            Lire →
          </button>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;
  });

  content.innerHTML = html;
}

function toggleMesLecturesPhase(phase) {
  const body = document.getElementById(`phase-body-${phase}`);
  const arrow = document.getElementById(`phase-arrow-${phase}`);

  if (!body || !arrow) return;

  const isOpen = body.style.display !== 'none';

  if (isOpen) {
    body.style.display = 'none';
    arrow.textContent = '▼';
  } else {
    body.style.display = 'block';
    arrow.textContent = '▲';
  }
}


// ── Dhikr cases à cocher ──
function renderDhikrChecks() {
  const container = document.getElementById('dhikr-check-items');
  if (!container) return;
  const today = new Date().toDateString();
  const checks = (ST.dhikrChecks && ST.dhikrChecks[today]) || {};

  container.innerHTML = DHIKR_CHECKS.map(d => {
    const isDone = !!checks[d.id];
    const verseHtml = d.verse ? `<div style="font-size:10px;color:var(--gris);font-style:italic;line-height:1.5;margin-top:5px;padding-top:5px;border-top:1px solid var(--sable);">${d.verse}</div>` : '';
    return `
      <div class="dhikr-check-item ${isDone ? 'done' : ''}" onclick="toggleDhikrCheck('${d.id}', this)" style="${d.verse ? 'align-items:flex-start;' : ''}">
        <div class="dhikr-check-box" style="${d.verse ? 'margin-top:4px;' : ''}">${isDone ? '✓' : ''}</div>
        <div class="dhikr-check-content" style="flex:1;">
          <div class="dhikr-check-arabic">${d.arabic}</div>
          <div class="dhikr-check-fr">${d.fr}</div>
          ${verseHtml}
        </div>
        <div class="dhikr-check-count" style="${d.verse ? 'margin-top:4px;' : ''}">${d.count}</div>
      </div>
    `;
  }).join('');
}

function toggleDhikrCheck(id, el) {
  const today = new Date().toDateString();
  if (!ST.dhikrChecks) ST.dhikrChecks = {};
  if (!ST.dhikrChecks[today]) ST.dhikrChecks[today] = {};
  ST.dhikrChecks[today][id] = !ST.dhikrChecks[today][id];
  el.classList.toggle('done', ST.dhikrChecks[today][id]);
  const box = el.querySelector('.dhikr-check-box');
  if (box) box.textContent = ST.dhikrChecks[today][id] ? '✓' : '';
  saveState();

  const done = Object.values(ST.dhikrChecks[today]).filter(Boolean).length;
  if (done === DHIKR_CHECKS.length) showToast('📿 Alhamdulillah — tous les adhkar du jour ! 🌸');
}

function restoreDhikrChecks() {
  renderDhikrChecks();
}

// ── Coran case à cocher ──
function renderCoranCheck() {
  const inner = document.getElementById('coran-check-inner');
  if (!inner) return;
  const today = new Date().toDateString();
  const isDone = ST.coranDone && ST.coranDone[today];

  inner.className = 'coran-check-inner' + (isDone ? ' done' : '');
  const box = inner.querySelector('.coran-check-box');
  if (box) box.textContent = isDone ? '✓' : '📖';
}

function toggleCoranCheck() {
  const today = new Date().toDateString();
  if (!ST.coranDone) ST.coranDone = {};
  ST.coranDone[today] = !ST.coranDone[today];
  saveState();
  renderCoranCheck();
  if (ST.coranDone[today]) showToast('📖 Barak Allahou fik — la lecture du Coran est faite 🌸');
}

function restoreCoranCheck() {
  renderCoranCheck();
}

// ═══════════════════════════════════════════════
// MOI RENDER
// ═══════════════════════════════════════════════
function renderMoi(s) {
  const _heroIcons = { hiver:'🌙', printemps:'🌿', ete:'☀️', automne:'🍂' };
  const _heroMsgs  = {
    hiver:    'Prends soin de toi aujourd\'hui 🤍',
    printemps:'L\'énergie revient, profites-en ✨',
    ete:      'Tu rayonnes aujourd\'hui ☀️',
    automne:  'Douceur et bienveillance 🍂'
  };
  const _icon = document.getElementById('moi-hero-icon');  if (_icon)  _icon.textContent  = _heroIcons[ST.currentSaison] || s.emoji;
  const _nm   = document.getElementById('moi-hero-name');  if (_nm)    _nm.textContent    = ST.prenom || '';
  const _bdg  = document.getElementById('moi-hero-badge'); if (_bdg)   _bdg.textContent   = s.nom + ' · Jour ' + ST.currentDay;
  const _msg  = document.getElementById('moi-hero-msg');   if (_msg)   _msg.textContent   = _heroMsgs[ST.currentSaison] || '';
  // Auth row
  const lbl = document.getElementById('ps-auth-lbl');
  const sub = document.getElementById('ps-auth-sub');
  const row = document.getElementById('ps-auth-row');
  if (lbl && sub && row) {
    if (ST.supabaseEmail) {
      lbl.textContent = 'Connectée ✓';
      sub.textContent = ST.supabaseEmail;
      row.onclick = openCompteModal;
    } else {
      lbl.textContent = 'Se connecter';
      sub.textContent = 'Sauvegarde tes données sur tous tes appareils';
      row.onclick = openReconnectFromNudge;
    }
  }

  // Bouton installation PWA
  _renderPwaInstallButton();

  renderMoiBilan();
  renderCycleHistory();
}

function openCompteModal() {
  const el = document.getElementById('compte-modal');
  const disp = document.getElementById('compte-email-display');
  if (disp) disp.textContent = ST.supabaseEmail || ST.userEmail || '—';
  if (el) el.classList.add('open');
}
function openChangeEmail() {
  document.getElementById('compte-modal').classList.remove('open');
  // Reset état du modal
  document.getElementById('change-email-step1').style.display = '';
  document.getElementById('change-email-step2').style.display = 'none';
  document.getElementById('change-email-input').value = '';
  document.getElementById('change-email-msg').textContent = '';
  const btn = document.getElementById('change-email-btn');
  if (btn) { btn.disabled = false; btn.textContent = 'Envoyer le lien de confirmation'; }
  document.getElementById('change-email-modal').classList.add('open');
}

async function submitChangeEmail() {
  const input = document.getElementById('change-email-input');
  const msg = document.getElementById('change-email-msg');
  const btn = document.getElementById('change-email-btn');
  const newEmail = (input?.value || '').trim().toLowerCase();

  if (!newEmail || !newEmail.includes('@')) {
    msg.style.color = '#C46B50';
    msg.textContent = 'Entre une adresse email valide.';
    return;
  }
  if (newEmail === (ST.supabaseEmail || '').toLowerCase()) {
    msg.style.color = '#C46B50';
    msg.textContent = 'C\'est déjà ton adresse actuelle.';
    return;
  }

  btn.disabled = true;
  btn.textContent = '…';
  msg.textContent = '';

  try {
    const sb = await initSupabase();
    if (!sb) throw new Error('no_supabase');
    const { data: { session } } = await sb.auth.getSession();
    if (!session) throw new Error('session_missing');
    const { error } = await sb.auth.updateUser({ email: newEmail });
    if (error) throw error;

    // Succès
    document.getElementById('change-email-step1').style.display = 'none';
    const txt = document.getElementById('change-email-confirm-txt');
    if (txt) { const safe = newEmail.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); txt.innerHTML = `Un email de confirmation a été envoyé à <strong>${safe}</strong>.<br><br>Vérifie ta boîte mail et tes spams.`; }
    document.getElementById('change-email-step2').style.display = '';
  } catch (e) {
    const raw = (e.message || '').toLowerCase();
    let errFr = 'Une erreur est survenue. Réessaie dans quelques instants.';
    if (raw.includes('no_supabase'))       errFr = 'Connexion indisponible. Réessaie dans quelques instants.';
    else if (raw.includes('session_missing') || raw.includes('auth session missing')) errFr = 'Ta session a expiré. Reconnecte-toi puis réessaie.';
    else if (raw.includes('already') || raw.includes('registered'))  errFr = 'Cette adresse est déjà utilisée par un autre compte.';
    else if (raw.includes('invalid') || raw.includes('valid email')) errFr = 'Adresse email invalide.';
    else if (raw.includes('rate limit') || raw.includes('too many')) errFr = 'Trop de tentatives. Attends quelques minutes et réessaie.';
    msg.style.color = '#C46B50';
    msg.textContent = errFr;
    btn.disabled = false;
    btn.textContent = 'Envoyer le lien de confirmation';
  }
}
function confirmSignOut() {
  document.getElementById('compte-modal').classList.remove('open');
  ST.isAuthenticated = false; ST.userEmail = null; ST.supabaseUserId = null; ST.supabaseEmail = null;
  clearAuthCookie(); saveState(); // saveState AVANT manualSignOut pour ne pas le persister
  ST.manualSignOut = true;
  initSupabase().then(sb => { if (sb) sb.auth.signOut(); });
  showAuthScreen();
}

function renderMoiBilan() {
  const card = document.getElementById('moi-bilan-card');
  const body = document.getElementById('moi-bilan-body');
  if (!card || !body) return;
  if (!ST.cycleStart) { card.style.display = 'none'; return; }
  card.style.display = 'block';

  const { symptomDays, prayerDays, allPrayersDays, dhikrDays, coranDays, objCheckCount } = _bilanStats();
  const joursSuivis = ST.currentDay || 1;
  const dur = ST.cycleDuration || 28;

  // Top symptôme
  const sympCount = {};
  const sympMeta = {};
  Object.values(SYMPTOMES_PAR_PHASE || {}).flat().forEach(s => { if (s && s.id) sympMeta[s.id] = s; });
  Object.values(ST.symptomes || {}).forEach(arr => (arr || []).forEach(id => {
    if (id !== 'autre') sympCount[id] = (sympCount[id] || 0) + 1;
  }));
  const topEntry = Object.entries(sympCount).sort((a, b) => b[1] - a[1])[0];
  const topMeta = topEntry ? sympMeta[topEntry[0]] : null;

  // Progression du cycle actuel (barre)
  const pct = Math.min(100, Math.round((joursSuivis / dur) * 100));
  const s = SAISONS[ST.currentSaison] || {};

  body.innerHTML = `
    <div style="margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">
        <span style="font-size:11px;color:var(--gris);">Cycle actuel · Jour ${joursSuivis} / ${dur}</span>
        <span style="font-size:11px;font-weight:600;color:var(--season);">${s.nom || ''} ${s.emoji || ''}</span>
      </div>
      <div style="height:6px;background:var(--sable);border-radius:4px;overflow:hidden;">
        <div style="height:100%;width:${pct}%;background:var(--season-grad);border-radius:4px;transition:width .4s;"></div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:10px;">
      <div style="background:var(--creme);border-radius:12px;padding:10px 6px;text-align:center;">
        <div style="font-size:20px;font-weight:700;color:var(--noir);font-family:var(--serif);">${prayerDays}</div>
        <div style="font-size:8px;color:var(--gris);margin-top:2px;line-height:1.3;">jours<br>3+ prières</div>
      </div>
      <div style="background:var(--creme);border-radius:12px;padding:10px 6px;text-align:center;">
        <div style="font-size:20px;font-weight:700;color:var(--noir);font-family:var(--serif);">${dhikrDays + coranDays}</div>
        <div style="font-size:8px;color:var(--gris);margin-top:2px;line-height:1.3;">jours<br>dhikr/Coran</div>
      </div>
      <div style="background:var(--creme);border-radius:12px;padding:10px 6px;text-align:center;">
        <div style="font-size:20px;font-weight:700;color:var(--noir);font-family:var(--serif);">${objCheckCount}</div>
        <div style="font-size:8px;color:var(--gris);margin-top:2px;line-height:1.3;">objectifs<br>cochés</div>
      </div>
    </div>
    ${topMeta ? `<div style="font-size:11px;color:var(--gris);margin-bottom:6px;">Symptôme fréquent : <span style="background:var(--creme);border-radius:8px;padding:2px 8px;">${topMeta.emoji} ${topMeta.label} · ${topEntry[1]}×</span></div>` : ''}
    ${symptomDays > 0 ? `<div style="font-size:11px;color:var(--gris);">${symptomDays} jour${symptomDays > 1 ? 's' : ''} d'écoute de ton corps 🌸</div>` : ''}
  `;
}

// ═══════════════════════════════════════════════
// ONBOARDING
// ═══════════════════════════════════════════════
let selectedDuration = 28;
function selectDuration(el, val) {
  document.querySelectorAll('#duration-options .ob-option').forEach(o => { o.classList.remove('selected'); });
  el.classList.add('selected');
  selectedDuration = val;
}

let selectedDureeRegles = 5;
function selectDureeRegles(el, val) {
  document.querySelectorAll('#duree-regles-options .ob-option').forEach(o => { o.classList.remove('selected'); });
  el.classList.add('selected');
  selectedDureeRegles = val;
}

function checkDailyReset() {
  const today = new Date().toDateString();
  if (ST.lastDailyReset === today) return;
  // Réinitialiser uniquement les états non datés
  ST.selectedSugg = [];
  ST.glaire = null;
  ST.glaireDate = null;
  ST.checkin = null;
  ST.checkinDate = null;
  ST.calmeOverride = null;
  ST.eveningCheckinDate = null;
  ST.eveningCheckinMood = null;
  // Élaguer les entrées vieilles de plus de 30 jours pour limiter le localStorage
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  ['prayers','dhikrChecks','coranDone','symptomes','autreSymptomesText'].forEach(key => {
    if (!ST[key] || typeof ST[key] !== 'object') return;
    Object.keys(ST[key]).forEach(k => { if (new Date(k) < cutoff) delete ST[key][k]; });
  });
  ST.lastDailyReset = today;
  saveState();
}

// ═══════════════════════════════════════════════
// OBJECTIFS
// ═══════════════════════════════════════════════

function _getWeekKey() {
  const now = new Date();
  const day = now.getDay() || 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day - 1));
  return monday.toISOString().split('T')[0];
}

function _getPhaseForSuggestions() {
  const checkin = ST.checkin;
  if (checkin === 'calme' || checkin === 'fatiguee') return 'hiver';
  return ST.currentSaison || 'printemps';
}

function _getSuggestionsJour(phase) {
  const pool = OBJECTIFS_PAR_PHASE[phase] || OBJECTIFS_PAR_PHASE.printemps;
  const dayNum = Math.floor(Date.now() / 86400000);
  const PRAYER_WORDS = ['prière', 'prières', '5 prières'];

  const pick = (cat) => {
    let items = pool[cat] || [];
    if (phase === 'hiver') items = items.filter(t => !PRAYER_WORDS.some(kw => t.toLowerCase().includes(kw)));
    if (!items.length) return null;
    const idx = dayNum % items.length;
    return { id: `${phase}_${cat}_${idx}`, cat, texte: items[idx] };
  };

  const rotating = ['maison', 'famille', 'apprentissage', 'projet', 'croissance'];
  const r = dayNum % rotating.length;
  return ['spiritualite', 'soin', rotating[r], rotating[(r + 1) % 5], rotating[(r + 2) % 5]]
    .map(pick)
    .filter(Boolean);
}

function recordObjectifHistory(id, source, texte, categorie) {
  const todayStr = new Date().toISOString().slice(0, 10);
  if (!ST.objHistory) ST.objHistory = [];

  // Déterminer le texte et la catégorie depuis l'ID pour les suggestions
  if (source === 'suggestion' && !texte) {
    const phase = _getPhaseForSuggestions();
    const suggestions = _getSuggestionsJour(phase);
    const suggestion = suggestions.find(s => s.id === id);
    if (suggestion) {
      texte = suggestion.texte;
      categorie = suggestion.cat;
    }
  }

  // Si on n'arrive pas à déterminer les infos, on skip
  if (!texte || !categorie) return;

  ST.objHistory.push({
    date: todayStr,
    categorie: categorie,
    texte: texte,
    source: source
  });

  // Limiter à 500 entrées max (FIFO)
  if (ST.objHistory.length > 500) {
    ST.objHistory = ST.objHistory.slice(-500);
  }
}

function renderObjectifs() {
  renderObjSummary();
  renderSuggestionsJour();
  renderCategoriesGrid();
  renderObjPerso();
  renderCalendar();
}

function renderObjSummary() {
  const weekKey = _getWeekKey();
  const todayStr = new Date().toISOString().slice(0, 10); // Format YYYY-MM-DD pour consistance
  const checks = (ST.weeklyObjChecks && ST.weeklyObjChecks[weekKey]) || {};
  const customChecks = (ST.customObjChecks && ST.customObjChecks[weekKey]) || {};

  const donePhase = Object.values(checks).filter(arr => (arr || []).includes(todayStr)).length;
  const donePerso = Object.values(customChecks).filter(arr => (arr || []).includes(todayStr)).length;
  const doneToday = donePhase + donePerso;

  const summaryEmojis = ['🌱', '🌸', '⚡', '🔥', '✨'];
  const summaryEmoji = summaryEmojis[Math.min(doneToday, summaryEmojis.length - 1)];
  const msg = doneToday === 0 ? 'Commence ta journée ✦' : doneToday >= 4 ? 'Mashaa Allah — quelle journée !' : 'Tu avances — continue';
  const summaryCard = document.getElementById('obj-summary-card');
  if (!summaryCard) return;
  summaryCard.innerHTML = `
    <div class="obj-summary-emoji">${summaryEmoji}</div>
    <div class="obj-summary-text">
      <div class="obj-summary-count">${doneToday} accompli${doneToday > 1 ? 's' : ''} aujourd'hui</div>
      <div class="obj-summary-label">${msg}</div>
    </div>`;
}

function renderSuggestionsJour() {
  const phase = _getPhaseForSuggestions();
  const suggestions = _getSuggestionsJour(phase);
  const weekKey = _getWeekKey();
  const todayStr = new Date().toISOString().slice(0, 10); // Format YYYY-MM-DD pour consistance
  const checks = (ST.weeklyObjChecks && ST.weeklyObjChecks[weekKey]) || {};
  const phaseLabel = { hiver: '🌙 Hiver', printemps: '🌿 Printemps', ete: '☀️ Été', automne: '🍂 Automne' }[phase] || '';
  const container = document.getElementById('obj-suggestions-list');
  if (!container) return;
  container.innerHTML = suggestions.map(s => {
    const catInfo = OBJECTIFS_CATEGORIES[s.cat] || {};
    const done = (checks[s.id] || []).includes(todayStr);
    return `
      <div class="obj-item ${done ? 'done' : ''}" onclick="toggleSuggestion('${s.id}')">
        <div class="obj-check">${done ? '✓' : ''}</div>
        <div class="obj-content">
          <div class="obj-label">${catInfo.icon || ''} ${_esc(s.texte)}</div>
          <div class="obj-phase-tag">${phaseLabel}</div>
        </div>
      </div>`;
  }).join('') || '<div class="obj-empty">Reviens demain pour de nouvelles suggestions ✨</div>';
}

function renderCategoriesGrid() {
  const phase = _getPhaseForSuggestions();
  const container = document.getElementById('obj-categories-grid');
  if (!container) return;

  const categoryItems = Object.entries(OBJECTIFS_CATEGORIES).map(([key, cat]) => {
    const phaseCount = ((OBJECTIFS_PAR_PHASE[phase] || {})[key] || []).length;
    const persoCount = (ST.customObjectifs || []).filter(o => o.categorie === key).length;
    const total = phaseCount + persoCount;
    const badge = persoCount ? `<span class="obj-cat-perso-dot"></span>` : '';
    return `
      <div class="obj-cat-item" onclick="openObjCatModal('${key}')">
        <div class="obj-cat-icon">${cat.icon}${badge}</div>
        <div class="obj-cat-label">${cat.label}</div>
        <div class="obj-cat-count">${total}</div>
      </div>`;
  });

  categoryItems.push(`
    <div class="obj-cat-item" onclick="openObjAddModal()" style="border: 2px dashed var(--sable); background: var(--creme);">
      <div class="obj-cat-icon" style="font-size: 24px;">+</div>
      <div class="obj-cat-label" style="font-size: 12px;">Ajouter</div>
      <div class="obj-cat-count"></div>
    </div>`);

  container.innerHTML = categoryItems.join('');
}

function openObjCatModal(catKey) {
  const phase = _getPhaseForSuggestions();
  const cat = OBJECTIFS_CATEGORIES[catKey] || {};
  const phaseItems = ((OBJECTIFS_PAR_PHASE[phase] || {})[catKey]) || [];
  const weekKey = _getWeekKey();
  const todayStr = new Date().toISOString().slice(0, 10);
  const checks = (ST.weeklyObjChecks && ST.weeklyObjChecks[weekKey]) || {};
  const customChecks = (ST.customObjChecks && ST.customObjChecks[weekKey]) || {};
  const phaseLabel = { hiver: '🌙 Hiver', printemps: '🌿 Printemps', ete: '☀️ Été', automne: '🍂 Automne' }[phase] || '';

  // Tâches perso de cette catégorie avec leur index global (pour customObjChecks)
  const catCustom = (ST.customObjectifs || []).map((o, idx) => ({ o, idx })).filter(({ o }) => o.categorie === catKey);
  const maxReached = catCustom.length >= 4;

  const content = document.getElementById('obj-cat-modal-content');
  if (!content) return;

  // Section suggestions de phase
  let suggestHtml = '';
  if (phaseItems.length) {
    suggestHtml = '<div class="obj-cat-section-lbl">✨ Suggestions ' + phaseLabel + '</div><div>'
      + phaseItems.map((texte, i) => {
          const id = phase + '_' + catKey + '_' + i;
          const done = (checks[id] || []).includes(todayStr);
          return '<div class="obj-item' + (done ? ' done' : '') + '" style="margin:0 16px 2px;border-radius:12px;"'
            + ' onclick="toggleSuggestion(\'' + id + '\');openObjCatModal(\'' + catKey + '\')">'
            + '<div class="obj-check">' + (done ? '✓' : '') + '</div>'
            + '<div class="obj-content"><div class="obj-label" style="font-size:13px;">' + _esc(texte) + '</div></div>'
            + '</div>';
        }).join('')
      + '</div>';
  }

  // Section tâches perso
  const recLabels = { today: 'Aujourd\'hui', phase: 'Cette phase', cycle: 'Ce cycle', permanent: 'Toujours' };
  const persoHtml = catCustom.map(({ o, idx }) => {
    const done = (customChecks[idx] || []).includes(todayStr);
    const recTag = recLabels[o.recurrence] || '';
    return '<div class="obj-item' + (done ? ' done' : '') + '" style="margin:0 16px 2px;border-radius:12px;"'
      + ' onclick="toggleCatCustom(\'' + o.id + '\',\'' + catKey + '\')">'
      + '<div class="obj-check">' + (done ? '✓' : '') + '</div>'
      + '<div class="obj-content">'
      + '<div class="obj-label" style="font-size:13px;">' + _esc(o.texte) + '</div>'
      + '<div class="obj-phase-tag">' + recTag + '</div>'
      + '</div>'
      + '<span onclick="event.stopPropagation();removeCatPerso(\'' + o.id + '\',\'' + catKey + '\')"'
      + ' style="font-size:18px;color:var(--gris);padding:0 6px;flex-shrink:0;line-height:1">×</span>'
      + '</div>';
  }).join('');

  // Formulaire ajout inline
  const addHtml = maxReached
    ? '<div style="text-align:center;font-size:11px;color:var(--gris);padding:8px 20px 0;">Maximum 4 tâches atteint 🌸</div>'
    : '<div class="cat-perso-add-row">'
      + '<input id="cat-perso-input" type="text" placeholder="Ajouter une tâche…" maxlength="60"'
      + ' onkeydown="if(event.key===\'Enter\'){event.preventDefault();addCatPerso(\'' + catKey + '\');}">'
      + '<button onclick="addCatPerso(\'' + catKey + '\')">+</button>'
      + '</div>'
      + '<div style="padding:0 16px 4px;">'
      + '<select id="cat-perso-rec" class="obj-rec-select" style="width:100%;font-size:12px;padding:7px 10px;">'
      + '<option value="permanent">Toujours visible</option>'
      + '<option value="phase">Cette phase seulement</option>'
      + '<option value="today">Aujourd\'hui seulement</option>'
      + '</select>'
      + '</div>';

  content.innerHTML = '<div class="modal-handle"></div>'
    + '<div style="padding:0 20px 4px;font-size:17px;font-weight:700;color:var(--noir)">' + (cat.icon || '') + ' ' + (cat.label || '') + '</div>'
    + suggestHtml
    + '<div class="obj-cat-section-lbl">📌 Mes tâches <span style="margin-left:auto;font-size:10px;color:var(--gris)">' + catCustom.length + '/4</span></div>'
    + persoHtml
    + addHtml
    + '<button onclick="closeObjCatModal()" class="modal-cta" style="margin:16px 20px 4px;width:calc(100% - 40px);">Fermer</button>';

  document.getElementById('obj-cat-modal').classList.add('open');
  if (!maxReached) setTimeout(() => { const inp = document.getElementById('cat-perso-input'); if (inp) inp.focus(); }, 150);
}

function addCatPerso(catKey) {
  const inp = document.getElementById('cat-perso-input');
  if (!inp) return;
  const texte = inp.value.trim();
  if (!texte) { inp.focus(); return; }
  if (!ST.customObjectifs) ST.customObjectifs = [];
  const catCount = ST.customObjectifs.filter(o => o.categorie === catKey).length;
  if (catCount >= 4) { showToast('Maximum 4 tâches par catégorie 🌸'); return; }
  const recEl = document.getElementById('cat-perso-rec');
  const recurrence = recEl ? recEl.value : 'permanent';
  const todayStr = new Date().toISOString().slice(0, 10);
  ST.customObjectifs.push({ id: 'perso_' + Date.now(), texte, recurrence, categorie: catKey, cree_le: todayStr, phase_cree: ST.currentSaison || 'printemps' });
  saveState();
  renderCategoriesGrid();
  renderObjPerso();
  openObjCatModal(catKey);
}

function removeCatPerso(id, catKey) {
  if (!ST.customObjectifs) return;
  const idx = ST.customObjectifs.findIndex(o => o.id === id);
  if (idx === -1) return;
  ST.customObjectifs.splice(idx, 1);
  if (ST.customObjChecks) {
    Object.keys(ST.customObjChecks).forEach(wk => {
      const week = ST.customObjChecks[wk];
      if (!week) return;
      const rebuilt = {};
      Object.keys(week).forEach(k => { const ki = parseInt(k); if (ki < idx) rebuilt[ki] = week[k]; else if (ki > idx) rebuilt[ki - 1] = week[k]; });
      ST.customObjChecks[wk] = rebuilt;
    });
  }
  saveState();
  renderCategoriesGrid();
  renderObjPerso();
  openObjCatModal(catKey);
}

function toggleCatCustom(id, catKey) {
  if (!ST.customObjectifs) return;
  const idx = ST.customObjectifs.findIndex(o => o.id === id);
  if (idx === -1) return;
  const weekKey = _getWeekKey();
  const todayStr = new Date().toISOString().slice(0, 10);
  if (!ST.customObjChecks) ST.customObjChecks = {};
  if (!ST.customObjChecks[weekKey]) ST.customObjChecks[weekKey] = {};
  if (!ST.customObjChecks[weekKey][idx]) ST.customObjChecks[weekKey][idx] = [];
  const arr = ST.customObjChecks[weekKey][idx];
  const pos = arr.indexOf(todayStr);
  if (pos > -1) { arr.splice(pos, 1); }
  else { arr.push(todayStr); recordObjectifHistory(id, 'perso'); }
  saveState();
  openObjCatModal(catKey);
  renderObjSummary();
  renderObjPerso();
}

function _refreshCatModal(catKey) {
  const phase = _getPhaseForSuggestions();
  const weekKey = _getWeekKey();
  const todayStr = new Date().toISOString().slice(0, 10); // Format YYYY-MM-DD pour consistance
  const checks = (ST.weeklyObjChecks && ST.weeklyObjChecks[weekKey]) || {};
  document.querySelectorAll('#obj-cat-modal-content .obj-item').forEach((el, i) => {
    const id = `${phase}_${catKey}_${i}`;
    const done = (checks[id] || []).includes(todayStr);
    el.classList.toggle('done', done);
    el.querySelector('.obj-check').textContent = done ? '✓' : '';
  });
  renderObjSummary();
  renderSuggestionsJour();
}

function closeObjCatModal() {
  const m = document.getElementById('obj-cat-modal');
  if (m) m.classList.remove('open');
}

function openObjAddModal() {
  const modal = document.getElementById('obj-add-modal');
  if (!modal) return;

  // Reset des champs
  const textInput = document.getElementById('obj-add-text');
  const catSelect = document.getElementById('obj-add-category');
  const recSelect = document.getElementById('obj-add-recurrence');

  if (textInput) textInput.value = '';
  if (catSelect) catSelect.selectedIndex = 0;
  if (recSelect) recSelect.value = 'permanent';

  modal.classList.add('open');

  // Focus sur le champ texte
  setTimeout(() => {
    if (textInput) textInput.focus();
  }, 200);
}

function closeObjAddModal() {
  const modal = document.getElementById('obj-add-modal');
  if (modal) modal.classList.remove('open');
}

function confirmAddObjPerso() {
  const textInput = document.getElementById('obj-add-text');
  const catSelect = document.getElementById('obj-add-category');
  const recSelect = document.getElementById('obj-add-recurrence');

  if (!textInput || !textInput.value.trim()) {
    showToast('Entre un objectif d\'abord ✨');
    return;
  }

  if (!ST.customObjectifs) ST.customObjectifs = [];
  if (ST.customObjectifs.length >= 10) {
    showToast('Maximum 10 objectifs personnalisés atteint 🌙');
    return;
  }

  const nouvelObjectif = {
    id: `perso_${Date.now()}`,
    texte: textInput.value.trim(),
    recurrence: recSelect ? recSelect.value : 'permanent',
    categorie: catSelect ? catSelect.value : 'spiritualite',
    cree_le: new Date().toISOString().split('T')[0],
    phase_cree: ST.currentSaison || 'printemps',
  };

  ST.customObjectifs.push(nouvelObjectif);
  saveState();

  closeObjAddModal();
  renderObjPerso();

  showToast('Objectif ajouté ✨');
}

function toggleSuggestion(id) {
  const weekKey = _getWeekKey();
  const todayStr = new Date().toISOString().slice(0, 10); // Format YYYY-MM-DD pour consistance
  if (!ST.weeklyObjChecks) ST.weeklyObjChecks = {};
  if (!ST.weeklyObjChecks[weekKey]) ST.weeklyObjChecks[weekKey] = {};
  if (!ST.weeklyObjChecks[weekKey][id]) ST.weeklyObjChecks[weekKey][id] = [];
  const arr = ST.weeklyObjChecks[weekKey][id];
  const idx = arr.indexOf(todayStr);
  if (idx > -1) {
    // Décocher : supprimer la date
    arr.splice(idx, 1);
  } else {
    // Cocher : ajouter la date
    arr.push(todayStr);
    // Enregistrer dans l'historique pour le bilan
    recordObjectifHistory(id, 'suggestion');
  }
  saveState();
  renderSuggestionsJour();
  renderObjSummary();
}

function renderObjPerso() {
  // Migrate old string format to objects
  if (ST.customObjectifs && ST.customObjectifs.some(c => typeof c === 'string')) {
    ST.customObjectifs = ST.customObjectifs.map((c, i) =>
      typeof c === 'string'
        ? { id: `perso_${i}`, texte: c, recurrence: 'permanent', cree_le: '', phase_cree: '' }
        : c
    );
    saveState();
  }

  const container = document.getElementById('obj-perso-list');
  if (!container) return;

  const customs = ST.customObjectifs || [];
  const weekKey = _getWeekKey();
  const todayStr = new Date().toISOString().slice(0, 10); // Format YYYY-MM-DD pour consistance
  const customChecks = (ST.customObjChecks && ST.customObjChecks[weekKey]) || {};
  const todayDate = new Date().toISOString().split('T')[0];

  const active = customs.filter(c => {
    if (c.recurrence === 'today') return c.cree_le === todayDate;
    if (c.recurrence === 'phase') return c.phase_cree === (ST.currentSaison || '');
    return true;
  });

  if (active.length === 0) {
    container.innerHTML = '<div class="obj-empty">Ajoute un objectif qui te ressemble ✨</div>';
  } else {
    container.innerHTML = active.map(c => {
      const origIdx = customs.indexOf(c);
      const done = (customChecks[origIdx] || []).includes(todayStr);
      const recLabel = { today: 'Aujourd\'hui', phase: 'Cette phase', cycle: 'Ce cycle', permanent: 'Toujours' }[c.recurrence] || '';
      return `
        <div class="obj-item ${done ? 'done' : ''}" onclick="toggleCustomObj(${origIdx})">
          <div class="obj-check">${done ? '✓' : ''}</div>
          <div class="obj-content">
            <div class="obj-label">📌 ${_esc(c.texte)}</div>
            <div class="obj-phase-tag" style="margin-top:3px;">${recLabel}</div>
          </div>
          <button onclick="event.stopPropagation();removeCustomObj(${origIdx})" class="obj-remove-btn">×</button>
        </div>`;
    }).join('');
  }
}

function addObjPerso() {
  const inp = document.getElementById('obj-perso-input');
  if (!inp || !inp.value.trim()) return;
  if (!ST.customObjectifs) ST.customObjectifs = [];
  if (ST.customObjectifs.length >= 10) {
    showToast('Maximum 10 objectifs personnalisés atteint 🌙');
    return;
  }
  const sel = document.getElementById('obj-perso-recurrence');
  ST.customObjectifs.push({
    id: `perso_${Date.now()}`,
    texte: inp.value.trim(),
    recurrence: sel ? sel.value : 'permanent',
    cree_le: new Date().toISOString().split('T')[0],
    phase_cree: ST.currentSaison || 'printemps',
  });
  inp.value = '';
  saveState();
  renderObjPerso();
}

function removeCustomObj(i) {
  if (!ST.customObjectifs) return;
  ST.customObjectifs.splice(i, 1);
  if (ST.customObjChecks) {
    Object.keys(ST.customObjChecks).forEach(wk => {
      const week = ST.customObjChecks[wk];
      if (!week) return;
      const rebuilt = {};
      Object.keys(week).forEach(k => {
        const ki = Number(k);
        if (ki < i) rebuilt[ki] = week[k];
        else if (ki > i) rebuilt[ki - 1] = week[k];
      });
      ST.customObjChecks[wk] = rebuilt;
    });
  }
  saveState();
  renderObjPerso();
}

function toggleCustomObj(i) {
  const weekKey = _getWeekKey();
  const todayStr = new Date().toISOString().slice(0, 10); // Format YYYY-MM-DD pour consistance
  if (!ST.customObjChecks) ST.customObjChecks = {};
  if (!ST.customObjChecks[weekKey]) ST.customObjChecks[weekKey] = {};
  if (!ST.customObjChecks[weekKey][i]) ST.customObjChecks[weekKey][i] = [];
  const arr = ST.customObjChecks[weekKey][i];
  const idx = arr.indexOf(todayStr);
  if (idx > -1) {
    // Décocher : supprimer la date
    arr.splice(idx, 1);
  } else {
    // Cocher : ajouter la date
    arr.push(todayStr);
    // Enregistrer dans l'historique pour le bilan
    const customObj = (ST.customObjectifs || [])[i];
    if (customObj) {
      recordObjectifHistory(`perso_${i}`, 'perso', customObj.texte, customObj.categorie);
    }
  }
  saveState();
  renderObjPerso();
  renderObjSummary();
}

function renderCalendar() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const monthNames = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

  const headerEl = document.getElementById('cal-header');
  if (headerEl) headerEl.textContent = monthNames[month] + ' ' + year;

  const gridEl = document.getElementById('cal-grid');
  if (!gridEl) return;

  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let startDow = firstDay.getDay();
  startDow = startDow === 0 ? 6 : startDow - 1;

  const dur = effectiveCycleDur();
  let cells = '';
  for (let i = 0; i < startDow; i++) cells += '<div class="cal-day cal-day-empty"></div>';

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const dateStr = date.toDateString();
    let phase = 'printemps';
    if (ST.cycleStart) {
      const [sy, sm, sd] = ST.cycleStart.split('-').map(Number);
      const startLocal = new Date(sy, sm - 1, sd);
      const diff = Math.floor((date - startLocal) / 86400000);
      if (diff < 0) {
        phase = null;
      } else {
        phase = phaseForDay((diff % dur) + 1, dur);
      }
    }
    const isToday = d === now.getDate();
    const prayers = ST.prayers && ST.prayers[dateStr] ? Object.values(ST.prayers[dateStr]).filter(Boolean).length : 0;
    const phaseClass = phase ? ` cal-day-${phase}` : '';
    cells += `
      <div class="cal-day${phaseClass}${isToday ? ' cal-today' : ''}" onclick="openDayModal('${dateStr}','${phase || ''}')">
        <span class="cal-day-num">${d}</span>
        <div class="cal-day-icons">
          ${prayers >= 3 && phase !== 'hiver' ? '<span class="cal-crescent">☽</span>' : ''}
        </div>
      </div>`;
  }
  gridEl.innerHTML = cells;
}

function openDayModal(dateStr, phase) {
  const d = new Date(dateStr);
  const monthNames = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
  const phaseEmojis = { hiver:'🌙', printemps:'🌸', ete:'☀️', automne:'🍂' };
  const phaseNames  = { hiver:'Hiver', printemps:'Printemps', ete:'Été', automne:'Automne' };
  const prayers = ST.prayers && ST.prayers[dateStr] ? Object.values(ST.prayers[dateStr]).filter(Boolean).length : 0;
  const coranDone = !!(ST.coranDone && ST.coranDone[dateStr]);

  const el = document.getElementById('day-modal-content');
  if (!el) return;
  el.innerHTML = `
    <div style="text-align:center;margin-bottom:16px;">
      <div style="font-size:32px;margin-bottom:8px;">${phaseEmojis[phase] || '🌸'}</div>
      <div style="font-family:var(--serif);font-size:18px;color:var(--noir);font-weight:600;">${d.getDate()} ${monthNames[d.getMonth()]}</div>
      <div style="font-size:12px;color:var(--gris);margin-top:4px;">${phaseNames[phase] || phase}</div>
    </div>
    <div style="display:flex;flex-direction:column;gap:8px;">
      <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:${prayers>=3?'var(--season-soft)':'var(--creme)'};border-radius:12px;">
        <span style="font-size:18px;">🕌</span><span style="font-size:13px;color:var(--noir);">Prières — ${prayers}/5</span>
      </div>
      ${coranDone ? '<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--season-soft);border-radius:12px;"><span style="font-size:18px;">📖</span><span style="font-size:13px;color:var(--noir);">Coran — Lu ✓</span></div>' : ''}
    </div>`;
  document.getElementById('day-modal').classList.add('open');
}

function closeDayModal() {
  document.getElementById('day-modal').classList.remove('open');
}

function checkWeeklyReset() {
  const now = new Date();
  const day = now.getDay() || 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day - 1));
  const weekKey = monday.toISOString().split('T')[0];
  if (ST.lastWeeklyReset === weekKey) return;
  // Élaguer les entrées hebdomadaires > 4 semaines (ne pas tout effacer)
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 28);
  ['weeklyObjChecks', 'customObjChecks'].forEach(key => {
    if (!ST[key] || typeof ST[key] !== 'object') return;
    Object.keys(ST[key]).forEach(wk => { if (new Date(wk) < cutoff) delete ST[key][wk]; });
  });
  ST.lastWeeklyReset = weekKey;
  saveState();
}

function initApp() {
  // Toujours recalculer le cycle en premier — jamais faire confiance au localStorage
  try { computeCycle(); } catch(e) { console.error('computeCycle:', e); }
  // Appliquer le theme APRES le calcul
  try { applySaisonTheme(); } catch(e) { console.error('applySaisonTheme:', e); }
  // Puis remplir tous les onglets
  try { populateAll(); } catch(e) { console.error('populateAll:', e); }
  // Sauvegarder les valeurs recalculees
  try { saveState(); } catch(e) {}
}

document.addEventListener('DOMContentLoaded', async () => {
  // PWA install prompt capture
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    _pwaPrompt = e;
    _pwaShowInstallHint();
  });

  window.addEventListener('appinstalled', () => {
    _pwaPrompt = null;
    localStorage.setItem('pwa_installed', '1');
    _pwaHideAll();
  });

  // Initialisation PWA
  _pwaInit();

  // Message post-suppression (sessionStorage survit au reload, pas au fermer/rouvrir)
  if (sessionStorage.getItem('sakina_deleted') === '1') {
    sessionStorage.removeItem('sakina_deleted');
    setTimeout(() => showToast('Toutes tes données ont été supprimées. Jazakillah khayran d\'avoir utilisé SakinApp 🌸'), 600);
  }

  const inp = document.getElementById('input-prenom');
  if (inp) inp.addEventListener('blur', () => { setTimeout(() => { window.scrollTo(0, 0); }, 100); });

  loadState();

  // Initialiser les nouvelles propriétés si elles n'existent pas
  if (!ST.lecturesLues) ST.lecturesLues = [];

  checkDailyObjReset(); // Remise à zéro des coches chaque matin
  // iOS PWA : localStorage isolé de Safari → lire le cookie pour retrouver l'auth
  if (!ST.isAuthenticated && _getCookie('sakina_auth') === '1') {
    ST.isAuthenticated = true;
    ST.userEmail = ST.userEmail || decodeURIComponent(_getCookie('sakina_email') || '');
    ST.authDate = ST.authDate || Date.now();
    saveState();
  }
  // Masquer les écrans arrière (loader couvre tout visuellement)
  document.getElementById('revelation').style.display = 'none';
  document.getElementById('app').style.display = 'none';
  document.getElementById('auth-screen').style.display = 'none';

  // ── Décision d'écran SYNCHRONE (localStorage) ──────────────────────────────
  const _hasAccount = !!(ST.prenom && ST.cycleStart);
  if (_hasAccount) {
    // CAS 1 — Déjà configurée : préparer l'app derrière le loader
    const appEl = document.getElementById('app');
    appEl.style.display = 'flex';
    appEl.style.opacity = '0';
    initApp();
    scheduleLocalNotifications();
  } else if (!ST.isAuthenticated && !ST.prenom) {
    // CAS 3 — Nouvelle utilisatrice
    showAuthScreen(3);
  } else {
    // CAS partiel — a un prenom mais pas de session (rare : onboarding interrompu)
    document.getElementById('onboarding').style.display = 'block';
    _fadeIn(document.getElementById('onboarding'));
  }

  // ── Vérification Supabase — max 2 secondes ──────────────────────────────────
  try {
    const sb = await initSupabase();
    if (sb) {
      const _timeout2s = new Promise(resolve =>
        setTimeout(() => resolve({ data: { session: null }, _timedOut: true }), 2000)
      );
      const result = await Promise.race([sb.auth.getSession(), _timeout2s]);
      const session = result.data && result.data.session;

      if (!session) {
        // Pas de session (ou timeout)
        if (ST.isAuthenticated) {
          setupAuthListener(sb);
        } else if (ST.prenom && ST.cycleStart) {
          setupAuthListener(sb);
          setTimeout(_showReconnectNudge, 1800);
        } else {
          showAuthScreen(3);
          setupAuthListener(sb);
        }
      } else {
        // Session valide — CAS 1 confirmé
        ST.supabaseUserId = session.user.id;
        ST.supabaseEmail = session.user.email;
        ST.isAuthenticated = true;
        ST.userEmail = ST.userEmail || session.user.email;
        await loadFromSupabase(sb, session.user.id);
        ST.isAuthenticated = true;
        setupAuthListener(sb);
        if (_hasAccount) initApp();

        // Cas où Supabase a complété les données manquantes
        if (!_hasAccount && ST.prenom && ST.cycleStart) {
          document.getElementById('onboarding').style.display = 'none';
          const appEl = document.getElementById('app');
          appEl.style.display = 'flex';
          appEl.style.opacity = '0';
          initApp();
          scheduleLocalNotifications();
        }
      }
    }
  } catch(e) {}

  // ── Masquer le loader + révéler le bon écran ────────────────────────────────
  _hideLoader();
  if (_hasAccount) {
    const appEl = document.getElementById('app');
    appEl.style.transition = 'opacity .3s ease';
    appEl.style.opacity = '1';
    const _now = new Date();
    if (ST.checkinDate !== _now.toDateString() && _now.getHours() < 14) {
      setTimeout(() => {
        const ov = document.getElementById('checkin-overlay');
        if (ov) { ov.style.display = 'flex'; ov.style.alignItems = 'flex-end'; }
      }, 800);
    }
  }

  checkDailyReset();
  checkWeeklyReset();

  // Sync immédiat quand l'app passe en arrière-plan (évite la perte de données à la fermeture)
  const _onAppHide = () => {
    try { saveState(); } catch(e) {}
    clearTimeout(_syncTimer);
    _doSyncToSupabase();
  };
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') _onAppHide();
  });
  window.addEventListener('pagehide', _onAppHide);
});

function nextStep(step) {
  if (step === 1) {
    const prenom = document.getElementById('input-prenom').value.trim();
    if (!prenom) { showToast('Dis-moi ton prénom 🌸'); return; }
    ST.prenom = prenom;
    saveState();
    const _n = new Date(); const today = _n.getFullYear() + '-' + String(_n.getMonth()+1).padStart(2,'0') + '-' + String(_n.getDate()).padStart(2,'0');
    const dateInput = document.getElementById('input-date');
    if (dateInput) { dateInput.value = today; dateInput.max = today; }
    document.getElementById('step-0').classList.remove('active');
    document.getElementById('step-0').style.display = 'none';
    document.getElementById('step-1').classList.add('active');
    document.getElementById('step-1').style.display = 'flex';
    window.scrollTo(0, 0);
  } else if (step === 2) {
    const dateVal = document.getElementById('input-date').value;
    if (!dateVal) { showToast('Indique la date de début de ton dernier cycle 🌙'); return; }
    ST.cycleStart = dateVal;
    ST.cycleDuration = selectedDuration;
    ST.dureeRegles = selectedDureeRegles;
    if (!ST.consentDate) {
      ST.consentDate = new Date().toISOString();
      ST.consentVersion = '1.0';
    }
    computeCycle();
    applySaisonTheme();
    showRévelation();
  }
}

function showRévelation() {
  const s = SAISONS[ST.currentSaison];
  document.getElementById('rev-emoji').textContent = s.emoji;
  document.getElementById('rev-title').textContent = 'Tu es en ' + s.nom;
  document.getElementById('rev-subtitle').textContent = s.phase + ' · Jour ' + ST.currentDay;
  const msgs = {
    hiver:"Ton corps est en repos profond. C'est une semaine pour la douceur, le silence et la récupération.",
    printemps:"L'énergie revient doucement. C'est le moment de commencer ce qui attend.",
    ete:"Tu es à ton pic d'énergie. C'est le bon moment pour agir, te connecter, donner.",
    automne:"Ton corps ralentit, tes émotions s'intensifient. C'est normal, c'est attendu."
  };
  document.getElementById('rev-message').textContent = msgs[ST.currentSaison];
  document.getElementById('onboarding').style.display = 'none';
  document.getElementById('revelation').style.display = 'flex';
}

function enterApp() {
  saveState();
  document.getElementById('revelation').style.display = 'none';
  document.getElementById('app').style.display = 'flex';
  initApp();
  // Email de bienvenue — envoyé une seule fois après la fin de l'onboarding
  sendWelcomeEmail();
  // Toujours atterrir sur Accueil après l'onboarding
  document.querySelectorAll('.tab-page').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('tab-accueil').classList.add('active');
  document.getElementById('nav-accueil').classList.add('active');
  const appContent = document.getElementById('app-content');
  if (appContent) appContent.scrollTop = 0;
  const today = new Date().toDateString();
  setTimeout(() => {
    if (!localStorage.getItem('tabSeen_accueil')) {
      showTabTour('accueil');
    } else if (ST.checkinDate !== today) {
      const ov = document.getElementById('checkin-overlay');
      if (ov) { ov.style.display = 'flex'; ov.style.alignItems = 'flex-end'; }
    }
  }, 500);
}

// ═══════════════════════════════════════════════
// CHECK-IN
// ═══════════════════════════════════════════════
function doCheckin(mood) {
  ST.checkin = mood; ST.checkinDate = new Date().toDateString();
  document.getElementById('checkin-overlay').style.display = 'none';
  updateMessage();
  saveState();
}
function updateMessage() {
  const s = SAISONS[ST.currentSaison];
  const mood = ST.checkin || 'bien';
  const el = document.getElementById('daily-message');
  if (!el) return;
  // MESSAGES_JOUR est calibré sur 28 jours — on vérifie que la phase du message
  // correspond à la phase réelle avant de l'utiliser (sinon fallback générique)
  let dayMsg = null;
  if (typeof MESSAGES_JOUR !== 'undefined') {
    const candidate = MESSAGES_JOUR[ST.currentDay];
    if (candidate) {
      const d = ST.currentDay;
      const phaseFor28 = d <= 5 ? 'hiver' : d <= 13 ? 'printemps' : d <= 17 ? 'ete' : 'automne';
      if (phaseFor28 === ST.currentSaison) dayMsg = candidate;
    }
  }
  el.textContent = (dayMsg && dayMsg[mood]) || s.messages[mood] || s.messages.bien;
}

// ═══════════════════════════════════════════════
// TABS
// ═══════════════════════════════════════════════
function switchTab(name, navEl) {
  document.querySelectorAll('.tab-page').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  navEl.classList.add('active');
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;
  const appContent = document.getElementById('app-content');
  if (appContent) { appContent.scrollTop = 0; setTimeout(() => { appContent.scrollTop = 0; }, 50); }
  setTimeout(() => showTabTour(name), 300);
}

function switchTabById(name, section) {
  document.querySelectorAll('.tab-page').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('tab-' + name)?.classList.add('active');
  document.getElementById('nav-' + name)?.classList.add('active');
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;
  setTimeout(() => showTabTour(name), 300);
  const _ac2 = document.getElementById('app-content');
  if (_ac2) _ac2.scrollTop = 0;
}

function toggleHomeSuggestion(el, idx) {
  if (!ST.selectedSugg) ST.selectedSugg = [];
  const i = ST.selectedSugg.indexOf(idx);
  if (i > -1) ST.selectedSugg.splice(i, 1);
  else ST.selectedSugg.push(idx);
  saveState();
  const isSel = ST.selectedSugg.includes(idx);
  el.classList.toggle('done', isSel);
  const chk = el.querySelector('.sugg-engage-chk');
  if (chk) chk.textContent = isSel ? '✓' : '';
  const countEl = document.getElementById('sugg-engage-count');
  const s = SAISONS[ST.currentSaison];
  if (countEl) countEl.textContent = ST.selectedSugg.length + '/' + (s.suggestions?.length || 0) + ' faits';
}

// ═══════════════════════════════════════════════
// PRAYERS
// ═══════════════════════════════════════════════
function togglePrayer(el, name) {
  const today = new Date().toDateString();
  if (!ST.prayers[today]) ST.prayers[today] = {};
  ST.prayers[today][name] = !ST.prayers[today][name];
  updatePrayerProgress(); saveState();
}
function updatePrayerProgress() {
  const today = new Date().toDateString();
  const names = ['fajr','dohr','asr','maghrib','isha'];
  const prayers = ST.prayers[today] || {};
  const done = names.filter(n => prayers[n]).length;
  if (done === 5) setTimeout(() => showPrayerCelebration(), 300);
  const pf = document.getElementById('prayer-progress');
  const pl = document.getElementById('prayer-prog-lbl');
  if (pf) pf.style.width = (done/5*100) + '%';
  if (pl) pl.textContent = done + ' / 5';
  names.forEach(n => {
    const chk = document.getElementById('pr-' + n);
    const nm = document.getElementById('prn-' + n);
    const isDone = !!prayers[n];
    if (chk) { chk.className = 'prayer-chk' + (isDone?' done':''); chk.style.background=isDone?'var(--season)':'transparent'; chk.style.borderColor=isDone?'var(--season)':'var(--sable)'; chk.style.color=isDone?'white':'transparent'; chk.textContent=isDone?'✓':''; }
    if (nm) nm.className = 'prayer-name' + (isDone?' done':'');
  });
}
function restorePrayers() { updatePrayerProgress(); }
function showPrayerCelebration() {
  const existing = document.getElementById('prayer-celebration');
  if (existing) return;
  const card = document.querySelector('.prayers-card');
  if (!card) return;
  const div = document.createElement('div');
  div.id = 'prayer-celebration';
  div.style.cssText = 'background:var(--season-soft);border-radius:14px;padding:14px 16px;margin:0 14px 12px;border:1.5px solid var(--season-light);text-align:center;';
  div.innerHTML = '<div style="font-size:22px;margin-bottom:6px">🤲</div><div style="font-size:16px;direction:rtl;color:var(--season);margin-bottom:4px">مَاشَاءَ اللَّهُ</div><div style="font-family:var(--serif);font-size:13px;font-style:italic;color:var(--noir);line-height:1.6">Masha\'Allah — les 5 prières accomplies. Que Allah accepte. 🌸</div>';
  card.insertAdjacentElement('afterend', div);
  setTimeout(() => { if(div.parentNode) div.parentNode.removeChild(div); }, 5000);
}

// ═══════════════════════════════════════════════
// GLAIRE CERVICALE
// ═══════════════════════════════════════════════
function selectGlaire(el, type) {
  document.querySelectorAll('.glaire-option').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
  ST.glaire = type; ST.glaireDate = new Date().toDateString(); saveState();
  const labels = {regles:'Rien / Règles',seche:'Sèche ou collante',cremeuse:'Crémeuse / Laiteuse',filante:'Filante / Transparente ⚡',epaisse:'Épaisse / Absente'};
  const collapsed = document.getElementById('glaire-collapsed');
  if (collapsed) { collapsed.textContent = '✓ ' + (labels[type]||type); collapsed.style.color = 'var(--season)'; }
  setTimeout(() => {
    const content = document.getElementById('glaire-content');
    const arrow = document.getElementById('glaire-arrow');
    if (content) content.style.display = 'none';
    if (arrow) arrow.style.transform = 'rotate(0deg)';
  }, 400);
}
function toggleGlaire() {
  const content = document.getElementById('glaire-content');
  const arrow = document.getElementById('glaire-arrow');
  if (!content) return;
  const isOpen = content.style.display !== 'none';
  content.style.display = isOpen ? 'none' : 'block';
  if (arrow) arrow.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
}
function toggleIntimite() {
  const content = document.getElementById('intimite-content');
  const arrow = document.getElementById('intimite-arrow');
  if (!content) return;
  const isOpen = content.style.display !== 'none';
  content.style.display = isOpen ? 'none' : 'block';
  if (arrow) arrow.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
}
function restoreGlaire() {
  const today = new Date().toDateString();
  if (ST.glaireDate === today && ST.glaire) {
    document.querySelectorAll('.glaire-option').forEach(o => {
      if (o.dataset.type === ST.glaire) o.classList.add('selected');
    });
  }
}

// ═══════════════════════════════════════════════
// ENERGY BARS & CYCLE RING
// ═══════════════════════════════════════════════
// Retourne l'index 0-basé dans la phase courante (pour pick dans REPAS/SOINS_QUOTIDIENS)
function dayWithinPhase(cycleDay, cycleDur) {
  const dur = Math.max(20, Math.min(60, cycleDur));
  const day = Math.max(1, cycleDay);
  const { springStartD, eteStartD, eteEndD } = phaseThresholds(dur);
  if (day < springStartD) return day - 1;
  if (day < eteStartD) return day - springStartD;
  if (day <= eteEndD) return day - eteStartD;
  return day - (eteEndD + 1);
}

function getAutomneMicroPhase(cycleDay, cycleDur) {
  const dur = Math.max(20, Math.min(60, cycleDur));
  const { eteEndD } = phaseThresholds(dur);
  const autLen = dur - eteEndD;
  const autDay = Math.max(1, cycleDay - eteEndD);
  if (autDay <= Math.floor(autLen * 0.35)) return 'actif';
  if (autDay <= Math.floor(autLen * 0.70)) return 'doux';
  return 'fin';
}

function phaseForDay(i, dur) {
  const { springStartD, eteStartD, eteEndD } = phaseThresholds(dur);
  if (i < springStartD) return 'hiver';
  if (i < eteStartD) return 'printemps';
  if (i <= eteEndD) return 'ete';
  return 'automne';
}

function drawCycleRing() {
  const cx=100, cy=100, r=82;
  const dur = effectiveCycleDur();
  const day = ST.currentDay || 1;
  const { springStartD, eteStartD, eteEndD } = phaseThresholds(dur);
  const phases = [
    {id:'seg-hiver',     start:1,            end:springStartD-1, color:'#7B5EA7'},
    {id:'seg-printemps', start:springStartD,  end:eteStartD-1,    color:'#3DAE8A'},
    {id:'seg-ete',       start:eteStartD,     end:eteEndD,        color:'#FF8A65'},
    {id:'seg-automne',   start:eteEndD+1,     end:dur,            color:'#C82B4A'},
  ];
  function polarToCart(angle) { const rad=(angle-90)*Math.PI/180; return {x:cx+r*Math.cos(rad),y:cy+r*Math.sin(rad)}; }
  function dayToAngle(d) { return ((d-1)/dur)*360; }
  function arcPath(s2,e2) { const a1=dayToAngle(s2),a2=dayToAngle(e2+1); const p1=polarToCart(a1),p2=polarToCart(a2); const large=(a2-a1)>180?1:0; return 'M '+p1.x+' '+p1.y+' A '+r+' '+r+' 0 '+large+' 1 '+p2.x+' '+p2.y; }
  phases.forEach(ph => {
    const el = document.getElementById(ph.id); if (!el) return;
    const end = Math.min(ph.end, dur);
    if (ph.start > end || ph.start > dur) { el.setAttribute('d',''); return; }
    el.setAttribute('d', arcPath(ph.start, end));
    el.setAttribute('stroke', ph.color);
  });
  // Le point se place au minimum à springStartD si la saison est déjà Printemps
  const dotDay = (ST.currentSaison !== 'hiver' && day < springStartD) ? springStartD : day;
  const dot = document.getElementById('day-dot');
  if (dot) { const pos=polarToCart(dayToAngle(dotDay)); dot.setAttribute('cx',pos.x); dot.setAttribute('cy',pos.y); dot.setAttribute('stroke','var(--season)'); }
}

// ═══════════════════════════════════════════════
// 99 NOMS D'ALLAH
// ═══════════════════════════════════════════════
function showNomDuJour() {
  const dayOfYear = Math.abs(Math.floor((new Date() - new Date(2024, 0, 1)) / 86400000));
  const nom = ASMA[dayOfYear % 99] || ASMA[0];
  const ar = document.getElementById('asma-day-arabic');
  const fr = document.getElementById('asma-day-fr');
  const meaning = document.getElementById('asma-day-meaning');
  const reflection = document.getElementById('asma-day-reflection');
  if (ar) ar.textContent = nom.ar;
  if (fr) fr.textContent = nom.fr;
  const med = ASMA_MEDITATIONS[nom.num];
  if (meaning) meaning.textContent = med ? med.m : nom.fr + " — médite sur ce nom aujourd'hui.";
  if (reflection) reflection.textContent = med ? med.r : "Répète ce nom dans ton cœur. Laisse-le guider ta journée.";
}
function buildAsmaGrid() {
  const grid = document.getElementById('asma-list'); if (!grid) return;
  grid.innerHTML = ASMA.map(a => {
    const known = ST.asmaKnown.includes(a.num);
    return `<div class="asma-item" onclick="toggleAsma(${a.num},this)"><div class="asma-chk${known?' done':''}" style="${known?'background:var(--season);border-color:var(--season);color:white':''}">${known?'✓':''}</div><div style="flex:1"><div class="asma-ar">${a.ar}</div><div class="asma-fr">${a.fr}</div></div></div>`;
  }).join('');
  updateAsmaCount();
}
function toggleAsma(num, el) {
  const idx = ST.asmaKnown.indexOf(num);
  if (idx > -1) ST.asmaKnown.splice(idx,1); else ST.asmaKnown.push(num);
  const known = ST.asmaKnown.includes(num);
  const chk = el.querySelector('.asma-chk');
  if (chk) { chk.className='asma-chk'+(known?' done':''); chk.style.background=known?'var(--season)':'transparent'; chk.style.borderColor=known?'var(--season)':'var(--sable)'; chk.style.color=known?'white':'transparent'; chk.textContent=known?'✓':''; }
  updateAsmaCount(); saveState();
}
function updateAsmaCount() {
  const count = ST.asmaKnown.length;
  const pct = (count/99*100)+'%';
  const countEl=document.getElementById('asma-count');
  const progEl=document.getElementById('asma-progress');
  const mCount=document.getElementById('asma-modal-count');
  const mProg=document.getElementById('asma-modal-progress');
  if (countEl) countEl.textContent=count;
  if (progEl) progEl.style.width=pct;
  if (mCount) mCount.textContent=count;
  if (mProg) mProg.style.width=pct;
}
function openAsmaModal() {
  buildAsmaGrid();
  document.getElementById('asma-modal').classList.add('open');
}
function closeAsmaModal() { document.getElementById('asma-modal').classList.remove('open'); }

// ═══════════════════════════════════════════════
// CHECK-IN SOIR
// ═══════════════════════════════════════════════
const EVENING_RESPONSES = {
  bien:{emoji:'🌟',hiver:"Alhamdulillah pour cette belle journée en Hiver.",printemps:"Alhamdulillah ! Le Printemps te porte bien.",ete:"Alhamdulillah — tu as rayonné aujourd'hui.",automne:"Alhamdulillah pour ce bon jour en Automne."},
  fatiguee:{emoji:'🌙',hiver:"L'Hiver demande tout. Tu as fait ce que tu as pu — c'est suffisant.",printemps:"La fatigue en Printemps mérite attention.",ete:"Même en été, le corps a ses limites.",automne:"L'Automne fatigue plus profondément. Dors tôt ce soir."},
  difficile:{emoji:'🤲',hiver:"Les jours difficiles en Hiver passent — comme l'Hiver passe toujours.",printemps:"Même quand tout devrait aller mieux, il y a des jours lourds.",ete:"Même au sommet, des jours difficiles arrivent. Allah est avec toi.",automne:"L'Automne amplifie la difficulté. C'est réel — et passager."},
  calme:{emoji:'🍃',hiver:"Une journée calme en Hiver, c'est déjà beaucoup.",printemps:"Les journées tranquilles construisent aussi.",ete:"Même en été, une journée douce est un cadeau.",automne:"Le calme en Automne est une sagesse."}
};
function showEveningCheckin() {
  document.getElementById('evening-questions').style.display='block';
  document.getElementById('evening-response').style.display='none';
  const evOv=document.getElementById('evening-checkin-overlay');
  if (evOv) { evOv.style.display='flex'; evOv.style.alignItems='flex-end'; }
}
function doEveningCheckin(mood) {
  const r=EVENING_RESPONSES[mood]; if (!r) { closeEveningCheckin(); return; }
  const msg=r[ST.currentSaison]||r.automne;
  document.getElementById('evening-resp-emoji').textContent=r.emoji;
  document.getElementById('evening-resp-msg').textContent=msg;
  document.getElementById('evening-questions').style.display='none';
  document.getElementById('evening-response').style.display='block';
  ST.eveningCheckinDate=new Date().toDateString(); ST.eveningCheckinMood=mood; saveState();
}
function closeEveningCheckin() { const evOv=document.getElementById('evening-checkin-overlay'); if (evOv) evOv.style.display='none'; }
function checkNotificationReturn() {
  const now=new Date(); const hour=now.getHours(); const today=now.toDateString();
  if (hour>=14&&ST.eveningCheckinDate!==today&&ST.prenom&&ST.cycleStart) showEveningCheckin();
}

// ═══════════════════════════════════════════════
// CYCLE EDIT
// ═══════════════════════════════════════════════
let editDuration = 28;
let editDureeRegles = 5;
function _syncEditChips(containerId, val) {
  document.querySelectorAll('#' + containerId + ' .ob-option').forEach(o => {
    const match = Number(o.dataset.val) === val;
    o.classList.toggle('selected', match);
    o.style.background = match ? 'var(--season-soft)' : 'white';
    o.style.borderColor = match ? 'var(--season)' : 'var(--sable)';
  });
}
function openEditCycle() {
  const _n=new Date(); const today=_n.getFullYear()+'-'+String(_n.getMonth()+1).padStart(2,'0')+'-'+String(_n.getDate()).padStart(2,'0');
  document.getElementById('edit-cycle-date').value=ST.cycleStart||today;
  document.getElementById('edit-cycle-date').max=today;
  editDuration=ST.cycleDuration||28;
  editDureeRegles=ST.dureeRegles||5;
  _syncEditChips('edit-duration-options', editDuration);
  _syncEditChips('edit-regles-options', editDureeRegles);
  document.getElementById('edit-cycle-modal').classList.add('open');
}
function closeEditCycle() { document.getElementById('edit-cycle-modal').classList.remove('open'); }
function selectEditDuration(el, val) {
  document.querySelectorAll('#edit-duration-options .ob-option').forEach(o => { o.classList.remove('selected'); o.style.background='white'; o.style.borderColor='var(--sable)'; });
  el.classList.add('selected'); el.style.background='var(--season-soft)'; el.style.borderColor='var(--season)';
  editDuration=val;
}
function selectEditDureeRegles(el, val) {
  document.querySelectorAll('#edit-regles-options .ob-option').forEach(o => { o.classList.remove('selected'); o.style.background='white'; o.style.borderColor='var(--sable)'; });
  el.classList.add('selected'); el.style.background='var(--season-soft)'; el.style.borderColor='var(--season)';
  editDureeRegles=val;
}
function saveEditCycle() {
  const dateVal=document.getElementById('edit-cycle-date').value;
  if (!dateVal) { showToast('Indique la date 🌙'); return; }
  const todayStr = new Date().toISOString().split('T')[0];
  if (dateVal > todayStr) { showToast('La date de début ne peut pas être dans le futur 🌙'); return; }
  if (ST.cycleStart && ST.cycleStart !== dateVal) {
    if (!ST.cycleHistory) ST.cycleHistory = [];
    ST.cycleHistory.unshift({ start: ST.cycleStart, duration: ST.cycleDuration || 28 });
    if (ST.cycleHistory.length > 6) ST.cycleHistory = ST.cycleHistory.slice(0, 6);
  }
  if (ST.cycleStart !== dateVal) ST.hiverEnd = null; // nouvelle date → hiverEnd caduc
  ST.cycleStart=dateVal; ST.cycleDuration=editDuration; ST.dureeRegles=editDureeRegles; saveState(); closeEditCycle();
  computeCycle(); applySaisonTheme(); populateAll();
  showToast('✓ Cycle mis à jour — ' + SAISONS[ST.currentSaison].emoji + ' ' + SAISONS[ST.currentSaison].nom + ' · Jour ' + ST.currentDay);
}

// ═══════════════════════════════════════════════
// NOTIFICATIONS
// ═══════════════════════════════════════════════
const NOTIF_SCHEDULE = {
  1: [{ h:20, m:30, slot:'soir' }],
  2: [{ h:8, m:0, slot:'matin' }, { h:20, m:30, slot:'soir' }],
  3: [{ h:8, m:0, slot:'matin' }, { h:13, m:30, slot:'midi' }, { h:20, m:30, slot:'soir' }],
};
const NOTIF_MSGS = {
  matin: {
    hiver:    'Comment tu te réveilles ce matin ? Prends soin de toi. 🌙',
    printemps:'Ton énergie revient — c\'est l\'heure de ton check-in matin ! 🌸',
    ete:      'Tu rayonnes aujourd\'hui. Prête pour une belle journée ? ☀️',
    automne:  'Prends soin de toi ce matin. Ton corps a besoin de douceur. 🍂',
  },
  midi: {
    hiver:    'Mi-journée. Tu as mangé quelque chose de chaud ? 🌙',
    printemps:'Mi-journée ! Comment tu te sens depuis ce matin ? 🌸',
    ete:      'Le milieu de ta journée — tu prends soin de toi ? ☀️',
    automne:  'Pause de mi-journée. Comment tu gères ton énergie ? 🍂',
  },
  soir: {
    hiver:    'Le bilan du soir t\'attend. Quelques minutes pour toi. 🌙',
    printemps:'Fin de journée. C\'était comment ? Ton check-in du soir. 🌸',
    ete:      'Soirée ! Comment s\'est passée ta journée ? Check-in soir. ☀️',
    automne:  'Ton check-in du soir — 2 minutes pour toi ce soir. 🍂',
  },
};
const _notifTimers = [];

function scheduleLocalNotifications() {
  _notifTimers.forEach(t => clearTimeout(t));
  _notifTimers.length = 0;
  const freq = ST.notifFreq || 0;
  if (!freq) return;
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const slots = NOTIF_SCHEDULE[freq] || [];
  const now = new Date();
  // Daily reset at midnight so next day's timers are always scheduled
  const midnight = new Date(); midnight.setHours(24, 0, 1, 0);
  _notifTimers.push(setTimeout(scheduleLocalNotifications, midnight - now));
  slots.forEach(({ h, m, slot }) => {
    const target = new Date();
    target.setHours(h, m, 0, 0);
    if (target <= now) target.setDate(target.getDate() + 1);
    const delay = target - now;
    const t = setTimeout(() => {
      _fireNotification(slot);
    }, delay);
    _notifTimers.push(t);
  });
}

function _fireNotification(slot) {
  const prenom = ST.prenom || '';
  const saison = ST.currentSaison || 'printemps';
  const body = NOTIF_MSGS[slot]?.[saison] || 'SakinApp t\'attend. 🌸';
  const title = prenom ? 'Salam ' + prenom + ' 🌸' : 'SakinApp 🌸';
  const opts = { body, icon: '/icons/icon-192.png', badge: '/icons/icon-192.png', tag: 'sakinapp-' + slot, renotify: true, vibrate: [200, 100, 200] };
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(reg => reg.showNotification(title, opts)).catch(() => {});
  } else if (Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/icons/icon-192.png' });
  }
}

let selectedFreq = 2;
function selectFreq(el, freq) {
  selectedFreq=freq;
  document.querySelectorAll('#notif-freq-options .ob-option').forEach(o => { o.classList.remove('selected'); });
  el.classList.add('selected');
}
function openNotifSettings() {
  selectedFreq = ST.notifFreq || 2;
  document.querySelectorAll('#notif-freq-options .ob-option').forEach(o => {
    o.classList.toggle('selected', Number(o.dataset.freq) === selectedFreq);
  });
  document.getElementById('notif-modal').classList.add('open');
  const status=document.getElementById('notif-permission-status');
  if (!('Notification' in window)) status.innerHTML='📱 Installe l\'app sur l\'écran d\'accueil pour activer les rappels.';
  else if (Notification.permission==='granted') { status.innerHTML='✅ <strong>Notifications activées</strong>'; status.style.color='#3DAE8A'; }
  else if (Notification.permission==='denied') { status.innerHTML='❌ Bloquées — Réglages → Safari → Notifications.'; status.style.color='#C4694A'; }
  else status.innerHTML='🔔 Appuie sur Activer pour recevoir tes rappels.';
}
function closeNotifModal() { document.getElementById('notif-modal').classList.remove('open'); }
function saveNotifSettings() {
  ST.notifFreq=selectedFreq; saveState();
  if (!selectedFreq) { _notifTimers.forEach(t => clearTimeout(t)); _notifTimers.length=0; showToast('Rappels désactivés.'); closeNotifModal(); return; }
  if (!('Notification' in window)) { showToast('📱 Installe l\'app depuis l\'écran d\'accueil pour les rappels.'); closeNotifModal(); return; }
  Notification.requestPermission().then(permission => {
    if (permission==='granted') { scheduleLocalNotifications(); closeNotifModal(); showToast('Rappels activés ! 🌸'); }
    else { closeNotifModal(); }
  }).catch(() => { closeNotifModal(); });
}

// ═══════════════════════════════════════════════
// FEEDBACK
// ═══════════════════════════════════════════════
let selectedRating=0;
const RATING_LABELS={1:"Pas encore convaincue…",2:"Des choses à améliorer",3:"Bien, mais peut mieux faire",4:"Je l'aime bien !",5:"Je l'adore ! 🌸"};
function setRating(val) {
  selectedRating=val;
  const label=document.getElementById('rating-label'); if(label) label.textContent=RATING_LABELS[val]||'';
  document.querySelectorAll('#rating-stars > div').forEach((star,i) => { const isSel=i+1<=val; star.style.background=isSel?'var(--season-soft)':'white'; star.style.borderColor=isSel?'var(--season)':'var(--sable)'; });
}
function toggleChip(el) {
  const isSel=el.dataset.selected==='true'; el.dataset.selected=isSel?'false':'true';
  el.style.background=isSel?'white':'var(--season-soft)'; el.style.borderColor=isSel?'var(--sable)':'var(--season)'; el.style.color=isSel?'var(--gris)':'var(--season)';
}
async function sendFeedback() {
  const msg=document.getElementById('feedback-msg');
  const text=document.getElementById('feedback-text').value.trim();
  const email=document.getElementById('feedback-email').value.trim();
  if (!selectedRating) { msg.style.color='#C4694A'; msg.textContent="Sélectionne une note 🌸"; return; }
  if (!email || !email.includes('@')) { msg.style.color='#C4694A'; msg.textContent="Entre ton email pour qu'on puisse te répondre 🌸"; return; }
  const likes=[]; document.querySelectorAll('#likes-chips > div[data-selected="true"]').forEach(c=>likes.push(c.textContent.trim()));
  const btn=document.querySelector('[onclick="sendFeedback()"]'); if(btn){btn.disabled=true;btn.textContent='Envoi…';}
  try {
    const res=await fetch('https://formspree.io/f/xojpknkq',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({type:'FEEDBACK_BETA',note:selectedRating+'/5',jaime:likes.join(', ')||'Non renseigné',ameliorer:text||'Non renseigné',email:email||'Non renseigné',saison:ST.currentSaison,prenom:ST.prenom})});
    if (res.ok) { ST.feedbackSent=true; saveState(); document.getElementById('feedback-section').style.display='none'; showToast('Merci pour ton retour 🌸 Barak Allahu fik !'); }
    else throw new Error();
  } catch(e) { if(btn){btn.disabled=false;btn.textContent='Envoyer mon avis ✦';} }
}
function restoreFeedback() {
  const section=document.getElementById('feedback-section'); if(!section) return;
  if (!ST.cycleStart) { section.style.display='none'; return; }
  const [_fy,_fm,_fd]=ST.cycleStart.split('-').map(Number);
  const now=new Date(); const todayMidnight=new Date(now.getFullYear(),now.getMonth(),now.getDate());
  const daysSince=Math.floor((todayMidnight-new Date(_fy,_fm-1,_fd))/86400000);
  if (ST.feedbackSent) { section.style.display='none'; return; }
  if (daysSince<3) { section.style.display='none'; return; }
  section.style.display='block';
}

// ═══════════════════════════════════════════════
// UTILITAIRES
// ═══════════════════════════════════════════════
function showInstallBanner() {
  if (window.navigator.standalone) return;
  if (ST.installBannerDismissed) return;
  const banner=document.getElementById('install-banner'); if(banner) banner.style.display='flex';
}
function dismissInstallBanner() { ST.installBannerDismissed=true; saveState(); const banner=document.getElementById('install-banner'); if(banner) banner.style.display='none'; }
function showToast(msg) {
  let el=document.getElementById('toastEl');
  if (!el) { el=document.createElement('div'); el.id='toastEl'; el.className='toast'; el.setAttribute('role','alert'); el.setAttribute('aria-live','assertive'); document.body.appendChild(el); }
  el.textContent=msg; el.classList.add('show'); setTimeout(()=>el.classList.remove('show'),2900);
}
function formatDateFr(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const months = ['jan.','fév.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];
  return d + ' ' + months[m - 1] + ' ' + y;
}
function renderCycleHistory() {
  const card = document.getElementById('cycle-history-card');
  const list = document.getElementById('cycle-history-list');
  if (!card || !list) return;
  const history = ST.cycleHistory || [];
  if (!ST.cycleStart && history.length === 0) { card.style.display = 'none'; return; }
  card.style.display = 'block';

  const all = [];
  if (ST.cycleStart) all.push({ start: ST.cycleStart, duration: ST.cycleDuration || 28, current: true });
  (history || []).slice(0, 11).forEach(c => all.push(c));
  (ST.historiqueCycles || []).forEach(c => {
    if (c.dateDebut && c.dateDebut !== ST.cycleStart) {
      all.push({ start: c.dateDebut, duration: Number(c.dureeCycle) || 28, histManuel: true });
    }
  });
  const currItem = all.find(c => c.current);
  const others = all.filter(c => !c.current).sort((a, b) => b.start.localeCompare(a.start));
  all.length = 0;
  if (currItem) all.push(currItem);
  others.forEach(c => all.push(c));

  if (all.length < 2) {
    list.innerHTML = `<div style="font-size:12px;color:var(--gris);text-align:center;padding:18px 0;line-height:1.7;">Ton graphique apparaîtra<br>dès ton 2ème cycle ✨</div>`;
    return;
  }

  const durs = all.map(c => Number(c.duration) || 28);
  const minD = Math.min(...durs);
  const maxD = Math.max(...durs);
  // Moyenne uniquement sur les cycles PASSÉS (pas le cycle actuel en cours)
  const pastDurs = all.filter(c => !c.current).map(c => Number(c.duration) || 28);
  const avg = pastDurs.length > 0
    ? Math.round(pastDurs.reduce((a, b) => a + b, 0) / pastDurs.length)
    : durs[0] || 28;
  const isRegular = pastDurs.length > 1 ? (Math.max(...pastDurs) - Math.min(...pastDurs)) <= 3 : true;

  const rMin = Math.max(17, minD - 4);
  const rMax = Math.min(45, maxD + 4);
  const span = rMax - rMin;
  const pct = d => ((d - rMin) / span * 100).toFixed(1);

  const MOIS = ['jan','fév','mars','avr','mai','juin','juil','août','sept','oct','nov','déc'];
  const monthLabel = str => { const [y, m] = str.split('-').map(Number); return MOIS[m - 1] + ' ' + String(y).slice(2); };

  const s = SAISONS[ST.currentSaison];

  const gridLines = [];
  for (let d = Math.ceil(rMin / 7) * 7; d <= rMax; d += 7) gridLines.push(d);
  const gridHtml = gridLines.map(g =>
    `<div style="position:absolute;top:0;left:${pct(g)}%;width:1px;height:100%;background:white;opacity:.7;"></div>`
  ).join('');

  const barsHtml = all.map(c => {
    const dur = c.duration || 28;
    return `<div style="display:flex;align-items:center;margin-bottom:5px;">
      <div style="width:44px;font-size:10px;color:${c.current ? 'var(--noir)' : 'var(--gris)'};font-weight:${c.current ? '600' : '400'};text-align:right;padding-right:8px;flex-shrink:0;">${monthLabel(c.start)}</div>
      <div style="flex:1;height:18px;position:relative;background:var(--sable);border-radius:6px;overflow:hidden;">
        ${gridHtml}
        <div style="position:absolute;top:0;left:0;bottom:0;right:${(100 - pct(dur)).toFixed(1)}%;background:${c.current ? s.grad : '#C4AE95'};border-radius:6px;"></div>
      </div>
      <div style="width:26px;font-size:10px;font-weight:600;color:var(--noir);padding-left:6px;flex-shrink:0;">${dur}j</div>
    </div>`;
  }).join('');

  const axisHtml = `<div style="display:flex;margin-top:2px;">
    <div style="width:44px;flex-shrink:0;"></div>
    <div style="flex:1;position:relative;height:14px;">
      ${gridLines.map(g => `<div style="position:absolute;left:${pct(g)}%;transform:translateX(-50%);font-size:9px;color:var(--gris);">${g}</div>`).join('')}
    </div>
    <div style="width:26px;flex-shrink:0;"></div>
  </div>`;

  const summaryHtml = `<div style="display:flex;gap:8px;margin-bottom:14px;">
    <div style="background:var(--creme);border-radius:10px;padding:8px 10px;text-align:center;flex:1;">
      <div style="font-size:18px;font-weight:700;font-family:var(--serif);color:var(--noir);">${avg}j</div>
      <div style="font-size:9px;color:var(--gris);margin-top:2px;">durée moy.</div>
    </div>
    <div style="background:var(--creme);border-radius:10px;padding:8px 10px;text-align:center;flex:1;">
      <div style="font-size:18px;font-weight:700;font-family:var(--serif);color:var(--noir);">${all.length}</div>
      <div style="font-size:9px;color:var(--gris);margin-top:2px;">cycles</div>
    </div>
    <div style="background:var(--creme);border-radius:10px;padding:8px 10px;text-align:center;flex:1;">
      <div style="font-size:18px;">${isRegular ? '🌿' : '〰️'}</div>
      <div style="font-size:9px;color:var(--gris);margin-top:2px;">${isRegular ? 'régulier' : 'variable'}</div>
    </div>
  </div>`;

  list.innerHTML = summaryHtml + barsHtml + axisHtml;
}
function exportData() {
  const data = localStorage.getItem('sakinapp_v1');
  if (!data) { showToast('Aucune donnée à sauvegarder.'); return; }
  const filename = 'sakinapp_backup_' + new Date().toISOString().slice(0,10) + '.json';
  if (navigator.share && /iphone|ipad|ipod/i.test(navigator.userAgent)) {
    const file = new File([data], filename, { type: 'application/json' });
    navigator.share({ files: [file], title: 'SakinApp – Sauvegarde' }).catch(() => {});
  } else {
    const a = document.createElement('a');
    a.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(data);
    a.download = filename;
    a.click();
  }
}
function importData() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,application/json';
  input.onchange = () => {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (typeof parsed !== 'object' || parsed === null) throw new Error();
        // Bloquer les champs de session — ne doivent jamais venir d'un fichier externe
        ['supabaseUserId','supabaseEmail',
         'isAuthenticated','authDate','userEmail','welcomeEmailSent'].forEach(f => delete parsed[f]);
        if (confirm('Restaurer ces données ? Tes données actuelles seront remplacées.')) {
          localStorage.setItem('sakinapp_v1', JSON.stringify(parsed));
          location.reload();
        }
      } catch { showToast('Fichier invalide. Vérifie que c\'est bien une sauvegarde SakinApp.'); }
    };
    reader.readAsText(file);
  };
  input.click();
}
function deleteMyData() {
  const emailEl = document.getElementById('delete-modal-email');
  if (emailEl) emailEl.textContent = ST.userEmail || ST.supabaseEmail || 'ton adresse email';
  document.getElementById('delete-modal').classList.add('open');
}
function closeDeleteModal() {
  const modal = document.getElementById('delete-modal');
  if (!modal) return;
  modal.classList.remove('open');
  const btn = document.getElementById('delete-confirm-btn');
  if (btn) { btn.disabled = false; btn.textContent = 'Confirmer la suppression'; }
}
async function confirmDeleteMyData() {
  const btn = document.getElementById('delete-confirm-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Suppression en cours…'; }

  try {
    const sb = await initSupabase();
    if (!sb) throw new Error('Connexion impossible. Réessaie dans quelques instants.');

    // Notifier l'équipe (best-effort — ne bloque pas si ça échoue)
    const now = new Date();
    const date = now.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
    const heure = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    await sb.functions.invoke('notify-deletion', {
      body: { date: `${date} à ${heure}` }
    }).catch(() => {});

    // Supprimer le compte Auth + données via la Edge Function
    if (ST.supabaseUserId) {
      const { error: deleteErr } = await sb.functions.invoke('delete-account', {
        body: { userId: ST.supabaseUserId }
      });
      if (deleteErr) throw new Error('La suppression a échoué côté serveur. Réessaie ou contacte sakina.evolution.contact@gmail.com');
    }
    ST.manualSignOut = true;
    await sb.auth.signOut().catch(() => {});
  } catch(e) {
    if (btn) { btn.disabled = false; btn.textContent = 'Confirmer la suppression'; }
    showToast('❌ ' + (e.message || 'Erreur lors de la suppression. Réessaie.'));
    return;
  }

  // Réinitialiser ST avant le clear — pagehide() appelle saveState() au reload
  // et réécrirait un état authentifié dans le localStorage qu'on vient de vider
  ST.isAuthenticated = false;
  ST.supabaseUserId = null;
  ST.userEmail = null;
  ST.supabaseEmail = null;
  ST.prenom = null;
  ST.cycleStart = null;
  ST.hiverEnd = null;
  ST._lastSaison = null;
  // Effacer toutes les données locales (y compris la session Supabase)
  localStorage.clear();
  clearAuthCookie();
  sessionStorage.setItem('sakina_deleted', '1');
  window.location.reload();
}

// ═══════════════════════════════════════════════
// CYCLES PRÉCÉDENTS (saisie manuelle)
// ═══════════════════════════════════════════════
const HIST_SYMPTOMES = [
  { id: 'crampes',       emoji: '🌀', label: 'Crampes' },
  { id: 'fatigue',       emoji: '😴', label: 'Fatigue' },
  { id: 'dos',           emoji: '🦴', label: 'Mal de dos' },
  { id: 'tete',          emoji: '🤕', label: 'Maux de tête' },
  { id: 'humeur',        emoji: '🌊', label: 'Humeur' },
  { id: 'nausee',        emoji: '🤢', label: 'Nausées' },
  { id: 'ballonnements', emoji: '🎈', label: 'Ballonnements' },
  { id: 'insomnie',      emoji: '🌙', label: 'Insomnie' },
  { id: 'seins',         emoji: '🌷', label: 'Seins sensibles' },
  { id: 'acne',          emoji: '🔴', label: 'Acné' },
];

function toggleHistoriqueCycles() {
  const body = document.getElementById('historique-cycles-body');
  const arrow = document.getElementById('historique-cycles-arrow');
  if (!body) return;
  const isOpen = body.style.display !== 'none';
  body.style.display = isOpen ? 'none' : 'block';
  if (arrow) arrow.style.transform = isOpen ? '' : 'rotate(180deg)';
}

function renderHistoriqueCycles() {
  const section = document.getElementById('historique-cycles-section');
  const list = document.getElementById('historique-cycles-list');
  const btn = document.getElementById('btn-add-cycle-hist');
  const limitMsg = document.getElementById('historique-cycles-limit');
  if (!section || !list) return;
  const cycles = ST.historiqueCycles || [];
  const MOIS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  const intLabel = { legere: '🟢 Légères', normale: '🟡 Normales', abondante: '🔴 Abondantes' };
  list.innerHTML = cycles.map(c => {
    const [y, m] = c.dateDebut.split('-').map(Number);
    const moisAn = MOIS[m - 1] + ' ' + y;
    const symp = (c.symptomes || []).map(id => { const s = HIST_SYMPTOMES.find(x => x.id === id); return s ? s.emoji : ''; }).filter(Boolean).join(' ');
    return `<div style="background:var(--creme);border-radius:14px;padding:12px 14px;margin-bottom:8px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px;">
        <div style="font-size:13px;font-weight:700;color:var(--noir);font-family:var(--serif);">${moisAn}</div>
        <div style="display:flex;gap:4px;">
          <button onclick="openAddCycleModal('${c.id}')" style="background:none;border:none;font-size:15px;cursor:pointer;padding:2px 4px;line-height:1;">✏️</button>
          <button onclick="deleteHistoriqueCycle('${c.id}')" style="background:none;border:none;font-size:15px;cursor:pointer;padding:2px 4px;line-height:1;">🗑️</button>
        </div>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;">
        <span style="font-size:11px;background:white;border-radius:8px;padding:3px 8px;color:var(--gris);">📅 ${c.dureeCycle} jours</span>
        <span style="font-size:11px;background:white;border-radius:8px;padding:3px 8px;color:var(--gris);">🩸 ${c.dureeRegles}j de règles</span>
        ${c.intensite ? `<span style="font-size:11px;background:white;border-radius:8px;padding:3px 8px;color:var(--gris);">${_esc(intLabel[c.intensite] || c.intensite)}</span>` : ''}
      </div>
      ${symp ? `<div style="font-size:14px;margin-top:7px;letter-spacing:2px;">${symp}</div>` : ''}
      ${c.note ? `<div style="font-size:11px;color:var(--gris);margin-top:5px;font-style:italic;">"${_esc(c.note)}"</div>` : ''}
    </div>`;
  }).join('');
  const atLimit = cycles.length >= 6;
  if (btn) btn.style.display = atLimit ? 'none' : '';
  if (limitMsg) limitMsg.style.display = atLimit ? '' : 'none';
}

function openAddCycleModal(id) {
  const modal = document.getElementById('add-cycle-modal');
  if (!modal) return;
  const sympGrid = document.getElementById('cycle-hist-symptomes');
  if (sympGrid) {
    sympGrid.innerHTML = HIST_SYMPTOMES.map(s =>
      `<div class="hist-symp-chip" data-id="${s.id}" data-selected="0" onclick="toggleHistSymptome(this)" style="padding:5px 10px;border:1.5px solid var(--sable);border-radius:20px;font-size:12px;cursor:pointer;background:white;transition:background .15s,border-color .15s;">${s.emoji} ${s.label}</div>`
    ).join('');
  }
  document.querySelectorAll('.intensite-opt').forEach(el => {
    el.style.borderColor = 'var(--sable)';
    el.style.background = 'transparent';
    delete el.dataset.selected;
  });
  const titleEl = document.getElementById('add-cycle-modal-title');
  const editIdEl = document.getElementById('cycle-hist-edit-id');
  const dateEl = document.getElementById('cycle-hist-date');
  const dureeEl = document.getElementById('cycle-hist-duree');
  const reglesEl = document.getElementById('cycle-hist-regles');
  const noteEl = document.getElementById('cycle-hist-note');
  const noteCount = document.getElementById('cycle-hist-note-count');
  if (id) {
    const cycle = (ST.historiqueCycles || []).find(c => String(c.id) === String(id));
    if (!cycle) return;
    if (titleEl) titleEl.textContent = '✏️ Modifier ce cycle';
    if (editIdEl) editIdEl.value = id;
    if (dateEl) dateEl.value = cycle.dateDebut;
    if (dureeEl) dureeEl.value = cycle.dureeCycle;
    if (reglesEl) reglesEl.value = cycle.dureeRegles;
    if (noteEl) { noteEl.value = cycle.note || ''; if (noteCount) noteCount.textContent = (cycle.note || '').length; }
    if (cycle.intensite) {
      const opt = document.querySelector(`.intensite-opt[data-val="${cycle.intensite}"]`);
      if (opt) { opt.style.borderColor = 'var(--season)'; opt.style.background = 'var(--creme)'; opt.dataset.selected = '1'; }
    }
    (cycle.symptomes || []).forEach(sid => {
      const chip = sympGrid ? sympGrid.querySelector(`[data-id="${sid}"]`) : null;
      if (chip) { chip.style.borderColor = 'var(--season)'; chip.style.background = 'var(--creme)'; chip.dataset.selected = '1'; }
    });
  } else {
    if (titleEl) titleEl.textContent = '+ Ajouter un cycle passé';
    if (editIdEl) editIdEl.value = '';
    const today = new Date();
    const firstOfMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
    if (dateEl) dateEl.value = firstOfMonth;
    if (dureeEl) dureeEl.value = ST.cycleDuration || 28;
    if (reglesEl) reglesEl.value = 5;
    if (noteEl) { noteEl.value = ''; if (noteCount) noteCount.textContent = 0; }
  }
  modal.classList.add('open');
}

function closeAddCycleModal() {
  const modal = document.getElementById('add-cycle-modal');
  if (modal) modal.classList.remove('open');
}

function selectIntensiteHist(el) {
  document.querySelectorAll('.intensite-opt').forEach(o => {
    o.style.borderColor = 'var(--sable)';
    o.style.background = 'transparent';
    delete o.dataset.selected;
  });
  el.style.borderColor = 'var(--season)';
  el.style.background = 'var(--creme)';
  el.dataset.selected = '1';
}

function toggleHistSymptome(el) {
  if (el.dataset.selected === '1') {
    el.style.borderColor = 'var(--sable)';
    el.style.background = 'white';
    el.dataset.selected = '0';
  } else {
    el.style.borderColor = 'var(--season)';
    el.style.background = 'var(--creme)';
    el.dataset.selected = '1';
  }
}

function saveHistoriqueCycle() {
  const dateEl = document.getElementById('cycle-hist-date');
  const dureeEl = document.getElementById('cycle-hist-duree');
  const reglesEl = document.getElementById('cycle-hist-regles');
  const noteEl = document.getElementById('cycle-hist-note');
  const editIdEl = document.getElementById('cycle-hist-edit-id');
  const dateVal = dateEl ? dateEl.value : '';
  if (!dateVal) { showToast('Choisis une date de début.'); return; }
  const dureeCycle = parseInt(dureeEl ? dureeEl.value : 28);
  if (isNaN(dureeCycle) || dureeCycle < 20 || dureeCycle > 60) { showToast('Durée du cycle : entre 20 et 60 jours.'); return; }
  const dureeRegles = parseInt(reglesEl ? reglesEl.value : 5);
  if (isNaN(dureeRegles) || dureeRegles < 2 || dureeRegles > 10) { showToast('Durée des règles : entre 2 et 10 jours.'); return; }
  if (dureeRegles >= 8) { showToast('Des règles de 8 jours ou plus méritent un avis médical. Pense à en parler à ton médecin ou gynécologue. 🤍'); }
  const selectedIntEl = document.querySelector('.intensite-opt[data-selected="1"]');
  const intensite = selectedIntEl ? selectedIntEl.dataset.val : 'normale';
  const symptomes = Array.from(document.querySelectorAll('.hist-symp-chip[data-selected="1"]')).map(el => el.dataset.id);
  const note = noteEl ? noteEl.value.trim().slice(0, 100) : '';
  if (!ST.historiqueCycles) ST.historiqueCycles = [];
  const editId = editIdEl ? editIdEl.value : '';
  if (editId) {
    const idx = ST.historiqueCycles.findIndex(c => String(c.id) === String(editId));
    if (idx >= 0) ST.historiqueCycles[idx] = { ...ST.historiqueCycles[idx], dateDebut: dateVal, dureeCycle, dureeRegles, intensite, symptomes, note };
  } else {
    if (ST.historiqueCycles.length >= 6) { showToast('Maximum 6 cycles passés.'); return; }
    ST.historiqueCycles.push({ id: Date.now(), dateDebut: dateVal, dureeCycle, dureeRegles, intensite, symptomes, note });
    ST.historiqueCycles.sort((a, b) => b.dateDebut.localeCompare(a.dateDebut));
  }
  saveState();
  closeAddCycleModal();
  renderHistoriqueCycles();
  renderCycleHistory();
  showToast(editId ? 'Cycle mis à jour ✓' : 'Cycle ajouté ✓');
}

function deleteHistoriqueCycle(id) {
  if (!ST.historiqueCycles) return;
  ST.historiqueCycles = ST.historiqueCycles.filter(c => String(c.id) !== String(id));
  saveState();
  renderHistoriqueCycles();
  renderCycleHistory();
  showToast('Cycle supprimé');
}

function openMentionsLegales() {
  document.getElementById('mentions-modal').classList.add('open');
}
function closeMentionsLegales() {
  document.getElementById('mentions-modal').classList.remove('open');
}
function openConfidentialite() {
  document.getElementById('confidentialite-modal').classList.add('open');
}
function closeConfidentialite() {
  document.getElementById('confidentialite-modal').classList.remove('open');
}
function openCGU() {
  document.getElementById('cgu-modal').classList.add('open');
}
function closeCGU() {
  document.getElementById('cgu-modal').classList.remove('open');
}

// ═══════════════════════════════════════════════
// TOUR GUIDÉ — un tooltip par onglet à la 1ère ouverture
// ═══════════════════════════════════════════════
const TAB_TOURS = {
  accueil: {
    emoji: '🏠',
    title: 'Ton tableau de bord',
    text: 'Chaque matin, fais ton check-in, consulte tes rappels spirituels et découvre tes suggestions personnalisées selon ta saison de cycle.',
  },
  cycle: {
    emoji: '🌙',
    title: 'Ton cycle en un coup d\'œil',
    text: 'L\'anneau coloré affiche ta phase en temps réel. Note tes symptômes du jour et démarre un nouveau cycle d\'un simple toucher.',
  },
  ame: {
    emoji: '🤲',
    title: 'Ta connexion spirituelle',
    text: 'Coche tes prières, tes adhkar et ta lecture du Coran. Pendant tes règles, un espace doux et adapté remplace la carte des prières.',
  },
  objectifs: {
    emoji: '🎯',
    title: 'Tes objectifs de la semaine',
    text: 'Coche tes petits défis quotidiens et suis leur progression. Le calendrier colore chaque jour selon ta phase de cycle.',
  },
  moi: {
    emoji: '✨',
    title: 'Ton espace personnel',
    text: 'Consulte ton historique de cycles, ton portrait de cycle et gère tes paramètres. Tes données ne quittent jamais ton téléphone.',
  },
};
let _currentTourTab = null;

function showTabTour(name) {
  if (!TAB_TOURS[name]) return;
  if (localStorage.getItem('tabSeen_' + name)) return;
  _currentTourTab = name;
  const step = TAB_TOURS[name];
  document.getElementById('tour-emoji').textContent = step.emoji;
  document.getElementById('tour-title').textContent = step.title;
  document.getElementById('tour-text').textContent = step.text;
  document.getElementById('tour-dots').innerHTML = '';
  document.getElementById('tour-overlay').style.display = 'flex';
}

function tourNext() {
  document.getElementById('tour-overlay').style.display = 'none';
  if (_currentTourTab) {
    localStorage.setItem('tabSeen_' + _currentTourTab, '1');
    _currentTourTab = null;
  }
}

let _waitingSW = null;
function showUpdateBanner() {
  const banner = document.getElementById('update-banner');
  if (banner) banner.style.display = 'flex';
}
function applyUpdate() {
  if (_waitingSW) {
    _waitingSW.postMessage({ type: 'SKIP_WAITING' });
    navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload(), { once: true });
  } else {
    window.location.reload();
  }
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(reg => {
      if (reg.waiting) { _waitingSW = reg.waiting; showUpdateBanner(); }
      reg.addEventListener('updatefound', () => {
        const newSW = reg.installing;
        if (!newSW) return;
        newSW.addEventListener('statechange', () => {
          if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
            _waitingSW = newSW;
            showUpdateBanner();
          }
        });
      });
    }).catch(() => {});
  });
}

// Toggle section symptômes
function toggleSymptomesSection() {
  const content = document.getElementById('symptomes-content');
  const arrow = document.getElementById('symptomes-arrow');
  if (!content) return;
  const isOpen = content.style.display !== 'none';
  content.style.display = isOpen ? 'none' : 'block';
  if (arrow) arrow.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
}
function toggleHygiene() {
  const content = document.getElementById('hygiene-content');
  const arrow = document.getElementById('hygiene-arrow');
  if (!content) return;
  const isOpen = content.style.display !== 'none';
  content.style.display = isOpen ? 'none' : 'block';
  if (arrow) arrow.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
}

