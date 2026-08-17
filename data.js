// ═══════════════════════════════════════════════════════════════════════
// data.js — Données statiques quotidiennes de SakinApp
// Alimentation · Skincare · Messages matin adaptatifs
//
// Indexation : par PHASE (pas par jour fixe).
// L'app calcule l'index dans la phase via dayWithinPhase() dans app.js.
// Pour un cycle court/long, les phases ont des durées différentes mais
// les données se parcourent circulairement (idx % phase.length).
//
// Phases :
//   Hiver    : J1–5        (menstruelle)
//   Printemps: J6–13/19   (folliculaire — varie selon cycleDuration)
//   Été      : J14–17/20–23 (ovulatoire)
//   Automne  : J18–28/24–35 (lutéale)
// ═══════════════════════════════════════════════════════════════════════

// ───────────────────────────────────────────────────────────────────────
// REPAS_QUOTIDIENS
// Quelques idées de repas par phase (pas un programme jour par jour) —
// rotation simple par dayIdx, même esprit que MOUVEMENT_DU_JOUR : un texte
// court par idée, pas de structure multi-jours.
// ───────────────────────────────────────────────────────────────────────
const REPAS_QUOTIDIENS = {
  hiver: [
    { emoji: '🍲', nom: 'Soupe de lentilles corail au curcuma', benefice: 'Le fer des lentilles compense les pertes. Le curcuma réduit l\'inflammation naturellement.' },
    { emoji: '🐟', nom: 'Sardines au citron sur pain de seigle', benefice: 'Les oméga-3 agissent directement sur les crampes et l\'inflammation.' },
    { emoji: '🌰', nom: 'Bol de quinoa, dattes et amandes effilées', benefice: 'Protéines complètes et sucre naturel pour relancer l\'énergie.' },
  ],
  printemps: [
    { emoji: '🥑', nom: 'Toast avocat, graines de lin, œufs brouillés', benefice: 'Les graines de lin sont riches en phytoœstrogènes — soutiennent la montée hormonale.' },
    { emoji: '🥗', nom: 'Buddha bowl quinoa, crudités, pois chiches rôtis', benefice: 'Fibres et protéines végétales pour soutenir l\'élimination des œstrogènes en excès.' },
    { emoji: '🐟', nom: 'Filet de saumon au citron, légumes grillés', benefice: 'Protéines complètes et DHA pour soutenir la régulation naturelle de l\'humeur.' },
  ],
  ete: [
    { emoji: '🍉', nom: 'Salade de pastèque, feta, menthe et graines de courge', benefice: 'Hydratation maximale et zinc pour soutenir l\'ovulation.' },
    { emoji: '🍅', nom: 'Gaspacho maison : tomates, poivrons, concombre, ail', benefice: 'Antioxydants crus au pic hormonal pour protéger les cellules.' },
    { emoji: '🫐', nom: 'Bol myrtilles, grenade, amandes effilées et yaourt', benefice: 'Protection antioxydante maximale pour ce pic d\'Été.' },
  ],
  automne: [
    { emoji: '🍫', nom: 'Porridge d\'avoine au chocolat noir, banane et noix', benefice: 'Magnésium et tryptophane — le duo anti-SPM par excellence.' },
    { emoji: '🍠', nom: 'Soupe de patate douce au lait de coco et gingembre', benefice: 'Glucides complexes pour stabiliser l\'humeur, gingembre anti-ballonnements.' },
    { emoji: '🐟', nom: 'Filet de saumon aux lentilles vertes et citron', benefice: 'Oméga-3 anti-inflammatoires et vitamine B6 contre les symptômes du SPM.' },
  ],
};

