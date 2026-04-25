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
  dhikr: {subhan:0, alhamdu:0, akbar:0, istighfar:0},
  dhikrDate: null,
  asmaKnown: [],
  glaire: null,
  glaireDate: null,
  currentSaison: 'printemps',
  currentDay: 1,
  selectedSugg: [],
};

function saveState() {
  try { localStorage.setItem('sakinapp_v1', JSON.stringify(ST)); } catch(e) {}
}
function loadState() {
  try {
    const saved = localStorage.getItem('sakinapp_v1');
    if (saved) ST = {...ST, ...JSON.parse(saved)};
  } catch(e) {}
}

// ═══════════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════════
const SAISONS = {
  hiver: {
    nom: 'Hiver', foodTeaser: 'Bouillons chauds, épices, fer', skinTeaser: 'Hydratation intense & réparation', emoji: '🌙', phase: 'Phase menstruelle',
    color: '#7B5EA7', light: '#B89FD4', soft: '#F0EBF8', dark: '#3D2060',
    grad: 'linear-gradient(145deg, #3D2060, #7B5EA7)',
    jours: [1,5],
    messages: {
      bien: "Tu vas bien en Hiver — c'est précieux. Repose-toi vraiment, sans culpabilité. Ton corps travaille même quand tu ne le sens pas.",
      fatiguee: "Tu n'es pas paresseuse. Ton corps est en mode économie d'énergie en ce moment — c'est biologique. Faire peu aujourd'hui, c'est déjà beaucoup.",
      difficile: "Merci de l'avoir dit. Tu n'as pas à aller bien tout le temps. Aujourd'hui, une chose douce suffit — pour toi.",
      foi: "Si la foi semble moins accessible en ce moment, ce n'est pas un signe de faiblesse. Les hormones influencent ton état intérieur — c'est physiologique, pas de l'hypocrisie. Un seul dhikr aujourd'hui, c'est déjà immense."
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
          {num:'01', name:'Respiration abdominale', detail:'Allongée, mains sur le ventre. 10 respirations profondes.'},
          {num:'02', name:'Posture enfant', detail:'Genoux écartés, front au sol. 2 minutes. Respirer.'},
          {num:'03', name:'Rotation douce du dos', detail:'Genoux pliés, les faire tomber à droite puis gauche. 5 fois.'},
          {num:'04', name:'Étirement hanches', detail:'Ramener un genou sur la poitrine. 30 sec. Changer.'},
        ]
      },
      mouvements: ['Étirements doux','Mobilité du bassin','Posture enfant','Respiration profonde','Marche contemplative']
    },
    skincare: {
      whatHappens: 'Les hormones sont au plus bas — ta peau est plus sèche, plus sensible et la barrière cutanée est affaiblie. La circulation ralentit, ce qui peut donner un teint plus terne.',
      actifs: [
        {nom:'🌹 Huile de rose musquée', why:'Régénérante, nourrit la barrière cutanée', usage:'Quelques gouttes le soir'},
        {nom:'🍯 Miel brut', why:'Antibactérien, hydratant, anti-poussées', usage:'Masque 10 min, 2x/semaine'},
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
      bien: "Tu remarques peut-être plus d'élan, d'envie de faire et de te connecter. C'est ton cycle qui monte — profites-en pour avancer sur ce qui attend depuis un moment.",
      fatiguee: "La fatigue en Printemps mérite attention. Écoute ce que ton corps demande — peut-être juste un peu plus de douceur aujourd'hui.",
      difficile: "Merci de l'avoir dit. Tu n'as pas à aller bien tout le temps. Aujourd'hui, une chose douce suffit — pour toi.",
      foi: "La foi fluctue avec le corps — c'est humain, pas de l'hypocrisie. Un seul acte aujourd'hui, le plus simple que tu puisses faire."
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
          {num:'01', name:'Échauffement — rotations', detail:'Chevilles, poignets, épaules, cou. 2 minutes.'},
          {num:'02', name:'10 squats', detail:'Descendre lentement, remonter en expirant. 3 séries.'},
          {num:'03', name:'Gainage genoux', detail:'Planche sur les genoux. Tenir 20 sec. 3 fois.'},
          {num:'04', name:'10 fentes alternées', detail:'Genou à 90°. 8 par jambe.'},
        ]
      },
      mouvements: ['Pilates doux','Marche rapide','Squats doux','Fentes légères','Danse libre','Vélo tranquille']
    },
    skincare: {
      whatHappens: 'Les œstrogènes montent progressivement — ta peau devient plus lumineuse, plus souple. C\'est la meilleure phase pour les soins actifs et l\'exfoliation douce.',
      actifs: [
        {nom:'✨ Vitamine C naturelle', why:'Éclat et anti-oxydant', usage:'Sérum le matin'},
        {nom:'🌾 Argile blanche', why:'Exfoliante douce, purifiante', usage:'Masque 1x/semaine'},
        {nom:'🌺 Niacinamide', why:'Resserre les pores, unifie le teint', usage:'Sérum ou crème légère'},
      ],
      gestes: ['Exfoliation douce 1-2x/sem','Masque purifiant','Sérum vitamine C','Gua sha'],
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
      bien: "Tu es à ton pic. C'est le bon moment pour les efforts physiques, les conversations importantes, les projets qui demandent de l'investissement.",
      fatiguee: "Si tu te sens fatiguée alors que ton cycle dit Été — c'est un signal. Le corps parle toujours juste. Écoute-le sans te comparer.",
      difficile: "Merci de l'avoir dit. Tu n'as pas à aller bien tout le temps. Aujourd'hui, une chose douce suffit — pour toi.",
      foi: "L'Été est une bonne fenêtre pour un petit acte de reconnexion. Pas une liste — juste un geste, le plus doux possible."
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
      whatHappens: 'Pic d\'œstrogènes — ta peau est au meilleur d\'elle-même. Teint lumineux, bonne hydratation naturelle. Mais le pic hormonal peut stimuler les glandes sébacées.',
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
      bien: "Valoriser ce bon état sans créer d'attente. Des fluctuations arrivent peut-être — maintenant que tu le sais, elles ne te surprendront pas.",
      fatiguee: "Peut-être que tout te semble plus lourd en ce moment — c'est ton Automne. Ton cerveau amplifie la charge. Une chose. La plus petite. Juste une.",
      difficile: "Ce que tu ressens ce soir — ce doute, cette envie d'abandonner — c'est ton Automne qui parle, pas la réalité. Attends le Printemps pour décider.",
      foi: "La baisse de sérotonine en cette phase peut rendre tout plus lourd — y compris la spiritualité. Tenir malgré la lourdeur, c'est déjà un acte."
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
          {num:'03', name:'Pont fessier lent', detail:'Mouvement fluide. Pas de force. 10 fois.'},
          {num:'04', name:'Legs up the wall', detail:'Jambes à la verticale. 3 minutes. Fermer les yeux.'},
        ]
      },
      mouvements: ['Marche en plein air (J1-J7)','Circuit léger (J1-J7)','Yoga doux (J8-J14)','Étirements profonds (J8-J14)','Respiration libératrice']
    },
    skincare: {
      whatHappens: 'Les œstrogènes baissent tandis que les androgènes augmentent — production de sébum augmentée, pores plus visibles, peau plus réactive. C\'est cette combinaison qui explique les poussées d\'acné hormonale.',
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

const ASMA = [
  {num:1, ar:'اللَّهُ', fr:'Allah'},{num:2, ar:'الرَّحْمَنُ', fr:'Ar-Rahman · Le Tout Miséricordieux'},{num:3, ar:'الرَّحِيمُ', fr:'Ar-Rahim · Le Très Miséricordieux'},{num:4, ar:'الْمَلِكُ', fr:'Al-Malik · Le Roi'},{num:5, ar:'الْقُدُّوسُ', fr:'Al-Quddous · Le Très Saint'},
  {num:6, ar:'السَّلَامُ', fr:'As-Salam · La Paix'},{num:7, ar:'الْمُؤْمِنُ', fr:"Al-Mu'min · Celui qui donne la sécurité"},{num:8, ar:'الْمُهَيْمِنُ', fr:'Al-Muhaimin · Le Gardien Suprême'},{num:9, ar:'الْعَزِيزُ', fr:"Al-Aziz · Le Puissant"},{num:10, ar:'الْجَبَّارُ', fr:'Al-Jabbar · Le Contraignant'},
  {num:11, ar:'الْمُتَكَبِّرُ', fr:'Al-Mutakabbir · Le Très Grand'},{num:12, ar:'الْخَالِقُ', fr:'Al-Khaliq · Le Créateur'},{num:13, ar:'الْبَارِئُ', fr:"Al-Bari · Le Formateur"},{num:14, ar:'الْمُصَوِّرُ', fr:'Al-Mussawwir · Le Façonneur'},{num:15, ar:'الْغَفَّارُ', fr:'Al-Ghaffar · Le Grand Pardonneur'},
  {num:16, ar:'الْقَهَّارُ', fr:'Al-Qahhar · Le Dominateur Absolu'},{num:17, ar:'الْوَهَّابُ', fr:'Al-Wahhab · Le Donateur'},{num:18, ar:'الرَّزَّاقُ', fr:'Ar-Razzaq · Le Pourvoyeur'},{num:19, ar:'الْفَتَّاحُ', fr:'Al-Fattah · Le Grand Ouvreur'},{num:20, ar:'الْعَلِيمُ', fr:"Al-Alim · L'Omniscient"},
  {num:21, ar:'الْقَابِضُ', fr:'Al-Qabid · Celui qui retient'},{num:22, ar:'الْبَاسِطُ', fr:'Al-Basit · Celui qui étend'},{num:23, ar:'الْخَافِضُ', fr:'Al-Khafid · Celui qui abaisse'},{num:24, ar:'الرَّافِعُ', fr:"Ar-Rafi · Celui qui élève"},{num:25, ar:'الْمُعِزُّ', fr:"Al-Mu'izz · Celui qui honore"},
  {num:26, ar:'الْمُذِلُّ', fr:'Al-Mudhill · Celui qui humilie'},{num:27, ar:'السَّمِيعُ', fr:'As-Sami · Le Tout-Entendant'},{num:28, ar:'الْبَصِيرُ', fr:'Al-Basir · Le Clairvoyant'},{num:29, ar:'الْحَكَمُ', fr:'Al-Hakam · Le Juge'},{num:30, ar:'الْعَدْلُ', fr:"Al-Adl · Le Juste"},
  {num:31, ar:'اللَّطِيفُ', fr:'Al-Latif · Le Subtil'},{num:32, ar:'الْخَبِيرُ', fr:'Al-Khabir · Le Bien Informé'},{num:33, ar:'الْحَلِيمُ', fr:'Al-Halim · Le Clément'},{num:34, ar:'الْعَظِيمُ', fr:'Al-Azim · Le Très Grand'},{num:35, ar:'الْغَفُورُ', fr:'Al-Ghafur · Le Très Indulgent'},
  {num:36, ar:'الشَّكُورُ', fr:'Ash-Shakur · Le Très Reconnaissant'},{num:37, ar:'الْعَلِيُّ', fr:'Al-Ali · Le Très Haut'},{num:38, ar:'الْكَبِيرُ', fr:'Al-Kabir · Le Très Grand'},{num:39, ar:'الْحَفِيظُ', fr:'Al-Hafiz · Le Gardien'},{num:40, ar:'الْمُقِيتُ', fr:'Al-Muqit · Le Mainteneur'},
  {num:41, ar:'الْحَسِيبُ', fr:'Al-Hasib · Le Teneur de comptes'},{num:42, ar:'الْجَلِيلُ', fr:'Al-Jalil · Le Majestueux'},{num:43, ar:'الْكَرِيمُ', fr:'Al-Karim · Le Généreux'},{num:44, ar:'الرَّقِيبُ', fr:'Ar-Raqib · Le Vigilant'},{num:45, ar:'الْمُجِيبُ', fr:'Al-Mujib · Celui qui répond'},
  {num:46, ar:'الْوَاسِعُ', fr:'Al-Wasi · Le Vaste'},{num:47, ar:'الْحَكِيمُ', fr:'Al-Hakim · Le Sage'},{num:48, ar:'الْوَدُودُ', fr:"Al-Wadud · Le Plein d'Amour"},{num:49, ar:'الْمَجِيدُ', fr:'Al-Majid · Le Très Glorieux'},{num:50, ar:'الْبَاعِثُ', fr:"Al-Ba'ith · Le Ressuscitateur"},
  {num:51, ar:'الشَّهِيدُ', fr:'Ash-Shahid · Le Témoin'},{num:52, ar:'الْحَقُّ', fr:'Al-Haqq · La Vérité'},{num:53, ar:'الْوَكِيلُ', fr:'Al-Wakil · Le Garant'},{num:54, ar:'الْقَوِيُّ', fr:'Al-Qawi · Le Très Fort'},{num:55, ar:'الْمَتِينُ', fr:'Al-Matin · Le Ferme'},
  {num:56, ar:'الْوَلِيُّ', fr:'Al-Wali · Le Proche'},{num:57, ar:'الْحَمِيدُ', fr:'Al-Hamid · Le Digne de louanges'},{num:58, ar:'الْمُحْصِي', fr:'Al-Muhsi · Le Dénombrateur'},{num:59, ar:'الْمُبْدِئُ', fr:'Al-Mubdi · Le Principe'},{num:60, ar:'الْمُعِيدُ', fr:"Al-Mu'id · Celui qui restaure"},
  {num:61, ar:'الْمُحْيِي', fr:'Al-Muhyi · Le Vivificateur'},{num:62, ar:'الْمُمِيتُ', fr:'Al-Mumit · Le Donneur de mort'},{num:63, ar:'الْحَيُّ', fr:'Al-Hayy · Le Vivant'},{num:64, ar:'الْقَيُّومُ', fr:'Al-Qayyum · Le Subsistant'},{num:65, ar:'الْوَاجِدُ', fr:'Al-Wajid · Celui qui trouve'},
  {num:66, ar:'الْمَاجِدُ', fr:'Al-Majid · Le Glorieux'},{num:67, ar:'الْوَاحِدُ', fr:"Al-Wahid · L'Unique"},{num:68, ar:'الصَّمَدُ', fr:"As-Samad · L'Indépendant"},{num:69, ar:'الْقَادِرُ', fr:'Al-Qadir · Le Puissant'},{num:70, ar:'الْمُقْتَدِرُ', fr:'Al-Muqtadir · Le Très Puissant'},
  {num:71, ar:'الْمُقَدِّمُ', fr:'Al-Muqaddim · Celui qui avance'},{num:72, ar:'الْمُؤَخِّرُ', fr:"Al-Mu'akhkhir · Celui qui retarde"},{num:73, ar:'الأَوَّلُ', fr:'Al-Awwal · Le Premier'},{num:74, ar:'الآخِرُ', fr:'Al-Akhir · Le Dernier'},{num:75, ar:'الظَّاهِرُ', fr:"Az-Zahir · L'Apparent"},
  {num:76, ar:'الْبَاطِنُ', fr:'Al-Batin · Le Caché'},{num:77, ar:'الْوَالِي', fr:'Al-Wali · Le Gouverneur'},{num:78, ar:'الْمُتَعَالِي', fr:"Al-Muta'ali · Le Très Élevé"},{num:79, ar:'الْبَرُّ', fr:'Al-Barr · Le Bienfaisant'},{num:80, ar:'التَّوَّابُ', fr:'At-Tawwab · Le Grand Repentant'},
  {num:81, ar:'الْمُنْتَقِمُ', fr:'Al-Muntaqim · Celui qui punit'},{num:82, ar:'الْعَفُوُّ', fr:'Al-Afuww · Celui qui pardonne'},{num:83, ar:'الرَّؤُوفُ', fr:"Ar-Ra'uf · Le Très Compatissant"},{num:84, ar:'مَالِكُ الْمُلْكِ', fr:'Malik-ul-Mulk · Maître du Royaume'},{num:85, ar:'ذُو الْجَلَالِ', fr:'Dhu-l-Jalal · Maître de la Majesté'},
  {num:86, ar:'الْمُقْسِطُ', fr:'Al-Muqsit · L\'Équitable'},{num:87, ar:'الْجَامِعُ', fr:'Al-Jami · Le Rassembleur'},{num:88, ar:'الْغَنِيُّ', fr:'Al-Ghani · Le Riche'},{num:89, ar:'الْمُغْنِي', fr:'Al-Mughni · Celui qui enrichit'},{num:90, ar:'الْمَانِعُ', fr:"Al-Mani'u · Celui qui empêche"},
  {num:91, ar:'الضَّارُّ', fr:'Ad-Darr · Celui qui affecte'},{num:92, ar:'النَّافِعُ', fr:'An-Nafi · Le Bienfaiteur'},{num:93, ar:'النُّورُ', fr:'An-Nur · La Lumière'},{num:94, ar:'الْهَادِي', fr:'Al-Hadi · Le Guide'},{num:95, ar:'الْبَدِيعُ', fr:'Al-Badi · L\'Innovateur Absolu'},
  {num:96, ar:'الْبَاقِي', fr:"Al-Baqi · L'Éternel"},{num:97, ar:'الْوَارِثُ', fr:"Al-Warith · L'Héritier"},{num:98, ar:'الرَّشِيدُ', fr:'Ar-Rashid · Le Guide Juste'},{num:99, ar:'الصَّبُورُ', fr:'As-Sabur · Le Patient'},
];

const ASMA_MEDITATIONS = {
  1: { m:"Allah — Le Nom qui englobe tous les autres. Il est l'Unique digne d'adoration.", r:"Aujourd'hui, commence chaque action en Le nommant : Bismillah." },
  2: { m:"Ar-Rahman — Sa miséricorde s'étend à toutes Ses créatures, croyantes ou non.", r:"Pense à une personne difficile dans ta vie. Sa miséricorde la couvre aussi." },
  3: { m:"Ar-Rahim — Une miséricorde particulière réservée aux croyants.", r:"Tu as commis une erreur ? Il est Ar-Rahim — reviens à Lui sans honte." },
  31: { m:"Al-Latif — Le Subtil, le Doux. Il connaît les peines que tu ne dis pas.", r:"Parle-Lui de ce que tu ne peux dire à personne d'autre." },
  48: { m:"Al-Wadud — Le Plein d'Amour. Il t'aime même quand tu ne te sens pas aimée.", r:"Aujourd'hui, reçois cet amour sans le mériter — c'est Son cadeau." },
  99: { m:"As-Sabur — Le Patient. Il ne se précipite pas pour punir. Il attend.", r:"Sois patiente avec toi-même aujourd'hui — comme Il l'est avec toi." },
};

// ═══════════════════════════════════════════════
// CYCLE LOGIC
// ═══════════════════════════════════════════════
function computeCycle() {
  if (!ST.cycleStart) return;
  const today = new Date();
  const start = new Date(ST.cycleStart);
  const diff = Math.floor((today - start) / (1000*60*60*24));
  const dur = ST.cycleDuration || 28;
  const day = (diff % dur) + 1;
  ST.currentDay = Math.max(1, Math.min(day, dur));
  const ovulation = Math.round(dur / 2);
  const d = ST.currentDay;
  if (d <= 5) ST.currentSaison = 'hiver';
  else if (d <= ovulation - 2) ST.currentSaison = 'printemps';
  else if (d <= ovulation + 1) ST.currentSaison = 'ete';
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
  document.querySelectorAll('.dhikr-btn').forEach(b => b.style.background = s.color);
  const _sh = document.getElementById('sport-header');
  if (_sh) _sh.style.background = s.grad;
  const pav = document.getElementById('profilAv');
  if (pav) pav.style.background = s.grad;
  const psCycle = document.getElementById('psCycle');
  if (psCycle) psCycle.textContent = s.nom + ' ' + s.emoji + ' · Jour ' + ST.currentDay;
}

function populateAll() {
  const s = SAISONS[ST.currentSaison];
  if (!s) return;

  // ACCUEIL
  const ids = {'hero-name': ST.prenom, 'hero-phase-label': s.phase, 'hero-season-name': s.emoji + ' ' + s.nom, 'hero-day-num': 'J' + ST.currentDay, 'hero-big-emoji': s.emoji};
  Object.entries(ids).forEach(([id, val]) => { const el = document.getElementById(id); if (el) el.textContent = val; });
  if (s.invocation) {
    const ia = document.getElementById('inv-arabic'); if (ia) ia.textContent = s.invocation.arabic;
    const it = document.getElementById('inv-translation'); if (it) it.textContent = s.invocation.fr;
    const is = document.getElementById('inv-source'); if (is) is.textContent = s.invocation.source;
  }
  updateMessage();

  // Suggestions
  const suggRow = document.getElementById('suggestions-row');
  const suggTitle = document.getElementById('suggestions-title');
  const suggDesc = document.getElementById('suggestions-desc');
  if (suggTitle) suggTitle.textContent = s.suggTitle || '✦ Suggestions du jour';
  if (suggDesc) suggDesc.textContent = s.suggDesc || '';
  if (suggRow && s.suggestions) {
    const selSugg = ST.selectedSugg || [];
    suggRow.innerHTML = s.suggestions.map((sg, i) => {
      const isSel = selSugg.includes(i);
      const emoji = sg.split(' ')[0];
      const label = sg.slice(sg.indexOf(' ')+1);
      return '<div class="sugg-it' + (isSel?' sel':'') + '" onclick="toggleSuggestion(this,' + i + ')" data-idx="' + i + '">' +
        '<div class="sugg-chk" style="' + (isSel?'background:var(--season);border-color:var(--season);color:white;':'') + 'font-size:11px;font-weight:700;transition:all .2s;">' + (isSel?'✓':'') + '</div>' +
        '<span class="sugg-em">' + emoji + '</span><span class="sugg-lbl">' + label + '</span></div>';
    }).join('');
  }

  const _ft = document.getElementById('food-today'); if (_ft) _ft.textContent = s.alimentation?.today || s.foodTeaser || '';
  const _st2 = document.getElementById('skin-today'); if (_st2) _st2.textContent = s.skincare?.today || s.skinTeaser || '';

  // CYCLE
  const _chs = document.getElementById('cycle-header-sub');
  if (_chs) _chs.textContent = s.nom + ' · Jour ' + ST.currentDay + ' sur ' + ST.cycleDuration;
  const _cdn = document.getElementById('cycle-day-num'); if (_cdn) _cdn.textContent = ST.currentDay;
  const _csl = document.getElementById('cycle-season-label'); if (_csl) _csl.textContent = s.emoji + ' ' + s.nom;
  const remaining = ST.cycleDuration - ST.currentDay;
  const _cnu = document.getElementById('countdown-num'); if (_cnu) _cnu.textContent = remaining <= 0 ? '0' : remaining;
  const _clb = document.getElementById('countdown-label'); if (_clb) _clb.textContent = remaining <= 1 ? 'demain' : 'jours';
  const _cpn = document.getElementById('cycle-phase-name'); if (_cpn) _cpn.textContent = (s.phase||'').replace('Phase ','');
  const phaseMap = {hiver:'J1 → J5', printemps:'J6 → J13', ete:'J14 → J17', automne:'J18 → J'+ST.cycleDuration};
  const _cpd = document.getElementById('cycle-phase-days'); if (_cpd) _cpd.textContent = phaseMap[ST.currentSaison] || '';
  drawCycleRing();

  // ÂME
  showNomDuJour();
  updateAsmaCount();
  // Note prières en hiver (règles)
  const prayerSub = document.getElementById('prayers-hdr-sub');
  if (prayerSub) {
    if (ST.currentSaison === 'hiver') {
      prayerSub.textContent = '🤍 Pendant les règles, le dhikr te suffit — tu restes connectée à Allah.';
      prayerSub.style.color = '#7B5EA7';
      prayerSub.style.fontStyle = 'italic';
    } else {
      prayerSub.textContent = 'Coche au fur et à mesure de ta journée';
      prayerSub.style.color = '';
      prayerSub.style.fontStyle = '';
    }
  }

  // VIE — ALIMENTATION
  const alim = s.alimentation || {};
  const nutriments = alim.nutriments || [];
  const _ng = document.getElementById('nutriment-grid');
  if (_ng) _ng.innerHTML = nutriments.map(n =>
    '<div class="nutriment-chip"><div class="nutriment-name">' + (n.nom||'') + '</div><div class="nutriment-why">' + (n.why||'') + '</div></div>'
  ).join('');
  const _at = document.getElementById('aliment-tags');
  if (_at) _at.innerHTML = (alim.aliments||[]).map(a => {
    const isStar = (alim.star||[]).includes(a);
    return '<span class="aliment-tag' + (isStar?' star':'') + '">' + a + '</span>';
  }).join('');
  const _ae = document.getElementById('aliment-eviter');
  if (_ae) _ae.innerHTML = (alim.eviter||[]).map(e => '<span class="aliment-tag" style="border-color:#E8A090;color:#C4694A;">' + e + '</span>').join('');

  // VIE — SPORT
  const sp = s.sport || {};
  const seance = sp.seance || {};
  const _sn = document.getElementById('sport-name'); if (_sn) _sn.textContent = seance.name || '';
  const _sm = document.getElementById('sport-meta'); if (_sm) _sm.textContent = seance.meta || '';
  const exercices = seance.exercices || [];
  const _se = document.getElementById('sport-exercises');
  if (_se) _se.innerHTML = exercices.map(ex =>
    '<div class="sport-exercise"><div class="sport-ex-num">' + (ex.num||'') + '</div><div><div class="sport-ex-name">' + (ex.name||'') + '</div><div class="sport-ex-detail">' + (ex.detail||'') + '</div></div></div>'
  ).join('');
  const mouvements = sp.mouvements || [];
  const _smo = document.getElementById('sport-mouvements');
  if (_smo) {
    const today2 = new Date().toDateString();
    if (!ST.mouvDone) ST.mouvDone = {};
    if (!ST.mouvDone[today2]) ST.mouvDone[today2] = [];
    const done2 = ST.mouvDone[today2];
    _smo.innerHTML = mouvements.map((m, i) => {
      const isDone = done2.includes(i);
      return '<div onclick="toggleMouv(' + i + ',this)" style="display:flex;align-items:center;gap:12px;padding:11px 13px;border-radius:14px;border:1.5px solid ' + (isDone?'var(--season)':'var(--sable)') + ';background:' + (isDone?'var(--season-soft)':'white') + ';margin-bottom:7px;cursor:pointer;transition:all .2s;">' +
        '<div style="width:24px;height:24px;border-radius:50%;border:1.5px solid ' + (isDone?'var(--season)':'var(--sable)') + ';background:' + (isDone?'var(--season)':'transparent') + ';display:flex;align-items:center;justify-content:center;font-size:11px;color:white;flex-shrink:0;">' + (isDone?'✓':'') + '</div>' +
        '<span style="font-size:13px;color:var(--noir);font-weight:500;flex:1;">' + m + '</span></div>';
    }).join('');
    updateMouvProgress(mouvements.length);
  }

  // VIE — SKINCARE
  const sk2 = s.skincare || {};
  const _swh = document.getElementById('skin-what-happens'); if (_swh) _swh.textContent = sk2.whatHappens || '';
  const actifs = sk2.actifs || [];
  const _sac = document.getElementById('skin-actifs');
  if (_sac) _sac.innerHTML = actifs.map(a => typeof a === 'string' ? '<span class="aliment-tag">' + a + '</span>' :
    '<div class="actif-card"><div class="actif-name">' + (a.nom||'') + '</div><div class="actif-why">' + (a.why||'') + '</div><span class="actif-usage">' + (a.usage||'') + '</span></div>'
  ).join('');
  const _sge = document.getElementById('skin-gestes');
  if (_sge) _sge.innerHTML = (sk2.gestes||[]).map(g => '<span class="aliment-tag star">' + g + '</span>').join('');
  const _sev2 = document.getElementById('skin-eviter');
  if (_sev2) _sev2.innerHTML = (sk2.eviter||[]).map(e => '<span class="aliment-tag" style="border-color:#E8A090;color:#C4694A;">' + e + '</span>').join('');

  // MOI
  const _pnm = document.getElementById('profil-name'); if (_pnm) _pnm.textContent = ST.prenom || '';
  const _psb = document.getElementById('profil-sub'); if (_psb) _psb.textContent = s.nom + ' · Jour ' + ST.currentDay;

  // RESTORE ÉTATS
  restorePrayers();
  restoreDhikr();
  restoreGlaire();
  restoreSeanceDone();
  updateMouvProgress(mouvements.length);
  setTimeout(showInstallBanner, 1500);
  restoreFeedback();
  renderEnergyBars();
  if (ST.waitlistEmail) {
    const ei = document.getElementById('waitlist-email'); const wm = document.getElementById('waitlist-msg');
    if (ei) { ei.disabled = true; ei.placeholder = ST.waitlistEmail; }
    if (wm) { wm.style.color = '#3DAE8A'; wm.textContent = 'Alhamdulillah — tu seras la première informée ! 🌸'; }
  }
}

// ═══════════════════════════════════════════════
// ONBOARDING
// ═══════════════════════════════════════════════
let selectedDuration = 28;
function selectDuration(el, val) {
  document.querySelectorAll('#duration-options .ob-option').forEach(o => { o.classList.remove('selected'); const chk = o.querySelector('.ob-option-chk'); if (chk) { chk.style.background='transparent'; chk.style.borderColor='var(--sable)'; chk.style.color='transparent'; } });
  el.classList.add('selected');
  const chk = el.querySelector('.ob-option-chk');
  if (chk) { chk.style.background='var(--season)'; chk.style.borderColor='var(--season)'; chk.style.color='white'; }
  selectedDuration = val;
}

function checkDailyReset() {
  const today = new Date().toDateString();
  if (ST.lastDailyReset === today) return;
  ST.prayers = {};
  ST.dhikr = {subhan:0, alhamdu:0, akbar:0, istighfar:0};
  ST.dhikrDate = today;
  ST.seanceDone = {};
  ST.selectedSugg = [];
  ST.glaire = null;
  ST.glaireDate = null;
  ST.checkin = null;
  ST.checkinDate = null;
  ST.lastDailyReset = today;
  saveState();
}

function checkWeeklyReset() {
  const now = new Date();
  const day = now.getDay() || 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day - 1));
  const weekKey = monday.toISOString().split('T')[0];
  if (ST.lastWeeklyReset === weekKey) return;
  ST.mouvDone = {};
  ST.lastWeeklyReset = weekKey;
  saveState();
}

