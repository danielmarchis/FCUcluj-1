const fs = require('fs');
const path = require('path');

const MATCHES_FILE = path.join(__dirname, 'public/data/matches.json');
const PLAYERS_FILE = path.join(__dirname, 'public/data/players.json');

const matches = JSON.parse(fs.readFileSync(MATCHES_FILE, 'utf8'));
const playersData = JSON.parse(fs.readFileSync(PLAYERS_FILE, 'utf8'));
const playersList = Array.isArray(playersData) ? playersData : (playersData.players || []);

const UCLUJ_TEAM_ID = 60374;

const cleanPlayers = playersList.filter(p => p.currentTeamId === UCLUJ_TEAM_ID);
const uClujPlayerIds = new Set(cleanPlayers.map(p => p.wyId));

const cleanMatches = [];

for (const m of matches) {
  const uClujPlayers = m.p.filter(p => uClujPlayerIds.has(p.id));
  
  if (uClujPlayers.length > 0) {
    m.p = uClujPlayers;
    cleanMatches.push(m);
  }
}

fs.writeFileSync(MATCHES_FILE, JSON.stringify(cleanMatches));
fs.writeFileSync(PLAYERS_FILE, JSON.stringify({ players: cleanPlayers }));

console.log(`Kept ${cleanMatches.length} matches and ${cleanPlayers.length} FC U Cluj players.`);