// ───────────────────────────────────────────────────────────────────────
// SOINS_QUOTIDIENS
// 2 soins par phase (Matin + Soir), rotation par dayIdx — naturel, halal, médecine prophétique
// ───────────────────────────────────────────────────────────────────────
const SOINS_QUOTIDIENS = {

  // ── HIVER — Apaiser et régénérer (peau sensible, barrière fragilisée) ──
  hiver: [
    {
      nom: 'Eau de rose + huile de nigelle diluée',
      duree: '3 min',
      moment: 'Matin',
      geste: 'Vaporise l\'eau de rose sur le visage. Mélange 1 goutte d\'huile de nigelle + 1 c.à.c huile d\'olive, applique sur peau encore humide.',
      benefice: 'Anti-inflammatoire doux — calme les rougeurs menstruelles sans agresser la barrière cutanée fragilisée.',
      source: '☪️ Sunnah — huile de nigelle (Bukhari 5688) diluée · 🌿 Eau de rose : tradition islamique',
    },
    {
      nom: 'Masque miel pur',
      duree: '10 min',
      moment: 'Soir',
      geste: '1 c.à.c de miel pur sur le visage sec, étale doucement, laisse 10 min, rince à l\'eau tiède.',
      benefice: 'Cicatrisant et antibactérien — répare la peau en période de sensibilité hormonale maximale.',
      source: '☪️ Sunnah — "Le miel est une guérison pour les hommes" (Coran 16:69)',
    },
  ],

  // ── PRINTEMPS — Éclaircir et nourrir (peau en renouveau, œstrogènes montants) ──
  printemps: [
    {
      nom: 'Eau de rose + huile d\'olive',
      duree: '3 min',
      moment: 'Matin',
      geste: 'Tonifie à l\'eau de rose. Applique 1 goutte d\'huile d\'olive sur peau propre et légèrement humide.',
      benefice: 'Nourrit la peau en renouveau — accompagne l\'élan énergétique du Printemps.',
      source: '☪️ Sunnah — "Oignez-vous d\'huile d\'olive" (Tirmidhi) · 🌿 Eau de rose : tradition islamique',
    },
    {
      nom: 'Rhassoul à l\'eau de rose',
      duree: '8 min',
      moment: 'Soir',
      geste: 'Mélange 1 c.à.s rhassoul + eau de rose pour faire une pâte légère. Applique 5 min, rince à l\'eau tiède.',
      benefice: 'Nettoyage doux traditionnel — purifie les pores sans agresser, respecte l\'équilibre cutané.',
      source: '🌿 Rhassoul : argile traditionnelle du monde islamique depuis des siècles',
    },
  ],

  // ── ÉTÉ — Purifier et protéger (pic de sébum, peau éclatante) ──
  ete: [
    {
      nom: 'Brume eau de rose + aloe vera',
      duree: '2 min',
      moment: 'Matin',
      geste: 'Dans un spray propre : eau de rose + gel d\'aloe vera pur. Vaporise sur visage et décolleté. Laisse sécher naturellement, ne pas tamponner.',
      benefice: 'Hydratation ultra-légère non occlusive — respecte le sébum naturel du pic estival sans surcharger.',
      source: '🌿 Eau de rose : tradition islamique · Aloe vera : médecine islamique classique',
    },
    {
      nom: 'Masque rhassoul purifiant',
      duree: '7 min',
      moment: 'Soir',
      geste: '1 c.à.s rhassoul + eau de rose = pâte. Applique 5 min sur le visage, rince avant séchage complet.',
      benefice: 'Absorbe le sébum excédentaire sans agresser — équilibre naturel pour le pic ovulatoire.',
      source: '🌿 Rhassoul : tradition islamique de purification douce',
    },
  ],

  // ── AUTOMNE — Nourrir et consolider (SPM, boutons hormonaux) ──
  automne: [
    {
      nom: 'Eau de rose + huile de nigelle dans le miel',
      duree: '5 min',
      moment: 'Matin',
      geste: 'Tonifie à l\'eau de rose. Mélange 1 c.à.c miel + 1 goutte huile de nigelle, applique en soin léger, laisse absorber 2 min, rince si nécessaire.',
      benefice: 'Anti-inflammatoire préventif — apaise les réactions hormonales de la phase lutéale.',
      source: '☪️ Sunnah — miel (Coran 16:69) + huile de nigelle (Bukhari 5688) diluée',
    },
    {
      nom: 'Masque miel + curcuma',
      duree: '10 min',
      moment: 'Soir',
      geste: 'Mélange 1 c.à.c miel + 1 pincée curcuma. Applique sur visage propre, laisse 10 min, rince à l\'eau tiède.',
      benefice: 'Duo antibactérien et anti-inflammatoire — prévient les boutons hormonaux en fin de cycle.',
      source: '☪️ Sunnah — miel (Coran 16:69) · Curcuma : médecine islamique traditionnelle · ⚠️ Peut légèrement teinter la peau claire',
    },
  ],
};

