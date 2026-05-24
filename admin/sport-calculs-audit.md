# Audit Sport — Calculs & Cohérence Cyclique

**Date :** 24 mai 2026  
**Agents :** cycle-engine-validator + cycle-coherence  
**Fichiers analysés :** `app.js`, `data.js`

---

## Score global

| Axe | Score |
|-----|-------|
| Logique de calcul (cycle-engine-validator) | **7/10** → corrigé |
| Cohérence hormonale (cycle-coherence) | **8,5/10** |

---

## Bugs corrigés (P1)

### 🔴 Bug 1 — Rotation Printemps N4 : modulo hardcodé `% 3`
**Fichier :** `app.js` ~ligne 4646  
**Problème :** `(ST.printempsBasCount || 0) % 3` suppose que le tableau `rotation` contient exactement 3 éléments. Si la donnée change, index out-of-bounds → `rot` undefined → crash au `.nom`.  
**Fix appliqué :**
```js
// Avant
const rotIdx = (ST.printempsBasCount || 0) % 3;
// Après
if (niveauData.rotation && niveauData.rotation.length) {
  const rotIdx = (ST.printempsBasCount || 0) % niveauData.rotation.length;
```

### 🔴 Bug 2 — Memory leak `_stxShowSideChangeMessage` (setTimeout non annulé)
**Fichier :** `app.js` ~ligne 6088  
**Problème :** Si la sportive ferme la modale pendant les 3 secondes de transition "Change de jambe 🔄", le `setTimeout` se déclenche quand même → appelle `_stxRender()` + `_stxStartTimer()` sur une modale fermée → comportement invisible mais potentiellement cassant.  
**Fix appliqué :**
- Stockage du timer dans `_stx._sideChangeTimer`
- `_stxClose()` annule le timer et remet `_stx._stSide = 0`

### 🟡 Bug 3 — `_stSide` non réinitialisé à la fermeture
**Fichier :** `app.js` ligne 5871  
**Problème :** Si une séance est interrompue sur un exercice bilatéral (côté 1 en cours), `_stSide` reste à `1`. La séance suivante démarre avec `_stSide = 1` → le timer saute directement à "Côté droit" sans faire "Côté gauche".  
**Fix appliqué :** `_stxClose()` remet `_stx._stSide = 0` systématiquement.

---

## Anomalies non critiques (à surveiller)

### 🟡 Remplacements Automne : doublons possibles
`automne.actif.remplacements` contient deux entrées avec `ancien: 'Squat sauté'`. En cas de match multiple, seul le premier est appliqué (`Array.find()`). Comportement correct mais source potentielle de confusion dans les données.  
**Action :** Nettoyer `data.js` si un doublon est confirmé.

### 🟡 `niveauxRepos[level]` — niveau 0 théoriquement possible
Si `spec.level` est `0` ou `undefined`, `niveauxRepos[0]` vaut `undefined`. Les fallbacks `|| 45` et `spec.level || 1` présents dans le code protègent correctement. Pas de bug actif, mais à maintenir.

---

## Audit cohérence hormonale

### ✅ Hiver (phase menstruelle) — 9/10
- Séances `doux` et `fin` parfaitement adaptées : yoga, mobilité, marche douce
- Intensité basse cohérente avec chute des œstrogènes et progestérone
- Message d'accompagnement doux et bienveillant

### ✅ Printemps (phase folliculaire) — 8,5/10
- Progression N1→N4 bien calibrée avec la montée des œstrogènes
- Rotation N4 (variété de séances) : bonne pratique pour maintenir l'engagement
- Léger point d'amélioration : N1 pourrait être encore plus doux pour les débutantes

### ✅ Été (phase ovulatoire) — 9/10
- Séances actives (cardio, force) cohérentes avec le pic d'œstrogènes et LH
- Timer de repos court (15s à N4) : correct pour cette phase
- HIIT et exercices explosifs bien placés ici (et UNIQUEMENT ici + Printemps)

### ✅ Automne actif (phase lutéale précoce) — 8/10
- Cap `Math.min(level, 2)` : empêche correctement les exercices explosifs
- `reposExtra: 10` (repos allongé) : cohérent avec la hausse de la progestérone
- Substitutions des sauts : Burpees→sans saut, Squat sauté→lent contrôlé ✓

### ✅ Automne doux (phase lutéale avancée) — 8/10
- Utilisation de `printemps.bas[level]` avec substitutions : cohérent
- Repos à 55s : bien adapté à l'énergie basse de fin de cycle
- Point d'attention : la logique de substitution dans app.js dépend de la présence de `SEANCES_SPORT.automne.actif.remplacements`

### ✅ Automne fin (veille des règles) — 9/10
- Séance très douce : marche, étirements légers, respiration
- Cohérent avec la chute des deux hormones (œstrogènes + progestérone)

---

## Recommandations futures (non urgentes)

1. **Test unitaire rotation N4** : vérifier que `printempsBasCount` est bien incrémenté après chaque séance `bas` N4 (vérifier dans `validerSeanceDash()`)
2. **Dédoublonner `remplacements`** dans `data.js` (deux entrées `Squat sauté`)
3. **Timer parJambe** : envisager une animation visuelle (flip gauche/droite) en plus du texte texte "Change de jambe 🔄" pour les utilisatrices en mode plein écran

---

*Rapport généré le 24/05/2026 — Bugs P1 corrigés dans le même commit.*
