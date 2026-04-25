import { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { generateActivityHeatmap } from '../analytics/ballLossAnalysis';
import { calcPlayerScores, calcCompositeScore } from '../analytics/playerScoring';
import FootballPitch from '../components/viz/FootballPitch';

const STAT_CATEGORIES = {
  'Passing': ['passes', 'successfulPasses', 'progressivePasses', 'successfulProgressivePasses', 'forwardPasses', 'successfulForwardPasses', 'backPasses', 'successfulBackPasses', 'lateralPasses', 'successfulLateralPasses', 'longPasses', 'successfulLongPasses', 'smartPasses', 'successfulSmartPasses', 'throughPasses', 'successfulThroughPasses', 'keyPasses', 'successfulKeyPasses', 'verticalPasses', 'successfulVerticalPasses', 'passesToFinalThird', 'successfulPassesToFinalThird', 'crosses', 'successfulCrosses'],
  'Shooting': ['shots', 'shotsOnTarget', 'headShots', 'shotsBlocked', 'goals', 'xgShot', 'xgAssist'],
  'Defending': ['duels', 'duelsWon', 'defensiveDuels', 'defensiveDuelsWon', 'aerialDuels', 'aerialDuelsWon', 'interceptions', 'recoveries', 'opponentHalfRecoveries', 'dangerousOpponentHalfRecoveries', 'counterpressingRecoveries', 'clearances', 'slidingTackles', 'successfulSlidingTackles'],
  'Dribbling': ['dribbles', 'successfulDribbles', 'progressiveRun', 'offensiveDuels', 'offensiveDuelsWon'],
  'Physical': ['accelerations', 'pressingDuels', 'pressingDuelsWon', 'looseBallDuels', 'looseBallDuelsWon', 'fouls', 'foulsSuffered'],
  'Discipline': ['yellowCards', 'redCards', 'directRedCards', 'losses', 'ownHalfLosses', 'dangerousOwnHalfLosses'],
};

function formatStatName(key) {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).replace(/P 90/g, '/90');
}

