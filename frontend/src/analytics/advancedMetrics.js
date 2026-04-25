// Advanced Tactical Metrics computed from Wyscout match data

/**
 * xG / xA / xT Analysis
 */
export function analyzeExpectedMetrics(teamMatches, teamPlayerStats, selectedTeam) {
  const perMatch = teamMatches.map(m => {
    const isHome = m.h.includes(selectedTeam);
    const teamPlayers = m.p;
    const oppPlayers = [];

    let xg = 0, xa = 0, goals = 0, assists = 0, shots = 0, shotsOnTarget = 0;
    let oppXg = 0, oppGoals = 0;
    // xT approximation: progressive passes to final third + touches in box
    let xt = 0;

    for (const p of teamPlayers) {
      xg += p.t.xgShot || 0;
      xa += p.t.xgAssist || 0;
      goals += p.t.goals || 0;
      assists += p.t.assists || 0;
      shots += p.t.shots || 0;
      shotsOnTarget += p.t.shotsOnTarget || 0;
      xt += (p.t.successfulPassesToFinalThird || 0) * 0.08 +
            (p.t.touchInBox || 0) * 0.15 +
            (p.t.successfulProgressivePasses || 0) * 0.04 +
            (p.t.progressiveRun || 0) * 0.06;
    }

    for (const p of oppPlayers) {
      oppXg += p.t.xgShot || 0;
      oppGoals += p.t.goals || 0;
    }

    const goalsFor = isHome ? m.hg : m.ag;
    const goalsAgainst = isHome ? m.ag : m.hg;

    return {
      matchIdx: m.idx,
      label: `${m.h.substring(0, 3)} v ${m.aw.substring(0, 3)}`,
      fullLabel: `${m.h} vs ${m.aw}`,
      score: m.scoreLabel,
      result: m.result,
      xg: +xg.toFixed(2),
      xa: +xa.toFixed(2),
      xt: +xt.toFixed(2),
      goals: goalsFor,
      goalsAgainst,
      shots,
      shotsOnTarget,
      oppXg: +oppXg.toFixed(2),
      xgDiff: +(goalsFor - xg).toFixed(2),
      conversionRate: shots > 0 ? +((goalsFor / shots) * 100).toFixed(1) : 0,
    };
  });

  const totals = perMatch.reduce((acc, m) => {
    acc.xg += m.xg;
    acc.xa += m.xa;
    acc.xt += m.xt;
    acc.goals += m.goals;
    acc.goalsAgainst += m.goalsAgainst;
    acc.shots += m.shots;
    acc.shotsOnTarget += m.shotsOnTarget;
    acc.oppXg += m.oppXg;
    return acc;
  }, { xg: 0, xa: 0, xt: 0, goals: 0, goalsAgainst: 0, shots: 0, shotsOnTarget: 0, oppXg: 0 });

  const matchCount = perMatch.length || 1;

  return {
    perMatch,
    totals: {
      ...totals,
      xg: +totals.xg.toFixed(2),
      xa: +totals.xa.toFixed(2),
      xt: +totals.xt.toFixed(2),
      oppXg: +totals.oppXg.toFixed(2),
    },
    averages: {
      xgPerMatch: +(totals.xg / matchCount).toFixed(2),
      xaPerMatch: +(totals.xa / matchCount).toFixed(2),
      xtPerMatch: +(totals.xt / matchCount).toFixed(2),
      goalsPerMatch: +(totals.goals / matchCount).toFixed(2),
      shotsPerMatch: +(totals.shots / matchCount).toFixed(1),
      conversionRate: totals.shots > 0 ? +((totals.goals / totals.shots) * 100).toFixed(1) : 0,
      shotAccuracy: totals.shots > 0 ? +((totals.shotsOnTarget / totals.shots) * 100).toFixed(1) : 0,
    },
    xgOverperformance: +(totals.goals - totals.xg).toFixed(2),
    defensiveXgDiff: +(totals.goalsAgainst - totals.oppXg).toFixed(2),
  };
}

/**
 * PPDA — Passes Per Defensive Action (pressing intensity)
 */
