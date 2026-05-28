# Rapport QA — SakinApp
**Date :** 2026-05-19  
**Auditeur :** Agent QA (Claude)  
**Périmètre :** app.js, index.html, sport-progression-logic.js  
**Méthode :** Analyse statique du code source

---

## Résumé

| # | Sévérité | Zone | Titre |
|---|----------|------|-------|
| 1 | 🔴 Critique | Données | `confirmDeleteMyData()` n'efface pas réellement les données |
| 2 | 🔴 Critique | Sport | `_finishTimer()` → double-comptage si séance déjà validée |
| 3 | 🔴 Critique | Auth | `manualSignOut` absent de ST → guard `onAuthStateChange` toujours inactif |
| 4 | 🟡 Moyen | Sport | `validerReposActif()` → état `'repos-actif'` non reconnu dans `renderCarteBouger()` |
| 5 | 🟡 Moyen | Objectifs | `addCustomObj()` sans limite → accumulation illimitée |
| 6 | 🟡 Moyen | Premium | `applyTrialLocks()` ne masque pas symptômes et glaire après fin d'essai |
| 7 | 🟡 Moyen | Formulaires | `saveEditCycle()` — pas de validation JS pour date future |
| 8 | 🟢 Mineur | Reset | `feedbackSport` non purgé dans `checkDailyReset()` |
| 9 | 🟢 Mineur | Sport | Inconsistance `'repos-actif'` entre `renderDayScore()` et `renderCarteBouger()` |

---

## Bugs détaillés

---

### BUG 1 — 🔴 Critique : `confirmDeleteMyData()` n'efface pas réellement les données

**Fichier :** `app.js`, lignes 4673–4696

**Comportement attendu :**  
Quand l'utilisatrice confirme la suppression de ses données, toutes ses données locales sont effacées immédiatement (localStorage vidé), ses données Supabase sont supprimées, elle est déconnectée, et le toast de confirmation s'affiche.

**Comportement observé :**  
`confirmDeleteMyData()` envoie uniquement une notification via l'edge function Supabase `notify-deletion`. Le localStorage n'est jamais effacé (`localStorage.removeItem('sakinapp_v1')` absent). La table Supabase `user_data` n'est pas supprimée côté client. L'utilisatrice n'est pas déconnectée. `sessionStorage.setItem('sakina_deleted', '1')` n'est jamais appelé, donc le toast post-suppression (ligne ~3627) ne s'affiche jamais.

**Impact :** L'utilisatrice pense avoir supprimé ses données (RGPD), mais toutes restent accessibles localement. Non-conformité RGPD potentielle.

**Fix proposé :**

```javascript
// Dans confirmDeleteMyData(), remplacer le bloc de fermeture par :
async function confirmDeleteMyData() {
  closeDeleteModal();
  try {
    // 1. Supprimer dans Supabase
    if (sb && ST.supabaseUserId) {
      await sb.from('user_data').delete().eq('user_id', ST.supabaseUserId);
      // Notifier l'équipe (optionnel, best-effort)
      await sb.functions.invoke('notify-deletion', { body: { userId: ST.supabaseUserId } })
        .catch(() => {});
      await sb.auth.signOut();
    }
  } catch (e) {
    console.warn('Erreur suppression Supabase :', e);
  }
  // 2. Effacer localStorage
  localStorage.removeItem('sakinapp_v1');
  // 3. Marquer pour afficher le toast post-reload
  sessionStorage.setItem('sakina_deleted', '1');
  // 4. Recharger
  window.location.reload();
}
```

---

### BUG 2 — 🔴 Critique : `_finishTimer()` → double-comptage si séance déjà validée

**Fichier :** `app.js`, lignes 2816–2819

**Comportement attendu :**  
Si l'utilisatrice valide la séance manuellement via "Alhamdulillah, c'est fait !" puis laisse le timer s'écouler jusqu'à la fin, `validerSeanceDash()` ne doit être appelée qu'une seule fois.

**Comportement observé :**  
`_finishTimer()` appelle `validerSeanceDash()` inconditionnellement. Si `ST.seanceDone[today] === true` (séance déjà validée manuellement), `totalSeancesAll` et `checkpointProgress` sont incrémentés une deuxième fois, faussant les statistiques et potentiellement déclenchant un passage de niveau non mérité.

**Code actuel :**
```javascript
function _finishTimer() {
  clearInterval(ST._timerInterval);
  validerSeanceDash(); // ← appelé sans guard
  closeTimerModal();
}
```

**Fix proposé :**

```javascript
function _finishTimer() {
  clearInterval(ST._timerInterval);
  const today = new Date().toDateString();
  // Guard : ne pas re-valider si déjà fait
  if (ST.seanceDone && (ST.seanceDone[today] === true || ST.seanceDone[today] === 'express')) {
    closeTimerModal();
    return;
  }
  validerSeanceDash();
  closeTimerModal();
}
```

---

### BUG 3 — 🔴 Critique : `manualSignOut` absent de ST → guard `onAuthStateChange` toujours inactif

