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
      benefice: 'Magnésium et fer en duo — ce que ton corps réclame au cœur des règles.'
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
      benefice: 'Le persil est dense en vitamine C — amplifie l\'absorption du fer encore stocké.'
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
      benefice: 'Les folates des pois cassés soutiennent la division cellulaire folliculaire — nutriment clé de cette phase de croissance.'
    },
    {
      nom: 'Curry de lentilles vertes, coriandre fraîche et riz',
      benefice: 'Fer non héminique des lentilles avec vitamine C naturelle de la coriandre — absorption renforcée.'
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
      benefice: 'Anthocyanes des myrtilles et ellagitanines de la grenade — protection antioxydante maximale pour ce pic d\'Été.'
    },
  ],

  // ── AUTOMNE (Phase lutéale · 14 entrées pour cycle long) ──────────
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
      benefice: 'Magnésium des amandes pour le sommeil. Choisis 2-3 dattes maximum — si tu as tendance aux insomnies en fin de cycle, mise sur les amandes et le lait à la cannelle seuls.'
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
    {
      nom: 'Soupe de haricots blancs, romarin et huile d\'olive',
      benefice: 'Fibres solubles pour l\'intestin, magnésium pour les crampes. Chaud et réconfortant.'
    },
    {
      nom: 'Riz complet au lait de coco, banane et cannelle',
      benefice: 'Tryptophane de la banane pour soutenir la sérotonine. Douceur naturelle sans pic glycémique.'
    },
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
// RECETTES_SOINS
// Catalogue complet 15 recettes — naturel, halal, médecine prophétique
// soins_du_jour : 2 recettes recommandées par phase (ids recettes)
// ───────────────────────────────────────────────────────────────────────
const RECETTES_SOINS = {

  soins_du_jour: {
    hiver:     [12, 6],   // Masque apaisant eau de rose+aloe · Soin mains/pieds nourrissant
    printemps: [11, 10],  // Gommage doux visage · Masque cheveux miel+olive
    ete:       [8,  3],   // Masque éclat miel+curcuma · Masque purifiant argile+nigelle
    automne:   [2,  14],  // Masque hydratant aloe+miel+olive · Soin pieds exfoliant
  },

  categories: [
    { id: 1, categorie: 'Visage',     description: 'Soins du visage, masques, nettoyants doux' },
    { id: 2, categorie: 'Cheveux',    description: 'Soins du cuir chevelu et longueurs, bains d\'huile' },
    { id: 3, categorie: 'Corps',      description: 'Gommages, hydratation et massages corporels' },
    { id: 4, categorie: 'Mains/Pieds',description: 'Soins hydratants et nourrissants' },
    { id: 5, categorie: 'Dents',      description: 'Blanchiment naturel et hygiène buccale' },
    { id: 6, categorie: 'Yeux',       description: 'Compresses et soins pour cernes et fatigue oculaire' },
  ],

  ingredients: [
    { id: 1,  nom: 'Huile de nigelle',   proprietes: 'Anti-inflammatoire, antibactérienne, nourrit peau et cheveux',     sunnah: true,  coranique: false },
    { id: 2,  nom: 'Huile d\'olive',     proprietes: 'Hydratante, nutritive, bonne pour cheveux et peau',                sunnah: true,  coranique: true  },
    { id: 3,  nom: 'Miel',              proprietes: 'Cicatrisant, antibactérien, apaisant',                              sunnah: true,  coranique: true  },
    { id: 4,  nom: 'Aloe vera',         proprietes: 'Hydratant, cicatrisant, apaisant',                                  sunnah: false, coranique: false },
    { id: 5,  nom: 'Curcuma',           proprietes: 'Éclaircissant naturel, anti-inflammatoire',                         sunnah: false, coranique: false },
    { id: 6,  nom: 'Argile blanche',    proprietes: 'Purifiante, absorbe les impuretés',                                 sunnah: false, coranique: false },
    { id: 7,  nom: 'Eau de rose',       proprietes: 'Apaisante, rafraîchissante, resserre les pores',                    sunnah: false, coranique: false },
    { id: 8,  nom: 'Sucre',            proprietes: 'Gommage doux pour le corps et le visage',                           sunnah: false, coranique: false },
    { id: 9,  nom: 'Beurre de karité', proprietes: 'Hydratant intense pour mains et pieds',                             sunnah: false, coranique: false },
    { id: 10, nom: 'Camomille',        proprietes: 'Apaise et réduit l\'inflammation',                                  sunnah: false, coranique: false },
  ],

  recettes: [
    {
      id: 1,
      titre: 'Blanchiment des dents au curcuma',
      description: 'Pâte naturelle pour blanchir les dents sans les abîmer',
      ingredients: [5, 2, 3],
      mode_application: 'Mélanger curcuma + huile d\'olive + miel pour former une pâte. Appliquer sur les dents avec un siwak ou le bout du doigt propre. Brosser doucement 1-2 min, rincer à l\'eau tiède.',
      frequence: '1 fois par semaine',
      categorie: 5,
      phases: [1, 2, 3, 4],
      note: '☪️ Sunnah — le siwak est recommandé avant chaque prière (Bukhari)',
    },
    {
      id: 2,
      titre: 'Masque visage aloe vera + miel + huile d\'olive',
      description: 'Masque hydratant et apaisant pour peau sensible',
      ingredients: [4, 3, 2],
      mode_application: 'Appliquer sur peau nettoyée, laisser poser 15-20 min, rincer à l\'eau tiède.',
      frequence: '1-2 fois par semaine',
      categorie: 1,
      phases: [1, 4],
      note: '☪️ Sunnah — miel (Coran 16:69) + huile d\'olive (Tirmidhi)',
    },
    {
      id: 3,
      titre: 'Masque purifiant argile + huile de nigelle',
      description: 'Nettoie les pores et équilibre la peau',
      ingredients: [6, 1],
      mode_application: 'Mélanger argile blanche + huile de nigelle + un peu d\'eau de rose jusqu\'à pâte. Poser 10-12 min, rincer doucement, hydrater après.',
      frequence: 'Tous les 10-14 jours',
      categorie: 1,
      phases: [3, 4],
      note: '☪️ Sunnah — huile de nigelle : "Dans la nigelle il y a une guérison pour tout sauf la mort" (Bukhari 5688)',
    },
    {
      id: 4,
      titre: 'Bain d\'huile cheveux olive + nigelle',
      description: 'Nourrit cuir chevelu et longueurs selon la Sunnah',
      ingredients: [2, 1],
      mode_application: 'Mélanger à parts égales huile d\'olive et huile de nigelle. Masser le cuir chevelu et les cheveux, laisser 1-2h ou toute la nuit, puis laver.',
      frequence: '1 fois par semaine',
      categorie: 2,
      phases: [2, 3, 4],
      note: '☪️ Sunnah — huile d\'olive (Tirmidhi) + huile de nigelle (Bukhari 5688)',
    },
    {
      id: 5,
      titre: 'Gommage corps sucre + huile d\'olive',
      description: 'Exfolie et hydrate le corps en douceur',
      ingredients: [8, 2],
      mode_application: 'Sur peau humide, masser doucement en cercles puis rincer.',
      frequence: '1 fois tous les 7-10 jours',
      categorie: 3,
      phases: [1, 2, 3, 4],
      note: '☪️ Sunnah — huile d\'olive : "Oignez-vous en" (Tirmidhi)',
    },
    {
      id: 6,
      titre: 'Soin mains/pieds nourrissant',
      description: 'Hydrate intensément mains et pieds secs',
      ingredients: [9, 1, 2],
      mode_application: 'Appliquer le soir sur mains et pieds propres. Porter gants et chaussettes en coton pour une pénétration optimale pendant la nuit.',
      frequence: '2-3 fois par semaine',
      categorie: 4,
      phases: [1, 4],
      note: '☪️ Sunnah — huile de nigelle + olive pour la peau',
    },
    {
      id: 7,
      titre: 'Compresses yeux à l\'eau de rose',
      description: 'Apaise et dégonfle les yeux fatigués',
      ingredients: [7, 10],
      mode_application: 'Infuser la camomille, laisser refroidir. Ajouter eau de rose. Tremper un tissu propre et poser sur les yeux fermés 5-10 min.',
      frequence: '1-2 fois par semaine',
      categorie: 6,
      phases: [1, 4],
      note: '🌿 Eau de rose : tradition islamique de purification et apaisement',
    },
    {
      id: 8,
      titre: 'Masque éclat miel + curcuma',
      description: 'Illumine et adoucit la peau grâce aux propriétés anti-inflammatoires du curcuma',
      ingredients: [3, 5],
      mode_application: 'Mélanger 1 c.à.c de miel + 1 pincée de curcuma. Appliquer sur visage propre 10 min, rincer à l\'eau tiède. ⚠️ Peut légèrement teinter la peau claire — tester d\'abord.',
      frequence: '1 fois par semaine',
      categorie: 1,
      phases: [2, 3],
      note: '☪️ Sunnah — miel (Coran 16:69) · Curcuma : médecine islamique traditionnelle',
    },
    {
      id: 9,
      titre: 'Masque hydratant avocat + miel + huile d\'olive',
      description: 'Nourrit intensément les peaux sèches',
      ingredients: [3, 2],
      mode_application: 'Écraser ¼ avocat mûr, ajouter miel et huile d\'olive. Appliquer 15-20 min, rincer à l\'eau tiède.',
      frequence: '1-2 fois par semaine',
      categorie: 1,
      phases: [1, 4],
      note: '☪️ Sunnah — miel (Coran 16:69) + huile d\'olive (Tirmidhi)',
    },
    {
      id: 10,
      titre: 'Masque cheveux nourrissant miel + huile d\'olive',
      description: 'Cheveux doux et brillants',
      ingredients: [3, 2],
      mode_application: 'Masser cuir chevelu et longueurs avec le mélange miel+olive, laisser poser 1h, rincer abondamment.',
      frequence: '1 fois par semaine',
      categorie: 2,
      phases: [2, 3],
      note: '☪️ Sunnah — miel + huile d\'olive',
    },
    {
      id: 11,
      titre: 'Gommage doux visage sucre + huile d\'olive',
      description: 'Exfolie la peau délicatement',
      ingredients: [8, 2],
      mode_application: 'Sur peau humide, mélanger 1 c.à.c sucre fin + 1 c.à.c huile d\'olive. Masser doucement 1-2 min en cercles, rincer.',
      frequence: '1 fois tous les 10 jours',
      categorie: 1,
      phases: [2, 3],
      note: '☪️ Sunnah — huile d\'olive (Tirmidhi)',
    },
    {
      id: 12,
      titre: 'Masque apaisant eau de rose + aloe vera',
      description: 'Apaise les rougeurs et irritations en douceur',
      ingredients: [4, 7],
      mode_application: 'Mélanger gel d\'aloe vera pur avec quelques gouttes d\'eau de rose. Appliquer sur visage propre 15 min, rincer à l\'eau tiède.',
      frequence: '1-2 fois par semaine',
      categorie: 1,
      phases: [1, 4],
      note: '🌿 Eau de rose : tradition islamique · Aloe vera : médecine islamique classique',
    },
    {
      id: 13,
      titre: 'Bain d\'huile cheveux nigelle + olive',
      description: 'Nourrit le cuir chevelu et les longueurs selon la Sunnah',
      ingredients: [1, 2],
      mode_application: 'Mélanger à parts égales huile de nigelle et huile d\'olive. Masser le cuir chevelu et les longueurs. Laisser 1h minimum ou toute la nuit, rincer avec un shampoing doux.',
      frequence: '1 fois par semaine',
      categorie: 2,
      phases: [1, 2, 3, 4],
      note: '☪️ Sunnah — huile de nigelle (Bukhari 5688) + huile d\'olive (Tirmidhi) — soin capillaire de la Sunnah, toutes phases',
    },
    {
      id: 14,
      titre: 'Soin pieds exfoliant sucre + huile de nigelle',
      description: 'Doux pour talons et pieds secs',
      ingredients: [8, 1],
      mode_application: 'Masser pieds humides avec le mélange sucre+nigelle, rincer, hydrater.',
      frequence: '1 fois par semaine',
      categorie: 4,
      phases: [1, 4],
      note: '☪️ Sunnah — huile de nigelle (Bukhari 5688)',
    },
    {
      id: 15,
      titre: 'Masque yeux camomille + eau de rose',
      description: 'Réduit cernes et fatigue oculaire',
      ingredients: [10, 7],
      mode_application: 'Infuser camomille concentrée, laisser refroidir, ajouter eau de rose. Tremper tissu propre et poser 10 min sur les yeux fermés.',
      frequence: '1-2 fois par semaine',
      categorie: 6,
      phases: [1, 4],
      note: '🌿 Eau de rose : tradition islamique',
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
// SEANCES_SPORT
// Données par phase. La logique de sélection est dans getTodaySeanceSpec() (app.js).
// Printemps planning (dayIdx 0-7) : J6=bas J7=repos J8=haut J9=bas J10=repos J11=haut J12=bas J13=repos
// Été planning (dayIdx 0-3)       : J14=intense J15=repos J16=intense J17=repos
// Automne micro-phases             : actif → doux → fin (calculé par getAutomneMicroPhase())
// ───────────────────────────────────────────────────────────────────────
const SEANCES_SPORT = {

  // ── HIVER — 4 niveaux adaptés à l'intensité des règles ───────────
  hiver: {
    niveaux: {
      1: {
        nom: 'Soulagement doux',
        duree: '~7 min',
        message: 'Certains jours, juste respirer et se détendre est la meilleure séance qui soit. Tes règles entraînent une perte de fer — reposer ton corps l\'aide à récupérer.',
        messageSpirituel: 'La douceur envers soi est aussi une ibada.',
        exercices: [
          { nom: 'Position anti-douleur', duree: '3 min',
            detail: 'Allongée en boule sur le côté gauche, genoux remontés contre la poitrine. Respire profondément. Cette position réduit la pression utérine et soulage les crampes. Si le côté gauche est inconfortable, essaie le côté droit — l\'important est ton confort.' },
          { nom: 'Respiration 4-4-6', duree: '2 min',
            detail: 'Inspire par le nez 4 temps, retiens 4 temps, souffle par la bouche 6 temps. 6 cycles. Active le système parasympathique et réduit la perception de la douleur.' },
          { nom: 'Détente abdominale', duree: '2 min',
            detail: 'Mains chaudes sur le ventre. Relâche complètement les abdominaux à chaque expiration. Cercles bienveillants, très douce pression.' },
        ],
      },
      2: {
        nom: 'Douceur profonde',
        duree: '~10 min',
        message: 'Ton corps est en phase de régénération. La vraie force, c\'est aussi savoir se reposer.',
        messageSpirituel: 'La douceur envers soi est aussi une ibada.',
        exercices: [
          { nom: 'Respiration abdominale', duree: '2 min',
            detail: 'Mains sur le ventre. Inspire profondément par le nez, expire lentement par la bouche.' },
          { nom: 'Étirement bas du dos',   duree: '2 min',
            detail: 'Genoux écartés, front au sol, bras étirés devant toi. Respire et laisse le sol te porter.' },
          { nom: 'Rotation de bassin',     duree: '2 min',
            detail: 'À quatre pattes, dessine des cercles lents avec les hanches dans les deux sens.' },
          { nom: 'Étirement hanches',      duree: '1 min / côté', parJambe: true,
            detail: 'Genou avant plié à 90°, hanches vers l\'avant. Reste, respire, change de côté.' },
          { nom: 'Automassage ventre',     duree: '2 min',
            detail: 'Paumes sur le ventre, cercles dans le sens des aiguilles d\'une montre, pression douce.' },
        ],
      },
      3: {
        nom: 'Mobilité libératrice',
        duree: '~15 min',
        message: 'Le mouvement doux libère des endorphines — ton meilleur anti-douleur naturel.',
        messageSpirituel: 'Ton corps est une amânah. Prends-en soin avec bienveillance, même en période difficile.',
        exercices: [
          { nom: 'Respiration abdominale', duree: '2 min',
            detail: 'Mains sur le ventre. Inspire profondément, expire en relâchant tout. 10 cycles lents.' },
          { nom: 'Mobilité lombaire en 4 appuis', duree: '3 min',
            detail: 'À quatre pattes. Inspire : dos creux, ventre vers le sol. Expire : dos arrondi, nombril vers le plafond. 3 sec par position. Libère les tensions lombaires.' },
          { nom: 'Étirement bas du dos',   duree: '2 min',
            detail: 'Genoux écartés, front au sol. Bras étirés ou le long du corps. Respire dans le bas du dos.' },
          { nom: 'Étirement psoas-hanches', duree: '2 min / côté', parJambe: true,
            detail: 'Genou avant plié à 90°, jambe arrière tendue au sol. Laisse la gravité ouvrir la hanche progressivement. Respire lentement. Change de côté.' },
          { nom: 'Torsion douce au sol',   duree: '1 min / côté', parJambe: true,
            detail: 'Allongée sur le dos, genoux pliés, laisse-les tomber doucement d\'un côté, bras en croix. Épaules restent au sol.' },
          { nom: 'Relaxation profonde',    duree: '2 min',
            detail: 'Allongée, yeux fermés. Relâche chaque zone du corps de la tête aux pieds à chaque expiration. Respiration abdominale lente.' },
        ],
      },
      4: {
        nom: 'Mobilité libératrice complète',
        duree: '~20 min',
        message: 'Les étirements passifs longs pendant les règles réduisent les prostaglandines inflammatoires et libèrent des endorphines. Ton corps mérite cette douceur.',
        messageSpirituel: 'La vraie force se cultive aussi dans la douceur — le repos est une forme d\'adoration. 🌙',
        exercices: [
          { nom: 'Papillon allongé',        duree: '5 min',
            detail: 'Allongée sur le dos, plantes de pieds jointes, genoux ouverts vers le sol. Mains sur le ventre. Respiration abdominale lente. Ouvre les hanches passivement.' },
          { nom: 'Étirement profond du psoas', duree: '3 min / côté', parJambe: true,
            detail: 'Genou avant plié, jambe arrière allongée au sol. Descends progressivement sur les avant-bras. Laisse le poids du corps étirer le psoas. Respire, sans forcer. Change de côté.' },
          { nom: 'Étirement complet du dos', duree: '4 min',
            detail: 'À genoux, penche le buste en avant, front au sol, bras tendus devant. Relâche les épaules et la nuque complètement. Idéale pour les douleurs du bas du dos.' },
          { nom: 'Torsion libératrice au sol', duree: '2 min / côté', parJambe: true,
            detail: 'Allongée, ramène une jambe pliée de l\'autre côté. Épaule opposée reste au sol. Respiration 4-7-8 : inspire 4, retiens 7, souffle 8.' },
          { nom: 'Jambes au mur',           duree: '4 min',
            detail: 'Fesses proches du mur, jambes tendues vers le plafond appuyées sur le mur. Favorise le retour veineux, soulage les lombaires et réduit les gonflements.' },
        ],
      },
    },
  },

  // ── PRINTEMPS — Alternance Bas/Haut/Repos, 4 niveaux ─────────────
  printemps: {
    planning: ['bas','repos','haut','bas','repos','haut','bas','repos'],
    // Repos entre exercices (secondes) selon niveau
    niveauxRepos: { 1: 45, 2: 30, 3: 20, 4: 15 },

    // ─ Séances Bas du corps ─
    bas: {
      1: { nom: 'Essentielle', duree: '~20 min', exercices: [
        { nom: 'Squat',        sets: 3, reps: 5,  detail: 'Pieds largeur d\'épaules, descends lentement, remonte en expirant.' },
        { nom: 'Chien pipi',   sets: 3, reps: 10, parJambe: true, detail: 'À quatre pattes, lève le genou sur le côté à 90°, redescends.' },
        { nom: 'Kick back',    sets: 3, reps: 10, parJambe: true, detail: 'À quatre pattes, pousse le pied vers l\'arrière-haut, contracte les fessiers.' },
        { nom: 'Demi-pont',    sets: 3, reps: 10, detail: 'Allongée, pieds à plat, soulève le bassin en serrant les fessiers.' },
        { nom: 'Chaise',       sets: 3, duree: '5 sec', detail: 'Dos au mur, cuisses parallèles au sol, tiens la position.' },
      ]},
      2: { nom: 'À ton rythme', duree: '~25 min', exercices: [
        { nom: 'Squat',         sets: 3, reps: 10, detail: 'Pieds largeur d\'épaules, descends lentement, remonte en expirant.' },
        { nom: 'Fente arrière', sets: 3, reps: 10, parJambe: true, detail: 'Un pied en arrière, genou à 90°, alternance gauche/droite.' },
        { nom: 'Squat sumo',    sets: 3, reps: 10, detail: 'Pieds très écartés, orteils ouverts, descends et remonte.' },
        { nom: 'Demi-pont',     sets: 3, reps: 20, detail: 'Allongée, pieds à plat, monte et descends lentement.' },
        { nom: 'Chaise',        sets: 3, duree: '25 sec', detail: 'Dos au mur, cuisses parallèles au sol, tiens la position.' },
      ]},
      3: { nom: 'Vitalité', duree: '~30 min', exercices: [
        { nom: 'Demi-pont jambe levée', sets: 3, reps: 15, parJambe: true, detail: 'Demi-pont avec une jambe tendue levée. Change à mi-série.' },
        { nom: 'Burpees',               sets: 3, reps: 10, detail: 'Position planche, ramène les pieds, saute vers le haut, recommence.' },
        { nom: 'Squat sauté',           sets: 3, reps: 10, detail: 'Squat puis saut explosif, atterrissage doux fléchi.' },
        { nom: 'Fente côté',            sets: 3, reps: 10, parJambe: true, detail: 'Pas large sur le côté, genou plié, l\'autre jambe tendue. Alterne.' },
        { nom: 'Levée de jambe',        sets: 3, reps: 20, detail: 'Allongée, jambes tendues, monte-les à 90° et redescends lentement.' },
      ]},
      // Niveau 4 : 3 séances en rotation sur J6/J9/J12
      4: { nom: 'Pleine puissance', duree: '~40 min',
        rotation: [
          { nom: 'S1 — Force pure', exercices: [
            { nom: 'Squats',          sets: 3, reps: 10, detail: 'Contrôlé, lent à la descente, explosif à la montée.' },
            { nom: 'Fentes arrières', sets: 3, reps: 10, parJambe: true, detail: 'Alternance jambes, genou arrière à 2 cm du sol.' },
            { nom: 'Sumo',            sets: 3, reps: 10, detail: 'Pieds très écartés, poussée depuis les talons.' },
            { nom: 'Élévations',      sets: 3, reps: 12, detail: 'Dos au sol ou sur canapé, bassin qui monte haut, contraction 1 sec.' },
          ]},
          { nom: 'S2 — Chaîne postérieure', exercices: [
            { nom: 'Squats',          sets: 3, reps: 10, detail: 'Pleine amplitude, descente lente 3 secondes.' },
            { nom: 'Soulevé de terre',sets: 3, reps: 10, detail: 'Jambes légèrement fléchies, dos droit, mains glissent le long des jambes.' },
            { nom: 'Chien pipi',      sets: 3, reps: 12, parJambe: true, detail: 'Amplitude maximale, pause 1 sec en haut.' },
            { nom: 'Kick back',       sets: 3, reps: 12, parJambe: true, detail: 'Extension complète, contraction fessiers 1 sec en haut.' },
          ]},
          { nom: 'S3 — Explosif', exercices: [
            { nom: 'Squats kicks',    sets: 3, reps: 12, parJambe: true, detail: 'Squat + coup de pied frontal en remontant, alterne.' },
            { nom: 'Soulevé de terre',sets: 3, reps: 12, detail: 'Même mécanique que S2, intention plus forte.' },
            { nom: 'Sumo',            sets: 3, reps: 12, detail: 'Pause 1 sec en bas pour activer les adducteurs.' },
            { nom: 'Demi-pont',       sets: 3, reps: 12, detail: 'Pause 2 sec en haut, descente très lente (3 sec).' },
          ]},
        ],
      },
    },

    // ─ Séances Haut du corps (jamais ajoutées en fin de séance bas) ─
    haut: {
      1: { nom: 'Essentielle', duree: '~15 min', exercices: [
        { nom: 'Pompes sur les genoux', sets: 2, reps: 5,      detail: 'Mains largeur d\'épaules, corps droit des genoux à la tête. Descends lentement.' },
        { nom: 'Gainage',               sets: 2, duree: '15 sec', detail: 'Planche sur les coudes, dos plat, ventre rentré.' },
        { nom: 'Étirement épaules',     sets: 1, duree: '1 min',  parJambe: true, detail: 'Bras croisé devant toi, pression douce avec l\'autre bras. Change.' },
      ]},
      2: { nom: 'À ton rythme', duree: '~20 min', exercices: [
        { nom: 'Pompes classiques', sets: 2, reps: 8,      detail: 'Corps droit, descente lente, pousse fort à la remontée.' },
        { nom: 'Dips chaise',       sets: 2, reps: 8,      detail: 'Mains sur une chaise derrière toi, descends les coudes à 90°.' },
        { nom: 'Gainage',           sets: 2, duree: '20 sec', detail: 'Planche complète, engage les abdos et les fessiers.' },
      ]},
      3: { nom: 'Vitalité', duree: '~25 min', exercices: [
        { nom: 'Pompes',         sets: 3, reps: 12,    detail: 'Corps parfaitement droit, descente en 3 secondes.' },
        { nom: 'Dips chaise',    sets: 3, reps: 10,    detail: 'Coudes proches du corps, descente complète.' },
        { nom: 'Isométrie bras', sets: 3, duree: '20 sec', detail: 'Bras tendus à 90°, immobile, comme si tu portais un plateau.' },
      ]},
      4: { nom: 'Pleine puissance', duree: '~30 min', exercices: [
        { nom: 'Pompes',              sets: 3, reps: 15,    detail: 'Pleine amplitude, rythme soutenu, engagement total.' },
        { nom: 'Dips déclinées',      sets: 3, reps: 10,    detail: 'Pieds surélevés sur la chaise, corps incliné, dips complets.' },
        { nom: 'Superman dos',        sets: 3, reps: 12,    detail: 'Allongée sur le ventre, lève bras et jambes ensemble, tiens 2 sec en haut. Renforce la chaîne postérieure.' },
        { nom: 'Gainage latéral',     sets: 3, duree: '20 sec', parJambe: true, detail: 'Sur le côté, corps droit, hanches dans l\'axe. Change.' },
      ]},
    },
  },

  // ── ÉTÉ — Performance, EMOM/AMRAP, 2 séances intenses + repos ────
  ete: {
    planning: ['intense','repos','intense','repos'],
    messageApresIntense: 'Tes œstrogènes et ta testostérone travaillent maintenant à reconstruire tes fibres musculaires — c\'est ce repos qui crée la progression. Hydrate-toi bien. 🌿',
    niveaux: {
      1: { type: 'emom', duree: 10, label: 'EMOM 10 min', exercice: 'Squat', reps: 5,
           detail: 'Échauffe tes articulations 5 min minimum avant de démarrer (cercles de chevilles et de hanches). Au début de chaque minute : 5 squats. Récupère le reste de la minute. 10 rounds.' },
      2: { type: 'emom', duree: 10, label: 'EMOM 10 min', exercice: 'Fente arrière', reps: 8, parJambe: true,
           detail: 'Échauffe tes articulations 5 min minimum avant de démarrer (cercles de chevilles et de hanches). Au début de chaque minute : 8 fentes arrières. Récupère le reste. 10 rounds.' },
      3: { type: 'emom', duree: 10, label: 'EMOM 10 min', exercice: 'Squat sauté', reps: 6,
           detail: 'Échauffe tes genoux 5 min minimum avant de démarrer. Au début de chaque minute : 6 squats sautés, atterrissage fléchi et silencieux. Récupère le reste de la minute. 10 rounds.' },
      4: { type: 'amrap', duree: 10, label: 'AMRAP 10 min',
           circuit: [
             { nom: 'Squats sautés',    reps: 5 },
             { nom: 'Fentes croisées',  reps: 5, parJambe: true },
             { nom: 'Hips thrust',      reps: 5 },
           ],
           detail: 'Prends 5 min minimum pour échauffer tes articulations avant de démarrer le timer. Enchaîne les 3 exercices sans arrêt. Compte le nombre de tours complets en 10 min.',
      },
    },
  },

  // ── AUTOMNE — 3 micro-phases, pas de niveaux propres ─────────────
  automne: {
    // Actif J18-J21 (standard) : reprend Printemps + repos +10s
    actif: {
      message: 'Ton corps tient encore — honore-le sans te dépasser. Reprends ton niveau de Printemps avec 20 secondes de repos supplémentaires entre chaque exercice. En phase Automne, les sauts sont remplacés automatiquement par des alternatives sans impact — la progestérone relâche tes ligaments cette semaine. Protège tes genoux et tes chevilles. Hydrate-toi davantage : la progestérone peut favoriser la rétention d\'eau. 🌿',
      reposExtra: 20,
      // Substitutions appliquées automatiquement sur les séances Printemps quand on est en Automne
      remplacements: [
        { ancien: 'Burpees',       nouveau: 'Burpees sans saut',       detail: 'Position planche, ramène les pieds en position accroupie, redresse-toi debout sans saut, recommence.' },
        { ancien: 'Squat sauté',   nouveau: 'Squat lent contrôlé',     detail: 'Descente lente sur 4 temps, pause 1 sec en bas, montée contrôlée sur 2 temps.' },
        { ancien: 'Squats kicks',  nouveau: 'Fentes contrôlées',       parJambe: true, detail: 'Fente avant contrôlée, genou arrière à 2 cm du sol, alterne gauche/droite sans explosion.' },
        { ancien: 'Squats sautés', nouveau: 'Squats lents contrôlés',  detail: 'Descente lente sur 4 temps, pause 1 sec en bas, montée contrôlée.' },
        { ancien: 'Squat sauté',   nouveau: 'Squat lent contrôlé',     detail: 'Descente lente sur 4 temps, pause 1 sec en bas, montée contrôlée sur 2 temps.' },
      ],
    },
    // Doux J22-J24 (standard) : mobilité + 2 exos légers
    doux: {
      message: 'Écoute ton corps — un soin doux aujourd\'hui.',
      mobilite: [
        { nom: 'Respiration abdominale', duree: '2 min',
          detail: 'Mains sur le ventre, respirations profondes et lentes.' },
        { nom: 'Rotation de bassin',     duree: '2 min',
          detail: 'À quatre pattes, cercles lents dans les deux sens.' },
        { nom: 'Étirement hanches',      duree: '1 min / côté', parJambe: true,
          detail: 'Fente basse, tiens et respire sans forcer.' },
        { nom: 'Gainage profond · Pilates', duree: '1 min',
          detail: 'Allongée sur le dos, genoux fléchis. Contracte doucement le plancher pelvien et le ventre en expirant, relâche en inspirant. 2 séries de 8 respirations lentes. Si tu ressens de l\'inconfort, réduis encore.' },
      ],
      // N1-N2 : mobilité seule | N3-N4 : mobilité + circuit Découverte (printemps.bas.1)
      repos: 55,
    },
    // Fin J25-fin (standard) : mobilité douce uniquement
    fin: {
      message: 'Ton corps se prépare à se renouveler. L\'accueillir avec douceur, c\'est déjà prendre soin de toi.',
      exercices: [
        { nom: 'Respiration abdominale', duree: '2 min',
          detail: 'Mains sur le ventre. Lente, profonde, bienveillante.' },
        { nom: 'Étirement bas du dos',   duree: '2 min',
          detail: 'Genoux écartés, front au sol. Lâche prise. Si tu ressens des tensions prémenstruelles, raccourcis à 1 min et passe au suivant.' },
        { nom: 'Rotation de bassin',     duree: '2 min',
          detail: 'Cercles lents, sans effort, juste la fluidité.' },
        { nom: 'Étirement hanches',      duree: '1 min / côté', parJambe: true,
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
