# Rapport d'audit — Calculs JavaScript SakinApp
*Date : 2026-05-19 — Fichiers analysés : `app.js` (5 582 lignes), `sport-progression-logic.js` (165 lignes), `sport-additions.js` (585 lignes)*

---

## 1. FONCTION `computeCycle()` (remplace computePhase)

### ✅ Correct et robuste

**Calcul du jour courant** (`app.js` lignes 1139–1143)
```js
const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());
const startLocal = new Date(sy, sm - 1, sd);
const diff = Math.floor((todayLocal - startLocal) / (1000 * 60 * 60 * 24));
```
- Utilise des dates "midnight local" des deux côtés — élimine les bugs DST.
- Utilise `1000 * 60 * 60 * 24` explicite (pas `86400000` brut) : correct.

**Protection contre cycleStart futur** (ligne 1144)
```js
if (diff < 0) { ST.currentDay = 1; ST.currentSaison = 'hiver'; return; }
```
- Correctement géré.

**Validation du format** (ligne 1136)
```js
if (!ST.cycleStart || !/^\d{4}-\d{2}-\d{2}$/.test(ST.cycleStart)) {
  ST.cycleStart = null; ST.currentDay = 1; ST.currentSaison = 'hiver'; return;
}
```
- Correctement géré.

**Les 4 phases sont toujours retournées** (lignes 1183–1186) — la branche `else` garantit que `currentSaison` vaut toujours l'une des 4 valeurs attendues.

**Cycles courts (< 24j) et longs (> 35j)** — `effectiveCycleDur()` contraint la durée dans `[20, 60]`, donc aucun cas extrême ne peut produire des durées de phases nulles ou négatives.

---

### ⚠️ Cas limites non gérés

**Bug 1 — `phaseThresholds()` : springStartD peut dépasser eteStartD** (`app.js` lignes 1119–1132)

```js
const hiverDays  = Math.floor(dur * 0.20);
const springDays = Math.floor(dur * 0.30);
const eteDays    = Math.floor(dur * 0.15);
let springStartD = hiverDays + 1;
// ...
const eteStartD = hiverDays + springDays + 1;
```

Si `ST.hiverEnd` est renseigné très tard (ex. `hiverEndDiff = 17` avec `dur = 20`), alors :
- `springStartD = max(2, 17+1) = 18`
- `eteStartD = Math.floor(20*0.20) + Math.floor(20*0.30) + 1 = 4 + 6 + 1 = 11`
- **`springStartD (18) > eteStartD (11)`** → la phase Printemps est impossible à atteindre, le cycle passe directement d'Hiver à Été.

Aucune vérification n'existe pour garantir `springStartD < eteStartD`.

**Code corrigé proposé :**
```js
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
    // CORRECTION : springStartD ne peut jamais dépasser eteStartD - 1
    if (hiverEndDiff > 0 && hiverEndDiff < dur) {
      springStartD = Math.max(2, Math.min(hiverEndDiff + 1, eteStartRaw - 1));
    }
  }
  const eteStartD = hiverDays + springDays + 1;
  const eteEndD   = hiverDays + springDays + eteDays;
  return { springStartD, eteStartD, eteEndD };
}
```

**Bug 2 — `phaseThresholds()` : eteEndD peut égaler dur** (lignes 1130–1131)

Avec `dur = 28` : `hiverDays=5`, `springDays=8`, `eteDays=4` → `eteEndD = 5+8+4 = 17` → automne = jours 18 à 28 (correct).
Avec `dur = 20` : `hiverDays=4`, `springDays=6`, `eteDays=3` → `eteEndD = 4+6+3 = 13` → automne = jours 14 à 20 (correct).
Avec `dur = 60` : `hiverDays=12`, `springDays=18`, `eteDays=9` → `eteEndD = 12+18+9 = 39` → automne = jours 40 à 60 (correct).

Pas de problème de limite ici — mais il faut noter que **eteEndD peut être inférieur à eteStartD** si la durée est extrêmement courte. Ex. `dur = 20` : `eteStartD = 11`, `eteEndD = 13` → Été ne dure que 3 jours. C'est fonctionnel mais peut surprendre.