// ───────────────────────────────────────────────────────────────────────
// MESSAGES_JOUR
// 28 jours × 4 humeurs (bien / fatiguee / difficile / foi)
// Utilisation dans updateMessage() : MESSAGES_JOUR[ST.currentDay]?.[mood]
// Fallback : SAISONS[ST.currentSaison].messages[mood]
// ───────────────────────────────────────────────────────────────────────
const MESSAGES_JOUR = {

  // ──── HIVER J1–5 ──────────────────────────────────────────────────
  1: {
    bien: 'Premier jour — ton corps demande du calme et tu le lui offres. C\'est déjà un acte d\'amour envers toi-même.',
    fatiguee: 'Tu n\'as pas à te battre contre ton corps aujourd\'hui. Repose-toi vraiment, sans culpabilité.',
    difficile: 'Le premier jour est souvent le plus intense. Une seule chose douce suffit : thé chaud, couverture, silence.',
    foi: 'Même allongée, le dhikr est possible. C\'est suffisant. Allah voit ce que tu traverses.'
  },
  2: {
    bien: 'Ton énergie revient un peu — profites-en pour un repas chaud et nourrissant aujourd\'hui.',
    fatiguee: 'J2 : ton corps travaille encore fort. La fatigue que tu ressens est biologique, pas une faiblesse.',
    difficile: 'Si tu te sens submergée, c\'est une information sur ce que ton corps traverse — pas sur qui tu es.',
    foi: 'Les hormones fluctuent, ta foi reste. Un seul dhikr sincère, même murmuré tout bas, suffit.'
  },
  3: {
    bien: 'Tu te sens mieux — ton corps s\'adapte. Continue à le nourrir et à l\'écouter sans le forcer.',
    fatiguee: 'La fatigue du J3 est normale. Ton corps reconstruit en silence — c\'est du vrai travail.',
    difficile: 'Ce n\'est pas dans ta tête. Les hormones créent des émotions réelles. Tu as le droit de les ressentir.',
    foi: 'Allah n\'exige pas que tu sois forte en ce moment. Il sait ce que traverse ton corps.'
  },
  4: {
    bien: 'Presque de l\'autre côté. Continue à prendre soin de toi — le Printemps arrive bientôt.',
    fatiguee: 'Le repos d\'aujourd\'hui est l\'énergie de demain. Accorde-toi encore une journée douce.',
    difficile: 'Si quelque chose te pèse, note-le aujourd\'hui — mais décide plus tard, quand les hormones seront calmées.',
    foi: 'Le silence intérieur de l\'Hiver peut être une porte vers la présence de Dieu. Ouvre-toi à Lui.'
  },
  5: {
    bien: 'Dernier jour d\'Hiver — tu as traversé cette semaine avec grâce. Le Printemps t\'attend.',
    fatiguee: 'C\'est bientôt fini. Le Printemps arrive toujours — ton corps le sait même si tu ne le sens pas encore.',
    difficile: 'Tu viens de traverser les 5 jours les plus intenses de ton cycle. Tu es plus solide que tu ne le crois.',
    foi: 'Cette phase de retrait peut devenir une retraite spirituelle. Tu en ressortiras transformée.'
  },

  // ──── PRINTEMPS J6–13 ────────────────────────────────────────────
  6: {
    bien: 'L\'énergie revient — c\'est le bon moment pour relancer quelque chose qui attendait.',
    fatiguee: 'Si tu es encore fatiguée en J6, donne-toi encore un jour. Le Printemps viendra à ton rythme.',
    difficile: 'Le changement de phase n\'est pas automatique. Si tu ne te sens pas encore mieux, c\'est ok — écoute.',
    foi: 'L\'élan du Printemps peut être mis au service d\'une intention spirituelle. Qu\'est-ce que tu veux faire pousser ?'
  },
  7: {
    bien: 'Tu es dans ta semaine de clarté mentale. Une décision prise aujourd\'hui sera solide.',
    fatiguee: 'Printemps et fatigue — écoute ce signal. Ton corps demande peut-être plus qu\'une bonne nuit de sommeil.',
    difficile: 'Quelque chose te pèse malgré l\'élan naturel ? Un moment pour toi avant de continuer.',
    foi: 'Shukr — la gratitude amplifie les bienfaits. Nomme une chose pour laquelle tu es reconnaissante ce matin.'
  },
  8: {
    bien: 'Ton énergie sociale revient — un message à quelqu\'un qui compte, peut-être ?',
    fatiguee: 'Même en Printemps, le repos reste une option. Tu n\'as pas à tout rattraper en une journée.',
    difficile: 'Si tout semble flou, note tes pensées sans les juger. L\'écriture libère ce que la parole ne peut pas.',
    foi: 'Une lecture spirituelle ce matin peut planter une graine qui portera ses fruits dans les semaines à venir.'
  },
  9: {
    bien: 'Mi-Printemps — avance sur ce projet que tu reports. Tu as l\'énergie pour ça aujourd\'hui.',
    fatiguee: 'Tu portes peut-être plus que ce que tu montres. Tu peux poser certaines choses aujourd\'hui.',
    difficile: 'La difficulté n\'a pas de saison. Si ça ne va pas, dis-le à quelqu\'un de confiance.',
    foi: 'Quand l\'énergie revient, pense à en rediriger une partie vers ce qui a du sens — pas juste l\'urgent.'
  },
  10: {
    bien: 'Tu rayonnes — c\'est un bon jour pour donner, aider, ou simplement être pleinement présente.',
    fatiguee: 'Même un pas. Juste un. Ça suffit pour avancer en douceur aujourd\'hui.',
    difficile: 'Tu traverses quelque chose de difficile au mauvais moment du cycle. C\'est dur, et c\'est réel.',
    foi: 'الله معنا — Allah est avec nous, dans l\'action comme dans le repos le plus silencieux.'
  },
  11: {
    bien: 'Corps et esprit alignés — profite de cette clarté pour une décision qui t\'attend.',
    fatiguee: 'Si l\'énergie ne vient toujours pas, honore ce signal. Le corps ne ment jamais.',
    difficile: 'Prends soin de toi en priorité. Le reste attendra — vraiment.',
    foi: 'L\'effort sincère, même petit, est une forme d\'ibadah. Commence par le plus simple aujourd\'hui.'
  },
  12: {
    bien: 'Bientôt l\'Été — ton pic d\'énergie approche. Prépare ce que tu veux accomplir.',
    fatiguee: 'Hydrate-toi bien aujourd\'hui. Parfois la fatigue vient simplement de là.',
    difficile: 'Un moment dans la nature peut faire plus que des mots. Si c\'est possible, sors un peu.',
    foi: 'Rappelle-toi d\'une du\'â qui t\'a touchée. Récite-la ce matin — laisse-la résonner dans ton cœur.'
  },
  13: {
    bien: 'Dernier jour de Printemps — tu es à ton pic d\'énergie sociale et de communication.',
    fatiguee: 'Le Printemps se termine et ton corps se prépare à la transition. C\'est naturel.',
    difficile: 'Demain est un nouveau jour et une nouvelle phase. Ce que tu vis a une fin.',
    foi: 'Ton élan intérieur est une amanah — un dépôt précieux. Utilise-le avec intention claire.'
  },

  // ──── ÉTÉ J14–17 ─────────────────────────────────────────────────
  14: {
    bien: 'Tu es à ton pic — moment idéal pour les conversations importantes et les décisions clés.',
    fatiguee: 'Être fatiguée en plein Été mérite attention. Ton corps dit quelque chose d\'important — écoute-le.',
    difficile: 'Même au sommet du cycle, on traverse des choses dures. Ce n\'est pas une contradiction.',
    foi: 'Tu as de l\'énergie — oriente-en une partie vers du bien. Sadaqa, appel, pardon : une seule chose.'
  },
  15: {
    bien: 'Ton énergie est contagieuse — un sourire, un mot gentil peut vraiment changer la journée de quelqu\'un.',
    fatiguee: 'Prends soin de toi avant les autres. Le masque à oxygène d\'abord, toujours.',
    difficile: 'Ce que tu ressens est vrai, même si le calendrier dit "Été". Honore-le sans te juger.',
    foi: 'C\'est un bon moment pour faire du bien — ta générosité naturelle du pic peut servir à ça.'
  },
  16: {
    bien: 'Bonne journée pour un projet créatif, une présentation ou une conversation importante.',
    fatiguee: 'Même 10 min de marche à l\'air libre peuvent relancer l\'énergie. Essaie si tu peux.',
    difficile: 'Il n\'y a pas de bonne humeur obligatoire. Tu peux être en Été et ne pas te sentir bien.',
    foi: 'ادْعُوا رَبَّكُمْ تَضَرُّعًا وَخُفْيَةً — « Invoquez votre Seigneur avec humilité et en secret. » (Coran 7:55). Même au sommet.'
  },
  17: {
    bien: 'Dernier jour d\'Été — profite de cette clarté avant la descente douce de l\'Automne.',
    fatiguee: 'L\'Automne commence demain. C\'est ok de commencer à ralentir dès aujourd\'hui.',
    difficile: 'Tu peux traverser n\'importe quelle phase avec soin. Même celles qui font mal.',
    foi: 'Chaque phase est une opportunité spirituelle différente. L\'Automne qui vient peut être une retraite.'
  },

  // ──── AUTOMNE J18–28 ──────────────────────────────────────────────
  18: {
    bien: 'Automne qui commence — les émotions peuvent s\'intensifier. C\'est normal, attendu, et temporaire.',
    fatiguee: 'L\'Automne commence et ton corps ralentit. Accompagne-le plutôt que d\'y résister.',
    difficile: 'Ce que tu ressens en Automne est souvent amplifié par les hormones. Note tes pensées aujourd\'hui — et reviens-y dans quelques jours avec un regard plus frais.',
    foi: 'L\'Automne est une phase de retour vers soi. Utilise-la pour revenir à l\'essentiel.'
  },
  19: {
    bien: 'Tu navigues bien dans l\'Automne — la conscience de ta phase est ta plus grande force.',
    fatiguee: 'Une chose à la fois. Juste une seule chose, aujourd\'hui.',
    difficile: 'Si tout te semble plus lourd aujourd\'hui, c\'est réel. Et ça passera, comme toujours.',
    foi: 'اللهم إني أعوذ بك من الهم والحزن — demande Sa protection de l\'anxiété et de la tristesse.'
  },
  20: {
    bien: 'Ton intuition est plus aiguisée en Automne — écoute ce qu\'elle te dit ce matin.',
    fatiguee: 'Magnésium, chocolat noir, sommeil suffisant. Ton corps sait ce dont il a besoin.',
    difficile: 'Tu n\'as pas à avoir l\'air de quelqu\'un qui va bien si ce n\'est pas le cas.',
    foi: 'La connexion avec une sœur en foi peut alléger ce que tu portes. Un message suffit parfois.'
  },
  21: {
    bien: 'Mi-Automne — tu tiens bien. Continue à prendre soin de toi avec intention et douceur.',
    fatiguee: 'Ce n\'est pas la paresse. C\'est de la biologie. Rappelle-toi cette différence chaque jour.',
    difficile: 'Si une pensée négative tourne, note-la et laisse-la. Elle a moins de pouvoir une fois sur papier.',
    foi: 'La régularité dans l\'ibadah malgré la difficulté — c\'est ça, le haut degré de foi.'
  },
  22: {
    bien: 'Tu commences à sentir la fin du cycle — honore ce que tu as traversé ce mois-ci.',
    fatiguee: 'Plus que quelques jours. Tu peux te reposer vraiment sans culpabilité.',
    difficile: 'Ce moment difficile a une date de fin. L\'Hiver arrive, et avec lui le renouvellement.',
    foi: 'الصَّبْرُ ضِيَاء — « La patience est un éclat. » (Muslim n°223). Tu l\'exerces plus que tu ne le réalises.'
  },
  23: {
    bien: 'Tes besoins changent en fin de cycle — écoute ce dont tu as vraiment envie sans te juger.',
    fatiguee: 'Ton corps prépare quelque chose. Le repos maintenant est un investissement pour l\'Hiver.',
    difficile: 'Si tu te sens seule avec tes émotions, elles n\'en sont pas moins vraies pour autant.',
    foi: 'Un du\'â sincère et présent vaut plus qu\'une longue prière faite de cœur absent. Sois là, 2 minutes.'
  },
  24: {
    bien: 'Fin de cycle qui approche — nourris-toi bien, dors assez, laisse les non-urgents attendre.',
    fatiguee: 'C\'est la phase des grandes fatigues. Elles sont normales, reconnues, et temporaires.',
    difficile: 'Difficile en fin de cycle — presque tout le monde l\'est. Tu n\'es pas seule dans ça.',
    foi: 'Même le silence peut être une prière. Assieds-toi, respire, sois présente à Allah quelques minutes.'
  },
  25: {
    bien: 'Tu traverses l\'Automne avec conscience de ce qui se passe. C\'est une vraie force.',
    fatiguee: 'Hydrate-toi, mange quelque chose de chaud, dors tôt. Simple, mais vraiment efficace.',
    difficile: 'Si les émotions sont intenses, elles ne sont pas toi — elles sont de passage.',
    foi: 'رَبِّ إِنِّي لِمَا أَنزَلْتَ إِلَيَّ مِنْ خَيْرٍ فَقِيرٌ — « Seigneur, de tout bien que Tu fais descendre vers moi, j\'en suis dans le besoin. » (Coran 28:24 — du\'â de Musa عليه السلام)'
  },
  26: {
    bien: 'Bientôt l\'Hiver — une page qui se tourne, un nouveau départ qui s\'approche doucement.',
    fatiguee: 'Le cycle se referme. Ton corps a travaillé fort ce mois-ci. Remercie-le.',
    difficile: 'Dans quelques jours, tout repart à zéro. Les cycles ont cette magie de toujours recommencer.',
    foi: 'Chaque fin de cycle est une opportunité de faire le bilan et de renouveler ses intentions.'
  },
  27: {
    bien: 'Avant-dernière étape — continue à prendre soin de toi avec autant d\'intention.',
    fatiguee: 'Plus qu\'un jour. Tu l\'as presque traversé — continue.',
    difficile: 'Ce que tu ressens ce soir n\'est pas définitif. Le corps se renouvelle, toujours.',
    foi: 'Renouvelle ta niyya ce soir — une intention claire pour le prochain cycle qui commence.'
  },
  28: {
    bien: 'Dernier jour de ce cycle — tu arrives à la fin avec conscience et soin. Alhamdulillah.',
    fatiguee: 'Le dernier jour est souvent le plus intense. Demain tout repart — douceur et repos ce soir.',
    difficile: 'Tu arrives au bout. Que ce soit difficile ou facile, tu as traversé un cycle entier. C\'est énorme.',
    foi: 'Boucle bouclée — remercie Allah pour cette architecture hormonale invisible qui travaille pour toi chaque mois.'
  },
};