export function analyzePPDA(teamMatches, selectedTeam) {
  const perMatch = teamMatches.map(m => {
    const isHome = m.h.includes(selectedTeam);
    const teamPlayers = m.p;
    const oppPlayers = [];

    // Opponent passes in own half (approx: total passes - final third passes)
    let oppPasses = 0;
    for (const p of oppPlayers) {
      oppPasses += (p.t.passes || 0);
    }

    // Our defensive actions
    let defActions = 0;
    for (const p of teamPlayers) {
      defActions += (p.t.interceptions || 0) +
                    (p.t.slidingTackles || 0) +
                    (p.t.defensiveDuelsWon || 0) +
                    (p.t.counterpressingRecoveries || 0);
    }

    const ppda = defActions > 0 ? +(oppPasses / defActions).toFixed(1) : 0;

    return {
      matchIdx: m.idx,
      label: `${m.h.substring(0, 3)} v ${m.aw.substring(0, 3)}`,
      ppda,
      oppPasses,
      defActions,
      result: m.result,
    };
  });

  const totalOppPasses = perMatch.reduce((s, m) => s + m.oppPasses, 0);
  const totalDefActions = perMatch.reduce((s, m) => s + m.defActions, 0);
  const avgPPDA = totalDefActions > 0 ? +(totalOppPasses / totalDefActions).toFixed(1) : 0;

  return {
    perMatch,
    avgPPDA,
    interpretation: avgPPDA < 8 ? 'High Press' : avgPPDA < 12 ? 'Medium Press' : 'Low Press',
    totalDefActions,
  };
}

/**
 * Passing Network — top connections between players
 */
export function analyzePassingNetwork(teamPlayerStats, playerMap) {
  const players = Object.values(teamPlayerStats).filter(p => p.minutesPlayed >= 180);
  
  // Since we don't have pass-to-player data, we approximate top passers and their likely connections
  // using position proximity and volume
  const passers = players
    .map(p => ({
      id: p.id,
      name: p.name,
      role: p.role,
      passes: p.totals.passes || 0,
      successfulPasses: p.totals.successfulPasses || 0,
      progressivePasses: p.totals.progressivePasses || 0,
      keyPasses: p.totals.keyPasses || 0,
      passAccuracy: p.totals.passes > 0
        ? +((p.totals.successfulPasses / p.totals.passes) * 100).toFixed(1) : 0,
      minutesPlayed: p.minutesPlayed,
      matchCount: p.matchCount,
      per90Passes: p.minutesPlayed > 0 ? +((p.totals.passes / p.minutesPlayed) * 90).toFixed(1) : 0,
      receivedPass: p.totals.receivedPass || 0,
    }))
    .sort((a, b) => b.passes - a.passes);

  // Build approximate network links based on position relationships
  const links = [];
  const topPassers = passers.slice(0, 12);
  for (let i = 0; i < topPassers.length; i++) {
    for (let j = i + 1; j < topPassers.length; j++) {
      const a = topPassers[i];
      const b = topPassers[j];
      // Estimate connection strength from shared passing volume
      const strength = Math.min(a.passes, b.passes) * 0.1 +
                       Math.min(a.receivedPass, b.receivedPass) * 0.15;
      if (strength > 5) {
        links.push({
          source: a.name,
          target: b.name,
          strength: +strength.toFixed(1),
          sourceId: a.id,
          targetId: b.id,
        });
      }
    }
  }
  links.sort((a, b) => b.strength - a.strength);

  return {
    nodes: topPassers,
    links: links.slice(0, 15),
    topPasser: passers[0],
    avgPassAccuracy: passers.length > 0
      ? +(passers.reduce((s, p) => s + p.passAccuracy, 0) / passers.length).toFixed(1) : 0,
  };
}

/**
 * Defensive Line Height — estimated from CB position data
 */