---

## 2. CALCULS DE PROGRESSION SPORT

### ✅ Correct

**Niveaux bornés dans [1, 4]** — chaque endroit qui modifie `ST.seanceLevel` le protège :
```js
if (ans === 'facile' && level < 4) { ST.seanceLevel = level + 1; }
if (ans === 'dur_trop' && level > 1) { ST.seanceLevel = level - 1; }
```
Aucun risque de sortir de la plage.

**`checkpointProgress`** — s'incrémente de `+1` (séance complète), `+0.5` (express ou repos actif) et se remet à `0` au checkpoint. Logique cohérente.

**`_updateStreakPhase()`** — réinitialise correctement le compteur lors d'un changement de phase.

---

### ❌ Bugs confirmés

**Bug 3 — `niveauStreak` / `_lastNiveauStreak` absents de ST** (`sport-progression-logic.js` lignes 79–122)

`checkNiveauProgression()` lit `ST.niveauStreak` et `updateNiveauStreak()` écrit dans `ST.niveauStreak` et `ST._lastNiveauStreak`, mais **ces deux champs ne sont pas déclarés dans l'objet ST initial** (`app.js` lignes 3–72).

Conséquences :
1. `ST.niveauStreak` sera `undefined` au premier accès → `undefined || 0 = 0` (silencieux mais ne persistera pas correctement).
2. Après `saveState()` + `loadState()`, ces champs sont absents du spread `{...ST, ...parsed}` → **la progression de niveau est perdue à chaque rechargement**.
3. `checkNiveauProgression()` ne déclenchera jamais le modal de progression, car `streak` reste à `0` après reload.

**Code corrigé — ajouter dans ST :**
```js
niveauStreak: 0,
_lastNiveauStreak: null,
```

**Bug 4 — `checkpointProgress >= 5` ne se remet jamais à zéro si l'utilisatrice n'est pas Premium** (`app.js` lignes 2383, 2525, 2650–2654)

```js
function _triggerCheckpoint() {
  if (!isFullAccess()) return;  // ← sort sans remettre à 0
  ST.checkpointProgress = 0;
  // ...
}
```

Si `!isFullAccess()` (essai expiré, non premium), `checkpointProgress` reste à 5 ou plus. À chaque nouvelle séance, `_triggerCheckpoint` est rappelé mais continue de sortir sans reset. Le compteur peut atteindre des valeurs arbitrairement grandes.

L'affichage dans `renderHistoriqueSport()` utilise `(ST.checkpointProgress || 0) % 5` pour le rendu, ce qui masque le problème visuellement, mais le `nextCp` sera calculé incorrectement pour des valeurs > 5 non multiples de 5.

Exemple : `checkpointProgress = 7` → `prog = 7 % 5 = 2` → `nextCp = ceil((5-2)*2)/2 = 3`. Mais la vraie valeur non réinitialisée fausse le calcul attendu.

**Code corrigé :**
```js
function _triggerCheckpoint() {
  ST.checkpointProgress = 0;  // Toujours remettre à zéro
  saveState();
  if (!isFullAccess()) return;  // Afficher le modal seulement en accès complet
  document.getElementById('progression-modal')?.classList.add('open');
}
```

---

### ⚠️ Cas limites non gérés

**Bug 5 — `checkSeanceProgression()` est vide** (`app.js` lignes 2288–2290)

```js
function checkSeanceProgression() {
  // Remplacé par checkpointProgress dans validerSeanceDash — gardé pour compatibilité
}
```

La fonction est un stub vide. Si du code externe l'appelle en attendant un comportement, il n'obtiendra rien. Ce n'est pas un bug en soi, mais le commentaire "gardé pour compatibilité" suggère qu'elle pourrait encore être appelée depuis d'autres endroits non détectés.

**Bug 6 — Progression de phase changement de niveau : `niveauStreak` ne se remet pas à zéro au changement de phase**

`updateNiveauStreak()` réinitialise sur changement de `seanceLevel`, mais pas sur changement de phase (`currentSaison`). Ainsi une utilisatrice qui accumule 8 séances en Printemps au niveau 2 et passe en Été verra `niveauStreak = 8` — la condition `streak >= 6` (Été) serait immédiatement remplie dès la première séance en Été.

