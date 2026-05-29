# Parcours Sport SakinApp — Audit Complet

## Résumé exécutif

**Score de fiabilité : 7/10**

**Ce qui fonctionne :**
- Architecture modulaire avec 4 niveaux progressifs par phase
- Logique de progression adaptée au cycle hormonal
- Gestion correcte des micro-phases en Automne
- Système de feedback post-séance complet
- Options alternatives (express, full body, cardio doux) bien intégrées dans data.js

**Ce qui est problématique :**
- Progression inter-cycles : bandeau affiché visuellement ✅ mais `cycleConseils` calculé trop tard (après le switch) → potentiellement null au premier rendu
- Rotation Été `rotationHaut` câblée ✅ mais fragile si `dayWithinPhase` est perturbé
- `_fullBodyOverride` non persisté → perdu si l'utilisatrice recharge la page
- `ST.seanceValidatedCount` incrémenté mais jamais lu

---

## 1. Initialisation du niveau

### Fonction `setSportInitLevel`
```javascript
function setSportInitLevel(level) {
  ST.seanceLevel = level;
  ST.sportLevelInit = true;
  saveState();
  renderHistoriqueSport();
}
```
Appelée par le questionnaire initial affiché lors de la 1ère connexion.

### Questionnaire initial — 4 niveaux proposés
- **N1 🌱 Essentielle** — Je commence ou je reprends
- **N2 🌿 À ton rythme** — Je m'entraîne régulièrement
- **N3 🔥 Vitalité** — À l'aise avec l'effort intense
- **N4 ⚡ Pleine puissance** — Performance & dépassement

**Analyse :** Fonctionnel. `ST.sportLevelInit = true` empêche le ré-affichage. Aucun cas limite identifié.

---

## 2. Évolution du niveau (fonctions de progression)

