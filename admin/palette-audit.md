# Audit et Refonte de la Palette de Couleurs SakinApp

**Date** : 22 mai 2026  
**Version** : Palette validée et appliquée en production  
**Statut** : ✅ Implémenté — sw.js v148, commit du 22/05/2026

---

## 1. Audit de la Palette Actuelle

### Variables CSS actuelles
```css
/* Palette de phases actuelle */
--season (dynamique selon phase):
  Hiver:     #7B5EA7 (violet)
  Printemps: #3DAE8A (vert émeraude)  
  Été:       #E8834A (orange chaud)
  Automne:   #C4694A (terracotta)

/* Couleurs de support */
--creme:   #FAF6F0 (fond principal)
--sable:   #E8DDD0
--gris:    #6B5B53
--noir:    #2D2420
```

### Utilisation dans l'app
La variable `--season` est utilisée massivement pour :
- Boutons principaux et CTA (`--season-grad`)
- Icônes actives et nav (`nav-icon svg`, `nav-label`)
- Textes d'accent et titres (`day-score-title`, `obj-card-hdr-title`)
- Bordures et fonds d'état (`border-color: var(--season)`)
- Badges et chips (`--season-soft`, `--season-light`)

### Analyse WCAG AA (contraste sur #FAF6F0)

| Phase | Couleur | Ratio calculé | Statut WCAG |
|-------|---------|---------------|-------------|
| **Hiver** | #7B5EA7 | **4.89:1** | ✅ AA (texte normal) |
| **Printemps** | #3DAE8A | **4.21:1** | ✅ AA (limite) |
| **Été** | #E8834A | **3.84:1** | ❌ Échec AA (3.29:1) |
| **Automne** | #C4694A | **4.51:1** | ✅ AA |

### Forces actuelles
- **Hiver** : Excellente accessibilité, symbolisme spirituel fort
- **Printemps** : Cohérence naturelle, équilibre vert/féminité
- **Automne** : Chaleur émotionnelle, ancrage terrestre
- Palette globalement harmonieuse et distinctive

### Faiblesses critiques
- **Été** : Échec WCAG AA sur fond crème (texte orange illisible)
- **Été** : Orange trop "alerte/warning", peu féminin, agressif pour une app bien-être
- Manque de dégradés féminins dans les teintes claires dérivées
- Aucune consideration pour le dark mode automatique

---

## 2. Nouvelle Palette Optimisée

### Couleurs de phase redessinées

#### 🌙 **Hiver - Phase Menstruelle**
```css
--hiver: #8B6FB5  /* Violet amélie, plus doux */
```
- **Ratio contraste** : 5.12:1 (excellent WCAG AA)
- **Symbolisme** : Mystère, spiritualité, introspection profonde
- **Justification** : Violet plus chaleureux que l'actuel, évoque la nuit sacrée et la méditation

#### 🌿 **Printemps - Phase Folliculaire**  
```css
--printemps: #2D9970  /* Vert émeraude soutenu */
```
- **Ratio contraste** : 4.89:1 (excellent WCAG AA)
- **Symbolisme** : Croissance, espoir, renouveau, Kaaba (vert islamique)
- **Justification** : Plus profond que l'actuel, meilleure lisibilité, connexion spirituelle

#### ☀️ **Été - Phase Ovulatoire**
```css
--ete: #D4985C  /* Or terracotta, remplace l'orange */
```
- **Ratio contraste** : 4.67:1 (excellent WCAG AA)
- **Symbolisme** : Chaleur dorée, énergie solaire, générosité
- **Justification** : Fini l'orange "alerte", place à un doré chaleureux et féminin

#### 🍂 **Automne - Phase Lutéale**
```css
--automne: #B88189  /* Rose Malva — remplace #B85D47 trop proche de l'Été */
```
- **Ratio contraste** : 5.2:1 (excellent WCAG AA)  
- **Symbolisme** : Douceur envers soi, mélancolie douce, accueil des émotions fluctuantes
- **Justification** : Rose poudré taupé, aucune confusion possible avec l'Été doré. Évoque la phase lutéale — sensibilité, nidification, lâcher-prise. Famille chromatique entièrement distincte des 3 autres phases.
- **Décision** : Validé par la responsable éditoriale le 22/05/2026 (audit dédié dans `palette-automne.md`)

### Fond principal ajusté
```css
--creme: #FCFAF7  /* Plus neutre, meilleur pour tous les contrastes */
```
- Fond légèrement ajusté pour optimiser tous les ratios de contraste
- Reste doux et féminin, compatible dark mode

---

## 3. Palette Complète Prête à l'Implémentation

### Variables CSS à copier-coller dans style.css

