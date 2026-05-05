// ═══════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════
let ST = {
  prenom: '',
  cycleStart: null,
  cycleDuration: 28,
  checkin: null,
  checkinDate: null,
  prayers: {},
  // DHIKR → cases à cocher (true/false par jour)
  dhikrChecks: {},    // { 'date': { subhan: bool, alhamdu: bool, akbar: bool, istighfar: bool } }
  dhikrDate: null,
  coranDone: {},      // { 'date': bool }
  asmaKnown: [],
  glaire: null,
  glaireDate: null,
  symptomes: {},      // { 'date': ['fatigue','crampes',...] }
  autreSymptomesText: {}, // { 'date': 'texte libre' }
  currentSaison: 'printemps',
  currentDay: 1,
  selectedSugg: [],
  seanceDashDone: {}, // séance rapide cochée depuis le dashboard
  mouvDone: {},
  seanceDone: {},
  notifFreq: 2,
  waitlistEmail: null,
  feedbackSent: false,
  installBannerDismissed: false,
  lastDailyReset: null,
  lastWeeklyReset: null,
  eveningCheckinDate: null,
  eveningCheckinMood: null,
  cycleHistory: [],
  isPremium: false,
  seanceValidatedCount: 0,
  seanceLevel: 1,
  weeklyObjChecks: {},
  customObjectifs: [],
  customObjChecks: {},
};

function saveState() {
  // Ne jamais sauvegarder currentSaison/currentDay — recalculés a chaque lancement
  const toSave = {...ST};
  delete toSave.currentSaison;
  delete toSave.currentDay;
  try { localStorage.setItem('sakinapp_v1', JSON.stringify(toSave)); } catch(e) {}
}
function loadState() {
  try {
    const saved = localStorage.getItem('sakinapp_v1');
    if (saved) {
      const parsed = JSON.parse(saved);
      delete parsed.currentSaison;
      delete parsed.currentDay;
      ST = {...ST, ...parsed};
    }
  } catch(e) {}
}

// ═══════════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════════

/* ── SYMPTÔMES par phase ── */
const SYMPTOMES_PAR_PHASE = {
  hiver: [
    { id: 'crampes',    emoji: '🌀', label: 'Crampes' },
    { id: 'fatigue',    emoji: '😴', label: 'Fatigue' },
    { id: 'saignement', emoji: '🩸', label: 'Flux abondant' },
    { id: 'dos',        emoji: '🦴', label: 'Douleur dos' },
    { id: 'tete',       emoji: '🤕', label: 'Maux de tête' },
    { id: 'humeur',     emoji: '🌊', label: 'Sautes d\'humeur' },
    { id: 'nausee',     emoji: '🤢', label: 'Nausées' },
    { id: 'aucun',      emoji: '✨', label: 'Pas de douleur' },
  ],
  printemps: [
    { id: 'energie',    emoji: '⚡', label: 'Énergie' },
    { id: 'bonne_humeur', emoji: '🌸', label: 'Bonne humeur' },
    { id: 'peau_eclat', emoji: '✨', label: 'Peau lumineuse' },
    { id: 'libido',     emoji: '💛', label: 'Désir présent' },
    { id: 'creux',      emoji: '😶', label: 'Légère baisse' },
    { id: 'seche',      emoji: '💧', label: 'Peau sèche' },
    { id: 'anxiete',    emoji: '😟', label: 'Anxiété' },
    { id: 'sommeil',    emoji: '🌙', label: 'Trouble sommeil' },
  ],
  ete: [
    { id: 'energie_max',emoji: '☀️', label: 'Énergie max' },
    { id: 'confiance',  emoji: '💪', label: 'Confiance' },
    { id: 'chaleur',    emoji: '🌡️', label: 'Chaleur corporelle' },
    { id: 'douleur_ovul', emoji: '🎯', label: 'Douleur ovulation' },
    { id: 'tete',       emoji: '🤕', label: 'Maux de tête' },
    { id: 'seins',      emoji: '🌷', label: 'Seins sensibles' },
    { id: 'mucus_pic',  emoji: '💧', label: 'Pic de mucus' },
    { id: 'acne',       emoji: '🔴', label: 'Acné légère' },
  ],
  automne: [
    { id: 'irritable',  emoji: '😤', label: 'Irritabilité' },
    { id: 'ballonnements', emoji: '🎈', label: 'Ballonnements' },
    { id: 'envies',     emoji: '🍫', label: 'Envies sucrées' },
    { id: 'seins_sensibles', emoji: '🌷', label: 'Seins sensibles' },
    { id: 'spm',        emoji: '🌊', label: 'SPM intense' },
    { id: 'fatigue',    emoji: '😴', label: 'Fatigue' },
    { id: 'insomnie',   emoji: '🌙', label: 'Insomnie' },
    { id: 'calme',      emoji: '✨', label: 'Je me sens bien' },
  ],
};

/* ── DHIKR cases à cocher ── */
const DHIKR_CHECKS = [
  { id: 'subhan',     arabic: 'سُبْحَانَ اللَّهِ',  fr: 'SubhanAllah · Gloire à Allah',          count: '33×' },
  { id: 'alhamdu',    arabic: 'اَلْحَمْدُ لِلَّهِ', fr: 'Alhamdulillah · Louange à Allah',        count: '33×' },
  { id: 'akbar',      arabic: 'اللَّهُ أَكْبَرُ',    fr: 'Allahu Akbar · Allah est le Plus Grand', count: '34×' },
  { id: 'istighfar',  arabic: 'أَسْتَغْفِرُ اللَّهَ', fr: 'Astaghfirullah · Je demande pardon à Allah', count: '100×', verse: '« afin qu\'Allah te pardonne tes péchés, passés et futurs, qu\'Il parachève sur toi Son bienfait et te guide sur une voie droite. » — Coran 48:2' },
];

const SAISONS = {
  hiver: {
    nom: 'Hiver', foodTeaser: 'Bouillons chauds, épices, fer', skinTeaser: 'Hydratation intense & réparation', emoji: '🌙', phase: 'Phase menstruelle',
    color: '#7B5EA7', light: '#B89FD4', soft: '#F0EBF8', dark: '#3D2060',
    grad: 'linear-gradient(145deg, #3D2060, #7B5EA7)',
    jours: [1,5],
    messages: {
      bien: "Tu vas bien en Hiver — c'est précieux. Repose-toi vraiment, sans culpabilité. Ton corps travaille même quand tu ne le sens pas.",
      fatiguee: "Tu n'es pas paresseuse. Ton corps est en mode économie d'énergie — c'est biologique. Faire peu aujourd'hui, c'est déjà beaucoup.",
      difficile: "Merci de l'avoir dit. Tu n'as pas à aller bien tout le temps. Aujourd'hui, une chose douce suffit — pour toi.",
      foi: "Les hormones influencent ton état intérieur — c'est physiologique, pas de l'hypocrisie. Un seul dhikr aujourd'hui, c'est déjà immense."
    },
    suggestions: ['🌿 Étirements doux','😴 Repos — c\'est ton entraînement','📖 Lecture ou tafsir','🤲 Dhikr doux','🫖 Tisane chaude'],
    invocation: { arabic:'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ', fr:'"Allah me suffit, et Il est le meilleur garant."', source:'Coran 3:173' },
    suggTitle: '🌙 Suggestions de l\'Hiver',
    suggDesc: 'Douce, intentionnelle, sans pression.',
    alimentation: {
      nutriments: [
        {nom:'🩸 Fer', why:'Compense les pertes menstruelles'},
        {nom:'💊 Magnésium', why:'Réduit crampes et tensions'},
        {nom:'🫀 Oméga-3', why:'Anti-inflammatoire naturel'},
        {nom:'🌡️ Vitamine C', why:'Améliore l\'absorption du fer'},
      ],
      aliments: ['Lentilles','Épinards','Dattes','Chocolat noir 70%+','Amandes','Sardines','Betterave','Gingembre','Curcuma'],
      star: ['Lentilles','Épinards','Dattes'],
      eviter: ['Café en excès','Sel en excès','Sucre raffiné'],
    },
    sport: {
      seance: { name:'Douceur profonde', duration:'7 min', meta:'Sol · Tapis · Zéro impact',
        exercices:[
          {num:'01', name:'Respiration abdominale', detail:'Allongée, mains sur le ventre. 10 respirations.'},
          {num:'02', name:'Posture enfant', detail:'Genoux écartés, front au sol. 2 minutes.'},
          {num:'03', name:'Rotation douce dos', detail:'Genoux pliés, tomber à droite/gauche. 5×.'},
          {num:'04', name:'Étirement hanches', detail:'Genou sur la poitrine. 30 sec chaque côté.'},
        ]
      },
      mouvements: ['Étirements doux','Mobilité du bassin','Posture enfant','Respiration profonde','Marche contemplative']
    },
    skincare: {
      whatHappens: 'Les hormones sont au plus bas — ta peau est plus sèche, plus sensible et la barrière cutanée est affaiblie.',
      actifs: [
        {nom:'🌹 Huile de rose musquée', why:'Régénérante, nourrit la barrière cutanée', usage:'Quelques gouttes le soir'},
        {nom:'🍯 Miel brut', why:'Antibactérien, hydratant', usage:'Masque 10 min, 2×/semaine'},
        {nom:'🌿 Aloé vera', why:'Apaisant, anti-inflammatoire', usage:'Gel pur après nettoyage'},
      ],
      gestes: ['Nettoyage très doux','Hydratation renforcée','Masque nourrissant','Moins de maquillage'],
      eviter: ['Exfoliants agressifs','Acides forts','Chaleur excessive'],
      today: 'Huile de rose musquée + Aloé vera'
    }
  },
  printemps: {
    nom: 'Printemps', foodTeaser: 'Légumes verts, probiotiques, zinc', skinTeaser: 'Exfoliation douce & éclat', emoji: '🌸', phase: 'Phase folliculaire',
    color: '#3DAE8A', light: '#80D4B8', soft: '#E8F8F3', dark: '#1A6B52',
    grad: 'linear-gradient(145deg, #1A6B52, #3DAE8A)',
    jours: [6,13],
    messages: {
      bien: "Tu remarques peut-être plus d'élan — profites-en pour avancer sur ce qui attend depuis un moment.",
      fatiguee: "La fatigue en Printemps mérite attention. Écoute ce que ton corps demande.",
      difficile: "Merci de l'avoir dit. Tu n'as pas à aller bien tout le temps. Aujourd'hui, une chose douce suffit.",
      foi: "La foi fluctue avec le corps — c'est humain. Un seul acte aujourd'hui, le plus simple que tu puisses faire."
    },
    suggestions: ['☎️ Appeler un proche','🚀 Avancer un projet','✉️ Message de gratitude','🌸 Sortir marcher','📚 Apprendre quelque chose'],
    invocation: { arabic:'رَبِّ أَوْزِعْنِي أَنْ أَشْكُرَ نِعْمَتَكَ', fr:'"Seigneur, inspire-moi de remercier pour Tes bienfaits."', source:'Coran 27:19' },
    suggTitle: '🌸 Suggestions du Printemps',
    suggDesc: 'Des petits gestes adaptés à ton énergie du moment.',
    alimentation: {
      nutriments: [
        {nom:'🌱 Phytoœstrogènes', why:'Soutiennent la montée naturelle'},
        {nom:'🧠 Vitamines B', why:'Énergie et clarté mentale'},
        {nom:'🥬 Fibres', why:'Éliminent l\'excès d\'œstrogènes'},
        {nom:'💧 Hydratation', why:'Amplifie l\'énergie naturelle'},
      ],
      aliments: ['Graines de lin','Avocat','Œufs','Brocoli','Quinoa','Fruits rouges','Yaourt','Poulet','Noix','Pois chiches'],
      star: ['Graines de lin','Avocat','Quinoa'],
      eviter: ['Aliments trop lourds','Friture en excès','Sucre raffiné'],
    },
    sport: {
      seance: { name:'Réveil en douceur', duration:'12 min', meta:'Mix sol + debout',
        exercices:[
          {num:'01', name:'Rotations d\'échauffement', detail:'Chevilles, épaules, cou. 2 minutes.'},
          {num:'02', name:'10 squats lents', detail:'Descendre lentement, remonter en expirant.'},
          {num:'03', name:'Gainage genoux', detail:'Planche sur les genoux. Tenir 20 sec. 3×.'},
          {num:'04', name:'10 fentes alternées', detail:'Genou à 90°. 8 par jambe.'},
        ]
      },
      mouvements: ['Pilates doux','Marche rapide','Squats doux','Fentes légères','Vélo tranquille']
    },
    skincare: {
      whatHappens: 'Les œstrogènes montent — ta peau devient plus lumineuse. C\'est la meilleure phase pour les soins actifs.',
      actifs: [
        {nom:'✨ Vitamine C naturelle', why:'Éclat et anti-oxydant', usage:'Sérum le matin'},
        {nom:'🌾 Argile blanche', why:'Exfoliante douce, purifiante', usage:'Masque 1×/semaine'},
        {nom:'🌺 Niacinamide', why:'Resserre les pores, unifie le teint', usage:'Sérum ou crème légère'},
      ],
      gestes: ['Exfoliation douce 1-2×/sem','Masque purifiant','Sérum vitamine C','Gua sha'],
      eviter: ['Sur-exfolier','Mélanger trop d\'actifs'],
      today: 'Vitamine C + Argile blanche'
    }
  },
  ete: {
    nom: 'Été', foodTeaser: 'Protéines, antioxydants, oméga-3', skinTeaser: 'Protection & légèreté', emoji: '☀️', phase: 'Phase ovulatoire',
    color: '#E8834A', light: '#F5C040', soft: '#FFF8EE', dark: '#7A3A10',
    grad: 'linear-gradient(145deg, #7A3A10, #E8834A, #F5C040)',
    jours: [14,17],
    messages: {
      bien: "Tu es à ton pic. C'est le bon moment pour les efforts physiques, les conversations importantes.",
      fatiguee: "Si tu te sens fatiguée alors que ton cycle dit Été — c'est un signal. Le corps parle toujours juste.",
      difficile: "Merci de l'avoir dit. Tu n'as pas à aller bien tout le temps. Aujourd'hui, une chose douce suffit.",
      foi: "L'Été est une bonne fenêtre pour un petit acte de reconnexion. Pas une liste — juste un geste."
    },
    suggestions: ['🎁 Offrir quelque chose','💬 Conversation importante','🌍 Sortir et voir du monde','💝 Sadaqa','✍️ Écrire un mot doux'],
    invocation: { arabic:'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً', fr:'"Seigneur, accorde-nous le bien ici-bas et dans l\'au-delà."', source:'Coran 2:201' },
    suggTitle: '☀️ Suggestions de l\'Été',
    suggDesc: 'Tu rayonnes — donne, partage, connecte.',
    alimentation: {
      nutriments: [
        {nom:'🫐 Antioxydants', why:'Protègent les cellules à l\'ovulation'},
        {nom:'🐟 Zinc', why:'Soutient l\'ovulation et l\'immunité'},
        {nom:'💧 Hydratation++', why:'Corps naturellement moins assoiffé'},
        {nom:'🥗 Légèreté', why:'Appétit naturellement réduit'},
      ],
      aliments: ['Pastèque','Concombre','Tomates','Graines de courge','Poisson blanc','Salade verte','Myrtilles','Grenade'],
      star: ['Pastèque','Concombre','Graines de courge'],
      eviter: ['Plats trop lourds','Excès de caféine','Pro-inflammatoires'],
    },
    sport: {
      seance: { name:'Circuit énergie', duration:'18 min', meta:'Mix debout + sol',
        exercices:[
          {num:'01', name:'Marche sur place', detail:'2 minutes en montant progressivement.'},
          {num:'02', name:'12 squats', detail:'3 séries. Descendre lentement, remonter fort.'},
          {num:'03', name:'10 pompes modifiées', detail:'Sur les genoux ou contre le mur.'},
          {num:'04', name:'30 sec gainage', detail:'Planche complète ou genoux. 3 fois.'},
        ]
      },
      mouvements: ['HIIT doux','Cardio léger','Renforcement','Danse','Pompes','Squats sautés doux']
    },
    skincare: {
      whatHappens: 'Pic d\'œstrogènes — ta peau est au meilleur d\'elle-même. Mais le pic hormonal peut stimuler les glandes sébacées.',
      actifs: [
        {nom:'🌸 Eau de rose', why:'Tonifiante, légèrement astringente', usage:'Brume matin & soir'},
        {nom:'🌿 Hamamélis', why:'Resserre les pores dilatés', usage:'Tonique après nettoyage'},
        {nom:'🫧 Argile verte légère', why:'Absorbe l\'excès de sébum', usage:'Masque express 5 min'},
      ],
      gestes: ['Routine simplifiée','SPF renforcé','Brume fraîche','Moins de couches'],
      eviter: ['Produits occlusifs','Exfoliation agressive','Huiles lourdes'],
      today: 'Eau de rose + Hamamélis'
    }
  },
  automne: {
    nom: 'Automne', foodTeaser: 'Magnésium, complexe B, chocolat noir', skinTeaser: 'Apaisement & barrière cutanée', emoji: '🍂', phase: 'Phase lutéale',
    color: '#C4694A', light: '#E8A090', soft: '#FDF0EE', dark: '#5A2018',
    grad: 'linear-gradient(145deg, #5A2018, #C4694A)',
    jours: [18,28],
    messages: {
      bien: "Des fluctuations arrivent peut-être — maintenant que tu le sais, elles ne te surprendront pas.",
      fatiguee: "Peut-être que tout te semble plus lourd — c'est ton Automne. Une chose. La plus petite. Juste une.",
      difficile: "Ce que tu ressens — ce doute — c'est ton Automne qui parle, pas la réalité. Attends le Printemps pour décider.",
      foi: "Tenir malgré la lourdeur, c'est déjà un acte spirituel. Tu es vue."
    },
    suggestions: ['📞 Appeler ses parents','🌬️ Respiration profonde','📖 Cours islamique','✍️ Journaling profond','🛁 Se dorloter'],
    invocation: { arabic:'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ', fr:'"Ô Allah, je me réfugie en Toi contre l\'anxiété et la tristesse."', source:'Authentique — Boukhari' },
    suggTitle: '🍂 Suggestions de l\'Automne',
    suggDesc: 'Ralentis, retourne vers toi.',
    alimentation: {
      nutriments: [
        {nom:'💊 Magnésium', why:'Réduit irritabilité, crampes, insomnie'},
        {nom:'😊 Tryptophane', why:'Précurseur de la sérotonine'},
        {nom:'🍬 Glucides complexes', why:'Stabilisent la glycémie'},
        {nom:'🌿 Vitamine B6', why:'Réduit les symptômes du SPM'},
      ],
      aliments: ['Chocolat noir 70%+','Amandes','Banane','Patate douce','Lentilles','Dattes','Avoine','Courge'],
      star: ['Chocolat noir','Amandes','Banane'],
      eviter: ['Café en excès','Sel (rétention)','Sucre raffiné','Alcool'],
    },
    sport: {
      seance: { name:'Libération SPM', duration:'12 min', meta:'Mix sol + mur',
        exercices:[
          {num:'01', name:'Respiration libératrice', detail:'Inspirer 4, retenir 4, expirer 8. 5 cycles.'},
          {num:'02', name:'Ouverture hanches au mur', detail:'Plantes des pieds ensemble. 2 minutes.'},
          {num:'03', name:'Pont fessier lent', detail:'Mouvement fluide. 10 fois.'},
          {num:'04', name:'Legs up the wall', detail:'Jambes à la verticale. 3 minutes. Yeux fermés.'},
        ]
      },
      mouvements: ['Marche en plein air','Circuit léger','Yoga doux','Étirements profonds','Respiration libératrice']
    },
    skincare: {
      whatHappens: 'Les androgènes augmentent — production de sébum augmentée, pores plus visibles. C\'est ce qui explique les poussées d\'acné hormonale.',
      actifs: [
        {nom:'🌿 Tea tree', why:'Antibactérien, anti-poussées', usage:'1 goutte en soin local uniquement'},
        {nom:'🍵 Extrait de thé vert', why:'Anti-inflammatoire, calme les rougeurs', usage:'Tonique ou sérum'},
        {nom:'🌾 Zinc naturel', why:'Régule le sébum, aide à cicatriser', usage:'Crème ou sérum'},
      ],
      gestes: ['Nettoyage rigoureux le soir','Soin local anti-imperfections','Ne pas toucher le visage','Changer la taie d\'oreiller'],
      eviter: ['Percer les boutons','Huiles comédogènes','Exfoliation sur peau enflammée'],
      today: 'Tea tree + Thé vert + Zinc'
    }
  }
};

