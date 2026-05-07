# SakinApp — Rapport Design & UX
*Agent design-reviewer · 2026-05-06*

---

## 1. PSYCHOLOGIE FÉMININE & ÉMOTIONS

### ✅ Ce qui fonctionne
- **Wording chaleureux** : "As-salamu alaykum", "Comment tu vas vraiment, ce matin ?", "Sakina t'écoute" — le ton est bienveillant et non culpabilisant
- **Micro-félicitations présentes** : "Alhamdulillah — séance accomplie 🌸", "Masha'Allah — les 5 prières accomplies. Que Allah accepte." — parfait
- **Check-in humeur 5 options** : inclut "Ma foi est en bas" et "Mon coeur a besoin de calme" — couvre des états émotionnels et spirituels rares dans les apps wellness
- **Check-in soir** : "Sakina t'écoute" + invocation + "Bonne nuit" — cohérent avec l'identité musulmane

### ⚠️ Approximatif
- **"Mes menstrues ont commencé aujourd'hui"** — clinique pour une app warmth-first. L'app appelle Hiver la phase des règles : pourquoi ne pas écrire "Mon Hiver a commencé aujourd'hui 🌙" ?
- **Titre "MON JOUR"** sur la score-card : froid et sec. Manque d'un emoji ou d'un wording plus intime
- **Pas de bienvenue à l'entrée d'une nouvelle phase** — quand le cycle passe de Hiver à Printemps, rien ne le célèbre

### ❌ Manquant
- **Animation de célébration visuelle** : quand "Séance accomplie" est tapé, il y a `qs-done-wrap` qui s'affiche mais aucune animation burst/confetti — c'est le moment émotionnel le plus fort de la journée et il est sous-exploité
- **Feedback visuel fort sur objectifs** : cocher un objectif donne juste un fond `--season-soft` — pas de micro-animation de récompense

---

## 2. TENDANCES DESIGN WELLNESS 2025

### ✅ Ce qui fonctionne
- **Système couleurs par phase** : les 4 CSS vars `--season`, `--season-light`, `--season-soft`, `--season-grad` changent dynamiquement via `setProperty` — sophistiqué et rare dans les apps mobile
  - Hiver : `#7B5EA7` (violet profond)
  - Printemps : `#3DAE8A` (vert tendre)
  - Été : `#E8834A → #F5C040` (gradient orange-or)
  - Automne : `#C4694A` (terracotta)
- **Gradients doux** : `linear-gradient(145deg, #3D2060, #7B5EA7)` — direction angulaire non-standard, moderne
- **Coins arrondis** : cards 20px, hero 24px, inputs 16px — au-dessus des standards
- **Ombres douces** : `box-shadow: 0 2px 12px rgba(45,36,32,.06)` — couleur brune plutôt que noire, plus féminin

### ⚠️ Approximatif
- **Fond identique `--creme:#FAF6F0`** quelle que soit la phase — l'app se "recolorie" en accent mais le fond reste le même, opportunité manquée d'ambiance immersive
- **Home-message-band** : `background: var(--season-soft)` est très pâle (quasi blanc) — le message du jour se noie
- **Illustrations absentes** : apps wellness premium (Clue, Flo, Calm) utilisent de douces illustrations vectorielles par phase — ici uniquement des emojis natifs

### ❌ Manquant
- **Transition CSS entre phases** : le changement de `--season` via `r.setProperty(...)` est instantané. Un `transition: all 0.8s ease` sur les éléments clés rendrait le changement de phase magique
- **Cohérence icônes** : emojis natifs dans les cartes, SVG dans la bottom-nav — mix subtil mais visible sur iOS où les emojis varient selon l'OS

---

## 3. EFFET "APP PREMIUM"

### ✅ Ce qui fonctionne
- **Identité typographique forte** : Dancing Script (SakinApp logo) + Playfair Display (contenus) + DM Sans (UI) — trio distinctif et féminin
- **Écran révélation** : `rev-emoji` breathe animation, grande typographie script sur fond gradient, très premium
- **prem-blur-wrap** : le flou sur les contenus verrouillés avec overlay `rgba(250,246,240,.9)` est élégant — donne envie sans être agressif

### ⚠️ Approximatif
- **Topbar SakinApp** : juste le texte en script, sans icon SVG propre — sur les screenshots App Store, ça manque d'identité visuelle forte
- **Section Premium dans Moi** : un simple bouton toggle "Actif/Inactif" — pas du tout vendeur. Aucune liste de bénéfices, aucun prix, aucun social proof
- **CTA "Séance accomplie"** : `background: var(--season-grad)` mais sans effet hover/pulse — les apps premium ajoutent un `box-shadow` coloré pulsant sur le bouton CTA principal

