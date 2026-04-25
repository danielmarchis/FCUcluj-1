import { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import { analyzeBallLosses } from '../analytics/ballLossAnalysis';
import { analyzeLineBreaks } from '../analytics/lineBreaks';
import { detectPatterns } from '../analytics/tacticalPatterns';
import { generateTeamInsights } from '../analytics/aiCoach';
import { analyzeExpectedMetrics, analyzePPDA, analyzeTransitions, analyzeSetPieces, analyzeProgressivePasses, analyzePhysicalMetrics } from '../analytics/advancedMetrics';
import FootballPitch from '../components/viz/FootballPitch';
import VideoModal from '../components/VideoModal';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, LineChart, Line,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <div className="label">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="value" style={{ color: p.color }}>{p.name}: {typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</div>
      ))}
    </div>
  );
};

export default function TacticalInsights() {
  const { data } = useData();
  const [activeTab, setActiveTab] = useState('losses');
  const [heatmapPlayer, setHeatmapPlayer] = useState('');
  const [videoOpen, setVideoOpen] = useState(false);
  const [videoTitle, setVideoTitle] = useState('');

  const openVideo = (title) => {
    setVideoTitle(title);
    setVideoOpen(true);
  };

  const analysis = useMemo(() => {
    if (!data) return null;
    const losses = analyzeBallLosses(data.teamPlayerStats, data.teamMatches, data.selectedTeam, heatmapPlayer ? +heatmapPlayer : null);
    const lineBreaks = analyzeLineBreaks(data.teamPlayerStats);
    const patterns = detectPatterns(data.teamMatches, data.selectedTeam);
    const insights = generateTeamInsights(data.teamPlayerStats, data.teamMatches, data.selectedTeam);
    const xgAnalysis = analyzeExpectedMetrics(data.teamMatches, data.teamPlayerStats, data.selectedTeam);
    const ppda = analyzePPDA(data.teamMatches, data.selectedTeam);
    const transitions = analyzeTransitions(data.teamMatches, data.selectedTeam);
    const setPieces = analyzeSetPieces(data.teamMatches, data.teamPlayerStats, data.selectedTeam);
    const progressive = analyzeProgressivePasses(data.teamPlayerStats);
    const physical = analyzePhysicalMetrics(data.teamPlayerStats);
    return { losses, lineBreaks, patterns, insights, xgAnalysis, ppda, transitions, setPieces, progressive, physical };
  }, [data, heatmapPlayer]);

  const playerList = useMemo(() => {
    if (!data) return [];
    return Object.values(data.teamPlayerStats)
      .filter(p => p.minutesPlayed >= 90)
      .sort((a, b) => b.minutesPlayed - a.minutesPlayed);
  }, [data]);

  if (!analysis) return null;

  const tabs = [
    { id: 'losses', label: '🔴 Ball Losses' },
    { id: 'linebreaks', label: '⚡ Line Breaks' },
    { id: 'patterns', label: '📐 Attack Patterns' },
    { id: 'aicoach', label: '🧠 AI Coach' },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>🧠 Tactical Insights</h2>
        <p>Ball loss zones, line-breaking actions, attacking patterns, advanced metrics & AI recommendations</p>
      </div>

      <div className="tabs">
        {tabs.map(t => (
          <button key={t.id} className={`tab${activeTab === t.id ? ' active' : ''}`} onClick={() => setActiveTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Ball Loss Tab */}
      {activeTab === 'losses' && (
        <>
          {/* Player filter */}
          <div className="filter-bar">
            <select className="filter-select" value={heatmapPlayer} onChange={e => setHeatmapPlayer(e.target.value)}>
              <option value="">All Players (Team)</option>
              {playerList.map(p => (
                <option key={p.id} value={p.id}>{p.name} — {p.role} ({p.minutesPlayed} min)</option>
              ))}
            </select>
          </div>
          <div className="grid-2">
            <div className="card">
              <div className="card-header"><span className="card-title">Turnover Heatmap {heatmapPlayer ? `— ${playerList.find(p => p.id === +heatmapPlayer)?.name || ''}` : '— All Players'}</span></div>
              <FootballPitch heatmapData={analysis.losses.heatmapData} gridRows={analysis.losses.gridRows} gridCols={analysis.losses.gridCols} mode="loss" />
            </div>
            <div className="card">
              <div className="card-header"><span className="card-title">Top Ball Losers (Per 90)</span></div>
              <div style={{ maxHeight: 420, overflowY: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr><th>Player</th><th>Pos</th><th>Losses/90</th><th>Dangerous/90</th><th>Total</th><th>Clip</th></tr>
                  </thead>
                  <tbody>
                    {analysis.losses.playerLosses.slice(0, 15).map(p => (
                      <tr key={p.id} onClick={() => setHeatmapPlayer(String(p.id))} style={{ cursor: 'pointer', background: heatmapPlayer === String(p.id) ? 'var(--accent-blue-dim)' : 'transparent' }}>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</td>
                        <td>{p.role}</td>
                        <td>{p.lossesP90}</td>
                        <td style={{ color: p.dangerousP90 > 0.5 ? 'var(--accent-coral)' : 'var(--text-secondary)' }}>{p.dangerousP90}</td>
                        <td>{p.totalLosses}</td>
                        <td>
                          <button onClick={(e) => { e.stopPropagation(); openVideo(`Turnover Analysis: ${p.name}`); }} 
                            style={{ background: 'rgba(0,212,255,0.1)', border: 'none', color: '#00d4ff', padding: '2px 8px', borderRadius: 4, cursor: 'pointer', fontSize: 10 }}>
                            ▶ Watch
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* xG/xA/xT Analysis */}
          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-header"><span className="card-title">xG / xA / xT Trends</span></div>
            <div className="grid-4" style={{ marginBottom: 16 }}>
              <div className="metric-card"><div className="metric-label">Total xG</div><div className="metric-value">{analysis.xgAnalysis.totals.xg}</div></div>
              <div className="metric-card"><div className="metric-label">Total xA</div><div className="metric-value">{analysis.xgAnalysis.totals.xa}</div></div>
              <div className="metric-card"><div className="metric-label">xG Over/Under</div><div className="metric-value" style={{ color: analysis.xgAnalysis.xgOverperformance > 0 ? '#00ff88' : '#ff4757' }}>{analysis.xgAnalysis.xgOverperformance > 0 ? '+' : ''}{analysis.xgAnalysis.xgOverperformance}</div></div>
              <div className="metric-card"><div className="metric-label">Shot Accuracy</div><div className="metric-value">{analysis.xgAnalysis.averages.shotAccuracy}%</div></div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={analysis.xgAnalysis.perMatch.slice(-20)}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,140,255,0.08)" />
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#5a6480' }} />
                <YAxis tick={{ fontSize: 10, fill: '#5a6480' }} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="xg" stroke="#00d4ff" strokeWidth={2} dot={{ r: 2 }} name="xG" />
                <Line type="monotone" dataKey="goals" stroke="#00ff88" strokeWidth={2} dot={{ r: 2 }} name="Goals" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-header"><span className="card-title">Ball Losses Per Match</span></div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={analysis.losses.matchTrends.slice(-20)}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,140,255,0.08)" />
                <XAxis dataKey="label" tick={{ fontSize: 8, fill: '#5a6480' }} angle={-30} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 10, fill: '#5a6480' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="totalLosses" fill="#ff4757" opacity={0.7} radius={[3, 3, 0, 0]} name="Total Losses" />
                <Bar dataKey="dangerousLosses" fill="#ffb800" radius={[3, 3, 0, 0]} name="Dangerous" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* Line Breaks Tab */}
      {activeTab === 'linebreaks' && (
        <>
          <div className="grid-2">
            <div className="card">
              <div className="card-header"><span className="card-title">Line-Breaking Leaders (Score/90)</span></div>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={analysis.lineBreaks.slice(0, 12)} layout="vertical" barSize={14}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,140,255,0.08)" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#5a6480' }} />
                  <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11, fill: '#8892a8' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="scoreP90" radius={[0, 4, 4, 0]} name="Score/90">
                    {analysis.lineBreaks.slice(0, 12).map((_, i) => (
                      <Cell key={i} fill={i < 3 ? '#00d4ff' : i < 6 ? '#00ff88' : '#5a6480'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="card">
              <div className="card-header"><span className="card-title">Line-Break Action Breakdown</span></div>
              <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr><th>Player</th><th>Through</th><th>Smart</th><th>Progressive</th><th>Runs</th><th>Score</th><th>Clip</th></tr>
                  </thead>
                  <tbody>
                    {analysis.lineBreaks.slice(0, 15).map(p => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</td>
                        <td style={{ color: 'var(--accent-coral)' }}>{p.successfulThroughPasses}</td>
                        <td style={{ color: 'var(--accent-amber)' }}>{p.successfulSmartPasses}</td>
                        <td style={{ color: 'var(--accent-blue)' }}>{p.successfulProgressivePasses}</td>
                        <td style={{ color: 'var(--accent-emerald)' }}>{p.progressiveRuns}</td>
                        <td style={{ fontWeight: 700 }}>{p.scoreP90}</td>
                        <td>
                          <button onClick={() => openVideo(`Line Break: ${p.name}`)} 
                            style={{ background: 'rgba(0,255,136,0.1)', border: 'none', color: '#00ff88', padding: '2px 8px', borderRadius: 4, cursor: 'pointer', fontSize: 10 }}>
                            ▶ Watch
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Progressive Pass Analysis */}
          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-header"><span className="card-title">Progressive Play Leaders (Per 90)</span></div>
            <div style={{ maxHeight: 350, overflowY: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr><th>Player</th><th>Pos</th><th>Prog.Pass/90</th><th>Accuracy</th><th>Runs/90</th><th>FT Pass Acc</th><th>Total/90</th></tr>
                </thead>
                <tbody>
                  {analysis.progressive.slice(0, 15).map(p => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</td>
                      <td>{p.role}</td>
                      <td style={{ color: 'var(--accent-blue)' }}>{p.progPassesP90}</td>
                      <td>{p.progPassAccuracy}%</td>
                      <td style={{ color: 'var(--accent-emerald)' }}>{p.progRunsP90}</td>
                      <td>{p.ftPassAccuracy}%</td>
                      <td style={{ fontWeight: 700, color: 'var(--accent-amber)' }}>{p.totalProgressiveP90}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Attack Patterns Tab */}
      {activeTab === 'patterns' && (
        <>
          <div className="grid-2">
            <div className="card">
              <div className="card-header"><span className="card-title">Attacking Pattern Distribution</span></div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={analysis.patterns.clusters.map(c => ({ name: c.name, value: c.matchCount, fill: c.color }))}
                    cx="50%" cy="50%" outerRadius={100} innerRadius={50}
                    dataKey="value" label={({ name, value }) => `${name} (${value})`}
                    labelLine={{ stroke: '#5a6480' }}
                  >
                    {analysis.patterns.clusters.map((c, i) => <Cell key={i} fill={c.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="card">
              <div className="card-header"><span className="card-title">Pattern Descriptions</span></div>
              {analysis.patterns.clusters.map(c => (
                <div key={c.id} style={{ marginBottom: 16, padding: '12px 16px', background: `${c.color}15`, border: `1px solid ${c.color}30`, borderRadius: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: c.color, marginBottom: 4 }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    Found in <strong>{c.matchCount}</strong> matches. {
                      c.name === 'Build-Up Play' ? 'Patient possession with short passing combinations to progress through thirds.' :
                      c.name === 'Counter-Attack' ? 'Quick vertical transitions exploiting space behind opposition lines.' :
                      c.name === 'Direct Play' ? 'Fast forward ball movement with fewer passes to reach the box.' :
                      'Wide attacks utilizing crossing and width to create chances from flanks.'
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* PPDA & Transition metrics */}
          <div className="grid-2" style={{ marginTop: 16 }}>
            <div className="card">
              <div className="card-header"><span className="card-title">PPDA — Pressing Intensity</span></div>
              <div className="metric-card" style={{ textAlign: 'center', marginBottom: 16 }}>
                <div className="metric-label">Average PPDA</div>
                <div className="metric-value" style={{ fontSize: 32 }}>{analysis.ppda.avgPPDA}</div>
                <div style={{ fontSize: 12, color: analysis.ppda.interpretation === 'High Press' ? '#00ff88' : analysis.ppda.interpretation === 'Medium Press' ? '#ffb800' : '#ff4757' }}>{analysis.ppda.interpretation}</div>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={analysis.ppda.perMatch.slice(-15)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,140,255,0.08)" />
                  <XAxis dataKey="label" tick={{ fontSize: 8, fill: '#5a6480' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#5a6480' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="ppda" radius={[3, 3, 0, 0]} name="PPDA">
                    {analysis.ppda.perMatch.slice(-15).map((m, i) => (
                      <Cell key={i} fill={m.ppda < 8 ? '#00ff88' : m.ppda < 12 ? '#ffb800' : '#ff4757'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="card">
              <div className="card-header"><span className="card-title">Transition Efficiency</span></div>
              <div className="grid-2" style={{ marginBottom: 12 }}>
                <div className="metric-card"><div className="metric-label">Recovery→Shot Rate</div><div className="metric-value">{analysis.transitions.avgTransitionRate}%</div></div>
                <div className="metric-card"><div className="metric-label">Counter-Press Rate</div><div className="metric-value">{analysis.transitions.avgCounterpressRate}%</div></div>
              </div>
              <div className="grid-2">
                <div className="metric-card"><div className="metric-label">High Recovery Rate</div><div className="metric-value">{analysis.transitions.highPressRecoveryRate}%</div></div>
                <div className="metric-card"><div className="metric-label">Total Recoveries</div><div className="metric-value">{analysis.transitions.totals.recoveries}</div></div>
              </div>
            </div>
          </div>

          {/* Set Pieces & Physical */}
          <div className="grid-2" style={{ marginTop: 16 }}>
            <div className="card">
              <div className="card-header"><span className="card-title">Set Piece Effectiveness</span></div>
              <div className="grid-2" style={{ marginBottom: 12 }}>
                <div className="metric-card"><div className="metric-label">Corners/Match</div><div className="metric-value">{analysis.setPieces.averages.cornersPerMatch}</div></div>
                <div className="metric-card"><div className="metric-label">Penalty Conv.</div><div className="metric-value">{analysis.setPieces.penaltyConversion}%</div></div>
              </div>
              {analysis.setPieces.setPieceTakers.length > 0 && (
                <table className="data-table">
                  <thead><tr><th>Taker</th><th>Corners</th><th>FKs</th><th>Pens</th></tr></thead>
                  <tbody>
                    {analysis.setPieces.setPieceTakers.slice(0, 5).map(p => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</td>
                        <td>{p.corners}</td>
                        <td>{p.freeKicks}</td>
                        <td>{p.penalties}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="card">
              <div className="card-header"><span className="card-title">Physical Metrics & Injury Risk</span></div>
              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                <table className="data-table">
                  <thead><tr><th>Player</th><th>Workload/90</th><th>Duels/90</th><th>Risk</th></tr></thead>
                  <tbody>
                    {analysis.physical.slice(0, 10).map(p => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</td>
                        <td>{p.workloadP90}</td>
                        <td>{p.duelsP90}</td>
                        <td>
                          <span className={`badge badge-risk-${p.riskLevel.toLowerCase()}`}>
                            {p.riskLevel} ({p.injuryRisk})
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-header"><span className="card-title">Match Pattern Assignments</span></div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {analysis.patterns.matchAssignments.map((ma, i) => (
                <div key={i} style={{ padding: '8px 14px', background: `${ma.patternColor}15`, border: `1px solid ${ma.patternColor}30`, borderRadius: 8, fontSize: 12 }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{ma.label}</div>
                  <div style={{ color: 'var(--text-muted)', marginTop: 2 }}>{ma.score} · <span style={{ color: ma.patternColor }}>{ma.patternName}</span></div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* AI Coach Tab */}
      {activeTab === 'aicoach' && (
        <div className="ai-coach-grid">
          <div className="ai-panel" style={{ gridColumn: '1 / -1' }}>
            <div className="ai-header">🧠 AI Coach — Full Tactical Analysis & Improvement Plan</div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
              Comprehensive analysis covering scoring efficiency, progressive play, pressing, transitions, set pieces, and physical performance. Each insight includes diagnosis, recommendations, and training drills.
            </p>
          </div>
          {analysis.insights.map((ins, i) => (
            <div key={i} className="ai-insight-card" style={{ borderLeftColor: ins.type === 'strength' ? 'var(--accent-emerald)' : ins.type === 'weakness' ? 'var(--accent-coral)' : ins.type === 'highlight' ? 'var(--accent-amber)' : 'var(--accent-blue)' }}>
              <div style={{
                fontSize: 14, fontWeight: 700, marginBottom: 8,
                color: ins.type === 'strength' ? 'var(--accent-emerald)' :
                  ins.type === 'weakness' ? 'var(--accent-coral)' :
                  ins.type === 'highlight' ? 'var(--accent-amber)' : 'var(--accent-blue)'
              }}>
                {ins.title}
              </div>
              <div className="ai-text" dangerouslySetInnerHTML={{ __html: ins.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
              {ins.recommendation && (
                <div className="ai-recommendation">
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-purple)', marginBottom: 4 }}>📋 RECOMMENDATION</div>
                  <div className="ai-text" dangerouslySetInnerHTML={{ __html: ins.recommendation.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                </div>
              )}
              {ins.drill && (
                <div className="ai-drill">
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-emerald)', marginBottom: 4 }}>🏋️ TRAINING DRILL</div>
                  <div className="ai-text">{ins.drill}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      <VideoModal isOpen={videoOpen} onClose={() => setVideoOpen(false)} title={videoTitle} />
    </div>
  );
}