// ═══════════════════════════════════════════════
// PREMIUM DATA
// ═══════════════════════════════════════════════
const RECETTES = {
  hiver: [
    { nom:'Soupe lentilles-curcuma-gingembre', emoji:'🍲', pourquoi:'Le fer des lentilles compense tes pertes. Curcuma + gingembre réduisent l\'inflammation naturellement.', ingredients:['200g lentilles corail','Bouillon de légumes','1 cc curcuma, 1 cc gingembre râpé','1 oignon, 2 gousses d\'ail','Jus d\'un citron'], etapes:['Faire revenir oignon et ail 3 min','Ajouter lentilles + bouillon (600ml)','Cuire 15 min à feu moyen','Mixer la moitié pour crémer','Assaisonner, presser le citron'] },
    { nom:'Bowl épinards-sardines au sésame', emoji:'🥣', pourquoi:'Oméga-3 des sardines + fer des épinards — le duo anti-crampes de l\'Hiver par excellence.', ingredients:['1 boîte sardines à l\'huile d\'olive','Grosse poignée d\'épinards frais','80g riz complet cuit','1 cs sésame toasté','Huile d\'olive, jus de citron'], etapes:['Disposer le riz dans le bol','Ajouter épinards et sardines égouttées','Arroser d\'huile d\'olive et citron','Parsemer de sésame'] },
    { nom:'Dattes farcies amandes-chocolat noir', emoji:'🍫', pourquoi:'Magnésium du chocolat + fer des dattes + bons gras des amandes — collation anti-fatigue complète.', ingredients:['6 dattes Medjool','Poignée d\'amandes entières','2 carrés chocolat noir 70%+','Fleur de sel'], etapes:['Ouvrir les dattes et retirer les noyaux','Glisser une amande dans chaque datte','Fondre le chocolat au bain-marie','Tremper les dattes ou napper','Fleur de sel + réfrigérer 10 min'] },
  ],
  printemps: [
    { nom:'Bowl avocat-œuf poché-quinoa', emoji:'🥑', pourquoi:'Les bons gras de l\'avocat soutiennent la montée des œstrogènes. Le quinoa apporte les 9 acides aminés essentiels.', ingredients:['80g quinoa cuit','1 œuf poché','½ avocat tranché','1 cs graines de lin moulues','Citron, fleur de sel'], etapes:['Cuire le quinoa 12 min, égoutter','Porter l\'eau à frémissement pour l\'œuf','Pocher l\'œuf 3 min','Assembler quinoa + avocat + œuf','Lin moulu, citron, sel'] },
    { nom:'Salade fruits rouges & graines de lin', emoji:'🍓', pourquoi:'Les phyto-œstrogènes du lin amplifient ton élan naturel. Les antioxydants des fruits rouges protègent tes cellules.', ingredients:['Mélange fruits rouges (fraises, myrtilles, framboises)','150g yaourt grec','1 cs graines de lin moulues','1 cc miel','Quelques feuilles de menthe'], etapes:['Disposer les fruits dans un bol','Verser le yaourt à côté','Parsemer de graines de lin','Filet de miel, feuilles de menthe'] },
    { nom:'Wrap brocoli-poulet-houmous', emoji:'🌯', pourquoi:'Les fibres du brocoli éliminent l\'excès d\'œstrogènes. Les protéines du poulet soutiennent l\'énergie montante.', ingredients:['1 grande galette de blé complet','100g poulet cuit émincé','Fleurets brocoli cuits vapeur','2 cs houmous','Paprika, citron'], etapes:['Chauffer la galette 30 sec','Tartiner d\'houmous','Ajouter le poulet et le brocoli','Saupoudrer de paprika, citron','Rouler serré et couper en deux'] },
  ],
  ete: [
    { nom:'Salade pastèque-grenade-menthe-feta', emoji:'🍉', pourquoi:'Ultra-hydratante à l\'ovulation quand le corps chauffe. La grenade est un antioxydant puissant pour les cellules ovariennes.', ingredients:['Tranches de pastèque sans graines','Grains de ½ grenade','60g feta émiettée','Feuilles de menthe fraîche','Jus de citron vert'], etapes:['Couper la pastèque en cubes','Égrener la grenade au-dessus','Émietter la feta par-dessus','Ajouter la menthe ciselée','Presser le citron vert, servir frais'] },
    { nom:'Filet de poisson vapeur & taboulé léger', emoji:'🐟', pourquoi:'Les protéines légères soutiennent l\'ovulation. Le zinc des herbes et céréales renforce l\'immunité à son pic.', ingredients:['150g filet de poisson blanc','120g taboulé (boulgour, persil, tomates)','1 cs graines de courge','Huile d\'olive extra-vierge','Citron, sel, poivre'], etapes:['Cuire le poisson vapeur 8 min','Préparer le taboulé classique','Dresser le poisson sur le taboulé','Parsemer de graines de courge','Huile d\'olive et quartier de citron'] },
    { nom:'Smoothie myrtilles-épinards-gingembre', emoji:'🫐', pourquoi:'Les antioxydants des myrtilles protègent les ovocytes. Le gingembre est anti-inflammatoire et booste la digestion.', ingredients:['100g myrtilles surgelées','Grosse poignée d\'épinards','2cm gingembre frais','150ml lait de coco léger','1 cc miel'], etapes:['Tout mettre dans le blender','Mixer 45 secondes à haute vitesse','Goûter, ajuster le miel','Servir immédiatement dans un grand verre'] },
  ],
  automne: [
    { nom:'Curry patate douce-lentilles-coco', emoji:'🍛', pourquoi:'Les glucides complexes stabilisent ta glycémie et ton humeur. Le magnésium des lentilles réduit directement l\'irritabilité du SPM.', ingredients:['2 petites patates douces','150g lentilles corail','200ml lait de coco','Curry, cumin, curcuma','1 oignon, 2 gousses d\'ail'], etapes:['Faire revenir oignon, ail et épices 3 min','Ajouter dés de patate douce','Verser lentilles + lait de coco + 200ml eau','Couvrir, cuire 20 min à feu doux','Rectifier l\'assaisonnement'] },
    { nom:'Porridge avoine-banane-chocolat noir', emoji:'🍌', pourquoi:'Le tryptophane de la banane se transforme en sérotonine. L\'avoine libère l\'énergie lentement pour éviter les fringales du SPM.', ingredients:['80g flocons d\'avoine','300ml lait d\'amande','1 banane mûre','1 carré chocolat noir 70%+','Cannelle, 1 cc miel'], etapes:['Porter le lait à frémissement','Ajouter les flocons, remuer 5 min','Trancher la banane','Disposer sur le porridge chaud','Râper le chocolat, saupoudrer cannelle + miel'] },
    { nom:'Bowl épinards-amandes-datte & fromage', emoji:'🥗', pourquoi:'Magnésium des amandes + sucre lent des dattes + fer des épinards — le trio parfait contre le SPM.', ingredients:['Grosse poignée épinards sautés à l\'ail','Poignée d\'amandes effilées toastées','4 dattes Medjool coupées','60g halloumi grillé (ou feta)','1 cs vinaigre balsamique'], etapes:['Sauter les épinards à l\'ail 2 min','Griller le halloumi 2 min par face','Assembler épinards + amandes + dattes','Poser le fromage chaud dessus','Filet de balsamique, servir chaud'] },
  ],
};

const ROUTINES_PREMIUM = {
  hiver: {
    matin: [
      { icon:'🧴', geste:'Nettoyage ultra-doux', duree:'1 min', detail:'Eau tiède + nettoyant crémeux sans sulfates. Pas de frottement — tamponner délicatement.' },
      { icon:'🌿', geste:'Aloé vera pur', duree:'30 sec', detail:'Gel d\'aloé sur peau légèrement humide. Laisser absorber 1 min avant la suite.' },
      { icon:'🌹', geste:'Huile de rose musquée', duree:'1 min', detail:'3-4 gouttes. Presser entre les paumes, appliquer par petits tamponnements.' },
      { icon:'☀️', geste:'SPF 30 minimum', duree:'30 sec', detail:'Même par temps gris. Protège la barrière cutanée fragilisée par les hormones basses.' },
    ],
    soir: [
      { icon:'🛢️', geste:'Nettoyage à l\'huile', duree:'2 min', detail:'Huile de jojoba sur visage sec, masser 60 sec en cercles, rincer à l\'eau tiède.' },
      { icon:'🍯', geste:'Masque miel brut (2×/sem)', duree:'10 min', detail:'Couche fine sur visage propre. Anti-inflammatoire et réparateur. Rincer à l\'eau tiède.' },
      { icon:'🌹', geste:'Sérum rose musquée', duree:'1 min', detail:'5-6 gouttes sur peau légèrement humide pour maximiser la pénétration.' },
      { icon:'💧', geste:'Crème barrière riche', duree:'30 sec', detail:'Scelle tout en dernier. Rechercher : céramides, beurre de karité, squalane.' },
    ],
  },
  printemps: {
    matin: [
      { icon:'🧴', geste:'Nettoyage en douceur', duree:'1 min', detail:'Mousse légère ou eau micellaire. Rincer à l\'eau légèrement fraîche pour tonifier.' },
      { icon:'✨', geste:'Sérum vitamine C', duree:'1 min', detail:'3-4 gouttes sur peau sèche. Presser doucement. Laisser absorber 2 minutes.' },
      { icon:'🌺', geste:'Crème légère niacinamide', duree:'30 sec', detail:'Unifie le teint, resserre les pores. Parfaite pour amplifier l\'éclat du Printemps.' },
      { icon:'☀️', geste:'SPF 30+', duree:'30 sec', detail:'Dernier geste impératif. La vitamine C + SPF = combo anti-taches optimal.' },
    ],
    soir: [
      { icon:'🛢️', geste:'Double nettoyage', duree:'2 min', detail:'Huile pour démaquiller en premier, puis nettoyant doux pour purifier en profondeur.' },
      { icon:'🪨', geste:'Gua sha 3 min', duree:'3 min', detail:'Mouvements ascendants sur sérum hydratant. Drainer, tonifier, stimuler la microcirculation.' },
      { icon:'🌾', geste:'Masque argile blanche (1×/sem)', duree:'8 min', detail:'Appliquer sur zone T. Rincer avant séchage complet — jamais plus de 8 min.' },
      { icon:'💧', geste:'Hydratant léger', duree:'30 sec', detail:'Texture gel ou fluide. Laisser absorber sans frotter.' },
    ],
  },
  ete: {
    matin: [
      { icon:'💧', geste:'Nettoyage express à l\'eau fraîche', duree:'30 sec', detail:'Eau fraîche uniquement le matin. La peau est équilibrée — ne pas sur-nettoyer.' },
      { icon:'🌸', geste:'Brume eau de rose', duree:'20 sec', detail:'Spritzer à 20 cm du visage. Laisser sécher naturellement, ne pas tamponner.' },
      { icon:'🌿', geste:'Gel aloé ultra-léger', duree:'30 sec', detail:'Texture quasi invisible. Hydrate sans occlure les pores dilatés par la chaleur.' },
      { icon:'☀️', geste:'SPF 50 — impératif', duree:'30 sec', detail:'Pic hormonal + peau au meilleur d\'elle-même. Protège-la absolument.' },
    ],
    soir: [
      { icon:'🛢️', geste:'Double nettoyage', duree:'2 min', detail:'Huile pour enlever le SPF et le sébum, puis gel nettoyant léger purifiant.' },
      { icon:'🌿', geste:'Brume hamamélis', duree:'20 sec', detail:'Resserre les pores après nettoyage. Tonique naturel astringent doux.' },
      { icon:'💦', geste:'Sérum hydratant ultra-léger', duree:'1 min', detail:'Gel d\'aloé ou hyaluronate. Pas d\'huile le soir — la peau est déjà équilibrée.' },
    ],
  },
  automne: {
    matin: [
      { icon:'🧼', geste:'Nettoyage rigoureux', duree:'1 min 30', detail:'Nettoyant sans huile, sans sulfates agressifs. Bien insister sur la zone T.' },
      { icon:'🍵', geste:'Tonique thé vert', duree:'30 sec', detail:'Appliquer sur coton. Anti-inflammatoire — calme les rougeurs hormonales en 30 sec.' },
      { icon:'🌾', geste:'Sérum zinc', duree:'1 min', detail:'Cible le sébum et les imperfections hormonales. Appliquer sur les zones à acné.' },
      { icon:'☀️', geste:'Crème SPF légère non-comédogène', duree:'30 sec', detail:'Vérifier "non-comédogène" sur l\'emballage. Essentiel en phase lutéale.' },
    ],
    soir: [
      { icon:'🧼', geste:'Nettoyage soigneux', duree:'2 min', detail:'Le nettoyage du soir est le plus important. Prends le temps de bien enlever tout.' },
      { icon:'🌿', geste:'Tea tree en soin local', duree:'30 sec', detail:'1 goutte pure sur les imperfections uniquement. Jamais sur la peau saine.' },
      { icon:'🍵', geste:'Crème thé vert apaisante', duree:'30 sec', detail:'Calme l\'inflammation nocturne. Récupération pendant le sommeil.' },
      { icon:'🛏️', geste:'Changer ta taie d\'oreiller', duree:'1 min', detail:'Les bactéries s\'accumulent vite. En Automne, changer 2× par semaine minimum.' },
    ],
  },
};

