# Dette Technique — SakinApp
**Dernière mise à jour :** 2026-05-21
**Sources :** admin/cycle-calculations.md · admin/logic-validation-report.md · admin/bugs.md · admin/security-audit-report.md · admin/design-audit.md · admin/fiqh-audit.md · admin/copywriter-audit.md

---

## 🔴 SÉCURITÉ CRITIQUE

### SEC-C1 — XSS Stocké : notes de cycle et objectifs injectés sans échappement
**Fichier :** `app.js` l.4737, l.4734, l.3431–3439
**Impact :** Exécution de code arbitraire à chaque affichage de l'historique. Sur iOS PWA, exfiltration du JWT Supabase.
**Statut :** ✅ Corrigé le 2026-05-19 (commit 27bd4a4 — `_esc()` ajoutée, appliquée sur `c.note`, `c.intensite`, `customObjectifs`)

---

### SEC-C2 — `verify-session` sans liaison utilisatrice : activation Premium unauthenticated possible
**Fichier :** `api/verify-session.js` + `app.js` l.1244–1246
**Impact :** N'importe qui peut activer Premium sans payer avec un session_id Stripe connu.
**Statut :** ✅ Corrigé le 2026-05-19 (commit 27bd4a4 — JWT obligatoire + `session.metadata.user_id === user.id`)

---

## 🟠 SÉCURITÉ ÉLEVÉE

### SEC-E1 — CORS wildcard `*` sur les Edge Functions Supabase
**Fichiers :** `supabase/functions/notify-deletion/index.ts`, `supabase/functions/send-welcome-email/index.ts`
**Statut :** ✅ Corrigé le 2026-05-19 (commit 27bd4a4 — `'Access-Control-Allow-Origin': 'https://sakinaap.com'` sur les 3 fonctions)

---

### SEC-E2 — Pas de Content Security Policy (CSP)
**Fichier :** `vercel.json`
**Statut :** ✅ Corrigé le 2026-05-19 (commit 27bd4a4 — header CSP ajouté dans vercel.json)

---

### SEC-E3 — `redeem-code` : codes sans limitation d'usages
**Fichier :** `api/redeem-code.js`
**Statut :** ✅ Corrigé le 2026-05-19 (commit 8a20d32 — table `redeemed_codes` + vérification `usage.length >= MAX_USES`)

---

## 🟡 SÉCURITÉ MOYENNE

### SEC-M1 — `verifyPremiumFromDB` : `current_period_end` absent
**Fichier :** `app.js` l.588–596
**Statut :** ✅ Corrigé le 2026-05-19 (commit 27bd4a4 — `.select('status,plan,current_period_end')` + condition `canceled && current_period_end > now`)

---

### SEC-M2 — `create-checkout` : email depuis le client, non vérifié
**Fichier :** `api/create-checkout.js`
**Statut :** ✅ Corrigé le 2026-05-19 (commit 27bd4a4 — email lu depuis le JWT `userData.email`, non `req.query.email`)

---

### SEC-M3 — Absence de validation `Origin` sur les API Vercel
**Fichiers :** `api/redeem-code.js`, `api/create-checkout.js`, `api/verify-session.js`
**Statut :** ✅ Corrigé le 2026-05-19 (commit 8a20d32 — validation `req.headers['origin']` contre liste blanche)

---

## 🟢 SÉCURITÉ FAIBLE

### SEC-F1 — `sakina_email` dans cookie JavaScript-accessible
**Fichier :** `app.js` l.295–302 · Pas de `HttpOnly` possible depuis JS côté client
**Correction :** Stocker uniquement `sakina_auth=1` en cookie, supprimer `sakina_email` du cookie, récupérer l'email depuis `ST.supabaseEmail`.
**Effort :** ~1h · **Statut :** ❌ Non corrigé

### SEC-F2 — `shouldCreateUser: true` dans les deux flux OTP
**Fichier :** `app.js` l.381, 436 · Comportement probablement intentionnel
**Action :** Documenter le choix + s'assurer rate limiting OTP Supabase à 5/heure par IP en production.
**Effort :** ~10 min · **Statut :** ❌ Non documenté

