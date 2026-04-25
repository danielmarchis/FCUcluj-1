import { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import FootballPitch from '../components/viz/FootballPitch';

export default function LiveMatch() {
  const { data } = useData();
  const [clock, setClock] = useState(0);
  const [events, setEvents] = useState([]);
  const [possession, setPossession] = useState(50);
  const [activeMode, setActiveMode] = useState(false);

  // Simulated live event feed
  useEffect(() => {
    if (!activeMode) return;
    
    const eventTypes = [
      { t: 'Pass Completed', c: '#00d4ff' },
      { t: 'Ball Recovery', c: '#00ff88' },
      { t: 'Progressive Run', c: '#a855f7' },
      { t: 'Turnover', c: '#ff4757' },
      { t: 'Shot on Target', c: '#ffb800' }
    ];

    const interval = setInterval(() => {
      setClock(c => c + 1);
      
      // Randomly generate events
      if (Math.random() > 0.6) {
        const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];
        const min = Math.floor(clock / 60);
        const sec = (clock % 60).toString().padStart(2, '0');
        
        // Randomly adjust possession
        if (type.t === 'Turnover') setPossession(p => Math.max(30, p - 5));
        if (type.t === 'Ball Recovery') setPossession(p => Math.min(70, p + 5));

        setEvents(prev => [{
          id: Date.now(),
          time: `${min}:${sec}`,
          type: type.t,
          color: type.c,
          desc: `${type.t} in the ${Math.random() > 0.5 ? 'attacking' : 'defensive'} third.`
        }, ...prev].slice(0, 15));
      }
    }, 1000); // 1 real second = 1 game second for demo purposes

    return () => clearInterval(interval);
  }, [activeMode, clock]);

  // Mock heatmap data for the live pitch
  const liveHeatmap = Array(12).fill(0).map(() => Array(8).fill(Math.random() * 0.5));

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>⏱️ Live Match Center</h2>
          <p>Real-time analytics and tactical adjustments</p>
        </div>
        <button 
          onClick={() => setActiveMode(!activeMode)}
          className="filter-select"
          style={{ background: activeMode ? 'var(--accent-coral)' : 'var(--accent-emerald)', color: '#000', border: 'none', padding: '8px 24px', fontSize: 16 }}
        >
          {activeMode ? '⏹ Pause Simulation' : '▶ Start Live Match'}
        </button>
      </div>

      <div className="grid-2">
        {/* Match HUD */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 32px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 800 }}>{data?.selectedTeam || 'FC U Cluj'}</div>
              <div style={{ fontSize: 48, fontWeight: 900, color: 'var(--accent-blue)', lineHeight: 1 }}>0</div>
            </div>
            <div style={{ textAlign: 'center', color: 'var(--accent-coral)', fontSize: 32, fontWeight: 800 }}>
              {Math.floor(clock / 60).toString().padStart(2, '0')}:{(clock % 60).toString().padStart(2, '0')}
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginTop: 4 }}>LIVE</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 800 }}>Opponent</div>
              <div style={{ fontSize: 48, fontWeight: 900, color: '#fff', lineHeight: 1 }}>0</div>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><span className="card-title">Live Momentum & Possession</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14, fontWeight: 700 }}>
              <span style={{ color: 'var(--accent-blue)' }}>{possession}%</span>
              <span>{100 - possession}%</span>
            </div>
            <div style={{ width: '100%', height: 12, background: '#333', borderRadius: 6, overflow: 'hidden', display: 'flex' }}>
              <div style={{ width: `${possession}%`, height: '100%', background: 'var(--accent-blue)', transition: 'width 1s ease' }}></div>
              <div style={{ width: `${100 - possession}%`, height: '100%', background: '#fff', transition: 'width 1s ease' }}></div>
            </div>
          </div>

          <div className="card" style={{ flex: 1 }}>
            <div className="card-header"><span className="card-title">Live Event Feed</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 350, overflowY: 'auto', paddingRight: 8 }}>
              {events.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>Click Start to begin live feed</div>
              ) : events.map(e => (
                <div key={e.id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 8, borderLeft: `3px solid ${e.color}` }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: 12, minWidth: 40 }}>{e.time}</div>
                  <div>
                    <div style={{ fontWeight: 700, color: e.color, fontSize: 14 }}>{e.type}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{e.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Live Pitch */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header"><span className="card-title">Live Activity Zones</span></div>
          <div style={{ flex: 1, minHeight: 400 }}>
            {activeMode ? (
              <FootballPitch heatmapData={liveHeatmap} gridRows={12} gridCols={8} mode="activity" />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>Waiting for kickoff...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
