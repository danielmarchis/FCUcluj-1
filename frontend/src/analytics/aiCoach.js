// AI Coach - Comprehensive Tactical Insight Engine with actionable recommendations

export function generateTeamInsights(playerStats, teamMatches, selectedTeam) {
  const insights = [];
  const players = Object.values(playerStats).filter(p => p.minutesPlayed >= 90);
  
  if (players.length === 0 || teamMatches.length === 0) {
    return [{ type: 'info', title: 'Insufficient Data', text: 'Need more match data to generate insights.' }];
  }

  const teamTotals = {};
  for (const p of players) {
    for (const [k, v] of Object.entries(p.totals)) {
      teamTotals[k] = (teamTotals[k] || 0) + v;
    }
  }
  const totalMatches = teamMatches.length;
  const totalMin = teamTotals.minutesOnField || 1;
  const p90 = (v) => ((v / totalMin) * 90).toFixed(1);

  const wins = teamMatches.filter(m => m.result === 'W').length;
  const draws = teamMatches.filter(m => m.result === 'D').length;
  const losses = teamMatches.filter(m => m.result === 'L').length;
  const winRate = ((wins / totalMatches) * 100).toFixed(0);

  // --- SEASON OVERVIEW ---
  insights.push({ type: 'overview', title: '📋 Season Overview',
    text: `${selectedTeam || 'Team'} has a **${winRate}% win rate** across ${totalMatches} matches (${wins}W ${draws}D ${losses}L). The team averages **${p90(teamTotals.goals || 0)} goals per 90**.`,
    recommendation: winRate < 50 ? 'Focus on converting draws to wins through better set-piece routines and late-game management.' : 'Maintain consistency. Analyze losses for common tactical weaknesses.'
  });

  // --- SCORING EFFICIENCY ---
  const xgTotal = (teamTotals.xgShot || 0);
  const goalsTotal = teamTotals.goals || 0;
  const xgDiff = goalsTotal - xgTotal;
  const shotAcc = teamTotals.shots > 0 ? ((teamTotals.shotsOnTarget || 0) / teamTotals.shots * 100).toFixed(1) : 0;
  const convRate = teamTotals.shots > 0 ? ((goalsTotal / teamTotals.shots) * 100).toFixed(1) : 0;
  insights.push({ type: xgDiff > 0 ? 'strength' : 'weakness', title: '🎯 Scoring Efficiency',
    text: `**${goalsTotal} goals** vs **${xgTotal.toFixed(1)} xG** (${xgDiff > 0 ? '+' : ''}${xgDiff.toFixed(1)}). Shot accuracy: **${shotAcc}%**. Conversion rate: **${convRate}%**. ` +
    (xgDiff > 0 ? 'Clinical finishing — outperforming expected goals.' : 'Underperforming xG — creating chances but not converting.'),
    recommendation: xgDiff > 0
      ? '✅ Maintain finishing drills. Focus on shot selection quality — prioritize high-xG opportunities from inside the box.'
      : '⚠️ **Drills:** 1) Finishing under pressure exercises, 2) 1v1 vs GK scenarios, 3) First-time shooting from crosses. Analyze shot maps for low-value attempts.',
    drill: xgDiff > 0 ? 'Continue progressive overload shooting drills to maintain edge.' : 'Daily: 20 min finishing circuit — 5 reps each of: cutback finish, header, volley, 1v1. Track conversion weekly.'
  });

  // --- PROGRESSIVE PLAY ---
  const progP90 = parseFloat(p90(teamTotals.progressivePasses || 0));
  const progRunP90 = parseFloat(p90(teamTotals.progressiveRun || 0));
  const progSucc = teamTotals.progressivePasses > 0 ? ((teamTotals.successfulProgressivePasses || 0) / teamTotals.progressivePasses * 100).toFixed(1) : 0;
  insights.push({ type: 'tactic', title: '📈 Progressive Play',
    text: `**${progP90} progressive passes/90** (${progSucc}% accuracy) and **${progRunP90} progressive runs/90**. ` +
    (progP90 > 30 ? 'Aggressive forward movement creates numerical advantages.' : 'Below-average progression — struggles to break compact defenses.'),
    recommendation: progP90 > 30
      ? '✅ Strong vertical play. Ensure progressive passers have 2-3 passing options ahead when receiving the ball.'
      : '⚠️ **Improve by:** 1) Training half-turn receiving to face forward, 2) Third-man runs to create progressive passing lanes, 3) Encourage CBs to carry ball into midfield when pressed.',
    drill: 'Rondo 6v3 in tight space → on coach signal, play must go forward through gates. Develops quick vertical decision-making.'
  });

  // --- PASSING ANALYSIS ---
  const passAcc = teamTotals.passes > 0 ? ((teamTotals.successfulPasses / teamTotals.passes) * 100).toFixed(1) : 0;
  const smartPassP90 = p90(teamTotals.successfulSmartPasses || 0);
  const throughP90 = p90(teamTotals.successfulThroughPasses || 0);
  insights.push({ type: parseFloat(passAcc) > 80 ? 'strength' : 'weakness', title: '🔄 Passing & Ball Retention',
    text: `**${passAcc}% pass accuracy**. Smart passes/90: **${smartPassP90}**. Through balls/90: **${throughP90}**. ` +
    (parseFloat(passAcc) > 80 ? 'Excellent ball retention and composure.' : 'Below-target accuracy — turnovers from risky passing.'),
    recommendation: parseFloat(passAcc) > 80
      ? '✅ Add more risk in final third — increase through-ball attempts when pass retention is secure.'
      : '⚠️ **Improve by:** 1) Shorter passing sequences under pressure, 2) Identify risky zones (own half turnovers), 3) Play two-touch maximum in build-up to speed decisions.',
    drill: 'Pattern play: build-up from GK → CB → DM → AM → wide → cross. 15-min repetitions with passive then active press.'
  });

  // --- BALL LOSS ANALYSIS ---
  const lossesP90 = parseFloat(p90(teamTotals.losses || 0));
  const dangerousP90 = parseFloat(p90(teamTotals.dangerousOwnHalfLosses || 0));
  insights.push({ type: dangerousP90 > 3 ? 'weakness' : 'strength', title: '⚠️ Ball Security',
    text: `**${lossesP90} turnovers/90** with **${dangerousP90} dangerous own-half losses/90**. ` +
    (dangerousP90 > 3 ? 'High-risk turnover rate creating counter-attack opportunities for opponents.' : 'Good discipline — controlled risk management in build-up.'),
    recommendation: dangerousP90 > 3
      ? '⚠️ **Actions:** 1) Identify top ball-losers in own half — assign simpler passing roles, 2) GK and CBs must have safe outlet option, 3) Implement "safety pass" rule under high press.'
      : '✅ Maintain disciplined build-up. Consider taking more calculated risks in opponent half to increase attacking output.',
    drill: 'Press resistance drill: 4v4+2 in 15x15m box — team in possession must complete 6 passes under intense press before playing out.'
  });

  // --- PRESSING & COUNTER-PRESSING ---
  const counterPressP90 = parseFloat(p90(teamTotals.counterpressingRecoveries || 0));
  const pressDuelsWon = teamTotals.pressingDuels > 0 ? ((teamTotals.pressingDuelsWon || 0) / teamTotals.pressingDuels * 100).toFixed(1) : 0;
  insights.push({ type: 'tactic', title: '💪 Pressing & Counter-Pressing',
    text: `**${counterPressP90} counter-pressing recoveries/90**. Pressing duel win rate: **${pressDuelsWon}%**. ` +
    (counterPressP90 > 5 ? 'Aggressive gegenpressing — recovering possession quickly after loss.' : 'Conservative approach — deeper recovery preferred.'),
    recommendation: counterPressP90 > 5
      ? '✅ Effective pressing. Ensure pressing triggers are coordinated — avoid individual pressing that exposes space behind.'
      : '⚠️ **Improve by:** 1) Set 3-second counter-press rule after losing ball, 2) Nearest 3 players must immediately press ball carrier, 3) Cut passing lanes rather than diving in.',
    drill: 'Transition game: 7v7 on half pitch. When team loses ball, 3-second counter-press window. If recovered, attack immediately. Builds automatic pressing habit.'
  });

  // --- DEFENSIVE ORGANIZATION ---
  const interP90 = p90(teamTotals.interceptions || 0);
  const recP90 = p90(teamTotals.recoveries || 0);
  const defDuelWin = teamTotals.defensiveDuels > 0 ? ((teamTotals.defensiveDuelsWon / teamTotals.defensiveDuels) * 100).toFixed(0) : 0;
  const aerialWin = teamTotals.aerialDuels > 0 ? ((teamTotals.aerialDuelsWon / teamTotals.aerialDuels) * 100).toFixed(0) : 0;
  insights.push({ type: 'tactic', title: '🛡️ Defensive Organization',
    text: `**${interP90} interceptions/90**, **${recP90} recoveries/90**. Defensive duel win rate: **${defDuelWin}%**. Aerial duels won: **${aerialWin}%**.`,
    recommendation: parseInt(defDuelWin) > 55
      ? '✅ Solid defensive dueling. Focus on maintaining shape when pressing and covering gaps left by attacking FBs.'
      : '⚠️ **Improve by:** 1) Delay and contain rather than commit to tackles, 2) Body shape must guide attacker wide, 3) CBs stay compact — max 15m between them.',
    drill: '1v1 defending drill: defender must force attacker to weaker foot. Progress to 2v2 with covering defender practicing correct angles.'
  });

  // --- PPDA / PRESSING INTENSITY ---
  let totalOppPasses = 0, totalDefActions = 0;
  for (const m of teamMatches) {
    const isHome = m.h.includes(selectedTeam || '');
    const teamP = m.p;
    const oppP = [];
    for (const p of oppP) totalOppPasses += p.t.passes || 0;
    for (const p of teamP) totalDefActions += (p.t.interceptions || 0) + (p.t.defensiveDuelsWon || 0) + (p.t.counterpressingRecoveries || 0);
  }
  const ppda = totalDefActions > 0 ? (totalOppPasses / totalDefActions).toFixed(1) : 0;
  insights.push({ type: 'tactic', title: '📊 PPDA (Pressing Intensity)',
    text: `**PPDA: ${ppda}** (${parseFloat(ppda) < 8 ? 'High Press' : parseFloat(ppda) < 12 ? 'Medium Press' : 'Low Press'}). Lower PPDA = more aggressive pressing. Elite teams average 7-10.`,
    recommendation: parseFloat(ppda) < 10
      ? '✅ Good pressing intensity. Monitor fatigue — rotate pressing players every 60-70 min to maintain intensity.'
      : '⚠️ **Improve by:** 1) Set pressing triggers (bad touch, backward pass, wide areas), 2) First line must press as unit not individually, 3) Cut central passing lanes to force play wide.',
    drill: 'Shadow pressing drill: 11v0 walk-through of pressing triggers. Then 11v11 half-speed. Coach freezes play to correct shape.'
  });

  // --- TRANSITION EFFICIENCY ---
  const oppHalfRec = teamTotals.opponentHalfRecoveries || 0;
  const dangerousOppRec = teamTotals.dangerousOpponentHalfRecoveries || 0;
  insights.push({ type: 'tactic', title: '⚡ Transition Efficiency',
    text: `**${p90(oppHalfRec)} high recoveries/90** (${p90(dangerousOppRec)} in dangerous zones). Counter-press recoveries: **${counterPressP90}/90**.`,
    recommendation: parseFloat(p90(oppHalfRec)) > 3
      ? '✅ Good high pressing yields turnovers. Ensure quick forward pass within 3 seconds of recovery to exploit disorganized defense.'
      : '⚠️ **Improve by:** 1) Push defensive line higher to win ball in advanced areas, 2) Train "attack within 5 seconds" after high recovery, 3) Wide players must sprint to goal-side immediately on recovery.',
    drill: 'Transition game: 5v5+GKs. After recovery in opponent half, team has 8 seconds to score. Builds fast transition mentality.'
  });

  // --- SET PIECE EFFECTIVENESS ---
  const corners = teamTotals.corners || 0;
  const freeKicks = teamTotals.freeKicks || 0;
  const headShots = teamTotals.headShots || 0;
  const penConv = teamTotals.penalties > 0 ? ((teamTotals.successfulPenalties || 0) / teamTotals.penalties * 100).toFixed(0) : 100;
  insights.push({ type: 'tactic', title: '🏁 Set Piece Effectiveness',
    text: `**${(corners / totalMatches).toFixed(1)} corners/match**, **${(freeKicks / totalMatches).toFixed(1)} FKs/match**. Headed shots: **${headShots}**. Penalty conversion: **${penConv}%**.`,
    recommendation: headShots > totalMatches * 0.5
      ? '✅ Good aerial threat from set pieces. Add near-post flick-on routines and short-corner variations to keep opponents guessing.'
      : '⚠️ **Improve by:** 1) Assign specific set-piece roles (blocker, runner, near-post), 2) Practice 3 corner routines weekly, 3) Target tallest players with delivery to back post.',
    drill: 'Set piece session: 10 corners — 3 short, 3 near post, 2 back post, 2 outswing to edge. Track goals per 10 deliveries.'
  });

  // --- PHYSICAL / WORKLOAD ---
  const accP90 = p90(teamTotals.accelerations || 0);
  const duelTotal = teamTotals.duels || 0;
  const duelWinRate = duelTotal > 0 ? ((teamTotals.duelsWon || 0) / duelTotal * 100).toFixed(0) : 0;
  insights.push({ type: 'tactic', title: '🏃 Physical Performance & Injury Risk',
    text: `**${accP90} accelerations/90**. Total duels: **${duelTotal}** (${duelWinRate}% won). Progressive runs/90: **${progRunP90}**. Monitor workload of key players to prevent injuries.`,
    recommendation: '**Injury Prevention:** 1) Players with >2000 min need managed rest, 2) High-duel players need recovery protocols, 3) Track sliding tackle frequency — indicator of desperation defending.',
    drill: 'Weekly GPS review: flag players >85th percentile workload for modified training. Implement 48hr recovery protocol after high-intensity matches.'
  });

  // --- TOP PERFORMER ---
  const topScorer = [...players].sort((a, b) => (b.totals.goals || 0) - (a.totals.goals || 0))[0];
  if (topScorer && topScorer.totals.goals > 0) {
    const topXgDiff = (topScorer.totals.goals || 0) - (topScorer.totals.xgShot || 0);
    insights.push({ type: 'highlight', title: `⭐ Star: ${topScorer.name}`,
      text: `**${topScorer.totals.goals} goals**, **${topScorer.totals.assists || 0} assists** in ${topScorer.matchCount} apps. xG: **${(topScorer.totals.xgShot || 0).toFixed(1)}** (${topXgDiff > 0 ? '+' : ''}${topXgDiff.toFixed(1)} overperformance).`,
      recommendation: `Build attacking patterns around ${topScorer.name}. Ensure they receive ball in high-xG zones (inside box, central). Create specific set-piece targeting routines for them.`
    });
  }

  return insights;
}

