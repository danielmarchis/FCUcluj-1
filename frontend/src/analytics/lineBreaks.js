// Line-Breaking Analysis

export function analyzeLineBreaks(playerStats) {
  const players = [];
  
  for (const ps of Object.values(playerStats)) {
    if (ps.minutesPlayed < 90) continue;
    const per90 = ps.minutesPlayed > 0 ? 90 / ps.minutesPlayed : 0;
    
    const high = (ps.totals.successfulThroughPasses || 0);
    const medium = (ps.totals.successfulSmartPasses || 0);
    const standard = (ps.totals.successfulProgressivePasses || 0);
    const runs = (ps.totals.progressiveRun || 0);
    
    const total = high * 5 + medium * 3 + standard * 2 + runs * 3;
    
    players.push({
      id: ps.id,
      name: ps.name,
      role: ps.role,
      throughPasses: ps.totals.throughPasses || 0,
      successfulThroughPasses: high,
      smartPasses: ps.totals.smartPasses || 0,
      successfulSmartPasses: medium,
      progressivePasses: ps.totals.progressivePasses || 0,
      successfulProgressivePasses: standard,
      progressiveRuns: runs,
      totalScore: total,
      scoreP90: +(total * per90).toFixed(1),
      highImpact: high,
      mediumImpact: medium,
      standardImpact: standard + runs,
      minutes: ps.minutesPlayed,
      matches: ps.matchCount,
    });
  }
  
  players.sort((a, b) => b.scoreP90 - a.scoreP90);
  return players;
}