function initApp() {
  try { computeCycle(); } catch(e) {}
  try { applySaisonTheme(); } catch(e) {}
  try { populateAll(); } catch(e) { console.error('populateAll:', e); }
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
      else if (document.visibilityState === 'visible' && ST.prenom && ST.cycleStart) setTimeout(checkNotificationReturn, 500);
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
    const s0 = document.getElementById('step-0');
    const s1 = document.getElementById('step-1');
    if (s0) { s0.classList.remove('active'); s0.style.display = 'none'; }
    if (s1) { s1.classList.add('active'); s1.style.display = 'flex'; }
    window.scrollTo(0, 0);
  }
  else if (step === 2) {
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
    hiver: "Ton corps est en repos profond. C'est une semaine pour la douceur, le silence et la récupération. Sakina est là pour t'accompagner.",
    printemps: "L'énergie revient doucement. C'est le moment de commencer ce qui attend. Sakina est là pour t'accompagner.",
    ete: "Tu es à ton pic d'énergie. C'est le bon moment pour agir, te connecter, donner. Sakina est là pour t'accompagner.",
    automne: "Ton corps ralentit, tes émotions s'intensifient. C'est normal, c'est attendu. Sakina est là pour t'accompagner."
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
  if (ST.checkinDate !== today) {
    setTimeout(() => {
      const ov = document.getElementById('checkin-overlay');
      if (ov) { ov.style.display = 'flex'; ov.style.alignItems = 'flex-end'; }
    }, 600);
  }
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
  const appContent = document.getElementById('app-content');
  if (appContent) { appContent.scrollTop = 0; setTimeout(() => { appContent.scrollTop = 0; }, 50); }
}

