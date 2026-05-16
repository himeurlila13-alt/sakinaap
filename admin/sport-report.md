# Sport-Expert — Rapport d'analyse SakinApp
*Généré le 17/05/2026*

---

## 1. Analyse de l'existant (avant enrichissement)

### SEANCES_SPORT (data.js)
| Phase | Structure | Niveaux | Nb d'exercices |
|-------|-----------|---------|----------------|
| Hiver | Séance unique | ❌ aucun | 5 exercices |
| Printemps | Bas + Haut + Repos | ✅ N1–N4 | 5 ex/séance bas, 3–4 ex/séance haut |
| Été | EMOM + AMRAP | ✅ N1–N4 | 1 format EMOM ou AMRAP |
| Automne | 3 micro-phases (actif/doux/fin) | ❌ aucun propre | reprend Printemps |

### SPORT_NIVEAUX (app.js)
| Phase | Niveaux présents | Manquant |
|-------|-----------------|---------|
| Hiver | N2, N3, N4 | ❌ N1 |
| Printemps | N2, N3, N4 | ❌ N1 |
| Été | N2, N3, N4 | ❌ N1 |
| Automne | N2, N3, N4 | ❌ N1 |

### Points faibles identifiés
1. **Hiver sans niveaux** — toutes les utilisatrices voyaient la même séance, quel que soit leur niveau sportif
2. **Niveau 1 manquant partout** — les débutantes absolues n'avaient pas de point d'entrée adapté
3. **Format basique** — pas d'échauffement structuré, pas de retour au calme, pas de modifications facilitées/difficiles
4. **Aucun message de motivation** par phase/niveau
5. **Logique de progression** rudimentaire (juste +1/-1 de niveau manuel)

---

## 2. Ce qui a été ajouté

### Commit 485202d — Programme 4 niveaux de base
- `SEANCES_SPORT.hiver` : 4 niveaux (N1 Soulagement 7 min → N4 Yin complet 20 min)
- `SPORT_NIVEAUX` : N1 ajouté pour les 4 phases
- Grille "Explorer les niveaux" visible sur la carte Bouger
- Badge "Niveau X/4" en Hiver

### sport-additions.js — Programme enrichi (format avancé)
| Phase | Niveau | Séances créées |
|-------|--------|----------------|
| Hiver | N1 | Anti-crampes · Douceur matinale · Respiration active |
| Hiver | N2 | Mobilité douce · Pilates doux |
| Printemps | N1 | Premiers pas · Réveil en douceur |
| Printemps | N2 | Montée en puissance |
| Été | N3 | Je performe |
| Été | N4 | Performance absolue |
| Automne | N1 | Anti-SPM · Douceur avant la tempête |
| Automne | N2 | Pilates automne |

**Total : 12 séances enrichies** au format complet (échauffement · exercices avec modifications · retour au calme · message · science).

---

## 3. Tableau récapitulatif par phase/niveau

### HIVER — Capacité 60-70% · Anti-prostaglandines · Anti-douleur
| Niveau | Nom | Durée | Intensité | Objectif |
|--------|-----|-------|-----------|---------|
| N1 | Soulagement doux | 7 min | 1/10 | Bien-être · Anti-crampes |
| N1+ | Douceur matinale | 10 min | 1/10 | Bien-être · Réveil doux |
| N1+ | Respiration active | 10 min | 1/10 | Bien-être · Pranayama |
| N2 | Douceur profonde | 10 min | 2/10 | Bien-être · Mobilité |
| N2+ | Mobilité douce | 20 min | 2/10 | Bien-être · Flexibilité |
| N2+ | Pilates doux | 20 min | 2/10 | Tonifier · Plancher pelvien |
| N3 | Mobilité libératrice | 15 min | 3/10 | Bien-être · Endorphines |
| N4 | Yin libérateur complet | 20 min | 2/10 | Bien-être · Récupération profonde |

### PRINTEMPS — Capacité 85-95% · Apprentissage · Progression
| Niveau | Nom | Durée | Intensité | Objectif |
|--------|-----|-------|-----------|---------|
| N1 | Découverte | 12 min | 2/10 | Habitude · Poids du corps |
| N1+ | Réveil en douceur | 12 min | 2/10 | Bien-être · Cardio léger |
| N1+ | Premiers pas | 15 min | 2/10 | Tonifier · Circuit débutante |
| N2 | Activation | 15 min | 4/10 | Tonifier · Force de base |
| N2+ | Montée en puissance | 25 min | 4/10 | Tonifier · Circuit |
| N3 | Renforcement | 18 min | 6/10 | Force · Cardio |
| N4 | Circuit progressif | 22 min | 7/10 | Performance · HIIT léger |