### SEC-F3 — Pas de `.env.example`
**Statut :** ✅ Corrigé le 2026-05-19 (commit 8a20d32 — `.env.example` créé + `.env*` générique dans `.gitignore`)

### SEC-F4 — `public-config.js` sans restriction CORS
**Statut :** ✅ Corrigé le 2026-05-19 (commit 8a20d32 — CORS restreint à `sakinaap.com`)

### SEC-F5 — Headers sécurité non appliqués sur `/sw.js`
**Statut :** ✅ Corrigé le 2026-05-19 (commit 8a20d32 — headers de sécurité complets sur `/sw.js`)

---

## 🔴 BUGS LOGIQUE CRITIQUE

### BUG-01 — Tri alphabétique au lieu de chronologique (séances sport)
**Fonctions :** `checkPropositionsAmelioration()` · `handleFeedbackSport()`
**Statut :** ✅ Corrigé le 2026-05-19 (commit 84b7fa8 — `.map(d => ({d,t})).filter().sort((a,b)=>a.t-b.t).slice(-5)`)

---

### BUG-02 — Parsing UTC dans `restoreFeedback()`
**Fonction :** `restoreFeedback()` l.4497
**Statut :** ✅ Corrigé le 2026-05-19 (commit 84b7fa8 — `new Date(_fy, _fm-1, _fd)` heure locale)

---

### BUG-03 — `hiverEnd` caduc bloque tout le cycle en Hiver
**Fonction :** `phaseThresholds()` l.1183–1194
**Statut :** ✅ Corrigé le 2026-05-19 (commit 84b7fa8 — guard `hiverEndDiff > 0 && hiverEndDiff < dur` + commit f2cc279 — `springStartD = Math.max(2, Math.min(hiverEndDiff + 2, eteStartRaw - 1))`)

---

### BUG-04 — `getTrialDays()` peut retourner un négatif
**Fonction :** `getTrialDays()` l.1320
**Statut :** ✅ Corrigé le 2026-05-19 (commit 84b7fa8 — `if (days < 0) { ST.installDate = Date.now(); saveState(); return 0; }`)

---

### BUG-05 — Calendrier : phases incorrectes avant `cycleStart`
**Fonction :** `renderCalendar()` l.3629–3632
**Statut :** ✅ Corrigé le 2026-05-19 (commit 84b7fa8 — `if (diff < 0) { phase = null; }`)

---

### BUG-06 — `phaseForDay()` ignore `hiverEnd` utilisateur
**Fonction :** `phaseForDay()` l.4205
**Statut :** ✅ Corrigé le 2026-05-21 (commit f2cc279 — `phaseForDay` appelle `phaseThresholds(dur)` qui lit `ST.hiverEnd` avec guard)

---

