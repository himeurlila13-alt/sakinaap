# Audit logique — Calculs & algorithmes de app.js
**SakinApp · Audit du 2026-05-14**

---

## TABLEAU RÉCAPITULATIF

| # | Sévérité | Fonction | Description |
|---|----------|----------|-------------|
| 1 | ❌ BUG | `computeCycle()` | `hiverEnd` d'un cycle précédent peut bloquer toutes les phases en Hiver |
| 2 | ⚠️ | `computeCycle()` | Aucune protection si `cycleDuration <= 0` (division par zéro) |
| 3 | ⚠️ | `computeCycle()` | `cycleStart` null → state par défaut (`'printemps'`) potentiellement faux |
| 4 | ❌ BUG | `checkPropositionsAmelioration()` / `handleFeedbackSport()` | Tri alphabétique au lieu de chronologique — `last5` / `last3` incorrects |
| 5 | ⚠️ | `computeCycle()` | `_proposeNewEx5` et `seanceSurpriseShownCycle` non réinitialisés au nouveau cycle |
| 6 | ⚠️ | `_bilanStats()` | Fenêtre 30j, pas le cycle courant — stats biaisées pour cycles < 20j ou > 30j |
| 7 | ⚠️ | `showBilanModal()` | Fallback arbitraire à 20 jours si `cycleStart` null |
| 8 | 💡 MANQUANT | `startNewCycleToday()` | Snapshot des stats du cycle terminé absent dans `cycleHistory` |
| 9 | ❌ BUG | `restoreFeedback()` | Parsing `new Date(cycleStart)` en UTC — décalage ±1 jour en Europe |
| 10 | ⚠️ | `showNomDuJour()` | `dayOfYear` négatif si horloge système avant 2024 → `undefined` |
| 11 | ⚠️ | `renderHistoriqueSport()` | `nextCp` surestimé si `checkpointProgress` est un float |
| 12 | ⚠️ | Toutes fonctions séances | Clés `toDateString()` — fragilité future |
| 13 | ⚠️ | `validerSeanceDash()` | `checkpointProgress` croît indéfiniment dans le localStorage |

---

## DÉTAIL DES BUGS

### ❌ BUG 1 — `hiverEnd` caduc bloque toutes les phases en Hiver
**`computeCycle()` — lignes ~845-849**

Si une donnée corrompue arrive avec un `hiverEnd` d'un cycle précédent (`hiverEndDiff > dur`), alors `springStartD > dur` et toutes les phases sont classées `'hiver'` pour tout le cycle.

```js
// Corrigé :
if (ST.hiverEnd && ST.cycleStart) {
  const hiverEndDiff = Math.floor((hiverEndLocal - startLocal) / (1000 * 60 * 60 * 24));
  if (hiverEndDiff > 0 && hiverEndDiff < dur) { // GUARD AJOUTÉ
    springStartD = Math.max(2, hiverEndDiff + 1);
  }
}
```

---

### ❌ BUG 4 — Tri alphabétique au lieu de chronologique
**`checkPropositionsAmelioration()` ~l.2118 et `handleFeedbackSport()` ~l.2108**

`done.sort()` trie les chaînes `toDateString()` alphabétiquement ("Fri" avant "Mon") → les 5 dernières séances sont incorrectes → propositions d'amélioration déclenchées à tort.

```js
// Corrigé :
const last5 = done
  .map(d => ({ d, t: new Date(d).getTime() }))
  .filter(o => !isNaN(o.t))
  .sort((a, b) => a.t - b.t)
  .slice(-5)
  .map(o => o.d);
```

---

### ❌ BUG 9 — Parsing UTC dans `restoreFeedback()`
**`restoreFeedback()` — ligne ~3767**

`new Date('2026-05-14')` est parsé UTC minuit. Sur UTC+2, à 01h30, `daysSince` est décalé de +1 → section feedback affichée un jour trop tôt.

```js
// Corrigé :
const [sy, sm, sd] = ST.cycleStart.split('-').map(Number);
const startLocal = new Date(sy, sm - 1, sd);
const daysSince = Math.floor((Date.now() - startLocal) / 86400000);
```

---

## CAS LIMITES

### ⚠️ CAS 2 — `cycleDuration <= 0`
```js
const dur = Math.max(20, Math.min(60, ST.cycleDuration || 28));
```

### ⚠️ CAS 3 — `cycleStart` null → état neutre
```js
if (!ST.cycleStart) {
  ST.currentDay = 1;
  ST.currentSaison = 'hiver'; // neutre au lieu du défaut 'printemps'
  return;
}
```

### ⚠️ CAS 5 — Flags non réinitialisés au nouveau cycle
```js
// Dans le bloc détection nouveau cycle :
ST._proposeNewEx5 = false;
ST.seanceSurpriseShownCycle = false;
```

### ⚠️ CAS 10 — `dayOfYear` négatif dans `showNomDuJour()`
```js
const dayOfYear = Math.abs(Math.floor((new Date() - new Date(2024, 0, 1)) / 86400000));
const nom = ASMA[dayOfYear % 99] || ASMA[0];
```

---

## CALCUL MANQUANT

### 💡 CAS 8 — Snapshot stats dans `cycleHistory`
```js
// Dans startNewCycleToday() AVANT d'archiver :
if (ST.cycleStart) {
  const stats = _bilanStats();
  ST.cycleHistory.unshift({
    start: ST.cycleStart,
    duration: ST.cycleDuration || 28,
    seanceCount: stats.seanceCount,
    prayerDays: stats.prayerDays,
    symptomDays: stats.symptomDays,
  });
}
```

---

## PRIORITÉS DE CORRECTION

1. **❌ P1** — CAS 4 : tri chronologique (`checkPropositionsAmelioration` + `handleFeedbackSport`)
2. **❌ P2** — CAS 9 : parsing local dans `restoreFeedback()`
3. **❌ P3** — CAS 1 : guard `hiverEndDiff < dur` dans `computeCycle()`
4. **⚠️ P4** — CAS 5 : réinitialiser `_proposeNewEx5` + `seanceSurpriseShownCycle`
5. **💡 P5** — CAS 6 + 8 : filtrer `_bilanStats()` sur le cycle courant + enrichir `cycleHistory`