**Code corrigé :**
```js
function updateNiveauStreak(validated) {
  if (!validated) { ST.niveauStreak = 0; return; }
  // Réinitialise si changement de niveau OU de phase
  if (ST._lastNiveauStreak !== ST.seanceLevel || ST._lastNiveauPhase !== ST.currentSaison) {
    ST.niveauStreak = 0;
    ST._lastNiveauStreak = ST.seanceLevel;
    ST._lastNiveauPhase = ST.currentSaison;
  }
  ST.niveauStreak = (ST.niveauStreak || 0) + 1;
}
```
Ajouter `_lastNiveauPhase: null` dans ST.

---

## 3. CALCUL DU BILAN (`_bilanStats()`)

### ✅ Correct

**Filtre inCycle** (lignes 1337–1349) — compare des entiers `YYYYMMDD` au lieu de comparer des objets Date. C'est un choix efficace et correct.

**Protection contre `NaN`** — `if (isNaN(d)) return false;` présent.

**Comptage prières** — threshold à 3 prières sur 5 pour `prayerDays`, 5/5 pour `allPrayersDays`. Logique correcte.

**Comptage dhikr** — seuil à 3 sur les 4 types (subhan, alhamdu, akbar, istighfar). Logique correcte.

**Comptage séances** — `inCycle` filtre toutes les clés `seanceDone` >= cycleStart, incluant séances 'express' et 'reportee'. Les séances reportées sont donc comptées dans le bilan comme des jours, ce qui peut être contestable mais est cohérent avec la définition de `seanceDone`.

---

### ⚠️ Cas limites non gérés

**Bug 7 — `objCheckCount` non filtré par cycle** (lignes 1368–1374)

```js
Object.values(ST.weeklyObjChecks || {}).forEach(week => {
  Object.values(week).forEach(arr => { objCheckCount += (arr||[]).length; });
});
```

`weeklyObjChecks` est un dictionnaire `{ weekKey: { objId: [dateStr, ...] } }`. Les semaines sont élaguées après 28 jours (`checkWeeklyReset()`), mais **aucun filtre par `cycleStart` n'est appliqué ici**. Si un cycle dure 28 jours et que des données de la semaine précédant le cycle existent encore (fenêtre de 28 jours), elles seront comptées dans le bilan du cycle courant.

**Code corrigé :**
```js
const cycleStartDate = ST.cycleStart ? new Date(ST.cycleStart) : null;
Object.values(ST.weeklyObjChecks || {}).forEach(week => {
  Object.values(week).forEach(arr => {
    (arr || []).forEach(dateStr => {
      if (!cycleStartDate || new Date(dateStr) >= cycleStartDate) objCheckCount++;
    });
  });
});
// Même correction pour customObjChecks
```

**Bug 8 — `joursSuivis` dans `showBilanModal()` : fallback potentiellement erroné** (ligne 1385)

```js
const joursSuivis = Math.min(ST.currentDay || getTrialDays() || 20, ST.cycleDuration || 28);
```

Si `ST.currentDay` est `null` (cycleStart null) et `getTrialDays()` retourne `0` (installDate manquant), on tombe sur `20` en dur. Ce cas survient au 1er lancement si le bilan est affiché avant la configuration du cycle. Le `|| 20` est un fallback arbitraire — il vaudrait mieux afficher `0` ou `1`.

**Code corrigé :**
```js
const joursSuivis = ST.cycleStart
  ? Math.min(ST.currentDay || 1, ST.cycleDuration || 28)
  : Math.min(getTrialDays() || 0, 20);
```

**Bug 9 — Premier cycle : `avgRegles` avec un seul cycle dans `showBilanModal()`** (ligne 1436)

```js
const avgRegles = Math.round(histCycles.map(c => Number(c.dureeRegles) || 5).reduce((a, b) => a + b, 0) / histCycles.length);
```

Si `histCycles.length === 0` (bloqué par `if (!histCycles.length) return ''` ligne 1433 — correct). Pas de risque de division par zéro ici, la garde est bien en place.

---

## 4. CALCULS CACHÉS

