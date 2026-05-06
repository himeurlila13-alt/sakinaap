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
// 1 repas par jour d'index de phase — 100 % halal, ingrédients France
// ───────────────────────────────────────────────────────────────────────
const REPAS_QUOTIDIENS = {

  // ── HIVER (Phase menstruelle · 5 entrées) ──────────────────────────
  // Besoins : fer, magnésium, oméga-3, anti-inflammatoires, chaleur
  hiver: [
    {
      nom: 'Soupe de lentilles corail au curcuma',
      benefice: 'Le fer des lentilles compense les pertes. Le curcuma réduit l\'inflammation naturellement.'
    },
    {
      nom: 'Pâtes complètes aux épinards et œuf poché',
      benefice: 'Magnésium et fer en duo — ce que ton corps réclame exactement en J2.'
    },
    {
      nom: 'Sardines au citron sur pain de seigle',
      benefice: 'Les oméga-3 des sardines agissent directement sur les crampes et l\'inflammation.'
    },
    {
      nom: 'Tajine de pois chiches à la betterave et épices',
      benefice: 'La betterave soutient la production de globules rouges. Réconfortant et nutritif.'
    },
    {
      nom: 'Bol de quinoa, dattes et amandes effilées',
      benefice: 'Dernier jour d\'Hiver : protéines complètes et sucre naturel pour relancer l\'énergie.'
    },
  ],

  // ── PRINTEMPS (Phase folliculaire · 14 entrées pour cycle long) ────
  // Besoins : phytoœstrogènes, fibres, vitamines B, zinc, probiotiques
  printemps: [
    {
      nom: 'Toast avocat, graines de lin, œufs brouillés',
      benefice: 'Les graines de lin sont les meilleures sources de phytoœstrogènes — soutient la montée hormonale.'
    },
    {
      nom: 'Buddha bowl quinoa, crudités, pois chiches rôtis',
      benefice: 'Fibres et protéines végétales pour soutenir l\'élimination des œstrogènes en excès.'
    },
    {
      nom: 'Salade de roquette, noix, cranberries et feta',
      benefice: 'Les noix apportent le zinc essentiel à la bonne maturation folliculaire.'
    },
    {
      nom: 'Poulet rôti aux herbes, brocoli vapeur, riz basmati',
      benefice: 'Le sulforaphane du brocoli équilibre les hormones. Les B vitamines clarifient l\'esprit.'
    },
    {
      nom: 'Smoothie bowl aux fruits rouges et graines de chia',
      benefice: 'Antioxydants et fibres solubles qui amplifient l\'énergie naturelle du Printemps.'
    },
    {
      nom: 'Taboulé au boulgour, persil frais, concombre, tomate',
      benefice: 'Le persil est dense en vitamine C — optimise l\'absorption du fer encore stocké.'
    },
    {
      nom: 'Filet de saumon au citron, légumes grillés',
      benefice: 'Protéines complètes et DHA pour soutenir la régulation naturelle de l\'humeur.'
    },
    {
      nom: 'Yaourt grec, miel, noix et banane tranchée',
      benefice: 'Probiotiques du yaourt pour la santé intestinale — liée directement à l\'équilibre hormonal.'
    },
    {
      nom: 'Wrap au poulet grillé, avocat, salade, sauce tahini',
      benefice: 'Graisses saines de l\'avocat et du tahini pour soutenir la production d\'hormones.'
    },
    {
      nom: 'Soupe de pois cassés à la menthe fraîche',
      benefice: 'Phytoœstrogènes naturels et folates pour accompagner la croissance folliculaire.'
    },
    {
      nom: 'Curry de lentilles vertes, coriandre fraîche et riz',
      benefice: 'Fer non héminique des lentilles avec vitamine C naturelle de la coriandre — absorption optimale.'
    },
    {
      nom: 'Omelette aux champignons et épinards sautés',
      benefice: 'Vitamines B12 et D des œufs pour l\'énergie nerveuse et l\'équilibre hormonal.'
    },
    {
      nom: 'Porridge d\'avoine aux myrtilles et graines de lin',
      benefice: 'Bêta-glucanes de l\'avoine pour stabiliser la glycémie — énergie stable toute la matinée.'
    },
    {
      nom: 'Tian de légumes au four (courgette, tomate, aubergine)',
      benefice: 'Légèreté et vitamines du soleil pour cette fin de Printemps pleine d\'élan.'
    },
  ],

  // ── ÉTÉ (Phase ovulatoire · 4 entrées) ────────────────────────────
  // Besoins : antioxydants, zinc, légèreté, hydratation maximale
  ete: [
    {
      nom: 'Salade de pastèque, feta, menthe et graines de courge',
      benefice: 'Hydratation maximale et zinc des graines de courge pour soutenir l\'ovulation.'
    },
    {
      nom: 'Gaspacho maison : tomates, poivrons, concombre, ail',
      benefice: 'Lycopène et vitamine C crus — antioxydants au pic hormonal pour protéger les cellules.'
    },
    {
      nom: 'Poisson blanc en papillote, citron, herbes et haricots verts',
      benefice: 'Protéines légères et sélénium pour protéger les cellules de l\'ovulation.'
    },
    {
      nom: 'Bol myrtilles, grenade, amandes effilées et yaourt à boire',
      benefice: 'Anthocyanes et resvératrol — protection cellulaire maximale pour ce pic d\'Été.'
    },
  ],

  // ── AUTOMNE (Phase lutéale · 12 entrées pour cycle long) ──────────
  // Besoins : magnésium, tryptophane, glucides complexes, B6, réconfort
  automne: [
    {
      nom: 'Porridge d\'avoine au chocolat noir 70%, banane et noix',
      benefice: 'Magnésium et tryptophane en combo — le duo anti-SPM par excellence pour commencer l\'Automne.'
    },
    {
      nom: 'Soupe de patate douce au lait de coco et gingembre',
      benefice: 'Glucides complexes pour stabiliser l\'humeur. Le gingembre réduit les ballonnements.'
    },
    {
      nom: 'Lentilles béluga, carottes rôties et sauce tahini',
      benefice: 'Vitamine B6 et magnésium pour réduire l\'irritabilité et les tensions de l\'Automne.'
    },
    {
      nom: 'Pâtes complètes, sauce aux amandes et épinards fondus',
      benefice: 'Tryptophane des amandes pour soutenir la production naturelle de sérotonine.'
    },
    {
      nom: 'Tajine de poulet aux pruneaux et noix de cajou',
      benefice: 'Sucre naturel des pruneaux sans pic glycémique — énergie stable, sans fringale sucrée.'
    },
    {
      nom: 'Riz basmati au cumin, pois chiches et épinards sautés',
      benefice: 'Potassium des épinards contre la rétention d\'eau. Fibres des pois chiches pour l\'intestin.'
    },
    {
      nom: 'Velouté de courge butternut aux noisettes grillées',
      benefice: 'Zinc et magnésium de la courge pour apaiser les tensions prémenstruelles.'
    },
    {
      nom: 'Filet de saumon aux lentilles vertes et citron',
      benefice: 'Oméga-3 anti-inflammatoires + vitamine B6 contre les symptômes du SPM.'
    },
    {
      nom: 'Dattes farcies aux amandes, lait chaud à la cannelle',
      benefice: 'Magnésium des dattes et amandes — soir, pour favoriser un sommeil réparateur.'
    },
    {
      nom: 'Gratin de quinoa aux légumes d\'automne et herbes fraîches',
      benefice: 'Protéines complètes et glucides complexes pour tenir sans fringale sucrée.'
    },
    {
      nom: 'Bouillon de légumes maison, vermicelles et tofu soyeux',
      benefice: 'Minéraux apaisants et chaleur réconfortante pour les derniers jours avant les règles.'
    },
    {
      nom: 'Galette de sarrasin aux champignons et fromage de chèvre',
      benefice: 'Magnésium du sarrasin + confort émotionnel d\'un plat chaud et réconfortant en fin de cycle.'
    },
  ],
};


