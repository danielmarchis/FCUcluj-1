import { useState, useRef, useEffect } from 'react';
import { useData } from '../../context/DataContext';

export default function TacticsBoard() {
  const { data } = useData();
  const [players, setPlayers] = useState([]);
  const [drawing, setDrawing] = useState(false);
  const [lines, setLines] = useState([]);
  const [currentLine, setCurrentLine] = useState(null);
  const [mode, setMode] = useState('drag'); // 'drag' or 'draw'
  const canvasRef = useRef(null);

  // Initialize players
  useEffect(() => {
    if (!data) return;
    const topSquad = Object.values(data.teamPlayerStats)
      .sort((a, b) => b.minutesPlayed - a.minutesPlayed)
      .slice(0, 11)
      .map((p, i) => ({
        ...p,
        x: 10 + (i % 4) * 20, // Default positions
        y: 10 + Math.floor(i / 4) * 25
      }));
    setPlayers(topSquad);
  }, [data]);

  // Dragging logic
  const [draggingPlayer, setDraggingPlayer] = useState(null);

  const handlePointerDown = (e, player) => {
    if (mode !== 'drag') return;
    e.preventDefault();
    setDraggingPlayer(player.id);
  };

  const handlePointerMove = (e) => {
    if (mode === 'drag' && draggingPlayer) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      
      setPlayers(prev => prev.map(p => 
        p.id === draggingPlayer 
          ? { ...p, x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) }
          : p
      ));
    } else if (mode === 'draw' && drawing) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setCurrentLine(prev => ({ ...prev, end: { x, y } }));
    }
  };

  const handlePointerUp = () => {
    if (mode === 'drag') {
      setDraggingPlayer(null);
    } else if (mode === 'draw' && drawing) {
      setDrawing(false);
      if (currentLine && currentLine.end) {
        setLines(prev => [...prev, currentLine]);
      }
      setCurrentLine(null);
    }
  };

  const handleCanvasDown = (e) => {
    if (mode !== 'draw') return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setDrawing(true);
    setCurrentLine({ start: { x, y }, end: { x, y } });
  };

  // Draw lines on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Setup canvas size
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw past lines
    ctx.strokeStyle = '#00d4ff';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const drawArrow = (fromx, fromy, tox, toy) => {
      const headlen = 15; // length of head in pixels
      const dx = tox - fromx;
      const dy = toy - fromy;
      const angle = Math.atan2(dy, dx);
      
      ctx.beginPath();
      ctx.moveTo(fromx, fromy);
      ctx.lineTo(tox, toy);
      ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
      ctx.moveTo(tox, toy);
      ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
      ctx.stroke();
    };

    lines.forEach(l => {
      drawArrow(l.start.x, l.start.y, l.end.x, l.end.y);
    });

    if (currentLine && currentLine.end) {
      ctx.strokeStyle = 'rgba(0, 212, 255, 0.5)';
      drawArrow(currentLine.start.x, currentLine.start.y, currentLine.end.x, currentLine.end.y);
    }
  }, [lines, currentLine]);

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2>📋 Interactive Tactics Board</h2>
          <p>Drag players into position and draw passing arrows</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button 
            onClick={() => setMode('drag')}
            className="filter-select"
            style={{ background: mode === 'drag' ? 'var(--accent-blue)' : '', color: mode === 'drag' ? '#000' : '' }}
          >
            ✋ Drag Players
          </button>
          <button 
            onClick={() => setMode('draw')}
            className="filter-select"
            style={{ background: mode === 'draw' ? 'var(--accent-emerald)' : '', color: mode === 'draw' ? '#000' : '' }}
          >
            ✏️ Draw Arrows
          </button>
          <button 
            onClick={() => setLines([])}
            className="filter-select"
            style={{ background: 'rgba(255,100,100,0.1)', color: 'var(--accent-coral)' }}
          >
            🗑️ Clear Arrows
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div 
          style={{ position: 'relative', width: '100%', aspectRatio: '1.5/1', background: '#2c3e50', backgroundImage: 'radial-gradient(circle, #34495e 10%, transparent 11%),radial-gradient(circle, #34495e 10%, transparent 11%)', backgroundSize: '40px 40px' }}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          {/* Pitch markings SVG */}
          <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.5 }}>
            <rect x="0" y="0" width="100%" height="100%" fill="#27ae60" />
            <rect x="5%" y="5%" width="90%" height="90%" fill="none" stroke="white" strokeWidth="2" />
            <line x1="50%" y1="5%" x2="50%" y2="95%" stroke="white" strokeWidth="2" />
            <circle cx="50%" cy="50%" r="9%" fill="none" stroke="white" strokeWidth="2" />
            <rect x="5%" y="25%" width="15%" height="50%" fill="none" stroke="white" strokeWidth="2" />
            <rect x="80%" y="25%" width="15%" height="50%" fill="none" stroke="white" strokeWidth="2" />
          </svg>

          {/* Drawing Canvas */}
          <canvas 
            ref={canvasRef}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', cursor: mode === 'draw' ? 'crosshair' : 'default' }}
            onPointerDown={handleCanvasDown}
          />

          {/* Players */}
          {players.map(p => (
            <div
              key={p.id}
              onPointerDown={(e) => handlePointerDown(e, p)}
              style={{
                position: 'absolute',
                left: `${p.x}%`,
                top: `${p.y}%`,
                transform: 'translate(-50%, -50%)',
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'rgba(10, 14, 26, 0.95)',
                border: `2px solid ${p.id === draggingPlayer ? '#00d4ff' : '#fff'}`,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                fontWeight: 'bold',
                cursor: mode === 'drag' ? 'grab' : 'default',
                userSelect: 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                zIndex: p.id === draggingPlayer ? 10 : 1
              }}
            >
              {p.roleCode}
              <div style={{ position: 'absolute', top: '110%', width: 80, textAlign: 'center', fontSize: 10, textShadow: '0 1px 3px #000' }}>
                {p.name.split(' ').pop()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