### ✅ Corrects

**`getTrialDays()`** (lignes 1250–1255) — protégé contre `days < 0` (horloge système modifiée). Correct.

**`showNomDuJour()`** (ligne 4111) :
```js
const dayOfYear = Math.abs(Math.floor((new Date() - new Date(2024, 0, 1)) / 86400000));
```
`Math.abs` protège contre les dates antérieures à 2024-01-01. Le `% 99` garantit un index valide. Correct.

**`renderCalendar()` — calcul du dayOfCycle** (lignes 3516–3517) :
```js
const diff = Math.floor((date - startLocal) / 86400000);
const dayOfCycle = ((diff % dur) + dur) % dur;
```
Le double modulo `((x % n) + n) % n` protège correctement contre les valeurs négatives (dates avant cycleStart). Correct.

**`effectiveCycleDur()`** (lignes 1110–1117) — retour contraint dans `[20, 60]`. Correct.

**`pct` dans `renderCycleHistory()`** (ligne 4431) :
```js
const pct = d => ((d - rMin) / span * 100).toFixed(1);
```
**Risque de division par zéro** si `span = rMax - rMin = 0` (tous les cycles ont la même durée ET `minD = maxD`). Dans ce cas `rMin = max(17, minD-4)` et `rMax = min(45, maxD+4)` → `rMin ≠ rMax` (car on ajoute/soustrait 4). Donc `span ≥ 8`. Pas de risque de division par zéro. Correct.

---

### ⚠️ Cas limites non gérés

**Bug 10 — `dayWithinPhase()` retourne une valeur négative si `cycleDay = 0`** (lignes 3976–3983)

```js
function dayWithinPhase(cycleDay, cycleDur) {
  // ...
  if (cycleDay < springStartD) return cycleDay - 1;  // si cycleDay=0 → retourne -1
```

`ST.currentDay` est toujours `>= 1` grâce à la ligne 1178 :
```js
ST.currentDay = Math.max(1, Math.min(day, dur));
```
Mais `dayWithinPhase` est appelable avec n'importe quelle valeur — si un appelant externe passe `0`, l'index sera `-1`, causant potentiellement un accès `planning[-1]` (retourne `undefined` en JS), suivi d'un accès à `sport.printemps[undefined][level]` → erreur silencieuse ou crash.

Ce n'est pas un bug actif mais une fragilité. Ajouter un guard :
```js
function dayWithinPhase(cycleDay, cycleDur) {
  const day = Math.max(1, cycleDay);  // guard
  // ...
}
```

**Bug 11 — `getAutomneMicroPhase()` : `autDay` peut être 0 ou négatif** (lignes 3985–3992)

```js
const autDay = cycleDay - eteEndD;
if (autDay <= Math.floor(autLen * 0.35)) return 'actif';
```

Si `cycleDay <= eteEndD`, `autDay <= 0`. La condition `autDay <= floor(autLen * 0.35)` (toujours positive) est vraie → retourne `'actif'` même si la journée n'est pas en Automne. Cette fonction est normalement appelée uniquement depuis `getTodaySeanceSpec()` avec `case 'automne':`, donc `cycleDay` est théoriquement dans la phase Automne. Mais sans guard, un appel erroné produirait un résultat silencieusement incorrect.

**Bug 12 — `restoreFeedback()` : `daysSince` calculé avec `Date.now()` et `new Date()` mixés** (lignes 4365–4368)

```js
const daysSince = Math.floor((Date.now() - new Date(_fy,_fm-1,_fd)) / 86400000);
```

`Date.now()` retourne le timestamp en millisecondes UTC (instant précis). `new Date(_fy, _fm-1, _fd)` retourne minuit heure locale. La soustraction peut donner une valeur légèrement inférieure à ce qu'on attend en zone UTC+ (ex. UTC+2 : difference de 2h). Pour `daysSince < 3`, ce décalage peut faire apparaître la section feedback 1 jour trop tôt. L'impact est mineur mais cohérent avec le bug général "UTC vs local" présent dans quelques endroits.

**Bug 13 — `renderHistoriqueSport()` — `nextCp` avec valeurs décimales** (ligne 2850)