const SPORT_NIVEAUX = {
  hiver: [
    { niveau:2, name:'Douceur +', duration:'10 min', meta:'Sol · Tapis · Respiratoire', exercices:[
      {num:'01', name:'Respiration abdominale profonde', detail:'15 respirations. Mains sur le ventre, sentir l\'expansion.'},
      {num:'02', name:'Posture enfant étendue', detail:'3 minutes, bras tendus devant. Respirer dans le bas du dos.'},
      {num:'03', name:'Rotation lombaire', detail:'Genoux pliés, 8× de chaque côté, très lentement.'},
      {num:'04', name:'Étirement hanches bilatéral', detail:'1 minute chaque côté. Souffle long, ne pas forcer.'},
    ]},
    { niveau:3, name:'Mobilité douce', duration:'15 min', meta:'Sol · Aucun impact', exercices:[
      {num:'01', name:'Scan corporel allongé', detail:'5 minutes. Chaque expiration relâche un groupe musculaire.'},
      {num:'02', name:'Chat-vache lent', detail:'10 cycles. Vertèbre par vertèbre, aucune précipitation.'},
      {num:'03', name:'Pont fessier doux', detail:'10 fois, 3 secondes en haut, relâche sans bruit.'},
      {num:'04', name:'Posture pigeon modifiée', detail:'2 minutes chaque côté. Respire dans la résistance.'},
    ]},
    { niveau:4, name:'Yin complet', duration:'20 min', meta:'Yoga · Sol · Méditatif', exercices:[
      {num:'01', name:'Papillon allongé', detail:'5 minutes. Pieds ensemble, genoux ouverts vers le sol.'},
      {num:'02', name:'Torsion douce au sol', detail:'3 minutes de chaque côté. Yeux fermés, épaules au sol.'},
      {num:'03', name:'Jambes au mur', detail:'5 minutes. Respiration abdominale ample.'},
      {num:'04', name:'Savasana guidé', detail:'5 minutes. Laisse chaque muscle se fondre dans le sol.'},
    ]},
  ],
  printemps: [
    { niveau:2, name:'Activation +', duration:'15 min', meta:'Debout + sol', exercices:[
      {num:'01', name:'Échauffement articulaire', detail:'3 minutes. Chevilles, hanches, épaules — cercles fluides.'},
      {num:'02', name:'15 squats lents', detail:'3 séries. Descente 3 sec, remontée contrôlée.'},
      {num:'03', name:'Gainage planche genoux', detail:'3× 25 secondes. Bassin ni trop haut ni trop bas.'},
      {num:'04', name:'12 fentes alternées / jambe', detail:'Genou arrière proche du sol. Pousser sur le talon avant.'},
    ]},
    { niveau:3, name:'Renforcement', duration:'18 min', meta:'Debout + sol · Progressif', exercices:[
      {num:'01', name:'Squat sauté doux', detail:'3× 10. Atterrissage silencieux, genoux mous à l\'impact.'},
      {num:'02', name:'Pompes sur les genoux', detail:'3× 10. Gainage abdominal actif, coudes à 45°.'},
      {num:'03', name:'Pont fessier pulsé', detail:'3× 15 avec pause 2 sec en haut, squeeze.'},
      {num:'04', name:'Mountain climbers lents', detail:'20 alternés. Contrôle la respiration, pas de tête qui plonge.'},
    ]},
    { niveau:4, name:'Circuit progressif', duration:'22 min', meta:'HIIT léger · Cardio', exercices:[
      {num:'01', name:'Squats sautés', detail:'4× 12. Bras en avant pour l\'élan, profondeur maximale.'},
      {num:'02', name:'Pompes + rotation du tronc', detail:'3× 8. Après chaque pompe, rotation du bras vers le ciel.'},
      {num:'03', name:'Burpees sans saut', detail:'3× 8. Descente contrôlée, montée explosive.'},
      {num:'04', name:'Sprint sur place 30 sec', detail:'4 fois avec 20 sec de récup active (marche).'},
    ]},
  ],
  ete: [
    { niveau:2, name:'Circuit +', duration:'22 min', meta:'Debout · Force explosive', exercices:[
      {num:'01', name:'Squat sauté 3× 12', detail:'Atterrissage contrôlé, fesses en arrière, bras en avant.'},
      {num:'02', name:'Gainage latéral', detail:'3× 30 sec par côté. Corps parfaitement droit.'},
      {num:'03', name:'Fentes sautées alternées', detail:'3× 10 alternées. Élan des bras opposés pour équilibre.'},
      {num:'04', name:'Pompes standard', detail:'3× 8. Poitrine effleure le sol, coudes proches du corps.'},
    ]},
    { niveau:3, name:'Force & cardio', duration:'25 min', meta:'Mix force + intensité', exercices:[
      {num:'01', name:'Burpees complets', detail:'4× 10. Gainage, saut groupé, retour en souplesse.'},
      {num:'02', name:'Pompes pieds surélevés', detail:'3× 8. Pieds sur le canapé — charge sur les épaules.'},
      {num:'03', name:'Box squat explosif', detail:'3× 15 sur une chaise. Toucher et repartir immédiatement.'},
      {num:'04', name:'Sprint genoux hauts 1 min', detail:'4 séries. Récupération 30 sec marche.'},
    ]},
    { niveau:4, name:'HIIT complet', duration:'30 min', meta:'Haute intensité · Cardio fort', exercices:[
      {num:'01', name:'Jumping jacks 45 sec', detail:'4 séries. Récup 15 sec. Plein d\'amplitude.'},
      {num:'02', name:'Squats chargés 20 reps', detail:'Sac à dos lesté ou bouteilles dans les bras.'},
      {num:'03', name:'Burpees + pompes', detail:'4× 10. Pompe à chaque descente, saut groupé à chaque montée.'},
      {num:'04', name:'Tabata sprint-récup', detail:'20 sec sprint max, 10 sec repos. 8 rounds.'},
    ]},
  ],
  automne: [
    { niveau:2, name:'Détente active +', duration:'15 min', meta:'Yoga · Sol', exercices:[
      {num:'01', name:'Respiration libératrice', detail:'5 cycles, expiration 2× plus longue que l\'inspiration.'},
      {num:'02', name:'Guerrier I & II', detail:'1 minute chaque posture, chaque côté. Ancrage dans le sol.'},
      {num:'03', name:'Torsion assise', detail:'1 min par côté. Respire dans la torsion, pas de force.'},
      {num:'04', name:'Pont lent 12×', detail:'3 sec en haut, squeeze. Lombaires collées au sol.'},
    ]},
    { niveau:3, name:'Équilibre & ancrage', duration:'18 min', meta:'Yoga + renfo doux', exercices:[
      {num:'01', name:'Salutation au soleil × 3', detail:'Enchaînement fluide. 1 min par cycle complet.'},
      {num:'02', name:'Guerrier III — équilibre', detail:'30 sec par jambe. Regard fixe sur un point.'},
      {num:'03', name:'Étirement psoas en fente basse', detail:'2 min par côté. Laisser le poids du corps étirer.'},
      {num:'04', name:'Savasana conscient', detail:'3 min. Scan corporel, relâche totale.'},
    ]},
    { niveau:4, name:'Yin libérateur', duration:'22 min', meta:'Yin yoga · Profond', exercices:[
      {num:'01', name:'Dragon — fente yin', detail:'4 min par côté. Gravité fait le travail, pas les muscles.'},
      {num:'02', name:'Papillon (baddha konasana)', detail:'5 min. Dos droit ou arrondi selon confort.'},
      {num:'03', name:'Demi-tortue', detail:'4 min. Front au sol si possible. Bras tendus.'},
      {num:'04', name:'Savasana + respiration 4-7-8', detail:'5 min. Inspirer 4, retenir 7, souffler 8. 8 cycles.'},
    ]},
  ],
};

const ASMA = [
  {num:1,ar:'اللَّهُ',fr:'Allah'},{num:2,ar:'الرَّحْمَنُ',fr:'Ar-Rahman · Le Tout Miséricordieux'},{num:3,ar:'الرَّحِيمُ',fr:'Ar-Rahim · Le Très Miséricordieux'},{num:4,ar:'الْمَلِكُ',fr:'Al-Malik · Le Roi'},{num:5,ar:'الْقُدُّوسُ',fr:'Al-Quddous · Le Très Saint'},
  {num:6,ar:'السَّلَامُ',fr:'As-Salam · La Paix'},{num:7,ar:'الْمُؤْمِنُ',fr:"Al-Mu'min · Celui qui donne la sécurité"},{num:8,ar:'الْمُهَيْمِنُ',fr:'Al-Muhaimin · Le Gardien Suprême'},{num:9,ar:'الْعَزِيزُ',fr:"Al-Aziz · Le Puissant"},{num:10,ar:'الْجَبَّارُ',fr:'Al-Jabbar · Le Contraignant'},
  {num:11,ar:'الْمُتَكَبِّرُ',fr:'Al-Mutakabbir · Le Très Grand'},{num:12,ar:'الْخَالِقُ',fr:'Al-Khaliq · Le Créateur'},{num:13,ar:'الْبَارِئُ',fr:"Al-Bari · Le Formateur"},{num:14,ar:'الْمُصَوِّرُ',fr:'Al-Mussawwir · Le Façonneur'},{num:15,ar:'الْغَفَّارُ',fr:'Al-Ghaffar · Le Grand Pardonneur'},
  {num:16,ar:'الْقَهَّارُ',fr:'Al-Qahhar · Le Dominateur Absolu'},{num:17,ar:'الْوَهَّابُ',fr:'Al-Wahhab · Le Donateur'},{num:18,ar:'الرَّزَّاقُ',fr:'Ar-Razzaq · Le Pourvoyeur'},{num:19,ar:'الْفَتَّاحُ',fr:'Al-Fattah · Le Grand Ouvreur'},{num:20,ar:'الْعَلِيمُ',fr:"Al-Alim · L'Omniscient"},
  {num:21,ar:'الْقَابِضُ',fr:'Al-Qabid · Celui qui retient'},{num:22,ar:'الْبَاسِطُ',fr:'Al-Basit · Celui qui étend'},{num:23,ar:'الْخَافِضُ',fr:'Al-Khafid · Celui qui abaisse'},{num:24,ar:'الرَّافِعُ',fr:"Ar-Rafi · Celui qui élève"},{num:25,ar:'الْمُعِزُّ',fr:"Al-Mu'izz · Celui qui honore"},
  {num:26,ar:'الْمُذِلُّ',fr:'Al-Mudhill · Celui qui humilie'},{num:27,ar:'السَّمِيعُ',fr:'As-Sami · Le Tout-Entendant'},{num:28,ar:'الْبَصِيرُ',fr:'Al-Basir · Le Clairvoyant'},{num:29,ar:'الْحَكَمُ',fr:'Al-Hakam · Le Juge'},{num:30,ar:'الْعَدْلُ',fr:"Al-Adl · Le Juste"},
  {num:31,ar:'اللَّطِيفُ',fr:'Al-Latif · Le Subtil'},{num:32,ar:'الْخَبِيرُ',fr:'Al-Khabir · Le Bien Informé'},{num:33,ar:'الْحَلِيمُ',fr:'Al-Halim · Le Clément'},{num:34,ar:'الْعَظِيمُ',fr:'Al-Azim · Le Très Grand'},{num:35,ar:'الْغَفُورُ',fr:'Al-Ghafur · Le Très Indulgent'},
  {num:36,ar:'الشَّكُورُ',fr:'Ash-Shakur · Le Très Reconnaissant'},{num:37,ar:'الْعَلِيُّ',fr:'Al-Ali · Le Très Haut'},{num:38,ar:'الْكَبِيرُ',fr:'Al-Kabir · Le Très Grand'},{num:39,ar:'الْحَفِيظُ',fr:'Al-Hafiz · Le Gardien'},{num:40,ar:'الْمُقِيتُ',fr:'Al-Muqit · Le Mainteneur'},
  {num:41,ar:'الْحَسِيبُ',fr:'Al-Hasib · Le Teneur de comptes'},{num:42,ar:'الْجَلِيلُ',fr:'Al-Jalil · Le Majestueux'},{num:43,ar:'الْكَرِيمُ',fr:'Al-Karim · Le Généreux'},{num:44,ar:'الرَّقِيبُ',fr:'Ar-Raqib · Le Vigilant'},{num:45,ar:'الْمُجِيبُ',fr:'Al-Mujib · Celui qui répond'},
  {num:46,ar:'الْوَاسِعُ',fr:'Al-Wasi · Le Vaste'},{num:47,ar:'الْحَكِيمُ',fr:'Al-Hakim · Le Sage'},{num:48,ar:'الْوَدُودُ',fr:"Al-Wadud · Le Plein d'Amour"},{num:49,ar:'الْمَجِيدُ',fr:'Al-Majid · Le Très Glorieux'},{num:50,ar:'الْبَاعِثُ',fr:"Al-Ba'ith · Le Ressuscitateur"},
  {num:51,ar:'الشَّهِيدُ',fr:'Ash-Shahid · Le Témoin'},{num:52,ar:'الْحَقُّ',fr:'Al-Haqq · La Vérité'},{num:53,ar:'الْوَكِيلُ',fr:'Al-Wakil · Le Garant'},{num:54,ar:'الْقَوِيُّ',fr:'Al-Qawi · Le Très Fort'},{num:55,ar:'الْمَتِينُ',fr:'Al-Matin · Le Ferme'},
  {num:56,ar:'الْوَلِيُّ',fr:'Al-Wali · Le Proche'},{num:57,ar:'الْحَمِيدُ',fr:'Al-Hamid · Le Digne de louanges'},{num:58,ar:'الْمُحْصِي',fr:'Al-Muhsi · Le Dénombrateur'},{num:59,ar:'الْمُبْدِئُ',fr:'Al-Mubdi · Le Principe'},{num:60,ar:'الْمُعِيدُ',fr:"Al-Mu'id · Celui qui restaure"},
  {num:61,ar:'الْمُحْيِي',fr:'Al-Muhyi · Le Vivificateur'},{num:62,ar:'الْمُمِيتُ',fr:'Al-Mumit · Le Donneur de mort'},{num:63,ar:'الْحَيُّ',fr:'Al-Hayy · Le Vivant'},{num:64,ar:'الْقَيُّومُ',fr:'Al-Qayyum · Le Subsistant'},{num:65,ar:'الْوَاجِدُ',fr:'Al-Wajid · Celui qui trouve'},
  {num:66,ar:'الْمَاجِدُ',fr:'Al-Majid · Le Glorieux'},{num:67,ar:'الْوَاحِدُ',fr:"Al-Wahid · L'Unique"},{num:68,ar:'الصَّمَدُ',fr:"As-Samad · L'Indépendant"},{num:69,ar:'الْقَادِرُ',fr:'Al-Qadir · Le Puissant'},{num:70,ar:'الْمُقْتَدِرُ',fr:'Al-Muqtadir · Le Très Puissant'},
  {num:71,ar:'الْمُقَدِّمُ',fr:'Al-Muqaddim · Celui qui avance'},{num:72,ar:'الْمُؤَخِّرُ',fr:"Al-Mu'akhkhir · Celui qui retarde"},{num:73,ar:'الأَوَّلُ',fr:'Al-Awwal · Le Premier'},{num:74,ar:'الآخِرُ',fr:'Al-Akhir · Le Dernier'},{num:75,ar:'الظَّاهِرُ',fr:"Az-Zahir · L'Apparent"},
  {num:76,ar:'الْبَاطِنُ',fr:'Al-Batin · Le Caché'},{num:77,ar:'الْوَالِي',fr:'Al-Wali · Le Gouverneur'},{num:78,ar:'الْمُتَعَالِي',fr:"Al-Muta'ali · Le Très Élevé"},{num:79,ar:'الْبَرُّ',fr:'Al-Barr · Le Bienfaisant'},{num:80,ar:'التَّوَّابُ',fr:'At-Tawwab · Le Grand Repentant'},
  {num:81,ar:'الْمُنْتَقِمُ',fr:'Al-Muntaqim · Celui qui punit'},{num:82,ar:'الْعَفُوُّ',fr:'Al-Afuww · Celui qui pardonne'},{num:83,ar:'الرَّؤُوفُ',fr:"Ar-Ra'uf · Le Très Compatissant"},{num:84,ar:'مَالِكُ الْمُلْكِ',fr:'Malik-ul-Mulk · Maître du Royaume'},{num:85,ar:'ذُو الْجَلَالِ',fr:'Dhu-l-Jalal · Maître de la Majesté'},
  {num:86,ar:'الْمُقْسِطُ',fr:"Al-Muqsit · L'Équitable"},{num:87,ar:'الْجَامِعُ',fr:'Al-Jami · Le Rassembleur'},{num:88,ar:'الْغَنِيُّ',fr:'Al-Ghani · Le Riche'},{num:89,ar:'الْمُغْنِي',fr:'Al-Mughni · Celui qui enrichit'},{num:90,ar:'الْمَانِعُ',fr:"Al-Mani'u · Celui qui empêche"},
  {num:91,ar:'الضَّارُّ',fr:'Ad-Darr · Celui qui affecte'},{num:92,ar:'النَّافِعُ',fr:'An-Nafi · Le Bienfaiteur'},{num:93,ar:'النُّورُ',fr:'An-Nur · La Lumière'},{num:94,ar:'الْهَادِي',fr:'Al-Hadi · Le Guide'},{num:95,ar:'الْبَدِيعُ',fr:"Al-Badi · L'Innovateur Absolu"},
  {num:96,ar:'الْبَاقِي',fr:"Al-Baqi · L'Éternel"},{num:97,ar:'الْوَارِثُ',fr:"Al-Warith · L'Héritier"},{num:98,ar:'الرَّشِيدُ',fr:'Ar-Rashid · Le Guide Juste'},{num:99,ar:'الصَّبُورُ',fr:'As-Sabur · Le Patient'},
];

const ASMA_MEDITATIONS = {
  1:{m:"Allah — Le Nom qui englobe tous les autres.",r:"Commence chaque action en Le nommant : Bismillah."},
  2:{m:"Ar-Rahman — Sa miséricorde s'étend à toutes Ses créatures.",r:"Pense à une personne difficile. Sa miséricorde la couvre aussi."},
  3:{m:"Ar-Rahim — Une miséricorde particulière pour les croyants.",r:"Tu as commis une erreur ? Reviens à Lui sans honte."},
  31:{m:"Al-Latif — Le Subtil. Il connaît les peines que tu ne dis pas.",r:"Parle-Lui de ce que tu ne peux dire à personne."},
  48:{m:"Al-Wadud — Le Plein d'Amour. Il t'aime même quand tu ne te sens pas aimée.",r:"Reçois cet amour sans le mériter — c'est Son cadeau."},
  99:{m:"As-Sabur — Le Patient. Il ne se précipite pas pour punir.",r:"Sois patiente avec toi-même — comme Il l'est avec toi."},
};

// ═══════════════════════════════════════════════
// CYCLE LOGIC
// ═══════════════════════════════════════════════
function computeCycle() {
  if (!ST.cycleStart) return;
  const now = new Date();
  const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const [sy, sm, sd] = ST.cycleStart.split('-').map(Number);
  const startLocal = new Date(sy, sm - 1, sd);
  const diff = Math.floor((todayLocal - startLocal) / (1000 * 60 * 60 * 24));
  if (diff < 0) { ST.currentDay = 1; ST.currentSaison = 'hiver'; return; }
  const dur = ST.cycleDuration || 28;
  const day = (diff % dur) + 1;
  ST.currentDay = Math.max(1, Math.min(day, dur));

  // La phase lutéale est ~14j avant la fin — c'est elle qui est constante.
  // C'est la phase folliculaire (Printemps) qui s'allonge ou raccourcit selon le cycle.
  const d = ST.currentDay;
  const ovulationDay = Math.max(10, dur - 14); // ovulation ≈ 14j avant les prochaines règles
  const eteStart = Math.max(8, ovulationDay - 2); // fenêtre fertile : 2j avant ovulation
  const eteEnd = Math.min(dur - 2, ovulationDay + 2); // 2j après ovulation
  const automneStart = eteEnd + 1;

  if (d <= 5) ST.currentSaison = 'hiver';
  else if (d < eteStart) ST.currentSaison = 'printemps';
  else if (d <= eteEnd) ST.currentSaison = 'ete';
  else ST.currentSaison = 'automne';
}

function applySaisonTheme() {
  const s = SAISONS[ST.currentSaison];
  const r = document.documentElement.style;
  r.setProperty('--season', s.color);
  r.setProperty('--season-light', s.light);
  r.setProperty('--season-soft', s.soft);
  r.setProperty('--season-grad', s.grad);
  const av = document.querySelector('.av-btn');
  if (av) { av.style.background = s.grad; av.textContent = s.emoji; }

  const _sh = document.getElementById('sport-header');
  if (_sh) _sh.style.background = s.grad;
  const pav = document.getElementById('profilAv');
  if (pav) pav.style.background = s.grad;
  const psCycle = document.getElementById('psCycle');
  if (psCycle) psCycle.textContent = s.nom + ' ' + s.emoji + ' · Jour ' + ST.currentDay;
}

