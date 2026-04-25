import { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import { calcPlayerScores, calcCompositeScore } from '../analytics/playerScoring';
import { generateTeamInsights } from '../analytics/aiCoach';
import { predictOptimalLineup } from '../analytics/lineupOptimizer';
import FormationView from '../components/viz/FormationView';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <div className="label">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="value" style={{ color: p.color }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}
        </div>
      ))}
    </div>
  );
};

export default function Overview() {
  const { data } = useData();
  const [lineupMode, setLineupMode] = useState('last'); // 'last' or 'optimal'

  const stats = useMemo(() => {
    const { teamMatches, teamPlayerStats, matches, selectedTeam } = data;

    const wins = teamMatches.filter(m => m.result === 'W').length;
    const draws = teamMatches.filter(m => m.result === 'D').length;
    const losses = teamMatches.filter(m => m.result === 'L').length;

    let goalsFor = 0, goalsAgainst = 0;
    for (const m of teamMatches) {
      if (m.isTeamHome) { goalsFor += m.hg; goalsAgainst += m.ag; }
      else { goalsFor += m.ag; goalsAgainst += m.hg; }
    }

    const scored = calcPlayerScores(teamPlayerStats);
    const top5 = scored.slice(0, 5);

    const form = teamMatches.slice(-10).map(m => m.result);

    const xgData = teamMatches.map(m => {
      let xg = 0, goals = 0;
      for (const p of m.p) {
        xg += p.t.xgShot || 0;
        goals += p.t.goals || 0;
      }
      return { match: `${m.h.substring(0, 3)} v ${m.aw.substring(0, 3)}`, xG: +xg.toFixed(2), Goals: goals };
    }).slice(-15);

    const teamTotals = {};
    for (const ps of Object.values(teamPlayerStats)) {
      for (const [k, v] of Object.entries(ps.totals)) {
        teamTotals[k] = (teamTotals[k] || 0) + v;
      }
    }
    const totalMin = teamTotals.minutesOnField || 1;
    const p90 = v => +((v / totalMin) * 90).toFixed(1);

    const radarData = [
      { stat: 'Passing', value: Math.min(100, p90(teamTotals.successfulPasses || 0) * 0.3) },
      { stat: 'Progressive', value: Math.min(100, p90(teamTotals.progressivePasses || 0) * 2.5) },
      { stat: 'Shooting', value: Math.min(100, p90(teamTotals.shots || 0) * 5) },
      { stat: 'Defense', value: Math.min(100, p90(teamTotals.interceptions || 0) * 4) },
      { stat: 'Pressing', value: Math.min(100, p90(teamTotals.counterpressingRecoveries || 0) * 8) },
      { stat: 'Duels', value: Math.min(100, ((teamTotals.duelsWon||0)/(teamTotals.duels||1)) * 120) },
    ];

    const insights = generateTeamInsights(teamPlayerStats, teamMatches);

    // --- LAST MATCH STARTING XI ---
    const lastMatch = teamMatches[teamMatches.length - 1];
    let lastMatchXI = [];
    if (lastMatch) {
      const isHome = lastMatch.h.includes(selectedTeam);
      const teamP = lastMatch.p;
      
      const maxComp = Math.max(...scored.map(s => s.per90Scores.composite), 30);
      
      lastMatchXI = teamP
        .filter(p => p.t.matchesInStart > 0 || p.t.minutesOnField >= 60)
        .map(p => {
          const info = data.playerMap[p.id];
          const t = p.t;
          
          // Positional scoring
          const scoreObj = calcCompositeScore(t, info?.role?.code || '', p.pos || '');
          
          // Normalize to 0-100 scale based on the team's max composite score
          // We apply a per-match factor (since match stats are raw, not per90, but we can rough it if minutes >= 60)
          const matchFactor = t.minutesOnField > 0 ? 90 / t.minutesOnField : 1;
          const matchCompositePer90 = scoreObj.composite * matchFactor;
          const rating = Math.max(0, Math.min(100, Math.round((matchCompositePer90 / maxComp) * 100)));

          return {
            id: p.id,
            name: info?.shortName || `Player ${p.id}`,
            pos: p.posName,
            posCode: (p.pos || 'cmf').toLowerCase(),
            minutes: t.minutesOnField || 0,
            goals: t.goals || 0,
            assists: t.assists || 0,
            passAcc: t.passes > 0 ? ((t.successfulPasses || 0) / t.passes * 100).toFixed(0) : 0,
            rating,
          };
        })
        .sort((a, b) => {
          const posOrder = { gk: 0, lb: 1, lcb: 2, cb: 3, rcb: 4, rb: 5, lwb: 1, rwb: 5, ldmf: 6, dmf: 7, rdmf: 8, lmf: 9, lcmf: 10, cmf: 11, rcmf: 12, rmf: 13, lamf: 14, amf: 15, ramf: 16, lw: 17, rw: 18, lwf: 19, ss: 20, cf: 21, rwf: 22, fw: 23 };
          return (posOrder[a.posCode] || 99) - (posOrder[b.posCode] || 99);
        })
        .slice(0, 11);
    }

    // --- AI OPTIMAL XI ---
    const optimalXI = predictOptimalLineup(teamPlayerStats, teamMatches);

    return {
      wins, draws, losses, goalsFor, goalsAgainst, top5, form, xgData, radarData, insights,
      totalMatches: teamMatches.length, allMatches: matches.length, selectedTeam,
      lastMatchXI, optimalXI, lastMatch,
    };
  }, [data]);

  if (!stats) return null;

  const activeXI = lineupMode === 'last' ? stats.lastMatchXI : stats.optimalXI;

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>📊 Overview Dashboard</h2>
        <p>{stats.selectedTeam} — {stats.totalMatches} matches analyzed ({stats.allMatches} total in dataset)</p>
      </div>

      {/* Key Metrics */}
      <div className="grid-4">
        <div className="score-card emerald">
          <div className="label">Wins</div>
          <div className="value">{stats.wins}</div>
          <div className="sub">{((stats.wins / stats.totalMatches) * 100).toFixed(0)}% win rate</div>
        </div>
        <div className="score-card amber">
          <div className="label">Draws</div>
          <div className="value">{stats.draws}</div>
          <div className="sub">{((stats.draws / stats.totalMatches) * 100).toFixed(0)}% draw rate</div>
        </div>
        <div className="score-card coral">
          <div className="label">Losses</div>
          <div className="value">{stats.losses}</div>
          <div className="sub">{((stats.losses / stats.totalMatches) * 100).toFixed(0)}% loss rate</div>
        </div>
        <div className="score-card blue">
          <div className="label">Goal Difference</div>
          <div className="value">{stats.goalsFor - stats.goalsAgainst > 0 ? '+' : ''}{stats.goalsFor - stats.goalsAgainst}</div>
          <div className="sub">{stats.goalsFor} scored · {stats.goalsAgainst} conceded</div>
        </div>
      </div>

      {/* Form Guide */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <span className="card-title">Recent Form (Last 10)</span>
        </div>
        <div className="form-guide">
          {stats.form.map((r, i) => (
            <div key={i} className={`form-dot ${r}`}>{r}</div>
          ))}
        </div>
      </div>

      {/* Starting XI Formation */}
      {activeXI.length > 0 && (
        <div className="grid-2" style={{ marginBottom: 24 }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="card-title">Starting XI ({stats.lastMatch ? stats.lastMatch.label : ''})</span>
              <div style={{display: 'flex', gap: 8}}>
                <button 
                  onClick={() => setLineupMode('last')}
                  style={{
                    padding: '4px 12px', borderRadius: 4, border: 'none', cursor: 'pointer',
                    background: lineupMode === 'last' ? 'var(--accent-blue)' : 'rgba(255,255,255,0.1)',
                    color: lineupMode === 'last' ? '#000' : '#fff', fontWeight: 600, fontSize: 12
                  }}>
                  Last Match
                </button>
                <button 
                  onClick={() => setLineupMode('optimal')}
                  style={{
                    padding: '4px 12px', borderRadius: 4, border: 'none', cursor: 'pointer',
                    background: lineupMode === 'optimal' ? 'var(--accent-emerald)' : 'rgba(255,255,255,0.1)',
                    color: lineupMode === 'optimal' ? '#000' : '#fff', fontWeight: 600, fontSize: 12
                  }}>
                  ✨ AI Optimal
                </button>
              </div>
            </div>
            {/* Pitch */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, paddingTop: 20 }}>
              <FormationView players={activeXI} />
            </div>
          </div>
          
          <div className="card">
            <div className="card-header"><span className="card-title">Starting XI Ratings</span></div>
            <div style={{ maxHeight: 420, overflowY: 'auto' }}>
              <table className="data-table">
                <thead><tr><th>Player</th><th>Pos</th><th>Rating</th><th>G</th><th>A</th><th>Pass%</th><th>Min</th></tr></thead>
                <tbody>
                  {activeXI.map(p => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</td>
                      <td><span className="badge" style={{ background: 'var(--accent-blue-dim)', color: 'var(--accent-blue)' }}>{(p.posCode || '').toUpperCase()}</span></td>
                      <td style={{ fontWeight: 700, color: p.rating > 60 ? 'var(--accent-emerald)' : p.rating > 40 ? 'var(--accent-amber)' : 'var(--accent-coral)' }}>{p.rating}</td>
                      <td>{p.goals || '-'}</td>
                      <td>{p.assists || '-'}</td>
                      <td>{p.passAcc}%</td>
                      <td>{p.minutes}'</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="grid-2">
        {/* xG Chart */}
        <div className="card">
          <div className="card-header"><span className="card-title">Goals vs Expected Goals (xG)</span></div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stats.xgData} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,140,255,0.08)" />
              <XAxis dataKey="match" tick={{ fontSize: 10, fill: '#5a6480' }} />
              <YAxis tick={{ fontSize: 10, fill: '#5a6480' }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="Goals" fill="#00ff88" radius={[3, 3, 0, 0]} />
              <Bar dataKey="xG" fill="#00d4ff" opacity={0.6} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Team Radar */}
        <div className="card">
          <div className="card-header"><span className="card-title">Team Profile</span></div>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={stats.radarData}>
              <PolarGrid stroke="rgba(99,140,255,0.15)" />
              <PolarAngleAxis dataKey="stat" tick={{ fontSize: 11, fill: '#8892a8' }} />
              <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />
              <Radar dataKey="value" stroke="#00d4ff" fill="#00d4ff" fillOpacity={0.2} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Players + AI Insights */}
      <div className="grid-2">
        <div className="card">
          <div className="card-header"><span className="card-title">Top 5 Performers</span></div>
          <table className="data-table">
            <thead>
              <tr><th>#</th><th>Player</th><th>Pos</th><th>Rating</th><th>Matches</th><th>Mins</th></tr>
            </thead>
            <tbody>
              {stats.top5.map((p, i) => (
                <tr key={p.id}>
                  <td style={{ color: 'var(--accent-blue)', fontWeight: 700 }}>{i + 1}</td>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</td>
                  <td><span className="badge" style={{ background: 'var(--accent-blue-dim)', color: 'var(--accent-blue)' }}>{p.roleCode}</span></td>
                  <td style={{ fontWeight: 700, color: p.rating > 75 ? 'var(--accent-emerald)' : p.rating > 50 ? 'var(--accent-amber)' : 'var(--text-primary)' }}>{p.rating}</td>
                  <td>{p.matchCount}</td>
                  <td>{p.minutesPlayed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="ai-panel">
          <div className="ai-header">🧠 AI Coach Insights</div>
          {stats.insights.slice(0, 4).map((ins, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: ins.type === 'strength' ? 'var(--accent-emerald)' : ins.type === 'weakness' ? 'var(--accent-coral)' : 'var(--accent-blue)', marginBottom: 4 }}>
                {ins.title}
              </div>
              <div className="ai-text" dangerouslySetInnerHTML={{ __html: ins.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