```js
const prog = (ST.checkpointProgress || 0) % 5;
const nextCp = prog < 0.01 ? 5 : Math.ceil((5 - prog) * 2) / 2;
```

`prog` peut valoir `0.5`, `1.0`, `1.5` etc. (séances express = +0.5).
`nextCp` peut donc valoir `4.5`, `2`, `1.5` etc. → `"1.5 séance"` s'afficherait avec `s` pluriel (`nextCp > 1`). Le `s` pluriel est correct grammaticalement, mais `"1.5 séances"` reste un affichage étrange. Pas un bug de calcul, mais un problème d'affichage lié aux demi-séances.

---

## 5. INTÉGRITÉ DU LOCALSTORAGE

### ✅ Corrects

- `saveState()` exclut `currentSaison` et `currentDay` (recalculés) — correct.
- `loadState()` fusionne avec `{...ST}` via spread, donc les nouveaux champs ajoutés au ST par défaut sont préservés si absents du JSON sauvegardé — correct.
- Élagage des entrées > 30 jours dans `checkDailyReset()` — protège contre la saturation.
- Élagage des entrées hebdomadaires > 28 jours dans `checkWeeklyReset()` — correct.
- `try/catch` autour de `localStorage.setItem` — protège contre `QuotaExceededError`.

---

### ⚠️ Cas limites non gérés

**Bug 14 — `niveauStreak` et `_lastNiveauStreak` non persistés** (décrit en Bug 3 ci-dessus)

Ces champs n'étant pas dans ST, ils disparaissent à chaque rechargement. La progression automatique de niveau basée sur le streak ne fonctionnera jamais réellement.

**Bug 15 — `cycleHistory` limité à 6 entrées, mais `historiqueCycles` à 6 aussi** (lignes 1160, 4819)

```js
if (ST.cycleHistory.length > 6) ST.cycleHistory = ST.cycleHistory.slice(0, 6);
// ...
if (ST.historiqueCycles.length >= 6) { showToast('Maximum 6 cycles passés.'); return; }
```

Les deux tableaux existent en parallèle (`cycleHistory` = auto-archivage, `historiqueCycles` = saisie manuelle). La limite de 6 sur chacun n'est pas excessive, mais `renderCycleHistory()` les concatène — jusqu'à 12 cycles peuvent s'afficher. Fonctionnel, mais non documenté.

**Bug 16 — `seanceDone` n'est pas élagué de la même façon que `prayers`**