export function analyzeDefensiveLine(teamMatches, selectedTeam) {
  const posHeightMap = {
    'gk': 5, 'gkp': 5,
    'lb': 25, 'lcb': 20, 'cb': 20, 'rcb': 20, 'rb': 25,
    'lwb': 40, 'ldmf': 40, 'dmf': 35, 'rdmf': 40, 'rwb': 40,
    'lmf': 50, 'lcmf': 50, 'cmf': 50, 'rcmf': 50, 'rmf': 50,
    'lamf': 65, 'amf': 65, 'ramf': 65,
    'lw': 70, 'rw': 70,
    'lwf': 80, 'ss': 75, 'cf': 85, 'rwf': 80,
    'fw': 85, 'fwd': 85,
  };

  const perMatch = teamMatches.map(m => {
    const isHome = m.h.includes(selectedTeam);
    const teamPlayers = m.p;

    // Get defensive line (CBs and FBs)
    const defenders = teamPlayers.filter(p => {
      const pos = (p.pos || '').toLowerCase();
      return ['lcb', 'cb', 'rcb', 'lb', 'rb'].includes(pos);
    });

    const defLineHeight = defenders.length > 0
      ? defenders.reduce((s, p) => s + (posHeightMap[(p.pos || '').toLowerCase()] || 20), 0) / defenders.length
      : 20;

    // Midfield line
    const midfielders = teamPlayers.filter(p => {
      const pos = (p.pos || '').toLowerCase();
      return ['ldmf', 'dmf', 'rdmf', 'lcmf', 'cmf', 'rcmf', 'lmf', 'rmf', 'lamf', 'amf', 'ramf'].includes(pos);
    });

    const midLineHeight = midfielders.length > 0
      ? midfielders.reduce((s, p) => s + (posHeightMap[(p.pos || '').toLowerCase()] || 45), 0) / midfielders.length
      : 45;

    // Compactness = distance between defensive and attacking lines
    const compactness = midLineHeight - defLineHeight;

    // Offside trap indicator: high line + recoveries
    let oppHalfRecoveries = 0;
    for (const p of teamPlayers) {
      oppHalfRecoveries += p.t.opponentHalfRecoveries || 0;
    }

    return {
      matchIdx: m.idx,
      label: `${m.h.substring(0, 3)} v ${m.aw.substring(0, 3)}`,
      defLineHeight: +defLineHeight.toFixed(0),
      midLineHeight: +midLineHeight.toFixed(0),
      compactness: +compactness.toFixed(0),
      oppHalfRecoveries,
      result: m.result,
    };
  });

  const avg = {
    defLine: perMatch.length > 0
      ? +(perMatch.reduce((s, m) => s + m.defLineHeight, 0) / perMatch.length).toFixed(0) : 0,
    midLine: perMatch.length > 0
      ? +(perMatch.reduce((s, m) => s + m.midLineHeight, 0) / perMatch.length).toFixed(0) : 0,
    compactness: perMatch.length > 0
      ? +(perMatch.reduce((s, m) => s + m.compactness, 0) / perMatch.length).toFixed(0) : 0,
  };

  return {
    perMatch,
    averages: avg,
    interpretation: avg.defLine >= 30 ? 'High Line' : avg.defLine >= 20 ? 'Medium Block' : 'Deep Block',
  };
}

/**
 * Transition Efficiency — recovery to shot/goal conversion
 */