function switchTabById(name, section) {
  document.querySelectorAll('.tab-page').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  const tabMap = {accueil:0, cycle:1, ame:2, vie:3, moi:4};
  const navItems = document.querySelectorAll('.nav-item');
  if (navItems[tabMap[name]]) navItems[tabMap[name]].classList.add('active');
  const _ac2 = document.getElementById('app-content');
  if (_ac2) { _ac2.scrollTop = 0; }
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
  el.classList.add('active'); el.style.background='var(--season)'; el.style.color='white'; el.style.borderColor='var(--season)';
  document.getElementById('vie-' + section).classList.add('active');
}

function toggleSuggestion(el, idx) {
  if (!ST.selectedSugg) ST.selectedSugg = [];
  const i = ST.selectedSugg.indexOf(idx);
  if (i > -1) ST.selectedSugg.splice(i, 1);
  else ST.selectedSugg.push(idx);
  saveState();
  const isSel = ST.selectedSugg.includes(idx);
  el.style.background = isSel ? 'var(--season-soft)' : 'transparent';
  el.style.borderColor = isSel ? 'var(--season)' : 'transparent';
  const chk = el.querySelector('.sugg-chk');
  if (chk) { chk.style.background=isSel?'var(--season)':'transparent'; chk.style.borderColor=isSel?'var(--season)':'var(--sable)'; chk.textContent=isSel?'✓':''; chk.style.color=isSel?'white':'transparent'; }
}