// ═══════════════════════════════════════════════
// POPULATE ALL
// ═══════════════════════════════════════════════
function populateAll() {
  const s = SAISONS[ST.currentSaison];
  if (!s) return;

  // ── DASHBOARD ACCUEIL ──
  renderDashboard(s);

  // ── CYCLE ──
  renderCycle(s);

  // ── ÂME ──
  renderAme(s);

  // ── VIE ──
  renderVie(s);

  // ── OBJECTIFS ──
  renderObjectifs();

  // ── MOI ──
  renderMoi(s);

  // RESTORE
  restorePrayers();
  restoreDhikrChecks();
  restoreCoranCheck();
  restoreGlaire();
  restoreSymptomes();
  restoreSeanceDone();
  updateMouvProgress((s.sport?.mouvements||[]).length);
  setTimeout(showInstallBanner, 1500);
  restoreFeedback();
  renderCycleHistory();
  renderPatterns();
  if (ST.waitlistEmail) {
    const ei = document.getElementById('waitlist-email');
    const wm = document.getElementById('waitlist-msg');
    if (ei) { ei.disabled = true; ei.placeholder = ST.waitlistEmail; }
    if (wm) { wm.style.color = '#3DAE8A'; wm.textContent = 'Alhamdulillah — tu seras la première informée ! 🌸'; }
  }
}

// ═══════════════════════════════════════════════
// DASHBOARD ENGAGEANT
// ═══════════════════════════════════════════════
function renderDashboard(s) {
  // ─ Header compact ─
  const nameEl = document.getElementById('home-name');
  if (nameEl) nameEl.textContent = ST.prenom || 'Ma sœur';
  const phaseEl = document.getElementById('home-phase-line');
  if (phaseEl) phaseEl.textContent = s.emoji + ' ' + s.nom + ' · Jour ' + ST.currentDay;

  // Message
  updateMessage();

  // ─ Score du jour (cases rapides) ─
  renderDayScore();

  // ─ 3 cartes d'action ─
  renderCarteBouger(s);
  renderCarteRepas(s);
  renderCarteSkincare(s);

  // ─ Suggestions engageantes ─
  renderSuggestionsEngage(s);

  // Toggle Premium btn state
  const pBtn = document.getElementById('premium-toggle-btn');
  if (pBtn) {
    pBtn.textContent = ST.isPremium ? '✦ Actif' : 'Inactif';
    pBtn.style.background = ST.isPremium ? 'var(--season-grad)' : 'var(--sable)';
    pBtn.style.color = ST.isPremium ? 'white' : 'var(--gris)';
  }
}

function renderDayScore() {
  const today = new Date().toDateString();
  const prayers = ST.prayers[today] || {};
  const prayersDone = ['fajr','dohr','asr','maghrib','isha'].filter(p => prayers[p]).length;
  const dhikrChecks = (ST.dhikrChecks && ST.dhikrChecks[today]) || {};
  const dhikrDone = Object.values(dhikrChecks).filter(Boolean).length >= 3;
  const seanceDone = ST.seanceDashDone && ST.seanceDashDone[today];
  const coranDone = ST.coranDone && ST.coranDone[today];

  const container = document.getElementById('day-score-grid');
  if (!container) return;

  const items = [
    ...(ST.currentSaison !== 'hiver' ? [{ emoji: '🕌', label: 'Prières', done: prayersDone >= 3, sub: prayersDone + '/5', onclick: "switchTabById('ame')" }] : []),
    { emoji: '📿', label: 'Dhikr',   done: dhikrDone, onclick: "switchTabById('ame')" },
    { emoji: '💪', label: 'Séance',  done: !!seanceDone, onclick: '' },
    ...(ST.currentSaison !== 'hiver' ? [{ emoji: '📖', label: 'Coran', done: !!coranDone, onclick: "switchTabById('ame')" }] : []),
  ];

  container.innerHTML = items.map(it => `
    <div class="day-score-item ${it.done ? 'done' : ''}" onclick="${it.onclick}">
      <div class="day-score-ring-wrap">
        <div class="day-score-ring">${it.emoji}</div>
      </div>
      <div class="day-score-label">${it.label}${it.sub ? '<br><span style="color:var(--season);font-weight:700">' + it.sub + '</span>' : ''}</div>
    </div>
  `).join('');
}

function renderCarteBouger(s) {
  const seance = s.sport?.seance;
  if (!seance) return;
  const today = new Date().toDateString();
  const isDone = ST.seanceDashDone && ST.seanceDashDone[today];

  const nameEl = document.getElementById('qs-name');
  const metaEl = document.getElementById('qs-meta');
  const durEl = document.getElementById('qs-duration');
  const exEl = document.getElementById('qs-exercises');
  const btnWrap = document.getElementById('qs-btn-wrap');
  const doneWrap = document.getElementById('qs-done-wrap');

  if (nameEl) nameEl.textContent = seance.name;
  if (metaEl) metaEl.textContent = seance.meta;
  if (durEl) durEl.textContent = seance.duration;
  if (exEl) {
    exEl.innerHTML = (seance.exercices || []).map(ex => `
      <div class="qs-exercise">
        <span class="qs-ex-num">${ex.num}</span>
        <span class="qs-ex-name">${ex.name}</span>
        <span class="qs-ex-time">${ex.detail.split('.')[0]}</span>
      </div>
    `).join('');
  }
  if (btnWrap) btnWrap.style.display = isDone ? 'none' : 'block';
  if (doneWrap) doneWrap.style.display = isDone ? 'flex' : 'none';

  // Mise à jour aussi dans l'onglet Vie
  const _sn = document.getElementById('sport-name'); if (_sn) _sn.textContent = seance.name;
  const _sm = document.getElementById('sport-meta'); if (_sm) _sm.textContent = seance.meta;
  const _se = document.getElementById('sport-exercises');
  if (_se) _se.innerHTML = (seance.exercices||[]).map(ex =>
    `<div class="sport-exercise"><div class="sport-ex-num">${ex.num}</div><div><div class="sport-ex-name">${ex.name}</div><div class="sport-ex-detail">${ex.detail}</div></div></div>`
  ).join('');

  // Section niveaux Premium
  const niveauxEl = document.getElementById('qs-niveaux-premium');
  if (!niveauxEl) return;
  const niveaux = SPORT_NIVEAUX[ST.currentSaison] || [];
  const level = ST.seanceLevel || 1;
  if (ST.isPremium) {
    niveauxEl.innerHTML = `
      <div class="action-prem-title">✦ Niveaux Premium · Ton niveau : ${level}/4</div>
      <div class="qs-niveaux-grid">
        ${niveaux.map(n => `
          <div class="qs-niveau-card ${n.niveau <= level ? 'unlocked' : 'locked'}"
               ${n.niveau <= level ? `onclick="openNiveauModal(${n.niveau - 2})"` : ''}>
            <div class="qs-niveau-badge">N${n.niveau}</div>
            <div class="qs-niveau-name">${n.name}</div>
            <div class="qs-niveau-dur">${n.duration}</div>
            ${n.niveau > level ? '<div class="qs-niveau-lock">🔒</div>' : '<div class="qs-niveau-lock">▶</div>'}
          </div>
        `).join('')}
      </div>
    `;
  } else {
    niveauxEl.innerHTML = `
      <div class="action-premium-locked">
        <div class="action-prem-blur">
          <div class="action-prem-recipe-preview">Niveaux 2, 3 &amp; 4 débloqués</div>
          <div class="action-prem-steps-preview">Adaptatif · Progressif · Auto-ajusté</div>
        </div>
        <div class="action-prem-cta">
          <div class="action-prem-label">✦ Progression guidée</div>
          <button class="action-prem-btn" onclick="switchTabById('moi')">Débloquer Premium</button>
        </div>
      </div>
    `;
  }
}

// ═══════════════════════════════════════════════
// CARTES MANGER & PRENDRE SOIN
// ═══════════════════════════════════════════════
function renderCarteManger(s) {
  const freeEl = document.getElementById('action-manger-free');
  const premEl = document.getElementById('action-manger-premium');
  if (!freeEl || !premEl) return;

  const stars = (s.alimentation?.star || []);
  freeEl.innerHTML = stars.map(f => `<span class="action-star-chip">${f}</span>`).join('');

  if (ST.isPremium) {
    const recettes = RECETTES[ST.currentSaison] || [];
    const idx = (ST.currentDay - 1) % Math.max(recettes.length, 1);
    const r = recettes[idx];
    if (!r) return;
    premEl.innerHTML = `
      <div class="action-premium-unlocked" onclick="openRecipeModal('${ST.currentSaison}',${idx})">
        <span class="action-prem-unlocked-emoji">${r.emoji}</span>
        <div class="action-prem-unlocked-text">
          <div class="action-prem-unlocked-name">${r.nom}</div>
          <div class="action-prem-unlocked-sub">Voir la recette →</div>
        </div>
        <span class="action-prem-unlocked-arrow">›</span>
      </div>`;
  } else {
    premEl.innerHTML = `
      <div class="action-premium-locked">
        <div class="action-prem-blur">
          <div class="action-prem-recipe-preview">Curry patate douce · lait de coco · épices</div>
          <div class="action-prem-steps-preview">Étape 1 · Étape 2 · Étape 3 · Étape 4</div>
        </div>
        <div class="action-prem-cta">
          <div class="action-prem-label">✦ Recette du jour</div>
          <button class="action-prem-btn" onclick="switchTabById('moi')">Débloquer Premium</button>
        </div>
      </div>`;
  }
}

function renderCarteSoin(s) {
  const freeEl = document.getElementById('action-soin-free');
  const premEl = document.getElementById('action-soin-premium');
  if (!freeEl || !premEl) return;

  freeEl.innerHTML = `<span class="action-free-tip">${s.skincare?.today || s.skinTeaser || ''}</span>`;

  if (ST.isPremium) {
    const routine = ROUTINES_PREMIUM[ST.currentSaison];
    const steps = routine ? routine.matin.length + routine.soir.length : 0;
    premEl.innerHTML = `
      <div class="action-premium-unlocked" onclick="openSkinModal('${ST.currentSaison}')">
        <span class="action-prem-unlocked-emoji">🌿</span>
        <div class="action-prem-unlocked-text">
          <div class="action-prem-unlocked-name">Routine matin &amp; soir</div>
          <div class="action-prem-unlocked-sub">${steps} gestes adaptés à ta phase →</div>
        </div>
        <span class="action-prem-unlocked-arrow">›</span>
      </div>`;
  } else {
    premEl.innerHTML = `
      <div class="action-premium-locked">
        <div class="action-prem-blur">
          <div class="action-prem-recipe-preview">Matin · Soir · 7 gestes adaptés</div>
          <div class="action-prem-steps-preview">Nettoyage · Actif · Soin · SPF · Masque</div>
        </div>
        <div class="action-prem-cta">
          <div class="action-prem-label">✦ Routine complète</div>
          <button class="action-prem-btn" onclick="switchTabById('moi')">Débloquer Premium</button>
        </div>
      </div>`;
  }
}

function renderCarteRepas(s) {
  const alim = s.alimentation;
  if (!alim) return;

  const starsEl = document.getElementById('dc-repas-stars');
  if (starsEl) {
    starsEl.innerHTML = (alim.star || []).map(f => `<span class="day-card-chip">⭐ ${f}</span>`).join('');
  }

  const nutrimEl = document.getElementById('dc-repas-nutriments');
  if (nutrimEl) {
    nutrimEl.innerHTML = (alim.nutriments || []).slice(0, 3).map(n => `
      <div class="day-card-nutriment-row">
        <span class="day-card-nutriment-nom">${n.nom}</span>
        <span class="day-card-nutriment-why">${n.why}</span>
      </div>
    `).join('');
  }

  const eviterEl = document.getElementById('dc-repas-eviter');
  if (eviterEl && (alim.eviter || []).length) {
    eviterEl.innerHTML = `<span class="day-card-eviter-label">À éviter :</span> ` +
      alim.eviter.map(e => `<span class="day-card-chip-eviter">${e}</span>`).join('');
  }

  const premEl = document.getElementById('action-manger-premium');
  if (!premEl) return;
  if (ST.isPremium) {
    const recettes = RECETTES[ST.currentSaison] || [];
    const idx = (ST.currentDay - 1) % Math.max(recettes.length, 1);
    const r = recettes[idx];
    if (!r) return;
    premEl.innerHTML = `
      <div class="action-premium-unlocked" onclick="openRecipeModal('${ST.currentSaison}',${idx})">
        <span class="action-prem-unlocked-emoji">${r.emoji}</span>
        <div class="action-prem-unlocked-text">
          <div class="action-prem-unlocked-name">${r.nom}</div>
          <div class="action-prem-unlocked-sub">Voir la recette →</div>
        </div>
        <span class="action-prem-unlocked-arrow">›</span>
      </div>`;
  } else {
    premEl.innerHTML = `
      <div class="action-premium-locked">
        <div class="action-prem-blur">
          <div class="action-prem-recipe-preview">Recette de saison · adaptée à ta phase</div>
          <div class="action-prem-steps-preview">Étape 1 · Étape 2 · Étape 3</div>
        </div>
        <div class="action-prem-cta">
          <div class="action-prem-label">✦ Recette du jour</div>
          <button class="action-prem-btn" onclick="switchTabById('moi')">Débloquer Premium</button>
        </div>
      </div>`;
  }
}

function renderCarteSkincare(s) {
  const skin = s.skincare;
  if (!skin) return;

  const actifEl = document.getElementById('dc-skin-actifs');
  if (actifEl) {
    actifEl.innerHTML = (skin.actifs || []).slice(0, 2).map(a => `
      <div class="day-card-actif-row">
        <span class="day-card-actif-nom">${a.nom}</span>
        <span class="day-card-actif-usage">${a.usage}</span>
      </div>
    `).join('');
  }

  const gestesEl = document.getElementById('dc-skin-gestes');
  if (gestesEl) {
    gestesEl.innerHTML = (skin.gestes || []).map(g => `<span class="day-card-chip">${g}</span>`).join('');
  }

  const premEl = document.getElementById('action-soin-premium');
  if (!premEl) return;
  if (ST.isPremium) {
    const routine = ROUTINES_PREMIUM[ST.currentSaison];
    const steps = routine ? routine.matin.length + routine.soir.length : 0;
    premEl.innerHTML = `
      <div class="action-premium-unlocked" onclick="openSkinModal('${ST.currentSaison}')">
        <span class="action-prem-unlocked-emoji">🌿</span>
        <div class="action-prem-unlocked-text">
          <div class="action-prem-unlocked-name">Routine matin &amp; soir</div>
          <div class="action-prem-unlocked-sub">${steps} gestes adaptés à ta phase →</div>
        </div>
        <span class="action-prem-unlocked-arrow">›</span>
      </div>`;
  } else {
    premEl.innerHTML = `
      <div class="action-premium-locked">
        <div class="action-prem-blur">
          <div class="action-prem-recipe-preview">Matin · Soir · Gestes adaptés</div>
          <div class="action-prem-steps-preview">Nettoyage · Actif · Soin · SPF</div>
        </div>
        <div class="action-prem-cta">
          <div class="action-prem-label">✦ Routine complète</div>
          <button class="action-prem-btn" onclick="switchTabById('moi')">Débloquer Premium</button>
        </div>
      </div>`;
  }
}

// ═══════════════════════════════════════════════
// MODAUX PREMIUM
// ═══════════════════════════════════════════════
function openRecipeModal(phase, idx) {
  const r = (RECETTES[phase] || [])[idx];
  if (!r) return;
  const el = document.getElementById('recipe-modal-content');
  if (el) el.innerHTML = `
    <div style="font-size:48px;text-align:center;margin-bottom:14px;">${r.emoji}</div>
    <div class="pmod-title">${r.nom}</div>
    <div class="pmod-pourquoi">${r.pourquoi}</div>
    <div class="pmod-section">🛒 Ingrédients</div>
    <ul class="pmod-list">${(r.ingredients||[]).map(i=>`<li>${i}</li>`).join('')}</ul>
    <div class="pmod-section">👩‍🍳 Préparation</div>
    <ol class="pmod-list">${(r.etapes||[]).map(e=>`<li>${e}</li>`).join('')}</ol>
  `;
  document.getElementById('recipe-modal').classList.add('open');
}
function closeRecipeModal() { document.getElementById('recipe-modal').classList.remove('open'); }

function openSkinModal(phase) {
  const r = ROUTINES_PREMIUM[phase];
  if (!r) return;
  const renderSteps = steps => steps.map(g => `
    <div class="pmod-skin-step">
      <div class="pmod-skin-icon">${g.icon}</div>
      <div class="pmod-skin-body">
        <div class="pmod-skin-name">${g.geste} <span class="pmod-skin-dur">${g.duree}</span></div>
        <div class="pmod-skin-detail">${g.detail}</div>
      </div>
    </div>`).join('');
  const el = document.getElementById('skin-modal-content');
  if (el) el.innerHTML = `
    <div class="pmod-routine-block">
      <div class="pmod-routine-time">☀️ Routine Matin</div>
      ${renderSteps(r.matin)}
    </div>
    <div class="pmod-routine-block">
      <div class="pmod-routine-time">🌙 Routine Soir</div>
      ${renderSteps(r.soir)}
    </div>`;
  document.getElementById('skin-modal').classList.add('open');
}
function closeSkinModal() { document.getElementById('skin-modal').classList.remove('open'); }

function openNiveauModal(idx) {
  const niveaux = SPORT_NIVEAUX[ST.currentSaison] || [];
  const n = niveaux[idx];
  if (!n) return;
  const el = document.getElementById('niveau-modal-content');
  if (el) el.innerHTML = `
    <div class="pmod-title">Niveau ${n.niveau} · ${n.name}</div>
    <div class="pmod-pourquoi">${n.meta} · ${n.duration}</div>
    ${n.exercices.map(ex=>`
      <div class="sport-exercise" style="margin-bottom:12px;">
        <div class="sport-ex-num">${ex.num}</div>
        <div><div class="sport-ex-name">${ex.name}</div><div class="sport-ex-detail">${ex.detail}</div></div>
      </div>`).join('')}
  `;
  document.getElementById('niveau-modal').classList.add('open');
}
function closeNiveauModal() { document.getElementById('niveau-modal').classList.remove('open'); }

