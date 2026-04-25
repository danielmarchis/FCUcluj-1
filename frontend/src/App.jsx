import { Routes, Route } from 'react-router-dom';
import { DataProvider, useData } from './context/DataContext';
import Sidebar from './components/layout/Sidebar';
import Overview from './pages/Overview';
import PlayerAnalysis from './pages/PlayerAnalysis';
import TacticalInsights from './pages/TacticalInsights';
import MatchExplorer from './pages/MatchExplorer';
import TacticsBoard from './components/viz/TacticsBoard';
import Scouting from './pages/Scouting';
import LiveMatch from './pages/LiveMatch';

function AppContent() {
  const { loading, error, progress } = useData();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <div className="loading-text">{progress}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          Loading 278 matches · FC Universitatea Cluj 1919
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="loading-screen">
        <div style={{ fontSize: 48 }}>⚠️</div>
        <div className="loading-text" style={{ color: 'var(--accent-coral)' }}>Error: {error}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Make sure data files are in /public/data/
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/players" element={<PlayerAnalysis />} />
          <Route path="/tactical" element={<TacticalInsights />} />
          <Route path="/matches" element={<MatchExplorer />} />
          <Route path="/tactics-board" element={<TacticsBoard />} />
          <Route path="/scouting" element={<Scouting />} />
          <Route path="/live" element={<LiveMatch />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <DataProvider>
      <AppContent />
    </DataProvider>
  );
}