export function generatePlayerReport(player, allScored) {
  if (!player) return '';
  const s = player.totals;
  const per90 = player.minutesPlayed > 0 ? 90 / player.minutesPlayed : 0;
  
  let report = `## ${player.name} — Performance Report\n\n`;
  report += `**Position:** ${player.role} | **Matches:** ${player.matchCount} | **Minutes:** ${player.minutesPlayed}\n\n`;

  const strengths = [];
  const weaknesses = [];

  if ((s.successfulPasses || 0) / (s.passes || 1) > 0.85) strengths.push('Excellent passing accuracy');
  if ((s.goals || 0) * per90 > 0.3) strengths.push('Prolific goalscorer');
  if ((s.assists || 0) * per90 > 0.2) strengths.push('Creative playmaker');
  if ((s.progressivePasses || 0) * per90 > 3) strengths.push('Strong progressive passer');
  if ((s.interceptions || 0) * per90 > 2) strengths.push('Excellent at reading the game');
  if ((s.recoveries || 0) * per90 > 4) strengths.push('High recovery rate');
  if ((s.duelsWon || 0) / (s.duels || 1) > 0.55) strengths.push('Dominant in duels');
  if ((s.successfulDribbles || 0) * per90 > 1.5) strengths.push('Effective dribbler');
  if ((s.aerialDuelsWon || 0) / (s.aerialDuels || 1) > 0.6) strengths.push('Dominant in the air');

  if ((s.dangerousOwnHalfLosses || 0) * per90 > 0.5) weaknesses.push('Prone to dangerous turnovers');
  if ((s.successfulPasses || 0) / (s.passes || 1) < 0.7) weaknesses.push('Inconsistent passing');
  if ((s.duelsWon || 0) / (s.duels || 1) < 0.4) weaknesses.push('Struggles in physical duels');

  if (strengths.length === 0) strengths.push('Consistent contributor');
  if (weaknesses.length === 0) weaknesses.push('No major weaknesses identified');

  report += `### Strengths\n${strengths.map(s => `- ✅ ${s}`).join('\n')}\n\n`;
  report += `### Areas for Improvement\n${weaknesses.map(w => `- ⚠️ ${w}`).join('\n')}\n\n`;
  report += `### Key Stats (per 90)\n`;
  report += `- Goals: **${((s.goals || 0) * per90).toFixed(2)}** | xG: **${((s.xgShot || 0) * per90).toFixed(2)}**\n`;
  report += `- Passes: **${((s.passes || 0) * per90).toFixed(0)}** (${((s.successfulPasses || 0) / (s.passes || 1) * 100).toFixed(0)}% accuracy)\n`;
  report += `- Progressive Passes: **${((s.progressivePasses || 0) * per90).toFixed(1)}**\n`;
  report += `- Duels Won: **${((s.duelsWon || 0) * per90).toFixed(1)}** (${((s.duelsWon || 0) / (s.duels || 1) * 100).toFixed(0)}%)\n`;
  report += `- Recoveries: **${((s.recoveries || 0) * per90).toFixed(1)}**\n`;

  return report;
}

