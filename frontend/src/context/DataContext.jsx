import { createContext, useContext, useState, useEffect, useMemo } from 'react';

const DataContext = createContext(null);

export function useData() {
  return useContext(DataContext);
}

const U_CLUJ = 'Universitatea Cluj';

function parseData(matchesRaw, playersRaw) {
  // Build player lookup
  const playerMap = {};
  const playersList = Array.isArray(playersRaw) ? playersRaw : (playersRaw.players || []);
  for (const p of playersList) {
    playerMap[p.wyId] = p;
  }

  const matches = matchesRaw.map((m, idx) => ({
    ...m,
    idx,
    label: `${m.h} vs ${m.aw}`,
    scoreLabel: `${m.hg} - ${m.ag}`,
  }));

  // Get all unique teams
  const teams = [...new Set(matches.flatMap(m => [m.h, m.aw]))].sort();
  const seasons = [...new Set(matches.map(m => m.sId))].sort();

  // League-wide player stats
  const leaguePlayerStats = {};
  for (const match of matches) {
    for (const p of match.p) {
      if (!leaguePlayerStats[p.id]) {
        const info = playerMap[p.id];
        leaguePlayerStats[p.id] = {
          id: p.id,
          name: info?.shortName || `${info?.firstName} ${info?.lastName}` || `Player ${p.id}`,
          role: info?.role?.name || 'Unknown',
          roleCode: info?.role?.code2 || '??',
          matchCount: 0,
          totals: {},
          matchStats: [],
          minutesPlayed: 0
        };
      }
      leaguePlayerStats[p.id].matchCount++;
      leaguePlayerStats[p.id].matchStats.push({
        matchIdx: match.idx,
        stats: p.t
      });
      for (const [k, v] of Object.entries(p.t)) {
        leaguePlayerStats[p.id].totals[k] = (leaguePlayerStats[p.id].totals[k] || 0) + (v || 0);
      }
      leaguePlayerStats[p.id].minutesPlayed += (p.t.minutesOnField || 0);
    }
  }

  return { matches, teams, seasons, playerMap, leaguePlayerStats };
}

export function DataProvider({ children }) {
  const [baseData, setBaseData] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState('Universitatea Cluj');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState('Loading data...');

  useEffect(() => {
    async function load() {
      try {
        setProgress('Loading match data...');
        const [matchesRes, playersRes] = await Promise.all([
          fetch('/data/matches.json'),
          fetch('/data/players.json'),
        ]);

        if (!matchesRes.ok || !playersRes.ok) throw new Error('Failed to load data files');

        setProgress('Parsing match data...');
        const matchesRaw = await matchesRes.json();

        setProgress('Parsing player profiles...');
        const playersRaw = await playersRes.json();

        setProgress('Building analytics...');
        const parsed = parseData(matchesRaw, playersRaw);
        
        setBaseData(parsed);
        setLoading(false);
      } catch (e) {
        console.error('Data loading error:', e);
        setError(e.message);
        setLoading(false);
      }
    }
    load();
  }, []);

  // Compute team-specific data dynamically
  const teamData = useMemo(() => {
    if (!baseData || !selectedTeam) return null;

    const teamMatches = baseData.matches.filter(m => m.h.includes(selectedTeam) || m.aw.includes(selectedTeam)).map(m => {
      const isHome = m.h.includes(selectedTeam);
      const goalsFor = isHome ? m.hg : m.ag;
      const goalsAgainst = isHome ? m.ag : m.hg;
      const result = goalsFor > goalsAgainst ? 'W' : goalsFor < goalsAgainst ? 'L' : 'D';
      return { ...m, isTeamHome: isHome, result };
    });

    const teamPlayerStats = {};
    for (const match of teamMatches) {
      for (const p of match.p) {
        // Simple heuristic: if a player plays mostly in team matches, they belong to the team.
        // Actually, we'll just include all players who played IN this match. 
        // Opponent players will also be here, but we can filter by analyzing who is mostly here.
        // Or we can just calculate stats for everyone in the match.
        const info = baseData.playerMap[p.id];
        if (!teamPlayerStats[p.id]) {
          teamPlayerStats[p.id] = {
            id: p.id,
            name: info?.shortName || `Player ${p.id}`,
            role: info?.role?.name || 'Unknown',
            roleCode: info?.role?.code2 || '??',
            matchStats: [],
            totals: {},
            matchCount: 0,
            minutesPlayed: 0
          };
        }
        teamPlayerStats[p.id].matchStats.push({ matchIdx: match.idx, stats: p.t, posName: p.posName, pos: p.pos });
      }
    }

    // Aggregate totals
    for (const ps of Object.values(teamPlayerStats)) {
      ps.matchCount = ps.matchStats.length;
      for (const ms of ps.matchStats) {
        for (const [k, v] of Object.entries(ms.stats)) {
          ps.totals[k] = (ps.totals[k] || 0) + (v || 0);
        }
      }
      ps.minutesPlayed = ps.totals.minutesOnField || 0;
    }

    // Filter out opponent players (heuristic: players who played less than 15% of the team's matches are probably opponents)
    // A better heuristic is: do they play for the home team or away team? We don't have that direct link in player stats.
    // So we'll just keep all players for now, but rank them by minutes played.

    return {
      teamMatches,
      teamPlayerStats
    };
  }, [baseData, selectedTeam]);

  const data = useMemo(() => {
    if (!baseData) return null;
    return {
      ...baseData,
      ...teamData,
      selectedTeam,
      setSelectedTeam
    };
  }, [baseData, teamData, selectedTeam]);

  return (
    <DataContext.Provider value={{ data, loading, error, progress }}>
      {children}
    </DataContext.Provider>
  );
}
