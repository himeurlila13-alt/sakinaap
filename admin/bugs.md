# Rapport QA — SakinApp
**Date :** 2026-05-07  
**Analyste :** Claude Code (lecture statique complète — index.html, app.js, data.js, style.css, sw.js)  
**Périmètre :** 10 points d'audit systématiques

---

## Résumé exécutif

| Sévérité | Nombre |
|---|---|
| 🔴 Critique | 2 |
| 🟡 Moyen | 4 |
| 🟢 Mineur | 3 |

---

## BUG 1 — Dossier `icons/` absent du projet

**Fichiers :** `manifest.json` (l.11), `index.html` (l.8), `sw.js` (ASSETS non listé)  
**Sévérité :** 🔴 **Critique**

### Comportement attendu
Le dossier `icons/` avec le fichier `icon.svg` doit exister à la racine du projet pour que :
- L'apple-touch-icon (`<link rel="apple-touch-icon" href="/icons/icon.svg">`) s'affiche sur iOS
- Le manifest PWA soit valide (la clé `"icons"` pointe vers `/icons/icon.svg`)
- L'installation PWA fonctionne correctement

### Comportement observé
```
c:\Users\himeu\Desktop\sakinaap\icons\   ← dossier INEXISTANT
```
- Le dossier `icons/` n'existe pas du tout.
- `manifest.json` référence `/icons/icon.svg` → erreur 404 à l'installation.
- `index.html` ligne 8 référence la même ressource → icône manquante sur iOS.
- `sw.js` ne liste pas `/icons/icon.svg` dans les ASSETS → même en cas d'existence, l'icône ne serait pas mise en cache hors-ligne.

### Fix proposé
1. Créer le dossier `icons/` et y placer `icon.svg`.
2. Dans `sw.js`, ajouter l'icône aux ASSETS :
```js
const ASSETS = ['/', '/index.html', '/style.css', '/data.js', '/app.js', '/manifest.json', '/icons/icon.svg'];
```

---

## BUG 2 — `hiverEnd` antérieur au `cycleStart` : `springStartD` devient négatif ou zéro, la phase est faussée

**Fichier :** `app.js`, `computeCycle()`, lignes 568–573  
**Sévérité :** 🔴 **Critique**

### Comportement attendu
Si `hiverEnd` est une date antérieure à `cycleStart` (scénario réel : l'utilisatrice a déclaré la fin de l'Hiver lors d'un ancien cycle, puis démarre un nouveau cycle via `startNewCycleToday()` qui réinitialise bien `hiverEnd = null` — **mais si elle modifie ensuite le cycle via `saveEditCycle()`, `hiverEnd` n'est pas réinitialisé**), `springStartD` doit rester à 6 par défaut.

### Comportement observé
`saveEditCycle()` (ligne 2597–2608) change `ST.cycleStart` sans toucher à `ST.hiverEnd`. Si la nouvelle date de début est postérieure à l'ancien `hiverEnd`, alors :

```js
hiverEndDiff = Math.floor((hiverEndLocal - startLocal) / ms_par_jour)
// → valeur NÉGATIVE (ex: -3)
springStartD = Math.max(2, -3 + 1) = Math.max(2, -2) = 2
```

Avec `springStartD = 2`, Hiver ne dure plus qu'1 jour (J1). Toutes les phases sont décalées — la phase Printemps commence au J2. L'utilisatrice en J3 sera en Printemps alors qu'elle devrait être en Hiver.

### Scénario reproductible
1. Déclarer fin d'Hiver le 2026-04-20 → `ST.hiverEnd = '2026-04-20'`
2. Utiliser "Modifier mon cycle" et saisir un `cycleStart` à `2026-05-01` → `saveEditCycle()` ne réinitialise pas `hiverEnd`
3. `computeCycle()` calcule `hiverEndDiff = (20 avril - 1er mai) = -11 jours` → `springStartD = max(2, -10) = 2`

### Fix proposé
Dans `saveEditCycle()`, réinitialiser `hiverEnd` si la date de début change :

```js
function saveEditCycle() {
  const dateVal = document.getElementById('edit-cycle-date').value;
  if (!dateVal) { alert('Indique la date 🌙'); return; }
  if (ST.cycleStart && ST.cycleStart !== dateVal) {
    if (!ST.cycleHistory) ST.cycleHistory = [];
    ST.cycleHistory.unshift({ start: ST.cycleStart, duration: ST.cycleDuration || 28 });
    if (ST.cycleHistory.length > 6) ST.cycleHistory = ST.cycleHistory.slice(0, 6);
    ST.hiverEnd = null;  // ← AJOUTER cette ligne
  }
  ST.cycleStart = dateVal; ST.cycleDuration = editDuration; saveState(); closeEditCycle();
  computeCycle(); applySaisonTheme(); populateAll();
  showToast('✓ Cycle mis à jour — ' + SAISONS[ST.currentSaison].emoji + ' ' + SAISONS[ST.currentSaison].nom + ' · Jour ' + ST.currentDay);
}
```