export function analyzeTransitions(teamMatches, selectedTeam) {
  const perMatch = teamMatches.map(m => {
    const isHome = m.h.includes(selectedTeam);
    const teamPlayers = m.p;

    let recoveries = 0, counterpress = 0, oppHalfRec = 0, dangerousRec = 0;
    let shots = 0, goals = 0, xg = 0;

    for (const p of teamPlayers) {
      recoveries += p.t.recoveries || 0;
      counterpress += p.t.counterpressingRecoveries || 0;
      oppHalfRec += p.t.opponentHalfRecoveries || 0;
      dangerousRec += p.t.dangerousOpponentHalfRecoveries || 0;
      shots += p.t.shots || 0;
      goals += p.t.goals || 0;
      xg += p.t.xgShot || 0;
    }

    // Transition efficiency: how many recoveries lead to shots
    const transitionRate = recoveries > 0 ? +((shots / recoveries) * 100).toFixed(1) : 0;
    const counterpressRate = recoveries > 0 ? +((counterpress / recoveries) * 100).toFixed(1) : 0;

    return {
      matchIdx: m.idx,
      label: `${m.h.substring(0, 3)} v ${m.aw.substring(0, 3)}`,
      recoveries,
      counterpress,
      oppHalfRec,
      dangerousRec,
      shots,
      goals,
      transitionRate,
      counterpressRate,
      result: m.result,
    };
  });

  const totals = perMatch.reduce((acc, m) => {
    acc.recoveries += m.recoveries;
    acc.counterpress += m.counterpress;
    acc.oppHalfRec += m.oppHalfRec;
    acc.dangerousRec += m.dangerousRec;
    acc.shots += m.shots;
    acc.goals += m.goals;
    return acc;
  }, { recoveries: 0, counterpress: 0, oppHalfRec: 0, dangerousRec: 0, shots: 0, goals: 0 });

  return {
    perMatch,
    totals,
    avgTransitionRate: totals.recoveries > 0 ? +((totals.shots / totals.recoveries) * 100).toFixed(1) : 0,
    avgCounterpressRate: totals.recoveries > 0 ? +((totals.counterpress / totals.recoveries) * 100).toFixed(1) : 0,
    highPressRecoveryRate: totals.recoveries > 0 ? +((totals.oppHalfRec / totals.recoveries) * 100).toFixed(1) : 0,
  };
}

/**
 * Set Piece Effectiveness
 */
export function analyzeSetPieces(teamMatches, teamPlayerStats, selectedTeam) {
  const perMatch = teamMatches.map(m => {
    const isHome = m.h.includes(selectedTeam);
    const teamPlayers = m.p;

    let corners = 0, freeKicks = 0, directFK = 0, penalties = 0, successPen = 0;
    let headShots = 0, headGoals = 0;

    for (const p of teamPlayers) {
      corners += p.t.corners || 0;
      freeKicks += p.t.freeKicks || 0;
      directFK += p.t.directFreeKicks || 0;
      penalties += p.t.penalties || 0;
      successPen += p.t.successfulPenalties || 0;
      headShots += p.t.headShots || 0;
    }

    return {
      matchIdx: m.idx,
      label: `${m.h.substring(0, 3)} v ${m.aw.substring(0, 3)}`,
      corners,
      freeKicks,
      directFK,
      penalties,
      successPen,
      headShots,
      result: m.result,
    };
  });

  const totals = perMatch.reduce((acc, m) => {
    acc.corners += m.corners;
    acc.freeKicks += m.freeKicks;
    acc.directFK += m.directFK;
    acc.penalties += m.penalties;
    acc.successPen += m.successPen;
    acc.headShots += m.headShots;
    return acc;
  }, { corners: 0, freeKicks: 0, directFK: 0, penalties: 0, successPen: 0, headShots: 0 });

  const matchCount = perMatch.length || 1;

  // Top set piece takers
  const setPieceTakers = Object.values(teamPlayerStats)
    .filter(p => p.minutesPlayed >= 90)
    .map(p => ({
      id: p.id,
      name: p.name,
      role: p.role,
      corners: p.totals.corners || 0,
      freeKicks: p.totals.freeKicks || 0,
      directFK: p.totals.directFreeKicks || 0,
      penalties: p.totals.penalties || 0,
      successPen: p.totals.successfulPenalties || 0,
      total: (p.totals.corners || 0) + (p.totals.freeKicks || 0) + (p.totals.penalties || 0),
    }))
    .filter(p => p.total > 0)
    .sort((a, b) => b.total - a.total);

  return {
    perMatch,
    totals,
    averages: {
      cornersPerMatch: +(totals.corners / matchCount).toFixed(1),
      freeKicksPerMatch: +(totals.freeKicks / matchCount).toFixed(1),
    },
    setPieceTakers: setPieceTakers.slice(0, 10),
    penaltyConversion: totals.penalties > 0
      ? +((totals.successPen / totals.penalties) * 100).toFixed(0) : 100,
  };
}

