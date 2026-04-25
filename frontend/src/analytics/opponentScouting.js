/**
 * Generates an AI-driven scouting report for an upcoming opponent.
 * Since raw opponent player data is removed, this uses rule-based heuristics 
 * based on the selected team's historical standing/perceived strength.
 */

export function generateScoutingReport(opponentTeamName) {
  // Mock data simulation based on opponent name length/hash to keep it consistent
  const hash = opponentTeamName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  const playStyles = ['Direct & Physical', 'High Possession', 'Counter-Attacking', 'High Pressing', 'Deep Block'];
  const formations = ['4-2-3-1', '4-3-3', '3-5-2', '4-4-2', '5-4-1'];
  
  const style = playStyles[hash % playStyles.length];
  const formation = formations[(hash * 2) % formations.length];
  
  const isStrong = hash % 3 === 0;

  const report = {
    team: opponentTeamName,
    formation,
    style,
    dangerRating: isStrong ? 8.5 : 6.0,
    strengths: [],
    weaknesses: [],
    tacticalAdvice: ''
  };

  if (style === 'High Possession') {
    report.strengths.push('Excellent ball retention in the middle third.');
    report.strengths.push('Patient build-up creates high-quality xG chances.');
    report.weaknesses.push('Vulnerable to rapid counter-attacks when fullbacks push high.');
    report.weaknesses.push('Struggle against aggressive mid-blocks.');
    report.tacticalAdvice = 'Employ a disciplined mid-block (4-4-2 out of possession). Wait for them to play into the middle third, then press aggressively to trigger rapid counter-attacks. Exploit the space left by their advancing fullbacks.';
  } else if (style === 'Direct & Physical') {
    report.strengths.push('High aerial duel win rate in both boxes.');
    report.strengths.push('Extremely dangerous from set pieces (corners and wide free kicks).');
    report.weaknesses.push('Low pass accuracy under pressure.');
    report.weaknesses.push('Lack pace in central defense.');
    report.tacticalAdvice = 'Avoid conceding unnecessary fouls in your own half. Keep the ball on the deck and utilize quick, short passing combinations to bypass their physical midfield. Target the space behind their center-backs with through balls.';
  } else if (style === 'Counter-Attacking') {
    report.strengths.push('Lethal transition speed from defense to attack.');
    report.strengths.push('Wingers are highly effective in 1v1 situations.');
    report.weaknesses.push('Struggle to break down deep, organized defenses.');
    report.weaknesses.push('Often surrender possession entirely.');
    report.tacticalAdvice = 'Do not overcommit players forward during sustained possession. Keep a 3-man rest-defense structure at all times. Force them to break you down by sitting slightly deeper than usual.';
  } else if (style === 'High Pressing') {
    report.strengths.push('Intense PPDA (Passes Per Defensive Action) disrupts opponent build-up.');
    report.strengths.push('Forces high turnovers leading to immediate shooting chances.');
    report.weaknesses.push('Fatigue significantly in the final 20 minutes of the match.');
    report.weaknesses.push('Space opens up between the midfield and defensive lines when the press is bypassed.');
    report.tacticalAdvice = 'Use long, diagonal balls to bypass the first line of their press. If you can break the initial wave, there is massive space to exploit in front of their back four. Prepare impact subs for the 70th minute to capitalize on their fatigue.';
  } else {
    report.strengths.push('Highly organized defensively; very few gaps in the low block.');
    report.strengths.push('Excellent at frustrating dominant teams and securing clean sheets.');
    report.weaknesses.push('Generate very low xG; heavily reliant on set pieces for goals.');
    report.weaknesses.push('Passive out of possession.');
    report.tacticalAdvice = 'Patience is key. Circulate the ball rapidly from side to side to shift their defensive block and open passing lanes. Consider using an extra attacking midfielder and pushing your defensive line very high to sustain pressure.';
  }

  // Key Players (Mocked)
  report.keyPlayers = [
    { name: 'Striker', threat: isStrong ? 'Clinical finisher, outperforming xG by 15%.' : 'Physical target man, wins 60% of aerial duels.' },
    { name: 'Playmaker', threat: 'Leads their team in progressive passes and key passes.' },
    { name: 'Center Back', threat: 'Organizes the defense; highest interception rate in the league.' }
  ];

  return report;
}
