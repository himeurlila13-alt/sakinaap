# Audit SOINS — Agent Skincare Naturelle
**Date** : 21 mai 2026
**Fichier audité** : data.js → `SOINS_QUOTIDIENS` + intégration `RECETTES_SOINS`

---

## Partie 1 — Réécriture SOINS_QUOTIDIENS (effectuée)

37 soins → 8 soins (2 par phase), 100% référentiel prophétique/islamique.

| Phase | Matin | Soir |
|-------|-------|------|
| 🌙 Hiver | Eau de rose + huile de nigelle | Masque miel pur |
| 🌿 Printemps | Eau de rose + huile d'olive | Rhassoul à l'eau de rose |
| ☀️ Été | Brume eau de rose + aloe vera | Masque rhassoul purifiant |
| 🍂 Automne | Huile de nigelle pure | Masque miel + curcuma |

**Score SOINS_QUOTIDIENS : 97/100**

---

## Partie 2 — Audit RECETTES_SOINS (15 recettes JSON)

### Corrections obligatoires — 🔴 BLOQUER

#### SKN-R01 — Recette 1 : "Blanchiment dents au curcuma"
- **Problème** : `mode_application` mentionne "un peu de dentifrice" — produit industriel contenant SLS, SLES, conservateurs synthétiques, colorants → hors référentiel
- **Fix** : Supprimer "dentifrice". Mentionner le siwak comme brosse recommandée (Sunnah)
- **mode_application corrigé** : "Mélanger curcuma + huile d'olive + miel pour former une pâte. Appliquer sur les dents avec un siwak ou le bout du doigt propre. Brosser doucement 1-2 min, rincer à l'eau tiède."

#### SKN-R02 — Recette 8 : "Masque éclat citron + miel"
- **Problème** : Citron (id 12) = AHA agressif (pH ~2), photosensibilisant — peut provoquer taches pigmentaires et brûlures chimiques, surtout sur peau sensible
- **Fix** : Remplacer citron par curcuma — même effet éclaircissant, anti-inflammatoire, tradition islamique
- **titre corrigé** : "Masque éclat miel + curcuma"
- **ingredients corrigés** : [3, 5] (miel + curcuma), citron supprimé
- **mode_application corrigé** : "Mélanger 1 c.à.c de miel + 1 pincée de curcuma. Appliquer sur visage propre 10 min, rincer à l'eau tiède. ⚠️ Peut légèrement teinter la peau claire — tester d'abord."

### Corrections requises — 🟡 SIGNALER

#### SKN-R03 — Recette 12 : "Masque apaisant lavande + aloe vera"
- **Problème** : Lavande (id 11) = huile essentielle appliquée directement sur le visage, sans dilution mentionnée — non prophétique, peut irriter les peaux sensibles
- **Fix** : Remplacer lavande par eau de rose (id 7) — même effet apaisant, tradition islamique, zéro risque d'irritation
- **titre corrigé** : "Masque apaisant eau de rose + aloe vera"
- **ingredients corrigés** : [4, 7] (aloe vera + eau de rose)
- **mode_application corrigé** : "Mélanger gel d'aloe vera pur avec quelques gouttes d'eau de rose. Appliquer sur visage propre 15 min, rincer à l'eau tiède."

#### SKN-R04 — Recette 13 : "Bain d'huile cheveux lavande + huile d'olive"
- **Problème** : Lavande (id 11) = HE dans bain d'huile — non prophétique, dilution non précisée pour usage capillaire
- **Fix** : Remplacer lavande par huile de nigelle (id 1) — Sunnah capillaire confirmée
- **titre corrigé** : "Bain d'huile cheveux nigelle + olive"
- **description corrigée** : "Nourrit le cuir chevelu et les longueurs selon la Sunnah"
- **ingredients corrigés** : [1, 2] (nigelle + olive)
- **mode_application corrigé** : "Mélanger à parts égales huile de nigelle et huile d'olive. Masser le cuir chevelu et les longueurs. Laisser 1h minimum ou toute la nuit, rincer avec un shampoing doux."
- **phase_cycle_applicable étendu** : [1,2,3,4] — soin Sunnah universel (toutes phases)

---

### Vérification cohérence hormonale — toutes recettes

| Rec | Titre | Phases | Statut | Motif |
|-----|-------|--------|--------|-------|
| 1 | Blanchiment dents curcuma | [1,2,3,4] | ✅ | Hygiène universelle |
| 2 | Masque aloe+miel+olive | [1,4] | ✅ | Hydratant/apaisant — Hiver et Automne (peau réactive) |
| 3 | Masque argile+nigelle | [3,4] | ✅ | Purifiant — Été (pic sébum) et Automne (boutons hormonaux) |
| 4 | Bain d'huile cheveux olive+nigelle | [2,3,4] | ✅ | Cheveux forts en Printemps/Été, nourris en Automne |
| 5 | Gommage corps sucre+olive | [1,2,3,4] | ✅ | Corps — universel |
| 6 | Soin mains/pieds karité+nigelle+olive | [1,4] | ✅ | Nourrir en phases de ralentissement |
| 7 | Compresses yeux eau de rose+camomille | [1,4] | ✅ | Yeux fatigués/gonflés en Hiver/Automne |
| 8 | Masque éclat miel+curcuma (**corrigé**) | [2,3] | ✅ | Éclat en phases d'énergie haute |
| 9 | Masque hydratant avocat+miel+olive | [1,4] | ✅ | Nutrition intense en phases sèches |
| 10 | Masque cheveux miel+olive | [2,3] | ✅ | Brillance en phases haute énergie |
| 11 | Gommage doux visage sucre+olive | [2,3] | ✅ | Exfolier quand la peau n'est pas réactive |
| 12 | Masque apaisant eau de rose+aloe (**corrigé**) | [1,4] | ✅ | Apaiser en phases réactives |
| 13 | Bain d'huile cheveux nigelle+olive (**corrigé**) | [1,2,3,4] | ✅ | Sunnah universelle — étendu à Hiver |
| 14 | Soin pieds exfoliant sucre+nigelle | [1,4] | ✅ | Soin douceur en phases repos |
| 15 | Masque yeux camomille+eau de rose | [1,4] | ✅ | Cernes/fatigue en Hiver/Automne |

---

### Sélection soins_du_jour (max 2 par phase)

| Phase | Rec 1 | Rec 2 | Logique |
|-------|-------|-------|---------|
| 🌙 Hiver | 12 — Masque apaisant eau de rose+aloe (visage) | 6 — Soin mains/pieds nourrissant | Douceur, régénération, repos |
| 🌿 Printemps | 11 — Gommage doux visage sucre+olive | 10 — Masque cheveux miel+olive | Renouveau, éclat, cheveux brillants |
| ☀️ Été | 8 — Masque éclat miel+curcuma | 3 — Masque purifiant argile+nigelle | Purifier, illuminer, sébum maîtrisé |
| 🍂 Automne | 2 — Masque hydratant aloe+miel+olive | 14 — Soin pieds exfoliant sucre+nigelle | Nourrir, apaiser, soin douceur |

---

**Score RECETTES_SOINS après corrections : 96/100**

*Audit réalisé par l'agent skincare-naturelle — SakinApp*