/**
 * Progressive Pass Analysis
 */
export function analyzeProgressivePasses(teamPlayerStats) {
  const players = Object.values(teamPlayerStats)
    .filter(p => p.minutesPlayed >= 180)
    .map(p => {
      const per90 = p.minutesPlayed > 0 ? 90 / p.minutesPlayed : 0;
      const progPasses = p.totals.progressivePasses || 0;
      const succProgPasses = p.totals.successfulProgressivePasses || 0;
      const progRuns = p.totals.progressiveRun || 0;
      const passesToFT = p.totals.passesToFinalThird || 0;
      const succPassesToFT = p.totals.successfulPassesToFinalThird || 0;

      return {
        id: p.id,
        name: p.name,
        role: p.role,
        progPasses,
        succProgPasses,
        progPassAccuracy: progPasses > 0 ? +((succProgPasses / progPasses) * 100).toFixed(1) : 0,
        progRuns,
        passesToFT,
        succPassesToFT,
        ftPassAccuracy: passesToFT > 0 ? +((succPassesToFT / passesToFT) * 100).toFixed(1) : 0,
        progPassesP90: +(progPasses * per90).toFixed(1),
        progRunsP90: +(progRuns * per90).toFixed(1),
        totalProgressive: progPasses + progRuns,
        totalProgressiveP90: +((progPasses + progRuns) * per90).toFixed(1),
        minutesPlayed: p.minutesPlayed,
      };
    })
    .sort((a, b) => b.totalProgressiveP90 - a.totalProgressiveP90);

  return players;
}

/**
 * Physical / GPS Metrics (estimated from available data)
 */
export function analyzePhysicalMetrics(teamPlayerStats) {
  const players = Object.values(teamPlayerStats)
    .filter(p => p.minutesPlayed >= 270) // 3+ matches worth
    .map(p => {
      const per90 = p.minutesPlayed > 0 ? 90 / p.minutesPlayed : 0;
      const accelerations = p.totals.accelerations || 0;
      const progRuns = p.totals.progressiveRun || 0;
      const duels = p.totals.duels || 0;
      const pressingDuels = p.totals.pressingDuels || 0;
      const slidingTackles = p.totals.slidingTackles || 0;
      const fouls = p.totals.fouls || 0;
      const foulsSuffered = p.totals.foulsSuffered || 0;

      // Workload index (higher = more physical)
      const workload = (accelerations * 2 + progRuns * 3 + duels * 1.5 + pressingDuels * 2 + slidingTackles * 3);
      const workloadP90 = +(workload * per90).toFixed(1);

      // Injury Risk Score (0-100, higher = more risk)
      // Based on: high workload + sliding tackles + fouls suffered + age proxy (matches played intensity)
      const intensityPerMatch = p.matchCount > 0 ? workload / p.matchCount : 0;
      const injuryRisk = Math.min(100, Math.round(
        (workloadP90 / 100) * 25 +
        ((slidingTackles * per90) / 2) * 15 +
        ((foulsSuffered * per90) / 3) * 20 +
        ((duels * per90) / 15) * 20 +
        (p.minutesPlayed > 2000 ? 20 : (p.minutesPlayed / 2000) * 20)
      ));

      return {
        id: p.id,
        name: p.name,
        role: p.role,
        accelerationsP90: +(accelerations * per90).toFixed(1),
        progRunsP90: +(progRuns * per90).toFixed(1),
        duelsP90: +(duels * per90).toFixed(1),
        pressingDuelsP90: +(pressingDuels * per90).toFixed(1),
        slidingTacklesP90: +(slidingTackles * per90).toFixed(1),
        workloadP90,
        injuryRisk,
        matchCount: p.matchCount,
        minutesPlayed: p.minutesPlayed,
        foulsSufferedP90: +(foulsSuffered * per90).toFixed(1),
        riskLevel: injuryRisk > 70 ? 'High' : injuryRisk > 40 ? 'Medium' : 'Low',
      };
    })
    .sort((a, b) => b.injuryRisk - a.injuryRisk);

  return players;
}