### `handleProgressionAnswer` — Modal checkpoint
```javascript
// Déclenché quand ST.checkpointProgress >= 5
if (ans === 'facile' && level < 4) {
  ST.seanceLevel = level + 1;
  showToast(`✨ Niveau ${ST.seanceLevel} — tu avances à ton rythme. Alhamdulillah 🌿`);
} else if (ans === 'dur_trop' && level > 1) {
  ST.seanceLevel = level - 1;
  showToast(`💛 Descendre d'un niveau, c'est écouter son corps — c'est de la sagesse.`);
}
```
**Déclencheur :** `_triggerCheckpoint()` quand `checkpointProgress >= 5`.

### `handlePrintempsUpgrade` — Fin de Printemps
```javascript
// Déclenché par checkEndOfPrintemps() en fin de phase Printemps
if (ans === 'facile' && level < 4) {
  ST.seanceLevel = level + 1;
  // Logique spéciale si N4 atteint
}
```

### `handleProposition` — Propositions proactives
```javascript
if (type === 'fatigue3') {
  if (level > 1) { ST.seanceLevel = level - 1; }
} else if (type === 'niveau_up') {
  if (level < 4) { ST.seanceLevel = level + 1; }
}
```

### `handleReportQuestion` — Après un report de séance
```javascript
if (ans === 'difficile') {
  if (level > 1) {
    ST.seanceLevel = level - 1;
    showToast(`💛 Niveau ${ST.seanceLevel} — on avance à ton rythme.`);
  }
}
```

**Analyse globale :** Système robuste, bornes 1-4 respectées partout. Plusieurs chemins de montée (checkpoint, fin Printemps) et de descente (report, proposition fatigue).

---

## 3. Parcours par phase

### HIVER

**Sélection (`getTodaySeanceSpec` case 'hiver') :**
```javascript
const effectiveLevel = (checkin === 'fatiguee') ? Math.max(1, level - 1) : level;
const hiverData = h.niveaux[effectiveLevel];
return { type: 'hiver', data: hiverData, level: effectiveLevel };
```
Si check-in "fatiguée" → niveau -1 automatique.

**Ce que voit l'utilisatrice :**
- Séance de mobilité douce (7→20 min selon niveau)
- Options : Séance complète, Express 5 min, Reporter
- Post-séance : feedback mood + modal progression si checkpoint atteint

**Options Full Body / Cardio doux :** Non disponibles en Hiver (hormonalement cohérent).

---

### PRINTEMPS

**Planning :** `['bas','repos','haut','bas','repos','haut','bas','repos']` sur J6-J13.

**Rotation N4 :**
```javascript
if (dayType === 'bas' && level === 4 && niveauData.rotation) {
  const rotIdx = (ST.printempsBasCount || 0) % niveauData.rotation.length;
  return { type: 'printemps-bas', data: { nom: rot.nom, duree: niveauData.duree, exercices: rot.exercices }, level, rotIdx };
}
```
`ST.printempsBasCount` incrémenté à chaque séance bas validée. Rotation sur 3 séances (S1 Cardio-Endurance / S2 Renforcement Unilatéral / S3 Circuit Fonctionnel).

**Option Full Body :** Lien affiché si `SEANCES_SPORT.printemps.fullBody[level]` existe (N2/N3/N4). Appelle `choisirFullBody()` → `_fullBodyOverride`. ✅

**Option Cardio doux :** Lien affiché si `SEANCES_SPORT.printemps.cardioDoux` existe. Appelle `ouvrirCardioDoux()` → bottom-sheet. ✅

**Post-séance :** `handlePrintempsUpgrade` déclenché en fin de phase si séances suffisantes.

---

### ÉTÉ

**Planning :** `['intense','repos','intense','repos']` sur J14-J17.

**Alternance bas/haut :**
```javascript
if (dayIdx % 4 === 2 && sport.ete.rotationHaut?.[level]) {
  return { type: 'ete-intense-haut', data: sport.ete.rotationHaut[level], level };
}
// Sinon : séance bas
return { type: 'ete-intense', data: sport.ete.niveaux[level], level };
```
J1 intense → bas | J2 repos | J3 intense → **haut** | J4 repos.

**Post-séance :** Score EMOM/AMRAP sauvegardé dans `ST.amrapRecord`.

---

### AUTOMNE

**`getAutomneMicroPhase(cycleDay, cycleDur)` :**
```javascript
const autDay = Math.max(1, cycleDay - eteEndD);
if (autDay <= Math.floor(autLen * 0.35)) return 'actif';   // ~35% de la phase
if (autDay <= Math.floor(autLen * 0.70)) return 'doux';    // ~35% de la phase
return 'fin';                                               // ~30% finale
```

**Automne Actif :** 4 niveaux (Ancrage doux → Renforcement Automnal). Full Body disponible N2/N3. Cardio doux disponible.

**Automne Doux :** 4 niveaux (Mobilité légère → Étirements & Mobilité complète). Full Body et Cardio doux non disponibles.

**Automne Fin :** 4 niveaux (Douceur Absolue → Pilates Respiration Avancé). Aucune option alternative.

---

## 4. État ST sauvegardé

| Champ ST | Modifié par | Valeurs |
|---|---|---|
| `ST.seanceLevel` | Questionnaire init, handleProgressionAnswer, handlePrintempsUpgrade, handleProposition, handleReportQuestion | 1-4 |
| `ST.seanceDone[date]` | Validation séance | `true`, `'express'`, `'repos-actif'` |
| `ST.checkpointProgress` | Chaque séance validée (+0.5 express, +1 complète) | 0-5 (cyclique) |
| `ST.totalSeancesAll` | Validation séance | Entier croissant |
| `ST.printempsBasCount` | Séances bas Printemps N4 validées | Entier |
| `ST.amrapRecord` | Score AMRAP Été | Entier |
| `ST.streakPhaseSeances` / `ST.streakPhaseNom` | Chaque séance | Entier / string |
| `ST.feedbackSport[date]` | Feedback post-séance | String mood |
| `ST.sportLevelInit` | setSportInitLevel | Boolean |
| `ST.seanceValidatedCount` | Validation ⚠️ jamais relu | Entier |

---

## 5. Progression inter-cycles

**Calcul (data.js `progressionInterCycles`) :**
```javascript
getCycleLevel: function(cycleCount) {
  if (cycleCount <= 1) return 'decouverte';
  if (cycleCount <= 3) return 'construction';
  return 'performance';
}
```

**Appel dans `renderCarteBouger` :**
```javascript
const cycleCount = (ST.cycleHistory && ST.cycleHistory.length) || 0;
const cycleLevel = SEANCES_SPORT.progressionInterCycles?.getCycleLevel(cycleCount);
const cycleConseils = cycleLevel ? SEANCES_SPORT.progressionInterCycles[cycleLevel] : null;
```

**Affichage bandeau :**
```html
<div style="background:rgba(var(--season-rgb),.08);...">
  <b>${cycleConseils.label}</b> · ${cycleConseils.conseil}