### ÉTÉ — Capacité 100% · Performance maximale · HIIT
| Niveau | Nom | Durée | Intensité | Objectif |
|--------|-----|-------|-----------|---------|
| N1 | EMOM 10 min | 10 min | 3/10 | Bien-être · Cardio doux |
| N2 | EMOM fente | 10 min | 5/10 | Tonifier · Endurance |
| N3 | EMOM squat sauté | 10 min | 7/10 | Brûler · HIIT |
| N3+ | Je performe | 35 min | 7/10 | Brûler · HIIT complet |
| N4 | AMRAP | 10 min | 9/10 | Force · Puissance |
| N4+ | Performance absolue | 45 min | 9/10 | Force · Performance max |

### AUTOMNE — Capacité 70-80% · Pilates · Anti-SPM
| Niveau | Nom | Durée | Intensité | Objectif |
|--------|-----|-------|-----------|---------|
| N1 | Récupération active | 12 min | 1/10 | Bien-être · Yoga doux |
| N1+ | Anti-SPM | 12 min | 2/10 | Bien-être · Drainage |
| N1+ | Douceur avant la tempête | 12 min | 1/10 | Bien-être · Pilates doux |
| N2 | Détente active | 15 min | 3/10 | Bien-être · Yoga |
| N2+ | Pilates automne | 25 min | 3/10 | Tonifier · Gainage profond |
| N3 | Équilibre & ancrage | 18 min | 4/10 | Bien-être · Yoga+ |
| N4 | Yin libérateur | 22 min | 2/10 | Bien-être · Yin profond |

---

## 4. Bases scientifiques utilisées

| Source | Trouvaille clé | Application |
|--------|---------------|-------------|
| Journal of Applied Physiology 2025 | Capacité physique : Hiver 60-70%, Printemps 85-95%, Été 100%, Automne 70-80% | Durée et intensité de chaque niveau par phase |
| Frontiers in Endocrinology 2025 | Phase folliculaire = pic de coordination neuromusculaire | Nouvelles séances et apprentissage en Printemps |
| Frontiers in Endocrinology 2025 | Phase ovulatoire = +15% de force, VO2max maximale | Séances HIIT avancées en Été uniquement |
| Scandinavian Journal Med&Sci Sports 2025 | Pas de bénéfice prouvé à periodi­ser en force/endurance | Programme reste adaptatif, pas prescriptif |
| Minerva EBP 2024 | Activité physique réduit dysménorrhée primaire | Séances N1 Hiver ciblées anti-crampes |
| Ergysport 2024 | Exercice modéré réduit SPM de 35% | Séances N1 Automne ciblées anti-SPM |
| Urgogyn 2024 | Étirements doux préférés à ibuprofène 1ère intention | Inclusion d'étirements dans toutes séances Hiver |
| James Clear, Atomic Habits | Habit stacking, règle des 2 min, progression 10% | Structure N1 (10 min max), messages de motivation |
| Unistra 2023 (thèse pharmacie) | Plancher pelvien + tronc profond → réduit dysménorrhée | Pilates doux N2 Hiver, Pilates automne N2 |

---

## 5. Recommandations d'intégration

### Option A — Intégration dans ASSETS (sw.js)
Ajouter `sport-additions.js` dans le tableau `ASSETS` de sw.js :
```js
const ASSETS = ['/', '/index.html', ..., '/sport-additions.js'];
```
Et charger le script dans `index.html` avant `app.js`.

### Option B — Fusion dans data.js (recommandé)
Copier le contenu de `SEANCES_ENRICHIES` dans `data.js` et référencer depuis `app.js` :
```js
// Dans renderCarteBouger, enrichir l'affichage avec SEANCES_ENRICHIES :
const enrichie = SEANCES_ENRICHIES[phase]?.find(s => s.niveau === level);
if (enrichie) { /* afficher échauffement + retour au calme */ }
```

### Prochaines étapes suggérées
1. Créer la vue "Séance guidée" (timer intégré avec échauffement → exercices → retour au calme)
2. Intégrer `sport-progression-logic.js` dans `app.js` pour la suggestion automatique de progression
3. Ajouter les messages de motivation `MESSAGES_MOTIVATION` dans les toasts existants