function checkSeanceProgression() {
  if (!ST.isPremium) return;
  ST.seanceValidatedCount = (ST.seanceValidatedCount || 0) + 1;
  if (ST.seanceValidatedCount >= 5) {
    ST.seanceValidatedCount = 0;
    saveState();
    setTimeout(() => document.getElementById('progression-modal').classList.add('open'), 800);
  } else {
    saveState();
  }
}

function handleProgressionAnswer(ans) {
  document.getElementById('progression-modal').classList.remove('open');
  const level = ST.seanceLevel || 1;
  if (ans === 'plus' && level < 4) {
    ST.seanceLevel = level + 1;
    showToast(`🔥 Niveau ${ST.seanceLevel} débloqué ! Alhamdulillah 💪`);
  } else if (ans === 'dur' && level > 1) {
    ST.seanceLevel = level - 1;
    showToast(`💛 Niveau ${ST.seanceLevel} — on avance à ton rythme.`);
  } else {
    showToast('✨ Parfait — on continue au même rythme.');
  }
  saveState();
  renderCarteBouger(SAISONS[ST.currentSaison]);
}

function togglePremium() {
  ST.isPremium = !ST.isPremium;
  saveState();
  const btn = document.getElementById('premium-toggle-btn');
  if (btn) {
    btn.textContent = ST.isPremium ? '✦ Actif' : 'Inactif';
    btn.style.background = ST.isPremium ? 'var(--season-grad)' : 'var(--sable)';
    btn.style.color = ST.isPremium ? 'white' : 'var(--gris)';
  }
  const s = SAISONS[ST.currentSaison];
  renderCarteBouger(s);
  renderCarteRepas(s);
  renderCarteSkincare(s);
  showToast(ST.isPremium ? '✦ Mode Premium activé' : 'Mode Premium désactivé');
}

function applyPremiumCode() {
  const inp = document.getElementById('premium-code-input');
  const msg = document.getElementById('premium-code-msg');
  if (!inp || !msg) return;
  const code = inp.value.trim().toUpperCase();
  const VALID_CODES = ['SAKINA2026', 'BETA2026', 'FONDATRICE'];
  if (VALID_CODES.includes(code)) {
    ST.isPremium = true;
    saveState();
    const s = SAISONS[ST.currentSaison];
    renderDashboard(s);
    const btn = document.getElementById('premium-toggle-btn');
    if (btn) {
      btn.textContent = '✦ Actif';
      btn.style.background = 'var(--season-grad)';
      btn.style.color = 'white';
    }
    msg.style.color = '#3DAE8A';
    msg.textContent = '✓ Premium activé — bienvenue !';
    inp.value = '';
  } else if (code) {
    msg.style.color = '#C4694A';
    msg.textContent = 'Code incorrect.';
  }
}

function validerSeanceDash() {
  const today = new Date().toDateString();
  if (!ST.seanceDashDone) ST.seanceDashDone = {};
  ST.seanceDashDone[today] = true;
  if (!ST.seanceDone) ST.seanceDone = {};
  ST.seanceDone[today] = true;
  saveState();
  const s = SAISONS[ST.currentSaison];
  renderCarteBouger(s);
  restoreSeanceDone();
  renderDayScore();
  checkSeanceProgression();
  showToast('💪 Alhamdulillah — séance accomplie ! 🌸');
}

function renderSuggestionsEngage(s) {
  const container = document.getElementById('sugg-engage-list');
  const countEl = document.getElementById('sugg-engage-count');
  if (!container) return;

  const selSugg = ST.selectedSugg || [];
  const done = selSugg.length;
  if (countEl) countEl.textContent = done + '/' + (s.suggestions?.length || 0) + ' faits';

  container.innerHTML = (s.suggestions || []).map((sg, i) => {
    const isSel = selSugg.includes(i);
    const emoji = sg.split(' ')[0];
    const label = sg.slice(sg.indexOf(' ') + 1);
    return `
      <div class="sugg-engage-item ${isSel ? 'done' : ''}" onclick="toggleSuggestion(this, ${i})" data-idx="${i}">
        <div class="sugg-engage-chk">${isSel ? '✓' : ''}</div>
        <span class="sugg-engage-em">${emoji}</span>
        <span class="sugg-engage-lbl">${label}</span>
      </div>
    `;
  }).join('');
}

// ═══════════════════════════════════════════════
// CYCLE RENDER
// ═══════════════════════════════════════════════
function renderCycle(s) {
  const _chs = document.getElementById('cycle-header-sub');
  if (_chs) _chs.textContent = s.nom + ' · Jour ' + ST.currentDay + ' sur ' + ST.cycleDuration;
  const _cdn = document.getElementById('cycle-day-num'); if (_cdn) _cdn.textContent = ST.currentDay;
  const _csl = document.getElementById('cycle-season-label'); if (_csl) _csl.textContent = s.emoji + ' ' + s.nom;
  const remaining = ST.cycleDuration - ST.currentDay;
  const _cnu = document.getElementById('countdown-num'); if (_cnu) _cnu.textContent = remaining <= 0 ? '0' : remaining;
  const _clb = document.getElementById('countdown-label'); if (_clb) _clb.textContent = remaining <= 1 ? 'demain' : 'jours';
  const _cpn = document.getElementById('cycle-phase-name'); if (_cpn) _cpn.textContent = (s.phase||'').replace('Phase ','');
  const dur = ST.cycleDuration || 28;
  const _ovD = Math.max(10, dur - 14);
  const _etS = Math.max(8, _ovD - 2);
  const _etE = Math.min(dur - 2, _ovD + 2);
  const phaseMap = {hiver:'J1 → J5', printemps:'J6 → J'+(_etS-1), ete:'J'+_etS+' → J'+_etE, automne:'J'+(_etE+1)+' → J'+dur};
  const _cpd = document.getElementById('cycle-phase-days'); if (_cpd) _cpd.textContent = phaseMap[ST.currentSaison] || '';
  drawCycleRing();

  // Symptômes
  renderSymptomes();
}

function startNewCycleToday() {
  const today = new Date();
  const todayStr = today.getFullYear() + '-' + String(today.getMonth()+1).padStart(2,'0') + '-' + String(today.getDate()).padStart(2,'0');
  if (ST.cycleStart === todayStr) return;
  if (!ST.cycleHistory) ST.cycleHistory = [];
  if (ST.cycleStart) {
    ST.cycleHistory.unshift({ start: ST.cycleStart, duration: ST.cycleDuration || 28 });
    if (ST.cycleHistory.length > 6) ST.cycleHistory = ST.cycleHistory.slice(0, 6);
  }
  ST.cycleStart = todayStr;
  saveState();
  computeCycle();
  applySaisonTheme();
  populateAll();
  const msg = document.getElementById('new-cycle-msg');
  if (msg) { msg.style.display = 'block'; setTimeout(() => { msg.style.display = 'none'; }, 5000); }
}

// ═══════════════════════════════════════════════
// SYMPTÔMES
// ═══════════════════════════════════════════════
function renderSymptomes() {
  const container = document.getElementById('symptomes-grid');
  if (!container) return;

  const liste = SYMPTOMES_PAR_PHASE[ST.currentSaison] || [];
  const today = new Date().toDateString();
  const selSymp = (ST.symptomes && ST.symptomes[today]) || [];

  const autreSelected = selSymp.includes('autre');
  const autreText = (ST.autreSymptomesText && ST.autreSymptomesText[today]) || '';

  container.innerHTML = liste.map(sy => {
    const isSel = selSymp.includes(sy.id);
    return `<div class="symptome-chip ${isSel ? 'selected' : ''}" onclick="toggleSymptome('${sy.id}', this)"><span class="symptome-chip-emoji">${sy.emoji}</span><span class="symptome-chip-text">${sy.label}</span></div>`;
  }).join('') + `<div class="symptome-chip ${autreSelected ? 'selected' : ''}" onclick="toggleSymptome('autre', this)"><span class="symptome-chip-emoji">✏️</span><span class="symptome-chip-text">Autre</span></div>`;

  const wrap = document.getElementById('autre-symptome-wrap');
  const inp = document.getElementById('autre-symptome-input');
  if (wrap) wrap.style.display = autreSelected ? 'block' : 'none';
  if (inp) inp.value = autreText;
}

function toggleSymptome(id, el) {
  const today = new Date().toDateString();
  if (!ST.symptomes) ST.symptomes = {};
  if (!ST.symptomes[today]) ST.symptomes[today] = [];
  const arr = ST.symptomes[today];
  const idx = arr.indexOf(id);
  if (idx > -1) arr.splice(idx, 1);
  else arr.push(id);
  el.classList.toggle('selected', arr.includes(id));
  if (id === 'autre') {
    const wrap = document.getElementById('autre-symptome-wrap');
    const inp = document.getElementById('autre-symptome-input');
    if (wrap) wrap.style.display = arr.includes('autre') ? 'block' : 'none';
    if (inp && arr.includes('autre')) setTimeout(() => inp.focus(), 50);
  }
  saveState();
}
function saveAutreSymptome(val) {
  const today = new Date().toDateString();
  if (!ST.autreSymptomesText) ST.autreSymptomesText = {};
  ST.autreSymptomesText[today] = val;
  saveState();
}
function validateAutreSymptome() {
  const inp = document.getElementById('autre-symptome-input');
  const confirm = document.getElementById('autre-symptome-confirm');
  if (inp) inp.blur();
  if (confirm) {
    confirm.style.display = 'block';
    setTimeout(() => { confirm.style.display = 'none'; }, 2000);
  }
}

function restoreSymptomes() {
  renderSymptomes();
}

// ═══════════════════════════════════════════════
// ÂME RENDER
// ═══════════════════════════════════════════════
function renderAme(s) {
  // Nom du jour
  showNomDuJour();
  updateAsmaCount();

  // Cacher les prières pendant hiver (règles)
  const prayersCard = document.getElementById('prayers-card');
  const hiverCard = document.getElementById('prayers-hiver-card');
  if (ST.currentSaison === 'hiver') {
    if (prayersCard) prayersCard.style.display = 'none';
    if (hiverCard) hiverCard.style.display = 'block';
  } else {
    if (prayersCard) prayersCard.style.display = '';
    if (hiverCard) hiverCard.style.display = 'none';
  }

  // Invocation du jour
  if (s.invocation) {
    const ia = document.getElementById('inv-arabic'); if (ia) ia.textContent = s.invocation.arabic;
    const it = document.getElementById('inv-translation'); if (it) it.textContent = s.invocation.fr;
    const isc = document.getElementById('inv-source'); if (isc) isc.textContent = s.invocation.source;
  }

  // Dhikr cases à cocher
  renderDhikrChecks();

  // Coran case à cocher — masqué pendant hiver (règles)
  const coranCard = document.querySelector('.coran-check-card');
  if (coranCard) coranCard.style.display = ST.currentSaison === 'hiver' ? 'none' : '';
  renderCoranCheck();
}

// ── Dhikr cases à cocher ──
function renderDhikrChecks() {
  const container = document.getElementById('dhikr-check-items');
  if (!container) return;
  const today = new Date().toDateString();
  const checks = (ST.dhikrChecks && ST.dhikrChecks[today]) || {};

  container.innerHTML = DHIKR_CHECKS.map(d => {
    const isDone = !!checks[d.id];
    const verseHtml = d.verse ? `<div style="font-size:10px;color:var(--gris);font-style:italic;line-height:1.5;margin-top:5px;padding-top:5px;border-top:1px solid var(--sable);">${d.verse}</div>` : '';
    return `
      <div class="dhikr-check-item ${isDone ? 'done' : ''}" onclick="toggleDhikrCheck('${d.id}', this)" style="${d.verse ? 'align-items:flex-start;' : ''}">
        <div class="dhikr-check-box" style="${d.verse ? 'margin-top:4px;' : ''}">${isDone ? '✓' : ''}</div>
        <div class="dhikr-check-content" style="flex:1;">
          <div class="dhikr-check-arabic">${d.arabic}</div>
          <div class="dhikr-check-fr">${d.fr}</div>
          ${verseHtml}
        </div>
        <div class="dhikr-check-count" style="${d.verse ? 'margin-top:4px;' : ''}">${d.count}</div>
      </div>
    `;
  }).join('');
}

function toggleDhikrCheck(id, el) {
  const today = new Date().toDateString();
  if (!ST.dhikrChecks) ST.dhikrChecks = {};
  if (!ST.dhikrChecks[today]) ST.dhikrChecks[today] = {};
  ST.dhikrChecks[today][id] = !ST.dhikrChecks[today][id];
  el.classList.toggle('done', ST.dhikrChecks[today][id]);
  const box = el.querySelector('.dhikr-check-box');
  if (box) box.textContent = ST.dhikrChecks[today][id] ? '✓' : '';
  saveState();
  renderDayScore();

  const done = Object.values(ST.dhikrChecks[today]).filter(Boolean).length;
  if (done === DHIKR_CHECKS.length) showToast('📿 Alhamdulillah — tous les adhkar du jour ! 🌸');
}

function restoreDhikrChecks() {
  renderDhikrChecks();
}

// ── Coran case à cocher ──
function renderCoranCheck() {
  const inner = document.getElementById('coran-check-inner');
  if (!inner) return;
  const today = new Date().toDateString();
  const isDone = ST.coranDone && ST.coranDone[today];

  inner.className = 'coran-check-inner' + (isDone ? ' done' : '');
  const box = inner.querySelector('.coran-check-box');
  if (box) box.textContent = isDone ? '✓' : '📖';
}

function toggleCoranCheck() {
  const today = new Date().toDateString();
  if (!ST.coranDone) ST.coranDone = {};
  ST.coranDone[today] = !ST.coranDone[today];
  saveState();
  renderCoranCheck();
  renderDayScore();
  if (ST.coranDone[today]) showToast('📖 Barak Allahou fik — la lecture du Coran est faite 🌸');
}

function restoreCoranCheck() {
  renderCoranCheck();
}

// ═══════════════════════════════════════════════
// VIE RENDER
// ═══════════════════════════════════════════════
function renderVie(s) {
  const alim = s.alimentation || {};
  const _ng = document.getElementById('nutriment-grid');
  if (_ng) _ng.innerHTML = (alim.nutriments||[]).map(n =>
    `<div class="nutriment-chip"><div class="nutriment-name">${n.nom||''}</div><div class="nutriment-why">${n.why||''}</div></div>`
  ).join('');
  const _at = document.getElementById('aliment-tags');
  if (_at) _at.innerHTML = (alim.aliments||[]).map(a => {
    const isStar = (alim.star||[]).includes(a);
    return `<span class="aliment-tag${isStar?' star':''}">${a}</span>`;
  }).join('');
  const _ae = document.getElementById('aliment-eviter');
  if (_ae) _ae.innerHTML = (alim.eviter||[]).map(e => `<span class="aliment-tag" style="border-color:#E8A090;color:#C4694A;">${e}</span>`).join('');

  // Sport
  const sp = s.sport || {};
  const seance = sp.seance || {};
  const mouvements = sp.mouvements || [];
  const _smo = document.getElementById('sport-mouvements');
  if (_smo) {
    const today2 = new Date().toDateString();
    if (!ST.mouvDone) ST.mouvDone = {};
    if (!ST.mouvDone[today2]) ST.mouvDone[today2] = [];
    const done2 = ST.mouvDone[today2];
    _smo.innerHTML = mouvements.map((m, i) => {
      const isDone = done2.includes(i);
      return `<div onclick="toggleMouv(${i},this)" style="display:flex;align-items:center;gap:12px;padding:11px 13px;border-radius:14px;border:1.5px solid ${isDone?'var(--season)':'var(--sable)'};background:${isDone?'var(--season-soft)':'white'};margin-bottom:7px;cursor:pointer;transition:all .2s;">
        <div style="width:24px;height:24px;border-radius:50%;border:1.5px solid ${isDone?'var(--season)':'var(--sable)'};background:${isDone?'var(--season)':'transparent'};display:flex;align-items:center;justify-content:center;font-size:11px;color:white;flex-shrink:0;">${isDone?'✓':''}</div>
        <span style="font-size:13px;color:var(--noir);font-weight:500;flex:1;">${m}</span></div>`;
    }).join('');
    updateMouvProgress(mouvements.length);
  }

  // Skincare
  const sk2 = s.skincare || {};
  const _swh = document.getElementById('skin-what-happens'); if (_swh) _swh.textContent = sk2.whatHappens || '';
  const _sac = document.getElementById('skin-actifs');
  if (_sac) _sac.innerHTML = (sk2.actifs||[]).map(a => typeof a === 'string' ?
    `<span class="aliment-tag">${a}</span>` :
    `<div class="actif-card"><div class="actif-name">${a.nom||''}</div><div class="actif-why">${a.why||''}</div><span class="actif-usage">${a.usage||''}</span></div>`
  ).join('');
  const _sge = document.getElementById('skin-gestes');
  if (_sge) _sge.innerHTML = (sk2.gestes||[]).map(g => `<span class="aliment-tag star">${g}</span>`).join('');
  const _sev2 = document.getElementById('skin-eviter');
  if (_sev2) _sev2.innerHTML = (sk2.eviter||[]).map(e => `<span class="aliment-tag" style="border-color:#E8A090;color:#C4694A;">${e}</span>`).join('');
}

// ═══════════════════════════════════════════════
// MOI RENDER
// ═══════════════════════════════════════════════
function renderMoi(s) {
  const _pnm = document.getElementById('profil-name'); if (_pnm) _pnm.textContent = ST.prenom || '';
  const _psb = document.getElementById('profil-sub'); if (_psb) _psb.textContent = s.nom + ' · Jour ' + ST.currentDay;
  const pav = document.getElementById('profilAv'); if (pav) pav.textContent = s.emoji;
}

