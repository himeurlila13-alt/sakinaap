# Rapport QA — SakinApp
**Date :** 2026-05-06  
**Analyste :** Claude Code (lecture statique — pas d'exécution navigateur)  
**Fichiers analysés :** `app.js`, `index.html`, `data.js`

---

## Synthèse

| Sévérité | Nombre |
|---|---|
| 🔴 Critique | 4 |
| 🟡 Moyen | 5 |
| 🟢 Mineur | 4 |

---

## BUG-01 — `renderQuickSeance` appelée mais non définie
**Sévérité :** 🔴 Critique  
**Fichier :** `app.js` ligne ~1943  

**Observé :** La fonction `validerSeance()` (la version "sport" de l'ancienne page Vie) appelle `renderQuickSeance(s)` après avoir validé une séance. Cette fonction n'existe nulle part dans `app.js` ni dans `data.js`.

```js
// ligne 1943
function validerSeance() {
  ...
  renderQuickSeance(s);   // ← ReferenceError au runtime
  renderDayScore();
}
```

**Comportement attendu :** L'UI se rafraîchit après validation.  
**Comportement observé :** `ReferenceError: renderQuickSeance is not defined` en console. La séance est marquée done en localStorage mais l'affichage ne se met pas à jour.

**Fix proposé :** Remplacer l'appel par `renderCarteBouger(s)` (la fonction qui remplit la carte Séance de l'Accueil), ou supprimer cet appel si `validerSeance()` n'est plus accessible depuis l'UI.

---

## BUG-02 — Onglet fantôme `vie` dans TAB_TOURS
**Sévérité :** 🔴 Critique  
**Fichier :** `app.js` lignes 2539–2543  

**Observé :** `TAB_TOURS` contient une entrée `vie` :

```js
vie: {
  emoji: '🌿',
  title: 'Ta vie au rythme du cycle',
  text: '...',
},
```

Or l'onglet `<div class="tab-page" id="tab-vie">` n'existe **pas** dans `index.html` (supprimé dans le commit `407fc16`). Lorsque `showTabTour('vie')` est appelé, il essaie d'afficher un tour pour un onglet inexistant.

**Comportement attendu :** `showTabTour` ne déclenche rien pour un onglet supprimé.  
**Comportement observé :** L'overlay tour-guide s'affiche avec le contenu de l'onglet Vie, mais cliquer sur "Compris" essaie de marquer `tabSeen_vie` en localStorage — erreur silencieuse, mais le tour d'un autre onglet peut bloquer l'expérience.

**Fix proposé :** Supprimer l'entrée `vie` de `TAB_TOURS` dans `app.js`.

---

## BUG-03 — IDs DOM absents référencés par `renderDayScore()`
**Sévérité :** 🔴 Critique  
**Fichier :** `app.js` ligne 661  

**Observé :** `renderDayScore()` cherche l'élément `day-score-grid` :

```js
const container = document.getElementById('day-score-grid');
if (!container) return;
```

Cet ID n'existe nulle part dans `index.html`. La fonction retourne silencieusement sans rien rendre. La grille "score du jour" (prières/dhikr/séance/coran) ne s'affiche jamais dans l'onglet Accueil.

**Comportement attendu :** 3–4 chips de score apparaissent sous le message du jour.  
**Comportement observé :** Vide complet — le bloc n'est pas rendu.

**Fix proposé :** Ajouter dans `index.html`, dans `#tab-accueil`, un conteneur :

```html
<div class="day-score-wrap">
  <div class="day-score-grid" id="day-score-grid"></div>
</div>
```

---

## BUG-04 — Nombreux IDs absents du HTML (fonctions orphelines)
**Sévérité :** 🔴 Critique  
**Fichiers :** `app.js`, `index.html`  

Les fonctions suivantes utilisent des `getElementById` vers des IDs qui **n'existent pas** dans `index.html`. Elles ne plantent pas (les appels sont protégés par `if (!el) return`) mais leur fonctionnalité est totalement perdue :

| Fonction | IDs absents | Conséquence |
|---|---|---|
| `validerSeance()` / `afficherSeanceDone()` / `restoreSeanceDone()` | `sport-validate-btn`, `sport-done-state`, `sport-done-msg` | Le bouton de validation sport de l'ancienne page Vie ne fonctionne plus |
| `toggleMouv()` / `updateMouvProgress()` | `sport-mouvements`, `mouv-progress-label`, `mouv-progress-pct`, `mouv-progress-fill` | Mouvements libres non rendus |
| `renderCycleHistory()` | `cycle-history-card`, `cycle-history-list` | Historique des cycles invisible |
| `renderPatterns()` | `patterns-card`, `patterns-free`, `patterns-premium` | Section patterns invisible |
| `sendFeedback()` / `setRating()` / `toggleChip()` / `restoreFeedback()` | `feedback-section`, `feedback-form-wrap`, `feedback-sent-wrap`, `feedback-text`, `feedback-email`, `feedback-msg`, `rating-label`, `rating-stars`, `likes-chips` | Formulaire feedback inexistant dans le HTML actuel |
| `applySaisonTheme()` | `sport-header` | Pas de crash, juste un `if` raté |

**Fix proposé :** Soit réintégrer ces sections dans `index.html`, soit supprimer les fonctions devenues mortes de `app.js` pour alléger la base.

---

## BUG-05 — `checkWeeklyReset()` efface `weeklyObjChecks` intégralement chaque lundi
**Sévérité :** 🟡 Moyen  
**Fichier :** `app.js` lignes 1685–1697  

**Observé :**

```js
function checkWeeklyReset() {
  ...
  ST.mouvDone = {};
  ST.weeklyObjChecks = {};   // ← tout effacé, pas seulement la semaine précédente
  ST.customObjChecks = {};
  ...
}
```

`weeklyObjChecks` est indexé par `weekKey` (ex. `"2026-04-27"`). La remise à zéro totale détruit aussi les semaines plus anciennes stockées — ce qui n'est pas un problème aujourd'hui (les données sont petites), mais détruit également `customObjChecks` en entier, effaçant la progression des objectifs perso de toutes les semaines passées au lieu de seulement la semaine en cours.

**Comportement attendu :** Seule la semaine en cours est réinitialisée ; les semaines passées restent accessibles (pour un futur historique).  
**Comportement observé :** Tout l'historique des coches hebdomadaires disparaît chaque lundi.

**Fix proposé :** Ne pas effacer les objets entiers. Supprimer uniquement les entrées trop vieilles si besoin :

```js
// Garder seulement les 4 dernières semaines
const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 28);
['weeklyObjChecks','customObjChecks'].forEach(key => {
  Object.keys(ST[key]||{}).forEach(wk => { if (new Date(wk) < cutoff) delete ST[key][wk]; });
});
ST.mouvDone = {};
```

---

## BUG-06 — `getAutomneMicroPhase` : `autLen` calcul incorrect — la phase "fin" peut être vide
**Sévérité :** 🟡 Moyen  
**Fichier :** `app.js` lignes 2021–2029  

**Observé :**

```js
function getAutomneMicroPhase(cycleDay, cycleDur) {
  const ovDay = Math.max(10, cycleDur - 14);
  const eteEnd = Math.min(cycleDur - 2, ovDay + 2);
  const autLen = cycleDur - eteEnd;   // ← longueur de l'automne en jours
  const autDay = cycleDay - eteEnd;   // ← jour RELATIF dans l'automne
  ...
}
```

Pour un cycle de 28 jours : `ovDay=14`, `eteEnd=16`, `autLen=12`, `autDay = cycleDay - 16`.  
- `actif` : autDay ≤ 4 (J17–J20)  
- `doux`  : autDay ≤ 8 (J21–J24)  
- `fin`   : J25–J28  

C'est cohérent pour 28 jours. Mais pour un **cycle court de 26 jours** : `ovDay=12`, `eteEnd=14`, `autLen=12`, les seuils sont identiques — pas de bug.

**Vrai bug :** Pour un cycle de 26 jours, `eteEnd = min(24, 14) = 14`, `autLen = 26 - 14 = 12`. Mais `computeCycle` fixe `eteEnd = min(dur-2, ovDay+2) = min(24,14) = 14`. L'Automne commence donc à J15. Si l'utilisatrice est à J25 (autDay=11), elle tombe en `doux` (seuil 8.4 → 8). Le calcul `Math.floor(12*0.70) = 8` — autDay=11 > 8, donc `fin`. C'est correct.

**Réel problème détecté :** Si `cycleDay <= eteEnd` (l'utilisatrice n'est pas encore en Automne), `autDay` serait ≤ 0. `getTodaySeanceSpec()` appelle `getAutomneMicroPhase` seulement si `phase === 'automne'`, ce qui protège. Mais si `computeCycle` attribue 'automne' alors que `cycleDay == eteEnd+1`, `autDay = 1`, qui retourne 'actif' correctement. Pas de bug ici finalement.

**Bug réel :** `autLen` vaut `cycleDur - eteEnd`, ce qui inclut le dernier jour du cycle. Mais le seuil 'actif' est `Math.floor(autLen * 0.35)`. Pour un cycle de 28j : `Math.floor(12 * 0.35) = 4`. Donc J17–J20 sont 'actif'. Mais le commentaire dans `data.js` dit "Actif J18-J21". Il y a un **décalage d'un jour** entre la documentation et le code — les bornes réelles sont J17–J20 au lieu de J18–J21 pour un cycle de 28j.

**Fix proposé :** Ajuster les constantes multiplicatives : utiliser `0.40` et `0.75` pour coller aux commentaires, ou corriger la documentation.

---

## BUG-07 — `computeCycle` : Hiver fixé à jours 1–5 mais `phaseForDay` aussi — incohérence avec les données MESSAGES_JOUR
**Sévérité :** 🟡 Moyen  
**Fichier :** `app.js` ligne 550, `data.js`  

**Observé :** `computeCycle()` attribue 'hiver' si `d <= 5`. `MESSAGES_JOUR` couvre J1–J28. Pour un cycle de 28j, J14–J17 sont 'ete' selon `computeCycle` mais `MESSAGES_JOUR` dispose de messages jusqu'à J28. Aucun problème.

**Bug réel détecté :** `MESSAGES_JOUR` ne contient que des messages pour J1–J28. Or pour un cycle de 33 jours, `ST.currentDay` peut atteindre 29–33. `updateMessage()` fait :

```js
const dayMsg = typeof MESSAGES_JOUR !== 'undefined' && MESSAGES_JOUR[ST.currentDay];
```

Si `ST.currentDay = 32`, `MESSAGES_JOUR[32]` est `undefined`, le fallback `s.messages[mood]` est utilisé. C'est géré proprement par le fallback — **pas de plantage**, mais les utilisatrices en cycle long (33j) reçoivent des messages génériques non personnalisés pour les J29–J33.

**Fix proposé :** Ajouter des entrées J29–J33 dans `MESSAGES_JOUR` dans `data.js`, ou documenter le comportement intentionnel.

---

## BUG-08 — `checkDailyReset` ne réinitialise pas `eveningCheckinDate` / `eveningCheckinMood`
**Sévérité :** 🟡 Moyen  
**Fichier :** `app.js` lignes 1442–1460  

**Observé :**

```js
function checkDailyReset() {
  const today = new Date().toDateString();
  if (ST.lastDailyReset === today) return;
  ST.selectedSugg = [];
  ST.glaire = null;
  ST.glaireDate = null;
  ST.checkin = null;
  ST.checkinDate = null;
  // ... élagage des vieilles entrées datées ...
  ST.lastDailyReset = today;
  saveState();
}
```

`eveningCheckinDate` et `eveningCheckinMood` ne sont pas remis à null. Ce n'est pas critique (ils sont comparés à `today` avant de s'afficher), mais c'est une incohérence : si l'utilisatrice a fait son check-in du soir hier, `ST.eveningCheckinDate` reste la date d'hier et `checkNotificationReturn()` peut ou non déclencher le check-in du soir selon l'heure.

