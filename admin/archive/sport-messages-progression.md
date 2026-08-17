> **⚠️ ARCHIVÉ (2026-08-17)** — Ce document décrit les textes de progression du moteur
> de séance sport structuré (niveaux, streaks, feedback) supprimé du MVP lors de la
> Phase 2 du reset produit. Conservé pour référence éditoriale si cette fonctionnalité
> est réintroduite un jour. Ne reflète plus l'état actuel du code.

# Messages de Progression Sportive — SakinApp

Tous les textes pour l'expérience de progression sportive. Ton bienveillant, islamique, émotionnel. Constantes JS prêtes à intégrer.

## 1. BILAN FIN DE CYCLE — Messages selon progression

```js
// ═══ BILAN MONTÉE DE NIVEAU ═══
bilan_montee: {
  titre: "Tu as grandi ce cycle 🌱",
  corps: "Ton corps s'est transformé — d'Essentielle à À ton rythme. Chaque séance était un pas vers la meilleure version de toi.",
  islamique: "Alhamdulillahi rabbi al-alameen. Allah a béni ton effort. 💜"
},

bilan_montee_grande: {
  titre: "Transformation puissante ce cycle ⚡",
  corps: "Un saut remarquable — ton niveau a explosé ! Ton corps a dit 'oui' à chaque défi que tu lui as proposé.",
  islamique: "SubhanAllah, quelle évolution ! Ton corps est une amana qu'Allah t'a confiée. 🔥"
},

// ═══ BILAN MÊME NIVEAU ═══
bilan_maintien: {
  titre: "Constance précieuse ce cycle 🌿",
  corps: "Tu as consolidé ton niveau — c'est de la sagesse. Ton corps maîtrise maintenant chaque mouvement.",
  islamique: "La constance dans l'effort, c'est ce qu'Allah aime. Masha'Allah pour ta régularité. ✨"
},

// ═══ BILAN DESCENTE DE NIVEAU ═══
bilan_descente: {
  titre: "Tu t'es écoutée ce cycle 💜",
  corps: "Ralentir, c'est de l'intelligence corporelle. Tu as choisi la douceur — ton corps t'en remercie.",
  islamique: "L'écoute de soi est une forme de gratitude envers Allah. Baarak Allahu fiki. 🌙"
},

// ═══ BILAN PREMIER CYCLE ═══
bilan_premier: {
  titre: "Ton premier cycle sportif ✨",
  corps: "Tu as posé les bases — marche après marche, séance après séance. Quel courage de commencer !",
  islamique: "Khayr al-umur awsatuha — le meilleur des actes est celui fait avec constance. 🌱"
}
```

## 2. MOMENT FORT J1 NOUVEAU CYCLE — Modals de bienvenue

```js
// ═══ DÉCOUVERTE (Cycle 1) ═══
j1_decouverte: {
  titre: "As-salamu alaykum, nouvelle cycleuse ! 🌟",
  corps: "Ton premier cycle sportif commence. Chaque jour où tu bouges sera une victoire. Pas de pression — juste de la bienveillance.",
  cta: "Je commence en douceur 🌱"
},

// ═══ CONSTRUCTION (Cycles 2-3) ═══
j1_construction: {
  titre: "Masha'Allah pour ta constance ! 💚",
  corps: "Cycle 2 — ton corps commence à reconnaître le rythme. Ce cycle, on construit ensemble une routine qui te ressemble.",
  cta: "Je continue ma progression 🌿"
},

j1_construction_avancee: {
  titre: "Ton rythme se dessine ! 🔥",
  corps: "Cycle 3 — tes habitudes deviennent naturelles. Ce cycle, on pousse un peu plus loin. Tu es prête.",
  cta: "Je relève le défi 💪"
},

// ═══ PERFORMANCE (Cycle 4+) ═══
j1_performance: {
  titre: "Athlète du quotidien ! ⚡",
  corps: "Cycle 4 et plus — tu maîtrises maintenant l'art de bouger selon tes phases. Ce cycle, on vise l'excellence dans la douceur.",
  cta: "Je perfectionne mon art ✨"
}
```

