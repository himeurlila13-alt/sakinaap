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
  mouvDone: {},
  seanceDone: {},
  notifFreq: 2,
  waitlistEmail: null,
  feedbackSent: false,
  installBannerDismissed: false,
  lastDailyReset: null,
  lastWeeklyReset: null,
  eveningCheckinDate: null,
  eveningCheckinMood: null,
  cycleHistory: [],
  historiqueCycles: [],
  isPremium: false,
  seanceValidatedCount: 0,
  seanceLevel: 1,
  amrapRecord: null,
  printempsUpgradeDone: false,
  levelMaxShown: false,
  printempsBasCount: 0,
  _lastCycleNum: null,
  weeklyObjChecks: {},
  customObjectifs: [],
  customObjChecks: {},
  marche: { phase: null, checks: {}, custom: [] },
  calmeOverride: null,
  trialEnded: false,
  bilanShown: false,
  _lastSaison: null,
  hiverEnd: null,
  premiumPlan: null,
  premiumSince: null,
  installDate: null,
  trialBannerDismissed: false,
  supabaseUserId: null,
  supabaseEmail: null,
  reportConsecutif: 0,
  lastReportDate: null,
  feedbackSport: {},
  streakPhaseSeances: 0,
  streakPhaseNom: null,
  seanceSurpriseShownCycle: false,
  totalSeancesAll: 0,
  totalReportsAll: 0,
  checkpointProgress: 0,
  niveauStreak: 0,
  _lastNiveauStreak: null,
  _lastNiveauPhase: null,
  _proposeNewEx5: false,
  _proposeFatigue3: false,
  isAuthenticated: false,
  userEmail: null,
  authDate: null,
  welcomeEmailSent: false,
  manualSignOut: false,
  consentDate: null,
  consentVersion: null,
  lastObjResetDate: null,
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
      await verifyPremiumFromDB(sb, session.user.id);
      checkPaymentSuccess();
      checkTrialEnd();
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
        // Niveaux : garder le plus élevé
        seanceLevel: Math.max(ST.seanceLevel || 1, remote.seanceLevel || 1),
        seanceValidatedCount: Math.max(ST.seanceValidatedCount || 0, remote.seanceValidatedCount || 0),
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
    delete toSave.isPremium;      // toujours recalculé depuis subscriptions
    delete toSave.premiumPlan;
    delete toSave.premiumSince;
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