### ❌ Manquant
- **Page Premium dédiée** : écran avec fond gradient, 5-6 avantages visuels listés, témoignage (ex: "Aya, Printemps — SakinApp a changé ma relation à mon cycle"), et CTA gold. Actuellement il n'y a rien de tel.

---

## 4. EXPÉRIENCE MOBILE FÉMININE

### ✅ Ce qui fonctionne
- **Animations** : fadeUp (0.4s cubic-bezier), slideUp check-in, tabFadeIn (0.28s) — fluides et douces, sans excès
- **Scroll** : `overflow-y: auto` + `-webkit-overflow-scrolling:touch` + scrollbar cachée — natif iOS
- **Safe area** : `env(safe-area-inset-bottom)` dans bottom-nav — iOS 17 compatible
- **Tap targets** : UX IMPROVEMENTS section dans le CSS corrige les zones cliquables étroites

### ⚠️ Approximatif
- **Score du jour** : grille 4 colonnes de rings 44px — dense sur iPhone SE (375px). Sur petit écran les labels 9px sont illisibles
- **Section "Règles et Intimité en Islam"** : mur de texte en 13px sans espace — difficile à lire, peu conforme au "minimum texte" des apps wellness

### ❌ Manquant
- **Dark mode** : aucune media query `prefers-color-scheme: dark` — les utilisatrices lisant le soir ont un fond blanc éblouissant

---

## 5. LIVRABLES

---

### TOP 5 améliorations visuelles les plus impactantes

#### #1 — Célébration burst étoiles sur séance accomplie
**Impact** : moment émotionnel majeur — la dopamine du "bien fait" est clé pour la rétention

```css
@keyframes starBurst {
  0%   { transform: scale(0) rotate(0deg);   opacity: 1; }
  70%  { transform: scale(1.4) rotate(180deg); opacity: .9; }
  100% { transform: scale(1.8) rotate(360deg); opacity: 0; }
}

.celebrate-star {
  position: fixed;
  pointer-events: none;
  font-size: 20px;
  z-index: 999;
  animation: starBurst 0.9s cubic-bezier(.22,1,.36,1) forwards;
}
```

```js
// Ajouter dans validerSeanceDash() après la validation
function burstCelebration(originEl) {
  const stars = ['🌸','✨','⭐','🌟','💫'];
  const rect = originEl.getBoundingClientRect();
  for (let i = 0; i < 8; i++) {
    const el = document.createElement('div');
    el.className = 'celebrate-star';
    el.textContent = stars[i % stars.length];
    el.style.left = (rect.left + rect.width / 2 + (Math.random() - 0.5) * 120) + 'px';
    el.style.top  = (rect.top  + (Math.random() - 0.5) * 80) + 'px';
    el.style.animationDelay = (i * 0.06) + 's';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1100);
  }
}
```

---

#### #2 — Ambiance fond par phase (légère teinte)
**Impact** : l'app "respire" différemment selon la saison — immersion totale

```css
/* Dans app.js, ajouter dans la fonction qui met à jour les vars CSS */
/* Les valeurs --bg sont à ajouter dans SAISONS : */
/*   hiver   : '#FAF0FF'  (légèrement lilas)   */
/*   printemps: '#F0FAF6'  (légèrement vert)    */
/*   ete     : '#FFF9F0'  (légèrement pêche)   */
/*   automne : '#FDF5F0'  (légèrement terracotta) */

/* Dans style.css, remplacer le fond fixe : */
body {
  background: var(--bg-phase, var(--creme));
  transition: background 1.2s ease;
}

.tab-topbar,
.home-topbar,
.bottom-nav {
  background: color-mix(in srgb, var(--bg-phase, var(--creme)) 85%, white 15%);
  /* Safari fallback: */
  background: var(--bg-phase, var(--creme));
}
```

```js
// Dans la fonction qui applique les saisons (ligne ~558 app.js), ajouter :
const bgMap = {
  hiver: '#FAF0FF', printemps: '#F0FAF6', ete: '#FFF9F0', automne: '#FDF5F0'
};
r.setProperty('--bg-phase', bgMap[ST.currentSaison] || '#FAF6F0');
```

---

#### #3 — CTA principal avec glow pulsant
**Impact** : le bouton "Séance accomplie" devient désirable — augmente le taux de validation

```css
@keyframes ctaGlow {
  0%, 100% { box-shadow: 0 4px 20px rgba(0,0,0,.15); }
  50%       { box-shadow: 0 4px 32px var(--season-light), 0 0 0 4px rgba(var(--season-rgb), .12); }
}

.day-card-btn {
  animation: ctaGlow 2.8s ease-in-out infinite;
  transition: transform .12s, opacity .12s;
}
.day-card-btn:active {
  transform: scale(.97);
  animation: none;
  box-shadow: none;
}

/* Ajouter --season-rgb dans les SAISONS JS comme "123,94,167" (hiver) etc.
   puis r.setProperty('--season-rgb', s.rgb); */
```