export default function MatchExplorer() {
  const { data } = useData();
  const [filterTeam, setFilterTeam] = useState('Universitatea Cluj');
  const [filterResult, setFilterResult] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const [detailTab, setDetailTab] = useState('overview');
  const [statCategory, setStatCategory] = useState('Passing');

  const filtered = useMemo(() => {
    if (!data) return [];
    let matchesList = data.matches;
    if (filterTeam) {
      matchesList = matchesList.filter(m => m.h.includes(filterTeam) || m.aw.includes(filterTeam));
    }
    if (filterResult && filterTeam) {
      matchesList = matchesList.filter(m => {
        const isHome = m.h.includes(filterTeam);
        const gf = isHome ? m.hg : m.ag;
        const ga = isHome ? m.ag : m.hg;
        const result = gf > ga ? 'W' : gf < ga ? 'L' : 'D';
        return result === filterResult;
      });
    }
    return matchesList;
  }, [data, filterTeam, filterResult]);

  const selected = useMemo(() => {
    if (selectedIdx === null && filtered.length > 0) return filtered[0];
    return data?.matches[selectedIdx] || filtered[0];
  }, [data, selectedIdx, filtered]);

  const matchStats = useMemo(() => {
    if (!selected || !data) return null;
    const isHome = filterTeam ? selected.h.includes(filterTeam) : true;
    const teamPlayers = selected.p;
    const oppPlayers = [];

    const scored = calcPlayerScores(data.teamPlayerStats);
    const maxComp = Math.max(...scored.map(s => s.per90Scores.composite), 30);

    const playerRatings = teamPlayers.map(p => {
      const info = data.playerMap[p.id];
      const t = p.t;
      
      const scoreObj = calcCompositeScore(t, info?.role?.code || '', p.pos || '');
      const matchFactor = t.minutesOnField > 0 ? 90 / t.minutesOnField : 1;
      const matchCompositePer90 = scoreObj.composite * matchFactor;
      const rating = Math.max(0, Math.min(100, Math.round((matchCompositePer90 / maxComp) * 100)));

      return {
        id: p.id, raw: p,
        name: info?.shortName || `Player ${p.id}`,
        fullName: info ? `${info.firstName || ''} ${info.lastName || ''}`.trim() : `Player ${p.id}`,
        pos: p.posName || 'Unknown',
        posCode: (p.pos || '').toUpperCase(),
        minutes: t.minutesOnField || 0,
        goals: t.goals || 0, assists: t.assists || 0,
        passes: t.passes || 0,
        passAcc: t.passes > 0 ? ((t.successfulPasses || 0) / t.passes * 100).toFixed(0) : 0,
        duelsWon: t.duelsWon || 0, recoveries: t.recoveries || 0,
        xg: (t.xgShot || 0).toFixed(2), shots: t.shots || 0,
        rating,
        stats: t,
      };
    }).filter(p => p.minutes > 0).sort((a, b) => b.rating - a.rating);

    // Stat comparison bars
    const statBars = [
      { label: 'Passes', key: 'passes' }, { label: 'Forward Passes', key: 'forwardPasses' },
      { label: 'Shots', key: 'shots' }, { label: 'xG', key: 'xgShot' },
      { label: 'Duels Won', key: 'duelsWon' }, { label: 'Recoveries', key: 'recoveries' },
      { label: 'Progressive Passes', key: 'progressivePasses' }, { label: 'Ball Losses', key: 'losses' },
    ];

    const homeTotals = {}, awayTotals = {};
    for (const p of (isHome ? teamPlayers : oppPlayers)) for (const [k, v] of Object.entries(p.t)) homeTotals[k] = (homeTotals[k] || 0) + (v || 0);
    for (const p of (isHome ? oppPlayers : teamPlayers)) for (const [k, v] of Object.entries(p.t)) awayTotals[k] = (awayTotals[k] || 0) + (v || 0);

    const statComparison = statBars.map(s => {
      const hv = homeTotals[s.key] || 0;
      const av = awayTotals[s.key] || 0;
      const max = Math.max(hv, av, 1);
      return { label: s.label, home: +hv.toFixed(1), away: +av.toFixed(1), homeP: (hv / max) * 100, awayP: (av / max) * 100 };
    });

    // Team heatmap
    const teamHeatmap = generateActivityHeatmap([selected], null, filterTeam || selected.h, true);
    
    return { playerRatings, statComparison, teamHeatmap };
  }, [selected, data, filterTeam]);

  const selectedPlayerDetail = useMemo(() => {
    if (!selectedPlayerId || !matchStats) return null;
    return matchStats.playerRatings.find(p => p.id === selectedPlayerId);
  }, [selectedPlayerId, matchStats]);

  const playerHeatmap = useMemo(() => {
    if (!selectedPlayerId || !selected) return null;
    return generateActivityHeatmap([selected], selectedPlayerId);
  }, [selectedPlayerId, selected]);

  if (!data) return null;

  const getResultBadge = (m) => {
    if (!filterTeam) return null;
    const isHome = m.h.includes(filterTeam);
    const gf = isHome ? m.hg : m.ag;
    const ga = isHome ? m.ag : m.hg;
    const res = gf > ga ? 'W' : gf < ga ? 'L' : 'D';
    return <span className={`badge badge-${res === 'W' ? 'win' : res === 'L' ? 'loss' : 'draw'}`}>{res}</span>;
  };

  const detailTabs = [
    { id: 'overview', label: '📊 Overview' },
    { id: 'heatmap', label: '🔥 Heatmaps' },
    { id: 'stats', label: '📋 Detailed Stats' },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>🏟️ Match Explorer</h2>
        <p>Browse matches, team & player heatmaps, ratings, and detailed statistics</p>
      </div>

      <div className="filter-bar">
        <select className="filter-select" value={filterTeam} onChange={e => { setFilterTeam(e.target.value); setSelectedIdx(null); }}>
          <option value="">All Teams</option>
          {data.teams.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select className="filter-select" value={filterResult} onChange={e => setFilterResult(e.target.value)} disabled={!filterTeam}>
          <option value="">All Results</option>
          <option value="W">Wins</option><option value="D">Draws</option><option value="L">Losses</option>
        </select>
      </div>

      <div className="grid-1-2">
        {/* Match List */}
        <div className="card" style={{ maxHeight: 600, overflowY: 'auto' }}>
          <div className="card-header"><span className="card-title">Matches ({filtered.length})</span></div>
          {filtered.map(m => (
            <div key={m.idx} className={`match-card${selectedIdx === m.idx ? ' selected' : ''}`} onClick={() => { setSelectedIdx(m.idx); setSelectedPlayerId(null); setDetailTab('overview'); }}>
              <div className="teams">
                <span style={{ fontWeight: filterTeam && m.h.includes(filterTeam) ? 700 : 400 }}>{m.h}</span>
                <span className="score-badge">{m.scoreLabel}</span>
                <span style={{ fontWeight: filterTeam && m.aw.includes(filterTeam) ? 700 : 400 }}>{m.aw}</span>
              </div>
              {getResultBadge(m)}
            </div>
          ))}
        </div>

        {/* Match Detail */}
        <div>
          {selected && matchStats && (
            <>
              <div className="card" style={{ marginBottom: 12 }}>
                <div style={{ textAlign: 'center', marginBottom: 12 }}>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{selected.h} <span style={{ color: 'var(--accent-blue)' }}>{selected.scoreLabel}</span> {selected.aw}</div>
                  {getResultBadge(selected) && <div style={{ marginTop: 6 }}>{getResultBadge(selected)}</div>}
                </div>
                {/* Sub-tabs */}
                <div className="tabs" style={{ marginBottom: 12 }}>
                  {detailTabs.map(t => (
                    <button key={t.id} className={`tab${detailTab === t.id ? ' active' : ''}`} onClick={() => setDetailTab(t.id)} style={{ fontSize: 12, padding: '6px 14px' }}>{t.label}</button>
                  ))}
                </div>

                {/* OVERVIEW TAB */}
                {detailTab === 'overview' && (
                  <>
                    <div className="card-title" style={{ marginBottom: 12 }}>Team Comparison</div>
                    {matchStats.statComparison.map(s => (
                      <div key={s.label} style={{ marginBottom: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                          <span style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>{s.home}</span>
                          <span style={{ color: 'var(--text-muted)' }}>{s.label}</span>
                          <span style={{ color: 'var(--accent-coral)', fontWeight: 600 }}>{s.away}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 4, height: 6 }}>
                          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
                            <div style={{ width: `${s.homeP}%`, height: '100%', background: 'var(--accent-blue)', borderRadius: 3, transition: 'width 0.5s' }} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ width: `${s.awayP}%`, height: '100%', background: 'var(--accent-coral)', borderRadius: 3, transition: 'width 0.5s' }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {/* HEATMAP TAB */}
                {detailTab === 'heatmap' && (
                  <>
                    <div className="grid-2" style={{ gap: 12 }}>
                      <div>
                        <div className="card-title" style={{ marginBottom: 8 }}>{filterTeam || selected.h} Team Heatmap</div>
                        <FootballPitch heatmapData={matchStats.teamHeatmap.heatmapData} gridRows={matchStats.teamHeatmap.gridRows} gridCols={matchStats.teamHeatmap.gridCols} mode="activity" />
                      </div>
                      <div>
                        {selectedPlayerId && playerHeatmap ? (
                          <>
                            <div className="card-title" style={{ marginBottom: 8 }}>{selectedPlayerDetail?.name} Heatmap</div>
                            <FootballPitch heatmapData={playerHeatmap.heatmapData} gridRows={playerHeatmap.gridRows} gridCols={playerHeatmap.gridCols} mode="activity" />
                          </>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: 13 }}>
                            ← Select a player to see their heatmap
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <div className="card-title" style={{ marginBottom: 8 }}>Select Player for Heatmap</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {matchStats.playerRatings.map(p => (
                          <button key={p.id} className={`btn ${selectedPlayerId === p.id ? 'btn-primary' : 'btn-ghost'}`}
                            style={{ fontSize: 11, padding: '4px 10px' }}
                            onClick={() => setSelectedPlayerId(p.id)}>
                            {p.name} <span style={{ opacity: 0.6 }}>({p.posCode})</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* DETAILED STATS TAB */}
                {detailTab === 'stats' && (
                  <>
                    <div className="filter-bar" style={{ marginBottom: 12 }}>
                      <select className="filter-select" value={selectedPlayerId || ''} onChange={e => setSelectedPlayerId(e.target.value ? +e.target.value : null)} style={{ minWidth: 200 }}>
                        <option value="">Select player...</option>
                        {matchStats.playerRatings.map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.posCode}) — Rating: {p.rating}</option>
                        ))}
                      </select>
                      <select className="filter-select" value={statCategory} onChange={e => setStatCategory(e.target.value)}>
                        {Object.keys(STAT_CATEGORIES).map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    {selectedPlayerDetail ? (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, padding: 12, background: 'var(--accent-blue-dim)', borderRadius: 8 }}>
                          <div className="player-avatar">{(selectedPlayerDetail.name || '?')[0]}</div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>{selectedPlayerDetail.name}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{selectedPlayerDetail.pos} · {selectedPlayerDetail.minutes} min · Rating: <span style={{ color: selectedPlayerDetail.rating > 60 ? 'var(--accent-emerald)' : 'var(--accent-amber)', fontWeight: 700 }}>{selectedPlayerDetail.rating}</span></div>
                          </div>
                          <div style={{ marginLeft: 'auto', display: 'flex', gap: 16 }}>
                            <div style={{ textAlign: 'center' }}><div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent-emerald)' }}>{selectedPlayerDetail.goals}</div><div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Goals</div></div>
                            <div style={{ textAlign: 'center' }}><div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent-blue)' }}>{selectedPlayerDetail.assists}</div><div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Assists</div></div>
                            <div style={{ textAlign: 'center' }}><div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent-amber)' }}>{selectedPlayerDetail.xg}</div><div style={{ fontSize: 10, color: 'var(--text-muted)' }}>xG</div></div>
                          </div>
                        </div>
                        <table className="data-table">
                          <thead><tr><th>Stat</th><th>Value</th></tr></thead>
                          <tbody>
                            {(STAT_CATEGORIES[statCategory] || []).map(key => (
                              <tr key={key}>
                                <td style={{ color: 'var(--text-primary)' }}>{formatStatName(key)}</td>
                                <td style={{ fontWeight: 600 }}>{typeof selectedPlayerDetail.stats[key] === 'number' ? (key.includes('xg') || key.includes('xG') ? selectedPlayerDetail.stats[key].toFixed(2) : selectedPlayerDetail.stats[key]) : (selectedPlayerDetail.stats[key] || 0)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Select a player above to view detailed match stats</div>
                    )}
                  </>
                )}
              </div>

              {/* Player Ratings */}
              <div className="card">
                <div className="card-header"><span className="card-title">{filterTeam || selected.h} Player Ratings</span></div>
                <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                  <table className="data-table">
                    <thead><tr><th>Player</th><th>Pos</th><th>Min</th><th>Rating</th><th>G</th><th>A</th><th>xG</th><th>Pass%</th></tr></thead>
                    <tbody>
                      {matchStats.playerRatings.map(p => (
                        <tr key={p.id} onClick={() => { setSelectedPlayerId(p.id); setDetailTab('stats'); }} style={{ cursor: 'pointer', background: selectedPlayerId === p.id ? 'var(--accent-blue-dim)' : 'transparent' }}>
                          <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</td>
                          <td><span className="badge" style={{ background: 'var(--accent-blue-dim)', color: 'var(--accent-blue)' }}>{p.posCode}</span></td>
                          <td>{p.minutes}'</td>
                          <td style={{ fontWeight: 700, color: p.rating > 60 ? 'var(--accent-emerald)' : p.rating > 40 ? 'var(--accent-amber)' : 'var(--accent-coral)' }}>{p.rating}</td>
                          <td>{p.goals || '-'}</td>
                          <td>{p.assists || '-'}</td>
                          <td>{p.xg}</td>
                          <td>{p.passAcc}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
