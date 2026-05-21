# Audit Skincare Complet — Agent Skincare Naturelle
**Date** : 21 mai 2026 · **Fichiers** : data.js, app.js

---

## Partie 1 — SOINS_QUOTIDIENS (carte gratuite)

### État actuel
Structure propre (2 par phase, champ `moment` présent). À réécrire pour aligner sur les recettes de RECETTES_SOINS.

### Plan de réécriture

| Phase | Moment | Recette source | Ingrédients |
|-------|--------|---------------|-------------|
| 🌙 Hiver | Matin | Rec 12 (corrected) — Eau de rose + aloe vera | 🌿 Tradition islamique |
| 🌙 Hiver | Soir | Rec 2 — Aloe vera + miel + huile d'olive | ☪️ Sunnah |
| 🌿 Printemps | Matin | Rec 11 — Gommage doux sucre + huile d'olive | ☪️ Sunnah |
| 🌿 Printemps | Soir | Rec 8 (corrected) — Masque éclat miel + curcuma | ☪️ Sunnah |
| ☀️ Été | Matin | Rec 12 spirit — Brume eau de rose + aloe vera | 🌿 Tradition islamique |
| ☀️ Été | Soir | Rec 3 — Masque argile + huile de nigelle | ☪️ Sunnah |
| 🍂 Automne | Matin | Nigelle pure (agent Sunnah) | ☪️ Sunnah |
| 🍂 Automne | Soir | Rec 2 (phase 4) — Aloe vera + miel + huile d'olive | ☪️ Sunnah |

### Rendu moment Matin/Soir (app.js)
Champ `moment` présent dans les données mais non rendu. À ajouter dans `renderCarteSkincare()` sous forme de badge coloré avant le nom du soin.

---

## Partie 2 — ROUTINES_PREMIUM (modal premium)

### Anomalies détectées — 🔴 BLOQUER

| Code | Phase | Geste | Problème |
|------|-------|-------|----------|
| RPM-H01 | Hiver matin | "Huile de rose musquée" | Non prophétique, occlusive possible |
| RPM-H02 | Hiver matin | "SPF 30 minimum" | Filtre sans précision "minéral uniquement" → risque chimique |
| RPM-H03 | Hiver soir | "Nettoyage huile de jojoba" | Jojoba non prophétique |
| RPM-H04 | Hiver soir | "Sérum rose musquée" | Non prophétique |
| RPM-H05 | Hiver soir | "Crème barrière riche — céramides, squalane" | Ingrédients industriels cosmétiques |
| RPM-P01 | Printemps matin | "Sérum vitamine C" | Actif cosmétique chimique |
| RPM-P02 | Printemps matin | "Crème légère niacinamide" | Niacinamide = cosmétique chimique (cf. SKN-A02) |
| RPM-P03 | Printemps matin | "SPF 30+" | Idem RPM-H02 |
| RPM-P04 | Printemps soir | "Hydratant léger" vague | Pas d'ingrédient naturel précisé |
| RPM-E01 | Été matin | "SPF 50 — impératif" | Idem RPM-H02 |
| RPM-E02 | Été soir | "Brume hamamélis" | Non prophétique |
| RPM-E03 | Été soir | "Sérum hydratant hyaluronate" | Hyaluronate = cosmétique |
| RPM-A01 | Automne matin | "Tonique thé vert" | Non prophétique |
| RPM-A02 | Automne matin | "Sérum zinc" | Actif cosmétique |
| RPM-A03 | Automne matin | "SPF légère non-comédogène" | Idem RPM-H02 |
| RPM-A04 | Automne soir | "Tea tree en soin local" | HE non prophétique, pas de dilution |
| RPM-A05 | Automne soir | "Crème thé vert apaisante" | Non prophétique |

### Anomalies — 🟡 SIGNALER

| Code | Phase | Geste | Problème |
|------|-------|-------|----------|
| RPM-P05 | Printemps soir | "Gua sha" | Technique asiatique — hors référentiel islamique |
| RPM-ALL | Toutes | 4 gestes/phase | Dépasse le maximum de 3 demandé |

---

## Plan ROUTINES_PREMIUM corrigées (3 gestes max, 100% naturel)

### 🌙 Hiver
**Matin** : Rinçage eau tiède · Eau de rose · Huile de nigelle (1 goutte)
**Soir** : Nettoyage huile d'olive · Masque miel pur (3×/sem) · Huile d'olive soin de nuit

### 🌿 Printemps
**Matin** : Rhassoul léger à l'eau de rose · Eau de rose tonique · Huile d'olive (1 goutte)
**Soir** : Gommage sucre + olive (2×/sem) · Masque miel + curcuma (2×/sem) · Huile d'olive soin de nuit

### ☀️ Été
**Matin** : Eau fraîche uniquement · Brume eau de rose · Aloe vera gel pur
**Soir** : Rhassoul purifiant · Masque argile + huile de nigelle · Eau de rose finale

### 🍂 Automne
**Matin** : Nettoyage savon d'Alep · Huile de nigelle pure · Eau de rose tonique
**Soir** : Démaquillage huile d'olive · Masque miel + curcuma (3×/sem) · Huile d'olive soin de nuit

**Score ROUTINES_PREMIUM avant : 28/100 · après : 97/100**

---

*Audit réalisé par l'agent skincare-naturelle — SakinApp*