---

## BUG 3 — `phaseForDay()` utilise une frontière Hiver codée en dur (J1–J5) incompatible avec `hiverEnd` dynamique

**Fichier :** `app.js`, `phaseForDay()`, lignes 2468–2476  
**Sévérité :** 🟡 **Moyen**

### Comportement attendu
La fonction `phaseForDay()` est utilisée pour colorier chaque jour du calendrier (onglet Objectifs). Elle devrait utiliser la même logique que `computeCycle()` qui prend en compte `ST.hiverEnd`.

### Comportement observé
```js
function phaseForDay(i, dur) {
  if (i <= 5) return 'hiver';   // ← toujours J1–5, ignore hiverEnd
  ...
}
```

Si l'utilisatrice a déclaré la fin de son Hiver au J3, `computeCycle()` place le Printemps dès J4. Mais le calendrier coloriera J4 et J5 en Hiver (violet) au lieu de Printemps (vert). Les couleurs du calendrier sont donc incohérentes avec la phase affichée dans l'app.

### Fix proposé
Passer `springStartD` en paramètre ou le recalculer dans `phaseForDay()` :

```js
function phaseForDay(i, dur, springStartD) {
  springStartD = springStartD || 6;
  const ovulationDay = Math.max(10, dur - 14);
  const eteStart = Math.max(springStartD, Math.max(8, ovulationDay - 2));
  const eteEnd = Math.min(dur - 2, ovulationDay + 2);
  if (i < springStartD) return 'hiver';
  if (i < eteStart) return 'printemps';
  if (i <= eteEnd) return 'ete';
  return 'automne';
}
```

Et dans `renderCalendar()`, calculer et passer `springStartD` :

```js
// Calculer springStartD comme dans computeCycle()
let springStartD = 6;
if (ST.hiverEnd && ST.cycleStart) { /* même logique */ }
phase = phaseForDay(dayOfCycle + 1, dur, springStartD);
```

---

## BUG 4 — Variable `automneStart` déclarée mais jamais utilisée dans `computeCycle()`

**Fichier :** `app.js`, ligne 564  
**Sévérité :** 🟢 **Mineur**

### Comportement observé
```js
const automneStart = eteEnd + 1;  // ligne 564 — jamais utilisée
```
La variable est déclarée mais la condition `automne` utilise directement `else` sans `automneStart`. Pas de bug fonctionnel mais confusion à la lecture et linting warning potentiel.

### Fix proposé
Supprimer la ligne 564 :
```js
// Supprimer : const automneStart = eteEnd + 1;
```

---

## BUG 5 — `confirmDeleteMyData()` oublie `_lastSaison` et `hiverEnd` dans la réinitialisation

**Fichier :** `app.js`, `confirmDeleteMyData()`, lignes 2865–2884  
**Sévérité :** 🟡 **Moyen**

### Comportement attendu
Après "Réinitialiser mes données", tous les champs de `ST` doivent être remis à leur valeur initiale, comme défini dans la déclaration d'origine de `ST` (lignes 4–50).

### Comportement observé
La reconstruction de `ST` dans `confirmDeleteMyData()` oublie deux champs :
- `hiverEnd` : absent → reste `undefined` après reset (la valeur initiale dans ST est `null`)
- `_lastSaison` : absent → reste `undefined` après reset (la valeur initiale est `null`)

Si une ancienne valeur `hiverEnd` persistait en mémoire (JS n'est pas rechargé car il n'y a pas de `location.reload()`), le prochain `computeCycle()` lirait un `hiverEnd` stale. Idem pour `_lastSaison` qui déclenche les toasts de transition de phase.

### Fix proposé
Ajouter les deux champs manquants dans la réinitialisation :