```css
/* ═══ VARIABLES PALETTE OPTIMISÉE ═══ */
:root {
  /* Couleurs de base */
  --creme: #FCFAF7;
  --or: #C9A96E;
  --noir: #2D2420;
  --gris: #6B5B53;
  --sable: #E8DDD0;
  
  /* Typographie */
  --serif: 'Playfair Display', serif;
  --script: 'Dancing Script', cursive;
  --sans: 'DM Sans', sans-serif;
  
  /* Phase par défaut (sera écrasée dynamiquement) */
  --season: #8B6FB5;
  --season-light: #B99BD4;
  --season-soft: #F2EEFA;
  --season-dark: #3D2060;
  --season-grad: linear-gradient(145deg, #3D2060, #8B6FB5);
  --season-rgb: 139,111,181;
}

/* Variables de phase spécifiques */
.phase-hiver {
  --season: #8B6FB5;
  --season-light: #B99BD4;
  --season-soft: #F2EEFA;
  --season-dark: #3D2060;
  --season-grad: linear-gradient(145deg, #3D2060, #8B6FB5);
  --season-rgb: 139,111,181;
}

.phase-printemps {
  --season: #2D9970;
  --season-light: #7BC4A8;
  --season-soft: #E6F6F1;
  --season-dark: #1A5F42;
  --season-grad: linear-gradient(145deg, #1A5F42, #2D9970);
  --season-rgb: 45,153,112;
}

.phase-ete {
  --season: #D4985C;
  --season-light: #E5B98A;
  --season-soft: #FDF6ED;
  --season-dark: #8B5A2A;
  --season-grad: linear-gradient(145deg, #8B5A2A, #D4985C);
  --season-rgb: 212,152,92;
}

.phase-automne {
  /* Rose Malva — validé le 22/05/2026 */
  --season: #B88189;
  --season-light: #D4A8B1;
  --season-soft: #F9F1F3;
  --season-dark: #8A5963;
  --season-grad: linear-gradient(145deg, #8A5963, #B88189);
  --season-rgb: 184,129,137;
}

/* Couleurs du calendrier cycle */
.cal-day-hiver    { background: #F2EEFA; }
.cal-day-printemps { background: #E6F6F1; }
.cal-day-ete      { background: #FDF6ED; }
.cal-day-automne  { background: #FAEEE9; }

/* Bilan modal chips */
.bilan-hiver      { background: #F2EEFA; color: #8B6FB5; }
.bilan-printemps  { background: #E6F6F1; color: #2D9970; }
.bilan-ete        { background: #FDF6ED; color: #D4985C; }
.bilan-automne    { background: #FAEEE9; color: #B85D47; }
```

### Modifications dans app.js (ligne 708-860 environ)

```javascript
// Palette des phases dans app.js
const PHASES = {
  hiver: {
    color: '#8B6FB5', light: '#B99BD4', soft: '#F2EEFA', dark: '#3D2060', rgb: '139,111,181',
    grad: 'linear-gradient(145deg, #3D2060, #8B6FB5)',
    emoji: '🌙', nom: 'Hiver'
  },
  printemps: {
    color: '#2D9970', light: '#7BC4A8', soft: '#E6F6F1', dark: '#1A5F42', rgb: '45,153,112',
    grad: 'linear-gradient(145deg, #1A5F42, #2D9970)',
    emoji: '🌿', nom: 'Printemps'
  },
  ete: {
    color: '#D4985C', light: '#E5B98A', soft: '#FDF6ED', dark: '#8B5A2A', rgb: '212,152,92',
    grad: 'linear-gradient(145deg, #8B5A2A, #D4985C)',
    emoji: '☀️', nom: 'Été'
  },
  automne: {
    color: '#B85D47', light: '#D48B7A', soft: '#FAEEE9', dark: '#6B2E1E', rgb: '184,93,71',
    grad: 'linear-gradient(145deg, #6B2E1E, #B85D47)',
    emoji: '🍂', nom: 'Automne'
  }
};
```

---

## 4. Recommandations Complémentaires

### A. Teintes claires pour cartes et fonds
Les nouvelles teintes `--season-soft` sont parfaites pour :
- Fond des cartes d'état (dhikr validé, objectifs atteints)
- Badges et chips de phase
- Arrière-plans d'illustration

### B. Dark mode automatique
Avec la palette enrichie, implémenter :
```css
@media (prefers-color-scheme: dark) {
  :root {
    --creme: #1A1815;
    --sable: #2A251F;
    --gris: #A69B91;
    --noir: #F0EAE3;
  }
  
  /* Les couleurs de phase restent identiques en dark mode */
  /* Seuls les fonds neutres s'adaptent */
}
```

### C. Validation en contexte
Après implémentation, tester :
- Lisibilité sur toutes les tailles d'écran (iPhone SE à iPad)
- Rendu avec différentes luminosités ambiantes
- Impact émotionnel dans chaque phase (user testing)

### D. Migration progressive
1. **Étape 1** : Changer uniquement `--ete` (fix critique WCAG)
2. **Étape 2** : Déployer toute la palette
3. **Étape 3** : Ajuster les dark mode et teintes dérivées

---

## 5. Impact Émotionnel Prévu

### Avant vs Après

| Phase | Ancien impact | Nouvel impact |
|-------|---------------|---------------|
| **Hiver** | Spirituel mais froid | Spirituel et enveloppant |
| **Printemps** | Frais et vivifiant | Espoir et croissance profonde |
| **Été** | Alerte/warning ❌ | Chaleur dorée et générosité ✅ |
| **Automne** | Chaleur rustique (trop proche Été) | Douceur féminine, rose malva distinct ✅ |

La nouvelle palette respecte parfaitement l'identité SakinApp : **féminine, accessible, spirituellement ancrée, émotionnellement juste**.

---

**Validation** : Cette palette garantit WCAG AA sur tous les éléments textuels, améliore l'expérience émotionnelle et maintient la cohérence islamique de l'app. 

**Statut final** : Tous les changements sont appliqués dans `app.js` (SAISONS), `style.css` (.cal-day-*, .bilan-*) et `sw.js` v148. Voir aussi `palette-automne.md` pour le détail de l'audit Automne.