**Comportement attendu :** Reset cohérent de toutes les données "du jour".  
**Fix proposé :** Ajouter dans `checkDailyReset` :

```js
ST.eveningCheckinDate = null;
ST.eveningCheckinMood = null;
```

---

## BUG-09 — `switchTab()` ne fait pas de scroll reset sur `document.documentElement`
**Sévérité :** 🟢 Mineur  
**Fichier :** `app.js` lignes 1823–1833  

**Observé :** `switchTab()` (appelé depuis le menu bas) réinitialise `document.body.scrollTop` et `document.documentElement.scrollTop` puis `app-content.scrollTop`. C'est correct. Mais `switchTabById()` (appelé depuis les boutons internes "Débloquer Premium" etc.) ne remet à zéro que `app-content.scrollTop` — pas `document.body` ni `document.documentElement`.

Sur certains navigateurs mobiles (Safari iOS), le scroll peut être sur `body` ou `documentElement` selon le contexte. Résultat possible : la page reste scrollée en bas quand on navigue via `switchTabById`.

**Fix proposé :**

```js
function switchTabById(name, section) {
  ...
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;
  const _ac2 = document.getElementById('app-content');
  if (_ac2) _ac2.scrollTop = 0;
}
```

---

## BUG-10 — `confirmDeleteMyData` : champ `dhikrDate` présent dans ST initial mais absent du reset
**Sévérité :** 🟢 Mineur  
**Fichier :** `app.js` lignes 2501–2518  

