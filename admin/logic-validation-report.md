# Rapport de validation logique — SakinApp
**Date :** 2026-05-15
**Score global : 7.5/10**

---

## Résumé

| # | Calcul | Statut | Détail |
|---|---|---|---|
| 1 | Jour du cycle | ✅ OK | Calcul local sûr, guards présents |
| 2 | Phase (saison) | ⚠️ Risque | `eteStartFinal` redondant, 4 recalculs indépendants non mutualisés |
| 3 | Trial (période d'essai) | ❌ Bug | `getTrialDays()` peut retourner négatif si horloge déréglée |
| 4 | Progression sport | ✅ OK | Plafond 4 respecté, guards NaN systématiques |
| 5 | Bilan modal | ✅ OK | Divisions protégées, guard `histCycles.length === 0` actif |
| 6 | Historique cycles | ✅ OK | Fix "moyenne cycles passés uniquement" confirmé correct |
| 7 | Calculs cachés | ⚠️ Risque | `objCheckCount` non filtré par cycle, calendrier phases avant cycleStart incorrect |

---

## ✅ Calculs validés

### 1. Calcul du jour du cycle (`computeCycle`)

Formule effective (dates locales pour protection DST) :
```js
const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());
const [sy, sm, sd] = ST.cycleStart.split('-').map(Number);
const startLocal = new Date(sy, sm - 1, sd);
const diff = Math.floor((todayLocal - startLocal) / (1000 * 60 * 60 * 24));
```

| Cas | Résultat | Attendu | Statut |
|---|---|---|---|
| cycleStart = aujourd'hui | diff=0 → jour 1 | 1 | ✅ |
| cycleStart = hier | diff=1 → jour 2 | 2 | ✅ |
| cycleStart dans le futur | diff<0 → guard retourne jour 1, saison hiver | sécurisé | ✅ |
| cycleStart = null | guard `if (!ST.cycleStart)` en première ligne | sécurisé | ✅ |
| Jour > cycleDuration | `Math.min(day, dur)` borne à dur | sécurisé | ✅ |

### 2. Calcul des phases — bornes sur cycle 28j

| Phase | Bornes calculées | Logique |
|---|---|---|
| Hiver | J1–J5 | `hiverDays = Math.min(5, Math.max(3, round(28*0.18))) = 5` |
| Printemps | J6–J11 | `springStartD = 6`, `eteStart = max(8, ovulationDay-2) = 12` → J6–J11 |
| Été | J12–J16 | `ovulationDay = max(9, 28-14) = 14`, eteEnd = 16 |
| Automne | J17–J28 | Remainder |

Testé sur cycles 24j et 35j : phases correctement recalculées.

### 4. Progression sport
- Plafond niveau 4 : toutes les mutations vérifient `level < 4` avant incrément ✅
- Descente : guard `level > 1` ✅
- `ST.seanceLevel || 1` appliqué systématiquement ✅

### 5. Bilan modal — divisions
- `histCycles.length` vérifié par guard `if (!histCycles.length) return ''` avant tout calcul ✅
- `avgDur` : `allDurations` contient toujours ≥ 1 élément ✅
- `avgRegles` : atteint uniquement si `histCycles.length > 0` ✅

### 6. Historique cycles (fix récent confirmé)
```js
// renderCycleHistory — CORRECT
const pastDurs = all.filter(c => !c.current).map(c => Number(c.duration) || 28);
const avg = pastDurs.length > 0
  ? Math.round(pastDurs.reduce((a, b) => a + b, 0) / pastDurs.length)
  : durs[0] || 28;

// renderPatterns — CORRECT
const avg = pastDurations.length > 0
  ? Math.round(pastDurations.reduce((a, b) => a + b, 0) / pastDurations.length)
  : ST.cycleDuration || 28;
```
Les deux divisions sont protégées. Maximum 4 cycles manuels : guard `>= 4` actif ✅

---

## ❌ Bugs confirmés

### Bug #1 — `getTrialDays()` retourne un entier négatif

**Fichier : app.js — fonction `getTrialDays()`**

**Problème :**
```js
// CODE ACTUEL — BUGUÉ
function getTrialDays() {
  if (!ST.installDate) return 0;
  return Math.floor((Date.now() - ST.installDate) / 86400000);
}
```

**Cas déclencheur :** Horloge système avancée lors de l'installation, puis recalée → `Date.now() < ST.installDate` → résultat négatif.

**Impact :**
- `isFullAccess()` = `getTrialDays() < 20` = `négatif < 20` = **true** → accès Premium gratuit permanent
- `renderTrialCard()` : affiche `20 + N` jours restants (erroné)
- `showBilanModal` : `joursSuivis` peut devenir négatif si `ST.currentDay` est falsy

**Code corrigé :**
```js
function getTrialDays() {
  if (!ST.installDate) return 0;
  return Math.max(0, Math.floor((Date.now() - ST.installDate) / 86400000));
}
```

---

### Bug #2 — Calendrier : phases incorrectes pour dates antérieures au cycleStart

**Fichier : app.js — fonction `renderCalendar()`**

**Problème :**
```js
// CODE ACTUEL — BUGUÉ
const diff = Math.floor((date - startLocal) / 86400000);
const dayOfCycle = ((diff % dur) + dur) % dur;  // diff négatif → cycle précédent approximé
phase = phaseForDay(dayOfCycle + 1, dur);
```

**Cas déclencheur :** Tout jour du calendrier précédant la date de `cycleStart`. `diff` est négatif, la formule modulo retourne un jour du cycle précédent fictif, coloriant la date avec une phase potentiellement incorrecte.

**Impact :** Non crashant. Les cases du calendrier avant le début du cycle affichent une couleur de phase calculée à partir d'un cycle précédent estimé plutôt qu'une couleur neutre.

**Code corrigé :**
```js
const diff = Math.floor((date - startLocal) / 86400000);
if (diff < 0) {
  phase = null; // pas de phase pour les jours avant le cycleStart
} else {
  const dayOfCycle = (diff % dur) + 1;
  phase = phaseForDay(dayOfCycle, dur);
}
```

---

## ⚠️ Risques identifiés (non bloquants)

### Risque A — `objCheckCount` non filtré par cycle actuel

**Ligne ~1074 :** `objCheckCount` totalise tous les objectifs cochés depuis le début de l'application (pas uniquement le cycle en cours), contrairement aux autres stats (`seanceCount`, `prayerDays`) qui utilisent `inCycle()`. Le bilan affiche un cumulatif, pas le total du cycle — incohérent avec les autres métriques.

### Risque B — `eteStartFinal` redondant

Dans `computeCycle` : `eteStartFinal = Math.max(springStartD + 2, eteStart)` où `eteStart = Math.max(springStartD + 2, ovulationDay - 2)` → les deux expressions sont toujours identiques. Variable inutile, source de confusion.

### Risque C — 4 recalculs indépendants des seuils de phase ⚠️ PRINCIPAL

La formule `ovulationDay / eteStart / eteEnd` est recopiée dans :
- `computeCycle` (calcul principal)
- `renderCycle` (affichage anneau)
- `phaseForDay` (calendrier)
- `drawCycleRing`
- `checkEndOfPrintemps`

Toute modification d'une copie sans les autres désynchronise l'anneau graphique, la phase calculée et le calendrier.

**Recommandation :** Extraire `computePhaseThresholds(dur)` retournant `{hiverEnd, springStartD, eteStartFinal, eteEndFinal}` et l'appeler partout.

### Risque D — `installDate` stocké en timestamp ms (hétérogène)

Tous les autres champs date sont des chaînes ISO `"YYYY-MM-DD"`. `installDate` est un timestamp ms `Date.now()`. Cohérent avec son usage mais peut induire des erreurs si comparé accidentellement à un champ ISO.

---

## Score : 7.5/10

**Points forts :** Calcul jour cycle robuste (DST-safe), phases biologiquement correctes sur 24/28/35j, fix historique cycles déployé et validé, toutes les divisions par count protégées.

**Points faibles :** Bug trial (1 ligne), calendrier phases avant cycleStart, 4 copies indépendantes des seuils de phase, objCheckCount cumulatif.
