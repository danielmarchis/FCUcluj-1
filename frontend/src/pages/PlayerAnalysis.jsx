import { useState, useEffect, useMemo } from 'react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';

const API_BASE_URL = 'http://localhost:8081/api';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip" style={{ background: '#1e2433', padding: '10px', border: '1px solid #384259', borderRadius: '8px' }}>
      <div className="label" style={{ fontWeight: 'bold', marginBottom: '5px', color: '#fff' }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="value" style={{ color: p.color }}>
          {p.name}: {p.value?.toFixed?.(1) ?? p.value}
        </div>
      ))}
    </div>
  );
};

export default function PlayerAnalysis() {
  const [playerList, setPlayerList] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [compareId, setCompareId] = useState('');

  // --- STATES PENTRU ENDPOINT-URILE NOI ---
  const [selectedStats, setSelectedStats] = useState(null);
  const [selectedEvolution, setSelectedEvolution] = useState([]);
  const [weatherData, setWeatherData] = useState(null);
  const [replacementReport, setReplacementReport] = useState(null);
  const [pairChemistry, setPairChemistry] = useState(null);

  const [loading, setLoading] = useState(true);

  // 1. Fetch Lista de Jucatori
  useEffect(() => {
    fetch(`${API_BASE_URL}/players`)
      .then(res => res.json())
      .then(data => {
        const sorted = data.sort((a, b) => (a.lastName || a.name).localeCompare(b.lastName || b.name));
        setPlayerList(sorted);
        if (sorted.length > 0) setSelectedId(sorted[0].id);
      })
      .catch(err => console.error("Eroare incarcare jucatori:", err));
  }, []);

  // 2. Fetch Date Principale Jucator Selectat
  useEffect(() => {
    if (!selectedId) return;
    const controller = new AbortController();
    setLoading(true);

    Promise.all([
      fetch(`${API_BASE_URL}/player-stats/${selectedId}?n=5`, { signal: controller.signal }).then(r => r.json()),
      fetch(`${API_BASE_URL}/player-evolution/${selectedId}?n=5`, { signal: controller.signal }).then(r => r.json()),
      fetch(`${API_BASE_URL}/player-stats/weather-resilience/${selectedId}?n=10`, { signal: controller.signal }).then(r => r.json()),
      fetch(`${API_BASE_URL}/player-stats/replace-player/${selectedId}?n=20`, { signal: controller.signal }).then(r => r.json())
    ])
      .then(([stats, evolution, weather, replace]) => {
        setSelectedStats(stats);
        setSelectedEvolution(evolution);
        setWeatherData(weather);
        setReplacementReport(replace);
        setLoading(false);
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          console.error("Eroare fetching:", err);
          setLoading(false);
        }
      });

    return () => controller.abort(); // Curățăm cererea dacă se schimbă ID-ul
  }, [selectedId]);

  // 3. Fetch Chemistry daca avem un al doilea jucator
  useEffect(() => {
    if (!selectedId || !compareId) {
      setPairChemistry(null);
      return;
    }
    fetch(`${API_BASE_URL}/player-stats/chemistry/players/${selectedId}/${compareId}?n=20`)
      .then(r => r.json())
      .then(data => setPairChemistry(data))
      .catch(err => console.error("Eroare fetching chemistry:", err));
  }, [selectedId, compareId]);


  // --- FORMATAM DATELE PENTRU GRAFICE ---

  // Radar-ul foloseste Rolurile Tactice (evaluate din 100 de Java)
  const radarData = useMemo(() => {
    if (!selectedStats) return [];
    return [
      { stat: 'Playmaker', value: selectedStats.playmaker || 0 },
      { stat: 'Finisher', value: selectedStats.finisher || 0 },
      { stat: 'Transporter', value: selectedStats.transporter || 0 },
      { stat: 'Destroyer', value: selectedStats.destroyer || 0 },
      { stat: 'Guardian', value: selectedStats.guardian || 0 }
    ];
  }, [selectedStats]);

  const trendData = useMemo(() => {
    if (!selectedEvolution.length) return [];
    return selectedEvolution.map((matchData, i) => ({
      match: `M${i + 1}`,
      Rating: matchData.rating || 0
    }));
  }, [selectedEvolution]);

  const WEATHER_ORDER = ['IDEAL', 'LIGHT_RAIN', 'EXTREME_HEAT', 'HEAVY_RAIN_MUD', 'SNOW_FREEZING'];

  const weatherChartData = useMemo(() => {
    if (!weatherData) return [];
    return WEATHER_ORDER
      .filter(key => weatherData[key])
      .map(key => ({
        condition: key.replace(/_/g, ' '),
        Rating: parseFloat((weatherData[key]?.rating || 0).toFixed(1))
      }));
  }, [weatherData]);


  if (loading || !selectedStats) return <div className="page-container" style={{ color: 'white', padding: '20px' }}><p>Loading U Cluj Data from Server...</p></div>;

  const selectedPlayerName = playerList.find(p => p.id === selectedId)?.lastName || 'Jucător';

  return (
    <div className="page-container" style={{ padding: '20px', color: '#fff', fontFamily: 'system-ui' }}>
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <h2 style={{ color: '#00d4ff' }}>⚽ U Cluj - Advanced Player Analytics</h2>
        <p style={{ color: '#8892a8' }}>Integrare Live cu Spring Boot Backend</p>
      </div>

      {/* Selectoare */}
      <div className="filter-bar" style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
        <select
          style={{ padding: '10px', borderRadius: '5px', background: '#1e2433', color: 'white', border: '1px solid #384259' }}
          value={selectedId || ''}
          onChange={e => setSelectedId(+e.target.value)}
        >
          {playerList.map(p => (
            <option key={p.id} value={p.id}>{p.firstName} {p.lastName} (ID: {p.id})</option>
          ))}
        </select>

        <select
          style={{ padding: '10px', borderRadius: '5px', background: '#1e2433', color: 'white', border: '1px solid #384259' }}
          value={compareId || ''}
          onChange={e => setCompareId(e.target.value ? +e.target.value : '')}
        >
          <option value="">Analizează Chemistry cu...</option>
          {playerList.filter(p => p.id !== selectedId).map(p => (
            <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
          ))}
        </select>
      </div>

      {/* Rândul 1: Statistici Generale */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '30px' }}>
        <div style={{ background: '#1e2433', padding: '20px', borderRadius: '10px', borderLeft: '4px solid #00d4ff' }}>
          <div style={{ fontSize: '12px', color: '#8892a8' }}>Overall Rating</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{selectedStats.rating || 'N/A'}</div>
        </div>
        <div style={{ background: '#1e2433', padding: '20px', borderRadius: '10px', borderLeft: '4px solid #2ecc71' }}>
          <div style={{ fontSize: '12px', color: '#8892a8' }}>G / A (Medie)</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{selectedStats.goals || 0} / {selectedStats.assists || 0}</div>
        </div>
        <div style={{ background: '#1e2433', padding: '20px', borderRadius: '10px', borderLeft: '4px solid #f1c40f' }}>
          <div style={{ fontSize: '12px', color: '#8892a8' }}>Minute Jucate (Medie)</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{selectedStats.minutesOnField || 0}</div>
        </div>
        <div style={{ background: '#1e2433', padding: '20px', borderRadius: '10px', borderLeft: '4px solid #9b59b6' }}>
          <div style={{ fontSize: '12px', color: '#8892a8' }}>Recuperări (Medie)</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{selectedStats.recoveries || 0}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>

        {/* Radar Profile (Axa setată fix la 100 pentru vizualizare corectă) */}
        <div style={{ background: '#1e2433', padding: '20px', borderRadius: '10px' }}>
          <h3 style={{ marginTop: 0, fontSize: '16px', color: '#8892a8' }}>Profil Tactic: {selectedPlayerName}</h3>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              {/* Fixăm domeniul la 100 ca să putem compara forme de poligoane corect */}
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <PolarAngleAxis dataKey="stat" tick={{ fill: '#8892a8', fontSize: 12 }} />
              <Radar name={selectedPlayerName} dataKey="value" stroke="#00d4ff" fill="#00d4ff" fillOpacity={0.4} />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Evolutie */}
        <div style={{ background: '#1e2433', padding: '20px', borderRadius: '10px' }}>
          <h3 style={{ marginTop: 0, fontSize: '16px', color: '#8892a8' }}>Evoluție Rating (Ultimele Meciuri)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="match" tick={{ fill: '#8892a8' }} />
              <YAxis tick={{ fill: '#8892a8' }} domain={['dataMin - 10', 'dataMax + 5']} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="Rating" stroke="#f1c40f" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Rândul 3: Vremea și Chemistry / Replacements */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

        {/* Weather Resilience */}
        <div style={{ background: '#1e2433', padding: '20px', borderRadius: '10px' }}>
          <h3 style={{ marginTop: 0, fontSize: '16px', color: '#8892a8' }}>🌦️ Influența Vremii (Weather Resilience)</h3>
          {weatherChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weatherChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="condition" tick={{ fill: '#8892a8' }} />
                <YAxis
                  tick={{ fill: '#8892a8' }}
                  // Fix: Round the axis labels to integers for a cleaner look
                  tickFormatter={(val) => val.toFixed(0)}
                  // Fix: Set a logical range (0 to 100) or keep it tight but capped
                  domain={[0, 100]}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Rating" fill="#3498db" radius={[4, 4, 0, 0]} name="Scor Estimat" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ color: '#8892a8' }}>Nu sunt date suficiente.</p>
          )}
        </div>

        {/* Dinamic: Afișează Chemistry DACA e selectat al doilea jucator, altfel Replacement Report */}
        <div style={{ background: '#1e2433', padding: '20px', borderRadius: '10px' }}>
          {compareId && pairChemistry ? (
            <div>
              <h3 style={{ marginTop: 0, fontSize: '16px', color: '#8892a8' }}>🔗 Player Chemistry</h3>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', padding: '20px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '30px' }}>🔥</div>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: pairChemistry.synergyIndex > 100 ? '#2ecc71' : (pairChemistry.synergyIndex < 90 ? '#e74c3c' : '#f1c40f') }}>
                    {pairChemistry.synergyIndex || 0}%
                  </div>
                  <div style={{ color: '#8892a8' }}>Synergy Index</div>
                  <div style={{ marginTop: '10px', padding: '5px 10px', background: 'rgba(255,255,255,0.1)', borderRadius: '5px', fontSize: '14px', fontWeight: 'bold' }}>
                    Verdict: {pairChemistry.verdict?.replace('_', ' ') || 'N/A'}
                  </div>
                </div>
              </div>
              <p style={{ fontSize: '13px', color: '#a0aabf', textAlign: 'center' }}>
                Compară randamentul echipei când cei doi sunt împreună pe teren vs când joacă separat.
              </p>
            </div>
          ) : (
            <div>
              <h3 style={{ marginTop: 0, fontSize: '16px', color: '#8892a8' }}>🔄 AI Squad Replaceability</h3>
              {replacementReport && replacementReport.squadAnalysis ? (
                <div>
                  <p style={{ fontSize: '13px', color: '#a0aabf', borderBottom: '1px solid #384259', paddingBottom: '10px' }}>
                    Alternative pentru <strong>{replacementReport.targetPlayerName}</strong> analizate din lotul actual:
                  </p>

                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {replacementReport.squadAnalysis.slice(0, 3).map((cand, idx) => (
                      <li key={idx} style={{ display: 'flex', flexDirection: 'column', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 'bold' }}>Titular: {cand.starterName}</span>
                          <span style={{
                            fontSize: '11px', padding: '3px 8px', borderRadius: '4px',
                            background: cand.dropOffDelta > 10 ? '#e74c3c' : '#2ecc71', color: '#fff'
                          }}>
                            {cand.riskLevel?.replace('_', ' ')}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#8892a8', marginTop: '5px' }}>
                          <span>Rol: {cand.primaryRole}</span>
                          <span>Backup: <strong style={{ color: '#00d4ff' }}>{cand.backupName}</strong></span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#a0aabf', marginTop: '4px' }}>
                          Scădere estimată randament (Delta): {cand.dropOffDelta}
                        </div>
                      </li>
                    ))}
                    {!replacementReport.squadAnalysis.length && <li style={{ color: '#e74c3c' }}>Nu s-au găsit date.</li>}
                  </ul>
                </div>
              ) : (
                <p>Alege un jucător pentru a vedea analiza de înlocuire.</p>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}