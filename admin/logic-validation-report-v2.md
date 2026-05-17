# Logic Validation Report v2 — SakinApp
*Analyse complète — 17 mai 2026*

---

## RÉSUMÉ EXÉCUTIF

- **23 calculs / comportements validés** ✅
- **4 bugs confirmés** ❌
- **9 risques identifiés** ⚠️
- **Score de confiance actuel : 7.5/10**

---

## SCORE PAR DOMAINE

| Domaine | Score | Statut |
|---|---|---|
| Calcul cycle / jour courant | 9/10 | Solide |
| Calcul de phase (thresholds) | 7/10 | Arrondi mixte round/floor |
| Calcul trial 20 jours | 8/10 | installDate future non bloquée côté JS |
| Progression sport (niveaux) | 7/10 | niveauStreak jamais incrémenté |
| Bilan stats | 8/10 | Division par zéro protégée |
| Liste de courses | N/A | Fonctionnalité absente — limitation par conception |
| Historique cycles | 8/10 | Deux structures max4 vs max6 coexistent |
| Timer sportif | 7/10 | repos='—' → 30s inattendus |
| Onboarding | 8/10 | Prénom non sauvegardé avant enterApp |
| Email bienvenue | 6/10 | Bug template {{email}} confirmé |

---

## BUGS CRITIQUES ❌

### BUG 1 — Template `{{email}}` littéral dans le lien de désabonnement

**Fichier** : `app.js` — fonction `_buildWelcomeEmailHtml()`

Le footer de l'email de bienvenue contient :
```html
<a href="https://sakinaap.com/unsubscribe?email=${encodeURIComponent('{{email}}')}">
```
`{{email}}` est une chaîne littérale, jamais substituée. Toutes les utilisatrices reçoivent un lien de désabonnement avec `?email=%7B%7Bemail%7D%7D`.

**Correction** : Passer `email` en 2e paramètre : `_buildWelcomeEmailHtml(prenom, email)` et substituer par `${encodeURIComponent(email || '')}`.

---

### BUG 2 — `niveauStreak` jamais incrémenté automatiquement

**Fichier** : `sport-progression-logic.js` (défini) / `app.js` `validerSeanceDash()` (non appelé)

`updateNiveauStreak()` et `checkNiveauProgression()` sont définies dans `sport-progression-logic.js` mais ne sont **jamais appelées** dans `validerSeanceDash()`. La progression automatique de niveau (streak ≥ 9 séances → proposition de montée) est complètement inopérante.

**Correction** : Ajouter dans `validerSeanceDash()` après validation :
```js
if (typeof updateNiveauStreak === 'function') updateNiveauStreak(true);
if (typeof checkNiveauProgression === 'function') checkNiveauProgression();
```

---

### BUG 3 — `cycleStart` corrompu → `currentDay = NaN`

**Fichier** : `app.js` — fonction `computeCycle()`

Si `ST.cycleStart` vaut une string malformée (ex: `"null"` en string après un bug de sérialisation), `split('-').map(Number)` produit des NaN, le diff devient NaN, `currentDay` vaut NaN. L'affichage affiche "Jour NaN" et la détection de phase tombe en `automne` par défaut.

**Correction** : Ajouter en début de `computeCycle()` :
```js
if (!ST.cycleStart || !/^\d{4}-\d{2}-\d{2}$/.test(ST.cycleStart)) {
  ST.cycleStart = null; ST.currentDay = 1; ST.currentSaison = 'hiver'; return;
}
```

---

### BUG 4 — `repos: '—'` interprété comme 30 secondes de repos

**Fichier** : `app.js` — `_stParseDur()` + `sport-additions.js` (multiples lignes)

Dans `sport-additions.js`, les exercices sans repos utilisent `repos: '—'`. `_stParseDur('—')` ne matche aucun pattern → `parseInt('—') = NaN` → retourne 30 secondes par défaut. Ces exercices génèrent des étapes de repos de 30 secondes inattendues dans le timer.

**Correction** :
```js
// Dans _stParseDur() — en tête de fonction, avant tout autre test :
if (!str || str === '—' || str === '-' || str === 'aucun') return 0;
// Dans _stxBuildSteps — ignorer les étapes repos de durée 0 :
if (restSec > 0) steps.push({ type:'rest', duration: restSec });
```

---

## RISQUES ⚠️