---

#### #4 — Day-score-card redesignée avec progression
**Impact** : visualisation du progrès quotidien — motivation et sentiment d'accomplissement

```css
.day-score-card {
  margin: 12px 14px 0;
  background: white;
  border: 1.5px solid var(--sable);
  border-radius: 20px;
  padding: 14px 16px 16px;
}

.day-score-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.day-score-title {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1.8px;
  text-transform: uppercase;
  color: var(--season);
}

.day-score-fraction {
  font-size: 13px;
  font-weight: 700;
  color: var(--noir);
}

.day-score-bar-wrap {
  height: 4px;
  background: var(--sable);
  border-radius: 2px;
  margin-bottom: 14px;
  overflow: hidden;
}

.day-score-bar-fill {
  height: 100%;
  border-radius: 2px;
  background: var(--season-grad);
  transition: width .6s cubic-bezier(.22,1,.36,1);
}

/* Remplacer dans le HTML/JS : "MON JOUR" → "MA JOURNÉE ✦" */
```

---

#### #5 — Message du jour plus visible
**Impact** : c'est la phrase que l'utilisatrice lit chaque matin — elle mérite d'être lue

```css
.home-message-band {
  background: white;                /* Blanc au lieu de season-soft pâle */
  margin: 10px 14px 0;
  border-radius: 16px;
  padding: 14px 18px;
  border-left: 3px solid var(--season);   /* Accent coloré à gauche */
  border-right: 1px solid var(--sable);
  border-top: 1px solid var(--sable);
  border-bottom: 1px solid var(--sable);
  box-shadow: 0 2px 10px rgba(45,36,32,.05);
}

.home-message-text {
  font-family: var(--serif);
  font-size: 14px;           /* +1px : 13 → 14 */
  font-style: italic;
  color: var(--noir);        /* noir au lieu de gris — plus lisible */
  line-height: 1.7;
}
```

---

### Suggestions de wording plus engageant

| Actuel | Suggéré |
|--------|---------|
| "Mes menstrues ont commencé aujourd'hui" | "Mon Hiver a commencé aujourd'hui 🌙" |
| "MON JOUR" | "MA JOURNÉE ✦" |
| "Séance accomplie — Alhamdulillah" | "✓ Alhamdulillah, c'est fait !" |
| "Bienvenue, ma soeur" | "As-salamu alaykum, lune ✨" |
| "Ne plus afficher" | "J'installerai plus tard" |
| "Bonne nuit" (check-in soir) | "Bonne nuit — qu'Allah te protège 🤍" |
| "Compris 🌸" (tour) | "Je commence ✦" |
| "Ton corps a un rythme" | "Ton corps a sa propre sagesse" |
| "Commence ma journée" | "Entrer dans ma journée" |

---

### Inspirations d'apps à analyser

| App | Ce qu'elle fait bien | Applicable à SakinApp |
|-----|---------------------|----------------------|
| **Clue** | Couleurs par phase ultra-cohérentes, illustrations SVG minimalistes | Le système couleurs existe déjà — ajouter des illustrations SVG légères par phase |
| **Calm** | Célébration streak (flamme animée), ambiance sonore, fond changeant | Implémenter le burst confetti + ambiance fond par phase |
| **Finch** | Micro-félicitations constantes, avatar qui grandit | Ajouter un "streak" de jours consécutifs sur l'Accueil |
| **Flo** | Carte premium vendeuse avec témoignages, liste bénéfices claire | Créer l'écran Premium dédié |
| **Notion** | Hiérarchie typographique irréprochable | Revoir la hiérarchie h1/h2/h3 des écrans Cycle et Âme |

---

### Résumé priorités

| Priorité | Action | Effort | Impact |
|----------|--------|--------|--------|
| 🔴 P1 | Burst célébration séance accomplie | 30 min | Très élevé |
| 🔴 P1 | Message du jour plus visible (border-left + blanc) | 5 min | Élevé |
| 🟠 P2 | Wording "Mon Hiver a commencé" + "MA JOURNÉE" | 10 min | Moyen |
| 🟠 P2 | Day-score-card avec barre de progression | 30 min | Élevé |
| 🟠 P2 | Ambiance fond par phase | 20 min | Élevé |
| 🟡 P3 | CTA glow pulsant | 10 min | Moyen |
| 🟡 P3 | Page Premium dédiée | 2h | Très élevé (conversion) |
| 🟢 P4 | Dark mode | 1h | Moyen |