`checkDailyReset()` élague `seanceDone` après 30 jours. Mais `renderHistoriqueSport()` (lignes 2843–2845) compte **toutes** les séances dans `seanceDone`, sans filtre par cycle ou par période. Si des entrées > 30 jours existent (possible avant le premier élagage ou après import d'une sauvegarde), le total sera gonflé par rapport à la réalité. Ce n'est pas un bug de calcul mais une inconsistance dans la fenêtre de données.

**Bug 17 — `localStorage` plein : comportement silencieux**

`saveState()` est enveloppé dans un `try/catch` vide :
```js
try { localStorage.setItem('sakinapp_v1', JSON.stringify(toSave)); } catch(e) {}
```
En cas de `QuotaExceededError`, les données ne sont pas sauvegardées et l'utilisatrice n'est pas notifiée. Ses actions sont perdues silencieusement.

**Code corrigé proposé :**
```js
try {
  localStorage.setItem('sakinapp_v1', JSON.stringify(toSave));
} catch(e) {
  if (e && e.name === 'QuotaExceededError') {
    console.warn('SakinApp: localStorage plein — certaines données non sauvegardées.');
    // Optionnel : showToast('Stockage presque plein — exporte tes données dans Paramètres.');
  }
}
```

---

## 6. CALCUL `_bilanStats()` PAR PHASE

### ⚠️ Absence de ventilation par phase

Le bilan global agrège toutes les données depuis `cycleStart` sans distinguer les phases (Hiver / Printemps / Été / Automne). Il est impossible de savoir combien de séances ont été faites spécifiquement en Été ou combien de jours de dhikr sont tombés en Hiver.

Ce n'est pas un bug mais une limite de conception. Pour un futur bilan enrichi, il faudrait ajouter :

```js
// Ventilation des séances par phase
const seancesByPhase = { hiver: 0, printemps: 0, ete: 0, automne: 0 };
Object.keys(ST.seanceDone || {}).filter(inCycle).forEach(dateStr => {
  const d = new Date(dateStr);
  const diff = Math.floor((d - new Date(sy, sm-1, sd)) / 86400000);
  const dayOfCycle = (diff % dur) + 1;
  const phase = phaseForDay(dayOfCycle, dur);
  seancesByPhase[phase]++;
});
```

---

## RÉSUMÉ

| # | Sévérité | Fonction | Fichier | Description |
|---|----------|----------|---------|-------------|
| 1 | ⚠️ | `phaseThresholds()` | app.js:1128 | `springStartD` peut dépasser `eteStartD` si `hiverEnd` tardif |
| 2 | ⚠️ | `phaseThresholds()` | app.js:1131 | Été très court (3 jours) sur cycles courts — cohérent mais surprenant |
| 3 | ❌ | `updateNiveauStreak()` | sport-progression-logic.js:117 | `niveauStreak`/`_lastNiveauStreak` absents de ST → perdus au reload |
| 4 | ❌ | `_triggerCheckpoint()` | app.js:2651 | `checkpointProgress` non remis à 0 si non-Premium → accumulation infinie |
| 5 | ⚠️ | `checkSeanceProgression()` | app.js:2288 | Fonction stub vide, gardée "pour compatibilité" — clarifier ou supprimer |
| 6 | ⚠️ | `updateNiveauStreak()` | sport-progression-logic.js:117 | Pas de reset au changement de phase → streak peut déclencher trop tôt |
| 7 | ⚠️ | `_bilanStats()` | app.js:1368 | `objCheckCount` non filtré par cycleStart → peut comptabiliser semaines précédentes |
| 8 | ⚠️ | `showBilanModal()` | app.js:1385 | `joursSuivis` fallback à `20` arbitraire si pas de cycle |
| 9 | ✅ | `showBilanModal()` | app.js:1436 | `avgRegles` protégé par guard `if (!histCycles.length)` |
| 10 | ⚠️ | `dayWithinPhase()` | app.js:3979 | Retourne `-1` si `cycleDay=0` (appel externe non protégé) |
| 11 | ⚠️ | `getAutomneMicroPhase()` | app.js:3989 | `autDay` peut être négatif si appelé hors phase Automne |
| 12 | ⚠️ | `restoreFeedback()` | app.js:4366 | Mix `Date.now()` UTC / `new Date(local)` → décalage potentiel de 1 jour |
| 13 | ⚠️ | `renderHistoriqueSport()` | app.js:2850 | `nextCp` peut afficher `"1.5 séances"` (demi-séances express) |
| 14 | ❌ | `saveState()` / ST | app.js:74 | `niveauStreak` absent de ST → non persisté → progression perdue |
| 15 | ✅ | `cycleHistory` + `historiqueCycles` | app.js:1160,4819 | Deux tableaux de 6 — concaténation correcte mais non documentée |
| 16 | ⚠️ | `renderHistoriqueSport()` | app.js:2843 | `seanceDone` compté sans filtre temporel → peut inclure données hors cycle |
| 17 | ⚠️ | `saveState()` | app.js:79 | `QuotaExceededError` silencieux — aucun feedback utilisateur |

---

## PRIORITÉS DE CORRECTION

### Critique (à corriger avant prod)
- **Bug 3 + 14** : Ajouter `niveauStreak: 0` et `_lastNiveauStreak: null` dans ST.
- **Bug 4** : Remettre `checkpointProgress = 0` avant le check `isFullAccess()`.

### Important (prochaine itération)
- **Bug 1** : Guard dans `phaseThresholds()` pour `springStartD < eteStartD`.
- **Bug 6** : Reset `niveauStreak` au changement de phase dans `updateNiveauStreak()`.
- **Bug 7** : Filtrer `objCheckCount` par `cycleStart` dans `_bilanStats()`.

### Mineur
- Bug 8, 10, 11, 12, 13, 16, 17.