## 3. MONTÉE DE NIVEAU — Toasts de célébration

```js
// ═══ MONTÉES NIVEAU ═══
toast_montee_N1_N2: "Tu passes À ton rythme 🌿 — Masha'Allah, chaque séance t'a menée ici !",

toast_montee_N1_N3: "Bond incroyable vers Vitalité 🔥 — SubhanAllah, quelle progression !",

toast_montee_N1_N4: "Direct en Pleine puissance ⚡ — Allah a béni ta détermination !",

toast_montee_N2_N3: "Vitalité débloquée 🔥 — ton corps était prêt depuis longtemps !",

toast_montee_N2_N4: "Saut vers Pleine puissance ⚡ — Alhamdulillah pour cette force !",

toast_montee_N3_N4: "Pleine puissance atteinte ⚡ — le summum de ta forme, Masha'Allah !",
```

## 4. DESCENTE DE NIVEAU — Messages bienveillants

```js
// ═══ DESCENTES NIVEAU ═══
toast_descente_N2_N1: "Retour à Essentielle 🌱 — l'écoute de soi est une sagesse. 💜",

toast_descente_N3_N2: "À ton rythme retrouvé 🌿 — parfait pour cette période.",

toast_descente_N4_N3: "Vitalité ajustée 🔥 — ton corps demandait de la douceur.",

toast_descente_N3_N1: "Essentielle choisie 🌱 — quelques fois, revenir aux bases est ce qu'il faut.",

toast_descente_N4_N2: "À ton rythme sélectionné 🌿 — l'intelligence du corps qui s'exprime.",

toast_descente_N4_N1: "Essentielle privilégiée 🌱 — le repos actif, c'est aussi du courage."
```

## 5. RECORD AMRAP ÉTÉ — Célébrations performance

```js
// ═══ RECORDS ÉTÉ ═══
record_affiche: "Ton record : {nb} tours ⚡",

record_nouveau: "Nouveau record ⚡ — Alhamdulillah, tu t'es surpassée !",

record_egal: "Record égalé ⚡ — constance au sommet, Masha'Allah !",

record_aucun: "Pose ton premier record aujourd'hui ☀️",

record_encouragement: "Ton record t'attend — donne ce que tu peux ! 🔥"
```

## 6. STREAK — Messages d'encouragement

```js
// ═══ STREAKS SÉANCES ═══
streak_3: "3 séances d'affilée ! 🌿 L'habitude germe...",

streak_5: "5 séances consécutives ! 🔥 Ton corps s'habitue à cette belle routine.",

streak_7: "Une semaine complète ! ⚡ Masha'Allah, quelle constance !",

streak_10: "10 séances — tu es maintenant une habituée ! 🌟 Allah a béni cette persévérance.",

streak_15: "15 séances — SubhanAllah ! Tu incarnes la régularité dans l'effort. 💎",

streak_21: "21 jours — l'habitude est ancrée ! 🌱 Cette constance est un cadeau d'Allah.",

streak_30: "Un mois complet ! 🏆 Alhamdulillahi rabbi al-alameen pour cette force intérieure."
```

## 7. TRANSITIONS INTER-CYCLES — Messages J1 nouveau cycle

```js
// ═══ TRANSITIONS CYCLES ═══
transition_cycle1_vers_2: "Cycle 1 terminé ! 🎉 Tu entres en phase Construction — ton corps a compris le message.",

transition_cycle3_vers_4: "3 cycles accomplis ! ⚡ Bienvenue en mode Performance — tu es une vraie athlète maintenant.",

transition_construction: "Construction continue 🌿 — chaque cycle te rend plus forte, Masha'Allah.",

transition_performance: "Performance maintenue ⚡ — tu es dans l'excellence, Alhamdulillah pour cette constance !"
```