// ───────────────────────────────────────────────────────────────────────
// MOUVEMENT_DU_JOUR
// Conseil ponctuel de mouvement/activité, un par phase. Pas de programme,
// pas de séance structurée — juste une invitation douce adaptée à l'énergie
// du moment.
// ───────────────────────────────────────────────────────────────────────
const MOUVEMENT_DU_JOUR = {
  hiver: 'Ton corps demande de la douceur. Quelques étirements, une marche lente ou simplement du repos — tout compte aujourd\'hui.',
  printemps: 'Ton énergie remonte — profites-en pour un peu de mouvement qui te fait du bien : marche, danse ou étirements dynamiques.',
  ete: 'Tu es proche de ton pic d\'énergie. Si l\'envie est là, c\'est un bon moment pour bouger plus franchement — sport, danse, marche rapide.',
  automne: 'Ton corps ralentit naturellement. Privilégie la douceur : marche tranquille, étirements profonds, respiration.',
};

// ─── OBJECTIFS PAR PHASE ──────────────────────────────────────────────────────
const OBJECTIFS_CATEGORIES = {
  spiritualite: { icon: '🕌', label: 'Spiritualité' },
  maison:       { icon: '🏠', label: 'Maison' },
  famille:      { icon: '👨‍👩‍👧', label: 'Famille' },
  apprentissage:{ icon: '📚', label: 'Apprentissage' },
  projet:       { icon: '💼', label: 'Projet' },
  soin:         { icon: '💆', label: 'Soin de soi' },
  croissance:   { icon: '🌱', label: 'Croissance' },
};