// ═══════════════════════════════════════════════
// ONBOARDING
// ═══════════════════════════════════════════════
let selectedDuration = 28;
function selectDuration(el, val) {
  document.querySelectorAll('#duration-options .ob-option').forEach(o => { o.classList.remove('selected'); });
  el.classList.add('selected');
  selectedDuration = val;
}

function checkDailyReset() {
  const today = new Date().toDateString();
  if (ST.lastDailyReset === today) return;
  ST.prayers = {};
  ST.dhikrChecks = {};
  ST.coranDone = {};
  ST.seanceDashDone = {};
  ST.seanceDone = {};
  ST.selectedSugg = [];
  ST.glaire = null;
  ST.glaireDate = null;
  ST.checkin = null;
  ST.checkinDate = null;
  ST.lastDailyReset = today;
  saveState();
}

// ═══════════════════════════════════════════════
// OBJECTIFS
// ═══════════════════════════════════════════════
const WEEKLY_OBJECTIVES = [
  { id: 'bouger',  label: 'Bouger 3×/sem',      emoji: '💪', target: 3 },
  { id: 'eau',     label: 'Eau 1,5 L/jour',      emoji: '💧', target: 7 },
  { id: 'coran',   label: 'Lire le Coran',        emoji: '📖', target: 7 },
  { id: 'dormir',  label: 'Dormir avant 23h',     emoji: '🌙', target: 7 },
  { id: 'prieres', label: '5 prières accomplies', emoji: '🕌', target: 7 },
];

function _getWeekKey() {
  const now = new Date();
  const day = now.getDay() || 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day - 1));
  return monday.toISOString().split('T')[0];
}

function renderObjectifs() {
  renderWeeklyObjs();
  renderCalendar();
}

function renderWeeklyObjs() {
  const weekKey = _getWeekKey();
  const todayStr = new Date().toDateString();
  const checks = (ST.weeklyObjChecks && ST.weeklyObjChecks[weekKey]) || {};

  const container = document.getElementById('obj-weekly-list');
  if (!container) return;

  container.innerHTML = WEEKLY_OBJECTIVES.map(obj => {
    const daysArr = checks[obj.id] || [];
    const todayDone = daysArr.includes(todayStr);
    const count = daysArr.length;
    const pct = Math.min(100, Math.round((count / obj.target) * 100));
    return `
      <div class="obj-item ${todayDone ? 'done' : ''}" onclick="toggleWeeklyObj('${obj.id}')">
        <div class="obj-check">${todayDone ? '✓' : ''}</div>
        <div class="obj-content">
          <div class="obj-label">${obj.emoji} ${obj.label}</div>
          <div class="obj-progress-bar-wrap"><div class="obj-progress-bar" style="width:${pct}%"></div></div>
          <div class="obj-progress-txt">${count}/${obj.target} cette semaine</div>
        </div>
      </div>`;
  }).join('');

  const customContainer = document.getElementById('obj-custom-list');
  if (!customContainer) return;
  const customs = ST.customObjectifs || [];
  const customChecks = (ST.customObjChecks && ST.customObjChecks[weekKey]) || {};
  customContainer.innerHTML = customs.map((label, i) => {
    const daysArr = customChecks[i] || [];
    const todayDone = daysArr.includes(todayStr);
    return `
      <div class="obj-item ${todayDone ? 'done' : ''}" onclick="toggleCustomObj(${i})">
        <div class="obj-check">${todayDone ? '✓' : ''}</div>
        <div class="obj-content"><div class="obj-label">📌 ${label}</div></div>
        <button onclick="event.stopPropagation();removeCustomObj(${i})" class="obj-remove-btn">×</button>
      </div>`;
  }).join('');
}

function toggleWeeklyObj(id) {
  const weekKey = _getWeekKey();
  const todayStr = new Date().toDateString();
  if (!ST.weeklyObjChecks) ST.weeklyObjChecks = {};
  if (!ST.weeklyObjChecks[weekKey]) ST.weeklyObjChecks[weekKey] = {};
  if (!ST.weeklyObjChecks[weekKey][id]) ST.weeklyObjChecks[weekKey][id] = [];
  const arr = ST.weeklyObjChecks[weekKey][id];
  const idx = arr.indexOf(todayStr);
  if (idx > -1) arr.splice(idx, 1); else arr.push(todayStr);
  saveState();
  renderWeeklyObjs();
}

function addCustomObj() {
  const inp = document.getElementById('obj-custom-input');
  if (!inp || !inp.value.trim()) return;
  if (!ST.customObjectifs) ST.customObjectifs = [];
  ST.customObjectifs.push(inp.value.trim());
  inp.value = '';
  saveState();
  renderWeeklyObjs();
}

function removeCustomObj(i) {
  if (!ST.customObjectifs) return;
  ST.customObjectifs.splice(i, 1);
  if (ST.customObjChecks) {
    Object.keys(ST.customObjChecks).forEach(wk => {
      if (ST.customObjChecks[wk]) delete ST.customObjChecks[wk][i];
    });
  }
  saveState();
  renderWeeklyObjs();
}

function toggleCustomObj(i) {
  const weekKey = _getWeekKey();
  const todayStr = new Date().toDateString();
  if (!ST.customObjChecks) ST.customObjChecks = {};
  if (!ST.customObjChecks[weekKey]) ST.customObjChecks[weekKey] = {};
  if (!ST.customObjChecks[weekKey][i]) ST.customObjChecks[weekKey][i] = [];
  const arr = ST.customObjChecks[weekKey][i];
  const idx = arr.indexOf(todayStr);
  if (idx > -1) arr.splice(idx, 1); else arr.push(todayStr);
  saveState();
  renderWeeklyObjs();
}

function renderCalendar() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const monthNames = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

  const headerEl = document.getElementById('cal-header');
  if (headerEl) headerEl.textContent = monthNames[month] + ' ' + year;

  const gridEl = document.getElementById('cal-grid');
  if (!gridEl) return;

  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let startDow = firstDay.getDay();
  startDow = startDow === 0 ? 6 : startDow - 1;

  const dur = ST.cycleDuration || 28;
  let cells = '';
  for (let i = 0; i < startDow; i++) cells += '<div class="cal-day cal-day-empty"></div>';

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const dateStr = date.toDateString();
    let phase = 'printemps';
    if (ST.cycleStart) {
      const [sy, sm, sd] = ST.cycleStart.split('-').map(Number);
      const startLocal = new Date(sy, sm - 1, sd);
      const diff = Math.floor((date - startLocal) / 86400000);
      const dayOfCycle = ((diff % dur) + dur) % dur;
      phase = phaseForDay(dayOfCycle + 1, dur);
    }
    const isToday = d === now.getDate();
    const seanceDone = !!(ST.seanceDashDone && ST.seanceDashDone[dateStr]) || !!(ST.seanceDone && ST.seanceDone[dateStr]);
    const prayers = ST.prayers && ST.prayers[dateStr] ? Object.values(ST.prayers[dateStr]).filter(Boolean).length : 0;
    cells += `
      <div class="cal-day cal-day-${phase}${isToday ? ' cal-today' : ''}" onclick="openDayModal('${dateStr}','${phase}')">
        <span class="cal-day-num">${d}</span>
        <div class="cal-day-icons">
          ${seanceDone ? '<span class="cal-dot">●</span>' : ''}
          ${prayers >= 3 && phase !== 'hiver' ? '<span class="cal-crescent">☽</span>' : ''}
        </div>
      </div>`;
  }
  gridEl.innerHTML = cells;
}

function openDayModal(dateStr, phase) {
  const d = new Date(dateStr);
  const monthNames = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
  const phaseEmojis = { hiver:'🌙', printemps:'🌸', ete:'☀️', automne:'🍂' };
  const phaseNames  = { hiver:'Hiver', printemps:'Printemps', ete:'Été', automne:'Automne' };
  const seanceDone = !!(ST.seanceDashDone && ST.seanceDashDone[dateStr]) || !!(ST.seanceDone && ST.seanceDone[dateStr]);
  const prayers = ST.prayers && ST.prayers[dateStr] ? Object.values(ST.prayers[dateStr]).filter(Boolean).length : 0;
  const coranDone = !!(ST.coranDone && ST.coranDone[dateStr]);

  const el = document.getElementById('day-modal-content');
  if (!el) return;
  el.innerHTML = `
    <div style="text-align:center;margin-bottom:16px;">
      <div style="font-size:32px;margin-bottom:8px;">${phaseEmojis[phase] || '🌸'}</div>
      <div style="font-family:var(--serif);font-size:18px;color:var(--noir);font-weight:600;">${d.getDate()} ${monthNames[d.getMonth()]}</div>
      <div style="font-size:12px;color:var(--gris);margin-top:4px;">${phaseNames[phase] || phase}</div>
    </div>
    <div style="display:flex;flex-direction:column;gap:8px;">
      <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:${seanceDone?'#E8F8F3':'var(--creme)'};border-radius:12px;">
        <span style="font-size:18px;">💪</span><span style="font-size:13px;color:var(--noir);">Séance — ${seanceDone?'Accomplie ✓':'Non faite'}</span>
      </div>
      <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:${prayers>=3?'#E8F8F3':'var(--creme)'};border-radius:12px;">
        <span style="font-size:18px;">🕌</span><span style="font-size:13px;color:var(--noir);">Prières — ${prayers}/5</span>
      </div>
      ${coranDone ? '<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:#E8F8F3;border-radius:12px;"><span style="font-size:18px;">📖</span><span style="font-size:13px;color:var(--noir);">Coran — Lu ✓</span></div>' : ''}
    </div>`;
  document.getElementById('day-modal').classList.add('open');
}

function closeDayModal() {
  document.getElementById('day-modal').classList.remove('open');
}

function checkWeeklyReset() {
  const now = new Date();
  const day = now.getDay() || 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day - 1));
  const weekKey = monday.toISOString().split('T')[0];
  if (ST.lastWeeklyReset === weekKey) return;
  ST.mouvDone = {};
  ST.weeklyObjChecks = {};
  ST.customObjChecks = {};
  ST.lastWeeklyReset = weekKey;
  saveState();
}

function initApp() {
  // Toujours recalculer le cycle en premier — jamais faire confiance au localStorage
  try { computeCycle(); } catch(e) { console.error('computeCycle:', e); }
  // Appliquer le theme APRES le calcul
  try { applySaisonTheme(); } catch(e) { console.error('applySaisonTheme:', e); }
  // Puis remplir tous les onglets
  try { populateAll(); } catch(e) { console.error('populateAll:', e); }
  // Sauvegarder les valeurs recalculees
  try { saveState(); } catch(e) {}
}

document.addEventListener('DOMContentLoaded', () => {
  const inp = document.getElementById('input-prenom');
  if (inp) inp.addEventListener('blur', () => { setTimeout(() => { window.scrollTo(0, 0); }, 100); });

  loadState();
  checkDailyReset();
  checkWeeklyReset();

  document.getElementById('revelation').style.display = 'none';
  document.getElementById('app').style.display = 'none';

  if (ST.prenom && ST.cycleStart) {
    document.getElementById('onboarding').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
    initApp();
    const now = new Date();
    const today = now.toDateString();
    const hour = now.getHours();
    if (ST.checkinDate !== today && hour < 14) {
      setTimeout(() => {
        const ov = document.getElementById('checkin-overlay');
        if (ov) { ov.style.display = 'flex'; ov.style.alignItems = 'flex-end'; }
      }, 800);
    }
  } else {
    document.getElementById('onboarding').style.display = 'block';
  }

  document.addEventListener('visibilitychange', () => {
    try {
      if (document.visibilityState === 'hidden') saveState();
    } catch(e) {}
  });
});

function nextStep(step) {
  if (step === 1) {
    const prenom = document.getElementById('input-prenom').value.trim();
    if (!prenom) { alert('Dis-moi ton prénom 🌸'); return; }
    ST.prenom = prenom;
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('input-date');
    if (dateInput) { dateInput.value = today; dateInput.max = today; }
    document.getElementById('step-0').classList.remove('active');
    document.getElementById('step-0').style.display = 'none';
    document.getElementById('step-1').classList.add('active');
    document.getElementById('step-1').style.display = 'flex';
    window.scrollTo(0, 0);
  } else if (step === 2) {
    const dateVal = document.getElementById('input-date').value;
    if (!dateVal) { alert('Indique la date de début de ton dernier cycle 🌙'); return; }
    ST.cycleStart = dateVal;
    ST.cycleDuration = selectedDuration;
    computeCycle();
    applySaisonTheme();
    showRévelation();
  }
}

function showRévelation() {
  const s = SAISONS[ST.currentSaison];
  document.getElementById('rev-emoji').textContent = s.emoji;
  document.getElementById('rev-title').textContent = 'Tu es en ' + s.nom;
  document.getElementById('rev-subtitle').textContent = s.phase + ' · Jour ' + ST.currentDay;
  const msgs = {
    hiver:"Ton corps est en repos profond. C'est une semaine pour la douceur, le silence et la récupération.",
    printemps:"L'énergie revient doucement. C'est le moment de commencer ce qui attend.",
    ete:"Tu es à ton pic d'énergie. C'est le bon moment pour agir, te connecter, donner.",
    automne:"Ton corps ralentit, tes émotions s'intensifient. C'est normal, c'est attendu."
  };
  document.getElementById('rev-message').textContent = msgs[ST.currentSaison];
  document.getElementById('onboarding').style.display = 'none';
  document.getElementById('revelation').style.display = 'flex';
}

function enterApp() {
  saveState();
  document.getElementById('revelation').style.display = 'none';
  document.getElementById('app').style.display = 'flex';
  initApp();
  const today = new Date().toDateString();
  setTimeout(() => {
    if (!localStorage.getItem('tabSeen_accueil')) {
      showTabTour('accueil');
    } else if (ST.checkinDate !== today) {
      const ov = document.getElementById('checkin-overlay');
      if (ov) { ov.style.display = 'flex'; ov.style.alignItems = 'flex-end'; }
    }
  }, 500);
}

// ═══════════════════════════════════════════════
// CHECK-IN
// ═══════════════════════════════════════════════
function doCheckin(mood) {
  ST.checkin = mood; ST.checkinDate = new Date().toDateString();
  document.getElementById('checkin-overlay').style.display = 'none';
  updateMessage(); saveState();
}
function updateMessage() {
  const s = SAISONS[ST.currentSaison];
  const mood = ST.checkin || 'bien';
  const el = document.getElementById('daily-message');
  if (el) el.textContent = s.messages[mood] || s.messages.bien;
}

// ═══════════════════════════════════════════════
// TABS
// ═══════════════════════════════════════════════
function switchTab(name, navEl) {
  document.querySelectorAll('.tab-page').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  navEl.classList.add('active');
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;
  const appContent = document.getElementById('app-content');
  if (appContent) { appContent.scrollTop = 0; setTimeout(() => { appContent.scrollTop = 0; }, 50); }
  setTimeout(() => showTabTour(name), 300);
}

function switchTabById(name, section) {
  document.querySelectorAll('.tab-page').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('tab-' + name)?.classList.add('active');
  const tabMap = {accueil:0, cycle:1, ame:2, vie:3, objectifs:4, moi:5};
  const navItems = document.querySelectorAll('.nav-item');
  if (navItems[tabMap[name]]) navItems[tabMap[name]].classList.add('active');
  setTimeout(() => showTabTour(name), 300);
  const _ac2 = document.getElementById('app-content');
  if (_ac2) _ac2.scrollTop = 0;
  if (section) {
    setTimeout(() => {
      document.querySelectorAll('.vie-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.vie-section').forEach(s => s.classList.remove('active'));
      const targetTab = document.querySelector('.vie-tab[onclick*="' + section + '"]');
      if (targetTab) targetTab.classList.add('active');
      const targetSection = document.getElementById('vie-' + section);
      if (targetSection) targetSection.classList.add('active');
    }, 50);
  }
}

