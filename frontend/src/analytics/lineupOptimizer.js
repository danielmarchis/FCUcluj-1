import { calcPlayerScores } from './playerScoring';
import { analyzePhysicalMetrics } from './advancedMetrics';

/**
 * Predicts the optimal starting XI based on recent form and injury risk.
 * Assumes a 4-2-3-1 or 4-3-3 formation.
 */
export function predictOptimalLineup(teamPlayerStats, teamMatches) {
  // 1. Calculate base ratings
  const scoredPlayers = calcPlayerScores(teamPlayerStats);
  
  // 2. Get physical/injury risk data
  const physicalData = analyzePhysicalMetrics(teamPlayerStats);
  const riskMap = {};
  for (const p of physicalData) {
    riskMap[p.id] = p;
  }

  // 3. Enhance players with form and risk
  const availablePlayers = scoredPlayers.map(p => {
    // Recent form (last 5 matches)
    const recentMatches = p.matchScores.slice(-5);
    const formRating = recentMatches.length > 0 
      ? recentMatches.reduce((s, m) => s + m.composite, 0) / recentMatches.length 
      : p.rating;
    
    // Injury Risk penalty
    const risk = riskMap[p.id]?.injuryRisk || 0;
    const isHighRisk = risk > 75;
    
    // Form-adjusted rating (penalize if high injury risk)
    const optimalScore = isHighRisk ? formRating * 0.8 : formRating;

    return {
      ...p,
      formRating: Math.round(formRating),
      optimalScore,
      risk,
      isHighRisk,
      posCode: (p.roleCode || p.totals.pos || 'CMF').toLowerCase()
    };
  }).sort((a, b) => b.optimalScore - a.optimalScore); // Sort by highest score first

  // 4. Select XI based on 4-2-3-1 formation requirements
  const lineup = [];
  const selectedIds = new Set();

  const getBestForPositions = (posCodes, count) => {
    const selected = [];
    for (const p of availablePlayers) {
      if (!selectedIds.has(p.id) && posCodes.includes(p.posCode)) {
        selected.push(p);
        selectedIds.add(p.id);
        if (selected.length === count) break;
      }
    }
    // Fallback if strict position match fails (just pick next best available)
    while (selected.length < count) {
      const nextBest = availablePlayers.find(p => !selectedIds.has(p.id));
      if (nextBest) {
        // Mock a reasonable position code for the visual layout
        nextBest.posCode = posCodes[0]; 
        selected.push(nextBest);
        selectedIds.add(nextBest.id);
      } else {
        break;
      }
    }
    return selected;
  };

  // Select Goalkeeper
  lineup.push(...getBestForPositions(['gk', 'gkp'], 1));
  
  // Select Defenders (LB, LCB, RCB, RB)
  lineup.push(...getBestForPositions(['lb', 'lwb'], 1));
  lineup.push(...getBestForPositions(['cb', 'lcb', 'rcb'], 2));
  lineup.push(...getBestForPositions(['rb', 'rwb'], 1));
  
  // Select Defensive/Central Midfielders (2)
  lineup.push(...getBestForPositions(['dmf', 'ldmf', 'rdmf', 'cmf', 'lcmf', 'rcmf'], 2));
  
  // Select Attacking Midfielders / Wingers (3)
  lineup.push(...getBestForPositions(['lw', 'lwf', 'lmf'], 1));
  lineup.push(...getBestForPositions(['amf', 'lamf', 'ramf'], 1));
  lineup.push(...getBestForPositions(['rw', 'rwf', 'rmf'], 1));
  
  // Select Forward (1)
  lineup.push(...getBestForPositions(['fw', 'fwd', 'cf', 'ss'], 1));

  // Sort them safely for the FormationView
  const posOrder = { gk: 0, gkp: 0, lb: 1, lcb: 2, cb: 3, rcb: 4, rb: 5, lwb: 1, rwb: 5, ldmf: 6, dmf: 7, rdmf: 8, lmf: 9, lcmf: 10, cmf: 11, rcmf: 12, rmf: 13, lamf: 14, amf: 15, ramf: 16, lw: 17, rw: 18, lwf: 19, ss: 20, cf: 21, rwf: 22, fw: 23, fwd: 23 };
  
  return lineup.sort((a, b) => (posOrder[a.posCode] || 99) - (posOrder[b.posCode] || 99));
}
