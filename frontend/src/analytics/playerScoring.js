// Player Performance Scoring System
// Calculates composite scores from Wyscout match stats

const POSITIONAL_WEIGHTS = {
  FW: { progressive: 0.2, defensive: 0.05, goalContribution: 0.5, passing: 0.1, duel: 0.15 },
  MD: { progressive: 0.25, defensive: 0.2, goalContribution: 0.15, passing: 0.3, duel: 0.1 },
  DF: { progressive: 0.15, defensive: 0.5, goalContribution: 0.05, passing: 0.15, duel: 0.15 },
  GK: { progressive: 0.05, defensive: 0.6, goalContribution: 0.0, passing: 0.35, duel: 0.0 },
  DEFAULT: { progressive: 0.2, defensive: 0.2, goalContribution: 0.2, passing: 0.2, duel: 0.2 }
};

function getRoleCategory(roleCode, posCode = '') {
  if (roleCode) {
    const r = roleCode.toUpperCase();
    if (r === 'FW' || r === 'MD' || r === 'DF' || r === 'GK') return r;
  }
  const p = posCode.toLowerCase();
  if (p.includes('fw') || p.includes('cf') || p.includes('st') || p.includes('ss') || p.includes('w')) return 'FW';
  if (p.includes('mf') || p.includes('dm') || p.includes('am')) return 'MD';
  if (p.includes('b') && !p.includes('wb')) return 'DF'; 
  if (p.includes('wb')) return 'MD'; 
  if (p.includes('gk')) return 'GK';
  return 'DEFAULT';
}

export function calcProgressiveScore(stats) {
  return (
    (stats.progressivePasses || 0) * 2 +
    (stats.successfulProgressivePasses || 0) * 4 + 
    (stats.progressiveRun || 0) * 4 +
    (stats.successfulPassesToFinalThird || 0) * 2 +
    (stats.successfulThroughPasses || 0) * 4 +
    (stats.successfulSmartPasses || 0) * 3 +
    (stats.successfulForwardPasses || 0) * 1
  );
}

export function calcDefensiveScore(stats) {
  return (
    (stats.interceptions || 0) * 3 +
    (stats.recoveries || 0) * 2 +
    (stats.defensiveDuelsWon || 0) * 3 +
    (stats.counterpressingRecoveries || 0) * 4 +
    (stats.successfulSlidingTackles || 0) * 3 +
    (stats.clearances || 0) * 1.5 +
    (stats.aerialDuelsWon || 0) * 2 +
    (stats.opponentHalfRecoveries || 0) * 3 +
    (stats.dangerousOpponentHalfRecoveries || 0) * 5 +
    (stats.shotsBlocked || 0) * 3 +
    // Goalkeeper specific matching exact schema
    (stats.gkSaves || 0) * 8 +
    (stats.xgSave || 0) * 15 + // xgSave acts as prevented goals
    (stats.gkSuccessfulExits || 0) * 5 +
    (stats.gkAerialDuelsWon || 0) * 4 +
    (stats.gkCleanSheets || 0) * 10 -
    (stats.gkConcededGoals || 0) * 5
  );
}

export function calcGoalContributionScore(stats) {
  return (
    (stats.goals || 0) * 20 +
    (stats.assists || 0) * 12 +
    (stats.xgShot || 0) * 8 +
    (stats.xgAssist || 0) * 6 +
    (stats.successfulKeyPasses || 0) * 5 +
    (stats.shotAssists || 0) * 3 +
    (stats.shotOnTargetAssists || 0) * 4 +
    (stats.shotsOnTarget || 0) * 3 +
    (stats.secondAssists || 0) * 5 +
    (stats.thirdAssists || 0) * 2 +
    (stats.touchInBox || 0) * 2
  );
}

