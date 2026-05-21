# Audit Objectifs — Refonte Onglet Objectifs
**Date** : 21 mai 2026 · **Fichiers** : data.js, app.js, index.html

---

## État actuel — Problèmes détectés

| Code | Composant | Problème |
|------|-----------|---------|
| OBJ-01 | `WEEKLY_OBJECTIVES` | 5 objectifs fixes (bouger, eau, Coran, dormir, prières) — non adaptés à la phase |
| OBJ-02 | Rappel prières | "5 prières accomplies" proposé en phase Hiver → interdit (haidh) |
| OBJ-03 | Catégories | Absentes : maison, famille, apprentissage, projet, soin, croissance |
| OBJ-04 | Checkin | Checkin fatiguée/calme n'influence pas les suggestions |
| OBJ-05 | Structure | 1 seule section (hebdo) → pas de navigation par catégorie |
| OBJ-06 | Perso | Input texte libre sans récurrence (today/phase/cycle/permanent) |
| OBJ-07 | UX | Pas de message d'encouragement adapté |

---

## Plan de refonte

### Nouvelles sections (3)

1. **"Pour toi aujourd'hui"** — 5 suggestions auto selon phase + checkin
   - Toujours 1 spiritualité + 1 soin + 3 rotatives (maison/famille/apprentissage/projet/croissance)
   - Stable à la journée (seed = jours depuis epoch)
   - Checkin calme/fatiguée → suggestions phase Hiver même si Été
   - Jamais de rappel de prière en phase Hiver

2. **"Choisir mes objectifs"** — grille 7 catégories
   - 3 colonnes, badge compteur par catégorie
   - Modal par catégorie → liste complète pour la phase active
   - Cochage direct (même structure ST.weeklyObjChecks)

3. **"Mes objectifs perso" (Premium)** — saisie libre + récurrence
   - Select récurrence : Toujours / Ce cycle / Cette phase / Aujourd'hui
   - Migration backward compat : anciens strings → objets permanent
   - Bilan compte toujours via ST.weeklyObjChecks + ST.customObjChecks

### Nouvelles données (data.js)

- `OBJECTIFS_CATEGORIES` — 7 catégories avec icon + label
- `OBJECTIFS_PAR_PHASE` — 4 phases × 7 catégories × 3-5 objectifs

### Fonctions ajoutées (app.js)

| Fonction | Rôle |
|----------|------|
| `_getPhaseForSuggestions()` | Retourne phase effective (hiver si checkin calme/fatiguée) |
| `_getSuggestionsJour(phase)` | 5 suggestions stables au jour |
| `renderObjSummary()` | Carte résumé du jour |
| `renderSuggestionsJour()` | Section 1 |
| `renderCategoriesGrid()` | Section 2 — grille catégories |
| `openObjCatModal(catKey)` | Modal liste catégorie |
| `closeObjCatModal()` | Ferme modal |
| `_refreshCatModal(catKey)` | Refresh état coché modal |
| `renderObjPerso()` | Section 3 — objectifs perso |
| `addObjPerso()` | Ajout objectif perso avec récurrence |
| `toggleSuggestion(id)` | Toggle check phase suggestion |

### Fonctions supprimées (app.js)

- `WEEKLY_OBJECTIVES` const
- `renderWeeklyObjs()`
- `toggleWeeklyObj()`
- `addCustomObj()`

### Fonctions conservées (backward compat)

- `_getWeekKey()` (calendrier, bilan)
- `removeCustomObj()` (mis à jour format objet)
- `toggleCustomObj()` (inchangé)
- `ST.weeklyObjChecks` + `ST.customObjChecks` → `_bilanStats()` continue à compter

### Règles métier respectées

- ✅ Jamais de rappel de prière en phase Hiver
- ✅ Checkin calme/fatiguée → basculer sur suggestions Hiver
- ✅ Max 5 suggestions/jour → pas de surcharge
- ✅ Encouragement adapté au nombre d'objectifs cochés
- ✅ Section perso verrouillée (input) pour non-premium
- ✅ Migration automatique anciens objectifs perso (strings → objets)

---

*Audit réalisé par l'agent objectifs-cycliques — SakinApp*