| # | Risque | Probabilité | Impact |
|---|---|---|---|
| R1 | `installDate` null après localStorage corrompu → trial infini | Faible | Moyen |
| R2 | `installDate` dans le futur → trial affiché 0 jours en permanence | Très faible | Moyen |
| R3 | Hiver = 6j au lieu de 5j pour cycle 28j (`Math.round(28×0.20)=6`) | Certain | Faible |
| R4 | Arrondi mixte `Math.round`/`Math.floor` dans `phaseThresholds` | Certain | Faible |
| R5 | Footer bilan modal non mis à jour en temps réel après activation Premium | Faible | Très faible |
| R6 | Bips 3-2-1s sautés sur appareils très lents (<10fps) | Très faible | Très faible |
| R7 | `_stx.duration = 0` → arc SVG bloqué visuellement | Très faible | Faible |
| R8 | `ST.prenom` non sauvegardé entre step-0 et `enterApp()` | Faible | Faible |
| R9 | App en arrière-plan plusieurs étapes timer → étapes intermédiaires silencieusement sautées | Moyen | Moyen |

---

## CALCULS VALIDÉS ✅

1. `currentDay` = `Math.floor(diff / 86400000) + 1` — correct pour tous les fuseaux horaires (UTC-based)
2. `diff < 0` → `currentDay = 1` — protégé correctement
3. `phaseThresholds(n)` — formule correcte, résultats cohérents pour 28j (5-9-19-28)
4. `isTrial` = `daysSinceInstall <= 20` — correct
5. `daysLeft` = `20 - daysSinceInstall` — correct, jamais négatif (coupe en `<= 0`)
6. `getTodaySeanceSpec()` case hiver — downgrade fatiguée ✅ (ajouté session précédente)
7. `getTodaySeanceSpec()` case printemps — `planning[(currentDay-1) % 7]` correct
8. `getTodaySeanceSpec()` case été — `planning[(currentDay-1) % 7]` correct
9. `getTodaySeanceSpec()` case automne — `planning[(currentDay-1) % 7]` correct
10. Rotation recettes — `(currentDay - 1) % arr.length` — correct, pas de hors-limites
11. Rotation soins — même formule — correct
12. `validerSeanceDash()` — sauvegarde exercices validés, score, date — correct
13. `EVENING_RESPONSES` — sélection par checkin — correct
14. Bilan stats — `scoreTotal / nbJours` protégé `nbJours > 0` — correct
15. `computeNiveauSport()` — lookup `data.niveaux[level]` avec fallback — correct
16. Prières masquées Hiver — `prayersCard.style.display='none'` — correct
17. Timer RAF — `performance.now()` delta correct, pas de setInterval drift
18. Page Visibility recovery — `elapsed += _stx._hiddenAt diff` — correct
19. WakeLock acquire/release — patterns corrects
20. `welcomeEmailSent` persisté sur succès seulement — correct
21. Retry email après 30s — logique correcte
22. `cycleHistory` et `historiqueCycles` — lecture séparée correcte
23. `getSeanceEnrichie(phase, niveau)` — lookup dans SEANCES_ENRICHIES — correct

---

## INTERACTIONS DANGEREUSES

### ID1 — Changement de durée de cycle pendant timer actif
**Verdict** : Pas de crash. Les étapes sont construites une fois au démarrage dans `_stxBuildSteps`. La session est isolée de tout changement de phase/cycle. Comportement correct ✅

### ID2 — Activation Premium pendant rendu bilan
**Verdict** : Risque faible. `isPremium()` est lu en temps réel à chaque rendu. Le footer du modal bilan pourrait être désynchronisé si la modale est déjà ouverte, mais aucun crash. ⚠️

### ID3 — "Premier jour règles" pendant timer actif
**Verdict** : `firstDayRules()` change `ST.cycleStart` et `ST.currentSaison`, mais le timer est dans `_stx` indépendant. Pas de crash. Le dashboard se recalculera correctement à la fin de la séance. ✅

### ID4 — `installDate` postérieur à `cycleStart`
**Verdict** : Indépendants. `installDate` pour trial, `cycleStart` pour cycle. Aucune interaction. ✅

---

## NOTES SUR LA LISTE DE COURSES

La fonctionnalité "liste de courses" n'existe pas dans le code actuel. Les ingrédients sont affichés via `openRecipeModal()` sans agrégation ni déduplication. C'est une limitation par conception, pas un bug.

---

## CE QUI MANQUE POUR ATTEINDRE 10/10

1. **Corriger BUG 1-4** (actuellement -1.5 points)
2. **Validation JS de `cycleStart` < aujourd'hui** dans `computeCycle` (BUG 3 partiellement mitige R2)
3. **Unifier historique cycles** — `historiqueCycles` (max 4) vs `cycleHistory` (max 6) : choisir une structure
4. **Appeler `updateNiveauStreak` + `checkNiveauProgression`** dans `validerSeanceDash` (BUG 2)
5. **Test de régression timer** — mock `performance.now()` pour valider les formules de rattrapage arrière-plan

---

## SCORE DE CONFIANCE : 7.5/10

| Après corrections BUG 1-4 | Score prévu : **9/10** |
|---|---|
| Après unification historique + tests timer | Score prévu : **9.5/10** |
| Après test E2E complet multi-appareils | Score prévu : **10/10** |