const OBJECTIFS_PAR_PHASE = {
  hiver: {
    spiritualite: [
      'Écouter le Coran',
      'Faire du dhikr silencieux',
      'Lire une page islamique',
      'Du\'a personnel et intime',
      'Méditer sur un nom d\'Allah',
    ],
    maison: [
      'Ranger 1 tiroir ou 1 placard',
      'Faire la lessive',
      'Préparer un repas réconfortant',
      'Trier des papiers administratifs',
      'Dresser une liste de tâches à venir',
    ],
    famille: [
      'Appeler sa mère ou une sœur',
      'Envoyer un message affectueux',
      'Regarder un film en famille',
      'Écrire ce qu\'on aime chez son mari',
    ],
    apprentissage: [
      'Écouter un podcast islamique',
      'Lire 5 pages d\'un livre',
      'Regarder une courte vidéo instructive',
      'Revoir ses notes de formation',
    ],
    projet: [
      'Relire et corriger sans créer',
      'Faire le bilan de ce qui avance',
      'Organiser ses notes et idées',
      'Trier ses emails ou messages',
    ],
    soin: [
      'Se coucher tôt ce soir',
      'Prendre un bain chaud',
      'Appliquer son soin nigelle ou miel',
      'S\'accorder une vraie pause',
    ],
    croissance: [
      'Écrire dans son journal',
      'Lister 3 choses pour lesquelles être reconnaissante',
      'Identifier ce dont on a besoin ce cycle',
    ],
  },
  printemps: {
    spiritualite: [
      'Reprendre une habitude spirituelle abandonnée',
      'Mémoriser un verset ou dhikr nouveau',
      'Faire ses prières à l\'heure',
      'Faire une sadaqa',
      'Assister à un cours islamique',
    ],
    maison: [
      'Grand rangement d\'une pièce',
      'Cuisiner une nouvelle recette',
      'Faire les courses avec une liste planifiée',
      'Réorganiser un espace qui ne fonctionne pas',
      'Démarrer un projet déco ou organisation',
    ],
    famille: [
      'Planifier une sortie en famille',
      'Proposer une activité nouvelle aux enfants',
      'Avoir une vraie conversation avec son mari',
      'Contacter une amie perdue de vue',
    ],
    apprentissage: [
      'Commencer un nouveau livre',
      'S\'inscrire à une formation',
      'Apprendre quelque chose de nouveau',
      'Démarrer un cours en ligne',
    ],
    projet: [
      'Lancer l\'idée qui attendait',
      'Contacter quelqu\'un pour avancer',
      'Créer, rédiger, démarrer',
      'Fixer des objectifs pour le mois',
    ],
    soin: [
      'Essayer une nouvelle routine sportive',
      'Tester une recette beauté naturelle',
      'Sortir se promener',
      'Prendre soin de son corps avec gratitude',
    ],
    croissance: [
      'Définir 3 intentions pour ce cycle',
      'Écrire sa vision de la femme qu\'on veut être',
      'Identifier une peur à dépasser ce mois',
    ],
  },
  ete: {
    spiritualite: [
      'Faire une sadaqa généreuse',
      'Rendre visite à quelqu\'un dans le besoin',
      'Partager une connaissance islamique',
      'Inviter des proches à manger',
      'Faire du bénévolat',
    ],
    maison: [
      'Grand ménage complet',
      'Cuisiner en grande quantité',
      'Revoir l\'organisation globale de la maison',
      'Préparer un repas et inviter du monde',
    ],
    famille: [
      'Organiser une sortie mémorable',
      'Avoir une conversation importante sur les projets',
      'Passer du temps de qualité avec chaque enfant',
      'Reconnecter avec la famille élargie',
    ],
    apprentissage: [
      'Partager ce qu\'on a appris',
      'Enseigner quelque chose à ses enfants',
      'Présenter un projet ou une idée',
      'Explorer un nouveau domaine',
    ],
    projet: [
      'Pitcher, convaincre, présenter',
      'Passer les appels importants',
      'Lancer officiellement ce qui était en préparation',
      'Collaborer et connecter',
    ],
    soin: [
      'Séance sport plus intense',
      'Sortie dans la nature',
      'Soin beauté complet',
      'Nourrir son énergie sans la gaspiller',
    ],
    croissance: [
      'Faire quelque chose qui fait peur',
      'Dire oui à une opportunité',
      'Prendre position sur quelque chose d\'important',
    ],
  },
  automne: {
    spiritualite: [
      'Muhasaba — bilan spirituel du cycle',
      'Faire du istighfar régulier',
      'Préparer spirituellement le repos à venir',
      'Lire sur la patience et l\'acceptation',
    ],
    maison: [
      'Finir les tâches qui traînent',
      'Préparer des repas à congeler',
      'Trier et donner ce qui ne sert plus',
      'Préparer l\'espace pour le repos à venir',
    ],
    famille: [
      'Résoudre une tension non dite',
      'Préparer quelque chose de spécial pour ses proches',
      'Écrire une lettre à ses enfants',
      'Planifier un moment calme en famille',
    ],
    apprentissage: [
      'Finir le livre commencé',
      'Revoir ses notes, consolider',
      'Tirer les leçons de ce qu\'on a appris',
      'Préparer la prochaine période d\'apprentissage',
    ],
    projet: [
      'Finir, livrer, clôturer',
      'Corriger et peaufiner',
      'Bilan de ce qui a avancé',
      'Préparer la prochaine phase créative',
    ],
    soin: [
      'Réduire le café et le sucre',
      'Se coucher plus tôt',
      'Bain chaud et masque miel',
      'Dire non sans culpabilité',
    ],
    croissance: [
      'Bilan du cycle — ce qui a bien marché',
      'Ce que je veux faire différemment',
      'Identifier ce dont j\'ai besoin en Hiver',
    ],
  },
};