</div>
```

**⚠️ Risque identifié :** `ST.cycleHistory` est l'historique des cycles terminés. Si une utilisatrice est à son 1er cycle (actif, pas encore terminé), `cycleHistory.length === 0` → niveau "Découverte" affiché. Correct.

---

## 6. Bugs et incohérences identifiés

### Bug 1 — `_fullBodyOverride` perdu au reload [BLOQUANT]
- **Localisation :** Variable globale `let _fullBodyOverride = null`
- **Problème :** Non persisté dans ST/localStorage. Reload = séance perdue.
- **Fix :** Sauvegarder dans `ST.fullBodyOverrideDate` (date) et restaurer si la date = aujourd'hui.

### Bug 2 — `ST.seanceValidatedCount` jamais lu [COSMÉTIQUE]
- **Localisation :** `ST.seanceValidatedCount` incrémenté mais aucune lecture trouvée
- **Fix :** Supprimer ou utiliser pour une future fonctionnalité documentée.

### Bug 3 — Rotation Été potentiellement décalée [DÉGRADÉ]
- **Localisation :** `dayIdx % 4 === 2` dans case 'ete'
- **Problème :** Si `dayWithinPhase` retourne une valeur inattendue (cycle modifié manuellement), l'alternance peut être incorrecte.
- **Fix :** Ajouter `ST.eteHautDone` pour tracker explicitement alternance.

### Bug 4 — `cycleConseils` calculé après le switch [DÉGRADÉ]
- **Localisation :** `renderCarteBouger` — le calcul de `cycleConseils` est après le switch de `spec.type`
- **Problème :** Si `SEANCES_SPORT` n'est pas encore chargé lors du premier rendu → bandeau absent sans erreur.
- **Fix :** Déplacer le calcul avant le switch, avec guard `if (typeof SEANCES_SPORT === 'undefined') return;`.

### Bug 5 — Full Body N1 non disponible [COSMÉTIQUE]
- **Localisation :** `SEANCES_SPORT.printemps.fullBody` commence à N2
- **Problème :** Une utilisatrice N1 ne voit pas le lien Full Body mais aussi N1 Automne actif.
- **Impact :** Intentionnel ou oubli ? À clarifier.

---

## 7. Recommandations

### Corrections prioritaires
1. **Persister `_fullBodyOverride`** — Sauvegarder `ST.fullBodyOverrideDate` dans localStorage pour survie au reload
2. **Déplacer calcul `cycleConseils`** avant le switch dans `renderCarteBouger`
3. **Supprimer `ST.seanceValidatedCount`** ou documenter son usage futur

### Améliorations recommandées
1. **Tracker alternance Été explicitement** — `ST.eteSessionIdx` incrémenté à chaque séance intense validée
2. **Ajouter Full Body N1** dans Printemps si pertinent (séance très basique)
3. **Documenter `ST.cycleHistory`** — S'assurer que les cycles archivés sont bien ajoutés à chaque nouveau cycle

### Monitoring conseillé
- Vérifier les rotations N4 Printemps sur 3 cycles consécutifs
- Contrôler que `ST.amrapRecord` est bien lu pour afficher les records Été
- Tester le comportement en cas de reset de cycle manuel