export function calcPassingScore(stats) {
  const passAcc = stats.passes > 0 ? (stats.successfulPasses || 0) / stats.passes : 0;
  return (
    passAcc * 20 +
    (stats.successfulCrosses || 0) * 3 +
    (stats.successfulLongPasses || 0) * 2 +
    (stats.successfulVerticalPasses || 0) * 1 +
    (stats.successfulLinkupPlays || 0) * 3
  );
}

export function calcDuelScore(stats) {
  return (
    (stats.offensiveDuelsWon || 0) * 2 +
    (stats.successfulDribbles || 0) * 3 +
    (stats.pressingDuelsWon || 0) * 2 +
    (stats.looseBallDuelsWon || 0) * 2 +
    (stats.foulsSuffered || 0) * 1 +
    (stats.accelerations || 0) * 1
  );
}

export function calcCompositeScore(stats, roleCode = '', posCode = '') {
  const prog = calcProgressiveScore(stats);
  const def = calcDefensiveScore(stats);
  const goal = calcGoalContributionScore(stats);
  const pass = calcPassingScore(stats);
  const duel = calcDuelScore(stats);

  const role = getRoleCategory(roleCode, posCode);
  const w = POSITIONAL_WEIGHTS[role] || POSITIONAL_WEIGHTS.DEFAULT;

  return {
    progressive: prog,
    defensive: def,
    goalContribution: goal,
    passing: pass,
    duel: duel,
    composite: (
      prog * w.progressive +
      def * w.defensive +
      goal * w.goalContribution +
      pass * w.passing +
      duel * w.duel
    ),
  };
}

export function calcPlayerScores(playerStats) {
  const scored = [];
  for (const ps of Object.values(playerStats)) {
    if (ps.minutesPlayed < 90) continue; // Skip players with very few minutes
    
    const perMatch = calcCompositeScore(ps.totals, ps.roleCode);
    const per90 = {};
    const factor = ps.minutesPlayed > 0 ? 90 / ps.minutesPlayed : 0;
    for (const [k, v] of Object.entries(perMatch)) {
      per90[k] = v * factor;
    }

    // Per-match breakdown
    const matchScores = ps.matchStats.map(ms => ({
      matchIdx: ms.matchIdx,
      ...calcCompositeScore(ms.stats, ps.roleCode),
    }));

    scored.push({
      ...ps,
      scores: perMatch,
      per90Scores: per90,
      matchScores,
    });
  }

  // Normalize composite to 0-100 scale
  const maxComposite = Math.max(...scored.map(s => s.per90Scores.composite), 1);
  for (const s of scored) {
    const baseRating = (s.per90Scores.composite / maxComposite) * 100;
    // Apply reliability penalty for players with fewer than 450 minutes (5 full matches)
    const reliability = 0.7 + 0.3 * Math.min(1, s.minutesPlayed / 450);
    s.rating = Math.round(baseRating * reliability);
  }

  scored.sort((a, b) => b.rating - a.rating);
  return scored;
}

export function getRadarData(player, allScored) {
  // Get max values for normalization
  const maxes = { progressive: 1, defensive: 1, goalContribution: 1, passing: 1, duel: 1 };
  for (const s of allScored) {
    for (const k of Object.keys(maxes)) {
      maxes[k] = Math.max(maxes[k], s.per90Scores[k] || 0);
    }
  }

  // Average across all scored players
  const avgValues = { progressive: 0, defensive: 0, goalContribution: 0, passing: 0, duel: 0 };
  for (const s of allScored) {
    for (const k of Object.keys(avgValues)) {
      avgValues[k] += (s.per90Scores[k] || 0) / allScored.length;
    }
  }

  const labels = {
    progressive: 'Progressive',
    defensive: 'Defensive',
    goalContribution: 'Goal Contrib.',
    passing: 'Passing',
    duel: 'Duels',
  };

  return Object.keys(labels).map(k => ({
    stat: labels[k],
    player: Math.round(((player.per90Scores[k] || 0) / maxes[k]) * 100),
    average: Math.round((avgValues[k] / maxes[k]) * 100),
  }));
}