## 8. MESSAGES SPÉCIAUX — Situations particulières

```js
// ═══ MESSAGES PHASE ═══
message_hiver_doux: "En Hiver, chaque mouvement doux est précieux 🌙 — ton corps te remercie.",

message_ete_record: "C'est le moment du record ! ☀️ Ton corps est au pic de sa forme.",

message_automne_sagesse: "L'Automne demande de l'écoute 🍂 — ralentir, c'est de la sagesse.",

message_printemps_energie: "Ton Printemps s'épanouit ! 🌿 Cette énergie croissante est un cadeau.",

// ═══ RETOUR APRÈS PAUSE ═══
retour_apres_pause: "Te revoilà ! 🌟 Peu importe la pause — ce qui compte c'est ce nouveau pas.",

retour_longue_pause: "Longtemps absente, mais tu reviens 💜 — le courage de recommencer, SubhanAllah.",

// ═══ ENCOURAGEMENTS GÉNÉRAUX ═══
encouragement_fatigue: "Fatiguée ? Une séance douce reste une victoire 🌙",

encouragement_motivation: "Chaque séance est une ibada pour ton corps — Allah voit ton effort 💚",

encouragement_progres: "Tu n'es plus la même qu'au début — regarde le chemin parcouru ! ✨"
```

## 9. NOTIFICATIONS PUSH — Messages courts

```js
// ═══ NOTIFICATIONS ═══
notif_seance_hiver: "Douceur du jour ? 🌙 5 min de mouvement suffisent.",

notif_seance_printemps: "Ton énergie monte ! 🌿 20 min de joie pour ton corps ?",

notif_seance_ete: "Pic de forme ! ☀️ Record ou séance intense aujourd'hui ?",

notif_seance_automne: "L'Automne appelle le calme 🍂 — étirements ou pilates ?",

notif_streak_risque: "3 jours sans bouger 💜 — ton corps attend tes retrouvailles.",

notif_nouveau_niveau: "Nouveau niveau débloqué ! 🔥 Viens découvrir ta progression."
```

## 10. FÉLICITATIONS SPÉCIALES — Moments clés

```js
// ═══ MOMENTS EXCEPTIONNELS ═══
felicitation_premier_mois: {
  titre: "Premier mois accompli ! 🏆",
  corps: "30 jours de mouvement — certains jours doux, d'autres intenses, mais toujours avec amour pour ton corps.",
  islamique: "Alhamdulillahi ladhi ahyana ba'da ma amatana — louange à Allah qui nous a redonné la vie après l'avoir retirée. Chaque jour d'effort est une résurrection. 💚"
},

felicitation_100_seances: {
  titre: "100 séances ! SubhanAllah ! 🌟",
  corps: "Cent fois tu as choisi de bouger. Cent fois ton corps a dit merci. Cette constance est un trésor.",
  islamique: "Inna ma'a al-usri yusra — avec la difficulté vient la facilité. Tu l'incarnes parfaitement. ⚡"
},

felicitation_annee_complete: {
  titre: "Une année de mouvement ! 🎆",
  corps: "365 jours, 4 saisons du cycle x13... Tu as dansé avec ton corps toute une année. Quelle mélodie magnifique !",
  islamique: "Rabbana atina fi'd-dunya hasanatan — Seigneur, accorde-nous le bien dans ce bas-monde. Ton corps en pleine santé en est un. Amin. 💎"
}
```

---

**Notes d'utilisation :**
- Remplacer {nb} par le nombre de tours pour les records
- Adapter le niveau (N1, N2, etc.) selon le contexte
- Les emojis font partie intégrante du message
- Ton chaleureux, jamais culpabilisant
- Formules islamiques authentiques et contextualisées

**Intégration technique :**
- Variables prêtes pour app.js
- Messages courts pour notifications push
- Messages longs pour modals
- Toasts : max 2 lignes
- Bilans : titre + corps + citation islamique