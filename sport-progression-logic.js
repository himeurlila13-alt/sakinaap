// ═══════════════════════════════════════════════════════════════
// SPORT PROGRESSION LOGIC — À intégrer dans app.js
// Gère la suggestion de montée/descente de niveau selon :
//   - le ressenti du matin (ST.checkin)
//   - la phase du cycle (ST.currentSaison)
//   - le nombre de séances validées (ST.totalSeancesAll)
//   - les séances consécutives à ce niveau (ST.niveauStreak)
// ═══════════════════════════════════════════════════════════════

// ── Règles de progression ─────────────────────────────────────
// Basées sur James Clear (Atomic Habits) + données scientifiques
const PROGRESSION_RULES = {
  // Monter de niveau si :
  monter: {
    hiver:     { streakMin: 9,  message: 'Tu maîtrises ce niveau en Hiver. Prête pour le suivant ?' },
    printemps: { streakMin: 9,  message: 'Ton Printemps est solide. Le niveau suivant t\'attend !' },
    ete:       { streakMin: 6,  message: 'Tu es au pic de ta forme. Ose le niveau supérieur ☀️' },
    automne:   { streakMin: 12, message: 'Constance remarquable en Automne. Tu peux monter doucement.' },
  },
  // Descendre si :
  descendre: {
    hiver:     { message: 'Écoute ton corps en Hiver. Un niveau en dessous est une vraie sagesse. 💜' },
    printemps: { message: 'Pas d\'inquiétude — descendre n\'efface pas les progrès. Tu remontes bientôt.' },
    ete:       { message: 'Même en Été, ton corps a ses limites. Respect ✨' },
    automne:   { message: 'L\'Automne demande de la douceur. N-1, c\'est le bon choix aujourd\'hui. 🍂' },
  },
};

// ── Adaptation au ressenti + phase ───────────────────────────
function getSuggestedLevel(currentLevel, phase, checkin) {
  const saison = phase || ST.currentSaison;
  const lv = currentLevel || ST.seanceLevel || 1;

  // Règle 1 : Fatiguée en Automne → propose N-1
  if (checkin === 'fatiguee' && saison === 'automne' && lv > 1) {
    return {
      level: lv - 1,
      type: 'down',
      message: PROGRESSION_RULES.descendre.automne.message,
      toast: `💛 Séance N${lv - 1} suggérée — écoute ton corps aujourd'hui.`,
    };
  }

  // Règle 2 : Fatiguée en Hiver → reste N1, message de soutien
  if (checkin === 'fatiguee' && saison === 'hiver') {
    return {
      level: 1,
      type: 'stay',
      message: 'Certains jours, juste s\'étirer est assez. Ton corps sait ce dont il a besoin.',
      toast: null,
    };
  }

  // Règle 3 : Bien en Été + N<4 → propose N+1 optionnel
  if (checkin === 'bien' && saison === 'ete' && lv < 4) {
    return {
      level: lv,
      type: 'up_optional',
      message: PROGRESSION_RULES.monter.ete.message,
      toast: `☀️ Tu rayonnes — envie du niveau ${lv + 1} aujourd'hui ?`,
      optionalLevel: lv + 1,
    };
  }

  // Règle 4 : Bien en Printemps → énergie normale
  if (checkin === 'bien' && saison === 'printemps') {
    return { level: lv, type: 'stay', message: null, toast: null };
  }

  return { level: lv, type: 'stay', message: null, toast: null };
}

// ── Vérification de progression de niveau ────────────────────
// À appeler après validerSeanceDash() — vérifie si passage au niveau suivant
function checkNiveauProgression() {
  const lv = ST.seanceLevel || 1;
  if (lv >= 4) return; // déjà au max

  const saison = ST.currentSaison;
  const streak = ST.niveauStreak || 0;
  const rule = PROGRESSION_RULES.monter[saison];

  if (!rule) return;

  if (streak >= rule.streakMin) {
    // Propose le passage au niveau suivant
    showNiveauProgressionModal(lv, lv + 1, rule.message);
  }
}

// ── Affichage modal proposition de progression ───────────────
// Nécessite un élément #progression-modal dans index.html (existant)
function showNiveauProgressionModal(fromLevel, toLevel, message) {
  const el = document.getElementById('progression-modal');
  if (!el) return;
  const bodyEl = el.querySelector('.progression-body') || el;
  bodyEl.innerHTML = `
    <div class="progression-msg">${message}</div>
    <div class="progression-actions">
      <button class="progression-btn-yes" onclick="handleProgressionAnswer('facile')">
        Oui, je monte au N${toLevel} 🔥
      </button>
      <button class="progression-btn-no" onclick="handleProgressionAnswer('parfait')">
        Je reste au N${fromLevel} pour l'instant
      </button>
    </div>`;
  el.classList.add('open');
}

// ── Mise à jour du streak de niveau ──────────────────────────
// À appeler dans validerSeanceDash() après incrémentation totalSeancesAll
function updateNiveauStreak(validated) {
  if (!validated) {
    ST.niveauStreak = 0;
    return;
  }
  // Réinitialise si changement de niveau ou de phase
  if (ST._lastNiveauStreak !== ST.seanceLevel || ST._lastNiveauPhase !== ST.currentSaison) {
    ST.niveauStreak = 0;
    ST._lastNiveauStreak = ST.seanceLevel;
    ST._lastNiveauPhase = ST.currentSaison;
  }
  ST.niveauStreak = (ST.niveauStreak || 0) + 1;
}

// ── Intégration dans renderCarteBouger ───────────────────────
// Remplace ou complète le rendu de la carte avec les données enrichies
function getSeanceEnrichie(phase, niveau) {
  if (typeof SEANCES_ENRICHIES === 'undefined') return null;
  const seances = SEANCES_ENRICHIES[phase] || [];
  // Priorité : même objectif que le check-in si possible
  return seances.find(s => s.niveau === niveau) || null;
}

// ── Code de fusion à ajouter dans app.js ─────────────────────
// Dans renderCarteBouger, case 'hiver' et 'printemps-bas', etc. :
//
// const enrichie = getSeanceEnrichie(ST.currentSaison, ST.seanceLevel || 1);
// if (enrichie && enrichie.echauffement) {
//   exContent = _renderEchauffement(enrichie.echauffement)
//             + exContent
//             + _renderRetourCalme(enrichie.retour_au_calme);
//   if (enrichie.message_fin) spirituelHtml = enrichie.message_fin;
// }
//
// function _renderEchauffement(items) {
//   return `<div class="sport-echauffement">
//     <div class="sport-section-label">🔥 Échauffement</div>
//     ${items.map(e => `<div class="sport-ex-item">
//       <span class="sport-ex-name">${e.exercice}</span>
//       <span class="sport-ex-dur">${e.duree}</span>
//       <div class="sport-ex-detail">${e.description}</div>
//     </div>`).join('')}
//   </div>`;
// }
//
// function _renderRetourCalme(items) {
//   return `<div class="sport-retour-calme">
//     <div class="sport-section-label">🌿 Retour au calme</div>
//     ${items.map(e => `<div class="sport-ex-item">
//       <span class="sport-ex-name">${e.exercice}</span>
//       <span class="sport-ex-dur">${e.duree}</span>
//       <div class="sport-ex-detail">${e.description}</div>
//     </div>`).join('')}
//   </div>`;
// }