// ───────────────────────────────────────────────────────────────────────
// SOINS_QUOTIDIENS
// 1 soin par jour d'index de phase — naturel, halal, fait maison
// ───────────────────────────────────────────────────────────────────────
const SOINS_QUOTIDIENS = {

  // ── HIVER (5 entrées) — Peau sèche, sensible, barrière affaiblie ──
  hiver: [
    {
      nom: 'Masque miel brut et huile de coco',
      duree: '10 min',
      geste: 'Mélange 1 c.à.c de miel brut et quelques gouttes d\'huile de coco. Applique sur visage propre, laisse 10 min, rince à l\'eau tiède.',
      benefice: 'Le miel hydrate et apaise, l\'huile de coco répare la barrière cutanée fragilisée.'
    },
    {
      nom: 'Tonique à l\'eau de rose',
      duree: '2 min',
      geste: 'Après nettoyage doux, vaporise ou tampon d\'eau de rose pur sur visage et cou. Laisse pénétrer sans rincer.',
      benefice: 'Anti-inflammatoire naturel qui réduit les rougeurs et resserre les pores délicatement.'
    },
    {
      nom: 'Huile de rose musquée au coucher',
      duree: '3 min',
      geste: '2-3 gouttes d\'huile de rose musquée réchauffées entre les paumes, pressées doucement sur le visage sec.',
      benefice: 'Régénère les cellules et nourrit la barrière cutanée pendant ton sommeil réparateur.'
    },
    {
      nom: 'Brume aloe vera maison',
      duree: '2 min',
      geste: 'Dans un spray propre : gel d\'aloé vera pur dilué dans de l\'eau. Vaporise à tout moment de la journée.',
      benefice: 'Hydratation continue et effet apaisant immédiat sur peau réactive et inconfortable.'
    },
    {
      nom: 'Massage doux à l\'huile de jojoba',
      duree: '5 min',
      geste: 'Quelques gouttes d\'huile de jojoba, massage circulaire très doux du centre vers l\'extérieur du visage.',
      benefice: 'La jojoba imite le sébum naturel — nourrit sans obstruer les pores ni alourdir la peau.'
    },
  ],

  // ── PRINTEMPS (14 entrées) — Peau lumineuse, réceptive aux soins ──
  printemps: [
    {
      nom: 'Exfoliation douce au sucre et huile d\'olive',
      duree: '5 min',
      geste: '1 c.à.c de sucre fin + 1 c.à.c d\'huile d\'olive. Massage circulaire 2 min, rince à l\'eau tiède.',
      benefice: 'Élimine les cellules mortes de l\'Hiver pour révéler l\'éclat naturel du Printemps.'
    },
    {
      nom: 'Sérum vitamine C naturel (jus de citron très dilué)',
      duree: '3 min',
      geste: '1 goutte de jus de citron pour 10 gouttes d\'eau de rose. Applique le matin sur peau propre avant la crème.',
      benefice: 'Vitamine C naturelle pour unifier le teint et stimuler l\'éclat — phase idéale pour les actifs.'
    },
    {
      nom: 'Masque argile blanche et eau de rose',
      duree: '12 min',
      geste: 'Argile blanche + eau de rose jusqu\'à consistance crémeuse. Applique, laisse 10 min, rince à l\'eau tiède.',
      benefice: 'Purifie les pores en douceur sans agresser — idéal pour la peau réceptive du Printemps.'
    },
    {
      nom: 'Gua sha au galet froid (ou pierre de quartz)',
      duree: '5 min',
      geste: 'Après quelques gouttes d\'huile légère, fais glisser du menton vers les oreilles et du front vers les tempes.',
      benefice: 'Drainage lymphatique, éclat immédiat, microcirculation stimulée — effet bonne mine garanti.'
    },
    {
      nom: 'Masque avocat mûr et miel',
      duree: '12 min',
      geste: '¼ avocat écrasé + 1 c.à.c miel. Applique en couche généreuse, laisse 10-12 min, rince.',
      benefice: 'Vitamines E et B5 de l\'avocat pour peau éclatante et bien nourrie — léger et efficace.'
    },
    {
      nom: 'Tonique au vinaigre de cidre dilué',
      duree: '3 min',
      geste: '1 part vinaigre de cidre + 4 parts d\'eau. Applique au coton après nettoyage, laisse sécher naturellement.',
      benefice: 'Rééquilibre le pH cutané et resserre les pores — doux si bien dilué.'
    },
    {
      nom: 'Rouleau facial froid (ou glaçon dans tissu)',
      duree: '5 min',
      geste: 'Rouleau ou glaçon enveloppé dans un tissu propre. Du centre du visage vers l\'extérieur.',
      benefice: 'Réduit les poches matinales, stimule la circulation, effet bonne mine instantané.'
    },
    {
      nom: 'Nettoyage à l\'huile (méthode OCM)',
      duree: '5 min',
      geste: 'Quelques gouttes d\'huile de tournesol sur visage sec. Massage 2 min. Essuie avec un gant doux et humide.',
      benefice: 'Dissout les impuretés sans dessécher — la peau reste souple et équilibrée.'
    },
    {
      nom: 'Masque argile verte express (3 min)',
      duree: '6 min',
      geste: 'Argile verte + eau de rose. Laisse seulement 3 min — rince avant séchage complet pour ne pas assécher.',
      benefice: 'Purifie sans agresser — durée courte pour respecter la barrière cutanée.'
    },
    {
      nom: 'Bain de vapeur à la camomille',
      duree: '10 min',
      geste: 'Bol d\'eau chaude + 2 sachets de camomille. Visage à 20 cm, serviette sur la tête, 5 min. Rince à l\'eau fraîche.',
      benefice: 'Ouvre les pores, facilite la pénétration des soins suivants, effet apaisant global.'
    },
    {
      nom: 'Huile de noisette en sérum léger',
      duree: '3 min',
      geste: '2-3 gouttes d\'huile de noisette pressées sur visage propre, matin ou soir.',
      benefice: 'Matifiante naturelle, rééquilibre le sébum sans obstruer — légèreté du Printemps.'
    },
    {
      nom: 'Masque aloe vera et miel',
      duree: '12 min',
      geste: '1 c.à.s gel d\'aloé vera + 1 c.à.c miel. Mélange et applique sur visage propre, laisse 10-12 min.',
      benefice: 'Double hydratation et apaisement — prépare la peau au pic d\'Été qui arrive.'
    },
    {
      nom: 'Compresses thé vert froid sur les yeux',
      duree: '8 min',
      geste: 'Prépare un thé vert, laisse refroidir. Imbibe deux rondins de coton, applique sur les yeux fermés 8 min.',
      benefice: 'EGCG antioxydants qui protègent et calment — anti-poches et anti-oxydant en même temps.'
    },
    {
      nom: 'Huile de jojoba + 1 goutte de lavande vraie',
      duree: '3 min',
      geste: '5 gouttes d\'huile de jojoba + 1 goutte d\'huile essentielle de lavande vraie. Massage doux le soir.',
      benefice: 'Lavande antibactérienne et apaisante — parfait pour finir le Printemps et préparer l\'Été.'
    },
  ],

  // ── ÉTÉ (4 entrées) — Peau au meilleur, légèreté et protection ───
  ete: [
    {
      nom: 'Brume eau de rose et aloe vera',
      duree: '2 min',
      geste: 'Dans un spray : eau de rose + gel d\'aloé vera. Vaporise toute la journée sur visage et décolleté.',
      benefice: 'Hydratation ultra-légère sans surcharger la peau au pic naturel de sébum.'
    },
    {
      nom: 'Masque argile verte express (5 min)',
      duree: '8 min',
      geste: 'Argile verte + eau de source. 5 min maximum — rince avant séchage complet.',
      benefice: 'Absorbe l\'excès de sébum sans agresser — adapté au pic d\'Été.'
    },
    {
      nom: 'Rondelles de concombre froid sur les yeux',
      duree: '10 min',
      geste: 'Deux rondelles de concombre direct du frigo sur les yeux. Allongée, 10 min.',
      benefice: 'Drainant, anti-gonflement, hydratant — zero ingrédient ajouté, zero risque.'
    },
    {
      nom: 'Nettoyage doux au lait d\'amande',
      duree: '3 min',
      geste: 'Lait d\'amande pur sur coton, passe sur visage en cercles légers. Rinçage facultatif.',
      benefice: 'Vitamine E nourrissante, démaquillage délicat — la légèreté parfaite pour l\'Été.'
    },
  ],

  // ── AUTOMNE (12 entrées) — Peau réactive, besoins en apaisement ──
  automne: [
    {
      nom: 'Masque miel brut et curcuma',
      duree: '10 min',
      geste: '1 c.à.c miel + une pincée de curcuma. Mélange bien. Applique sur visage propre. Laisse 10 min. Rince.',
      benefice: 'Curcuma anti-inflammatoire + miel antibactérien — combat les imperfections hormonales en douceur.'
    },
    {
      nom: 'Compresses chaudes à la camomille',
      duree: '8 min',
      geste: 'Tisane de camomille concentrée. Laisse tiédir. Imbibe une serviette propre, applique sur visage 5 min.',
      benefice: 'L\'azulène de la camomille réduit les rougeurs et calme la peau réactive de l\'Automne.'
    },
    {
      nom: 'Huile de rose musquée en soin de nuit',
      duree: '3 min',
      geste: '3-4 gouttes sur peau propre et légèrement humide. Pas de rinçage. Dors dessus.',
      benefice: 'Régénère les cellules pendant le sommeil — particulièrement efficace en phase lutéale.'
    },
    {
      nom: 'Masque à l\'avoine colloïdale',
      duree: '18 min',
      geste: 'Flocons d\'avoine mixés finement. Mélange à l\'eau tiède jusqu\'à pâte. Applique 15 min. Rince délicatement.',
      benefice: 'L\'avoine calme les démangeaisons, nourrit et protège la barrière cutanée fragilisée.'
    },
    {
      nom: 'Nettoyage doux au lait de coco',
      duree: '3 min',
      geste: 'Lait de coco sur coton, passe sur visage sans frotter. Rinçage léger à l\'eau tiède.',
      benefice: 'Acide laurique antibactérien + nettoyage ultra-doux pour peau sensible de l\'Automne.'
    },
    {
      nom: 'Masque argile blanche et huile de jojoba',
      duree: '10 min',
      geste: 'Argile blanche + quelques gouttes d\'huile de jojoba + eau de rose. Plus doux que l\'argile seule.',
      benefice: 'Purifie sans assécher — adapté à la peau hypersensible prémenstruelle.'
    },
    {
      nom: 'Masque au yaourt nature',
      duree: '12 min',
      geste: '1 c.à.s yaourt entier nature. Applique en couche régulière, laisse 10-12 min, rince à l\'eau tiède.',
      benefice: 'Acide lactique doux + probiotiques apaisants — peau plus unie instantanément.'
    },
    {
      nom: 'Mélange huile de noisette et chanvre',
      duree: '3 min',
      geste: 'Parts égales des deux huiles. Applique le soir sur visage propre. Pas de rinçage.',
      benefice: 'Oméga-6 anti-inflammatoires — calment les réactions cutanées hormonales en profondeur.'
    },
    {
      nom: 'Cataplasme d\'aloé vera pur',
      duree: '8 min',
      geste: 'Gel d\'aloé vera pur (feuille fraîche ou 99% pur) en couche épaisse. Laisse 5-8 min sans rincer.',
      benefice: 'Hydratation intense et apaisement immédiat des zones réactives ou irritées.'
    },
    {
      nom: 'Eau thermale ou de source en brume',
      duree: '2 min',
      geste: 'Vaporise matin et soir avant ta crème. Tapote pour faire pénétrer. Ne frotte pas.',
      benefice: 'Minéraux apaisants, réduit la sensibilité cutanée des derniers jours du cycle.'
    },
    {
      nom: 'Compresses thé vert et miel sur zones réactives',
      duree: '10 min',
      geste: 'Thé vert refroidi + 1 c.à.c miel dissous. Imbibe des compresses rondes, applique sur zones rouges 8 min.',
      benefice: 'Antioxydants du thé + miel antibactérien — duo efficace contre les éruptions hormonales.'
    },
    {
      nom: 'Masque argile kaolin et eau florale de lavande',
      duree: '10 min',
      geste: 'Argile kaolin (la plus douce) + eau florale de lavande. Laisse 10 min. Rince à l\'eau tiède.',
      benefice: 'La lavande apaise et assainit, le kaolin purifie ultra-doucement — parfait pour finir le cycle sereinement.'
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
    foi: 'ادعُ ربك تضرعاً وخفيةً — invoque ton Seigneur avec humilité et discrétion. Même au sommet.'
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
    difficile: 'Ce que tu ressens en Automne est amplifié par les hormones. Attends le Printemps pour décider.',
    foi: 'L\'Automne est une phase de retour vers soi. Utilise-la pour revenir à l\'essentiel.'
  },
  19: {
    bien: 'Tu navigues bien dans l\'Automne — la conscience de ta phase est ta plus grande force.',
    fatiguee: 'Une chose à la fois. Juste une seule chose today.',
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
    foi: 'الصبر نور — La patience est une lumière. Tu l\'exerces plus que tu ne le réalises.'
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
    foi: 'رَبِّ إِنِّي لِمَا أَنزَلْتَ إِلَيَّ مِنْ خَيْرٍ فَقِيرٌ — "Seigneur, j\'ai besoin du bien que Tu m\'envoies."'
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
// SEANCES_SPORT
// Données par phase. La logique de sélection est dans getTodaySeanceSpec() (app.js).
// Printemps planning (dayIdx 0-7) : J6=bas J7=repos J8=haut J9=bas J10=repos J11=haut J12=bas J13=repos
// Été planning (dayIdx 0-3)       : J14=intense J15=repos J16=intense J17=repos
// Automne micro-phases             : actif → doux → fin (calculé par getAutomneMicroPhase())
// ───────────────────────────────────────────────────────────────────────
const SEANCES_SPORT = {

  // ── HIVER — Séance unique douceur, pas de niveaux ─────────────────
  hiver: {
    nom: 'Douceur profonde',
    duree: '~10 min',
    message: 'Ton corps est en phase de régénération. La vraie force, c\'est aussi savoir se reposer.',
    messageSpirituel: 'La douceur envers soi est aussi une ibada.',
    exercices: [
      { nom: 'Respiration abdominale', duree: '2 min',
        detail: 'Mains sur le ventre. Inspire profondément par le nez, expire lentement par la bouche.' },
      { nom: 'Posture enfant',         duree: '2 min',
        detail: 'Genoux écartés, front au sol, bras étirés devant toi. Respire et laisse le sol te porter.' },
      { nom: 'Rotation de bassin',     duree: '2 min',
        detail: 'À quatre pattes, dessine des cercles lents avec les hanches dans les deux sens.' },
      { nom: 'Étirement hanches',      duree: '1 min / côté',
        detail: 'Genou avant plié à 90°, hanches vers l\'avant. Reste, respire, change de côté.' },
      { nom: 'Automassage ventre',     duree: '2 min',
        detail: 'Paumes sur le ventre, cercles dans le sens des aiguilles d\'une montre, pression douce.' },
    ],
  },

  // ── PRINTEMPS — Alternance Bas/Haut/Repos, 4 niveaux ─────────────
  printemps: {
    planning: ['bas','repos','haut','bas','repos','haut','bas','repos'],
    // Repos entre exercices (secondes) selon niveau
    niveauxRepos: { 1: 45, 2: 30, 3: 20, 4: 15 },

    // ─ Séances Bas du corps ─
    bas: {
      1: { nom: 'Découverte', duree: '~20 min', exercices: [
        { nom: 'Squat',        sets: 3, reps: 5,  detail: 'Pieds largeur d\'épaules, descends lentement, remonte en expirant.' },
        { nom: 'Chien pipi',   sets: 3, reps: 10, detail: 'À quatre pattes, lève le genou sur le côté à 90°, redescends.' },
        { nom: 'Kick back',    sets: 3, reps: 10, detail: 'À quatre pattes, pousse le pied vers l\'arrière-haut, contracte les fessiers.' },
        { nom: 'Demi-pont',    sets: 3, reps: 10, detail: 'Allongée, pieds à plat, soulève le bassin en serrant les fessiers.' },
        { nom: 'Chaise',       sets: 3, duree: '5 sec', detail: 'Dos au mur, cuisses parallèles au sol, tiens la position.' },
      ]},
      2: { nom: 'Aventurière', duree: '~25 min', exercices: [
        { nom: 'Squat',         sets: 3, reps: 10, detail: 'Pieds largeur d\'épaules, descends lentement, remonte en expirant.' },
        { nom: 'Fente arrière', sets: 3, reps: 10, detail: 'Un pied en arrière, genou à 90°, alternance gauche/droite.' },
        { nom: 'Squat sumo',    sets: 3, reps: 10, detail: 'Pieds très écartés, orteils ouverts, descends et remonte.' },
        { nom: 'Demi-pont',     sets: 3, reps: 20, detail: 'Allongée, pieds à plat, monte et descends lentement.' },
        { nom: 'Chaise',        sets: 3, duree: '25 sec', detail: 'Dos au mur, cuisses parallèles au sol, tiens la position.' },
      ]},
      3: { nom: 'Guerrière', duree: '~30 min', exercices: [
        { nom: 'Demi-pont jambe levée', sets: 3, reps: 15, detail: 'Demi-pont avec une jambe tendue levée. Change à mi-série.' },
        { nom: 'Burpees',               sets: 3, reps: 10, detail: 'Position planche, ramène les pieds, saute vers le haut, recommence.' },
        { nom: 'Squat sauté',           sets: 3, reps: 10, detail: 'Squat puis saut explosif, atterrissage doux fléchi.' },
        { nom: 'Fente côté',            sets: 3, reps: 10, detail: 'Pas large sur le côté, genou plié, l\'autre jambe tendue. Alterne.' },
        { nom: 'Levée de jambe',        sets: 3, reps: 20, detail: 'Allongée, jambes tendues, monte-les à 90° et redescends lentement.' },
      ]},
      // Niveau 4 : 3 séances en rotation sur J6/J9/J12
      4: { nom: 'Élite', duree: '~40 min',
        rotation: [
          { nom: 'S1 — Force pure', exercices: [
            { nom: 'Squats',          sets: 3, reps: 10, detail: 'Contrôlé, lent à la descente, explosif à la montée.' },
            { nom: 'Fentes arrières', sets: 3, reps: 10, detail: 'Alternance jambes, genou arrière à 2 cm du sol.' },
            { nom: 'Sumo',            sets: 3, reps: 10, detail: 'Pieds très écartés, poussée depuis les talons.' },
            { nom: 'Élévations',      sets: 3, reps: 12, detail: 'Dos au sol ou sur canapé, bassin qui monte haut, contraction 1 sec.' },
          ]},
          { nom: 'S2 — Chaîne postérieure', exercices: [
            { nom: 'Squats',          sets: 3, reps: 10, detail: 'Pleine amplitude, descente lente 3 secondes.' },
            { nom: 'Soulevé de terre',sets: 3, reps: 10, detail: 'Jambes légèrement fléchies, dos droit, mains glissent le long des jambes.' },
            { nom: 'Chien pipi',      sets: 3, reps: 12, detail: 'Amplitude maximale, pause 1 sec en haut.' },
            { nom: 'Kick back',       sets: 3, reps: 12, detail: 'Extension complète, contraction fessiers 1 sec en haut.' },
          ]},
          { nom: 'S3 — Explosif', exercices: [
            { nom: 'Squats kicks',    sets: 3, reps: 12, detail: 'Squat + coup de pied frontal en remontant, alterne.' },
            { nom: 'Soulevé de terre',sets: 3, reps: 12, detail: 'Même mécanique que S2, intention plus forte.' },
            { nom: 'Sumo',            sets: 3, reps: 12, detail: 'Pause 1 sec en bas pour activer les adducteurs.' },
            { nom: 'Demi-pont',       sets: 3, reps: 12, detail: 'Pause 2 sec en haut, descente très lente (3 sec).' },
          ]},
        ],
      },
    },

    // ─ Séances Haut du corps (jamais ajoutées en fin de séance bas) ─
    haut: {
      1: { nom: 'Haut N1', duree: '~15 min', exercices: [
        { nom: 'Pompes sur les genoux', sets: 2, reps: 5,      detail: 'Mains largeur d\'épaules, corps droit des genoux à la tête. Descends lentement.' },
        { nom: 'Gainage',               sets: 2, duree: '15 sec', detail: 'Planche sur les coudes, dos plat, ventre rentré.' },
        { nom: 'Étirement épaules',     sets: 1, duree: '1 min',  detail: 'Bras croisé devant toi, pression douce avec l\'autre bras. Change.' },
      ]},
      2: { nom: 'Haut N2', duree: '~20 min', exercices: [
        { nom: 'Pompes classiques', sets: 2, reps: 8,      detail: 'Corps droit, descente lente, pousse fort à la remontée.' },
        { nom: 'Dips chaise',       sets: 2, reps: 8,      detail: 'Mains sur une chaise derrière toi, descends les coudes à 90°.' },
        { nom: 'Gainage',           sets: 2, duree: '20 sec', detail: 'Planche complète, engage les abdos et les fessiers.' },
      ]},
      3: { nom: 'Haut N3', duree: '~25 min', exercices: [
        { nom: 'Pompes',         sets: 3, reps: 12,    detail: 'Corps parfaitement droit, descente en 3 secondes.' },
        { nom: 'Dips chaise',    sets: 3, reps: 10,    detail: 'Coudes proches du corps, descente complète.' },
        { nom: 'Isométrie bras', sets: 3, duree: '20 sec', detail: 'Bras tendus à 90°, immobile, comme si tu portais un plateau.' },
      ]},
      4: { nom: 'Haut N4', duree: '~30 min', exercices: [
        { nom: 'Pompes',           sets: 3, reps: 15,    detail: 'Pleine amplitude, rythme soutenu, engagement total.' },
        { nom: 'Dips déclinées',   sets: 3, reps: 10,    detail: 'Pieds surélevés sur la chaise, corps incliné, dips complets.' },
        { nom: 'Dips chaise',      sets: 3, reps: 12,    detail: 'Classique, enchaîné rapidement entre les séries.' },
        { nom: 'Gainage latéral',  sets: 3, duree: '20 sec', detail: 'Sur le côté, corps droit, hanches dans l\'axe. Change.' },
      ]},
    },
  },

  // ── ÉTÉ — Performance, EMOM/AMRAP, 2 séances intenses + repos ────
  ete: {
    planning: ['intense','repos','intense','repos'],
    messageApresIntense: 'Repose-toi demain — ton corps construit sa force pendant la récupération.',
    niveaux: {
      1: { type: 'emom', duree: 10, label: 'EMOM 10 min', exercice: 'Squat', reps: 5,
           detail: 'Au début de chaque minute : 5 squats. Récupère le reste de la minute. 10 rounds.' },
      2: { type: 'emom', duree: 10, label: 'EMOM 10 min', exercice: 'Fente arrière', reps: 8,
           detail: 'Au début de chaque minute : 8 fentes arrières. Récupère le reste. 10 rounds.' },
      3: { type: 'emom', duree: 10, label: 'EMOM 10 min', exercice: 'Squat sauté', reps: 10,
           detail: 'Au début de chaque minute : 10 squats sautés. Récupère le reste. 10 rounds.' },
      4: { type: 'amrap', duree: 10, label: 'AMRAP 10 min',
           circuit: [
             { nom: 'Squats sautés',    reps: 5 },
             { nom: 'Fentes croisées',  reps: 5 },
             { nom: 'Hips thrust',      reps: 5 },
           ],
           detail: 'Enchaîne les 3 exercices sans arrêt. Compte le nombre de tours complets en 10 min.',
      },
    },
  },

  // ── AUTOMNE — 3 micro-phases, pas de niveaux propres ─────────────
  automne: {
    // Actif J18-J21 (standard) : reprend Printemps + repos +10s
    actif: {
      message: 'Ton corps tient encore — honore-le sans te dépasser.',
      reposExtra: 10,
    },
    // Doux J22-J24 (standard) : mobilité + 2 exos légers
    doux: {
      message: 'Écoute ton corps — un soin doux aujourd\'hui.',
      mobilite: [
        { nom: 'Respiration abdominale', duree: '2 min',
          detail: 'Mains sur le ventre, respirations profondes et lentes.' },
        { nom: 'Rotation de bassin',     duree: '2 min',
          detail: 'À quatre pattes, cercles lents dans les deux sens.' },
        { nom: 'Étirement hanches',      duree: '1 min / côté',
          detail: 'Fente basse, tiens et respire sans forcer.' },
      ],
      // N1-N2 : mobilité seule | N3-N4 : mobilité + circuit Découverte (printemps.bas.1)
      repos: 45,
    },
    // Fin J25-fin (standard) : mobilité douce uniquement
    fin: {
      message: 'Ton corps se prépare à se renouveler. L\'accueillir avec douceur, c\'est déjà prendre soin de toi.',
      exercices: [
        { nom: 'Respiration abdominale', duree: '2 min',
          detail: 'Mains sur le ventre. Lente, profonde, bienveillante.' },
        { nom: 'Posture enfant',         duree: '3 min',
          detail: 'Genoux écartés, front au sol. Lâche prise.' },
        { nom: 'Rotation de bassin',     duree: '2 min',
          detail: 'Cercles lents, sans effort, juste la fluidité.' },
        { nom: 'Étirement hanches',      duree: '1 min / côté',
          detail: 'Fente basse, sans forcer, juste être là.' },
        { nom: 'Automassage ventre',     duree: '2 min',
          detail: 'Cercles bienveillants, pression très douce.' },
      ],
    },
  },

  // ── MARCHE CALME — option check-in 'Mon cœur a besoin de calme' ──
  calme: {
    nom: 'Marche & Présence',
    duree: '~10 min dehors',
    message: 'Pas de chrono. Pas de performance. Juste toi, l\'air, et le dhikr.',
    messageSpirituel: 'SubhanAllah à chaque pas. Laisse ton cœur se poser.',
    detail: 'Marche 10 minutes dehors à ton rythme. À chaque pas, dis SubhanAllah dans ton cœur. Aucune pression. Juste la présence.',
  },
};