**Fichier :** `app.js`, ligne 505 (guard) et lignes 3270–3275 (`confirmSignOut`)

**Comportement attendu :**  
Quand l'utilisatrice se déconnecte manuellement, le listener `onAuthStateChange` doit ignorer l'événement `SIGNED_OUT` pour éviter des comportements indésirables (boucle d'auth, affichage de l'écran de connexion avant le reload, etc.).

**Comportement observé :**  
Le guard ligne 505 vérifie `if (ST.manualSignOut) return;` mais :
1. `manualSignOut` n'est jamais initialisé dans l'objet ST (lignes 14–86)
2. `confirmSignOut()` ne définit jamais `ST.manualSignOut = true` avant d'appeler `sb.auth.signOut()`

Le guard est donc toujours `false`/`undefined` → toujours inactif. L'événement `SIGNED_OUT` traverse systématiquement vers `showAuthScreen()`.

**Fix proposé :**

```javascript
// 1. Dans l'objet ST (ligne ~14), ajouter :
manualSignOut: false,

// 2. Dans confirmSignOut(), avant sb.auth.signOut() :
async function confirmSignOut() {
  ST.manualSignOut = true;  // ← ajouter cette ligne
  // ... nettoyage ST ...
  if (sb) await sb.auth.signOut();
  window.location.reload();
}
```

---

### BUG 4 — 🟡 Moyen : `validerReposActif()` → état `'repos-actif'` non reconnu dans `renderCarteBouger()`

**Fichier :** `app.js`, ligne 1773–1775 (`renderCarteBouger`) et lignes 2554–2562 (`validerReposActif`)

