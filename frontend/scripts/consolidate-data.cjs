// Optimized consolidation - strip to essential fields only
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', '..', 'fc-u-cluj-data', 'Date - meciuri');
const outFile = path.join(__dirname, '..', 'public', 'data', 'matches.json');

const files = fs.readdirSync(dataDir).filter(f => f.endsWith('_players_stats.json'));
console.log(`Found ${files.length} match files`);

// Essential total stats to keep
const KEEP_TOTAL = [
  'matches','matchesInStart','matchesComingOff','matchesSubstituted','minutesOnField','minutesTagged',
  'goals','assists','xgShot','xgAssist','xgSave',
  'shots','shotsOnTarget','headShots','shotsBlocked',
  'passes','successfulPasses','progressivePasses','successfulProgressivePasses',
  'forwardPasses','successfulForwardPasses','backPasses','successfulBackPasses',
  'lateralPasses','successfulLateralPasses',
  'longPasses','successfulLongPasses','smartPasses','successfulSmartPasses',
  'throughPasses','successfulThroughPasses','keyPasses','successfulKeyPasses',
  'verticalPasses','successfulVerticalPasses',
  'passesToFinalThird','successfulPassesToFinalThird',
  'crosses','successfulCrosses',
  'dribbles','successfulDribbles','progressiveRun','accelerations',
  'duels','duelsWon','defensiveDuels','defensiveDuelsWon',
  'offensiveDuels','offensiveDuelsWon','aerialDuels','aerialDuelsWon',
  'pressingDuels','pressingDuelsWon','looseBallDuels','looseBallDuelsWon',
  'interceptions','recoveries','opponentHalfRecoveries','dangerousOpponentHalfRecoveries',
  'counterpressingRecoveries','clearances','slidingTackles','successfulSlidingTackles',
  'defensiveActions','successfulDefensiveAction',
  'attackingActions','successfulAttackingActions',
  'losses','ownHalfLosses','dangerousOwnHalfLosses',
  'missedBalls','fouls','foulsSuffered',
  'yellowCards','redCards','directRedCards',
  'touchInBox','receivedPass','offsides','linkupPlays','successfulLinkupPlays',
  'shotAssists','shotOnTargetAssists','secondAssists','thirdAssists',
  'penalties','successfulPenalties',
  'corners','freeKicks','directFreeKicks',
  'dribblesAgainst','dribblesAgainstWon',
  'gkCleanSheets','gkConcededGoals','gkShotsAgainst','gkSaves','gkExits','gkSuccessfulExits',
  'gkAerialDuels','gkAerialDuelsWon',
  'newDuelsWon','newDefensiveDuelsWon','newOffensiveDuelsWon','newSuccessfulDribbles',
  'fieldAerialDuels','fieldAerialDuelsWon',
  'goalKicks','goalKicksShort','goalKicksLong','successfulGoalKicks'
];

const KEEP_AVG = ['passLength','longPassLength','dribbleDistanceFromOpponentGoal'];

const matches = [];

for (const file of files) {
  const baseName = file.replace('_players_stats.json', '');
  const dashSplit = baseName.split(' - ');
  const homeTeam = dashSplit[0].trim();
  const remainder = dashSplit.slice(1).join(' - ').trim();
  const commaIdx = remainder.lastIndexOf(', ');
  const awayTeam = remainder.substring(0, commaIdx).trim();
  const scorePart = remainder.substring(commaIdx + 2).trim();
  const scoreClean = scorePart.split('_')[0];
  const [hg, ag] = scoreClean.split('-').map(Number);
  
  const content = fs.readFileSync(path.join(dataDir, file), 'utf8');
  const data = JSON.parse(content);
  
  const p0 = data.players[0];
  
  const players = data.players.map(p => {
    const total = {};
    for (const k of KEEP_TOTAL) {
      if (p.total[k] !== undefined) total[k] = p.total[k];
    }
    const avg = {};
    for (const k of KEEP_AVG) {
      if (p.average && p.average[k] !== undefined) avg[k] = p.average[k];
    }
    return {
      id: p.playerId,
      pos: p.positions?.[0]?.position?.code || 'unk',
      posName: p.positions?.[0]?.position?.name || 'Unknown',
      t: total,
      a: avg
    };
  });
  
  matches.push({
    id: p0?.matchId,
    cId: p0?.competitionId,
    sId: p0?.seasonId,
    rId: p0?.roundId,
    h: homeTeam,
    aw: awayTeam,
    hg,
    ag,
    p: players
  });
}

console.log(`Processed ${matches.length} matches`);
fs.writeFileSync(outFile, JSON.stringify(matches), 'utf8');
const stats = fs.statSync(outFile);
console.log(`Output: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