// ═══════════════════════════════════════════════
// PRAYERS
// ═══════════════════════════════════════════════
function togglePrayer(el, name) {
  const today = new Date().toDateString();
  if (!ST.prayers[today]) ST.prayers[today] = {};
  ST.prayers[today][name] = !ST.prayers[today][name];
  updatePrayerProgress(); saveState();
}
function updatePrayerProgress() {
  const today = new Date().toDateString();
  const names = ['fajr','dohr','asr','maghrib','isha'];
  const prayers = ST.prayers[today] || {};
  const done = names.filter(n => prayers[n]).length;
  if (done === 5) setTimeout(() => showPrayerCelebration(), 300);
  const pf = document.getElementById('prayer-progress'); const pl = document.getElementById('prayer-prog-lbl');
  if (pf) pf.style.width = (done/5*100) + '%';
  if (pl) pl.textContent = done + ' / 5';
  names.forEach(n => {
    const chk = document.getElementById('pr-' + n); const nm = document.getElementById('prn-' + n);
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
  div.innerHTML = '<div style="font-size:22px;margin-bottom:6px">🤲</div><div style="font-size:16px;direction:rtl;color:var(--season);margin-bottom:4px">مَاشَاءَ اللَّهُ</div><div style="font-family:var(--serif);font-size:13px;font-style:italic;color:var(--noir);line-height:1.6">Masha\'Allah — les 5 prières accomplies. Que Allah accepte tes adorations. 🌸</div>';
  card.insertAdjacentElement('afterend', div);
  setTimeout(() => { if(div.parentNode) div.parentNode.removeChild(div); }, 5000);
}

// ═══════════════════════════════════════════════
// DHIKR
// ═══════════════════════════════════════════════
function incrementDhikr(key, max) {
  const today = new Date().toDateString();
  if (ST.dhikrDate !== today) { ST.dhikr = {subhan:0, alhamdu:0, akbar:0, istighfar:0}; ST.dhikrDate = today; }
  if (!ST.dhikr) ST.dhikr = {subhan:0, alhamdu:0, akbar:0, istighfar:0};
  if ((ST.dhikr[key]||0) < max) { ST.dhikr[key]++; saveState(); updateDhikrUI(); }
}
function updateDhikrUI() {
  const maxes = {subhan:33, alhamdu:33, akbar:34, istighfar:100};
  ['subhan','alhamdu','akbar','istighfar'].forEach(k => {
    const cnt = (ST.dhikr && ST.dhikr[k]) || 0;
    const max = maxes[k]; const done = cnt >= max;
    const countEl = document.getElementById('dhikr-' + k);
    const ringEl = document.getElementById('dhikr-ring-' + k);
    const itemEl = document.getElementById('dhikr-item-' + k);
    if (countEl) countEl.textContent = cnt;
    if (ringEl) { ringEl.className = 'dhikr-ring' + (done?' done':''); ringEl.style.background=done?'var(--season)':'transparent'; ringEl.style.borderColor=done?'var(--season)':'var(--sable)'; ringEl.style.color=done?'white':'var(--noir)'; }
    if (itemEl) itemEl.className = 'dhikr-item' + (done?' done':'');
  });
}
function restoreDhikr() {
  const today = new Date().toDateString();
  if (ST.dhikrDate !== today) ST.dhikr = {subhan:0, alhamdu:0, akbar:0, istighfar:0};
  updateDhikrUI();
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
  const total = document.getElementById('sport-mouvements').children.length;
  updateMouvProgress(total);
  if (done.length === total && total > 0) setTimeout(() => showToast('🌿 Alhamdulillah — tous les mouvements de la semaine ! 🌸'), 200);
}
function updateMouvProgress(total) {
  const today = new Date().toDateString();
  const done = (ST.mouvDone && ST.mouvDone[today]) ? ST.mouvDone[today].length : 0;
  const pct = total > 0 ? Math.round(done/total*100) : 0;
  const lbl = document.getElementById('mouv-progress-label'); const pctEl = document.getElementById('mouv-progress-pct'); const fill = document.getElementById('mouv-progress-fill');
  if (lbl) lbl.textContent = done + ' / ' + total + ' pratiqués';
  if (pctEl) pctEl.textContent = pct + '%';
  if (fill) fill.style.width = pct + '%';
}
const SPORT_MSGS = {hiver:"Alhamdulillah — tu as pris soin de ton corps pendant l'Hiver. C'est un acte d'amour.",printemps:"Alhamdulillah — ton corps t'a portée. Il méritait ce soin.",ete:"Alhamdulillah — tu as honoré ce pic d'énergie. Barak Allahou fik.",automne:"Alhamdulillah — malgré la lourdeur de l'Automne, tu as bougé. C'est de la force."};
function validerSeance() {
  const today = new Date().toDateString();
  ST.seanceDone = ST.seanceDone || {}; ST.seanceDone[today] = true; saveState(); afficherSeanceDone();
}
function afficherSeanceDone() {
  const btn = document.getElementById('sport-validate-btn'); const done = document.getElementById('sport-done-state'); const msg = document.getElementById('sport-done-msg');
  if (btn) btn.style.display = 'none'; if (done) done.style.display = 'block';
  if (msg) msg.textContent = SPORT_MSGS[ST.currentSaison] || SPORT_MSGS.hiver;
}
function restoreSeanceDone() {
  const today = new Date().toDateString();
  if (ST.seanceDone && ST.seanceDone[today]) afficherSeanceDone();
  else { const btn = document.getElementById('sport-validate-btn'); const done = document.getElementById('sport-done-state'); if (btn) btn.style.display='block'; if (done) done.style.display='none'; }
}

// ═══════════════════════════════════════════════
// GLAIRE CERVICALE
// ═══════════════════════════════════════════════
function selectGlaire(el, type) {
  document.querySelectorAll('.glaire-option').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
  ST.glaire = type; ST.glaireDate = new Date().toDateString(); saveState();
  // Mettre à jour le label résumé et refermer
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
  const isOpen = content.style.display !== 'none';
  content.style.display = isOpen ? 'none' : 'block';
  if (arrow) arrow.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
}
function toggleIntimite() {
  const content = document.getElementById('intimite-content');
  const arrow = document.getElementById('intimite-arrow');
  const isOpen = content.style.display !== 'none';
  content.style.display = isOpen ? 'none' : 'block';
  if (arrow) arrow.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
}
function renderEnergyBars() {
  const el = document.getElementById('energy-bars-moi');
  if (!el) return;
  const day = ST.currentDay || 1;
  const dur = ST.cycleDuration || 28;
  const colors = {hiver:'#7B5EA7',printemps:'#3DAE8A',ete:'#E8834A',automne:'#C4694A'};
  const energyBase = {hiver:25,printemps:70,ete:95,automne:50};
  let html = '';
  for (let i = 1; i <= 28; i++) {
    const ratio = i / dur;
    let phase = 'automne';
    if (ratio <= 0.18) phase = 'hiver';
    else if (ratio <= 0.5) phase = 'printemps';
    else if (ratio <= 0.64) phase = 'ete';
    const h = Math.max(8, Math.min(100, energyBase[phase] + Math.sin(i*1.3)*10));
    const isToday = i === day;
    const opacity = i > day ? '0.2' : '0.55';
    const ring = isToday ? `box-shadow:0 0 0 2px var(--season);` : '';
    html += `<div style="flex:1;border-radius:3px 3px 0 0;background:${colors[phase]};height:${h}%;opacity:${isToday?'1':opacity};${ring}min-height:4px;"></div>`;
  }
  el.innerHTML = html;
}
function restoreGlaire() {
  const today = new Date().toDateString();
  if (ST.glaireDate === today && ST.glaire) {
    document.querySelectorAll('.glaire-option').forEach(o => {
      if ((o.getAttribute('onclick')||'').includes("'" + ST.glaire + "'")) o.classList.add('selected');
    });
  }
}

// ═══════════════════════════════════════════════
// CYCLE RING
// ═══════════════════════════════════════════════
function drawCycleRing() {
  const cx=100, cy=100, r=82;
  const dur = ST.cycleDuration || 28; const day = ST.currentDay || 1;
  const phases = [{id:'seg-hiver',start:1,end:5,color:'#7B5EA7'},{id:'seg-printemps',start:6,end:13,color:'#3DAE8A'},{id:'seg-ete',start:14,end:17,color:'#E8834A'},{id:'seg-automne',start:18,end:dur,color:'#C4694A'}];
  function polarToCart(angle) { const rad=(angle-90)*Math.PI/180; return {x:cx+r*Math.cos(rad),y:cy+r*Math.sin(rad)}; }
  function dayToAngle(d) { return ((d-1)/dur)*360; }
  function arcPath(s2,e2) { const a1=dayToAngle(s2),a2=dayToAngle(e2+1); const p1=polarToCart(a1),p2=polarToCart(a2); const large=(a2-a1)>180?1:0; return 'M '+p1.x+' '+p1.y+' A '+r+' '+r+' 0 '+large+' 1 '+p2.x+' '+p2.y; }
  phases.forEach(ph => {
    const el = document.getElementById(ph.id); if (!el) return;
    const end = Math.min(ph.end, dur);
    if (ph.start > dur) { el.setAttribute('d',''); return; }
    el.setAttribute('d', arcPath(ph.start, end)); el.setAttribute('stroke', ph.color);
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
  const ar = document.getElementById('asma-day-arabic'); const fr = document.getElementById('asma-day-fr');
  const meaning = document.getElementById('asma-day-meaning'); const reflection = document.getElementById('asma-day-reflection');
  if (ar) ar.textContent = nom.ar;
  if (fr) fr.textContent = nom.fr;
  const med = ASMA_MEDITATIONS[nom.num];
  if (meaning) meaning.textContent = med ? med.m : nom.fr + " — un des plus beaux noms d'Allah. Médite sur ce nom aujourd'hui.";
  if (reflection) reflection.textContent = med ? med.r : "Répète ce nom dans ton cœur. Laisse-le guider ta journée.";
}
function buildAsmaGrid() {
  const grid = document.getElementById('asma-list'); if (!grid) return;
  grid.innerHTML = ASMA.map(a => {
    const known = ST.asmaKnown.includes(a.num);
    return '<div class="asma-item" onclick="toggleAsma(' + a.num + ',this)"><div class="asma-chk' + (known?' done':'') + '" style="' + (known?'background:var(--season);border-color:var(--season);color:white':'') + '">' + (known?'✓':'') + '</div><div style="flex:1"><div class="asma-ar">' + a.ar + '</div><div class="asma-fr">' + a.fr + '</div></div></div>';
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
  const count = ST.asmaKnown.length; const pct = (count/99*100)+'%';
  const countEl=document.getElementById('asma-count'); const progEl=document.getElementById('asma-progress');
  const mCount=document.getElementById('asma-modal-count'); const mProg=document.getElementById('asma-modal-progress');
  if (countEl) countEl.textContent=count; if (progEl) progEl.style.width=pct;
  if (mCount) mCount.textContent=count; if (mProg) mProg.style.width=pct;
}
function openAsmaModal() {
  buildAsmaGrid();
  document.getElementById('asma-modal').classList.add('open');
  setTimeout(() => {
    const dayOfYear=Math.floor((new Date()-new Date(new Date().getFullYear(),0,0))/86400000);
    const nomIdx=(dayOfYear-1)%99;
    const list=document.getElementById('asma-list'); if (!list) return;
    const items=list.querySelectorAll('.asma-item');
    if (items[nomIdx]) {
      items[nomIdx].style.background='var(--season-soft)'; items[nomIdx].style.borderLeft='3px solid var(--season)';
      items[nomIdx].scrollIntoView({behavior:'smooth',block:'center'});
    }
  }, 150);
}
function closeAsmaModal() { document.getElementById('asma-modal').classList.remove('open'); }

// ═══════════════════════════════════════════════
// CHECK-IN SOIR
// ═══════════════════════════════════════════════
const EVENING_RESPONSES = {
  bien:{emoji:'🌟',hiver:"Alhamdulillah pour cette belle journée en Hiver. Dors en paix, ton corps se prépare à se renouveler.",printemps:"Alhamdulillah ! Le Printemps te porte bien. Repose-toi pour que demain soit encore plus beau.",ete:"Alhamdulillah — tu as rayonné aujourd'hui. Ce que tu as donné, Allah le voit.",automne:"Alhamdulillah pour ce bon jour en Automne. Profite de ce repos bien mérité."},
  fatiguee:{emoji:'🌙',hiver:"L'Hiver demande tout. Tu as fait ce que tu as pu — c'est suffisant. Dors et laisse ton corps faire le reste.",printemps:"La fatigue en Printemps mérite attention. Ton corps te parle — écoute-le ce soir.",ete:"Même en été, le corps a ses limites. Tu as donné aujourd'hui — repose-toi sans culpabilité.",automne:"L'Automne fatigue plus profondément. Dors tôt ce soir. Demain est un nouveau jour."},
  difficile:{emoji:'🤲',hiver:"Les jours difficiles en Hiver sont les plus durs. Mais ils passent — comme l'Hiver passe toujours.",printemps:"Même quand tout devrait aller mieux, il y a des jours lourds. C'est humain. Tu n'es pas seule.",ete:"Même au sommet de l'élan, des jours difficiles arrivent. Allah est avec toi dans chaque saison.",automne:"L'Automne amplifie la difficulté. Ce que tu ressens est réel — et passager. Tiens bon."},
  calme:{emoji:'🍃',hiver:"Une journée calme en Hiver, c'est déjà beaucoup. Le silence a sa valeur. Repose-toi.",printemps:"Les journées tranquilles construisent aussi. Demain l'élan reviendra.",ete:"Même en été, une journée douce est un cadeau. Allah gère ce que tu ne vois pas.",automne:"Le calme en Automne est une sagesse. Ton corps sait ce dont il a besoin."}
};
function showEveningCheckin() {
  document.getElementById('evening-questions').style.display='block'; document.getElementById('evening-response').style.display='none';
  const evOv=document.getElementById('evening-checkin-overlay');
  if (evOv) { evOv.style.display='flex'; evOv.style.alignItems='flex-end'; }
}
function doEveningCheckin(mood) {
  const r=EVENING_RESPONSES[mood]; if (!r) { closeEveningCheckin(); return; }
  const msg=r[ST.currentSaison]||r.automne;
  document.getElementById('evening-resp-emoji').textContent=r.emoji;
  document.getElementById('evening-resp-msg').textContent=msg;
  document.getElementById('evening-questions').style.display='none'; document.getElementById('evening-response').style.display='block';
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
  document.querySelectorAll('#notif-freq-options .ob-option').forEach(o => { o.classList.remove('selected'); const chk=o.querySelector('.ob-option-chk'); if(chk){chk.style.background='transparent';chk.style.borderColor='var(--sable)';chk.style.color='transparent';} });
  el.classList.add('selected');
  const chk=el.querySelector('.ob-option-chk'); if(chk){chk.style.background='var(--season)';chk.style.borderColor='var(--season)';chk.style.color='white';}
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
    else { const s=document.getElementById('notif-permission-status'); if(s){s.innerHTML='❌ Permission refusée.';s.style.color='#C4694A';} }
  }).catch(() => { showToast("📱 Ouvre l'app depuis l'écran d'accueil."); closeNotifModal(); });
}

// ═══════════════════════════════════════════════
// PREMIUM / WAITLIST
// ═══════════════════════════════════════════════
async function joinWaitlist() {
  const emailInput=document.getElementById('waitlist-email'); const btn=document.querySelector('[onclick="joinWaitlist()"]');
  const msg=document.getElementById('waitlist-msg'); const email=emailInput.value.trim();
  if (!email||!email.includes('@')) { msg.style.color='#C4694A'; msg.textContent='Entre une adresse email valide 🌸'; return; }
  btn.disabled=true; btn.textContent='…'; msg.style.color='#8A7870'; msg.textContent='Envoi en cours…';
  try {
    const res=await fetch('https://formspree.io/f/xojpknkq',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({email,saison:ST.currentSaison,jour:ST.currentDay})});
    if (res.ok) { ST.waitlistEmail=email; saveState(); msg.style.color='#3DAE8A'; msg.textContent='Alhamdulillah — tu seras la première informée ! 🌸'; emailInput.value=''; emailInput.disabled=true; btn.textContent='✓'; btn.style.background='#3DAE8A'; }
    else throw new Error();
  } catch(e) { msg.style.color='#C4694A'; msg.textContent="Une erreur est survenue. Réessaie dans un instant."; btn.disabled=false; btn.textContent='Rejoindre ✦'; }
}
function goToPremium() {
  document.querySelectorAll('.tab-page').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  document.getElementById('tab-moi').classList.add('active');
  const navMoi=document.getElementById('nav-moi'); if(navMoi) navMoi.classList.add('active');
  setTimeout(() => { const w=document.getElementById('waitlist-email'); if(w) w.scrollIntoView({behavior:'smooth',block:'center'}); }, 200);
}

// ═══════════════════════════════════════════════
// FEEDBACK
// ═══════════════════════════════════════════════
let selectedRating=0;
const RATING_LABELS={1:"Pas encore convaincue…",2:"Des choses à améliorer",3:"Bien, mais peut mieux faire",4:"Je l'aime bien !",5:"Je l'adore ! 🌸"};
function setRating(val) {
  selectedRating=val; const label=document.getElementById('rating-label'); if(label) label.textContent=RATING_LABELS[val]||'';
  document.querySelectorAll('#rating-stars > div').forEach((star,i) => { const isSel=i+1<=val; star.style.background=isSel?'var(--season-soft)':'white'; star.style.borderColor=isSel?'var(--season)':'var(--sable)'; star.style.transform=isSel?'scale(1.08)':'scale(1)'; });
}
function toggleChip(el) {
  const isSel=el.dataset.selected==='true'; el.dataset.selected=isSel?'false':'true';
  el.style.background=isSel?'white':'var(--season-soft)'; el.style.borderColor=isSel?'var(--sable)':'var(--season)'; el.style.color=isSel?'var(--gris)':'var(--season)'; el.style.fontWeight=isSel?'400':'600';
}
async function sendFeedback() {
  const msg=document.getElementById('feedback-msg'); const text=document.getElementById('feedback-text').value.trim(); const email=document.getElementById('feedback-email').value.trim();
  if (!selectedRating) { msg.style.color='#C4694A'; msg.textContent="Sélectionne une note en premier 🌸"; return; }
  const likes=[]; document.querySelectorAll('#likes-chips > div[data-selected="true"]').forEach(c=>likes.push(c.textContent.trim()));
  const btn=document.querySelector('[onclick="sendFeedback()"]'); if(btn){btn.disabled=true;btn.textContent='Envoi…';}
  try {
    const res=await fetch('https://formspree.io/f/xojpknkq',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({type:'FEEDBACK_BETA',note:selectedRating+'/5',jaime:likes.join(', ')||'Non renseigné',ameliorer:text||'Non renseigné',email:email||'Non renseigné',saison:ST.currentSaison,prenom:ST.prenom})});
    if (res.ok) { ST.feedbackSent=true; saveState(); document.getElementById('feedback-form-wrap').style.display='none'; document.getElementById('feedback-sent-wrap').style.display='block'; }
    else throw new Error();
  } catch(e) { if(btn){btn.disabled=false;btn.textContent='Envoyer mon avis ✦';} msg.style.color='#C4694A'; msg.textContent='Une erreur est survenue. Réessaie dans un instant.'; }
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
function resetApp() {
  if (confirm('Réinitialiser SakinApp ? Toutes tes données seront effacées.')) { localStorage.removeItem('sakinapp_v1'); location.reload(); }
}

// Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(()=>{}); });
}
