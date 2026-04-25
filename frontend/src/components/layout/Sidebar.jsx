import { NavLink } from 'react-router-dom';
import { useData } from '../../context/DataContext';

export default function Sidebar() {
  const { data } = useData();

  const links = [
    { to: '/', label: 'Overview', icon: '📊' },
    { to: '/tactical', label: 'Tactical Insights', icon: '🧠' },
    { to: '/tactics-board', label: 'Tactics Board', icon: '📋' },
    { to: '/matches', label: 'Match Explorer', icon: '🏟️' },
    { to: '/players', label: 'Player Analysis', icon: '⚽' },
    { to: '/scouting', label: 'Opponent Scouting', icon: '🕵️' },
    { to: '/live', label: 'Live Match', icon: '⏱️' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-crest">
          {data?.selectedTeam ? data.selectedTeam.charAt(0) : 'U'}
        </div>
        <h1>Smart Match Insights</h1>
        <div className="brand-sub">
          {data ? (
            <select 
              value={data.selectedTeam} 
              onChange={e => data.setSelectedTeam(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'var(--text-secondary)',
                borderRadius: '4px',
                padding: '4px 8px',
                width: '100%',
                marginTop: '8px',
                fontSize: '11px',
                outline: 'none',
                fontFamily: 'Inter, sans-serif',
                cursor: 'pointer'
              }}
            >
              {data.teams.map(t => <option key={t} value={t} style={{ background: '#0a0e1a' }}>{t}</option>)}
            </select>
          ) : 'Loading...'}
        </div>
      </div>
      <nav className="sidebar-nav">
        {links.map(l => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === '/'}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <span className="nav-icon">{l.icon}</span>
            {l.label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        Powered by Wyscout Data · {new Date().getFullYear()}
      </div>
    </aside>
  );
}