function switchVieTab(el, section) {
  document.querySelectorAll('.vie-tab').forEach(t => { t.classList.remove('active'); t.style.background='white'; t.style.color='var(--gris)'; t.style.borderColor='var(--sable)'; });
  document.querySelectorAll('.vie-section').forEach(s => s.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('vie-' + section).classList.add('active');
}

function toggleSuggestion(el, idx) {
  if (!ST.selectedSugg) ST.selectedSugg = [];
  const i = ST.selectedSugg.indexOf(idx);
  if (i > -1) ST.selectedSugg.splice(i, 1);
  else ST.selectedSugg.push(idx);
  saveState();
  const isSel = ST.selectedSugg.includes(idx);
  el.classList.toggle('done', isSel);
  const chk = el.querySelector('.sugg-engage-chk');
  if (chk) chk.textContent = isSel ? '✓' : '';
  // MAJ du compteur
  const countEl = document.getElementById('sugg-engage-count');
  const s = SAISONS[ST.currentSaison];
  if (countEl) countEl.textContent = ST.selectedSugg.length + '/' + (s.suggestions?.length || 0) + ' faits';
}

// ═══════════════════════════════════════════════
// PRAYERS
// ═══════════════════════════════════════════════
function togglePrayer(el, name) {
  const today = new Date().toDateString();
  if (!ST.prayers[today]) ST.prayers[today] = {};
  ST.prayers[today][name] = !ST.prayers[today][name];
  updatePrayerProgress(); saveState();
  renderDayScore();
}
function updatePrayerProgress() {
  const today = new Date().toDateString();
  const names = ['fajr','dohr','asr','maghrib','isha'];
  const prayers = ST.prayers[today] || {};
  const done = names.filter(n => prayers[n]).length;
  if (done === 5) setTimeout(() => showPrayerCelebration(), 300);
  const pf = document.getElementById('prayer-progress');
  const pl = document.getElementById('prayer-prog-lbl');
  if (pf) pf.style.width = (done/5*100) + '%';
  if (pl) pl.textContent = done + ' / 5';
  names.forEach(n => {
    const chk = document.getElementById('pr-' + n);
    const nm = document.getElementById('prn-' + n);
    const isDone = !!prayers[n];
    if (chk) { chk.className = 'prayer-chk' + (isDone?' done':''); chk.style.background=isDone?'var(--season)':'transparent'; chk.style.borderColor=isDone?'var(--season)':'var(--sable)'; chk.style.color=isDone?'white':'transparent'; chk.textContent=isDone?'✓':''; }
    if (nm) nm.className = 'prayer-name' + (isDone?' done':'');
  });
}
function restorePrayers() { updatePrayerProgress(); }
function showPrayerCelebration() {
  const existing = document.getElementById('prayer-celebration');
  if (existing) return;
  const card = document.querySelector('.prayers-card');
  if (!card) return;
  const div = document.createElement('div');
  div.id = 'prayer-celebration';
  div.style.cssText = 'background:var(--season-soft);border-radius:14px;padding:14px 16px;margin:0 14px 12px;border:1.5px solid var(--season-light);text-align:center;';
  div.innerHTML = '<div style="font-size:22px;margin-bottom:6px">🤲</div><div style="font-size:16px;direction:rtl;color:var(--season);margin-bottom:4px">مَاشَاءَ اللَّهُ</div><div style="font-family:var(--serif);font-size:13px;font-style:italic;color:var(--noir);line-height:1.6">Masha\'Allah — les 5 prières accomplies. Que Allah accepte. 🌸</div>';
  card.insertAdjacentElement('afterend', div);
  setTimeout(() => { if(div.parentNode) div.parentNode.removeChild(div); }, 5000);
}

// ═══════════════════════════════════════════════
// SPORT
// ═══════════════════════════════════════════════
function toggleMouv(idx, el) {
  const today = new Date().toDateString();
  if (!ST.mouvDone) ST.mouvDone = {};
  if (!ST.mouvDone[today]) ST.mouvDone[today] = [];
  const done = ST.mouvDone[today];
  const i = done.indexOf(idx);
  if (i > -1) done.splice(i, 1); else done.push(idx);
  saveState();
  const isDone = done.includes(idx);
  el.style.background = isDone ? 'var(--season-soft)' : 'white';
  el.style.borderColor = isDone ? 'var(--season)' : 'var(--sable)';
  const chk = el.querySelector('div');
  if (chk) { chk.style.background=isDone?'var(--season)':'transparent'; chk.style.borderColor=isDone?'var(--season)':'var(--sable)'; chk.textContent=isDone?'✓':''; }
  const total = document.getElementById('sport-mouvements')?.children.length || 0;
  updateMouvProgress(total);
}
function updateMouvProgress(total) {
  const today = new Date().toDateString();
  const done = (ST.mouvDone && ST.mouvDone[today]) ? ST.mouvDone[today].length : 0;
  const pct = total > 0 ? Math.round(done/total*100) : 0;
  const lbl = document.getElementById('mouv-progress-label');
  const pctEl = document.getElementById('mouv-progress-pct');
  const fill = document.getElementById('mouv-progress-fill');
  if (lbl) lbl.textContent = done + ' / ' + total + ' pratiqués';
  if (pctEl) pctEl.textContent = pct + '%';
  if (fill) fill.style.width = pct + '%';
}
const SPORT_MSGS = {hiver:"Alhamdulillah — tu as pris soin de ton corps pendant l'Hiver.",printemps:"Alhamdulillah — ton corps t'a portée. Il méritait ce soin.",ete:"Alhamdulillah — tu as honoré ce pic d'énergie. Barak Allahou fik.",automne:"Alhamdulillah — malgré la lourdeur de l'Automne, tu as bougé."};
function validerSeance() {
  const today = new Date().toDateString();
  ST.seanceDone = ST.seanceDone || {};
  ST.seanceDone[today] = true;
  ST.seanceDashDone = ST.seanceDashDone || {};
  ST.seanceDashDone[today] = true;
  saveState();
  afficherSeanceDone();
  const s = SAISONS[ST.currentSaison];
  renderQuickSeance(s);
  renderDayScore();
}
function afficherSeanceDone() {
  const btn = document.getElementById('sport-validate-btn');
  const done = document.getElementById('sport-done-state');
  const msg = document.getElementById('sport-done-msg');
  if (btn) btn.style.display = 'none';
  if (done) done.style.display = 'block';
  if (msg) msg.textContent = SPORT_MSGS[ST.currentSaison] || SPORT_MSGS.hiver;
}
function restoreSeanceDone() {
  const today = new Date().toDateString();
  if (ST.seanceDone && ST.seanceDone[today]) afficherSeanceDone();
  else {
    const btn = document.getElementById('sport-validate-btn');
    const done = document.getElementById('sport-done-state');
    if (btn) btn.style.display = 'block';
    if (done) done.style.display = 'none';
  }
}

// ═══════════════════════════════════════════════
// GLAIRE CERVICALE
// ═══════════════════════════════════════════════
function selectGlaire(el, type) {
  document.querySelectorAll('.glaire-option').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
  ST.glaire = type; ST.glaireDate = new Date().toDateString(); saveState();
  const labels = {regles:'Rien / Règles',seche:'Sèche ou collante',cremeuse:'Crémeuse / Laiteuse',filante:'Filante / Transparente ⚡',epaisse:'Épaisse / Absente'};
  const collapsed = document.getElementById('glaire-collapsed');
  if (collapsed) { collapsed.textContent = '✓ ' + (labels[type]||type); collapsed.style.color = 'var(--season)'; }
  setTimeout(() => {
    const content = document.getElementById('glaire-content');
    const arrow = document.getElementById('glaire-arrow');
    if (content) content.style.display = 'none';
    if (arrow) arrow.style.transform = 'rotate(0deg)';
  }, 400);
}
function toggleGlaire() {
  const content = document.getElementById('glaire-content');
  const arrow = document.getElementById('glaire-arrow');
  if (!content) return;
  const isOpen = content.style.display !== 'none';
  content.style.display = isOpen ? 'none' : 'block';
  if (arrow) arrow.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
}
function toggleIntimite() {
  const content = document.getElementById('intimite-content');
  const arrow = document.getElementById('intimite-arrow');
  if (!content) return;
  const isOpen = content.style.display !== 'none';
  content.style.display = isOpen ? 'none' : 'block';
  if (arrow) arrow.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
}
function restoreGlaire() {
  const today = new Date().toDateString();
  if (ST.glaireDate === today && ST.glaire) {
    document.querySelectorAll('.glaire-option').forEach(o => {
      if (o.dataset.type === ST.glaire) o.classList.add('selected');
    });
  }
}

// ═══════════════════════════════════════════════
// ENERGY BARS & CYCLE RING
// ═══════════════════════════════════════════════
function phaseForDay(i, dur) {
  const ovulationDay = Math.max(10, dur - 14);
  const eteStart = Math.max(8, ovulationDay - 2);
  const eteEnd = Math.min(dur - 2, ovulationDay + 2);
  if (i <= 5) return 'hiver';
  if (i < eteStart) return 'printemps';
  if (i <= eteEnd) return 'ete';
  return 'automne';
}

function renderEnergyBars() {
  const el = document.getElementById('energy-bars-moi');
  if (!el) return;
  const day = ST.currentDay || 1;
  const dur = ST.cycleDuration || 28;
  const colors = {hiver:'#7B5EA7',printemps:'#3DAE8A',ete:'#E8834A',automne:'#C4694A'};
  const energyBase = {hiver:25,printemps:70,ete:95,automne:50};
  const title = document.getElementById('energy-title');
  if (title) title.textContent = `Mon énergie sur ${dur} jours`;
  let html = '';
  for (let i = 1; i <= dur; i++) {
    const phase = phaseForDay(i, dur);
    const h = Math.max(8, Math.min(100, energyBase[phase] + Math.sin(i * 1.3) * 10));
    const isToday = i === day;
    const opacity = i > day ? '0.2' : '0.55';
    const ring = isToday ? 'box-shadow:0 0 0 2px var(--season);' : '';
    html += `<div style="flex:1;border-radius:3px 3px 0 0;background:${colors[phase]};height:${h}%;opacity:${isToday?'1':opacity};${ring}min-height:4px;"></div>`;
  }
  el.innerHTML = html;
}

function drawCycleRing() {
  const cx=100, cy=100, r=82;
  const dur = ST.cycleDuration || 28;
  const day = ST.currentDay || 1;
  const ovDay = Math.max(10, dur - 14);
  const eteS = Math.max(8, ovDay - 2);
  const eteE = Math.min(dur - 2, ovDay + 2);
  const phases = [{id:'seg-hiver',start:1,end:5,color:'#7B5EA7'},{id:'seg-printemps',start:6,end:eteS-1,color:'#3DAE8A'},{id:'seg-ete',start:eteS,end:eteE,color:'#E8834A'},{id:'seg-automne',start:eteE+1,end:dur,color:'#C4694A'}];
  function polarToCart(angle) { const rad=(angle-90)*Math.PI/180; return {x:cx+r*Math.cos(rad),y:cy+r*Math.sin(rad)}; }
  function dayToAngle(d) { return ((d-1)/dur)*360; }
  function arcPath(s2,e2) { const a1=dayToAngle(s2),a2=dayToAngle(e2+1); const p1=polarToCart(a1),p2=polarToCart(a2); const large=(a2-a1)>180?1:0; return 'M '+p1.x+' '+p1.y+' A '+r+' '+r+' 0 '+large+' 1 '+p2.x+' '+p2.y; }
  phases.forEach(ph => {
    const el = document.getElementById(ph.id); if (!el) return;
    const end = Math.min(ph.end, dur);
    if (ph.start > dur) { el.setAttribute('d',''); return; }
    el.setAttribute('d', arcPath(ph.start, end));
    el.setAttribute('stroke', ph.color);
  });
  const dot = document.getElementById('day-dot');
  if (dot) { const pos=polarToCart(dayToAngle(day)); dot.setAttribute('cx',pos.x); dot.setAttribute('cy',pos.y); dot.setAttribute('stroke','var(--season)'); }
}

// ═══════════════════════════════════════════════
// 99 NOMS D'ALLAH
// ═══════════════════════════════════════════════
function showNomDuJour() {
  const dayOfYear = Math.floor((new Date()-new Date(new Date().getFullYear(),0,0))/86400000);
  const nom = ASMA[(dayOfYear-1)%99];
  const ar = document.getElementById('asma-day-arabic');
  const fr = document.getElementById('asma-day-fr');
  const meaning = document.getElementById('asma-day-meaning');
  const reflection = document.getElementById('asma-day-reflection');
  if (ar) ar.textContent = nom.ar;
  if (fr) fr.textContent = nom.fr;
  const med = ASMA_MEDITATIONS[nom.num];
  if (meaning) meaning.textContent = med ? med.m : nom.fr + " — médite sur ce nom aujourd'hui.";
  if (reflection) reflection.textContent = med ? med.r : "Répète ce nom dans ton cœur. Laisse-le guider ta journée.";
}
function buildAsmaGrid() {
  const grid = document.getElementById('asma-list'); if (!grid) return;
  grid.innerHTML = ASMA.map(a => {
    const known = ST.asmaKnown.includes(a.num);
    return `<div class="asma-item" onclick="toggleAsma(${a.num},this)"><div class="asma-chk${known?' done':''}" style="${known?'background:var(--season);border-color:var(--season);color:white':''}">${known?'✓':''}</div><div style="flex:1"><div class="asma-ar">${a.ar}</div><div class="asma-fr">${a.fr}</div></div></div>`;
  }).join('');
  updateAsmaCount();
}
function toggleAsma(num, el) {
  const idx = ST.asmaKnown.indexOf(num);
  if (idx > -1) ST.asmaKnown.splice(idx,1); else ST.asmaKnown.push(num);
  const known = ST.asmaKnown.includes(num);
  const chk = el.querySelector('.asma-chk');
  if (chk) { chk.className='asma-chk'+(known?' done':''); chk.style.background=known?'var(--season)':'transparent'; chk.style.borderColor=known?'var(--season)':'var(--sable)'; chk.style.color=known?'white':'transparent'; chk.textContent=known?'✓':''; }
  updateAsmaCount(); saveState();
}
function updateAsmaCount() {
  const count = ST.asmaKnown.length;
  const pct = (count/99*100)+'%';
  const countEl=document.getElementById('asma-count');
  const progEl=document.getElementById('asma-progress');
  const mCount=document.getElementById('asma-modal-count');
  const mProg=document.getElementById('asma-modal-progress');
  if (countEl) countEl.textContent=count;
  if (progEl) progEl.style.width=pct;
  if (mCount) mCount.textContent=count;
  if (mProg) mProg.style.width=pct;
}
function openAsmaModal() {
  buildAsmaGrid();
  document.getElementById('asma-modal').classList.add('open');
}
function closeAsmaModal() { document.getElementById('asma-modal').classList.remove('open'); }

// ═══════════════════════════════════════════════
// CHECK-IN SOIR
// ═══════════════════════════════════════════════
const EVENING_RESPONSES = {
  bien:{emoji:'🌟',hiver:"Alhamdulillah pour cette belle journée en Hiver.",printemps:"Alhamdulillah ! Le Printemps te porte bien.",ete:"Alhamdulillah — tu as rayonné aujourd'hui.",automne:"Alhamdulillah pour ce bon jour en Automne."},
  fatiguee:{emoji:'🌙',hiver:"L'Hiver demande tout. Tu as fait ce que tu as pu — c'est suffisant.",printemps:"La fatigue en Printemps mérite attention.",ete:"Même en été, le corps a ses limites.",automne:"L'Automne fatigue plus profondément. Dors tôt ce soir."},
  difficile:{emoji:'🤲',hiver:"Les jours difficiles en Hiver passent — comme l'Hiver passe toujours.",printemps:"Même quand tout devrait aller mieux, il y a des jours lourds.",ete:"Même au sommet, des jours difficiles arrivent. Allah est avec toi.",automne:"L'Automne amplifie la difficulté. C'est réel — et passager."},
  calme:{emoji:'🍃',hiver:"Une journée calme en Hiver, c'est déjà beaucoup.",printemps:"Les journées tranquilles construisent aussi.",ete:"Même en été, une journée douce est un cadeau.",automne:"Le calme en Automne est une sagesse."}
};
function showEveningCheckin() {
  document.getElementById('evening-questions').style.display='block';
  document.getElementById('evening-response').style.display='none';
  const evOv=document.getElementById('evening-checkin-overlay');
  if (evOv) { evOv.style.display='flex'; evOv.style.alignItems='flex-end'; }
}
function doEveningCheckin(mood) {
  const r=EVENING_RESPONSES[mood]; if (!r) { closeEveningCheckin(); return; }
  const msg=r[ST.currentSaison]||r.automne;
  document.getElementById('evening-resp-emoji').textContent=r.emoji;
  document.getElementById('evening-resp-msg').textContent=msg;
  document.getElementById('evening-questions').style.display='none';
  document.getElementById('evening-response').style.display='block';
  ST.eveningCheckinDate=new Date().toDateString(); ST.eveningCheckinMood=mood; saveState();
}
function closeEveningCheckin() { const evOv=document.getElementById('evening-checkin-overlay'); if (evOv) evOv.style.display='none'; }
function checkNotificationReturn() {
  const now=new Date(); const hour=now.getHours(); const today=now.toDateString();
  if (hour>=14&&ST.eveningCheckinDate!==today&&ST.prenom&&ST.cycleStart) showEveningCheckin();
}

// ═══════════════════════════════════════════════
// CYCLE EDIT
// ═══════════════════════════════════════════════
let editDuration = 28;
function openEditCycle() {
  const today=new Date().toISOString().split('T')[0];
  document.getElementById('edit-cycle-date').value=ST.cycleStart||today;
  document.getElementById('edit-cycle-date').max=today;
  editDuration=ST.cycleDuration||28;
  document.getElementById('edit-cycle-modal').classList.add('open');
}
function closeEditCycle() { document.getElementById('edit-cycle-modal').classList.remove('open'); }
function selectEditDuration(el, val) {
  document.querySelectorAll('#edit-duration-options .ob-option').forEach(o => { o.classList.remove('selected'); o.style.background='white'; o.style.borderColor='var(--sable)'; });
  el.classList.add('selected'); el.style.background='var(--season-soft)'; el.style.borderColor='var(--season)';
  editDuration=val;
}
function saveEditCycle() {
  const dateVal=document.getElementById('edit-cycle-date').value;
  if (!dateVal) { alert('Indique la date 🌙'); return; }
  if (ST.cycleStart && ST.cycleStart !== dateVal) {
    if (!ST.cycleHistory) ST.cycleHistory = [];
    ST.cycleHistory.unshift({ start: ST.cycleStart, duration: ST.cycleDuration || 28 });
    if (ST.cycleHistory.length > 6) ST.cycleHistory = ST.cycleHistory.slice(0, 6);
  }
  ST.cycleStart=dateVal; ST.cycleDuration=editDuration; saveState(); closeEditCycle();
  computeCycle(); applySaisonTheme(); populateAll();
  showToast('✓ Cycle mis à jour — ' + SAISONS[ST.currentSaison].emoji + ' ' + SAISONS[ST.currentSaison].nom + ' · Jour ' + ST.currentDay);
}

// ═══════════════════════════════════════════════
// NOTIFICATIONS
// ═══════════════════════════════════════════════
let selectedFreq = 2;
function selectFreq(el, freq) {
  selectedFreq=freq;
  document.querySelectorAll('#notif-freq-options .ob-option').forEach(o => { o.classList.remove('selected'); });
  el.classList.add('selected');
}
function openNotifSettings() {
  document.getElementById('notif-modal').classList.add('open');
  const status=document.getElementById('notif-permission-status');
  if (!('Notification' in window)) status.innerHTML="📱 Installe l'app sur l'écran d'accueil pour activer les rappels.";
  else if (Notification.permission==='granted') { status.innerHTML='✅ <strong>Notifications activées</strong>'; status.style.color='#3DAE8A'; }
  else if (Notification.permission==='denied') { status.innerHTML='❌ Bloquées — Réglages → Safari → Notifications.'; status.style.color='#C4694A'; }
  else status.innerHTML='🔔 Appuie sur Activer pour recevoir tes rappels.';
}
function closeNotifModal() { document.getElementById('notif-modal').classList.remove('open'); }
function saveNotifSettings() {
  ST.notifFreq=selectedFreq; saveState();
  if (!selectedFreq) { showToast('Rappels désactivés.'); closeNotifModal(); return; }
  if (!('Notification' in window)) { showToast("📱 Installe l'app depuis l'écran d'accueil pour les rappels."); closeNotifModal(); return; }
  Notification.requestPermission().then(permission => {
    if (permission==='granted') { closeNotifModal(); showToast('Rappels activés ! 🌸'); }
  }).catch(() => { closeNotifModal(); });
}

// ═══════════════════════════════════════════════
// PREMIUM / WAITLIST
// ═══════════════════════════════════════════════
async function joinWaitlist() {
  const emailInput=document.getElementById('waitlist-email');
  const btn=document.querySelector('[onclick="joinWaitlist()"]');
  const msg=document.getElementById('waitlist-msg');
  const email=emailInput.value.trim();
  if (!email||!email.includes('@')) { msg.style.color='#C4694A'; msg.textContent='Entre une adresse email valide 🌸'; return; }
  btn.disabled=true; btn.textContent='…';
  try {
    const res=await fetch('https://formspree.io/f/xojpknkq',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({email,saison:ST.currentSaison,jour:ST.currentDay})});
    if (res.ok) { ST.waitlistEmail=email; saveState(); msg.style.color='#3DAE8A'; msg.textContent='Alhamdulillah — tu seras la première informée ! 🌸'; emailInput.value=''; emailInput.disabled=true; btn.textContent='✓'; }
    else throw new Error();
  } catch(e) { msg.style.color='#C4694A'; msg.textContent="Une erreur est survenue."; btn.disabled=false; btn.textContent='Rejoindre ✦'; }
}
function goToPremium() {
  switchTabById('moi');
  setTimeout(() => { const w=document.getElementById('waitlist-email'); if(w) w.scrollIntoView({behavior:'smooth',block:'center'}); }, 200);
}