**Observé :** L'objet ST initial (ligne 12) contient `dhikrDate: null`. Le reset dans `confirmDeleteMyData()` reconstruit ST en incluant `dhikrDate: null` (ligne 2505). Ce champ est bien présent. Aucun bug ici.

**Vérification complémentaire :** Tous les champs du ST initial sont bien présents dans le reset de `confirmDeleteMyData` :  
`prenom`, `cycleStart`, `cycleDuration`, `checkin`, `checkinDate`, `prayers`, `dhikrChecks`, `dhikrDate`, `coranDone`, `asmaKnown`, `glaire`, `glaireDate`, `symptomes`, `autreSymptomesText`, `currentSaison`, `currentDay`, `selectedSugg`, `mouvDone`, `seanceDone`, `notifFreq`, `waitlistEmail`, `feedbackSent`, `installBannerDismissed`, `lastDailyReset`, `lastWeeklyReset`, `eveningCheckinDate`, `eveningCheckinMood`, `cycleHistory`, `isPremium`, `seanceValidatedCount`, `seanceLevel`, `amrapRecord`, `printempsUpgradeDone`, `levelMaxShown`, `printempsBasCount`, `_lastCycleNum`, `weeklyObjChecks`, `customObjectifs`, `customObjChecks`.

**Résultat : TOUS les champs sont bien réinitialisés.** Pas de bug sur ce point.