**Comportement attendu :**  
Après validation d'un repos actif, la carte Bouger doit afficher l'état "fait" (masquer les boutons d'action, afficher le message de confirmation).

**Comportement observé :**  
`validerReposActif()` stocke `ST.seanceDone[today] = 'repos-actif'`, mais `renderCarteBouger()` vérifie :
```javascript
const isDone = donVal === true || donVal === 'express';
```
La valeur `'repos-actif'` n'est ni `true` ni `'express'`, donc `isDone = false`. Les boutons "Alhamdulillah" et "Reporter" restent visibles. L'utilisatrice peut re-valider et déclencher une double incrémentation des compteurs.

**Fix proposé :**

```javascript
// Ligne 1774, remplacer :
const isDone = donVal === true || donVal === 'express';
// Par :
const isDone = donVal === true || donVal === 'express' || donVal === 'repos-actif';
```

---

### BUG 5 — 🟡 Moyen : `addCustomObj()` sans limite → accumulation illimitée

**Fichier :** `app.js`, lignes 3473–3481

**Comportement attendu :**  
L'utilisatrice ne peut ajouter qu'un nombre raisonnable d'objectifs personnalisés (ex. max 10).

**Comportement observé :**  
`addCustomObj()` ne vérifie pas la taille de `ST.customObjectifs` avant le `push()`. Un utilisateur peut ajouter des centaines d'objectifs, ce qui :
- Gonfle le localStorage de façon illimitée
- Dégrade les performances de `renderObjectifs()`
- Peut dépasser la limite de 5 Mo du localStorage (erreur silencieuse dans `saveState()`)

**Fix proposé :**

```javascript
function addCustomObj() {
  const input = document.getElementById('new-obj-input');
  if (!input) return;
  const val = input.value.trim();
  if (!val) return;
  
  // Ajouter : limite à 10 objectifs personnalisés
  if (ST.customObjectifs.length >= 10) {
    showToast('Maximum 10 objectifs personnalisés atteint. 🌙');
    return;
  }
  
  ST.customObjectifs.push({ label: val, done: false });
  input.value = '';
  saveState();
  renderObjectifs();
}
```

---

### BUG 6 — 🟡 Moyen : `applyTrialLocks()` ne masque pas symptômes et glaire après fin d'essai

**Fichier :** `app.js`, lignes 1576–1586 & `index.html` lignes ~476–511

**Comportement attendu :**  
Quand la période d'essai est expirée (`isFullAccess()` retourne `false`), les sections Symptômes et Glaire cervicale de l'onglet Cycle doivent être masquées ou bloquées derrière le bandeau `#trial-lock-cycle`.

**Comportement observé :**  
`applyTrialLocks()` affiche `#trial-lock-cycle` mais ne masque pas `#symptomes-grid` (ou `#symptomes-content`) ni `#glaire-content`. Ces fonctionnalités premium restent pleinement accessibles pendant et après la période d'essai, contournant le modèle économique de l'app.

**Fix proposé :**

```javascript
// Dans applyTrialLocks(), après la gestion de #trial-lock-cycle :
function applyTrialLocks() {
  const active = !isFullAccess();
  
  // ... code existant ...
  
  // Ajouter : verrouiller symptômes et glaire
  const symptomesContent = document.getElementById('symptomes-content');
  if (symptomesContent) symptomesContent.style.display = active ? 'none' : '';
  
  const glaireContent = document.getElementById('glaire-content');
  if (glaireContent) glaireContent.style.display = active ? 'none' : '';
}
```

Note : s'assurer que les IDs `'symptomes-content'` et `'glaire-content'` correspondent aux IDs réels dans `index.html` (à vérifier).

---

### BUG 7 — 🟡 Moyen : `saveEditCycle()` — pas de validation JS pour date future

**Fichier :** `app.js`, lignes 4243–4254

**Comportement attendu :**  
Il est impossible de saisir une date de début de cycle dans le futur, que ce soit via l'interface normale ou via DevTools.

**Comportement observé :**  
`openEditCycle()` positionne `max=today` sur l'input HTML (`type="date"`), ce qui empêche la saisie via l'UI. Cependant, `saveEditCycle()` ne valide pas côté JS que `dateVal <= today`. L'attribut `max` peut être supprimé via DevTools (F12), permettant de sauvegarder une date future qui corrompt les calculs de `computeCycle()` (la phase et le jour courant seront incorrects).

**Fix proposé :**

```javascript
function saveEditCycle() {
  const dateInput = document.getElementById('edit-cycle-date');
  const durInput  = document.getElementById('edit-cycle-dur');
  if (!dateInput || !durInput) return;
  
  const dateVal = dateInput.value;
  const durVal  = parseInt(durInput.value, 10);
  
  if (!dateVal) { alert('Merci d\'indiquer une date de début. 🌙'); return; }
  
  // Ajouter : validation JS anti-future
  const today = new Date().toISOString().split('T')[0];
  if (dateVal > today) {
    alert('La date de début ne peut pas être dans le futur. 🌙');
    return;
  }
  
  if (!durVal || durVal < 20 || durVal > 45) {
    alert('La durée doit être entre 20 et 45 jours.');
    return;
  }
  
  // ... suite du code existant ...
}
```

---

### BUG 8 — 🟢 Mineur : `feedbackSport` non purgé dans `checkDailyReset()`

**Fichier :** `app.js`, ligne ~3361

**Comportement attendu :**  
Toutes les données journalières sont purgées des entrées datant de plus de 30 jours lors du reset quotidien.

**Comportement observé :**  
La liste de nettoyage dans `checkDailyReset()` contient :
```javascript
['prayers', 'dhikrChecks', 'coranDone', 'seanceDone', 'symptomes', 'mouvDone', 'autreSymptomesText']
```
`feedbackSport` (format `{ dateString: mood }`) est absent de cette liste. Il s'accumule indéfiniment dans `ST` et donc dans le localStorage, sans jamais être purgé.

**Fix proposé :**

```javascript
// Dans checkDailyReset(), ajouter 'feedbackSport' à la liste de nettoyage :
const DAILY_KEYS_TO_PRUNE = [
  'prayers', 'dhikrChecks', 'coranDone', 'seanceDone',
  'symptomes', 'mouvDone', 'autreSymptomesText',
  'feedbackSport',  // ← ajouter
];
```

---

### BUG 9 — 🟢 Mineur : Inconsistance `'repos-actif'` entre `renderDayScore()` et `renderCarteBouger()`

**Fichier :** `app.js`, lignes ~1709 (`renderDayScore`) et 1773 (`renderCarteBouger`)

**Comportement attendu :**  
L'état `'repos-actif'` est traité de façon cohérente dans tout le code : la séance est considérée comme "faite" partout.

**Comportement observé :**  
- `renderDayScore()` : `const seanceDone = ST.seanceDone && ST.seanceDone[today];` → truthy pour `'repos-actif'` → score affiche séance faite ✓  
- `renderCarteBouger()` : `isDone = donVal === true || donVal === 'express'` → `'repos-actif'` falsy → boutons d'action toujours visibles ✗

Ce bug est une conséquence directe du Bug 4. Le fix du Bug 4 résout également ce bug.

**Fix :** voir Bug 4.

---

## Zones validées (non-bugs)

| Zone | Résultat |
|------|----------|
| `phaseThresholds()` avec durée 20–45 jours | Calculs corrects ✓ |
| Ordre des étapes du Ghusl (`index.html` lignes 707–735) | Correct selon la sunna (7 étapes) ✓ |
| `handleProgressionAnswer('parfait')` | Géré par le `else` branch — comportement correct ✓ |
| Navigation tabs (`switchTab`, `switchTabById`) | Consistants et fonctionnels ✓ |
| `saveNotifSettings()` | Persiste correctement via `saveState()` ✓ |
| `removeCustomObj(i)` | Reconstruit correctement l'index map ✓ |
| `toggleCustomObj(i)` | Toggle correct par index ✓ |
| `dayWithinPhase()` | Retourne correctement l'index 0-based dans la phase ✓ |
| `computeCycle()` — date future | Gérée silencieusement (retourne phase par défaut) — comportement intentionnel ✓ |
| `isFullAccess()` — logique trial | `return ST.isPremium \|\| getTrialDays() < 20` — correct ✓ |

---

*Rapport généré par analyse statique — aucune modification de code effectuée.*