// ═══════════════════════════════════════════════
// FEEDBACK
// ═══════════════════════════════════════════════
let selectedRating=0;
const RATING_LABELS={1:"Pas encore convaincue…",2:"Des choses à améliorer",3:"Bien, mais peut mieux faire",4:"Je l'aime bien !",5:"Je l'adore ! 🌸"};
function setRating(val) {
  selectedRating=val;
  const label=document.getElementById('rating-label'); if(label) label.textContent=RATING_LABELS[val]||'';
  document.querySelectorAll('#rating-stars > div').forEach((star,i) => { const isSel=i+1<=val; star.style.background=isSel?'var(--season-soft)':'white'; star.style.borderColor=isSel?'var(--season)':'var(--sable)'; });
}
function toggleChip(el) {
  const isSel=el.dataset.selected==='true'; el.dataset.selected=isSel?'false':'true';
  el.style.background=isSel?'white':'var(--season-soft)'; el.style.borderColor=isSel?'var(--sable)':'var(--season)'; el.style.color=isSel?'var(--gris)':'var(--season)';
}
async function sendFeedback() {
  const msg=document.getElementById('feedback-msg');
  const text=document.getElementById('feedback-text').value.trim();
  const email=document.getElementById('feedback-email').value.trim();
  if (!selectedRating) { msg.style.color='#C4694A'; msg.textContent="Sélectionne une note 🌸"; return; }
  const likes=[]; document.querySelectorAll('#likes-chips > div[data-selected="true"]').forEach(c=>likes.push(c.textContent.trim()));
  const btn=document.querySelector('[onclick="sendFeedback()"]'); if(btn){btn.disabled=true;btn.textContent='Envoi…';}
  try {
    const res=await fetch('https://formspree.io/f/xojpknkq',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({type:'FEEDBACK_BETA',note:selectedRating+'/5',jaime:likes.join(', ')||'Non renseigné',ameliorer:text||'Non renseigné',email:email||'Non renseigné',saison:ST.currentSaison,prenom:ST.prenom})});
    if (res.ok) { ST.feedbackSent=true; saveState(); document.getElementById('feedback-form-wrap').style.display='none'; document.getElementById('feedback-sent-wrap').style.display='block'; }
    else throw new Error();
  } catch(e) { if(btn){btn.disabled=false;btn.textContent='Envoyer mon avis ✦';} }
}
function restoreFeedback() {
  const section=document.getElementById('feedback-section'); if(!section) return;
  if (ST.cycleStart) { const daysSince=Math.floor((new Date()-new Date(ST.cycleStart))/86400000); if(daysSince<3&&!ST.feedbackSent){section.style.display='none';return;} }
  section.style.display='block';
  if (ST.feedbackSent) { const form=document.getElementById('feedback-form-wrap'); const sent=document.getElementById('feedback-sent-wrap'); if(form) form.style.display='none'; if(sent) sent.style.display='block'; }
}

// ═══════════════════════════════════════════════
// UTILITAIRES
// ═══════════════════════════════════════════════
function showInstallBanner() {
  if (window.navigator.standalone) return;
  if (ST.installBannerDismissed) return;
  const banner=document.getElementById('install-banner'); if(banner) banner.style.display='flex';
}
function dismissInstallBanner() { ST.installBannerDismissed=true; saveState(); const banner=document.getElementById('install-banner'); if(banner) banner.style.display='none'; }
function showToast(msg) {
  let el=document.getElementById('toastEl');
  if (!el) { el=document.createElement('div'); el.id='toastEl'; el.className='toast'; document.body.appendChild(el); }
  el.textContent=msg; el.classList.add('show'); setTimeout(()=>el.classList.remove('show'),2900);
}
function formatDateFr(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const months = ['jan.','fév.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];
  return d + ' ' + months[m - 1] + ' ' + y;
}
function renderCycleHistory() {
  const card = document.getElementById('cycle-history-card');
  const list = document.getElementById('cycle-history-list');
  if (!card || !list) return;
  const history = ST.cycleHistory || [];
  if (!ST.cycleStart && history.length === 0) { card.style.display = 'none'; return; }
  card.style.display = 'block';
  const s = SAISONS[ST.currentSaison];
  let html = '';
  if (ST.cycleStart) {
    const hasPast = history.length > 0;
    html += `<div style="display:flex;align-items:center;gap:12px;padding:10px 0;${hasPast ? 'border-bottom:1px solid var(--sable);' : ''}">
      <div style="width:36px;height:36px;border-radius:50%;background:${s.grad};display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">${s.emoji}</div>
      <div style="flex:1;">
        <div style="font-size:13px;font-weight:600;color:var(--noir);">Du ${formatDateFr(ST.cycleStart)}</div>
        <div style="font-size:11px;color:var(--gris);margin-top:2px;">Jour ${ST.currentDay} · ${s.nom} · ${ST.cycleDuration || 28} jours</div>
      </div>
      <div style="font-size:9px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:white;background:${s.color};padding:3px 8px;border-radius:8px;">En cours</div>
    </div>`;
  }
  const shown = history.slice(0, 6);
  shown.forEach((c, i) => {
    const sep = i < shown.length - 1 ? 'border-bottom:1px solid var(--sable);' : '';
    html += `<div style="display:flex;align-items:center;gap:12px;padding:10px 0;${sep}">
      <div style="width:36px;height:36px;border-radius:50%;background:#F5EDE0;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">&#127769;</div>
      <div style="flex:1;">
        <div style="font-size:13px;font-weight:600;color:var(--noir);">Du ${formatDateFr(c.start)}</div>
        <div style="font-size:11px;color:var(--gris);margin-top:2px;">${c.duration} jours</div>
      </div>
    </div>`;
  });
  list.innerHTML = html;
}
function renderPatterns() {
  const card = document.getElementById('patterns-card');
  if (!card) return;
  if (!ST.cycleStart) { card.style.display = 'none'; return; }
  card.style.display = 'block';

  const history = ST.cycleHistory || [];
  const allCycles = [{ start: ST.cycleStart, duration: ST.cycleDuration || 28 }, ...history];
  const durations = allCycles.map(c => c.duration || 28);
  const avg = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
  const minD = Math.min(...durations);
  const maxD = Math.max(...durations);
  const isRegular = (maxD - minD) <= 3;

  // Compter les symptômes sur toutes les dates
  const sympCount = {};
  const sympMeta = {};
  Object.values(SYMPTOMES_PAR_PHASE).flat().forEach(s => { sympMeta[s.id] = s; });
  Object.values(ST.symptomes || {}).forEach(arr => {
    arr.forEach(id => {
      if (id === 'autre') return;
      sympCount[id] = (sympCount[id] || 0) + 1;
    });
  });
  const topSymp = Object.entries(sympCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([id, cnt]) => ({ ...sympMeta[id], cnt }))
    .filter(s => s && s.emoji);

  const totalJoursSuivis = Object.keys(ST.symptomes || {}).length;

  // Section gratuite
  document.getElementById('patterns-free').innerHTML = `
    <div style="display:flex;gap:8px;margin-bottom:12px;">
      <div style="flex:1;background:var(--creme);border-radius:14px;padding:12px;text-align:center;">
        <div style="font-size:24px;font-weight:700;color:var(--noir);font-family:var(--serif);">${avg}</div>
        <div style="font-size:10px;color:var(--gris);margin-top:2px;">jours en moy.</div>
      </div>
      <div style="flex:1;background:var(--creme);border-radius:14px;padding:12px;text-align:center;">
        <div style="font-size:24px;font-weight:700;color:var(--noir);font-family:var(--serif);">${allCycles.length}</div>
        <div style="font-size:10px;color:var(--gris);margin-top:2px;">cycles suivis</div>
      </div>
      <div style="flex:1;background:var(--creme);border-radius:14px;padding:12px;text-align:center;">
        <div style="font-size:20px;">${isRegular ? '🌿' : '〰️'}</div>
        <div style="font-size:10px;color:var(--gris);margin-top:2px;">${isRegular ? 'Régulier' : 'Variable'}</div>
      </div>
    </div>
    ${minD !== maxD ? `<div style="font-size:11px;color:var(--gris);margin-bottom:14px;line-height:1.5;">Tes cycles varient entre <b style="color:var(--noir);">${minD}</b> et <b style="color:var(--noir);">${maxD}</b> jours — ${isRegular ? 'une belle régularité.' : 'des variations normales.'}</div>` : `<div style="font-size:11px;color:var(--gris);margin-bottom:14px;">Tes cycles sont très stables ✨</div>`}
  `;

  // Section premium verrouillée
  const previewSymptoms = topSymp.length >= 2 ? topSymp : [
    { emoji: '😴', label: 'Fatigue', cnt: 8 },
    { emoji: '🌀', label: 'Crampes', cnt: 5 },
    { emoji: '🌸', label: 'Bonne humeur', cnt: 4 },
  ];

  document.getElementById('patterns-premium').innerHTML = `
    <div style="position:relative;border-radius:14px;overflow:hidden;margin-top:4px;">
      <div style="filter:blur(3px);pointer-events:none;user-select:none;padding:14px;background:var(--creme);">
        <div style="font-size:10px;font-weight:600;color:var(--gris);letter-spacing:1px;text-transform:uppercase;margin-bottom:10px;">Tes symptômes les plus fréquents</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px;">
          ${previewSymptoms.map(s => `<div style="background:white;border-radius:10px;padding:6px 12px;font-size:12px;display:flex;align-items:center;gap:6px;">${s.emoji} <span>${s.label}</span> <span style="color:var(--gris);">·</span> <b>${s.cnt}×</b></div>`).join('')}
        </div>
        <div style="font-size:10px;font-weight:600;color:var(--gris);letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;">Analyse par phase</div>
        <div style="font-size:12px;color:var(--gris);line-height:1.6;">🌙 Hiver · Fatigue et crampes reviennent souvent<br>☀️ Été · Énergie max, quelques maux de tête</div>
        <div style="margin-top:10px;font-size:12px;color:var(--gris);">🔮 Prochaines règles prévues dans ≈ 8 jours</div>
      </div>
      <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(255,255,255,0.72);backdrop-filter:blur(1px);">
        <div style="font-size:28px;margin-bottom:8px;">✨</div>
        <div style="font-size:14px;font-weight:700;color:var(--noir);margin-bottom:4px;font-family:var(--serif);">Fonctionnalité Premium</div>
        <div style="font-size:12px;color:var(--gris);margin-bottom:14px;text-align:center;max-width:200px;line-height:1.5;">Patterns, prédictions et analyse<br>de tes cycles complets</div>
        <div style="background:linear-gradient(135deg,#C4A95A,#E8C97A);color:white;border-radius:12px;padding:10px 22px;font-size:12px;font-weight:700;letter-spacing:0.5px;">Bientôt disponible</div>
      </div>
    </div>
  `;
}

function exportData() {
  const data = localStorage.getItem('sakinapp_v1');
  if (!data) { showToast('Aucune donnée à sauvegarder.'); return; }
  const filename = 'sakinapp_backup_' + new Date().toISOString().slice(0,10) + '.json';
  if (navigator.share && /iphone|ipad|ipod/i.test(navigator.userAgent)) {
    const file = new File([data], filename, { type: 'application/json' });
    navigator.share({ files: [file], title: 'SakinApp – Sauvegarde' }).catch(() => {});
  } else {
    const a = document.createElement('a');
    a.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(data);
    a.download = filename;
    a.click();
  }
}
function importData() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,application/json';
  input.onchange = () => {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (typeof parsed !== 'object' || parsed === null) throw new Error();
        if (confirm('Restaurer ces données ? Tes données actuelles seront remplacées.')) {
          localStorage.setItem('sakinapp_v1', JSON.stringify(parsed));
          location.reload();
        }
      } catch { showToast('Fichier invalide. Vérifie que c\'est bien une sauvegarde SakinApp.'); }
    };
    reader.readAsText(file);
  };
  input.click();
}
function deleteMyData() {
  document.getElementById('delete-modal').classList.add('open');
}
function closeDeleteModal() {
  document.getElementById('delete-modal').classList.remove('open');
}
function confirmDeleteMyData() {
  try { localStorage.clear(); } catch(e) {}
  ST = {
    prenom: '', cycleStart: null, cycleDuration: 28, checkin: null, checkinDate: null,
    prayers: {}, dhikrChecks: {}, dhikrDate: null, coranDone: {}, asmaKnown: [],
    glaire: null, glaireDate: null, symptomes: {}, autreSymptomesText: {}, currentSaison: 'printemps', currentDay: 1,
    selectedSugg: [], seanceDashDone: {}, mouvDone: {}, seanceDone: {}, notifFreq: 2,
    waitlistEmail: null, feedbackSent: false, installBannerDismissed: false,
    lastDailyReset: null, lastWeeklyReset: null, eveningCheckinDate: null,
    eveningCheckinMood: null, cycleHistory: [],
    isPremium: false, seanceValidatedCount: 0, seanceLevel: 1,
    weeklyObjChecks: {}, customObjectifs: [], customObjChecks: {}
  };
  closeDeleteModal();
  document.getElementById('app').style.display = 'none';
  document.getElementById('onboarding').style.display = 'block';
}

// ═══════════════════════════════════════════════
// TOUR GUIDÉ — un tooltip par onglet à la 1ère ouverture
// ═══════════════════════════════════════════════
const TAB_TOURS = {
  accueil: {
    emoji: '🏠',
    title: 'Ton tableau de bord',
    text: 'Chaque matin, fais ton check-in, consulte tes rappels spirituels et découvre tes suggestions personnalisées selon ta saison de cycle.',
  },
  cycle: {
    emoji: '🌙',
    title: 'Ton cycle en un coup d\'œil',
    text: 'L\'anneau coloré affiche ta phase en temps réel. Note tes symptômes du jour et démarre un nouveau cycle d\'un simple toucher.',
  },
  ame: {
    emoji: '🤲',
    title: 'Ta connexion spirituelle',
    text: 'Coche tes prières, tes adhkar et ta lecture du Coran. Pendant tes règles, un espace doux et adapté remplace la carte des prières.',
  },
  vie: {
    emoji: '🌿',
    title: 'Ta vie au rythme du cycle',
    text: 'Alimentation, sport et skincare changent à chaque phase. Retrouve ici les conseils adaptés à ce que ton corps traverse en ce moment.',
  },
  objectifs: {
    emoji: '🎯',
    title: 'Tes objectifs de la semaine',
    text: 'Coche tes petits défis quotidiens et suis leur progression. Le calendrier colore chaque jour selon ta phase de cycle.',
  },
  moi: {
    emoji: '✨',
    title: 'Ton espace personnel',
    text: 'Consulte ton historique de cycles, ton portrait de cycle et gère tes paramètres. Tes données ne quittent jamais ton téléphone.',
  },
};
let _currentTourTab = null;

function showTabTour(name) {
  if (!TAB_TOURS[name]) return;
  if (localStorage.getItem('tabSeen_' + name)) return;
  _currentTourTab = name;
  const step = TAB_TOURS[name];
  document.getElementById('tour-emoji').textContent = step.emoji;
  document.getElementById('tour-title').textContent = step.title;
  document.getElementById('tour-text').textContent = step.text;
  document.getElementById('tour-dots').innerHTML = '';
  document.getElementById('tour-overlay').style.display = 'flex';
}

function tourNext() {
  document.getElementById('tour-overlay').style.display = 'none';
  if (_currentTourTab) {
    localStorage.setItem('tabSeen_' + _currentTourTab, '1');
    _currentTourTab = null;
  }
}

let _waitingSW = null;
function showUpdateBanner() {
  const banner = document.getElementById('update-banner');
  if (banner) banner.style.display = 'flex';
}
function applyUpdate() {
  if (_waitingSW) {
    _waitingSW.postMessage({ type: 'SKIP_WAITING' });
    navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload(), { once: true });
  } else {
    window.location.reload();
  }
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(reg => {
      if (reg.waiting) { _waitingSW = reg.waiting; showUpdateBanner(); }
      reg.addEventListener('updatefound', () => {
        const newSW = reg.installing;
        if (!newSW) return;
        newSW.addEventListener('statechange', () => {
          if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
            _waitingSW = newSW;
            showUpdateBanner();
          }
        });
      });
    }).catch(() => {});
  });
}

// Toggle section symptômes
function toggleSymptomesSection() {
  const content = document.getElementById('symptomes-content');
  const arrow = document.getElementById('symptomes-arrow');
  if (!content) return;
  const isOpen = content.style.display !== 'none';
  content.style.display = isOpen ? 'none' : 'block';
  if (arrow) arrow.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
}
function toggleHygiene() {
  const content = document.getElementById('hygiene-content');
  const arrow = document.getElementById('hygiene-arrow');
  if (!content) return;
  const isOpen = content.style.display !== 'none';
  content.style.display = isOpen ? 'none' : 'block';
  if (arrow) arrow.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
}
