import { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { generateScoutingReport } from '../analytics/opponentScouting';

export default function Scouting() {
  const { data } = useData();
  const [selectedOpponent, setSelectedOpponent] = useState('');

  // Extract unique opponents from the matches data
  const opponents = useMemo(() => {
    if (!data) return [];
    const opps = new Set();
    data.matches.forEach(m => {
      if (m.h !== data.selectedTeam) opps.add(m.h);
      if (m.aw !== data.selectedTeam) opps.add(m.aw);
    });
    return Array.from(opps).sort();
  }, [data]);

  // Set default opponent when loaded
  if (!selectedOpponent && opponents.length > 0) {
    setSelectedOpponent(opponents[0]);
  }

  const report = useMemo(() => {
    if (!selectedOpponent) return null;
    return generateScoutingReport(selectedOpponent);
  }, [selectedOpponent]);

  if (!data || !report) return null;

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2>🕵️ Next Opponent Scouting</h2>
          <p>AI-generated tactical dossiers for upcoming fixtures</p>
        </div>
        <div>
          <button 
            onClick={() => window.print()}
            className="filter-select"
            style={{ background: 'var(--accent-purple)', color: '#fff', border: 'none' }}
          >
            🖨️ Export PDF Report
          </button>
        </div>
      </div>

      <div className="filter-bar" style={{ marginBottom: 24 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>Select Opponent: </span>
        <select 
          className="filter-select" 
          value={selectedOpponent} 
          onChange={e => setSelectedOpponent(e.target.value)}
          style={{ minWidth: 250, fontSize: 16 }}
        >
          {opponents.map(opp => (
            <option key={opp} value={opp}>{opp}</option>
          ))}
        </select>
      </div>

      <div className="grid-2">
        {/* Dossier Overview */}
        <div className="card" style={{ borderLeft: '4px solid var(--accent-purple)' }}>
          <div className="card-header"><span className="card-title">Tactical Profile: {report.team}</span></div>
          <div className="grid-2" style={{ marginBottom: 20 }}>
            <div className="metric-card">
              <div className="metric-label">Primary Formation</div>
              <div className="metric-value">{report.formation}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Play Style</div>
              <div className="metric-value" style={{ fontSize: 16 }}>{report.style}</div>
            </div>
          </div>
          
          <div style={{ marginBottom: 16 }}>
            <h4 style={{ color: 'var(--accent-emerald)', marginBottom: 8, fontSize: 14 }}>🟢 Key Strengths</h4>
            <ul style={{ paddingLeft: 20, color: 'var(--text-primary)', fontSize: 13, lineHeight: 1.6 }}>
              {report.strengths.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
          
          <div>
            <h4 style={{ color: 'var(--accent-coral)', marginBottom: 8, fontSize: 14 }}>🔴 Exploitable Weaknesses</h4>
            <ul style={{ paddingLeft: 20, color: 'var(--text-primary)', fontSize: 13, lineHeight: 1.6 }}>
              {report.weaknesses.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
        </div>

        {/* AI Blueprint & Key Players */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="ai-panel">
            <div className="ai-header">🧠 AI Tactical Blueprint</div>
            <div className="ai-text" style={{ fontSize: 14, lineHeight: 1.7 }}>
              {report.tacticalAdvice}
            </div>
          </div>

          <div className="card" style={{ flex: 1 }}>
            <div className="card-header"><span className="card-title">Opposition Key Threats</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {report.keyPlayers.map((kp, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontWeight: 700, color: 'var(--accent-blue)', marginBottom: 4 }}>{kp.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{kp.threat}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
