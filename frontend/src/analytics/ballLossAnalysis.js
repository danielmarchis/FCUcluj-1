// Ball Loss Analysis - zones and patterns with per-player filtering

// Higher resolution zone mapping (12 rows x 8 cols)
const POS_TO_ZONE_HR = {
  'gk':  [0, 3], 'gkp': [0, 4],
  'lb':  [2, 0], 'lcb': [2, 2], 'cb': [2, 3], 'rcb': [2, 5], 'rb': [2, 7],
  'lwb': [4, 0], 'ldmf': [4, 2], 'dmf': [4, 3], 'rdmf': [4, 5], 'rwb': [4, 7],
  'lmf': [6, 0], 'lcmf': [6, 2], 'cmf': [6, 3], 'rcmf': [6, 5], 'rmf': [6, 7],
  'lamf': [8, 1], 'amf': [8, 3], 'ramf': [8, 6],
  'lw':  [8, 0], 'rw': [8, 7],
  'lwf': [10, 1], 'ss': [10, 3], 'cf': [10, 4], 'rwf': [10, 6],
  'fw':  [10, 3], 'fwd': [10, 4], 'def': [2, 3], 'mid': [6, 3],
};

// Add spread to nearby zones for more realistic heatmap
function spreadToZones(zones, row, col, value, dangerousValue, rows, cols) {
  const spread = [
    [row, col, 0.5],
    [row - 1, col, 0.12], [row + 1, col, 0.12],
    [row, col - 1, 0.12], [row, col + 1, 0.12],
    [row - 1, col - 1, 0.02], [row - 1, col + 1, 0.02],
    [row + 1, col - 1, 0.02], [row + 1, col + 1, 0.02],
  ];
  
  for (const [r, c, weight] of spread) {
    if (r >= 0 && r < rows && c >= 0 && c < cols) {
      zones[r][c].losses += value * weight;
      zones[r][c].dangerous += dangerousValue * weight;
      zones[r][c].count++;
    }
  }
}

export function analyzeBallLosses(playerStats, teamMatches, selectedTeam, filteredPlayerId = null) {
  const matches = teamMatches;
  const ROWS = 12;
  const COLS = 8;

  // Aggregate losses by player
  const playerLosses = [];
  for (const ps of Object.values(playerStats)) {
    if (ps.minutesPlayed < 90) continue;
    const totalLosses = ps.totals.losses || 0;
    const ownHalfLosses = ps.totals.ownHalfLosses || 0;
    const dangerousLosses = ps.totals.dangerousOwnHalfLosses || 0;
    const per90 = ps.minutesPlayed > 0 ? 90 / ps.minutesPlayed : 0;
    
    playerLosses.push({
      id: ps.id,
      name: ps.name,
      role: ps.role,
      totalLosses,
      ownHalfLosses,
      dangerousLosses,
      lossesP90: +(totalLosses * per90).toFixed(1),
      dangerousP90: +(dangerousLosses * per90).toFixed(1),
      minutes: ps.minutesPlayed,
      matches: ps.matchCount,
    });
  }
  playerLosses.sort((a, b) => b.dangerousP90 - a.dangerousP90);

  // Generate heatmap zones (12x8 grid)
  const zones = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => ({ losses: 0, dangerous: 0, count: 0 }))
  );

  for (const match of matches) {
    for (const p of match.p) {
      // If filtering by player, skip others
      if (filteredPlayerId && p.id !== filteredPlayerId) continue;

      const pos = (p.pos || '').toLowerCase();
      const zone = POS_TO_ZONE_HR[pos] || [5, 3];
      const losses = p.t.losses || 0;
      const dangerous = p.t.dangerousOwnHalfLosses || 0;
      if (losses > 0) {
        spreadToZones(zones, zone[0], zone[1], losses, dangerous, ROWS, COLS);
      }
    }
  }

  // Find max for normalization
  const maxLoss = Math.max(...zones.flat().map(z => z.losses), 1);

  const heatmapData = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      heatmapData.push({
        row: r,
        col: c,
        losses: Math.round(zones[r][c].losses),
        dangerous: Math.round(zones[r][c].dangerous),
        intensity: zones[r][c].losses / maxLoss,
      });
    }
  }

  // Per-match loss trends
  const matchTrends = matches.map(m => {
    let totalLosses = 0;
    let dangerousLosses = 0;
    for (const p of m.p) {
      if (filteredPlayerId && p.id !== filteredPlayerId) continue;
      totalLosses += p.t.losses || 0;
      dangerousLosses += p.t.dangerousOwnHalfLosses || 0;
    }
    return {
      matchIdx: m.idx,
      label: `${m.h} vs ${m.aw}`,
      score: m.scoreLabel,
      totalLosses,
      dangerousLosses,
      result: m.result,
    };
  });

  return { playerLosses, heatmapData, matchTrends, gridRows: ROWS, gridCols: COLS };
}

/**
 * Generate a general activity heatmap for a player or team
 */
export function generateActivityHeatmap(matches, playerId = null, selectedTeam = null, isTeamHeatmap = false) {
  const ROWS = 12;
  const COLS = 8;
  const zones = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => ({ activity: 0, count: 0 }))
  );

  for (const match of matches) {
    const isHome = selectedTeam ? match.h.includes(selectedTeam) : true;
    for (const p of match.p) {
      if (playerId && p.id !== playerId) continue;

      const pos = (p.pos || '').toLowerCase();
      const zone = POS_TO_ZONE_HR[pos] || [5, 3];
      
      // Activity score based on various actions
      const activity = (p.t.minutesOnField || 0) * 0.3 +
                       (p.t.passes || 0) * 0.5 +
                       (p.t.recoveries || 0) * 2 +
                       (p.t.duels || 0) * 1.5 +
                       (p.t.dribbles || 0) * 2 +
                       (p.t.shots || 0) * 3 +
                       (p.t.touchInBox || 0) * 2 +
                       (p.t.interceptions || 0) * 2;

      if (activity > 0) {
        spreadToZones(zones, zone[0], zone[1], activity, 0, ROWS, COLS);
      }
    }
  }

  const maxActivity = Math.max(...zones.flat().map(z => z.activity), 1);

  const heatmapData = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      heatmapData.push({
        row: r,
        col: c,
        losses: Math.round(zones[r][c].activity), // reuse losses field for rendering
        dangerous: 0,
        intensity: zones[r][c].activity / maxActivity,
      });
    }
  }

  return { heatmapData, gridRows: ROWS, gridCols: COLS };
}