const LECTURES = [
  {
    id: 'hiver-sabr-01',
    titre: "Le sabr n'est pas du silence",
    accroche: "Et si patience ne voulait pas dire disparaître ?",
    phase: 'hiver',
    theme: 'patience',
    duree: 4,
    source: {
      arabe: "إِنَّمَا يُوَفَّى الصَّابِرُونَ أَجْرَهُم بِغَيْرِ حِسَابٍ",
      fr: "Les patients recevront en vérité leur récompense sans limite.",
      ref: "Sourate Az-Zumar, 39:10"
    },
    corps: "Le sabr, tu l'as peut-être appris comme une injonction à te taire. À sourire malgré la douleur. À ne rien montrer. Et pourtant, le sabr dans le Coran, c'est tenir. Continuer à avancer, même quand tout est lourd.\n\nPendant tes règles, ton corps parle fort. La fatigue, les crampes, l'envie de tout lâcher : tout cela est réel. Le sabr ici, c'est continuer à avancer doucement, sans te forcer à briller. C'est honorer ce que tu vis sans en avoir honte.\n\nCe verset te promet quelque chose d'immense : une récompense sans calcul, sans limite. Allah voit ce que tu traverses. Et ce que tu vis dans le silence, dans le repos, dans la douleur portée avec grâce, compte entièrement.",
    aEmporter: {
      pensee: "Tenir doucement, c'est déjà du sabr.",
      geste: "Pose une main sur ton ventre, respire lentement, et dis intérieurement : « Je suis là, et c'est suffisant. »",
      dua: {
        arabe: "اللَّهُمَّ إِنِّي أَسْأَلُكَ الصَّبْرَ الْجَمِيلَ",
        fr: "Ô Allah, je Te demande la belle patience."
      }
    }
  },
  {
    id: 'printemps-niyya-01',
    titre: "Recommencer, et que ça compte",
    accroche: "Chaque matin, tu as le droit de tout reprendre à zéro.",
    phase: 'printemps',
    theme: 'niyya',
    duree: 4,
    source: {
      arabe: "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى",
      fr: "Les actes ne valent que par les intentions, et chacun n'obtient que ce qu'il a eu l'intention de faire.",
      ref: "Hadith, Sahih Al-Bukhari n°1, Sahih Muslim n°1907"
    },
    corps: "La phase folliculaire ressemble à une page blanche. L'énergie revient. Les idées aussi. Et parfois, avec elles, arrive une petite voix qui dit : « Encore un nouveau départ ? Tu n'as pas tenu le dernier. »\n\nLa niyya (l'intention) est au cœur de l'islam. Ce hadith, l'un des plus fondateurs de la tradition prophétique, rappelle que la valeur d'un acte dépend d'abord de l'intention qui l'habite. Ce n'est pas une invitation à se contenter d'intentions sans actions, mais c'est une invitation à commencer par l'intérieur, par le cœur qui se tourne.\n\nAlors si hier tu as lâché, si la semaine dernière tu as oublié : ce matin, tu peux renouveler ton intention. Et cette intention sincère, posée humblement, compte aux yeux d'Allah.",
    aEmporter: {
      pensee: "Chaque intention sincère est un pas vers Allah.",
      geste: "Avant de te lever, formule une seule intention pour ta journée. Une phrase simple, à voix basse ou dans ton cœur.",
      dua: {
        arabe: "اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ",
        fr: "Ô Allah, aide-moi à Te rappeler, à Te remercier et à T'adorer comme il se doit."
      }
    }
  },
  {
    id: 'ete-sadaqa-01',
    titre: "Donner quand tu débordes",
    accroche: "Et si ton énergie d'aujourd'hui était faite pour être partagée ?",
    phase: 'ete',
    theme: 'générosité',
    duree: 4,
    source: {
      arabe: "مَثَلُ الَّذِينَ يُنفِقُونَ أَمْوَالَهُمْ فِي سَبِيلِ اللَّهِ كَمَثَلِ حَبَّةٍ أَنبَتَتْ سَبْعَ سَنَابِلَ فِي كُلِّ سُنبُلَةٍ مِّائَةُ حَبَّةٍ",
      fr: "Ceux qui dépensent leurs biens dans le chemin d'Allah ressemblent à un grain qui produit sept épis, chaque épi contenant cent grains.",
      ref: "Sourate Al-Baqara, 2:261"
    },
    corps: "En phase ovulatoire, quelque chose s'ouvre. Tu as envie de voir des gens, de parler, d'agir. Et l'islam encourage à donner dans cet élan.\n\nLa sadaqa ne se mesure pas qu'en argent. Le Prophète ﷺ a dit : « Ton sourire adressé à ton frère est une sadaqa. » (Hadith, Tirmidhi n°1956). Écouter vraiment, cuisiner pour quelqu'un, rendre service, partager ce qui est utile : tout cela peut être une sadaqa quand c'est offert avec une intention sincère.\n\nCe verset compare le don fait dans le chemin d'Allah à un grain qui produit sept cents grains. Donner depuis la plénitude, c'est semer. Et ce qui est semé dans le chemin d'Allah porte ses fruits.",
    aEmporter: {
      pensee: "Ce que je donne aujourd'hui pousse longtemps après.",
      geste: "Fais une seule action généreuse intentionnelle aujourd'hui, même petite. Offre-la en sadaqa avec une niyya dans ton cœur.",
      dua: {
        arabe: "اللَّهُمَّ اجْعَلْنِي مِنَ الْمُتَصَدِّقِينَ وَبَارِكْ لِي فِيمَا رَزَقْتَنِي",
        fr: "Ô Allah, fais de moi quelqu'un qui donne, et bénis ce que Tu m'as accordé."
      }
    }
  },
  {
    id: 'automne-muhasaba-01',
    titre: "Se regarder sans se juger",
    accroche: "La muhasaba n'est pas un tribunal. C'est une conversation avec toi-même.",
    phase: 'automne',
    theme: 'muhasaba',
    duree: 5,
    source: {
      arabe: "يَا أَيُّهَا الَّذِينَ آمَنُوا اتَّقُوا اللَّهَ وَلْتَنظُرْ نَفْسٌ مَّا قَدَّمَتْ لِغَدٍ",
      fr: "Ô vous qui croyez, craignez Allah, et que chaque âme regarde ce qu'elle a préparé pour demain (l'au-delà).",
      ref: "Sourate Al-Hashr, 59:18"
    },
    corps: "La phase lutéale amène souvent une conscience aiguë de ce qu'on n'a pas fait, de ce qu'on aurait pu mieux faire. Ce regard intérieur peut faire mal. Mais il peut aussi être une invitation précieuse.\n\nLa muhasaba, l'examen de conscience, est une pratique que les savants recommandent. Ibn al-Qayyim la décrit comme le fait de s'asseoir avec soi-même, regarder sa journée, et se demander : « Où étais-je aujourd'hui ? » Non pour se condamner, mais pour se connaître et revenir.\n\nCe verset invite chaque croyant à regarder ce qu'il a préparé pour l'au-delà. C'est une invitation à prendre conscience, à s'évaluer avec honnêteté. Et cette honnêteté, quand elle est accompagnée de douceur envers soi-même, est une forme d'adoration.",
    aEmporter: {
      pensee: "Me regarder avec honnêteté et douceur, c'est prendre soin de mon âme.",
      geste: "Ce soir, écris trois lignes : une chose que tu as faite avec le cœur aujourd'hui, une chose que tu veux ajuster demain, et une chose dont tu es reconnaissante.",
      dua: {
        arabe: "اللَّهُمَّ آتِ نَفْسِي تَقْوَاهَا وَزَكِّهَا أَنْتَ خَيْرُ مَنْ زَكَّاهَا",
        fr: "Ô Allah, accorde à mon âme sa piété et purifie-la. Tu es le meilleur pour la purifier."
      }
    }
  }
];