---

## BUG-11 — `saveState()` exclut `currentSaison` et `currentDay` mais `loadState()` les exclut aussi
**Sévérité :** 🟢 Mineur  
**Fichier :** `app.js` lignes 47–64  

**Observé :**

```js
function saveState() {
  const toSave = {...ST};
  delete toSave.currentSaison;
  delete toSave.currentDay;
  localStorage.setItem('sakinapp_v1', JSON.stringify(toSave));
}
function loadState() {
  const saved = localStorage.getItem('sakinapp_v1');
  if (saved) {
    const parsed = JSON.parse(saved);
    delete parsed.currentSaison;
    delete parsed.currentDay;
    ST = {...ST, ...parsed};
  }
}
```

Le comportement est intentionnel et correct (commentaire le confirme). `computeCycle()` est toujours appelé après `loadState()`. Pas de bug — la conception est bonne.

---

## BUG-12 — `MESSAGES_JOUR` dans data.js ne couvre que J1–J28 ; cycles longs (33j) non couverts
**Sévérité :** 🟢 Mineur  
**Fichier :** `data.js` (fin du fichier) — voir BUG-07 ci-dessus pour détail complet.

---

## BUG-13 — Tour guidé : entrée `vie` déclenche un tour pour un onglet supprimé
**Sévérité :** 🟡 Moyen (doublon détaillé en BUG-02)  

---

## BUG-14 — `automne-doux` : accès potentiel à `SEANCES_SPORT.printemps.bas[1]?.exercices` sans vérification de `level`
**Sévérité :** 🟡 Moyen  
**Fichier :** `app.js` lignes 794–799  

**Observé :**

```js
case 'automne-doux': {
  const d = spec.data;
  titleText = 'Mobilité douce'; metaText = '🍂 Phase de transition'; durText = '~15 min';
  exContent = _sportExHtml(d.mobilite);
  if (level >= 3 && typeof SEANCES_SPORT !== 'undefined') {
    exContent += _sportExHtml(SEANCES_SPORT.printemps.bas[1]?.exercices, d.repos);
  }
  ...
}
```

`SEANCES_SPORT.printemps.bas[1]` accède à l'index `1` (notation bracket) mais `bas` dans `SEANCES_SPORT` est un objet dont les clés sont numériques (`1`, `2`, `3`, `4`). En JavaScript, `obj[1]` sur un objet `{1: {...}}` fonctionne car les clés sont coercées en string. Donc `bas[1]` retourne bien la séance Découverte niveau 1. Pas de crash.

**Cependant :** Le commentaire dans `data.js` dit "N1-N2 : mobilité seule | N3-N4 : mobilité + circuit Découverte". Or le code ajoute les exercices de `bas[1]` (Découverte) pour `level >= 3`, y compris pour N4. C'est intentionnel selon le commentaire mais non documenté dans le code.

**Fix proposé :** Ajouter un commentaire explicatif dans le code pour clarifier l'intention.

---

## Récapitulatif prioritaire

### Actions immédiates (bloquants ou fonctionnalités cassées)

1. **BUG-01** — Ajouter `id="day-score-grid"` dans le HTML (accueil) + corriger `validerSeance()` → `renderCarteBouger`.
2. **BUG-02** — Supprimer l'entrée `vie` de `TAB_TOURS` dans `app.js`.
3. **BUG-03/04** — Auditer les fonctions mortes : supprimer ou réintégrer dans le HTML les IDs absents (`sport-*`, `mouv-*`, `cycle-history-card`, `patterns-card`, `feedback-*`).

### Actions recommandées

4. **BUG-05** — Corriger le reset hebdomadaire pour ne pas écraser l'historique des semaines précédentes.
5. **BUG-08** — Ajouter le reset de `eveningCheckinDate/Mood` dans `checkDailyReset`.
6. **BUG-09** — Uniformiser le scroll reset dans `switchTabById`.

### Améliorations mineures

7. **BUG-06** — Ajuster les seuils `getAutomneMicroPhase` pour coller à la documentation.
8. **BUG-07/12** — Ajouter des messages J29–J33 pour les utilisatrices avec un cycle long.