export function comparePlayersText(p1, p2) {
  if (!p1 || !p2) return '';
  const per90_1 = p1.minutesPlayed > 0 ? 90 / p1.minutesPlayed : 0;
  const per90_2 = p2.minutesPlayed > 0 ? 90 / p2.minutesPlayed : 0;

  const metrics = [
    ['Goals p90', (p1.totals.goals||0)*per90_1, (p2.totals.goals||0)*per90_2],
    ['Assists p90', (p1.totals.assists||0)*per90_1, (p2.totals.assists||0)*per90_2],
    ['Pass Acc %', (p1.totals.successfulPasses||0)/(p1.totals.passes||1)*100, (p2.totals.successfulPasses||0)/(p2.totals.passes||1)*100],
    ['Prog. Passes p90', (p1.totals.progressivePasses||0)*per90_1, (p2.totals.progressivePasses||0)*per90_2],
    ['Duels Won p90', (p1.totals.duelsWon||0)*per90_1, (p2.totals.duelsWon||0)*per90_2],
    ['Recoveries p90', (p1.totals.recoveries||0)*per90_1, (p2.totals.recoveries||0)*per90_2],
  ];

  let text = `**${p1.name}** vs **${p2.name}**\n\n`;
  for (const [label, v1, v2] of metrics) {
    const winner = v1 > v2 ? p1.name : v2 > v1 ? p2.name : 'Equal';
    text += `- ${label}: ${v1.toFixed(1)} vs ${v2.toFixed(1)} → **${winner}**\n`;
  }
  return text;
}