### BUG-07 — `confirmDeleteMyData()` oublie `hiverEnd` et `_lastSaison`
**Fonction :** `confirmDeleteMyData()`
**Statut :** ✅ Corrigé le 2026-05-19 (commit 597b8ab — `localStorage.clear()` + `signOut` + `reload` — tout l'état est purgé et rechargé)

---

## 🟠 RISQUES LOGIQUE

### RISQUE-01 — 4 copies indépendantes des seuils de phase
**Fonctions :** `computeCycle()` · `renderCycle()` · `phaseForDay()` · `drawCycleRing()` · `checkEndOfPrintemps()`
**Correction :** Finaliser l'extraction de `phaseThresholds(dur)` comme source unique de vérité
**Effort :** ~2h · **Statut :** ❌ Non corrigé (phaseThresholds partiellement mutualisé, drawCycleRing/renderCycle à vérifier)

### RISQUE-02 — `objCheckCount` cumulatif depuis l'installation
**Fonction :** `_bilanStats()` — `_countObjChecks()`
**Statut :** ✅ Corrigé le 2026-05-21 (commit f2cc279 BUG-A — `_countObjChecks` filtre par `cycleStartDay <= objDay < cycleEndDay`)

### RISQUE-04 — `_proposeNewEx5` et `seanceSurpriseShownCycle` non réinitialisés
**Statut :** ✅ Corrigé le 2026-05-19 (commit 84b7fa8 — `ST._proposeNewEx5 = false; ST.seanceSurpriseShownCycle = false;` dans `computeCycle()` l.1239–1240)

---

## 🟡 RISQUES LOGIQUE UTILES

### RISQUE-03 — Snapshot des stats absent à l'archivage du cycle
**Correction :** Appeler `_bilanStats()` dans `startNewCycleToday()` avant l'archivage
**Effort :** ~1h · **Statut :** ❌ Non corrigé

### RISQUE-05 — `checkpointProgress` croît indéfiniment
**Statut :** ✅ Corrigé le 2026-05-19 (commit 84b7fa8 — `ST.checkpointProgress = 0` dans `_triggerCheckpoint()` avant le garde `isFullAccess`)

### RISQUE-06 — `dayOfYear` potentiellement négatif
**Statut :** ✅ Déjà corrigé (commit 84b7fa8) — `app.js` l.4256 : `Math.abs(Math.floor(...))` + `|| ASMA[0]` en place

### RISQUE-07 — `eteStartFinal` redondant dans `computeCycle()`
**Effort :** ~10 min · **Statut :** ❌ Non corrigé

### RISQUE-08 — `installDate` en timestamp ms vs dates ISO partout ailleurs
**Action :** Documenter explicitement ou convertir en ISO
**Effort :** ~15 min · **Statut :** ❌ Non documenté

---

## 🔵 FIQH — Vérification en attente

### FIQH-ROUGE3 — Phase "Hiver" : durée personnalisée des règles prise en compte ?
**Fichier :** `app.js` l.704 (`jours: [1,5]`) + l.3147
**Problème :** `SAISONS.hiver` hardcode `jours: [1,5]`. Si règles de 7 jours, la carte de prières peut réapparaître alors que l'utilisatrice est encore en haidh.
**Action requise :** Test manuel — déclarer un cycle avec hiverEnd au J7, vérifier que la carte reste masquée jusqu'au J7 et réapparaît au J8.
**Statut :** ❌ Non vérifié

---

## 🎨 DESIGN & UX — Non corrigé

### DESIGN-A5 — `:focus-visible` global absent
**Statut :** ✅ Corrigé le 2026-05-21 — `style.css` : `:focus-visible{outline:2px solid var(--season);outline-offset:2px;border-radius:4px;}` ajouté après le reset

### DESIGN-A7 — Loader couleur fixe indépendant de la phase
**Statut :** ✅ Corrigé le 2026-05-21 — `index.html` l.45/53/54 : `#4A7C59` → `#7B5EA7` (violet marque, cohérent avec tous les cycles)

### DESIGN-QA-RESIDUEL — "dernieres regles" sans accents dans la modale de cycle
**Statut :** ✅ Corrigé le 2026-05-21 — `index.html` l.1022 : "dernières règles"

---

## 🎨 DESIGN — Dette technique

### DETTE-D1 — Transition CSS sur les variables `--season` via `@property`
**Impact :** Nav, progress bars, badges sautent instantanément lors d'un changement de phase (seul le fond a une transition 1.2s).
**Correction :** `@property --season { syntax: '<color>'; ... }` + `transition: --season 0.8s ease` sur `:root`. Support : Chrome 85+, Safari 16.4+, Firefox 128+.
**Effort :** ~1h · **Statut :** ❌ Non corrigé

### DETTE-D2 — Dark mode incomplet : `background:white` en dur dans `app.js`/`index.html`
**Impact :** Certaines cards restent blanches en dark mode.
**Correction :** Auditer les `style.cssText` contenant `background:white` → `background:var(--creme)` ou `background:var(--surface, white)`.
**Effort :** ~2h · **Statut :** ❌ Non corrigé

### DETTE-D3 — Absence de loading states sur les appels Supabase/Stripe
**Impact :** Double-tap possible sur "Souscrire" pendant la latence réseau. Aucun bouton CTA désactivé pendant les appels async.
**Statut :** ✅ Corrigé le 2026-05-21 — `startStripeCheckout()` : `btn.disabled=true` + "Chargement…" via `document.activeElement` + `finally` restore · `checkPaymentSuccess()` : toast "Vérification du paiement… 🌙" · `initSupabase()` : lock `_supabaseLoading` pour éviter les appels concurrents

### DETTE-D4 — `--season-rgb` fallback codé en dur sur Printemps
**Statut :** ✅ Corrigé le 2026-05-21 — `SAISONS` : propriété `rgb` ajoutée aux 4 phases · `applySaisonTheme()` : `r.setProperty('--season-rgb', s.rgb)` · `style.css` `:root` : `--season-rgb:123,94,167` (Hiver par défaut, cohérent avec `--season`) · fallback `.obj-item.done` mis à jour en `123,94,167`

---

## ✍️ COPYWRITER — Priorité faible (🟡)

| # | Fichier | Localisation | Statut | Correction |
|---|---------|--------------|--------|------------|
| CW-1 | data.js | Bénéfice soupe haricots blancs-kale | ❌ | Simplifier : retirer répétition "végétal ×2" |
| CW-2 | data.js | Bénéfice Curry lentilles | ✅ 2026-05-21 (f677755) | "absorption renforcée" appliqué |
| CW-3 | landing.html | Section transformation | ❌ | "transformation" → registre compréhension de soi |
| CW-4 | landing.html | Témoignage Fatima | ❌ | Retirer badge phase (incohérent avec nifas) |
| CW-5 | app.js | Toast erreur import (~l.4753) | ❌ | Reformuler en douceur |
| CW-6 | index.html | CTA trial-lock-card | ❌ | "S'abonner à Premium" → "Rejoindre Premium 🌸" |
| CW-7 | data.js | SEANCES_SPORT hiver N4 messageSpirituel | ❌ | Emoji 🌿 → 🌙 (cohérence Hiver) |
| CW-8 | data.js | Dattes farcies fin de cycle | ❌ | "Choisis 2-3 dattes maximum" → "2-3 dattes suffisent" |
| CW-9 | app.js | `messageApresIntense` (~l.858) | ❌ | "progression" → "nourrit ton élan" |
| CW-10 | app.js | Toast marche rapide (~l.2602) | ❌ | "Fais 5 min de marche rapide — ça compte !" → doux |

---

## 💡 AMÉLIORATIONS ARCHITECTURE

### ARCHI-01 — Mutualisation complète de `phaseThresholds()`
Finaliser l'extraction — `phaseThresholds(dur)` est appelé dans computeCycle/phaseForDay/drawCycleRing, mais renderCycle/checkEndOfPrintemps à vérifier.

### ARCHI-02 — Clés `toDateString()` → ISO pour les séances
Les clés de `seancesDone` utilisent `toDateString()` (ex: "Mon May 06 2026"). Fragile si locale change.

### ARCHI-03 — `_bilanStats()` : fenêtre 30j → cycle courant
**Statut :** ✅ Corrigé (commit 84b7fa8 — bilanStats filtré par cycleStart + f2cc279 — _bilanStats(startStr, endStr) windowed)

---

## 📋 TABLEAU DE BORD

| ID | Catégorie | Sévérité | Statut |
|----|-----------|----------|--------|
| SEC-C1 | Sécurité | 🔴 Critique | ✅ Corrigé 2026-05-19 |
| SEC-C2 | Sécurité | 🔴 Critique | ✅ Corrigé 2026-05-19 |
| SEC-E1 | Sécurité | 🟠 Élevé | ✅ Corrigé 2026-05-19 |
| SEC-E2 | Sécurité | 🟠 Élevé | ✅ Corrigé 2026-05-19 |
| SEC-E3 | Sécurité | 🟠 Élevé | ✅ Corrigé 2026-05-19 |
| SEC-M1 | Sécurité | 🟡 Moyen | ✅ Corrigé 2026-05-19 |
| SEC-M2 | Sécurité | 🟡 Moyen | ✅ Corrigé 2026-05-19 |
| SEC-M3 | Sécurité | 🟡 Moyen | ✅ Corrigé 2026-05-19 |
| SEC-F1 | Sécurité | 🟢 Faible | ❌ Non corrigé |
| SEC-F2 | Sécurité | 🟢 Faible | ❌ Non documenté |
| SEC-F3 | Sécurité | 🟢 Faible | ✅ Corrigé 2026-05-19 |
| SEC-F4 | Sécurité | 🟢 Faible | ✅ Corrigé 2026-05-19 |
| SEC-F5 | Sécurité | 🟢 Faible | ✅ Corrigé 2026-05-19 |
| BUG-01 | Bug logique | 🔴 Critique | ✅ Corrigé 2026-05-19 |
| BUG-02 | Bug logique | 🔴 Critique | ✅ Corrigé 2026-05-19 |
| BUG-03 | Bug logique | 🔴 Critique | ✅ Corrigé 2026-05-19 + 21 |
| BUG-04 | Bug logique | 🔴 Critique | ✅ Corrigé 2026-05-19 |
| BUG-05 | Bug logique | 🔴 Critique | ✅ Corrigé 2026-05-19 |
| BUG-06 | Bug logique | 🟠 Important | ✅ Corrigé 2026-05-21 |
| BUG-07 | Bug logique | 🟠 Important | ✅ Corrigé 2026-05-19 |
| RISQUE-01 | Architecture | 🟠 Important | ❌ Non corrigé |
| RISQUE-02 | Logique | 🟠 Important | ✅ Corrigé 2026-05-21 |
| RISQUE-04 | Bug | 🟠 Important | ✅ Corrigé 2026-05-19 |
| RISQUE-03 | Fonctionnalité | 🟡 Utile | ❌ Non corrigé |
| RISQUE-05 | Logique | 🟡 Utile | ✅ Corrigé 2026-05-19 |
| RISQUE-06 | Bug | 🟢 Mineur | ✅ Corrigé (84b7fa8) |
| RISQUE-07 | Code | 🟢 Mineur | ❌ Non corrigé |
| RISQUE-08 | Architecture | 🟢 Mineur | ❌ Non documenté |
| ARCHI-03 | Architecture | 🟡 Utile | ✅ Corrigé |
| FIQH-ROUGE3 | Fiqh | 🔴 À vérifier | ❌ Non vérifié |
| DESIGN-A5 | Design/UX | 🟡 Moyen | ✅ Corrigé 2026-05-21 |
| DESIGN-A7 | Design/UX | 🟡 Moyen | ✅ Corrigé 2026-05-21 |
| DESIGN-QA | Typographie | 🟢 Mineur | ✅ Corrigé 2026-05-21 |
| DETTE-D1 | Design/Dette | 🟡 Amélioration | ❌ Non corrigé |
| DETTE-D2 | Design/Dette | 🟡 Amélioration | ❌ Non corrigé |
| DETTE-D3 | Design/Dette | 🟠 Important | ✅ Corrigé 2026-05-21 |
| DETTE-D4 | Design/Dette | 🟡 Amélioration | ✅ Corrigé 2026-05-21 |
| CW-2 | Copywriter | 🟢 Faible | ✅ Corrigé 2026-05-21 |
| CW-1,3–10 | Copywriter | 🟢 Faible | ❌ Non corrigé |

---

## 🎯 Backlog restant — à corriger

**Priorité immédiate**
- SEC-F1 : cookie `sakina_email` → stocker uniquement `sakina_auth=1` (~1h)
- FIQH-ROUGE3 : test manuel masquage carte prières (~30 min)

**Sprint Design (~4h)**
- DETTE-D1 : `@property` CSS transitions `--season`
- DETTE-D2 : dark mode `background:white` audit

**Sprint Architecture (~3h)**
- RISQUE-01 : finaliser mutualisation `phaseThresholds()`
- RISQUE-03 : snapshot stats dans `cycleHistory`
- ARCHI-01/ARCHI-02 : nettoyages

**Sprint Mineur (~1h)**
- RISQUE-06 : `dayOfYear` guard + fallback
- RISQUE-07 : supprimer `eteStartFinal`
- SEC-F2 : documenter `shouldCreateUser`

**Sprint Copywriter (~1h)**
- CW-1, CW-3 à CW-10 (9 corrections 🟢)