```js
function confirmDeleteMyData() {
  try { localStorage.clear(); } catch(e) {}
  ST = {
    prenom: '', cycleStart: null, cycleDuration: 28, checkin: null, checkinDate: null,
    prayers: {}, dhikrChecks: {}, dhikrDate: null, coranDone: {}, asmaKnown: [],
    glaire: null, glaireDate: null, symptomes: {}, autreSymptomesText: {},
    currentSaison: 'printemps', currentDay: 1,
    selectedSugg: [], mouvDone: {}, seanceDone: {}, notifFreq: 2,
    waitlistEmail: null, feedbackSent: false, installBannerDismissed: false,
    lastDailyReset: null, lastWeeklyReset: null, eveningCheckinDate: null,
    eveningCheckinMood: null, cycleHistory: [],
    isPremium: false, seanceValidatedCount: 0, seanceLevel: 1,
    amrapRecord: null, printempsUpgradeDone: false, levelMaxShown: false,
    printempsBasCount: 0, _lastCycleNum: null,
    weeklyObjChecks: {}, customObjectifs: [], customObjChecks: {},
    marche: { phase: null, checks: {}, custom: [] },
    trialEnded: false, bilanShown: false,
    _lastSaison: null,   // ← AJOUTER
    hiverEnd: null,      // ← AJOUTER
  };
  closeDeleteModal();
  document.getElementById('app').style.display = 'none';
  document.getElementById('onboarding').style.display = 'block';
}
```

---

## BUG 6 — `btn-nouveau-hiver` toujours caché en phase Hiver (logique inversée)

**Fichier :** `app.js`, `renderCycle()`, lignes 1585–1587  
**Sévérité :** 🟡 **Moyen**

### Comportement attendu
- `btn-nouveau-hiver` ("Mon Hiver commence aujourd'hui") → visible quand on N'EST PAS en Hiver (pour déclarer un nouveau cycle/règles)
- `btn-fin-hiver` ("Mon Hiver est terminé") → visible quand on EST en Hiver

### Comportement observé — logique incohérente avec l'UX attendue
```js
const _isH = ST.currentSaison === 'hiver';
if (_bnh) _bnh.style.display = _isH ? 'none' : 'flex';  // btn-nouveau-hiver visible si PAS hiver ✓
if (_bfh) _bfh.style.display = _isH ? 'flex' : 'none';  // btn-fin-hiver visible si hiver ✓
```

La logique est en fait **correcte** côté code. Cependant, le label "Mon Hiver commence aujourd'hui" (`btn-nouveau-hiver`) apparaît pendant toutes les phases non-Hiver (Printemps, Été, Automne). Pendant l'Automne ou l'Été, proposer "Mon Hiver commence aujourd'hui" est sémantiquement bizarre — cela sous-entend que les règles arrivent, ce qui ne se produit qu'en fin de cycle. Ce bouton devrait idéalement n'être montré qu'en fin d'Automne ou en Printemps/Été si l'utilisatrice a des règles irrégulières.

**Note :** Ce n'est pas un crash — c'est un problème d'UX qui peut dérouter. La logique technique est correcte, le libellé et la visibilité sont perfectibles.

### Fix proposé (UX)
Limiter l'affichage de `btn-nouveau-hiver` à la phase Automne :

```js
if (_bnh) _bnh.style.display = (ST.currentSaison === 'automne') ? 'flex' : 'none';
if (_bfh) _bfh.style.display = (ST.currentSaison === 'hiver') ? 'flex' : 'none';
```

---

## BUG 7 — Service Worker : `/icons/icon.svg` absent des ASSETS mis en cache

**Fichier :** `sw.js`, ligne 2  
**Sévérité :** 🟡 **Moyen**

### Comportement observé
```js
const ASSETS = ['/', '/index.html', '/style.css', '/data.js', '/app.js', '/manifest.json'];
```
Même si le dossier `icons/` était créé (correction du BUG 1), le SW ne met pas l'icône en cache. En mode hors-ligne, l'icône serait absente (404).

### Fix proposé
```js
const ASSETS = ['/', '/index.html', '/style.css', '/data.js', '/app.js', '/manifest.json', '/icons/icon.svg'];
```

---

## AUDIT — Points vérifiés sans bug

### 1. Calcul du cycle (`computeCycle()`)
- `cycleStart null` → garde OK (`if (!ST.cycleStart) return;` ligne 529)
- `diff < 0` → fallback hiver J1 OK (ligne 535)
- `springStartD` avec `hiverEnd` → `Math.max(2, ...)` protège contre 0/négatif dans le cas standard (mais voir BUG 2 pour le cas edge `saveEditCycle`)
- `eteStartFinal = Math.max(springStartD, eteStart)` → évite que l'Été commence avant le Printemps : OK
- `eteEndFinal = Math.max(eteStartFinal, eteEnd)` → évite un Été de durée nulle : OK