async function verifyPremiumFromDB(sb, userId) {
  try {
    const { data } = await sb.from('subscriptions').select('status,plan,current_period_end').eq('user_id', userId).single();
    if (!data) { ST.isPremium = false; ST.premiumPlan = null; saveState(); return; }
    const now = new Date().toISOString();
    ST.isPremium = data.status === 'active' || data.status === 'past_due' ||
      (data.status === 'canceled' && data.current_period_end && data.current_period_end > now);
    ST.premiumPlan = ST.isPremium ? data.plan : null;
    if (!ST.isPremium) ST.trialEnded = false;
    saveState();
  } catch(e) {}
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
    jours: [1,5],
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
    sport: {
      seance: { name:'Douceur profonde', duration:'7 min', meta:'Sol · Tapis · Zéro impact',
        exercices:[
          {num:'01', name:'Respiration abdominale', detail:'Allongée, mains sur le ventre. 10 respirations.'},
          {num:'02', name:'Étirement bas du dos', detail:'Genoux écartés, front au sol. 2 minutes.'},
          {num:'03', name:'Rotation douce dos', detail:'Genoux pliés, tomber à droite/gauche. 5×.'},
          {num:'04', name:'Étirement hanches', detail:'Genou sur la poitrine. 30 sec chaque côté.'},
        ]
      },
      mouvements: ['Étirements doux','Mobilité du bassin','Étirement bas du dos','Respiration profonde','Marche contemplative']
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
    jours: [6,13],
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
    sport: {
      seance: { name:'Réveil en douceur', duration:'12 min', meta:'Mix sol + debout',
        exercices:[
          {num:'01', name:'Rotations d\'échauffement', detail:'Chevilles, épaules, cou. 2 minutes.'},
          {num:'02', name:'10 squats lents', detail:'Descendre lentement, remonter en expirant.'},
          {num:'03', name:'Gainage genoux', detail:'Planche sur les genoux. Tenir 20 sec. 3×.'},
          {num:'04', name:'10 fentes alternées', detail:'Genou à 90°. 8 par jambe.'},
        ]
      },
      mouvements: ['Pilates doux','Marche rapide','Squats doux','Fentes légères','Vélo tranquille']
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
    jours: [14,17],
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
    sport: {
      seance: { name:'Circuit énergie', duration:'18 min', meta:'Mix debout + sol',
        exercices:[
          {num:'01', name:'Marche sur place', detail:'2 minutes en montant progressivement.'},
          {num:'02', name:'12 squats', detail:'3 séries. Descendre lentement, remonter fort.'},
          {num:'03', name:'10 pompes modifiées', detail:'Sur les genoux ou contre le mur.'},
          {num:'04', name:'30 sec gainage', detail:'Planche complète ou genoux. 3 fois.'},
        ]
      },
      mouvements: ['HIIT doux','Cardio léger','Renforcement','Danse','Pompes','Squats sautés doux']
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
    jours: [18,28],
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
    sport: {
      seance: { name:'Libération SPM', duration:'12 min', meta:'Mix sol + mur',
        exercices:[
          {num:'01', name:'Respiration libératrice', detail:'Inspirer 4, retenir 4, expirer 8. 5 cycles.'},
          {num:'02', name:'Ouverture hanches au mur', detail:'Plantes des pieds ensemble. 2 minutes.'},
          {num:'03', name:'Pont fessier lent', detail:'Mouvement fluide. 10 fois.'},
          {num:'04', name:'Legs up the wall', detail:'Jambes à la verticale. 3 minutes. Yeux fermés.'},
        ]
      },
      mouvements: ['Marche en plein air','Circuit léger','Yoga doux','Étirements profonds','Respiration libératrice']
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

// ═══════════════════════════════════════════════
// PREMIUM DATA
// ═══════════════════════════════════════════════
const RECETTES = {
  hiver: [
    { nom:'Soupe lentilles-curcuma-gingembre', emoji:'🍲', pourquoi:'Le fer des lentilles compense tes pertes. Curcuma + gingembre réduisent l\'inflammation naturellement.', ingredients:['200g lentilles corail','600ml bouillon de légumes','1 cc curcuma, 1 cc gingembre râpé','1 oignon, 2 gousses d\'ail','Jus d\'un citron'], etapes:['Faire revenir oignon et ail 3 min à l\'huile d\'olive','Ajouter lentilles + bouillon','Cuire 15 min à feu moyen','Mixer la moitié pour crémer','Assaisonner, presser le citron'] },
    { nom:'Bowl épinards-sardines au sésame', emoji:'🥣', pourquoi:'Oméga-3 des sardines + fer des épinards — le duo anti-crampes de l\'Hiver par excellence.', ingredients:['1 boîte sardines à l\'huile d\'olive','Grosse poignée d\'épinards frais','80g riz complet cuit','1 cs sésame toasté','Huile d\'olive, jus de citron'], etapes:['Disposer le riz dans le bol','Faire revenir les épinards 2 min à l\'huile','Ajouter les sardines égouttées','Arroser d\'huile d\'olive et citron','Parsemer de sésame toasté'] },
    { nom:'Dattes farcies amandes-chocolat noir', emoji:'🍫', pourquoi:'Magnésium du chocolat + fer des dattes + bons gras des amandes — collation anti-fatigue complète.', ingredients:['6 dattes Medjool','Poignée d\'amandes entières','2 carrés chocolat noir 70%+','Fleur de sel'], etapes:['Ouvrir les dattes et retirer les noyaux','Glisser une amande dans chaque datte','Fondre le chocolat au bain-marie','Napper les dattes de chocolat fondu','Fleur de sel + réfrigérer 10 min'] },
    { nom:'Tajine de poulet citron-olives', emoji:'🍗', pourquoi:'Les protéines du poulet reconstruisent les tissus. Le citron confit stimule l\'absorption du fer non-héminique.', ingredients:['2 cuisses de poulet','1 citron confit coupé en quartiers','Poignée d\'olives vertes','1 oignon, 2 gousses d\'ail','Cumin, paprika, coriandre fraîche'], etapes:['Faire dorer le poulet sur toutes les faces','Ajouter oignon et ail émincés','Incorporer les épices, remuer 1 min','Ajouter citron confit, olives et 150ml eau','Couvrir et mijoter 35 min à feu doux'] },
    { nom:'Potage butternut-lentilles-noisettes', emoji:'🎃', pourquoi:'Le bêta-carotène du butternut soutient les hormones. Les lentilles apportent le fer dont tu as besoin pendant l\'Hiver.', ingredients:['½ butternut en dés','100g lentilles vertes','1 oignon, 500ml bouillon','1 cc cumin, sel, poivre','Poignée de noisettes torréfiées'], etapes:['Faire revenir oignon 3 min','Ajouter butternut, lentilles et bouillon','Cuire 25 min à feu moyen','Mixer finement, ajuster la texture','Servir avec les noisettes concassées'] },
    { nom:'Omelette aux champignons & herbes fraîches', emoji:'🍳', pourquoi:'Les œufs sont riches en fer et en vitamine B12. Les champignons apportent du sélénium, précieux pendant les règles.', ingredients:['3 œufs','100g champignons de Paris émincés','½ oignon, 1 gousse d\'ail','Persil, ciboulette fraîche','Huile d\'olive, sel, poivre'], etapes:['Faire revenir champignons, oignon et ail 5 min','Battre les œufs avec les herbes ciselées','Verser sur les champignons en poêle chaude','Laisser prendre 2 min à feu moyen','Plier en deux, servir aussitôt'] },
    { nom:'Riz complet aux pois chiches-épinards', emoji:'🍚', pourquoi:'Le combo riz complet + pois chiches forme des protéines complètes. Le fer des épinards est mieux absorbé avec la vitamine C des tomates.', ingredients:['80g riz complet cuit','150g pois chiches égouttés','Grosse poignée d\'épinards','2 tomates cerises coupées','Huile d\'olive, paprika fumé, citron'], etapes:['Faire revenir les pois chiches au paprika 3 min','Ajouter les épinards, remuer 2 min','Mélanger avec le riz chaud','Ajouter les tomates cerises','Arroser d\'huile d\'olive et de citron'] },
    { nom:'Œufs cocotte épinards-crème', emoji:'🥚', pourquoi:'Les œufs apportent 13g de protéines et du fer biodisponible. La chaleur du four réconforte pendant les règles et les épinards reconstituent les réserves en fer perdues.', ingredients:['2 œufs','Grosse poignée d\'épinards','2 cs crème fraîche','1 gousse d\'ail, sel, muscade','Pain complet grillé'], etapes:['Préchauffer le four à 180°C','Faire revenir les épinards à l\'ail 2 min','Répartir dans un ramequin avec la crème','Casser les œufs par-dessus, saler et muscader','Cuire 12 min — blanc pris, jaune coulant'] },
    { nom:'Velouté potimarron-lentilles corail', emoji:'🎃', pourquoi:'Le potimarron est riche en bêta-carotène précurseur de vitamine A. Associé aux lentilles corail (fer + protéines), ce velouté réchauffe et reconstitue les réserves de l\'Hiver.', ingredients:['½ potimarron en dés','100g lentilles corail','1 oignon, 500ml bouillon de légumes','1 cc gingembre, ½ cc curcuma','Graines de courge, sel, poivre'], etapes:['Faire revenir l\'oignon émincé 3 min','Ajouter potimarron, lentilles, épices et bouillon','Cuire 20 min à feu moyen','Mixer finement en velouté lisse','Servir avec les graines de courge'] },
    { nom:'Bœuf mijoté curcuma-tomates', emoji:'🍖', pourquoi:'Le bœuf est une excellente source de fer héminique (biodisponibilité 15-35%). Le curcuma réduit les prostaglandines responsables des crampes selon les études récentes en nutrition cyclique.', ingredients:['200g bœuf en morceaux (paleron)','1 boîte tomates pelées','100g petits pois surgelés','1 cc curcuma, 1 cc cumin, 1 oignon','Huile d\'olive, sel, poivre'], etapes:['Faire dorer le bœuf sur toutes les faces','Ajouter l\'oignon émincé et les épices','Verser les tomates pelées écrasées','Couvrir et mijoter 45 min à feu doux','Ajouter les petits pois les 5 dernières min'] },
    { nom:'Tartines sardines-avocat-citron', emoji:'🥫', pourquoi:'Les sardines combinent fer héminique et oméga-3 anti-inflammatoires en un seul aliment. L\'avocat améliore l\'absorption des vitamines liposolubles présentes dans les sardines.', ingredients:['1 boîte sardines à l\'huile d\'olive','1 avocat mûr','2 tranches pain complet grillé','Jus d\'un citron, ciboulette fraîche','Fleur de sel, piment d\'Espelette'], etapes:['Griller le pain','Écraser l\'avocat avec le citron à la fourchette','Tartiner généreusement les tranches','Disposer les sardines égouttées par-dessus','Ciboulette ciselée, fleur de sel et piment'] },
    { nom:'Bowl quinoa-betterave-noix-feta', emoji:'🟣', pourquoi:'La betterave est riche en fer et en nitrates qui améliorent l\'oxygénation cellulaire pendant les règles. Les noix apportent des oméga-3 et du magnésium anti-crampes.', ingredients:['80g quinoa cuit','1 betterave cuite en dés','30g noix concassées','50g feta émiettée','1 cs huile d\'olive, vinaigre balsamique, sel'], etapes:['Cuire le quinoa 12 min, laisser tiédir','Couper la betterave en petits dés','Assembler quinoa + betterave dans un bol','Ajouter noix et feta émiettée','Assaisonner huile d\'olive + balsamique'] },
    { nom:'Soupe haricots blancs-kale-ail', emoji:'🫘', pourquoi:'Les haricots blancs apportent 3mg de fer pour 100g. Le kale contient plus de vitamine C que l\'orange, doublant l\'absorption du fer végétal — synergie bien documentée entre vitamine C et absorption du fer végétal.', ingredients:['1 boîte haricots blancs égouttés','Grosse poignée de kale ou chou frisé émincé','2 gousses d\'ail, 1 oignon','500ml bouillon de légumes','Sel, poivre, huile d\'olive'], etapes:['Faire revenir ail et oignon 3 min dans l\'huile','Ajouter les haricots et le bouillon','Mijoter 10 min à feu moyen','Ajouter le kale, cuire encore 5 min','Ajuster sel et poivre, servir chaud'] },
    { nom:'Dahl de pois cassés gingembre-citron', emoji:'🟡', pourquoi:'Les pois cassés contiennent 23g de protéines et du magnésium anti-crampes pour 100g sec. Le gingembre frais réduit significativement la douleur menstruelle via l\'inhibition des prostaglandines.', ingredients:['150g pois cassés jaunes','1 oignon, 2 gousses d\'ail, 2cm gingembre râpé','1 cc curcuma, 1 cc coriandre moulue','500ml bouillon de légumes','Jus d\'un citron, coriandre fraîche, sel'], etapes:['Rincer les pois cassés','Faire revenir oignon, ail, gingembre et épices 3 min','Ajouter pois cassés et bouillon','Cuire 25 min jusqu\'à consistance crémeuse','Presser le citron, garnir de coriandre fraîche'] },
    { nom:'Lablabi — soupe de pois chiches au cumin', emoji:'🫘', pourquoi:'Les pois chiches apportent 3mg de fer et de la vitamine B6 — essentiels pour reconstituer les réserves pendant les règles. Le pain complet ajoute des glucides complexes énergétiques. Plat tunisien réconfortant, économique et rapide.', ingredients:['400g pois chiches égouttés','2 œufs cuits mollets','2 tranches pain complet rassis en cubes','2 gousses d\'ail écrasées','1 cc cumin, ½ cc harissa douce, jus de citron, huile d\'olive, sel'], etapes:['Chauffer les pois chiches dans leur jus 5 min avec l\'ail et le cumin','Cuire les œufs mollets 6 min à l\'eau bouillante, écaler','Répartir le pain en cubes dans les bols','Verser la soupe de pois chiches par-dessus','Poser les œufs coupés en deux, harissa douce, citron et filet d\'huile d\'olive'] },
    { nom:'Harira légère poulet-lentilles-tomates', emoji:'🍲', pourquoi:'La harira est l\'une des soupes les plus complètes : lentilles (fer + protéines), tomates (vitamine C pour absorber le fer), herbes fraîches. Emblème de la cuisine marocaine et algérienne, parfaite pour réchauffer et reconstituer le corps en Hiver.', ingredients:['150g poulet halal en petits morceaux','100g lentilles corail','1 boîte tomates pelées + 2 cs concentré de tomates','1 oignon, 2 gousses d\'ail, 1 branche de céleri','Coriandre et persil frais, cumin, cannelle, sel, poivre'], etapes:['Faire revenir oignon, céleri et poulet 5 min','Ajouter tomates pelées, concentré, ail et épices','Verser les lentilles et 800ml d\'eau chaude','Mijoter 25 min à feu doux','Terminer avec les herbes fraîches ciselées, ajuster sel et servir chaud'] },
    { nom:'Bissara — crème de fèves à l\'huile d\'olive', emoji:'🫛', pourquoi:'Les fèves sont riches en fer végétal, en protéines et en magnésium — le trio anti-crampes de l\'Hiver. L\'huile d\'olive et le cumin facilitent la digestion souvent perturbée pendant les règles. Plat marocain du quotidien, économique et réconfortant.', ingredients:['400g fèves séchées pelées (ou surgelées)','4 gousses d\'ail','1 cs cumin moulu, sel','Huile d\'olive généreuse','Piment doux ou paprika, persil frais'], etapes:['Cuire les fèves dans l\'eau avec l\'ail 20 min','Égoutter en conservant un peu d\'eau de cuisson','Mixer finement en ajoutant l\'eau de cuisson selon la texture souhaitée','Verser dans des bols, creuser un puits au centre','Remplir d\'huile d\'olive, saupoudrer de cumin et piment, servir chaud'] },
  ],
  printemps: [
    { nom:'Bowl avocat-œuf poché-quinoa', emoji:'🥑', pourquoi:'Les bons gras de l\'avocat soutiennent la montée des œstrogènes. Le quinoa apporte les 9 acides aminés essentiels.', ingredients:['80g quinoa cuit','1 œuf poché','½ avocat tranché','1 cs graines de lin moulues','Citron, fleur de sel'], etapes:['Cuire le quinoa 12 min, égoutter','Porter l\'eau à frémissement pour l\'œuf','Pocher l\'œuf 3 min','Assembler quinoa + avocat + œuf','Lin moulu, citron, sel'] },
    { nom:'Salade fruits rouges & graines de lin', emoji:'🍓', pourquoi:'Les phyto-œstrogènes du lin amplifient ton élan naturel. Les antioxydants des fruits rouges protègent tes cellules.', ingredients:['Mélange fruits rouges (fraises, myrtilles, framboises)','150g yaourt grec','1 cs graines de lin moulues','1 cc miel','Quelques feuilles de menthe'], etapes:['Disposer les fruits dans un bol','Verser le yaourt à côté','Parsemer de graines de lin moulues','Filet de miel, feuilles de menthe fraîche'] },
    { nom:'Wrap brocoli-poulet-houmous', emoji:'🌯', pourquoi:'Les fibres du brocoli éliminent l\'excès d\'œstrogènes. Les protéines du poulet soutiennent l\'énergie montante.', ingredients:['1 grande galette de blé complet','100g poulet cuit émincé','Fleurets de brocoli cuits vapeur','2 cs houmous maison','Paprika, citron'], etapes:['Chauffer la galette 30 sec','Tartiner d\'houmous généreusement','Ajouter le poulet et le brocoli','Saupoudrer de paprika et presser le citron','Rouler serré et couper en deux'] },
    { nom:'Saumon vapeur & riz basmati aux herbes', emoji:'🐟', pourquoi:'Les oméga-3 du saumon soutiennent la production d\'œstrogènes. Le zinc favorise la maturation folliculaire.', ingredients:['150g pavé de saumon','80g riz basmati cuit','Jus de citron, aneth frais','1 cc huile d\'olive','Sel, poivre, zeste de citron'], etapes:['Cuire le saumon vapeur 10 min','Assaisonner le riz avec huile et herbes','Dresser le saumon sur le riz','Zeste + jus de citron par-dessus','Parsemer d\'aneth frais ciselé'] },
    { nom:'Buddha bowl brocoli-edamame-sésame', emoji:'🥦', pourquoi:'Le brocoli est riche en indole-3-carbinol qui régule les œstrogènes. L\'edamame apporte des phyto-œstrogènes naturels.', ingredients:['Fleurets de brocoli rôtis','80g edamame cuits','80g riz complet ou quinoa','1 cs sauce soja','Sésame toasté, gingembre râpé'], etapes:['Rôtir le brocoli 20 min au four à 200°C','Cuire l\'edamame 5 min à l\'eau bouillante','Disposer les céréales dans le bol','Ajouter brocoli et edamame','Sauce soja + sésame + gingembre'] },
    { nom:'Salade tiède lentilles-chèvre chaud-noix', emoji:'🥗', pourquoi:'Les lentilles apportent du fer et du zinc pour la phase folliculaire. Le fromage de chèvre est riche en calcium et protéines.', ingredients:['120g lentilles vertes cuites','60g fromage de chèvre en rondelles','Poignée de noix','Mâche ou roquette','Vinaigrette moutarde-miel'], etapes:['Tiédir les lentilles à la poêle avec une noix d\'huile','Griller les rondelles de chèvre sous le gril 3 min','Disposer la salade verte','Ajouter lentilles et noix','Poser le chèvre chaud, arroser de vinaigrette'] },
    { nom:'Tartines avocat-tomates-graines de courge', emoji:'🍞', pourquoi:'Le bon gras de l\'avocat favorise l\'absorption des vitamines liposolubles. Les graines de courge sont riches en zinc, essentiel à l\'ovocyte.', ingredients:['2 tranches de pain complet grillé','1 avocat mûr','Tomates cerises coupées en deux','1 cs graines de courge','Fleur de sel, piment d\'Espelette, citron'], etapes:['Griller les tranches de pain','Écraser l\'avocat à la fourchette avec le citron','Tartiner généreusement','Disposer les tomates cerises','Graines de courge, fleur de sel, piment'] },
    { nom:'Omelette roulée aux herbes printanières', emoji:'🌿', pourquoi:'3 œufs = 18g de protéines complètes et vitamines B essentielles à la synthèse des œstrogènes. Les herbes fraîches apportent de la vitamine C qui soutient la montée hormonale du Printemps.', ingredients:['3 œufs','Ciboulette, persil, basilic frais ciselés','½ poivron rouge en lanières fines','1 cc huile d\'olive, sel, poivre','30g fromage de chèvre frais'], etapes:['Battre les œufs avec les herbes, sel, poivre','Faire chauffer l\'huile dans une poêle antiadhésive','Verser les œufs, cuire 1 min à feu doux','Déposer poivron et fromage de chèvre','Rouler délicatement, servir aussitôt'] },
    { nom:'Smoothie bowl kéfir-fruits rouges-lin', emoji:'🍓', pourquoi:'Le kéfir est l\'une des sources de probiotiques les plus denses — l\'axe intestin-cerveau influence directement l\'équilibre hormonal. Le lin moulu apporte des lignanes phyto-œstrogènes naturels.', ingredients:['150ml kéfir de lait','100g fruits rouges surgelés','1 banane','1 cs graines de lin moulues','Granola nature, amandes effilées'], etapes:['Mixer kéfir + fruits rouges + banane','Verser dans un bol large','Parsemer de graines de lin moulues','Ajouter le granola pour le croquant','Décorer d\'amandes effilées, servir frais'] },
    { nom:'Tofu sauté gingembre-poivrons colorés', emoji:'🟧', pourquoi:'Le tofu ferme contient 14g de protéines et du zinc essentiel à la maturation folliculaire. Les poivrons (200mg vit C/100g) boostent l\'absorption du zinc — synergie clé en phase folliculaire.', ingredients:['200g tofu ferme en cubes','1 poivron rouge + 1 poivron jaune en lamelles','2cm gingembre râpé, 1 gousse d\'ail','1 cs sauce soja, 1 cc miel, huile de sésame','Sésame toasté, ciboulette'], etapes:['Éponger le tofu avec du papier absorbant','Faire dorer les cubes de tofu 4 min par face','Retirer le tofu, faire sauter les poivrons 3 min','Ajouter gingembre, ail, sauce soja et miel','Remettre le tofu, mélanger, sésame + ciboulette'] },
    { nom:'Salade de quinoa-légumes rôtis-tahini', emoji:'🥗', pourquoi:'Le quinoa est la seule céréale contenant les 9 acides aminés essentiels — idéal en phase folliculaire pour reconstruire les réserves musculaires. Le tahini apporte du zinc et du calcium essentiels.', ingredients:['100g quinoa cuit','1 courgette + 1 poivron rôtis au four','2 cs tahini (purée de sésame)','Jus d\'1 citron, 1 cs huile d\'olive, sel','Menthe fraîche, graines de courge'], etapes:['Rôtir les légumes en dés 20 min à 200°C','Cuire le quinoa, laisser tiédir','Mélanger tahini + citron + huile + sel en sauce','Assembler quinoa + légumes dans un bol','Napper de sauce tahini, menthe + graines de courge'] },
    { nom:'Velouté brocoli-amandes-lait de coco', emoji:'🥦', pourquoi:'Le brocoli est la plante la plus riche en indole-3-carbinol, qui aide le foie à métaboliser les œstrogènes. Les amandes ajoutent du zinc et des acides gras essentiels pour la maturation folliculaire.', ingredients:['1 brocoli en fleurets','30g amandes mondées','200ml lait de coco','1 oignon, 400ml bouillon de légumes','Sel, poivre, muscade, graines de courge'], etapes:['Faire revenir l\'oignon 3 min','Ajouter brocoli, amandes et bouillon','Cuire 15 min à couvert','Ajouter le lait de coco, mixer finement','Servir avec graines de courge et muscade'] },
    { nom:'Cabillaud vapeur-légumes & herbes', emoji:'🐟', pourquoi:'Le cabillaud est la protéine la plus légère (17g/100g) et la plus riche en iode, indispensable à la production des hormones thyroïdiennes qui régulent le cycle menstruel.', ingredients:['150g filet de cabillaud','Haricots verts, carottes en bâtonnets','Herbes de Provence, 1 cc huile d\'olive','Jus de citron, sel, poivre','80g riz basmati ou quinoa cuit'], etapes:['Assaisonner le cabillaud d\'herbes, citron, sel','Cuire vapeur 8 min avec les légumes','Préparer le riz ou quinoa séparément','Dresser le poisson sur les céréales','Légumes à côté, filet d\'huile d\'olive'] },
    { nom:'Bowl fromage blanc-kiwi-graines de courge', emoji:'🥝', pourquoi:'Le fromage blanc apporte 11g de protéines et des probiotiques pour le microbiome. Le kiwi contient plus de vitamine C que l\'orange — crucial pour la maturation folliculaire et l\'absorption du zinc.', ingredients:['200g fromage blanc 0% ou 3%','2 kiwis pelés et tranchés','1 cs graines de courge','1 cc miel','1 cc graines de chia, quelques myrtilles'], etapes:['Verser le fromage blanc dans un bol','Éplucher et trancher les kiwis','Disposer kiwis et myrtilles sur le dessus','Parsemer graines de courge + chia','Filet de miel pour finir'] },
    { nom:'Salade de carottes à la fleur d\'oranger', emoji:'🥕', pourquoi:'Les carottes sont riches en bêta-carotène, précurseur des œstrogènes qui montent au Printemps. Les raisins secs apportent du fer et des sucres naturels pour l\'élan folliculaire. L\'eau de fleur d\'oranger est un ingrédient identitaire maghrébin, parfumé et accessible.', ingredients:['4 carottes râpées finement','30g raisins secs blonds','1 cs eau de fleur d\'oranger','Jus d\'1 citron, 1 cs huile d\'olive','½ cc cumin, sel, quelques feuilles de coriandre fraîche'], etapes:['Râper les carottes finement à la râpe ou au robot','Réhydrater les raisins secs 5 min dans l\'eau tiède, égoutter','Mélanger carottes, raisins et coriandre ciselée','Assaisonner fleur d\'oranger + citron + huile + cumin + sel','Mélanger délicatement, laisser reposer 10 min avant de servir'] },
    { nom:'Taboulé de boulgour aux herbes fraîches', emoji:'🌿', pourquoi:'Le boulgour est une alternative économique au quinoa — mêmes fibres, mêmes protéines, ancrage culturel maghrébin. Le persil est riche en vitamine C qui soutient la montée des œstrogènes. Plat frais et léger, parfait pour le regain d\'énergie du Printemps.', ingredients:['120g boulgour fin','Gros bouquet de persil plat ciselé finement','Quelques feuilles de menthe fraîche ciselées','2 tomates en petits dés, ½ concombre en dés','Jus de 2 citrons, 3 cs huile d\'olive, sel'], etapes:['Verser de l\'eau bouillante sur le boulgour, couvrir 15 min, égoutter','Laisser refroidir complètement','Ciseler finement persil et menthe','Mélanger boulgour + herbes + tomates + concombre','Assaisonner citron + huile + sel, servir bien frais'] },
  ],
  ete: [
    { nom:'Salade pastèque-grenade-menthe-feta', emoji:'🍉', pourquoi:'Ultra-hydratante à l\'ovulation quand le corps chauffe. La grenade est un antioxydant puissant pour les cellules ovariennes.', ingredients:['Tranches de pastèque sans graines','Grains de ½ grenade','60g feta émiettée','Feuilles de menthe fraîche','Jus de citron vert'], etapes:['Couper la pastèque en cubes','Égrener la grenade au-dessus','Émietter la feta par-dessus','Ajouter la menthe ciselée finement','Presser le citron vert, servir frais'] },
    { nom:'Filet de poisson vapeur & taboulé léger', emoji:'🐟', pourquoi:'Les protéines légères soutiennent l\'ovulation. Le zinc des herbes et céréales renforce l\'immunité à son pic.', ingredients:['150g filet de poisson blanc (cabillaud, lieu)','120g taboulé (boulgour, persil, tomates)','1 cs graines de courge','Huile d\'olive extra-vierge','Citron, sel, poivre'], etapes:['Cuire le poisson vapeur 8 min','Préparer le taboulé avec persil, tomates et menthe','Dresser le poisson sur le taboulé','Parsemer de graines de courge','Huile d\'olive et quartier de citron'] },
    { nom:'Smoothie myrtilles-épinards-gingembre', emoji:'🫐', pourquoi:'Les antioxydants des myrtilles protègent les ovocytes. Le gingembre est anti-inflammatoire et booste la digestion.', ingredients:['100g myrtilles surgelées','Grosse poignée d\'épinards','2cm gingembre frais râpé','150ml lait de coco léger','1 cc miel'], etapes:['Tout mettre dans le blender','Mixer 45 secondes à haute vitesse','Goûter et ajuster le miel','Servir immédiatement dans un grand verre'] },
    { nom:'Brochettes poulet-légumes grillés', emoji:'🍢', pourquoi:'Les protéines maigres du poulet soutiennent l\'ovulation. Les légumes grillés apportent des antioxydants au moment où ton énergie est au sommet.', ingredients:['200g blanc de poulet en cubes','1 courgette, 1 poivron rouge','1 cs huile d\'olive','Herbes de Provence, paprika','Jus de citron, sel, poivre'], etapes:['Couper poulet et légumes en morceaux','Mariner 15 min dans huile + épices + citron','Alterner sur les brochettes','Griller 12 min en retournant','Servir avec une salade verte'] },
    { nom:'Gaspacho tomates-poivron-concombre', emoji:'🍅', pourquoi:'Hydratant et riche en lycopène antioxydant. Parfait à l\'ovulation pour soutenir les cellules ovariennes sans alourdir le corps.', ingredients:['4 tomates bien mûres','1 poivron rouge','½ concombre','1 gousse d\'ail, 1 cs vinaigre de cidre de pomme','Huile d\'olive, sel, basilic'], etapes:['Couper tous les légumes grossièrement','Mixer avec l\'ail et le vinaigre','Ajouter l\'huile d\'olive en filet','Saler, mixer à nouveau finement','Réfrigérer 1h, servir très frais avec basilic'] },
    { nom:'Salade pois chiches-menthe-citron-concombre', emoji:'🥙', pourquoi:'Les pois chiches sont riches en zinc et en manganèse, nutriments clés pour la santé des ovocytes. La menthe facilite la digestion.', ingredients:['250g pois chiches égouttés','½ concombre en dés','Menthe fraîche ciselée','Jus d\'un citron, 1 cs huile d\'olive','Sel, sumac (optionnel)'], etapes:['Égoutter et rincer les pois chiches','Couper le concombre en petits dés','Mélanger avec la menthe','Assaisonner citron + huile d\'olive + sel','Saupoudrer de sumac si disponible'] },
    { nom:'Tartare saumon-avocat-mangue', emoji:'🥭', pourquoi:'Les oméga-3 du saumon protègent les membranes cellulaires au moment de l\'ovulation. La mangue apporte de la vitamine C pour l\'absorption du fer.', ingredients:['150g saumon décongelé (surgelé min. 24h) ou qualité sashimi certifiée','½ avocat en dés','½ mangue en petits dés','Jus de citron vert, 1 cc sauce soja','Ciboulette, sésame'], etapes:['Couper le saumon en petits dés réguliers','Mélanger délicatement avec l\'avocat et la mangue','Assaisonner citron vert + sauce soja','Dresser à l\'aide d\'un emporte-pièce','Ciboulette ciselée + sésame par-dessus'] },
    { nom:'Bowl fraises-épinards-amandes-balsamique', emoji:'🍓', pourquoi:'Les fraises contiennent de l\'ellagic acid, antioxydant qui protège les ovocytes au pic d\'ovulation. Le magnésium des épinards soutient les performances sportives, au sommet en été.', ingredients:['Grosse poignée d\'épinards baby','150g fraises fraîches coupées en deux','30g amandes effilées toastées','60g feta émiettée','1 cs balsamique, 1 cs huile d\'olive, sel'], etapes:['Laver et sécher les épinards','Couper les fraises en deux','Toaster les amandes à sec 2 min','Assembler épinards + fraises + amandes + feta','Assaisonner balsamique + huile d\'olive + sel'] },
    { nom:'Carpaccio courgette-parmesan-menthe', emoji:'🥒', pourquoi:'La courgette crue est ultra-légère (17 kcal/100g) et hydratante à 95% d\'eau. Le parmesan apporte du sélénium, minéral-clé pour la qualité des ovocytes selon les études récentes.', ingredients:['2 courgettes fermes jaune et verte','30g parmesan en copeaux','Feuilles de menthe fraîche','Jus d\'1 citron, 2 cs huile d\'olive extra-vierge','Sel, poivre noir, pignons de pin toastés'], etapes:['Trancher les courgettes en ruban avec un économe','Disposer en rosace dans un plat','Arroser d\'huile d\'olive et de citron','Saler et poivrer généreusement','Parmesan, menthe et pignons par-dessus'] },
    { nom:'Wrap poulet-crudités-tzatziki maison', emoji:'🌯', pourquoi:'Le poulet est la source de protéines maigres par excellence — les protéines soutiennent particulièrement bien le corps au moment de l\'ovulation. Le tzatziki apporte des probiotiques et hydrate grâce au concombre (96% d\'eau).', ingredients:['1 grande galette de blé complet','100g blanc de poulet grillé émincé','½ concombre en dés, roquette','3 cs yaourt grec + 1 gousse d\'ail + aneth (tzatziki)','Tomates cerises, sel, poivre'], etapes:['Mélanger yaourt + ail + aneth + sel (tzatziki rapide)','Griller le poulet émincé 5 min','Tartiner la galette de tzatziki généreusement','Répartir poulet, roquette, concombre, tomates','Rouler serré, couper en biais et servir'] },
    { nom:'Zaalouk d\'aubergines à la chermoula', emoji:'🍆', pourquoi:'Les aubergines sont riches en nasunine, un antioxydant qui protège les membranes cellulaires au moment de l\'ovulation. La chermoula (coriandre, cumin, paprika, citron) apporte du zinc et de la vitamine C. Plat marocain frais et légèrement fumé, parfait en Été.', ingredients:['2 grosses aubergines','3 tomates mûres pelées et mixées','3 gousses d\'ail','1 cc cumin, 1 cc paprika doux, ½ cc curcuma','Coriandre fraîche, jus de citron, huile d\'olive, sel'], etapes:['Cuire les aubergines entières au four à 220°C ou sous le gril 30 min (peau brûlée)','Éplucher et écraser grossièrement la chair','Faire revenir l\'ail émincé 2 min, ajouter les tomates mixées et les épices','Ajouter la chair d\'aubergine, cuire 10 min en remuant','Terminer avec coriandre ciselée, citron et huile d\'olive — servir chaud ou froid'] },
    { nom:'Mechouia — salade de poivrons-tomates grillés', emoji:'🌶️', pourquoi:'Les poivrons grillés contiennent 2 à 3 fois plus de vitamine C que crus, protégeant les ovocytes au pic ovulatoire. La mechouia est un plat tunisien estival, naturellement antioxydant et très hydratant, prêt en 30 minutes.', ingredients:['2 poivrons rouges + 1 poivron vert','3 tomates mûres, 1 oignon','2 gousses d\'ail, jus de citron','Huile d\'olive, sel, cumin, piment doux (optionnel)','Persil ou coriandre fraîche'], etapes:['Griller poivrons, tomates et oignon entiers au four à 220°C ou sous le gril 20-25 min','Éplucher les poivrons et tomates une fois refroidis','Hacher grossièrement en petits morceaux ou mixer légèrement','Assaisonner ail écrasé + cumin + citron + huile + sel','Parsemer d\'herbes fraîches, servir tiède ou à température ambiante'] },
  ],
  automne: [
    { nom:'Curry patate douce-lentilles-coco', emoji:'🍛', pourquoi:'Les glucides complexes stabilisent ta glycémie et ton humeur. Le magnésium des lentilles réduit directement l\'irritabilité du SPM.', ingredients:['2 petites patates douces en dés','150g lentilles corail','200ml lait de coco','Curry, cumin, curcuma','1 oignon, 2 gousses d\'ail'], etapes:['Faire revenir oignon, ail et épices 3 min','Ajouter les dés de patate douce','Verser lentilles + lait de coco + 200ml eau','Couvrir, cuire 20 min à feu doux','Rectifier l\'assaisonnement, servir avec du riz'] },
    { nom:'Porridge avoine-banane-chocolat noir', emoji:'🍌', pourquoi:'Le tryptophane de la banane se transforme en sérotonine. L\'avoine libère l\'énergie lentement pour éviter les fringales du SPM.', ingredients:['80g flocons d\'avoine','300ml lait d\'amande','1 banane mûre','1 carré chocolat noir 70%+','Cannelle, 1 cc miel'], etapes:['Porter le lait d\'amande à frémissement','Ajouter les flocons, remuer 5 min à feu doux','Trancher la banane en rondelles','Disposer sur le porridge chaud','Râper le chocolat, saupoudrer cannelle + filet de miel'] },
    { nom:'Bowl épinards-amandes-datte & fromage', emoji:'🥗', pourquoi:'Magnésium des amandes + sucre lent des dattes + fer des épinards — le trio parfait contre le SPM.', ingredients:['Grosse poignée épinards','Poignée d\'amandes effilées toastées','4 dattes Medjool coupées','60g halloumi grillé (ou feta)','1 cs vinaigre balsamique, 1 gousse d\'ail'], etapes:['Sauter les épinards à l\'ail 2 min','Griller le halloumi 2 min par face','Assembler épinards + amandes + dattes dans un bol','Poser le fromage chaud dessus','Filet de balsamique, servir chaud'] },
    { nom:'Soupe miso-tofu-champignons', emoji:'🍜', pourquoi:'Le miso est riche en probiotiques qui stabilisent l\'humeur via l\'axe intestin-cerveau. Le tofu apporte des phyto-œstrogènes doux.', ingredients:['1 cs pâte miso blanche','150g tofu soyeux en dés','6 champignons shiitake émincés','500ml eau chaude (pas bouillante)','Ciboulette, 1 cc sauce soja'], etapes:['Chauffer l\'eau à 70°C (ne pas bouillir)','Délayer le miso dans un peu d\'eau froide','Verser dans l\'eau chaude, remuer','Ajouter le tofu et les champignons','Laisser infuser 3 min, ciboulette + sauce soja'] },
    { nom:'Galettes de patate douce-avoine-cannelle', emoji:'🥞', pourquoi:'La patate douce est riche en vitamine B6 qui réduit les symptômes du SPM. L\'avoine stabilise la glycémie et l\'humeur.', ingredients:['1 patate douce cuite écrasée','50g flocons d\'avoine fin','1 œuf','½ cc cannelle, pincée de sel','Huile de coco ou d\'olive pour la cuisson'], etapes:['Mélanger patate douce écrasée + avoine + œuf + cannelle','Former des galettes à la main','Chauffer une poêle avec l\'huile','Cuire 3-4 min par face à feu moyen','Servir avec un peu de miel ou du yaourt'] },
    { nom:'Wok bœuf-brocoli-champignons', emoji:'🥩', pourquoi:'Le bœuf est une excellente source de zinc et de fer héminique pour contrer la fatigue pré-menstruelle. Le brocoli aide à éliminer l\'excès d\'œstrogènes.', ingredients:['150g bœuf émincé (rumsteck)','Fleurets de brocoli','100g champignons de Paris','1 cs sauce soja, 1 cc miel, 1 cc gingembre râpé','Huile de sésame, sésame toasté'], etapes:['Préparer la marinade : soja + miel + gingembre','Mariner le bœuf 10 min','Faire sauter le bœuf à feu très vif 3 min','Ajouter brocoli et champignons, wok 4 min','Arroser d\'huile de sésame, parsemer de sésame'] },
    { nom:'Crumble pomme-amandes-avoine', emoji:'🍎', pourquoi:'La pomme est riche en pectine qui nourrit les bonnes bactéries intestinales. Les amandes apportent le magnésium anti-SPM dont tu as le plus besoin.', ingredients:['3 pommes pelées en dés','60g flocons d\'avoine','30g amandes effilées','2 cs miel ou sirop d\'érable','1 cs huile de coco, cannelle'], etapes:['Préchauffer le four à 180°C','Disposer les pommes dans un plat','Mélanger avoine + amandes + miel + huile de coco','Étaler le crumble sur les pommes','Cuire 25 min jusqu\'à coloration dorée'] },
    { nom:'Saumon au four-patate douce-épinards', emoji:'🐠', pourquoi:'Le saumon est la meilleure source d\'oméga-3 EPA/DHA qui réduisent l\'inflammation du SPM. La patate douce apporte de la vitamine B6, qui aide à réduire les symptômes du SPM en soutenant la production de sérotonine et de dopamine en phase lutéale.', ingredients:['150g pavé de saumon','1 petite patate douce en rondelles','Grosse poignée d\'épinards frais','Jus de citron, 1 cs huile d\'olive, aneth','Sel, poivre, paprika fumé'], etapes:['Préchauffer le four à 180°C','Rôtir les rondelles de patate douce 15 min','Placer le saumon sur les patates, assaisonner','Cuire encore 12 min','Servir sur un lit d\'épinards frais + citron'] },
    { nom:'Gratin quinoa-poireaux-chèvre', emoji:'🧀', pourquoi:'Le quinoa est riche en tryptophane précurseur direct de la sérotonine — l\'anti-déprime naturel du SPM. Les poireaux apportent des prébiotiques qui équilibrent le microbiome et l\'humeur.', ingredients:['100g quinoa cuit','2 poireaux émincés et fondus à l\'huile','80g fromage de chèvre en rondelles','2 œufs battus + 100ml lait','Sel, poivre, muscade, herbes de Provence'], etapes:['Préchauffer le four à 180°C','Faire fondre les poireaux à l\'huile 8 min','Mélanger quinoa + poireaux + œufs + lait + épices','Verser dans un plat, disposer les rondelles de chèvre','Cuire 25 min jusqu\'à gratin doré'] },
    { nom:'Soupe pois cassés-cumin-citron', emoji:'🟡', pourquoi:'Les pois cassés combinent tryptophane et magnésium, deux molécules documentées contre l\'anxiété du SPM. Le cumin favorise la digestion souvent perturbée en phase lutéale.', ingredients:['150g pois cassés jaunes','1 oignon, 2 gousses d\'ail','1 cc cumin, ½ cc curcuma, 500ml bouillon','Jus d\'1 citron, persil frais','Sel, poivre, 1 cs huile d\'olive'], etapes:['Rincer les pois cassés, faire revenir oignon et ail','Ajouter les épices, remuer 1 min','Verser pois cassés et bouillon','Cuire 30 min jusqu\'à texture crémeuse','Presser le citron, garnir de persil et d\'huile'] },
    { nom:'Chocolat chaud épicé-lait d\'amande', emoji:'☕', pourquoi:'Le cacao contient 290mg de magnésium pour 100g — le minéral anti-SPM le plus documenté. La cannelle stabilise la glycémie pour éviter les fringales sucrées de la phase lutéale.', ingredients:['300ml lait d\'amande non sucré','1 cs cacao 100% non sucré','1 carré chocolat noir 70%+ râpé','½ cc cannelle, pincée de cardamome','1 cc miel ou sirop d\'érable'], etapes:['Chauffer le lait d\'amande à feu doux','Ajouter le cacao et le chocolat râpé','Remuer jusqu\'à dissolution complète','Incorporer les épices et le miel','Servir chaud dans un grand bol, saupoudrer de cannelle'] },
    { nom:'Bowl riz complet-avocat-chia-sésame', emoji:'🥑', pourquoi:'Les graines de chia sont une source végétale d\'oméga-3 ALA anti-inflammatoires. L\'avocat est riche en vitamine B6, qui aide à réduire les symptômes du SPM en soutenant la production de sérotonine en phase lutéale.', ingredients:['80g riz complet cuit','½ avocat tranché en lamelles','1 cs graines de chia','1 cs sauce soja + jus de citron vert','Sésame toasté, ciboulette, radis tranchés'], etapes:['Cuire le riz, laisser tiédir','Trancher l\'avocat en fines lamelles','Disposer le riz dans un bol','Ajouter avocat, radis et ciboulette','Sauce soja + citron vert, sésame + chia'] },
    { nom:'Dinde sautée champignons-sauce soja', emoji:'🦃', pourquoi:'La dinde est la source animale la plus riche en tryptophane (300mg/100g), précurseur direct de la sérotonine. Les champignons apportent de la vitamine D qui soutient l\'humeur en phase lutéale.', ingredients:['150g escalope de dinde émincée','150g champignons de Paris tranchés','1 cs sauce soja, 1 cc gingembre râpé, 1 gousse d\'ail','1 cc huile de sésame','80g riz basmati cuit, ciboulette'], etapes:['Faire sauter la dinde émincée 4 min à feu vif','Ajouter les champignons, cuire 3 min','Incorporer ail, gingembre et sauce soja','Remuer et cuire encore 2 min','Servir sur le riz, huile de sésame + ciboulette'] },
    { nom:'Tarte fine potiron-chèvre-noix', emoji:'🍂', pourquoi:'Le potiron est riche en vitamine B6 (0.3mg/100g) qui réduit les symptômes prémenstruels. Les noix apportent oméga-3 et magnésium, deux nutriments bien documentés contre le SPM.', ingredients:['1 rouleau pâte brisée','200g chair de potiron cuite écrasée','80g fromage de chèvre frais émietté','Poignée de noix concassées','1 œuf, sel, poivre, herbes de Provence'], etapes:['Préchauffer le four à 190°C','Étaler la pâte finement dans un moule','Mélanger potiron écrasé + œuf + sel + poivre','Étaler sur la pâte, émietter le chèvre','Parsemer de noix, cuire 25 min jusqu\'à dorure'] },
    { nom:'Chorba de frik — soupe de blé vert aux légumes', emoji:'🌾', pourquoi:'Le frik (blé vert concassé) est riche en magnésium et en fibres qui stabilisent la glycémie de la phase lutéale. Le bouillon chaud réconforte le corps en SPM. Plat emblématique de la cuisine algérienne, économique et très nourrissant.', ingredients:['80g frik (blé vert concassé)','150g poulet halal en petits morceaux','2 carottes en dés, 1 courgette en dés','1 oignon, 2 tomates mixées','Coriandre et persil frais, cumin, ras el hanout, sel'], etapes:['Faire revenir le poulet et l\'oignon 5 min dans un peu d\'huile','Ajouter les tomates mixées et les épices, cuire 3 min','Verser le frik rincé et 800ml d\'eau chaude','Ajouter les légumes en dés, cuire 20 min à feu doux','Terminer avec les herbes fraîches, ajuster sel, servir très chaud'] },
    { nom:'Kefta de dinde aux herbes au four', emoji:'🍖', pourquoi:'La dinde est la source animale la plus riche en tryptophane (300mg/100g), précurseur direct de la sérotonine — l\'anti-SPM naturel. Sous forme de kefta, elle s\'intègre naturellement dans la cuisine maghrébine. La sauce tomate-cumin apporte du lycopène anti-inflammatoire.', ingredients:['300g viande hachée de dinde','½ oignon râpé, persil et coriandre ciselés','1 œuf, 1 cc cumin, 1 cc paprika, sel, poivre','400g tomates pelées, ail, cumin (sauce)','Huile d\'olive'], etapes:['Mélanger la dinde avec l\'oignon, les herbes, l\'œuf et les épices','Former des boulettes de la taille d\'une noix','Préparer la sauce : faire revenir l\'ail, ajouter tomates et cumin, mijoter 5 min','Disposer les kefta dans un plat, napper de sauce','Cuire au four à 180°C pendant 25 min'] },
    { nom:'Loubia — ragoût de haricots blancs au cumin', emoji:'🫘', pourquoi:'Les haricots blancs sont riches en magnésium (63mg/100g) et en tryptophane, deux nutriments-clés contre le SPM. La loubia est un plat maghrébin du quotidien, économique et réconfortant. Le cumin facilite la digestion souvent alourdie en phase lutéale.', ingredients:['1 boîte haricots blancs égouttés (ou 200g secs cuits)','3 tomates ou ½ boîte tomates pelées','3 gousses d\'ail, 1 oignon','1 cc cumin, ½ cc paprika, pincée de piment doux','Huile d\'olive, sel, poivre, persil frais'], etapes:['Faire revenir l\'oignon et l\'ail émincés 4 min','Ajouter les tomates et les épices, cuire 5 min','Verser les haricots blancs égouttés et 200ml d\'eau','Mijoter 15 min à feu doux en remuant','Ajuster sel et poivre, parsemer de persil, un filet d\'huile d\'olive'] },
  ],
};

const ROUTINES_PREMIUM = {
  hiver: {
    matin: [
      { icon:'💧', geste:'Rinçage eau tiède', duree:'1 min', detail:'Eau tiède sur le visage, tamponner avec un tissu propre. Pas de nettoyant agressif — la peau menstruelle est déjà fragilisée.' },
      { icon:'🌹', geste:'Eau de rose', duree:'30 sec', detail:'Vaporiser sur visage ou tampon de coton, laisser pénétrer sans rincer. Anti-inflammatoire naturel, apaise les rougeurs.' },
      { icon:'🖤', geste:'Huile de nigelle (1 goutte)', duree:'1 min', detail:'Presser sur peau légèrement humide. ☪️ Sunnah — anti-inflammatoire, parfaite pour la sensibilité menstruelle (Bukhari 5688).' },
    ],
    soir: [
      { icon:'🫒', geste:'Nettoyage huile d\'olive', duree:'2 min', detail:'Quelques gouttes sur visage sec, masser 60 sec en cercles. Rincer à l\'eau tiède. Démaquille et nourrit sans agresser. ☪️ Sunnah (Tirmidhi).' },
      { icon:'🍯', geste:'Masque miel pur (3×/sem)', duree:'10 min', detail:'1 c.à.c de miel pur sur visage propre. Laisser 10 min, rincer à l\'eau tiède. Antibactérien et réparateur. ☪️ Sunnah (Coran 16:69).' },
      { icon:'🫒', geste:'Huile d\'olive soin de nuit', duree:'1 min', detail:'2-3 gouttes pressées entre les paumes, appliquer sur peau légèrement humide. Nourrit en profondeur pendant le sommeil. ☪️ Sunnah.' },
    ],
  },
  printemps: {
    matin: [
      { icon:'🌿', geste:'Rhassoul léger à l\'eau de rose', duree:'3 min', detail:'1 c.à.c rhassoul + eau de rose jusqu\'à pâte crémeuse. Masser en douceur, rincer à l\'eau tiède. Purifie sans agresser. 🌿 Tradition islamique.' },
      { icon:'🌹', geste:'Eau de rose tonique', duree:'30 sec', detail:'Vaporiser ou tampon sur visage propre. Rééquilibre le pH, tonifie, resserre les pores délicatement. Laisser sécher naturellement.' },
      { icon:'🫒', geste:'Huile d\'olive (1 goutte)', duree:'30 sec', detail:'Sur peau légèrement humide, laisser absorber. Légère et antioxydante — accompagne l\'éclat naturel du Printemps. ☪️ Sunnah (Tirmidhi).' },
    ],
    soir: [
      { icon:'✨', geste:'Gommage sucre + olive (2×/sem)', duree:'5 min', detail:'1 c.à.c sucre fin + 1 c.à.c huile d\'olive. Massage doux 2 min en cercles, rincer. Révèle le renouveau cellulaire du Printemps. ☪️ Sunnah.' },
      { icon:'🍯', geste:'Masque miel + curcuma (2×/sem)', duree:'10 min', detail:'1 c.à.c miel + 1 pincée curcuma. Appliquer 10 min, rincer à l\'eau tiède. ⚠️ Peut légèrement teinter la peau claire. ☪️ Sunnah.' },
      { icon:'🫒', geste:'Huile d\'olive soin de nuit', duree:'1 min', detail:'2-3 gouttes sur peau propre, presser entre les paumes. Nourrit sans occlure — légèreté de la phase folliculaire. ☪️ Sunnah (Tirmidhi).' },
    ],
  },
  ete: {
    matin: [
      { icon:'💧', geste:'Eau fraîche uniquement', duree:'30 sec', detail:'En Été, rincer le visage à l\'eau froide suffit le matin. La peau est équilibrée — le sur-nettoyage perturbe le sébum naturel.' },
      { icon:'🌹', geste:'Brume eau de rose', duree:'20 sec', detail:'Spritzer à 20 cm du visage. Laisser sécher naturellement, ne pas tamponner. Rafraîchit et hydrate sans surcharger. 🌿 Tradition islamique.' },
      { icon:'🌿', geste:'Aloe vera gel pur', duree:'30 sec', detail:'Fine couche sur peau humide. Ultra-léger, non occlusif — laisse respirer les pores au pic naturel de sébum. 🌿 Médecine islamique classique.' },
    ],
    soir: [
      { icon:'🌿', geste:'Rhassoul purifiant', duree:'7 min', detail:'1 c.à.s rhassoul + eau de rose = pâte légère. Appliquer 5 min, rincer avant séchage complet. Absorbe l\'excès de sébum sans agresser. 🌿 Tradition islamique.' },
      { icon:'🖤', geste:'Masque argile + huile de nigelle', duree:'12 min', detail:'Argile blanche + 3 gouttes huile de nigelle + eau de rose. Appliquer 10 min, rincer. Purifie et apaise simultanément. ☪️ Sunnah.' },
      { icon:'🌹', geste:'Eau de rose finale', duree:'30 sec', detail:'Tampon d\'eau de rose sur peau propre après rinçage. Ne pas rincer — referme les pores et fixe le soin. 🌿 Tradition islamique.' },
    ],
  },
  automne: {
    matin: [
      { icon:'🧼', geste:'Nettoyage savon d\'Alep', duree:'1 min', detail:'Savon d\'Alep = nettoyant naturel au laurier antibactérien. Rincer à l\'eau tiède — pas d\'eau chaude en phase lutéale. 🌿 Tradition levantine islamique.' },
      { icon:'🖤', geste:'Huile de nigelle pure', duree:'1 min', detail:'2 gouttes sur peau légèrement humide, masser doucement en cercles. Anti-inflammatoire — prévient les boutons hormonaux. ☪️ Sunnah (Bukhari 5688).' },
      { icon:'🌹', geste:'Eau de rose tonique', duree:'30 sec', detail:'Tamponner après la nigelle pour apaiser et fixer. Referme les pores actifs de la phase lutéale. 🌿 Tradition islamique.' },
    ],
    soir: [
      { icon:'🫒', geste:'Démaquillage huile d\'olive', duree:'2 min', detail:'Quelques gouttes sur visage sec, masser 60 sec. Rincer à l\'eau tiède. Dissout maquillage et impuretés sans assécher. ☪️ Sunnah (Tirmidhi).' },
      { icon:'🍯', geste:'Masque miel + curcuma (3×/sem)', duree:'10 min', detail:'1 c.à.c miel + 1 pincée curcuma. Appliquer 10 min, rincer. Antibactérien + anti-inflammatoire contre les boutons hormonaux. ⚠️ Peut teinter. ☪️ Sunnah.' },
      { icon:'🫒', geste:'Huile d\'olive soin de nuit', duree:'1 min', detail:'2-3 gouttes pressées, appliquer sur peau légèrement humide. Nourrit en profondeur — indispensable en fin de cycle. ☪️ Sunnah (Tirmidhi).' },
    ],
  },
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

function phaseThresholds(dur) {
  const hiverDays  = Math.floor(dur * 0.20);
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
        const snap = (i === 0) ? _bilanStats(cStr, nextStr) : { seanceCount: 0, prayerDays: 0, symptomDays: 0 };
        ST.cycleHistory.unshift({ start: cStr, duration: dur,
          seanceCount: snap.seanceCount, prayerDays: snap.prayerDays, symptomDays: snap.symptomDays });
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
  // Detect new cycle — reset per-cycle flags
  if (ST._lastCycleNum !== effectiveCycleNum) {
    ST._lastCycleNum = effectiveCycleNum;
    ST.printempsUpgradeDone = false;
    ST.printempsBasCount = 0;
    ST._proposeNewEx5 = false;
    ST.seanceSurpriseShownCycle = false;
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

// ═══════════════════════════════════════════════
// PAIEMENT STRIPE — DÉTECTION RETOUR SUCCESS URL
// ═══════════════════════════════════════════════
function _activatePremium(plan) {
  ST.isPremium = true;
  ST.trialEnded = false;
  ST.premiumPlan = plan;
  ST.premiumSince = new Date().toISOString().split('T')[0];
  saveState();
  window.history.replaceState({}, '', '/');
  setTimeout(() => {
    applyTrialLocks();
    showPhaseToast('🌸', 'Bienvenue en Premium !', 'Toutes les fonctionnalités sont débloquées.');
  }, 1200);
}

async function checkPaymentSuccess() {
  const params = new URLSearchParams(window.location.search);
  // Seul chemin valide : session_id Stripe vérifié côté serveur
  const sessionId = params.get('session_id');
  if (sessionId && sessionId.startsWith('cs_')) {
    showToast('Vérification du paiement… 🌙');
    window.history.replaceState({}, '', '/');
    try {
      const sb = await initSupabase();
      const { data: { session } } = await sb?.auth.getSession() || { data: { session: null } };
      const jwt = session?.access_token;
      if (!jwt) return;
      const r = await fetch('/api/verify-session?id=' + encodeURIComponent(sessionId), {
        headers: { Authorization: 'Bearer ' + jwt }
      });
      const data = r.ok ? await r.json() : null;
      if (data && data.valid) _activatePremium(data.plan || 'monthly');
    } catch (_) {}
  } else if (params.has('success') || params.has('payment')) {
    window.history.replaceState({}, '', '/');
  }
}

// ═══════════════════════════════════════════════
// TRIAL
// ═══════════════════════════════════════════════
function getTrialDays() {
  if (!ST.installDate) return 0;
  const days = Math.floor((Date.now() - ST.installDate) / 86400000);
  if (days < 0) { ST.installDate = Date.now(); saveState(); return 0; }
  return days;
}
function isFullAccess() { return ST.isPremium || getTrialDays() < 20; }

function checkTrialEnd() {
  if (ST.isPremium || ST.trialEnded) return;
  if (getTrialDays() >= 20) {
    ST.trialEnded = true;
    if (!ST.bilanShown) {
      ST.bilanShown = true;
      saveState();
      setTimeout(showBilanModal, 1200);
    } else {
      saveState();
    }
  }
}

function renderTrialCard() {
  const el = document.getElementById('trial-status-card');
  const upsell = document.getElementById('premium-upsell-card');
  if (!el) return;
  const days = getTrialDays();
  const remaining = Math.max(0, 20 - days);
  if (upsell) upsell.style.display = ST.isPremium ? 'none' : '';
  const codeCard = document.getElementById('premium-code-card');
  if (codeCard) codeCard.style.display = ST.isPremium ? 'none' : '';
  const manageRow = document.getElementById('manage-sub-row');
  if (manageRow) manageRow.style.display = ST.supabaseUserId ? '' : 'none';
  if (ST.isPremium) {
    const planLabel = ST.premiumPlan === 'monthly' ? 'mensuel' : ST.premiumPlan === 'annual' ? 'annuel' : '';
    el.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;background:var(--season-grad);border-radius:16px;padding:14px 16px;">
        <span style="font-size:22px;">✨</span>
        <div>
          <div style="font-size:14px;font-weight:700;color:white;font-family:var(--sans);">Membre Premium 🌸</div>
          ${planLabel ? `<div style="font-size:11px;color:rgba(255,255,255,.78);margin-top:2px;">Abonnement ${planLabel}</div>` : ''}
        </div>
      </div>`;
  } else if (remaining > 0) {
    const pct = Math.round((days / 20) * 100);
    el.innerHTML = `
      <div style="background:white;border:1.5px solid var(--sable);border-radius:16px;padding:14px 16px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <div style="font-size:13px;font-weight:700;color:var(--noir);font-family:var(--sans);">✨ Essai gratuit</div>
          <div style="font-size:11px;color:var(--gris);font-weight:600;">Jour ${days} / 20</div>
        </div>
        <div style="background:var(--sable);border-radius:6px;height:6px;margin-bottom:8px;overflow:hidden;">
          <div style="height:100%;width:${pct}%;background:var(--season-grad);border-radius:6px;"></div>
        </div>
        <div style="font-size:11px;color:var(--gris);">Il te reste <strong>${remaining} jour${remaining > 1 ? 's' : ''}</strong> pour tout explorer</div>
      </div>`;
  } else {
    el.innerHTML = `
      <div style="background:var(--creme);border:1.5px solid var(--sable);border-radius:16px;padding:14px 16px;text-align:center;">
        <div style="font-size:13px;font-weight:700;color:var(--noir);margin-bottom:10px;font-family:var(--sans);">Ton essai est terminé 🌸</div>
        <button onclick="showBilanModal()" style="background:var(--season-grad);color:white;border:none;border-radius:12px;padding:10px 20px;font-size:13px;font-weight:700;font-family:var(--sans);cursor:pointer;">Voir les offres Premium</button>
      </div>`;
  }
}

function checkJ17Banner() {
  const el = document.getElementById('trial-banner-j17');
  if (!el) return;
  const days = getTrialDays();
  if (ST.isPremium || ST.trialBannerDismissed || days < 17 || days >= 20) {
    el.style.display = 'none';
    return;
  }
  const remaining = 20 - days;
  const textEl = document.getElementById('trial-banner-text');
  if (textEl) textEl.textContent = `🌸 Plus que ${remaining} jour${remaining > 1 ? 's' : ''} pour profiter de tout SakinApp. L'onglet Âme reste toujours gratuit ✨`;
  el.style.display = 'block';
}

function dismissTrialBanner() {
  ST.trialBannerDismissed = true;
  saveState();
  const el = document.getElementById('trial-banner-j17');
  if (el) el.style.display = 'none';
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

  const seanceCount = Object.keys(ST.seanceDone || {}).filter(inCycle).length;
  const seanceLevel = ST.seanceLevel || 1;
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

  return { seanceCount, seanceLevel, symptomDays, prayerDays, allPrayersDays, dhikrDays, coranDays, objCheckCount, cycleDuration };
}

function showBilanModal() {
  const el = document.getElementById('bilan-modal');
  const body = document.getElementById('bilan-body');
  if (!el) return;
  const { seanceCount, seanceLevel, symptomDays, prayerDays, allPrayersDays, dhikrDays, coranDays, objCheckCount, cycleDuration } = _bilanStats();

  const joursSuivis = ST.cycleStart
    ? Math.min(ST.currentDay || 1, ST.cycleDuration || 28)
    : Math.min(getTrialDays() || 0, 20);
  const headerDays = document.getElementById('bilan-header-days');
  if (headerDays) headerDays.textContent = `tu as traversé ${joursSuivis} jour${joursSuivis > 1 ? 's' : ''}`;

  const spiritualScore = prayerDays + dhikrDays + coranDays;
  const corpsScore = seanceCount * 2;
  const mainStrength = spiritualScore >= corpsScore ? '🕌 Âme' : '💪 Corps';

  const sportMsg = seanceCount === 0 ? 'Prête à démarrer le prochain cycle 💪'
    : seanceCount < 4 ? 'Tu as fait tes premiers pas — continue !'
    : seanceCount < 8 ? 'Tu as bâti une vraie habitude 🌱'
    : 'Tu es une guerrière du mouvement 🔥';

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
    <div class="bilan-strength-line">Ta force ce cycle&nbsp;: <strong>${mainStrength}</strong> · ${joursSuivis} jour${joursSuivis > 1 ? 's' : ''} traversé${joursSuivis > 1 ? 's' : ''}</div>

    <div class="bilan-section-lbl">💪 Corps</div>
    <div class="bilan-grid-3">
      <div class="bilan-stat"><span class="bilan-stat-num">${seanceCount}</span><span class="bilan-stat-lbl">séances sport</span></div>
      <div class="bilan-stat"><span class="bilan-stat-num bilan-level">Niv.${seanceLevel}</span><span class="bilan-stat-lbl">niveau atteint</span></div>
      <div class="bilan-stat"><span class="bilan-stat-num">${symptomDays}</span><span class="bilan-stat-lbl">jours de symptômes</span></div>
    </div>
    <div class="bilan-note">${sportMsg}${symptomDays > 0 ? ' · ' + symptomDays + ' jour' + (symptomDays>1?'s':'') + ' d\'écoute de ton corps 🌸' : ''}</div>

    <div class="bilan-section-lbl">🕌 Âme</div>
    <div class="bilan-grid-2">
      <div class="bilan-stat"><span class="bilan-stat-num">${prayerDays}</span><span class="bilan-stat-lbl">jours 3+ prières</span></div>
      <div class="bilan-stat"><span class="bilan-stat-num">${allPrayersDays}</span><span class="bilan-stat-lbl">prières 5/5 complètes</span></div>
      <div class="bilan-stat"><span class="bilan-stat-num">${dhikrDays}</span><span class="bilan-stat-lbl">jours de dhikr</span></div>
      <div class="bilan-stat"><span class="bilan-stat-num">${coranDays}</span><span class="bilan-stat-lbl">jours de Coran</span></div>
    </div>

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
  const footer = document.getElementById('bilan-footer');
  if (footer) footer.style.display = (ST.isPremium || getTrialDays() < 20) ? 'none' : '';
  el.classList.add('open');
}
function closeBilanModal() {
  const el = document.getElementById('bilan-modal');
  if (el) el.classList.remove('open');
  applyTrialLocks();
}
function bilanUpgrade() {
  closeBilanModal();
  switchTabById('moi');
}

// ── STRIPE ────────────────────────────────────────
let _selectedBilanPlan = 'annual'; // 'monthly' | 'annual'

function selectBilanPlan(plan) {
  _selectedBilanPlan = plan;
  document.querySelectorAll('.bilan-plan-card').forEach(c => c.classList.remove('selected'));
  const card = document.getElementById('plan-' + plan);
  if (card) card.classList.add('selected');
}

function selectPlan(plan) {
  _selectedBilanPlan = plan;
  // Sync bilan modal cards
  document.querySelectorAll('.bilan-plan-card').forEach(c => c.classList.remove('selected'));
  const modalCard = document.getElementById('plan-' + plan);
  if (modalCard) modalCard.classList.add('selected');
  // Sync Moi tab cards
  ['monthly','annual'].forEach(p => {
    const el = document.getElementById('moi-plan-' + p);
    if (!el) return;
    if (p === plan) {
      el.style.borderColor = '#C9A96E';
      el.style.boxShadow = '0 0 0 2px #C9A96E';
    } else {
      el.style.borderColor = '#D4B87A';
      el.style.boxShadow = 'none';
    }
  });
}

const STRIPE_LINKS = {
  monthly: 'https://buy.stripe.com/bJe8wO69R2HTcUbgys8Ra01',
  annual:  'https://buy.stripe.com/8x26oG55NfuF5rJbe88Ra02',
};

async function startStripeCheckout() {
  const plan = _selectedBilanPlan || 'annual';
  if (!ST.supabaseUserId) {
    showToast('Connecte-toi pour souscrire. 🌙');
    return;
  }
  const btn = (document.activeElement?.tagName === 'BUTTON') ? document.activeElement : null;
  const origText = btn?.textContent;
  if (btn) { btn.disabled = true; btn.textContent = 'Chargement…'; }
  const params = new URLSearchParams({ plan });
  try {
    const sb = await initSupabase();
    let session = (await sb?.auth.getSession().catch(() => null))?.data?.session;
    if (!session?.access_token) {
      // Token absent ou expiré — tentative de refresh silencieux
      session = (await sb?.auth.refreshSession().catch(() => null))?.data?.session || null;
    }
    const jwt = session?.access_token;
    if (!jwt) {
      // Refresh échoué — repli sur le lien Stripe direct plutôt que bloquer
      window.location.href = STRIPE_LINKS[plan] || STRIPE_LINKS.annual;
      return;
    }
    const r = await fetch('/api/create-checkout?' + params.toString(), {
      headers: { Authorization: 'Bearer ' + jwt }
    });
    const data = await r.json().catch(() => ({}));
    if (data && data.url) { window.location.href = data.url; return; }
    // Repli sur le lien Stripe direct si l'API échoue
    console.error('create-checkout error:', data);
    window.location.href = STRIPE_LINKS[plan] || STRIPE_LINKS.annual;
  } catch (e) {
    console.error('startStripeCheckout error:', e);
    window.location.href = STRIPE_LINKS[plan] || STRIPE_LINKS.annual;
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = origText; }
  }
}

const STRIPE_PORTAL_URL = 'https://billing.stripe.com/p/login/8x2aEW8hZ4Q1cUbdmg8Ra00';

async function openCustomerPortal() {
  if (!ST.supabaseUserId) { window.location.href = STRIPE_PORTAL_URL; return; }
  showToast('Redirection vers Stripe…');
  try {
    const sb = await initSupabase();
    const { data: { session } } = await sb?.auth.getSession() || { data: { session: null } };
    const jwt = session?.access_token;
    const r = await fetch('/api/customer-portal?user_id=' + encodeURIComponent(ST.supabaseUserId), {
      headers: jwt ? { Authorization: 'Bearer ' + jwt } : {}
    });
    const data = await r.json();
    window.location.href = (data && data.url) ? data.url : STRIPE_PORTAL_URL;
  } catch { window.location.href = STRIPE_PORTAL_URL; }
}

function applyTrialLocks() {
  const active = isFullAccess();
  ['day-card-skin','day-card-seance','day-card-repas'].forEach(id => {
    const el = document.getElementById(id); if (el) el.style.display = active ? '' : 'none';
  });
  const sugg = document.querySelector('.sugg-engage-card');
  if (sugg) sugg.style.display = active ? '' : 'none';
  const la = document.getElementById('trial-lock-accueil'); if (la) la.style.display = active ? 'none' : 'block';
  const lc = document.getElementById('trial-lock-cycle'); if (lc) lc.style.display = active ? 'none' : 'block';
  const lo = document.getElementById('trial-lock-objectifs'); if (lo) lo.style.display = active ? 'none' : 'block';
  const addWrap = document.getElementById('obj-perso-add-wrap'); if (addWrap) addWrap.style.display = active ? '' : 'none';
  const sc = document.getElementById('symptomes-content'); if (sc) sc.style.display = active ? '' : 'none';
  const gc = document.getElementById('glaire-content'); if (gc) gc.style.display = active ? '' : 'none';
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

  const _sh = document.getElementById('sport-header');
  if (_sh) _sh.style.background = s.grad;
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
  renderTrialCard();
  renderCycleHistory();
  renderHistoriqueCycles();
  restoreFeedback();
  checkJ17Banner();

  // RESTORE
  restorePrayers();
  restoreDhikrChecks();
  restoreCoranCheck();
  restoreGlaire();
  restoreSymptomes();
  restoreSeanceDone();
  setTimeout(showInstallBanner, 1500);
  // Rattrapage : si l'upgrade Printemps n'a pas été montré et qu'on est en début d'Été
  if (ST.currentSaison === 'ete' && !ST.printempsUpgradeDone) {
    const dur2 = effectiveCycleDur();
    const { eteStartD: eteStart2 } = phaseThresholds(dur2);
    if (ST.currentDay <= eteStart2 + 1) {
      ST.printempsUpgradeDone = true;
      saveState();
      const lv = ST.seanceLevel || 1;
      if (lv >= 4 && !ST.levelMaxShown) { ST.levelMaxShown = true; saveState(); setTimeout(showLevelMax, 2000); }
      else if (lv < 4) setTimeout(showPrintempsUpgrade, 2000);
    }
  }
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
  renderCarteBouger(s);
  renderCarteRepas(s);
  renderCarteSkincare(s);

  // ─ Suggestions engageantes ─
  renderSuggestionsEngage(s);

  // Trial locks
  applyTrialLocks();

  // Toggle Premium btn state
  const pBtn = document.getElementById('premium-toggle-btn');
  if (pBtn) {
    pBtn.textContent = ST.isPremium ? '✦ Actif' : 'Inactif';
    pBtn.style.background = ST.isPremium ? 'var(--season-grad)' : 'var(--sable)';
    pBtn.style.color = ST.isPremium ? 'white' : 'var(--gris)';
  }
}


function _sportEnrSectionHtml(items, label) {
  if (!items || !items.length) return '';
  const rows = items.map(item => {
    const nom = item.exercice || item.nom || '';
    const dur = item.duree || '';
    const desc = item.description || '';
    return `<div class="sport-ex-row sport-enr-row">
      <div class="sport-ex-name-reps"><span class="sport-ex-name">${nom}</span><span class="sport-ex-reps">${dur}</span></div>
      ${desc ? `<div class="sport-ex-detail">${desc}</div>` : ''}
    </div>`;
  }).join('');
  return `<div class="sport-enr-section"><div class="sport-enr-label">${label}</div>${rows}</div>`;
}

function _sportExHtml(exercices, reposSec) {
  if (!exercices || !exercices.length) return '';
  const rows = exercices.map(ex => {
    let repsStr = '';
    if (ex.reps) {
      repsStr = ex.parJambe
        ? `${ex.sets || 1}×${ex.reps} / côté`
        : `${ex.sets || 1}×${ex.reps}`;
    } else if (ex.duree) {
      if (ex.sets) {
        repsStr = ex.parJambe
          ? `${ex.sets}×${ex.duree} × 2 côtés`
          : `${ex.sets}×${ex.duree}`;
      } else {
        repsStr = ex.parJambe
          ? `${ex.duree} × 2 côtés`
          : ex.duree;
      }
    }
    return `<div class="sport-ex-row">
      <div class="sport-ex-name-reps"><span class="sport-ex-name">${ex.nom}</span><span class="sport-ex-reps">${repsStr}</span></div>
      ${ex.detail ? `<div class="sport-ex-detail">${ex.detail}</div>` : ''}
    </div>`;
  }).join('');
  const reposHtml = reposSec ? `<div class="sport-repos-info">⏱ Repos : ${reposSec}s entre séries</div>` : '';
  return rows + reposHtml;
}

function renderCarteBouger(s) {
  // Protection : si SAISONS[ST.currentSaison] est undefined (ex: automne pas défini)
  if (!s) {
    console.warn('SAISONS[' + ST.currentSaison + '] non défini - skip renderCarteBouger');
    return;
  }
  const spec = getTodaySeanceSpec();
  const today = new Date().toDateString();
  const donVal = ST.seanceDone && ST.seanceDone[today];
  const isDone = donVal === true || donVal === 'express' || donVal === 'repos-actif';
  const isReported = donVal === 'reportee';

  const nameEl = document.getElementById('qs-name');
  const metaEl = document.getElementById('qs-meta');
  const durEl = document.getElementById('qs-duration');
  const exEl = document.getElementById('qs-exercises');
  const btnWrap = document.getElementById('qs-btn-wrap');
  const doneWrap = document.getElementById('qs-done-wrap');
  const reportedWrap = document.getElementById('qs-reported-wrap');

  if (!spec) {
    if (nameEl) nameEl.textContent = '—';
    return;
  }

  const level = ST.seanceLevel || 1;
  const reposSec = (typeof SEANCES_SPORT !== 'undefined') ? (SEANCES_SPORT.printemps.niveauxRepos[level] || 45) : 45;

  let titleText = '', metaText = '', durText = '', exContent = '', msgHtml = '', spirituelHtml = '', levelLabel = '';

  switch (spec.type) {
    case 'hiver': {
      const d = spec.data;
      titleText = d.nom; metaText = 'Douceur menstruelle'; durText = d.duree;
      levelLabel = `Niveau ${spec.level || level}/4`;
      const enrichieH = (typeof getSeanceEnrichie === 'function') ? getSeanceEnrichie('hiver', spec.level || level) : null;
      exContent = _sportEnrSectionHtml(enrichieH && enrichieH.echauffement, '🔥 Échauffement')
               + _sportExHtml(d.exercices)
               + _sportEnrSectionHtml(enrichieH && enrichieH.retour_au_calme, '🌿 Retour au calme');
      msgHtml = d.message;
      spirituelHtml = (enrichieH && enrichieH.message_fin) || d.messageSpirituel;
      break;
    }
    case 'repos': {
      titleText = 'Jour de repos'; metaText = 'Choisis ton repos'; durText = '—';
      const reposDone = ST.seanceDone && ST.seanceDone[today];
      exContent = `<div class="sport-repos-options">
        <div class="sport-repos-option" onclick="validerReposActif()">
          <div class="sport-repos-opt-icon">🏃‍♀️</div>
          <div><div class="sport-repos-opt-title">Repos actif</div>
          <div class="sport-repos-opt-desc">Étirements 2 min + respiration</div>
          <div class="sport-repos-opt-badge">Compte dans le streak</div></div>
        </div>
        <div class="sport-repos-option" onclick="choisirReposComplet()">
          <div class="sport-repos-opt-icon">💤</div>
          <div><div class="sport-repos-opt-title">Repos complet</div>
          <div class="sport-repos-opt-desc">Ton corps construit pendant la récupération</div></div>
        </div>
      </div>`;
      if (spec.message) msgHtml = spec.message;
      break;
    }
    case 'printemps-bas':
    case 'printemps-haut': {
      const d = spec.data;
      titleText = d.nom;
      metaText = spec.type === 'printemps-bas' ? '🦵 Bas du corps' : '💪 Haut du corps';
      durText = d.duree || '~25 min';
      levelLabel = `Niveau ${level}/4 · ${['Essentielle','À ton rythme','Vitalité','Pleine puissance'][level-1] || ''}`;
      const enrichieP = (typeof getSeanceEnrichie === 'function') ? getSeanceEnrichie('printemps', level) : null;
      exContent = _sportEnrSectionHtml(enrichieP && enrichieP.echauffement, '🔥 Échauffement')
               + _sportExHtml(d.exercices, reposSec)
               + _sportEnrSectionHtml(enrichieP && enrichieP.retour_au_calme, '🌿 Retour au calme');
      msgHtml = 'Bismillah — chaque mouvement est une ibada.';
      spirituelHtml = (enrichieP && enrichieP.message_fin) || 'Ton corps est une amânah. Prends-en soin avec intention.';
      break;
    }
    case 'ete-intense': {
      const d = spec.data;
      titleText = d.label; durText = `${d.duree} min`;
      levelLabel = `Niveau ${level}/4`;
      if (d.type === 'emom') {
        metaText = `${d.exercice} · ${d.reps} reps/min`;
        exContent = `<div class="sport-emom-block">
          <div class="sport-emom-label">EMOM ${d.duree} min</div>
          <div class="sport-emom-exo">${d.exercice} — <strong>${d.reps} reps</strong> au début de chaque minute</div>
          ${d.detail ? `<div class="sport-ex-detail">${d.detail}</div>` : ''}
        </div>`;
      } else {
        metaText = 'Circuit AMRAP';
        const record = ST.amrapRecord;
        exContent = `<div class="sport-emom-block">
          <div class="sport-emom-label">AMRAP ${d.duree} min</div>
          ${(d.circuit || []).map(ex => `<div class="sport-amrap-exo">${ex.nom} — ${ex.reps} reps</div>`).join('')}
          ${d.detail ? `<div class="sport-ex-detail">${d.detail}</div>` : ''}
          ${record ? `<div class="sport-amrap-record">🏆 Ton record : <strong>${record} tours</strong></div>` : ''}
          <div class="sport-amrap-input-wrap" id="amrap-input-wrap" ${isDone ? 'style="display:none"' : ''}>
            <label class="sport-amrap-input-label">Combien de tours as-tu complétés ?</label>
            <input type="number" id="amrap-score-input" min="1" max="99" placeholder="Nb de tours" class="sport-amrap-input">
          </div>
        </div>`;
      }
      msgHtml = 'Pousse fort — ton corps est à son pic de force.';
      spirituelHtml = 'Allahou Akbar — rappelle-toi de Sa grandeur à chaque effort.';
      break;
    }
    case 'ete-repos': {
      titleText = 'Récupération'; metaText = 'Repos actif'; durText = '—';
      exContent = `<div class="sport-repos-block"><div class="sport-repos-msg">${spec.message || ''}</div></div>`;
      break;
    }
    case 'automne-actif': {
      const d = spec.data;
      titleText = d.nom; metaText = '🍂 Phase active';
      durText = d.duree || '~25 min';
      levelLabel = `Niveau ${level}/4`;
      const enrichieAA = (typeof getSeanceEnrichie === 'function') ? getSeanceEnrichie('automne', level) : null;
      exContent = _sportEnrSectionHtml(enrichieAA && enrichieAA.echauffement, '🔥 Échauffement')
               + _sportExHtml(d.exercices, reposSec + (spec.reposExtra || 10))
               + _sportEnrSectionHtml(enrichieAA && enrichieAA.retour_au_calme, '🌿 Retour au calme');
      msgHtml = spec.message || '';
      spirituelHtml = (enrichieAA && enrichieAA.message_fin) || '';
      break;
    }
    case 'automne-doux': {
      const d = spec.data;
      titleText = 'Mobilité douce'; metaText = '🍂 Phase de transition'; durText = '~15 min';
      const enrichieAD = (typeof getSeanceEnrichie === 'function') ? getSeanceEnrichie('automne', level) : null;
      exContent = _sportEnrSectionHtml(enrichieAD && enrichieAD.echauffement, '🔥 Échauffement')
               + _sportExHtml(d.mobilite);
      if (level >= 3 && typeof SEANCES_SPORT !== 'undefined') {
        const _rempl = (SEANCES_SPORT.automne?.actif?.remplacements) || [];
        const _exBase = (SEANCES_SPORT.printemps.bas[level]?.exercices || []).map(ex => {
          const sub = _rempl.find(r => r.ancien === ex.nom);
          return sub ? Object.assign({}, ex, { nom: sub.nouveau, detail: sub.detail }) : ex;
        });
        exContent += _sportExHtml(_exBase, d.repos);
      }
      exContent += _sportEnrSectionHtml(enrichieAD && enrichieAD.retour_au_calme, '🌿 Retour au calme');
      msgHtml = d.message;
      spirituelHtml = (enrichieAD && enrichieAD.message_fin) || '';
      break;
    }
    case 'automne-fin': {
      const d = spec.data;
      titleText = 'Douceur profonde'; metaText = '🍂 Fin de cycle'; durText = '~10 min';
      const enrichieAF = (typeof getSeanceEnrichie === 'function') ? getSeanceEnrichie('automne', level) : null;
      exContent = _sportExHtml(d.exercices)
               + _sportEnrSectionHtml(enrichieAF && enrichieAF.retour_au_calme, '🌿 Retour au calme');
      msgHtml = d.message;
      spirituelHtml = (enrichieAF && enrichieAF.message_fin) || '';
      break;
    }
    case 'calme': {
      const d = spec.data;
      titleText = d.nom; metaText = 'Ton cœur a besoin de calme'; durText = d.duree;
      exContent = `<div class="sport-calme-detail">${d.detail}</div>
        <button class="sport-calme-override-btn" onclick="choisirSeanceMalgreCalme()">Faire quand même ma séance →</button>`;
      msgHtml = d.message; spirituelHtml = d.messageSpirituel;
      break;
    }
  }

  if (nameEl) nameEl.textContent = titleText;
  if (metaEl) metaEl.textContent = metaText;
  if (durEl) durEl.textContent = durText;

  const streakLabel = _getStreakLabel();
  if (exEl) {
    exEl.innerHTML =
      (streakLabel && !isDone ? `<div class="sport-streak-badge">${streakLabel}</div>` : '') +
      (levelLabel ? `<div class="sport-level-badge">${levelLabel}</div>` : '') +
      (msgHtml ? `<div class="sport-amanah">${msgHtml}</div>` : '') +
      exContent +
      (spirituelHtml ? `<div class="sport-spiritual">${spirituelHtml}</div>` : '');
  }
  const _noTimerTypes = ['repos', 'ete-repos', 'calme'];
  if (btnWrap) btnWrap.style.display = (isDone || isReported || (spec && _noTimerTypes.includes(spec.type))) ? 'none' : 'block';
  if (doneWrap) doneWrap.style.display = isDone ? 'flex' : 'none';
  if (reportedWrap) reportedWrap.style.display = isReported ? 'block' : 'none';
  const reporterBtnWrap = document.getElementById('qs-reporter-btn-wrap');
  if (reporterBtnWrap) reporterBtnWrap.style.display = (isDone || isReported) ? 'none' : 'flex';
}

// ═══════════════════════════════════════════════
// CARTES MANGER & PRENDRE SOIN
// ═══════════════════════════════════════════════
function renderCarteRepas(s) {
  const alim = s.alimentation;
  if (!alim) return;

  const recettes = RECETTES[ST.currentSaison] || [];
  const idx = (ST.currentDay - 1) % Math.max(recettes.length, 1);
  const r = recettes[idx];
  const saisonLabel = { hiver: 'Hiver', printemps: 'Printemps', ete: 'Été', automne: 'Automne' }[ST.currentSaison] || '';

  const starsEl = document.getElementById('dc-repas-stars');
  if (starsEl) {
    starsEl.innerHTML = r
      ? `<div class="repas-hero">
           <span class="repas-hero-emoji">${r.emoji}</span>
           <div class="repas-hero-text">
             <div class="repas-hero-phase" style="text-transform:lowercase;font-variant:small-caps;letter-spacing:.08em;">${saisonLabel}</div>
             <div class="repas-hero-nom">${r.nom}</div>
           </div>
         </div>`
      : (alim.star || []).map(f => `<span class="day-card-chip">⭐ ${f}</span>`).join('');
  }

  const nutrimEl = document.getElementById('dc-repas-nutriments');
  if (nutrimEl) {
    if (r) {
      nutrimEl.innerHTML = `
        <div class="repas-pourquoi-block">
          <div class="repas-pourquoi-text">✨ ${r.pourquoi}</div>
        </div>`;
    } else {
      nutrimEl.innerHTML = (alim.nutriments || []).slice(0, 2).map(n => `
        <div class="day-card-nutriment-row">
          <span class="day-card-nutriment-nom">${n.nom}</span>
          <span class="day-card-nutriment-why">${n.why}</span>
        </div>`).join('');
    }
  }

  const eviterEl = document.getElementById('dc-repas-eviter');
  if (eviterEl) {
    eviterEl.innerHTML = (alim.eviter || []).length
      ? `<span class="day-card-eviter-label">À éviter :</span> ` +
        alim.eviter.map(e => `<span class="day-card-chip-eviter">${e}</span>`).join('')
      : '';
  }

  const premEl = document.getElementById('action-manger-premium');
  if (!premEl) return;
  if (isFullAccess()) {
    if (!r) return;
    premEl.innerHTML = `
      <div class="action-premium-unlocked" onclick="openRecipeModal('${ST.currentSaison}',${idx})">
        <span class="action-prem-unlocked-emoji">${r.emoji}</span>
        <div class="action-prem-unlocked-text">
          <div class="action-prem-unlocked-name">Voir la recette complète</div>
          <div class="action-prem-unlocked-sub">Ingrédients · étapes détaillées →</div>
        </div>
        <span class="action-prem-unlocked-arrow">›</span>
      </div>`;
  } else {
    const previewIngr = r ? (r.ingredients || []).slice(0, 2).join(' · ') + '...' : 'Ingrédients de saison';
    premEl.innerHTML = `
      <div class="action-premium-locked">
        <div class="action-prem-blur">
          <div class="action-prem-recipe-preview">${r ? r.nom : 'Recette de saison'}</div>
          <div class="action-prem-steps-preview">${previewIngr}</div>
        </div>
        <div class="action-prem-cta">
          <div class="action-prem-label">🍯 Nourrir ton corps avec sagesse</div>
          <button class="action-prem-btn" onclick="startStripeCheckout()">Prendre soin de moi</button>
        </div>
      </div>`;
  }
}

// ═══════════════════════════════════════════════
// MON MARCHÉ
// ═══════════════════════════════════════════════
function switchRepasTab(tab) {
  ['recettes', 'phase', 'marche'].forEach(t => {
    const btn = document.getElementById('repas-tab-btn-' + t);
    const pane = document.getElementById('repas-tab-' + t);
    if (btn) btn.classList.toggle('active', t === tab);
    if (pane) pane.style.display = t === tab ? 'block' : 'none';
  });
  if (tab === 'marche') renderMarcheTab();
  if (tab === 'phase') renderRepasPhaseTab();
}

function renderRepasPhaseTab() {
  const saison = ST.currentSaison;
  const recettes = RECETTES[saison] || [];
  const premium = isFullAccess();
  const container = document.getElementById('repas-phase-content');
  if (!container) return;
  const phaseLabel = { hiver: '🌙 Hiver', printemps: '🌿 Printemps', ete: '☀️ Été', automne: '🍂 Automne' }[saison] || '';
  container.innerHTML = `
    <div class="repas-phase-header">${phaseLabel} · ${recettes.length} recettes</div>
    ${recettes.map((r, i) => `
      <div class="repas-phase-item" onclick="${premium ? `openRecipeModal('${saison}',${i})` : 'startStripeCheckout()'}">
        <span class="repas-phase-emoji">${r.emoji}</span>
        <div class="repas-phase-info">
          <div class="repas-phase-nom">${r.nom}</div>
          <div class="repas-phase-why">${r.pourquoi.length > 65 ? r.pourquoi.slice(0, 65) + '…' : r.pourquoi}</div>
        </div>
        <span class="repas-phase-arrow">${premium ? '›' : '🔒'}</span>
      </div>`).join('')}
    ${!premium ? `<button class="modal-cta" style="width:100%;margin-top:14px;padding:14px;" onclick="startStripeCheckout()">🍯 M'accompagner dans ma nutrition cyclique</button>` : ''}`;
}

const MARCHE_CATEGORIES = [
  { key: 'proteines', label: 'Protéines', icon: '🥩',
    mots: ['poulet','bœuf','boeuf','veau','agneau','dinde','sardines','saumon','thon','cabillaud','maquereau','crevettes','œufs','oeufs','tofu','pois chiches','lentilles','haricots blancs','haricots rouges','haricots noirs','fèves','feves','pois cassés','edamame'] },
  { key: 'epices', label: 'Épices & Condiments', icon: '🧂',
    mots: ['curcuma','gingembre','cumin','paprika','cannelle','coriandre','persil','menthe','aneth','basilic','thym','fleur de sel','poivre','harissa','sauce soja','vinaigre','moutarde','miel','olives','bouillon','piment','épices','herbes','zaatar','fleur d\'oranger','concentré','citron confit','ras el hanout','muscade','sel'] },
  { key: 'legumes', label: 'Légumes', icon: '🥦',
    mots: ['épinards','brocoli','tomates','carottes','oignon','ail','courgette','poivron','betterave','kale','chou','champignons','haricots verts','céleri','butternut','potimarron','potiron','concombre','aubergine','roquette','mâche','poireau','artichaut','fenouil','pommes de terre','patate','salade'] },
  { key: 'fruits', label: 'Fruits', icon: '🍎',
    mots: ['citron vert','citron','orange','pomme','poire','banane','fraises','myrtilles','framboises','grenade','pastèque','kiwi','mangue','avocat','dattes','raisins secs','raisins','figues','fruits rouges','ananas'] },
  { key: 'feculents', label: 'Féculents', icon: '🌾',
    mots: ['riz','pâtes','boulgour','pain','farine','semoule','couscous','quinoa'] },
  { key: 'laitiers', label: 'Produits laitiers', icon: '🧀',
    mots: ['fromage blanc','lait de coco','yaourt','fromage','feta','chèvre','crème fraîche','crème','kéfir','beurre','lait'] },
  { key: 'graines', label: 'Oléagineux & Graines', icon: '🫘',
    mots: ['amandes','noix','noisettes','graines de courge','graines de sésame','graines de lin','graines de chia','graines','sésame','tahini','huile','chocolat','cacao'] },
];

function _categorizeIngredient(text) {
  const lower = text.toLowerCase();
  for (const cat of MARCHE_CATEGORIES) {
    if (cat.mots.some(m => lower.includes(m))) return cat.key;
  }
  return 'autres';
}

function _cleanIngr(ing) {
  let s = ing
    .replace(/^[\d.,/½¼¾]+\s*(g|kg|ml|cl|l|cs|cc)?\s*/i, '')
    .replace(/,\s*\d+[.,]?\d*\s*(g|kg|ml|cl|l|cs|cc)?\s*/gi, ', ')
    .replace(/^(grosses?|petites?|grandes?)?\s*(poign[ée]+s?|verres?|tranches?|boîtes?|carr[ée]+s?|bottes?)\s+(d[e']\s*|de\s+l[a']?\s*)?/i, '')
    .replace(/^(quelques|un|une|des|du|de la|de l')\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim();
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

function _getMarcheItems(saison) {
  const items = [];
  const alim = SAISONS[saison]?.alimentation;
  if (alim?.aliments) {
    alim.aliments.forEach(a => {
      items.push({ id: 'alim_' + a.replace(/[\s'']/g, '_'), text: a, section: 'phase', star: (alim.star || []).includes(a) });
    });
  }
  function _keyIngr(raw) {
    return raw.toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')     // accents ignorés pour la clé
      .replace(/^[\d.,/½¼¾]+\s*(g|kg|ml|cl|l|cs|cc)?\s*/i, '')
      .replace(/^(quelques|une|un|des|du|de la|de l['']?|d[''])\s*/i, '')  // articles (avant mesures)
      .replace(/^(grosses?|petites?|grandes?)?\s*(poignees?|verres?|tranches?|boites?|carres?|bottes?)\s+d[e']?\s*/i, '')
      .replace(/[,(].*$/, '')                                // coupure à la virgule/parenthèse
      .replace(/\s+en\s+\w+s?\s*$/i, '')                    // "en morceaux", "en branches", "en dés"
      .replace(/\s+(fraich[e]?s?|cuit[e]?s?|emince[e]?s?|hache[e]?s?|rape[e]?s?|congele[e]?s?|en conserve|frais?|bio|nature|cru[e]?s?|entier[e]?s?)\s*$/i, '')
      .replace(/\s+/g, ' ').trim().slice(0, 25);
  }
  const seen = new Map();
  (RECETTES[saison] || []).forEach(r => {
    (r.ingredients || []).forEach(ing => {
      const key = 'ingr_' + _keyIngr(ing).replace(/[\s''(),]/g, '_');
      if (!seen.has(key)) seen.set(key, _cleanIngr(ing));
    });
  });
  seen.forEach((text, key) => items.push({ id: key, text, section: 'recette' }));
  return items;
}

function _marcheItemHtml(item, checked, canDelete) {
  const star = item.star ? ' ⭐' : '';
  return `<div class="marche-item${checked ? ' checked' : ''}" id="mitem-${item.id}">
    <div class="marche-item-chk" onclick="marcheToggleItem('${item.id}')">${checked ? '✓' : ''}</div>
    <span class="marche-item-text" onclick="marcheToggleItem('${item.id}')">${item.text}${star}</span>
    ${canDelete ? `<span class="marche-item-del" onclick="marcheRemoveCustom('${item.id}')">×</span>` : ''}
  </div>`;
}

function renderMarcheTab() {
  const saison = ST.currentSaison;
  if (!ST.marche) ST.marche = { phase: null, checks: {}, custom: [] };
  const m = ST.marche;
  if (m.phase !== saison) {
    m.phase = saison;
    m.checks = {};
    saveState();
  }
  const container = document.getElementById('marche-content');
  if (!container) return;
  const s = SAISONS[saison];
  const items = _getMarcheItems(saison);
  const phaseItems = items.filter(it => it.section === 'phase');
  const recetteItems = items.filter(it => it.section === 'recette');
  let html = '';
  html += `<div class="marche-section-lbl">${s.emoji} Aliments cl&#233;s &middot; ${s.nom}</div>`;
  html += phaseItems.map(it => _marcheItemHtml(it, !!m.checks[it.id], false)).join('');
  html += `<div class="marche-section-lbl">&#128203; Recettes du moment</div>`;
  const byCategory = {};
  recetteItems.forEach(item => {
    const cat = _categorizeIngredient(item.text);
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(item);
  });
  const catOrder = ['proteines', 'legumes', 'fruits', 'feculents', 'laitiers', 'graines', 'epices', 'autres'];
  catOrder.forEach(catKey => {
    if (!byCategory[catKey]?.length) return;
    const catInfo = MARCHE_CATEGORIES.find(c => c.key === catKey) || { icon: '🛒', label: 'Autres' };
    html += `<div class="marche-cat-lbl">${catInfo.icon} ${catInfo.label}</div>`;
    byCategory[catKey].forEach(item => { html += _marcheItemHtml(item, !!m.checks[item.id], false); });
  });
  html += `<div class="marche-section-lbl">&#10133; Mes ajouts</div>`;
  (m.custom || []).forEach(c => { html += _marcheItemHtml({ id: c.id, text: c.text, section: 'custom' }, !!m.checks[c.id], true); });
  html += `<div class="marche-input-row">
    <input class="marche-input" id="marche-input" type="text" placeholder="Ajouter un article&#8230;" inputmode="text"
           onkeydown="if(event.key==='Enter'){this.blur();marcheAddItem();}">
    <button class="marche-add-btn" onclick="marcheAddItem()">+</button>
  </div>
  <div class="marche-actions-row">
    <button class="marche-action-btn" onclick="marcheNouvelleListe()">&#128465; Nouvelle liste</button>
    <button class="marche-action-btn marche-action-share" onclick="marchePartager()">&#128228; Partager</button>
  </div>`;
  container.innerHTML = html;
}

function marcheToggleItem(itemId) {
  if (!ST.marche) ST.marche = { phase: ST.currentSaison, checks: {}, custom: [] };
  ST.marche.checks[itemId] = !ST.marche.checks[itemId];
  saveState();
  const el = document.getElementById('mitem-' + itemId);
  if (!el) return;
  const checked = !!ST.marche.checks[itemId];
  el.classList.toggle('checked', checked);
  const chk = el.querySelector('.marche-item-chk');
  if (chk) chk.textContent = checked ? '✓' : '';
}

function marcheAddItem() {
  const inp = document.getElementById('marche-input');
  if (!inp) return;
  const text = inp.value.trim();
  if (!text) return;
  if (!ST.marche) ST.marche = { phase: ST.currentSaison, checks: {}, custom: [] };
  const id = 'custom_' + Date.now();
  ST.marche.custom.push({ id, text });
  inp.value = '';
  saveState();
  renderMarcheTab();
  document.getElementById('marche-input')?.focus();
}

function marcheRemoveCustom(id) {
  if (!ST.marche) return;
  ST.marche.custom = (ST.marche.custom || []).filter(c => c.id !== id);
  delete ST.marche.checks[id];
  saveState();
  renderMarcheTab();
}

function marcheNouvelleListe() {
  if (!ST.marche) return;
  ST.marche.checks = {};
  saveState();
  renderMarcheTab();
  showToast('🛒 Liste remise à zéro');
}

function marchePartager() {
  if (!ST.marche) return;
  const m = ST.marche;
  const saison = ST.currentSaison;
  const s = SAISONS[saison];
  const allItems = _getMarcheItems(saison);
  const unchecked = [
    ...allItems.filter(it => !m.checks[it.id]),
    ...(m.custom || []).filter(c => !m.checks[c.id])
  ];
  if (!unchecked.length) { showToast('✅ Tout est déjà coché !'); return; }
  const text = '🛒 Mon Marché SakinApp — ' + s.nom + '\n\n' + unchecked.map(it => '• ' + it.text).join('\n');
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => showToast('📤 Liste copiée dans le presse-papier !'));
  } else {
    showToast('❌ Copie non disponible sur ce navigateur');
  }
}

function renderCarteSkincare(s) {
  const skin = s.skincare;
  if (!skin) return;

  // Soin du jour (données statiques)
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

  const premEl = document.getElementById('action-soin-premium');
  if (!premEl) return;
  if (isFullAccess()) {
    const routine = ROUTINES_PREMIUM[ST.currentSaison];
    const steps = routine ? routine.matin.length + routine.soir.length : 0;
    const phaseEmoji = { hiver: '🌙', printemps: '🌿', ete: '☀️', automne: '🍂' }[ST.currentSaison] || '🌿';
    premEl.innerHTML = `
      <div class="action-premium-unlocked" onclick="openSkinModal('${ST.currentSaison}')">
        <span class="action-prem-unlocked-emoji">${phaseEmoji}</span>
        <div class="action-prem-unlocked-text">
          <div class="action-prem-unlocked-name">Ta routine · matin &amp; soir</div>
          <div class="action-prem-unlocked-sub">${steps} gestes naturels pens&eacute;s pour toi →</div>
        </div>
        <span class="action-prem-unlocked-arrow">›</span>
      </div>`;
  } else {
    premEl.innerHTML = `
      <div class="action-premium-locked">
        <div class="action-prem-blur">
          <div class="action-prem-recipe-preview">Matin · Soir · M&eacute;decine proph&eacute;tique</div>
          <div class="action-prem-steps-preview">Nigelle · Miel · Huile d&rsquo;olive · Eau de rose</div>
        </div>
        <div class="action-prem-cta">
          <div class="action-prem-label">✨ Ta peau mérite cette douceur</div>
          <button class="action-prem-btn" onclick="startStripeCheckout()">M'offrir cette routine</button>
        </div>
      </div>`;
  }
}

// ═══════════════════════════════════════════════
// MODAUX PREMIUM
// ═══════════════════════════════════════════════
function openRecipeModal(phase, idx) {
  const r = (RECETTES[phase] || [])[idx];
  if (!r) return;
  const el = document.getElementById('recipe-modal-content');
  if (el) el.innerHTML = `
    <div style="font-size:48px;text-align:center;margin-bottom:14px;">${r.emoji}</div>
    <div class="pmod-title">${r.nom}</div>
    <div class="pmod-pourquoi">${r.pourquoi}</div>
    <div class="pmod-section">🛒 Ingrédients</div>
    <ul class="pmod-list">${(r.ingredients||[]).map(i=>`<li>${i}</li>`).join('')}</ul>
    <div class="pmod-section">👩‍🍳 Préparation</div>
    <ol class="pmod-list">${(r.etapes||[]).map(e=>`<li>${e}</li>`).join('')}</ol>
  `;
  document.getElementById('recipe-modal').classList.add('open');
}
function closeRecipeModal() { document.getElementById('recipe-modal').classList.remove('open'); }

function openSkinModal(phase) {
  const r = ROUTINES_PREMIUM[phase];
  if (!r) return;
  const renderSteps = steps => steps.map(g => `
    <div class="pmod-skin-step">
      <div class="pmod-skin-icon">${g.icon}</div>
      <div class="pmod-skin-body">
        <div class="pmod-skin-name">${g.geste} <span class="pmod-skin-dur">${g.duree}</span></div>
        <div class="pmod-skin-detail">${g.detail}</div>
      </div>
    </div>`).join('');
  const el = document.getElementById('skin-modal-content');
  if (el) el.innerHTML = `
    <div class="pmod-routine-block">
      <div class="pmod-routine-time">☀️ Routine Matin</div>
      ${renderSteps(r.matin)}
    </div>
    <div class="pmod-routine-block">
      <div class="pmod-routine-time">🌙 Routine Soir</div>
      ${renderSteps(r.soir)}
    </div>`;
  document.getElementById('skin-modal').classList.add('open');
}
function closeSkinModal() { document.getElementById('skin-modal').classList.remove('open'); }




function handleProgressionAnswer(ans) {
  document.getElementById('progression-modal').classList.remove('open');
  const level = ST.seanceLevel || 1;
  if (ans === 'facile' && level < 4) {
    ST.seanceLevel = level + 1;
    showToast(`✨ Niveau ${ST.seanceLevel} — tu avances à ton rythme. Alhamdulillah 🌿`);
  } else if (ans === 'dur_trop' && level > 1) {
    ST.seanceLevel = level - 1;
    showToast(`💛 Descendre d'un niveau, c'est écouter son corps — c'est de la sagesse.`);
  } else if (ans === 'dur') {
    showToast('💪 Tu tiens — c\'est de la force. Continue à ton rythme.');
  } else {
    showToast('✨ Parfait — on continue au même rythme.');
  }
  saveState();
  renderCarteBouger(SAISONS[ST.currentSaison]);
}

function togglePremium() { /* désactivé */ }

async function applyPremiumCode() {
  const inp = document.getElementById('premium-code-input');
  const msg = document.getElementById('premium-code-msg');
  if (!inp || !msg) return;
  const code = inp.value.trim().toUpperCase();
  if (!code) return;
  msg.style.color = 'var(--gris)';
  msg.textContent = 'Vérification…';
  try {
    const sb = await initSupabase();
    if (!sb) { msg.style.color = '#C4694A'; msg.textContent = 'Connecte-toi pour utiliser un code.'; return; }
    const { data: { session } } = await sb.auth.getSession();
    const jwt = session?.access_token;
    if (!jwt) { msg.style.color = '#C4694A'; msg.textContent = 'Connecte-toi pour utiliser un code.'; return; }
    const r = await fetch('/api/redeem-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + jwt },
      body: JSON.stringify({ code })
    });
    if (!r.ok) { const errData = await r.json().catch(() => ({})); throw new Error(errData.error || r.status); }
    const data = await r.json();
    if (data && data.valid) {
      await verifyPremiumFromDB(sb, ST.supabaseUserId);
      renderDashboard(SAISONS[ST.currentSaison]);
      applyTrialLocks();
      msg.style.color = '#3DAE8A';
      msg.textContent = ST.isPremium ? '✓ Premium activé — bienvenue !' : 'Code accepté — rechargement nécessaire.';
      inp.value = '';
    } else {
      msg.style.color = '#C4694A';
      msg.textContent = data?.error || 'Code incorrect.';
    }
  } catch {
    msg.style.color = '#C4694A';
    msg.textContent = 'Erreur réseau — réessaie.';
  }
}

function validerSeanceDash() {
  const today = new Date().toDateString();
  if (!ST.seanceDone) ST.seanceDone = {};
  ST.seanceDone[today] = true;
  ST.totalSeancesAll = (ST.totalSeancesAll || 0) + 1;
  ST.reportConsecutif = 0;

  const spec = getTodaySeanceSpec();
  if (spec && spec.type === 'ete-intense' && spec.data?.type === 'amrap') {
    const inp = document.getElementById('amrap-score-input');
    const score = inp ? parseInt(inp.value, 10) : NaN;
    if (!isNaN(score) && score > 0) {
      if (!ST.amrapRecord || score > ST.amrapRecord) ST.amrapRecord = score;
    }
  }
  if (spec && spec.type === 'printemps-bas') {
    ST.printempsBasCount = (ST.printempsBasCount || 0) + 1;
  }

  _updateStreakPhase(1);
  ST.checkpointProgress = (ST.checkpointProgress || 0) + 1;
  if (typeof updateNiveauStreak === 'function') updateNiveauStreak(true);
  if (typeof checkNiveauProgression === 'function') checkNiveauProgression();

  saveState();
  const s = SAISONS[ST.currentSaison];
  renderCarteBouger(s);
  restoreSeanceDone();
  checkEndOfPrintemps();
  burstCelebration();
  showToast('💪 Alhamdulillah — séance accomplie ! 🌸');
  setTimeout(showFeedbackPostSeance, 1000);
  if (ST.checkpointProgress >= 5) setTimeout(_triggerCheckpoint, 3500);
  checkPropositionsAmelioration();
}

function burstCelebration() {
  const stars = ['🌸','✨','⭐','🌟','💫','🌺'];
  const wrap = document.createElement('div');
  wrap.className = 'burst-wrap';
  for (let i = 0; i < 9; i++) {
    const el = document.createElement('div');
    el.className = 'celebrate-star';
    el.textContent = stars[i % stars.length];
    el.style.left = ((Math.random() - 0.5) * 220) + 'px';
    el.style.top  = ((Math.random() - 0.5) * 260) + 'px';
    el.style.animationDelay = (i * 0.07) + 's';
    wrap.appendChild(el);
  }
  document.body.appendChild(wrap);
  setTimeout(() => { if (wrap.parentNode) wrap.parentNode.removeChild(wrap); }, 1400);
}

function checkEndOfPrintemps() {
  if (ST.currentSaison !== 'printemps') return;
  const dur = effectiveCycleDur();
  const { eteStartD } = phaseThresholds(dur);
  if (ST.currentDay < eteStartD - 1) return;
  if (ST.printempsUpgradeDone) return;
  ST.printempsUpgradeDone = true;
  saveState();
  const level = ST.seanceLevel || 1;
  if (level >= 4) {
    if (!ST.levelMaxShown) {
      ST.levelMaxShown = true;
      saveState();
      setTimeout(showLevelMax, 900);
    }
    return;
  }
  setTimeout(showPrintempsUpgrade, 900);
}

function showPrintempsUpgrade() {
  const el = document.getElementById('printemps-upgrade-modal');
  if (el) el.classList.add('open');
}

function handlePrintempsUpgrade(ans) {
  const el = document.getElementById('printemps-upgrade-modal');
  if (el) el.classList.remove('open');
  const level = ST.seanceLevel || 1;
  if (ans === 'facile' && level < 4) {
    ST.seanceLevel = level + 1;
    if (ST.seanceLevel >= 4) {
      ST.levelMaxShown = true;
      saveState();
      setTimeout(showLevelMax, 600);
      return;
    }
    showToast(`✨ Niveau ${ST.seanceLevel} — tu avances à ton rythme. Alhamdulillah 🌿`);
  } else if (ans === 'dur' && level > 1) {
    ST.seanceLevel = level - 1;
    showToast(`💛 Niveau ${ST.seanceLevel} — on avance à ton rythme.`);
  } else {
    showToast('✨ Parfait — on continue au même rythme.');
  }
  saveState();
  renderCarteBouger(SAISONS[ST.currentSaison]);
}

// ═══════════════════════════════════════════════
// SPORT AMÉLIORÉ
// ═══════════════════════════════════════════════

function reporterSeance() {
  const today = new Date().toDateString();
  if (!ST.seanceDone) ST.seanceDone = {};
  ST.seanceDone[today] = 'reportee';
  ST.totalReportsAll = (ST.totalReportsAll || 0) + 1;
  ST.reportConsecutif = (ST.reportConsecutif || 0) + 1;
  ST.lastReportDate = today;
  saveState();
  renderCarteBouger(SAISONS[ST.currentSaison]);
  if (ST.reportConsecutif >= 2) {
    setTimeout(() => document.getElementById('report-question-modal')?.classList.add('open'), 400);
  } else {
    showToast('📅 Reporté à demain — à ton rythme 🌸');
  }
}

function handleReportQuestion(ans) {
  document.getElementById('report-question-modal')?.classList.remove('open');
  ST.reportConsecutif = 0;
  if (ans === 'longue') {
    showToast('💛 La version 5 min est juste en dessous — tu peux la faire maintenant !');
    setTimeout(() => { const b = document.getElementById('sport-express-btn'); if (b) { b.style.transform='scale(1.1)'; setTimeout(()=>b.style.transform='',500); } }, 200);
  } else if (ans === 'difficile') {
    const level = ST.seanceLevel || 1;
    if (level > 1) { ST.seanceLevel = level - 1; showToast(`💛 Niveau ${ST.seanceLevel} — on avance à ton rythme.`); }
    else { showToast('💛 La version 5 min est là pour toi 🌸'); }
  } else {
    showToast('🌸 C\'est noté, à demain 🌸');
  }
  saveState();
}

function choisirSeanceMalgreCalme() {
  ST.calmeOverride = new Date().toDateString();
  saveState();
  renderCarteBouger(SAISONS[ST.currentSaison]);
}

function openSeanceExpress() {
  const el = document.getElementById('express-modal');
  if (!el) return;
  const spec = getTodaySeanceSpec();
  const body = el.querySelector('#express-body');
  if (!body) return;
  let exs = [];
  if (spec && spec.data && spec.data.exercices) exs = spec.data.exercices.slice(0, 2);
  else if (spec && spec.data && spec.data.circuit) exs = spec.data.circuit.slice(0, 2);
  if (!exs.length) { showToast('⚡ Fais 5 min de marche rapide — ça compte !'); validerSeanceExpress(); return; }
  body.innerHTML = `
    <div style="font-size:12px;color:var(--gris);text-align:center;margin-bottom:16px;">Pas le temps ? Voici 5 minutes qui changent tout.</div>
    ${exs.map(ex=>`<div class="sport-ex-row"><div class="sport-ex-name-reps"><span class="sport-ex-name">${ex.nom||ex.name||''}</span></div>${ex.detail?`<div class="sport-ex-detail">${ex.detail}</div>`:''}</div>`).join('')}`;
  el.classList.add('open');
}

function validerSeanceExpress() {
  document.getElementById('express-modal')?.classList.remove('open');
  const today = new Date().toDateString();
  if (!ST.seanceDone) ST.seanceDone = {};
  ST.seanceDone[today] = 'express';
  ST.totalSeancesAll = (ST.totalSeancesAll || 0) + 0.5;
  ST.reportConsecutif = 0;
  ST.checkpointProgress = (ST.checkpointProgress || 0) + 0.5;
  _updateStreakPhase(0.5);
  saveState();
  renderCarteBouger(SAISONS[ST.currentSaison]);
  burstCelebration();
  showToast('⚡ 5 minutes accomplies — Alhamdulillah ! 🌸');
  setTimeout(showFeedbackPostSeance, 1000);
  if (ST.checkpointProgress >= 5) setTimeout(_triggerCheckpoint, 3500);
}

function validerReposActif() {
  const today = new Date().toDateString();
  if (!ST.seanceDone) ST.seanceDone = {};
  ST.seanceDone[today] = 'repos-actif';
  ST.checkpointProgress = (ST.checkpointProgress || 0) + 0.5;
  _updateStreakPhase(0.5);
  saveState();
  renderCarteBouger(SAISONS[ST.currentSaison]);
  showToast('🧘‍♀️ Repos actif accompli — ton corps te remercie 🌸');
}

function choisirReposComplet() {
  showToast('💤 Repos complet — ton corps construit pendant la récupération 🌸');
}

function _updateStreakPhase(count) {
  const phase = ST.currentSaison;
  if (ST.streakPhaseNom !== phase) { ST.streakPhaseNom = phase; ST.streakPhaseSeances = 0; }
  ST.streakPhaseSeances = (ST.streakPhaseSeances || 0) + count;
}

function _getStreakLabel() {
  const n = Math.floor(ST.streakPhaseSeances || 0);
  if (n === 0) return null;
  const emoji = { hiver:'❄️', printemps:'🌸', ete:'☀️', automne:'🍂' }[ST.streakPhaseNom] || '✨';
  const nom = { hiver:'Hiver', printemps:'Printemps', ete:'Été', automne:'Automne' }[ST.streakPhaseNom] || '';
  return `${n} séance${n > 1 ? 's' : ''} ce ${nom} ${emoji}`;
}

function showFeedbackPostSeance() {
  document.getElementById('feedback-seance-modal')?.classList.add('open');
}

function handleFeedbackSport(mood) {
  document.getElementById('feedback-seance-modal')?.classList.remove('open');
  const today = new Date().toDateString();
  if (!ST.feedbackSport) ST.feedbackSport = {};
  ST.feedbackSport[today] = mood;
  saveState();
  const dates = Object.keys(ST.feedbackSport)
    .map(d => ({ d, t: new Date(d).getTime() }))
    .filter(o => !isNaN(o.t))
    .sort((a, b) => a.t - b.t)
    .slice(-3)
    .map(o => o.d);
  const last3 = dates.map(d => ST.feedbackSport[d]);
  if (last3.length >= 3) {
    if (last3.every(f => f === 'fatiguee')) setTimeout(() => _showPropositionType('fatigue3'), 600);
    else if (last3.every(f => f === 'plus')) setTimeout(() => _showPropositionType('niveau_up'), 600);
  }
}

function checkPropositionsAmelioration() {
  const done = Object.keys(ST.seanceDone || {});
  const last5 = done
    .map(d => ({ d, t: new Date(d).getTime() }))
    .filter(o => !isNaN(o.t))
    .sort((a, b) => a.t - b.t)
    .slice(-5)
    .map(o => o.d);
  const last5AllDone = last5.length >= 5 && last5.every(d => ST.seanceDone[d] === true);
  if (last5AllDone && !ST._proposeNewEx5) {
    ST._proposeNewEx5 = true; saveState();
    setTimeout(() => _showPropositionType('reguliere5'), 2000);
  }
}

function _showPropositionType(type) {
  const el = document.getElementById('proposition-modal');
  if (!el) return;
  const body = el.querySelector('#proposition-body');
  const cfg = {
    reguliere5: { icon:'🌟', txt:'Tu es régulière depuis 5 séances — tu veux essayer un nouvel exercice ?' },
    fatigue3:   { icon:'💛', txt:'Tu sembles fatiguée depuis quelques jours — on passe en mode douceur cette semaine ?' },
    niveau_up:  { icon:'🔥', txt:'Tu te sens à l\'aise — tu veux passer au niveau supérieur ?' },
  };
  const c = cfg[type] || cfg.reguliere5;
  if (body) body.innerHTML = `<div style="font-size:36px;margin-bottom:12px;">${c.icon}</div><div style="font-size:14px;color:var(--gris);line-height:1.7;">${c.txt}</div>`;
  el.dataset.propType = type;
  el.classList.add('open');
}

function handleProposition(ans) {
  const el = document.getElementById('proposition-modal');
  if (el) { el.classList.remove('open'); }
  if (ans === 'oui') {
    const type = el?.dataset.propType;
    if (type === 'fatigue3') {
      const level = ST.seanceLevel || 1;
      if (level > 1) { ST.seanceLevel = level - 1; saveState(); renderCarteBouger(SAISONS[ST.currentSaison]); }
      showToast('💛 Mode douceur activé — prends soin de toi.');
    } else if (type === 'niveau_up') {
      const level = ST.seanceLevel || 1;
      if (level < 4) { ST.seanceLevel = level + 1; saveState(); renderCarteBouger(SAISONS[ST.currentSaison]); }
      showToast('🔥 Niveau monté — Alhamdulillah 💪');
    } else {
      showToast('🌟 Nouvelle séance en route pour toi !');
    }
  } else {
    showToast('🌸 Pas de problème — à ton rythme.');
  }
}

function checkSeanceSurprise() {
  if (ST.currentSaison !== 'ete') return;
  if (ST.seanceSurpriseShownCycle) return;
  const today = new Date().toDateString();
  if (ST.seanceDone && ST.seanceDone[today]) return;
  ST.seanceSurpriseShownCycle = true;
  saveState();
  setTimeout(() => document.getElementById('seance-surprise-modal')?.classList.add('open'), 1200);
}

function acceptSeanceSurprise() {
  document.getElementById('seance-surprise-modal')?.classList.remove('open');
  showToast('Prends soin de toi à chaque mouvement 🌸');
}

function refuseSeanceSurprise() {
  document.getElementById('seance-surprise-modal')?.classList.remove('open');
}

function _triggerCheckpoint() {
  ST.checkpointProgress = 0;
  if (!isFullAccess()) { saveState(); return; }
  saveState();
  document.getElementById('progression-modal')?.classList.add('open');
}

let _timerInterval = null;
let _currentExIdx = 0;
let _timerExercices = [];
let _repCount = 0;
let _currentSetNum = 0;

function _parseSetsFromEx(ex) {
  if (ex.sets && Number.isFinite(ex.sets) && ex.sets > 1) return ex.sets;
  const text = (ex.detail || '') + ' ' + (ex.name || ex.nom || '');
  const m = text.match(/\b([2-8])[×x]\b/i)
           || text.match(/\b([2-8])\s*s[ée]ries?\b/i)
           || text.match(/\b([2-8])\s*fois\b/i);
  if (m) { const n = parseInt(m[1]); if (n >= 2 && n <= 8) return n; }
  return 1;
}

function openTimer() {
  const spec = getTodaySeanceSpec();
  if (!spec || !spec.data) return;
  const el = document.getElementById('timer-modal');
  if (!el) return;
  _timerExercices = (spec.data.exercices || spec.data.circuit || []);
  if (!_timerExercices.length) return;
  _currentExIdx = 0;
  _currentSetNum = 0;
  el.classList.add('open');
  _renderCurrentEx();
}

function _renderCurrentEx() {
  const ex = _timerExercices[_currentExIdx];
  const total = _timerExercices.length;
  const body = document.getElementById('timer-body');
  if (!body) return;
  if (!ex) { _finishTimer(); return; }
  const nom = ex.nom || ex.name || '';
  const detail = ex.detail || '';
  const reps = ex.reps || null;
  const dureeNum = ex.duree ? parseInt(ex.duree) : null;
  const isSeconds = dureeNum && (String(ex.duree).includes('sec') || String(ex.duree).includes('s') || dureeNum <= 120);
  const totalSets = _parseSetsFromEx(ex);
  const setLabel = totalSets > 1
    ? `<div class="timer-set-label">Série ${_currentSetNum + 1} / ${totalSets}</div>`
    : '';
  let content = '';
  if (isSeconds && dureeNum) {
    content = `${setLabel}<div class="timer-ex-name">${nom}</div><div class="timer-ex-detail">${detail}</div>
      <div class="timer-circle"><svg viewBox="0 0 100 100" class="timer-svg"><circle cx="50" cy="50" r="44" fill="none" stroke="var(--sable)" stroke-width="8"/><circle cx="50" cy="50" r="44" fill="none" stroke="var(--season)" stroke-width="8" stroke-dasharray="276.5" stroke-dashoffset="0" id="timer-arc" stroke-linecap="round" transform="rotate(-90 50 50)"/></svg><div class="timer-count" id="timer-count">${dureeNum}</div></div>
      <button class="timer-start-btn" id="timer-start-btn" onclick="_startCountdown(${dureeNum})">▶ Démarrer</button>`;
  } else if (reps) {
    _repCount = 0;
    content = `${setLabel}<div class="timer-ex-name">${nom}</div><div class="timer-ex-detail">${detail}</div>
      <div class="timer-reps-target">Objectif : <strong>${reps} reps</strong></div>
      <div class="timer-rep-counter" id="timer-rep-counter">0</div>
      <div class="timer-tap-zone" onclick="tapRep()">Taper</div>
      <div class="timer-tap-hint">Tape à chaque répétition</div>`;
  } else {
    content = `${setLabel}<div class="timer-ex-name">${nom}</div><div class="timer-ex-detail">${detail || 'Fais de ton mieux 💪'}</div>`;
  }
  const hasMoreSets = totalSets > 1 && _currentSetNum < totalSets - 1;
  const nextLabel = hasMoreSets ? `Série suivante →` : `Exercice suivant →`;
  body.innerHTML = `<div class="timer-progress">${_currentExIdx + 1} / ${total}</div>${content}
    <div style="display:flex;gap:10px;margin-top:20px;">
      <button class="timer-next-btn" onclick="timerNextEx()">${nextLabel}</button>
      <button class="timer-skip-btn" onclick="timerSkipAll()">Passer</button>
    </div>`;
}

function tapRep() {
  _repCount++;
  const el = document.getElementById('timer-rep-counter');
  if (el) { el.textContent = _repCount; el.classList.remove('timer-rep-pulse'); void el.offsetWidth; el.classList.add('timer-rep-pulse'); }
  if (navigator.vibrate) navigator.vibrate(30);
}

function _startCountdown(secs) {
  const btn = document.getElementById('timer-start-btn');
  if (btn) btn.style.display = 'none';
  let remaining = secs;
  const arc = document.getElementById('timer-arc');
  const count = document.getElementById('timer-count');
  if (_timerInterval) clearInterval(_timerInterval);
  _timerInterval = setInterval(() => {
    remaining--;
    if (count) count.textContent = remaining;
    if (arc) arc.style.strokeDashoffset = 276.5 * (1 - remaining / secs);
    if (remaining <= 0) { clearInterval(_timerInterval); _timerInterval = null; if (navigator.vibrate) navigator.vibrate([100,50,100]); }
  }, 1000);
}

function timerNextEx() {
  if (_timerInterval) { clearInterval(_timerInterval); _timerInterval = null; }
  if (navigator.vibrate) navigator.vibrate(50);
  const ex = _timerExercices[_currentExIdx];
  const totalSets = ex ? _parseSetsFromEx(ex) : 1;
  if (_currentSetNum < totalSets - 1) {
    _currentSetNum++;
    _showRestTimer(20, `Repos — série ${_currentSetNum + 1} / ${totalSets}`);
  } else {
    _currentSetNum = 0;
    _currentExIdx++;
    if (_currentExIdx >= _timerExercices.length) { _finishTimer(); return; }
    _showRestTimer(30, 'Repos');
  }
}

function timerSkipAll() {
  if (_timerInterval) { clearInterval(_timerInterval); _timerInterval = null; }
  _currentSetNum = 0;
  _currentExIdx++;
  if (_currentExIdx >= _timerExercices.length) { _finishTimer(); return; }
  _renderCurrentEx();
}

function _showRestTimer(restSecs, label = 'Repos') {
  const body = document.getElementById('timer-body');
  if (!body) return;
  let r = restSecs;
  body.innerHTML = `<div class="timer-rest-label">${label}</div><div class="timer-rest-count" id="timer-rest-count">${r}s</div><button class="timer-skip-btn" style="display:block;margin:0 auto;" onclick="timerSkipRest()">Passer le repos →</button>`;
  if (_timerInterval) clearInterval(_timerInterval);
  _timerInterval = setInterval(() => {
    r--;
    const el = document.getElementById('timer-rest-count');
    if (el) el.textContent = r + 's';
    if (r <= 0) { clearInterval(_timerInterval); _timerInterval = null; if (navigator.vibrate) navigator.vibrate([50,30,50]); _renderCurrentEx(); }
  }, 1000);
}

function timerSkipRest() {
  if (_timerInterval) { clearInterval(_timerInterval); _timerInterval = null; }
  _renderCurrentEx();
}

function _finishTimer() {
  const today = new Date().toDateString();
  const donVal = ST.seanceDone && ST.seanceDone[today];
  if (donVal === true || donVal === 'express' || donVal === 'repos-actif') {
    closeTimerModal();
    return;
  }
  validerSeanceDash();
  closeTimerModal();
}

function closeTimerModal() {
  if (_timerInterval) { clearInterval(_timerInterval); _timerInterval = null; }
  document.getElementById('timer-modal')?.classList.remove('open');
}

function setSportInitLevel(level) {
  ST.seanceLevel = level;
  ST.sportLevelInit = true;
  saveState();
  renderHistoriqueSport();
}

function renderHistoriqueSport() {
  const el = document.getElementById('sport-historique-section');
  if (!el) return;

  if (!ST.sportLevelInit) {
    el.innerHTML = `
      <div class="sport-histo-title">💪 Parcours sport</div>
      <div class="sport-init-card">
        <div class="sport-init-q">Quel est ton niveau sportif actuel ?</div>
        <div class="sport-init-opts">
          <button class="sport-init-btn" onclick="setSportInitLevel(1)">
            <span class="sport-init-icon">🌱</span>
            <span class="sport-init-lbl">Essentielle</span>
            <span class="sport-init-sub">Je commence ou reprends</span>
          </button>
          <button class="sport-init-btn" onclick="setSportInitLevel(2)">
            <span class="sport-init-icon">🌿</span>
            <span class="sport-init-lbl">À ton rythme</span>
            <span class="sport-init-sub">Je m'entraîne régulièrement</span>
          </button>
          <button class="sport-init-btn" onclick="setSportInitLevel(3)">
            <span class="sport-init-icon">🔥</span>
            <span class="sport-init-lbl">Vitalité</span>
            <span class="sport-init-sub">À l'aise avec l'effort intense</span>
          </button>
          <button class="sport-init-btn" onclick="setSportInitLevel(4)">
            <span class="sport-init-icon">⚡</span>
            <span class="sport-init-lbl">Pleine puissance</span>
            <span class="sport-init-sub">Performance & dépassement</span>
          </button>
        </div>
      </div>`;
    return;
  }

  const done = ST.seanceDone || {};
  const totalFull = Object.keys(done).filter(d => done[d] === true).length;
  const totalExpress = Object.keys(done).filter(d => done[d] === 'express').length;
  const totalReported = Object.keys(done).filter(d => done[d] === 'reportee').length;
  const level = ST.seanceLevel || 1;
  const levelNames = ['Essentielle','À ton rythme','Vitalité','Pleine puissance'];
  const streak = _getStreakLabel();
  const prog = (ST.checkpointProgress || 0) % 5;
  const nextCpRaw = prog < 0.01 ? 5 : Math.ceil((5 - prog) * 2) / 2;
  const nextCpInt = Number.isInteger(nextCpRaw) ? nextCpRaw : nextCpRaw;
  const nextCpLabel = Number.isInteger(nextCpInt) ? `${nextCpInt} séance${nextCpInt > 1 ? 's' : ''}` : `encore ~${Math.ceil(nextCpRaw)} séance${Math.ceil(nextCpRaw) > 1 ? 's' : ''}`;
  el.innerHTML = `
    <div class="sport-histo-title">💪 Ton parcours sport</div>
    <div class="sport-histo-grid">
      <div class="sport-histo-stat"><div class="sport-histo-num">${totalFull}</div><div class="sport-histo-lbl">séances complètes</div></div>
      <div class="sport-histo-stat"><div class="sport-histo-num">Niv.${level}</div><div class="sport-histo-lbl">${levelNames[level-1]}</div></div>
      <div class="sport-histo-stat"><div class="sport-histo-num">${totalExpress}</div><div class="sport-histo-lbl">express (5 min)</div></div>
      <div class="sport-histo-stat"><div class="sport-histo-num">${totalReported}</div><div class="sport-histo-lbl">reportées</div></div>
    </div>
    ${streak ? `<div class="sport-histo-streak">${streak}</div>` : ''}
    <div class="sport-histo-next">Prochain checkpoint dans <strong>${nextCpLabel}</strong></div>`;
}

function showLevelMax() {
  const el = document.getElementById('level-max-modal');
  if (el) el.classList.add('open');
}
function closeLevelMaxModal() {
  const el = document.getElementById('level-max-modal');
  if (el) el.classList.remove('open');
}
function contactLevelMax() {
  window.location.href = 'mailto:sakina.evolution.contact@gmail.com?subject=Niveau%20Pleine%20puissance%20d%C3%A9bloqu%C3%A9&body=Alhamdulillah%20j\'ai%20atteint%20le%20niveau%20Pleine%20puissance%20!';
}

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

  // Trial lock (cycle)
  applyTrialLocks();
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
      seanceCount: snap.seanceCount,
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

function declarerPrintemps() {
  if (ST.currentSaison !== 'hiver') return;
  if (!ST.cycleStart) return;
  const today = new Date();
  const todayStr = today.getFullYear() + '-' + String(today.getMonth()+1).padStart(2,'0') + '-' + String(today.getDate()).padStart(2,'0');
  if (ST.hiverEnd === todayStr) { showToast('Printemps déjà déclaré aujourd\'hui ✓'); return; }
  if (todayStr === ST.cycleStart) { showToast('Les règles ne peuvent pas durer 0 jour.'); return; }
  ST.hiverEnd = todayStr;
  saveState();
  computeCycle();
  applySaisonTheme();
  populateAll();
  showPhaseToast('🌸', 'Printemps déclaré', 'L\'énergie revient 🌸');
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
  const phase = ST.currentSaison || 'hiver';
  const lecture = _getLectureForPhase(phase);
  const el = (id) => document.getElementById(id);

  // Carte Âme
  const cardAme = el('lecture-card');
  if (cardAme) cardAme.style.display = lecture ? '' : 'none';

  // Carte Accueil
  const cardAcc = el('lecture-card-accueil');
  if (cardAcc) cardAcc.style.display = lecture ? '' : 'none';

  if (!lecture) return;

  const sets = [
    ['lecture-phase-emoji', 'lecture-phase-emoji-acc'],
    ['lecture-phase-label', 'lecture-phase-label-acc'],
    ['lecture-duree', 'lecture-duree-acc'],
    ['lecture-titre', 'lecture-titre-acc'],
    ['lecture-accroche', 'lecture-accroche-acc'],
  ];
  const values = [
    _PHASE_EMOJIS[phase] || '',
    _PHASE_LABELS[phase] || phase.toUpperCase(),
    lecture.duree + ' min',
    lecture.titre,
    lecture.accroche,
  ];
  sets.forEach(([idAme, idAcc], i) => {
    if (el(idAme)) el(idAme).textContent = values[i];
    if (el(idAcc)) el(idAcc).textContent = values[i];
  });
}

function openLectureModal() {
  const phase = ST.currentSaison || 'hiver';
  const lecture = _getLectureForPhase(phase);
  if (!lecture) return;
  const el = (id) => document.getElementById(id);
  if (el('lm-emoji')) el('lm-emoji').textContent = _PHASE_EMOJIS[phase] || '';
  if (el('lm-phase')) el('lm-phase').textContent = _PHASE_LABELS[phase] || phase.toUpperCase();
  if (el('lm-duree')) el('lm-duree').textContent = lecture.duree + ' min';
  if (el('lm-titre')) el('lm-titre').textContent = lecture.titre;
  if (el('lm-accroche')) el('lm-accroche').textContent = lecture.accroche;
  if (el('lm-arabe')) el('lm-arabe').textContent = lecture.source.arabe;
  if (el('lm-fr')) el('lm-fr').textContent = '« ' + lecture.source.fr + ' »';
  if (el('lm-ref')) el('lm-ref').textContent = lecture.source.ref;
  if (el('lm-corps')) el('lm-corps').innerHTML = lecture.corps.replace(/\n\n/g, '</p><p style="margin-top:12px;">').replace(/^/, '<p>').replace(/$/, '</p>');
  if (el('lm-pensee')) el('lm-pensee').textContent = '« ' + lecture.aEmporter.pensee + ' »';
  if (el('lm-geste')) el('lm-geste').innerHTML = '🌿 ' + lecture.aEmporter.geste;
  if (el('lm-dua-arabe')) el('lm-dua-arabe').textContent = lecture.aEmporter.dua.arabe;
  if (el('lm-dua-fr')) el('lm-dua-fr').textContent = lecture.aEmporter.dua.fr;
  const modal = el('lecture-modal');
  if (modal) { modal.classList.add('open'); document.body.style.overflow = 'hidden'; }
}

function closeLectureModal() {
  const modal = document.getElementById('lecture-modal');
  if (modal) { modal.classList.remove('open'); document.body.style.overflow = ''; }
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

  const { seanceCount, seanceLevel, symptomDays, prayerDays, allPrayersDays, dhikrDays, coranDays, objCheckCount } = _bilanStats();
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
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:6px;margin-bottom:10px;">
      <div style="background:var(--creme);border-radius:12px;padding:10px 6px;text-align:center;">
        <div style="font-size:20px;font-weight:700;color:var(--noir);font-family:var(--serif);">${prayerDays}</div>
        <div style="font-size:8px;color:var(--gris);margin-top:2px;line-height:1.3;">jours<br>3+ prières</div>
      </div>
      <div style="background:var(--creme);border-radius:12px;padding:10px 6px;text-align:center;">
        <div style="font-size:20px;font-weight:700;color:var(--noir);font-family:var(--serif);">${seanceCount}</div>
        <div style="font-size:8px;color:var(--gris);margin-top:2px;line-height:1.3;">séances<br>sport</div>
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
  ['prayers','dhikrChecks','coranDone','seanceDone','symptomes','mouvDone','autreSymptomesText','feedbackSport'].forEach(key => {
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
  if (!isFullAccess()) {
    renderObjectifsBlurGate();
    return;
  }
  renderObjSummary();
  renderSuggestionsJour();
  renderCategoriesGrid();
  renderObjPerso();
  renderHistoriqueSport();
  renderCalendar();
}

function renderObjectifsBlurGate() {
  const container = document.getElementById('tab-objectifs');
  if (!container) return;

  container.innerHTML = `
    <div class="tab-topbar">
      <div class="tab-topbar-title">Mes Objectifs</div>
      <div class="tab-topbar-sub">Semaine &amp; cycle</div>
    </div>

    <!-- Contenu flouté en arrière-plan -->
    <div style="filter: blur(3px); opacity: 0.4; pointer-events: none;">
      <!-- RÉSUMÉ DU JOUR -->
      <div class="obj-summary-card" style="background: var(--creme); border: 1.5px solid var(--sable); border-radius: 20px; padding: 18px; margin: 0 14px 16px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="font-size: 28px;">🌱</div>
          <div>
            <div style="font-size: 15px; font-weight: 700; color: var(--noir); margin-bottom: 4px;">Commence ta journée ✦</div>
            <div style="font-size: 12px; color: var(--gris);">0 objectif accompli</div>
          </div>
        </div>
      </div>

      <!-- SECTION 1 : Pour toi aujourd'hui -->
      <div class="obj-card">
        <div class="obj-card-hdr">
          <span class="obj-card-hdr-icon">&#10022;</span>
          <span class="obj-card-hdr-title">POUR TOI AUJOURD'HUI</span>
        </div>
        <div style="padding: 0 16px 16px;">
          <div class="obj-item" style="margin-bottom: 8px;">
            <div class="obj-check"></div>
            <div class="obj-content">
              <div class="obj-label">🕌 Écouter le Coran</div>
              <div class="obj-phase-tag">🌿 Printemps</div>
            </div>
          </div>
          <div class="obj-item" style="margin-bottom: 8px;">
            <div class="obj-check"></div>
            <div class="obj-content">
              <div class="obj-label">💆 Faire un masque douceur</div>
              <div class="obj-phase-tag">🌿 Printemps</div>
            </div>
          </div>
          <div class="obj-item">
            <div class="obj-check"></div>
            <div class="obj-content">
              <div class="obj-label">🏠 Ranger 1 tiroir</div>
              <div class="obj-phase-tag">🌿 Printemps</div>
            </div>
          </div>
        </div>
      </div>

      <!-- SECTION 2 : Choisir mes objectifs -->
      <div class="obj-card">
        <div class="obj-card-hdr">
          <span class="obj-card-hdr-icon">&#9672;</span>
          <span class="obj-card-hdr-title">CHOISIR MES OBJECTIFS</span>
        </div>
        <div class="obj-cat-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; padding: 0 16px 16px;">
          <div class="obj-cat-item">
            <div class="obj-cat-icon">🕌</div>
            <div class="obj-cat-label">Spiritualité</div>
            <div class="obj-cat-count">5</div>
          </div>
          <div class="obj-cat-item">
            <div class="obj-cat-icon">🏠</div>
            <div class="obj-cat-label">Maison</div>
            <div class="obj-cat-count">4</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Overlay Premium avec CTA -->
    <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 100; background: white; border-radius: 24px; padding: 32px 24px; margin: 0 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.25); text-align: center; max-width: 320px; width: 100%;">
      <div style="font-size: 40px; margin-bottom: 16px;">✨</div>
      <div style="font-family: var(--serif); font-size: 20px; color: var(--noir); margin-bottom: 8px;">Objectifs Premium</div>
      <div style="font-size: 14px; color: var(--gris); line-height: 1.6; margin-bottom: 24px;">
        Suis tes objectifs selon ton cycle.<br>
        Créé tes propres objectifs personnalisés.
      </div>
      <button onclick="startStripeCheckout()" style="width: 100%; padding: 16px; background: linear-gradient(135deg, #C9A96E, #A87A30); color: #1C1008; border: none; border-radius: 16px; font-size: 15px; font-weight: 700; cursor: pointer; font-family: var(--sans);">
        🌱 Grandir avec mes objectifs
      </button>
      <div style="font-size: 12px; color: var(--gris); margin-top: 12px; font-style: italic;">Essai gratuit 20 jours</div>
    </div>

    <!-- Overlay background -->
    <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.4); z-index: 99;"></div>
  `;
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

  // Ajouter un bouton "+ Ajouter" si Premium
  if (isFullAccess()) {
    categoryItems.push(`
      <div class="obj-cat-item" onclick="openObjAddModal()" style="border: 2px dashed var(--sable); background: var(--creme);">
        <div class="obj-cat-icon" style="font-size: 24px;">+</div>
        <div class="obj-cat-label" style="font-size: 12px;">Ajouter</div>
        <div class="obj-cat-count"></div>
      </div>`);
  }

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

  // Si Premium perdu, masquer sans supprimer les objectifs perso
  if (!isFullAccess()) {
    const customs = ST.customObjectifs || [];
    if (customs.length > 0) {
      container.innerHTML = `
        <div style="padding: 16px; text-align: center; background: rgba(201, 169, 110, 0.1); border-radius: 14px; margin-bottom: 12px;">
          <div style="font-size: 24px; margin-bottom: 8px;">🔒</div>
          <div style="font-size: 13px; color: var(--gris); margin-bottom: 4px;">
            <strong>${customs.length} objectif${customs.length > 1 ? 's' : ''} personnel${customs.length > 1 ? 's' : ''}</strong> préservé${customs.length > 1 ? 's' : ''}
          </div>
          <div style="font-size: 11px; color: var(--gris); font-style: italic;">
            Redeviennent disponibles avec Premium
          </div>
        </div>
      `;
    } else {
      container.innerHTML = '<div class="obj-empty">Ajoute un objectif qui te ressemble ✨</div>';
    }
    applyTrialLocks();
    return;
  }

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

  applyTrialLocks();
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
    const seanceDone = !!(ST.seanceDone && ST.seanceDone[dateStr]);
    const prayers = ST.prayers && ST.prayers[dateStr] ? Object.values(ST.prayers[dateStr]).filter(Boolean).length : 0;
    const phaseClass = phase ? ` cal-day-${phase}` : '';
    cells += `
      <div class="cal-day${phaseClass}${isToday ? ' cal-today' : ''}" onclick="openDayModal('${dateStr}','${phase || ''}')">
        <span class="cal-day-num">${d}</span>
        <div class="cal-day-icons">
          ${seanceDone ? '<span class="cal-dot"></span>' : ''}
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
  const seanceDone = !!(ST.seanceDone && ST.seanceDone[dateStr]);
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
      <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:${seanceDone?'#E8F8F3':'var(--creme)'};border-radius:12px;">
        <span style="font-size:18px;">💪</span><span style="font-size:13px;color:var(--noir);">Séance — ${seanceDone?'Accomplie ✓':'Non faite'}</span>
      </div>
      <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:${prayers>=3?'#E8F8F3':'var(--creme)'};border-radius:12px;">
        <span style="font-size:18px;">🕌</span><span style="font-size:13px;color:var(--noir);">Prières — ${prayers}/5</span>
      </div>
      ${coranDone ? '<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:#E8F8F3;border-radius:12px;"><span style="font-size:18px;">📖</span><span style="font-size:13px;color:var(--noir);">Coran — Lu ✓</span></div>' : ''}
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
  ST.mouvDone = {};
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
  checkDailyObjReset(); // Remise à zéro des coches chaque matin
  // iOS PWA : localStorage isolé de Safari → lire le cookie pour retrouver l'auth
  if (!ST.isAuthenticated && _getCookie('sakina_auth') === '1') {
    ST.isAuthenticated = true;
    ST.userEmail = ST.userEmail || decodeURIComponent(_getCookie('sakina_email') || '');
    ST.authDate = ST.authDate || Date.now();
    saveState();
  }
  if (!ST.installDate) { ST.installDate = Date.now(); saveState(); } // ms, pas ISO

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
        await verifyPremiumFromDB(sb, session.user.id);
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

  checkPaymentSuccess();
  checkTrialEnd();
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
  renderCarteBouger(SAISONS[ST.currentSaison]);
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
// SPORT
// ═══════════════════════════════════════════════
function toggleMouv(idx, el) {
  const today = new Date().toDateString();
  if (!ST.mouvDone) ST.mouvDone = {};
  if (!ST.mouvDone[today]) ST.mouvDone[today] = [];
  const done = ST.mouvDone[today];
  const i = done.indexOf(idx);
  if (i > -1) done.splice(i, 1); else done.push(idx);
  saveState();
  const isDone = done.includes(idx);
  el.style.background = isDone ? 'var(--season-soft)' : 'white';
  el.style.borderColor = isDone ? 'var(--season)' : 'var(--sable)';
  const chk = el.querySelector('div');
  if (chk) { chk.style.background=isDone?'var(--season)':'transparent'; chk.style.borderColor=isDone?'var(--season)':'var(--sable)'; chk.textContent=isDone?'✓':''; }
  const total = document.getElementById('sport-mouvements')?.children.length || 0;
  updateMouvProgress(total);
}
function updateMouvProgress(total) {
  const today = new Date().toDateString();
  const done = (ST.mouvDone && ST.mouvDone[today]) ? ST.mouvDone[today].length : 0;
  const pct = total > 0 ? Math.round(done/total*100) : 0;
  const lbl = document.getElementById('mouv-progress-label');
  const pctEl = document.getElementById('mouv-progress-pct');
  const fill = document.getElementById('mouv-progress-fill');
  if (lbl) lbl.textContent = done + ' / ' + total + ' pratiqués';
  if (pctEl) pctEl.textContent = pct + '%';
  if (fill) fill.style.width = pct + '%';
}
function restoreSeanceDone() {
  const today = new Date().toDateString();
  if (ST.seanceDone && ST.seanceDone[today]) {
    // noop — renderCarteBouger gère déjà qs-btn-wrap / qs-done-wrap
  } else {
    const btn = document.getElementById('sport-validate-btn');
    const done = document.getElementById('sport-done-state');
    if (btn) btn.style.display = 'block';
    if (done) done.style.display = 'none';
  }
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

function getTodaySeanceSpec() {
  if (typeof SEANCES_SPORT === 'undefined') return null;
  const phase = ST.currentSaison;
  const day = ST.currentDay;
  const dur = effectiveCycleDur();
  const level = ST.seanceLevel || 1;
  const checkin = ST.checkin;
  const sport = SEANCES_SPORT;

  if (checkin === 'calme' && ST.calmeOverride !== new Date().toDateString()) return { type: 'calme', data: sport.calme };

  switch (phase) {
    case 'hiver': {
      const h = sport.hiver;
      const effectiveLevel = (checkin === 'fatiguee') ? Math.max(1, level - 1) : level;
      const hiverData = (h.niveaux ? h.niveaux[effectiveLevel] : null) || h;
      return { type: 'hiver', data: hiverData, level: effectiveLevel };
    }

    case 'printemps': {
      const dayIdx = dayWithinPhase(day, dur);
      const planning = sport.printemps.planning;
      const dayType = planning[dayIdx % planning.length];
      if (dayType === 'repos') {
        return { type: 'repos', reposSec: sport.printemps.niveauxRepos[level] || 45, level };
      }
      const niveauData = sport.printemps[dayType][level];
      if (!niveauData) return null;
      if (dayType === 'bas' && level === 4 && niveauData.rotation && niveauData.rotation.length) {
        const rotIdx = (ST.printempsBasCount || 0) % niveauData.rotation.length;
        const rot = niveauData.rotation[rotIdx];
        return { type: 'printemps-bas', data: { nom: rot.nom, duree: niveauData.duree, exercices: rot.exercices }, level, rotIdx };
      }
      return { type: 'printemps-' + dayType, data: niveauData, level };
    }

    case 'ete': {
      const dayIdx = dayWithinPhase(day, dur);
      const planning = sport.ete.planning;
      const dayType = planning[dayIdx % planning.length];
      if (dayType === 'repos') {
        return { type: 'ete-repos', message: sport.ete.messageApresIntense };
      }
      const niveauData = sport.ete.niveaux[level];
      if (!niveauData) return null;
      return { type: 'ete-intense', data: niveauData, level };
    }

    case 'automne': {
      const micro = getAutomneMicroPhase(day, dur);
      if (micro === 'actif') {
        const effectiveLevel = Math.min(level, 2); // ligaments relâchés par progestérone — cap N3/N4
        const dayIdx = dayWithinPhase(day, dur);
        const planning = sport.printemps.planning;
        const dayType = planning[dayIdx % planning.length];
        if (dayType === 'repos') {
          return { type: 'repos', reposSec: (sport.printemps.niveauxRepos[effectiveLevel] || 45) + sport.automne.actif.reposExtra, level: effectiveLevel, message: sport.automne.actif.message };
        }
        const niveauData = sport.printemps[dayType]?.[effectiveLevel];
        if (!niveauData) return null;
        return { type: 'automne-actif', data: niveauData, level: effectiveLevel, message: sport.automne.actif.message, reposExtra: sport.automne.actif.reposExtra };
      }
      if (micro === 'doux') return { type: 'automne-doux', data: sport.automne.doux, level };
      return { type: 'automne-fin', data: sport.automne.fin };
    }

    default:
      return null;
  }
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
function openEditCycle() {
  const _n=new Date(); const today=_n.getFullYear()+'-'+String(_n.getMonth()+1).padStart(2,'0')+'-'+String(_n.getDate()).padStart(2,'0');
  document.getElementById('edit-cycle-date').value=ST.cycleStart||today;
  document.getElementById('edit-cycle-date').max=today;
  editDuration=ST.cycleDuration||28;
  document.getElementById('edit-cycle-modal').classList.add('open');
}
function closeEditCycle() { document.getElementById('edit-cycle-modal').classList.remove('open'); }
function selectEditDuration(el, val) {
  document.querySelectorAll('#edit-duration-options .ob-option').forEach(o => { o.classList.remove('selected'); o.style.background='white'; o.style.borderColor='var(--sable)'; });
  el.classList.add('selected'); el.style.background='var(--season-soft)'; el.style.borderColor='var(--season)';
  editDuration=val;
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
  ST.cycleStart=dateVal; ST.cycleDuration=editDuration; saveState(); closeEditCycle();
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
// PREMIUM / WAITLIST
// ═══════════════════════════════════════════════
async function joinWaitlist() {
  const emailInput=document.getElementById('waitlist-email');
  const btn=document.querySelector('[onclick="joinWaitlist()"]');
  const msg=document.getElementById('waitlist-msg');
  const email=emailInput.value.trim();
  if (!email||!email.includes('@')) { msg.style.color='#C4694A'; msg.textContent='Entre une adresse email valide 🌸'; return; }
  btn.disabled=true; btn.textContent='…';
  try {
    const res=await fetch('https://formspree.io/f/xojpknkq',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({email,saison:ST.currentSaison,jour:ST.currentDay})});
    if (res.ok) { ST.waitlistEmail=email; saveState(); msg.style.color='#3DAE8A'; msg.textContent='Alhamdulillah — tu seras la première informée ! 🌸'; emailInput.value=''; emailInput.disabled=true; btn.textContent='✓'; }
    else throw new Error();
  } catch(e) { msg.style.color='#C4694A'; msg.textContent="Une erreur est survenue."; btn.disabled=false; btn.textContent='Rejoindre ✦'; }
}
function goToPremium() {
  switchTabById('moi');
  setTimeout(() => { const w=document.getElementById('waitlist-email'); if(w) w.scrollIntoView({behavior:'smooth',block:'center'}); }, 200);
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
function renderPatterns() {
  const card = document.getElementById('patterns-card');
  if (!card) return;
  if (!ST.cycleStart) { card.style.display = 'none'; return; }
  card.style.display = 'block';

  const history = ST.cycleHistory || [];
  const manualCycles = (ST.historiqueCycles || [])
    .filter(c => c.dateDebut && c.dateDebut !== ST.cycleStart)
    .map(c => ({ start: c.dateDebut, duration: Number(c.dureeCycle) || 28 }));
  const pastCycles = [...history, ...manualCycles];
  const allCycles = [{ start: ST.cycleStart, duration: ST.cycleDuration || 28 }, ...pastCycles];
  const durations = allCycles.map(c => Number(c.duration) || 28);
  const pastDurations = pastCycles.map(c => Number(c.duration) || 28);
  // Moyenne sur les cycles passés uniquement (pas le cycle actuel en cours)
  const avg = pastDurations.length > 0
    ? Math.round(pastDurations.reduce((a, b) => a + b, 0) / pastDurations.length)
    : ST.cycleDuration || 28;
  const minD = pastDurations.length > 0 ? Math.min(...pastDurations) : (ST.cycleDuration || 28);
  const maxD = pastDurations.length > 0 ? Math.max(...pastDurations) : (ST.cycleDuration || 28);
  const isRegular = pastDurations.length > 1 ? (maxD - minD) <= 3 : true;

  // Compter les symptômes sur toutes les dates
  const sympCount = {};
  const sympMeta = {};
  Object.values(SYMPTOMES_PAR_PHASE).flat().forEach(s => { sympMeta[s.id] = s; });
  Object.values(ST.symptomes || {}).forEach(arr => {
    arr.forEach(id => {
      if (id === 'autre') return;
      sympCount[id] = (sympCount[id] || 0) + 1;
    });
  });
  const topSymp = Object.entries(sympCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([id, cnt]) => ({ ...sympMeta[id], cnt }))
    .filter(s => s && s.emoji);

  const totalJoursSuivis = Object.keys(ST.symptomes || {}).length;

  // Section gratuite
  document.getElementById('patterns-free').innerHTML = `
    <div style="display:flex;gap:8px;margin-bottom:12px;">
      <div style="flex:1;background:var(--creme);border-radius:14px;padding:12px;text-align:center;">
        <div style="font-size:24px;font-weight:700;color:var(--noir);font-family:var(--serif);">${avg}</div>
        <div style="font-size:10px;color:var(--gris);margin-top:2px;">jours en moy.</div>
      </div>
      <div style="flex:1;background:var(--creme);border-radius:14px;padding:12px;text-align:center;">
        <div style="font-size:24px;font-weight:700;color:var(--noir);font-family:var(--serif);">${allCycles.length}</div>
        <div style="font-size:10px;color:var(--gris);margin-top:2px;">cycles suivis</div>
      </div>
      <div style="flex:1;background:var(--creme);border-radius:14px;padding:12px;text-align:center;">
        <div style="font-size:20px;">${isRegular ? '🌿' : '〰️'}</div>
        <div style="font-size:10px;color:var(--gris);margin-top:2px;">${isRegular ? 'Régulier' : 'Variable'}</div>
      </div>
    </div>
    ${minD !== maxD ? `<div style="font-size:11px;color:var(--gris);margin-bottom:14px;line-height:1.5;">Tes cycles varient entre <b style="color:var(--noir);">${minD}</b> et <b style="color:var(--noir);">${maxD}</b> jours — ${isRegular ? 'une belle régularité.' : 'des variations normales.'}</div>` : `<div style="font-size:11px;color:var(--gris);margin-bottom:14px;">Tes cycles sont très stables ✨</div>`}
  `;

  const premEl = document.getElementById('patterns-premium');
  if (isFullAccess()) {
    // Premium / trial : données réelles débloquées
    if (topSymp.length === 0) {
      premEl.innerHTML = `
        <div style="border-radius:14px;padding:14px 16px;background:var(--creme);margin-top:4px;">
          <div style="font-size:12px;color:var(--gris);line-height:1.6;">Note tes symptômes chaque jour depuis l'onglet Cycle — tes patterns apparaîtront ici au fil des semaines.</div>
        </div>`;
    } else {
      const daysUntilNext = Math.max(0, (ST.cycleDuration || 28) - (ST.currentDay - 1));
      premEl.innerHTML = `
        <div style="border-radius:14px;padding:14px 16px;background:var(--creme);margin-top:4px;">
          <div style="font-size:10px;font-weight:600;color:var(--gris);letter-spacing:1px;text-transform:uppercase;margin-bottom:10px;">Tes symptômes les plus fréquents</div>
          <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px;">
            ${topSymp.map(s => `<div style="background:white;border-radius:10px;padding:6px 12px;font-size:12px;display:flex;align-items:center;gap:6px;">${s.emoji} <span>${s.label}</span> <span style="color:var(--gris);">·</span> <b>${s.cnt}×</b></div>`).join('')}
          </div>
          <div style="font-size:11px;color:var(--gris);">🔮 Prochaines règles prévues dans <b style="color:var(--noir);">≈ ${daysUntilNext} jour${daysUntilNext > 1 ? 's' : ''}</b></div>
        </div>`;
    }
  } else {
    // Non premium : aperçu flouté
    const previewSymptoms = topSymp.length >= 2 ? topSymp : [
      { emoji: '😴', label: 'Fatigue', cnt: 8 },
      { emoji: '🌀', label: 'Crampes', cnt: 5 },
      { emoji: '🌸', label: 'Bonne humeur', cnt: 4 },
    ];
    premEl.innerHTML = `
      <div style="position:relative;border-radius:14px;overflow:hidden;margin-top:4px;">
        <div style="filter:blur(3px);pointer-events:none;user-select:none;padding:14px;background:var(--creme);">
          <div style="font-size:10px;font-weight:600;color:var(--gris);letter-spacing:1px;text-transform:uppercase;margin-bottom:10px;">Tes symptômes les plus fréquents</div>
          <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px;">
            ${previewSymptoms.map(s => `<div style="background:white;border-radius:10px;padding:6px 12px;font-size:12px;display:flex;align-items:center;gap:6px;">${s.emoji} <span>${s.label}</span> <span style="color:var(--gris);">·</span> <b>${s.cnt}×</b></div>`).join('')}
          </div>
          <div style="font-size:12px;color:var(--gris);">🔮 Prochaines règles prévues dans ≈ 8 jours</div>
        </div>
        <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(255,255,255,0.72);backdrop-filter:blur(1px);">
          <div style="font-size:28px;margin-bottom:8px;">✨</div>
          <div style="font-size:14px;font-weight:700;color:var(--noir);margin-bottom:4px;font-family:var(--serif);">Fonctionnalité Premium</div>
          <div style="font-size:12px;color:var(--gris);margin-bottom:14px;text-align:center;max-width:200px;line-height:1.5;">Patterns, prédictions et analyse<br>de tes cycles complets</div>
          <button onclick="showBilanModal()" style="background:var(--season-grad);color:white;border:none;border-radius:12px;padding:10px 22px;font-size:12px;font-weight:700;font-family:var(--sans);cursor:pointer;letter-spacing:.5px;">Débloquer Premium</button>
        </div>
      </div>`;
  }
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
        // Bloquer les champs de session et Premium — ne doivent jamais venir d'un fichier externe
        ['supabaseUserId','supabaseEmail','isPremium','premiumPlan','premiumSince',
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

// ═══════════════════════════════════════════════════════════════
// SEANCE TIMER COMPLET — machine à états guidée
// RAF-based, Web Audio, WakeLock, Page Visibility API
// ═══════════════════════════════════════════════════════════════
const _ST_C = 534.07; // Circonférence SVG : 2*PI*85

const _stx = {
  steps: [],
  idx: 0,
  total: 0,
  elapsed: 0,
  duration: 0,
  remaining: 0,
  running: false,
  paused: false,
  soundOn: true,
  rafId: null,
  lastTs: null,
  wakeLock: null,
  audioCtx: null,
  breathRaf: null,
  breathStart: null,
  _hiddenAt: null,
  _stSide: 0, // 0 = premier côté, 1 = deuxième côté pour exercices bilatéraux
  _sideChangeTimer: null,
};

const _stSciSeries = [
  'Chaque répétition forge ta force intérieure.',
  'Le muscle se construit dans l\'effort et le repos.',
  'Respire — l\'oxygène est ton carburant.',
  'Focus sur la sensation, pas sur le chiffre.',
];
const _stSciExercise = [
  'Le mouvement est médecine pour le corps.',
  'Chaque séance est un acte d\'amour envers toi.',
  'Le progrès est silencieux mais réel.',
  'La régularité bat l\'intensité à long terme.',
];

const _stPhaseMsg = {
  hiver:     'Écoute ton corps — chaque geste compte.',
  printemps: 'Ton énergie renaît — accueille-la.',
  ete:       'Tu es au pic — exprime ta puissance.',
  automne:   'La douceur est une force en Automne.',
};

function _stParseDur(str) {
  if (!str || str === '—' || str === '-' || str === 'aucun') return 0;
  if (typeof str === 'number') return str;
  const s = String(str).trim();
  const m = s.match(/^(\d+)\s*min/i);
  if (m) return parseInt(m[1]) * 60;
  const s2 = s.match(/^(\d+)\s*s/i);
  if (s2) return parseInt(s2[1]);
  const n = parseInt(s);
  return isNaN(n) ? 30 : n;
}

function _stGetRest(phase) {
  const map = { hiver: 60, printemps: 45, ete: 30, automne: 65 };
  return map[phase] || 45;
}

function _stFormatTime(secs) {
  const s = Math.max(0, Math.round(secs));
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return m > 0 ? m + ':' + String(ss).padStart(2, '0') : ss + 's';
}

function _stNormalizeEx(ex, idx) {
  if (!ex) return null;
  return {
    nom: ex.nom || ex.exercice || ex.name || ('Exercice ' + (idx + 1)),
    series: ex.series || ex.sets || 1,
    reps: ex.repetitions || ex.reps || null,
    duree: ex.duree || ex.duration || null,
    repos: ex.repos || ex.rest || null,
    desc: ex.description || ex.desc || ex.detail || '',
    conseil: ex.conseil_cycle || ex.conseil || '',
    mod_easy: ex.modification_facile || '',
    mod_hard: ex.modification_difficile || '',
    parJambe: ex.parJambe || false,
  };
}

// ── Web Audio ────────────────────────────────────────────────
function _stAudioCtx() {
  if (!_stx.audioCtx) {
    try { _stx.audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
  }
  return _stx.audioCtx;
}

function _stBeep(freq, dur, vol, type) {
  if (!_stx.soundOn) return;
  const ctx = _stAudioCtx();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol || 0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + dur);
  } catch(e) {}
}

function _stSoundStart()  { _stBeep(660, 0.15, 0.4, 'sine'); }
function _stSoundTick()   { _stBeep(880, 0.08, 0.2, 'square'); }
function _stSoundNext()   { _stBeep(523, 0.2, 0.35, 'sine'); setTimeout(function() { _stBeep(659, 0.2, 0.35, 'sine'); }, 120); }
function _stSoundDone()   {
  [523, 659, 784, 1047].forEach(function(f, i) { setTimeout(function() { _stBeep(f, 0.3, 0.4, 'sine'); }, i * 130); });
}
function _stSoundRest()   { _stBeep(392, 0.25, 0.3, 'triangle'); }

// ── WakeLock ─────────────────────────────────────────────────
async function _stAcquireWL() {
  try {
    if ('wakeLock' in navigator) {
      _stx.wakeLock = await navigator.wakeLock.request('screen');
    }
  } catch(e) {}
}
function _stReleaseWL() {
  if (_stx.wakeLock) { try { _stx.wakeLock.release(); } catch(e) {} _stx.wakeLock = null; }
}

// ── Page Visibility ──────────────────────────────────────────
document.addEventListener('visibilitychange', function() {
  if (!_stx.running || _stx.paused) return;
  if (document.visibilityState === 'hidden') {
    _stx._hiddenAt = performance.now();
    if (_stx.rafId) { cancelAnimationFrame(_stx.rafId); _stx.rafId = null; }
  } else {
    if (_stx._hiddenAt) {
      const elapsed = (performance.now() - _stx._hiddenAt) / 1000;
      _stx.remaining = Math.max(0, _stx.remaining - elapsed);
      _stx.elapsed = Math.min(_stx.total, _stx.elapsed + elapsed);
      _stx._hiddenAt = null;
    }
    _stx.lastTs = performance.now();
    _stx.rafId = requestAnimationFrame(_stxTick);
    _stAcquireWL();
  }
});

// ── Construire les étapes ─────────────────────────────────────
function _stxBuildSteps(spec, overrideRest) {
  const steps = [];
  const phase = (typeof ST !== 'undefined' && ST.currentSaison) || 'printemps';
  const restDur = (overrideRest != null) ? overrideRest : _stGetRest(phase);

  const warmup = (spec && spec.echauffement) ? spec.echauffement : null;
  if (warmup && warmup.length) {
    warmup.forEach(function(item, i) {
      steps.push({
        type: 'warmup',
        label: 'Échauffement',
        title: item.exercice || item.nom || ('Échauffement ' + (i + 1)),
        duration: _stParseDur(item.duree),
        desc: item.description || '',
        isLast: i === warmup.length - 1,
      });
    });
  } else {
    steps.push({ type: 'warmup', label: 'Échauffement', title: 'Mobilisation articulaire', duration: 120, desc: 'Cercles épaules, hanches, chevilles. Respire profondément.', isLast: true });
  }

  const exList = (spec && spec.exercices) ? spec.exercices : [];
  if (!exList.length) {
    steps.push({ type: 'exercise', label: 'Mouvement doux', title: 'Respiration & mobilité', duration: 300, desc: 'Respiration abdominale profonde, mobilité articulaire douce. Cercles d\'épaules, hanches, chevilles. Écoute ton corps.', series: 1, serieIdx: 0, seriesTotal: 1, exIdx: 0, exTotal: 1 });
  } else {
    exList.forEach(function(rawEx, exIdx) {
      const ex = _stNormalizeEx(rawEx, exIdx);
      if (!ex) return;
      const seriesCount = ex.series || 1;
      const exDur = ex.duree ? _stParseDur(ex.duree) : (ex.reps ? ex.reps * 3 : 40);
      const repoDur = ex.repos ? _stParseDur(ex.repos) : restDur;
      for (let s = 0; s < seriesCount; s++) {
        steps.push({
          type: 'exercise',
          label: 'Exercice',
          title: ex.nom,
          duration: exDur,
          desc: ex.desc,
          conseil: ex.conseil,
          mod_easy: ex.mod_easy,
          mod_hard: ex.mod_hard,
          reps: ex.reps,
          serieIdx: s,
          seriesTotal: seriesCount,
          exIdx: exIdx,
          exTotal: exList.length,
          parJambe: ex.parJambe,
        });
        if (s < seriesCount - 1 && repoDur > 0) {
          steps.push({ type: 'rest_series', label: 'Repos série', title: 'Repos — ' + ex.nom, duration: repoDur, serieIdx: s, seriesTotal: seriesCount });
        }
      }
      if (exIdx < exList.length - 1 && restDur > 0) {
        steps.push({ type: 'rest_exercise', label: 'Repos', title: 'Repos entre exercices', duration: restDur, exIdx: exIdx, exTotal: exList.length });
      }
    });
  }

  const cooldown = (spec && spec.retour_au_calme) ? spec.retour_au_calme : null;
  if (cooldown && cooldown.length) {
    cooldown.forEach(function(item, i) {
      steps.push({
        type: 'cooldown',
        label: 'Retour au calme',
        title: item.exercice || item.nom || ('Étirement ' + (i + 1)),
        duration: _stParseDur(item.duree),
        desc: item.description || '',
      });
    });
  } else {
    steps.push({ type: 'cooldown', label: 'Retour au calme', title: 'Étirements doux', duration: 180, desc: 'Étire les groupes musculaires sollicités. Respire, relâche.', isLast: true });
  }

  return steps;
}

// ── Normalisation EMOM/AMRAP → exercices guidés ──────────────
function _stxNormalizeEteIntense(niveauData) {
  const exercices = [];
  if (niveauData.type === 'emom') {
    const rounds = niveauData.duree || 10;
    const reps = niveauData.reps || 5;
    const exDurSec = reps * 3;
    const restSec = Math.max(10, 60 - exDurSec);
    for (let i = 0; i < rounds; i++) {
      exercices.push({
        nom: niveauData.exercice + ' — Round ' + (i + 1) + '/' + rounds,
        reps: reps,
        repos: restSec,
        parJambe: niveauData.parJambe || false,
        detail: 'Effectue ' + reps + ' répétitions' + (niveauData.parJambe ? ' par jambe' : '') + ', puis récupère jusqu\'à la prochaine minute.',
      });
    }
  } else if (niveauData.type === 'amrap') {
    const circuit = niveauData.circuit || [];
    const rounds = 8;
    for (let r = 0; r < rounds; r++) {
      circuit.forEach(function(ex) {
        exercices.push({
          nom: ex.nom + ' — Tour ' + (r + 1) + '/' + rounds,
          reps: ex.reps,
          repos: 5,
          parJambe: ex.parJambe || false,
          detail: ex.reps + ' rép' + (ex.parJambe ? ' par jambe' : '') + '. Enchaîne sans pause — compte tes tours complets.',
        });
      });
    }
  }
  return { exercices: exercices };
}

// ── Ouvrir le timer ──────────────────────────────────────────
function openSeanceTimer() {
  const spec = (typeof getTodaySeanceSpec === 'function') ? getTodaySeanceSpec() : null;
  const enriched = (spec && typeof getSeanceEnrichie === 'function')
    ? getSeanceEnrichie(spec.type, spec.level || 1)
    : null;
  let data = enriched || (spec && spec.data) || null;

  // automne-doux : mobilite[] → exercices[]
  if (spec && spec.type === 'automne-doux' && data && data.mobilite && !data.exercices) {
    data = Object.assign({}, data, { exercices: data.mobilite });
  }
  // ete-intense : EMOM/AMRAP → steps guidés
  if (spec && spec.type === 'ete-intense' && data && !data.exercices) {
    data = _stxNormalizeEteIntense(data);
  }

  let _stLevelRest = null;
  if (spec && typeof SEANCES_SPORT !== 'undefined') {
    const _nrMap = SEANCES_SPORT.printemps && SEANCES_SPORT.printemps.niveauxRepos;
    const _baseRest = _nrMap ? (_nrMap[spec.level || 1] || null) : null;
    if (_baseRest != null) {
      if (spec.type && spec.type.startsWith('printemps-')) _stLevelRest = _baseRest;
      else if (spec.type === 'automne-actif') _stLevelRest = _baseRest + (spec.reposExtra || 10);
    }
  }
  // Séances calmes/automne-doux : pas de repos entre exercices ni séries
  const _stCalmeRest = (spec && spec.type === 'automne-doux') ? 0 : _stLevelRest;
  _stx.steps = _stxBuildSteps(data, _stCalmeRest);
  _stx.idx = 0;
  _stx.elapsed = 0;
  _stx.total = _stx.steps.reduce(function(sum, s) { return sum + s.duration; }, 0);
  _stx.running = false;
  _stx.paused = false;
  _stx._stSide = 0;

  const overlay = document.getElementById('st-overlay');
  if (!overlay) return;
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';

  _stxUpdateHeader();
  _stxRender();
  _stxOverlay('st-pause-ov', false);
  _stxOverlay('st-stop-ov', false);
  _stxOverlay('st-mod-ov', false);
}

function _stxClose() {
  _stx.running = false;
  _stx.paused = false;
  if (_stx.rafId) { cancelAnimationFrame(_stx.rafId); _stx.rafId = null; }
  if (_stx.breathRaf) { cancelAnimationFrame(_stx.breathRaf); _stx.breathRaf = null; }
  if (_stx._sideChangeTimer) { clearTimeout(_stx._sideChangeTimer); _stx._sideChangeTimer = null; }
  _stx._stSide = 0;
  _stReleaseWL();
  const overlay = document.getElementById('st-overlay');
  if (overlay) overlay.classList.remove('open');
  document.body.style.overflow = '';
}

// ── Render étape courante ────────────────────────────────────
function _stxRender() {
  const step = _stx.steps[_stx.idx];
  if (!step) { _stxDone(); return; }
  _stx.duration = Math.max(1, step.duration);
  _stx.remaining = Math.max(1, step.duration);

  const label = document.getElementById('st-state-label');
  const title = document.getElementById('st-ex-title');
  const desc = document.getElementById('st-desc');
  const sci = document.getElementById('st-science');
  const count = document.getElementById('st-count');
  const countUnit = document.getElementById('st-count-unit');
  const breathWrap = document.getElementById('st-breath-wrap');
  const nextEl = document.getElementById('st-next');
  const modsEl = document.getElementById('st-mods');
  const doneWrap = document.getElementById('st-done-wrap');
  const body = document.getElementById('st-body');
  const actionBtn = document.getElementById('st-action-btn');
  const skipBtn = document.getElementById('st-skip-btn');

  if (doneWrap) doneWrap.classList.remove('visible');
  if (body) body.style.display = '';

  if (label) label.textContent = step.label;
  if (title) title.textContent = step.title;

  switch (step.type) {
    case 'warmup':         _stRenderWarmup(step, desc, sci, count, countUnit, breathWrap, modsEl); break;
    case 'exercise':       _stRenderExercise(step, desc, sci, count, countUnit, breathWrap, modsEl); break;
    case 'rest_series':    _stRenderRestSeries(step, desc, sci, count, countUnit, breathWrap, modsEl); break;
    case 'rest_exercise':  _stRenderRestExercise(step, desc, sci, count, countUnit, breathWrap, modsEl); break;
    case 'cooldown':       _stRenderCooldown(step, desc, sci, count, countUnit, breathWrap, modsEl); break;
  }

  const nextStep = _stx.steps[_stx.idx + 1];
  if (nextEl) {
    nextEl.textContent = nextStep ? ('Suivant : ' + nextStep.title) : 'Dernière étape';
    nextEl.style.display = '';
  }

  if (actionBtn) {
    if (_stx.running) {
      actionBtn.textContent = 'Pause';
      actionBtn.onclick = stTogglePause;
    } else {
      actionBtn.textContent = 'Démarrer';
      actionBtn.onclick = stAction;
    }
  }
  if (skipBtn) skipBtn.style.display = _stx.steps.length > 1 ? '' : 'none';

  _stxSetArc(1);
  const timeEl = document.getElementById('st-time-left');
  if (timeEl) timeEl.textContent = _stFormatTime(step.duration);
}

function _stRenderWarmup(step, desc, sci, count, countUnit, breathWrap, modsEl) {
  if (desc) desc.textContent = step.desc || 'Mobilise tes articulations doucement.';
  if (sci) { sci.textContent = 'L\'échauffement réduit les blessures de 50 %.'; sci.style.display = ''; }
  if (count) count.textContent = '';
  if (countUnit) countUnit.textContent = '';
  if (breathWrap) breathWrap.style.display = 'none';
  if (modsEl) modsEl.innerHTML = '';
}

function _stRenderExercise(step, desc, sci, count, countUnit, breathWrap, modsEl) {
  const sideLabel = step.parJambe && _stx._stSide === 1 ? ' — Côté droit' : (step.parJambe && _stx._stSide === 0 ? ' — Côté gauche' : '');
  const serieLabel = step.seriesTotal > 1 ? (' — Série ' + (step.serieIdx + 1) + '/' + step.seriesTotal) : '';
  if (desc) desc.textContent = (step.desc || '') + (step.conseil ? (' ' + step.conseil) : '');
  const sciMsg = _stSciExercise[step.exIdx % _stSciExercise.length];
  if (sci) { sci.textContent = sciMsg; sci.style.display = ''; }
  if (count) {
    if (step.reps) { count.textContent = step.reps; countUnit.textContent = 'rép.' + sideLabel + serieLabel; }
    else { count.textContent = ''; countUnit.textContent = (sideLabel + serieLabel).trim(); }
  }
  if (breathWrap) breathWrap.style.display = 'none';
  if (modsEl) {
    modsEl.innerHTML = '';
    if (step.mod_easy) {
      const b = document.createElement('button');
      b.className = 'st-mod-btn st-mod-easy';
      b.textContent = 'Plus facile';
      b.onclick = function() { stShowMod('easy', step.mod_easy); };
      modsEl.appendChild(b);
    }
    if (step.mod_hard) {
      const b = document.createElement('button');
      b.className = 'st-mod-btn st-mod-hard';
      b.textContent = 'Plus difficile';
      b.onclick = function() { stShowMod('hard', step.mod_hard); };
      modsEl.appendChild(b);
    }
  }
}

function _stRenderRestSeries(step, desc, sci, count, countUnit, breathWrap, modsEl) {
  if (desc) desc.textContent = 'Récupère avant la prochaine série. Respire profondément.';
  const sciMsg = _stSciSeries[step.serieIdx % _stSciSeries.length];
  if (sci) { sci.textContent = sciMsg; sci.style.display = ''; }
  if (count) { count.textContent = (step.seriesTotal - step.serieIdx - 1); countUnit.textContent = 'séries restantes'; }
  if (breathWrap) breathWrap.style.display = '';
  if (modsEl) modsEl.innerHTML = '';
  _stxStartBreath(4, 4, 6);
}

function _stRenderRestExercise(step, desc, sci, count, countUnit, breathWrap, modsEl) {
  if (desc) desc.textContent = 'Profite de cette pause. Hydrate-toi si besoin.';
  if (sci) { sci.textContent = 'Le repos est aussi important que l\'effort.'; sci.style.display = ''; }
  if (count) { count.textContent = (step.exTotal - step.exIdx - 1); countUnit.textContent = 'exercices restants'; }
  if (breathWrap) breathWrap.style.display = '';
  if (modsEl) modsEl.innerHTML = '';
  _stxStartBreath(4, 7, 8);
}

function _stRenderCooldown(step, desc, sci, count, countUnit, breathWrap, modsEl) {
  if (desc) desc.textContent = step.desc || 'Étire en douceur. Reste dans le confort.';
  if (sci) { sci.textContent = 'Les étirements améliorent la récupération musculaire.'; sci.style.display = ''; }
  if (count) { count.textContent = ''; countUnit.textContent = ''; }
  if (breathWrap) breathWrap.style.display = 'none';
  if (modsEl) modsEl.innerHTML = '';
}

// ── Timer RAF ────────────────────────────────────────────────
function _stxStartTimer() {
  if (_stx.rafId) cancelAnimationFrame(_stx.rafId);
  _stx.lastTs = performance.now();
  _stx.running = true;
  _stx.paused = false;
  _stAcquireWL();
  _stSoundStart();
  _stx.rafId = requestAnimationFrame(_stxTick);
  const actionBtn = document.getElementById('st-action-btn');
  if (actionBtn) { actionBtn.textContent = 'Pause'; actionBtn.onclick = stTogglePause; }
}

function _stxTick(ts) {
  if (!_stx.running || _stx.paused) return;
  const dt = (ts - _stx.lastTs) / 1000;
  _stx.lastTs = ts;
  _stx.remaining -= dt;
  _stx.elapsed = Math.min(_stx.total, _stx.elapsed + dt);

  const timeEl = document.getElementById('st-time-left');
  if (timeEl) timeEl.textContent = _stFormatTime(_stx.remaining);

  const progress = Math.max(0, Math.min(1, _stx.remaining / _stx.duration));
  _stxSetArc(progress);
  _stxUpdateHeader();

  if (_stx.remaining <= 3.05 && _stx.remaining > 2.95) _stSoundTick();
  if (_stx.remaining <= 2.05 && _stx.remaining > 1.95) _stSoundTick();
  if (_stx.remaining <= 1.05 && _stx.remaining > 0.95) _stSoundTick();

  if (_stx.remaining <= 0) { _stxTimerEnd(); return; }
  _stx.rafId = requestAnimationFrame(_stxTick);
}

function _stxTimerEnd() {
  _stx.running = false;
  _stx.rafId = null;
  _stxAdvance();
}

function _stxAdvance() {
  const currentStep = _stx.steps[_stx.idx];

  // Gestion des exercices bilatéraux
  if (currentStep && currentStep.type === 'exercise' && currentStep.parJambe && _stx._stSide === 0) {
    // Premier côté terminé d'un exercice bilatéral → message de changement
    _stx._stSide = 1;
    _stxShowSideChangeMessage();
    return;
  }

  // Reset du côté si on termine un exercice bilatéral deuxième côté ou n'importe quel autre exercice
  _stx._stSide = 0;

  _stx.idx++;
  if (_stx.idx >= _stx.steps.length) { _stxDone(); return; }
  const nextStep = _stx.steps[_stx.idx];
  if (nextStep.type === 'rest_series' || nextStep.type === 'rest_exercise') {
    _stSoundRest();
  } else {
    _stSoundNext();
  }
  _stxRender();
  _stxStartTimer();
}

function _stxShowSideChangeMessage() {
  // Afficher le message "Change de jambe 🔄"
  const titleEl = document.getElementById('st-exercise-title');
  const descEl = document.getElementById('st-exercise-desc');
  const timeEl = document.getElementById('st-time-left');
  const labelEl = document.getElementById('st-step-label');

  if (titleEl) titleEl.textContent = 'Change de jambe 🔄';
  if (descEl) descEl.textContent = 'Prépare-toi pour le deuxième côté';
  if (timeEl) timeEl.textContent = '3s';
  if (labelEl) labelEl.textContent = 'Transition';

  // Masquer la progression circulaire pendant la transition
  _stxSetArc(0);

  // Attendre 3 secondes puis continuer avec le même exercice
  _stx._sideChangeTimer = setTimeout(function() {
    _stx._sideChangeTimer = null;
    _stxRender();
    _stxStartTimer();
  }, 3000);
}

// ── Actions utilisatrice ─────────────────────────────────────
function stAction() {
  if (!_stx.running && !_stx.paused) {
    _stxStartTimer();
  } else if (_stx.running) {
    stTogglePause();
  }
}

function stSkip() {
  if (_stx.rafId) { cancelAnimationFrame(_stx.rafId); _stx.rafId = null; }
  _stx.running = false;
  _stxAdvance();
}

function stTogglePause() {
  if (_stx.paused) {
    _stx.paused = false;
    _stx.running = true;
    _stx.lastTs = performance.now();
    _stx.rafId = requestAnimationFrame(_stxTick);
    _stxOverlay('st-pause-ov', false);
    const actionBtn = document.getElementById('st-action-btn');
    if (actionBtn) { actionBtn.textContent = 'Pause'; actionBtn.onclick = stTogglePause; }
    _stAcquireWL();
  } else {
    _stx.paused = true;
    _stx.running = false;
    if (_stx.rafId) { cancelAnimationFrame(_stx.rafId); _stx.rafId = null; }
    _stxOverlay('st-pause-ov', true);
    const actionBtn = document.getElementById('st-action-btn');
    if (actionBtn) { actionBtn.textContent = 'Reprendre'; actionBtn.onclick = stTogglePause; }
    _stReleaseWL();
  }
}

function stAskStop() {
  if (_stx.running) {
    _stx.paused = true;
    _stx.running = false;
    if (_stx.rafId) { cancelAnimationFrame(_stx.rafId); _stx.rafId = null; }
  }
  _stxOverlay('st-pause-ov', false);
  _stxOverlay('st-stop-ov', true);
}

function stCancelStop() {
  _stxOverlay('st-stop-ov', false);
  if (_stx.paused) stTogglePause();
}

function stConfirmStop() {
  _stxOverlay('st-stop-ov', false);
  _stxClose();
}

function stToggleSound() {
  _stx.soundOn = !_stx.soundOn;
  const btn = document.getElementById('st-snd-btn');
  if (btn) btn.textContent = _stx.soundOn ? '' : '';
  if (_stx.soundOn) _stBeep(660, 0.1, 0.2, 'sine');
}

function stShowMod(type, text) {
  const modText = document.getElementById('st-mod-text');
  if (modText) modText.textContent = text;
  const modTitle = document.getElementById('st-mod-title');
  if (modTitle) modTitle.textContent = type === 'easy' ? 'Version plus facile' : 'Version plus difficile';
  _stxOverlay('st-mod-ov', true);
}

function stCloseMod() {
  _stxOverlay('st-mod-ov', false);
}

// ── Header progress ──────────────────────────────────────────
function _stxUpdateHeader() {
  const fill = document.getElementById('st-prog-fill');
  const text = document.getElementById('st-prog-text');
  const pct = _stx.total > 0 ? Math.round((_stx.elapsed / _stx.total) * 100) : 0;
  if (fill) fill.style.width = pct + '%';
  const remaining = Math.max(0, _stx.total - _stx.elapsed);
  if (text) text.textContent = _stFormatTime(remaining) + ' restant';
}

// ── SVG arc ──────────────────────────────────────────────────
function _stxSetArc(progress) {
  const arc = document.getElementById('st-arc');
  if (!arc) return;
  const offset = _ST_C * (1 - Math.max(0, Math.min(1, progress)));
  arc.style.strokeDashoffset = offset;
}

// ── Breath animation ─────────────────────────────────────────
function _stxStartBreath(inhale, hold, exhale) {
  if (_stx.breathRaf) { cancelAnimationFrame(_stx.breathRaf); _stx.breathRaf = null; }
  const ring = document.getElementById('st-breath-dot');
  if (!ring) return;
  const total = (inhale + hold + exhale) * 1000;
  _stx.breathStart = performance.now();
  const inMs = inhale * 1000;
  const holdMs = hold * 1000;
  const exMs = exhale * 1000;

  function tick(ts) {
    const elapsed = (ts - _stx.breathStart) % total;
    let scale;
    if (elapsed < inMs) {
      scale = 0.7 + 0.3 * (elapsed / inMs);
    } else if (elapsed < inMs + holdMs) {
      scale = 1.0;
    } else {
      const t = (elapsed - inMs - holdMs) / exMs;
      scale = 1.0 - 0.3 * t;
    }
    ring.style.transform = 'scale(' + scale.toFixed(3) + ')';
    _stx.breathRaf = requestAnimationFrame(tick);
  }
  _stx.breathRaf = requestAnimationFrame(tick);
}

// ── Done ─────────────────────────────────────────────────────
function _stxDone() {
  _stx.running = false;
  if (_stx.rafId) { cancelAnimationFrame(_stx.rafId); _stx.rafId = null; }
  if (_stx.breathRaf) { cancelAnimationFrame(_stx.breathRaf); _stx.breathRaf = null; }
  _stReleaseWL();
  _stSoundDone();

  const body = document.getElementById('st-body');
  const doneWrap = document.getElementById('st-done-wrap');
  if (body) body.style.display = 'none';
  if (doneWrap) {
    doneWrap.classList.add('visible');
    const stats = document.getElementById('st-done-stats');
    const totalMin = Math.round(_stx.total / 60);
    const phase = (typeof ST !== 'undefined' && ST.currentSaison) ? ST.currentSaison : 'printemps';
    const msg = _stPhaseMsg[phase] || 'Bravo pour cette séance !';
    if (stats) stats.innerHTML =
      '<div class="st-done-big">Séance terminée !</div>' +
      '<div class="st-done-detail">' + totalMin + ' min · ' + _stx.steps.length + ' étapes</div>' +
      '<div class="st-done-msg">' + msg + '</div>';
  }
  _stxSetArc(1);
  _stxConfetti();
}

function stFinish() {
  _stxClose();
  if (typeof validerSeanceDash === 'function') validerSeanceDash();
}

// ── Confetti ─────────────────────────────────────────────────
function _stxConfetti() {
  const container = document.getElementById('st-confetti');
  if (!container) return;
  container.innerHTML = '';
  const colors = ['#f6c90e', '#43b89c', '#e8a0bf', '#7c5cbf', '#f9844a', '#4cc9f0'];
  for (let i = 0; i < 40; i++) {
    const el = document.createElement('div');
    el.className = 'st-confetti-piece';
    el.style.cssText =
      'left:' + Math.random() * 100 + '%;' +
      'background:' + colors[i % colors.length] + ';' +
      'animation-delay:' + (Math.random() * 0.6).toFixed(2) + 's;' +
      'animation-duration:' + (0.8 + Math.random() * 0.6).toFixed(2) + 's;' +
      'width:' + (6 + Math.random() * 6) + 'px;' +
      'height:' + (6 + Math.random() * 6) + 'px;' +
      'border-radius:' + (Math.random() > 0.5 ? '50%' : '2px') + ';';
    container.appendChild(el);
  }
}

// ── Overlay helper ────────────────────────────────────────────
function _stxOverlay(id, show) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.toggle('visible', !!show);
}