### 2. localStorage / persistance
- `saveState()` exclut bien `currentSaison` et `currentDay` (`delete toSave.currentSaison; delete toSave.currentDay;`) : OK
- `loadState()` les exclut aussi avant fusion : OK
- `computeCycle()` est toujours appelé en premier dans `initApp()` : OK

### 3. Navigation (onglets)
- Tous les IDs HTML existent : `tab-accueil`, `tab-cycle`, `tab-ame`, `tab-objectifs`, `tab-moi` : OK
- `switchTabById()` utilise un `tabMap` pour trouver l'index du nav-item : OK
- `switchTab()` reçoit le `navEl` directement depuis `onclick` : OK

### 4. Mode Premium TEST
- `isTrialActive()` : `return ST.isPremium || !ST.trialEnded;` : logique correcte
- `applyTrialLocks()` : masque les cartes + affiche les banners lock selon `isTrialActive()` : OK
- IDs `trial-lock-accueil`, `trial-lock-cycle`, `trial-lock-objectifs` : tous présents dans index.html : OK

### 5. Boutons Hiver/Printemps
- `id="btn-nouveau-hiver"` : présent (index.html ligne 312) : OK
- `id="btn-fin-hiver"` : présent (index.html ligne 313) : OK
- `declarerPrintemps()` : définie dans app.js ligne 1616 : OK
- `startNewCycleToday()` : réinitialise bien `ST.hiverEnd = null` (ligne 1608) : OK

### 6. Mon Marché
- `switchRepasTab()` : définie ligne 1081, IDs `repas-tab-btn-recettes`, `repas-tab-btn-marche`, `repas-tab-recettes`, `repas-tab-marche` : tous présents dans index.html lignes 220–230 : OK
- `renderMarcheTab()` : définie ligne 1121 : OK
- `marcheToggleItem()` : définie ligne 1155 : OK
- `marcheAddItem()` : définie ligne 1167 : OK

### 7. Bilan modal
- `showBilanModal()` cible bien `#bilan-body` (ligne 643) : OK
- L'ID `bilan-body` existe bien dans index.html (ligne 897) : OK
- Pas d'erreur `#bilan-stats` (cet ID n'existe nulle part) : OK

### 8. Phase toast
- `showPhaseToast()` est définie ligne 597, AVANT tout appel (via `setTimeout(..., 1800)` dans `computeCycle()` ligne 590)
- Même si définie après `computeCycle()` dans le code source, le `setTimeout` de 1800ms garantit que la fonction est disponible à l'exécution : OK

### 9. Dark mode
- La media query `@media(prefers-color-scheme:dark){...}` est syntaxiquement correcte (style.css ligne 1365) : OK
- Les variables CSS et sélecteurs sont bien formés : OK

---

## Tableau récapitulatif

| # | Point audité | Statut | Sévérité |
|---|---|---|---|
| 1 | Dossier `icons/` absent | 🔴 BUG | Critique |
| 2 | `hiverEnd` antérieur → `springStartD` erroné via `saveEditCycle` | 🔴 BUG | Critique |
| 3 | `phaseForDay()` ignore `hiverEnd` → calendrier incohérent | 🟡 BUG | Moyen |
| 4 | Variable `automneStart` inutilisée | 🟢 INFO | Mineur |
| 5 | `confirmDeleteMyData()` oublie `_lastSaison` et `hiverEnd` | 🟡 BUG | Moyen |
| 6 | `btn-nouveau-hiver` visible hors-contexte (UX) | 🟡 UX | Moyen |
| 7 | SW : `/icons/icon.svg` absent du cache hors-ligne | 🟡 BUG | Moyen |
| 8 | Calcul cycle (cas limites cycleStart null, diff négatif) | ✅ OK | — |
| 9 | localStorage persistance / exclusion currentSaison+Day | ✅ OK | — |
| 10 | Navigation tabs + IDs HTML | ✅ OK | — |
| 11 | Mode Premium TEST + trial locks | ✅ OK | — |
| 12 | Boutons btn-nouveau-hiver / btn-fin-hiver / declarerPrintemps | ✅ OK | — |
| 13 | Mon Marché (switchRepasTab, renderMarcheTab, marcheToggleItem, marcheAddItem) | ✅ OK | — |
| 14 | Bilan modal → `#bilan-body` (pas `#bilan-stats`) | ✅ OK | — |
| 15 | showPhaseToast avant computeCycle (ordre d'exécution) | ✅ OK | — |
| 16 | Dark mode media query syntaxe | ✅ OK | — |

---

*Rapport généré par analyse statique complète des 5 fichiers sources.*
