// FormationView - SVG pitch with players positioned by their formation roles

const PITCH_W = 600;
const PITCH_H = 420;
const PAD = 16;
const W = PITCH_W + PAD * 2;
const H = PITCH_H + PAD * 2;

// Map position codes to x,y coordinates on pitch (0-100 scale)
const POS_COORDS = {
  'gk': [50, 5], 'gkp': [50, 5],
  'lb': [12, 25], 'lcb': [33, 20], 'cb': [50, 18], 'rcb': [67, 20], 'rb': [88, 25],
  'lwb': [10, 38], 'rwb': [90, 38],
  'ldmf': [35, 38], 'dmf': [50, 35], 'rdmf': [65, 38],
  'lmf': [12, 50], 'lcmf': [35, 50], 'cmf': [50, 48], 'rcmf': [65, 50], 'rmf': [88, 50],
  'lamf': [30, 62], 'amf': [50, 60], 'ramf': [70, 62],
  'lw': [12, 68], 'rw': [88, 68],
  'lwf': [30, 78], 'ss': [50, 72], 'cf': [50, 82], 'rwf': [70, 78],
  'fw': [50, 80], 'fwd': [50, 80],
};

function getRatingColor(rating) {
  if (rating >= 75) return '#00ff88';
  if (rating >= 60) return '#00d4ff';
  if (rating >= 45) return '#ffb800';
  return '#ff4757';
}

export default function FormationView({ players, title }) {
  if (!players || players.length === 0) return null;

  const px = PAD;
  const py = PAD;

  return (
    <div className="formation-container">
      {title && <div className="card-title" style={{ marginBottom: 12 }}>{title}</div>}
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
        {/* Pitch background */}
        <rect x="0" y="0" width={W} height={H} fill="#0d1a0d" rx="10" />
        <rect x={px} y={py} width={PITCH_W} height={PITCH_H} fill="#1a2e1a" stroke="#2d5a2d" strokeWidth="1.5" rx="4" />
        
        {/* Center */}
        <line x1={px} y1={py + PITCH_H/2} x2={px + PITCH_W} y2={py + PITCH_H/2} stroke="#2d5a2d" strokeWidth="1" />
        <circle cx={px + PITCH_W/2} cy={py + PITCH_H/2} r={PITCH_H * 0.11} fill="none" stroke="#2d5a2d" strokeWidth="1" />
        
        {/* Goal areas */}
        <rect x={px + PITCH_W*0.3} y={py} width={PITCH_W*0.4} height={PITCH_H*0.12} fill="none" stroke="#2d5a2d" strokeWidth="1" />
        <rect x={px + PITCH_W*0.38} y={py} width={PITCH_W*0.24} height={PITCH_H*0.05} fill="none" stroke="#2d5a2d" strokeWidth="1" />
        <rect x={px + PITCH_W*0.3} y={py + PITCH_H*0.88} width={PITCH_W*0.4} height={PITCH_H*0.12} fill="none" stroke="#2d5a2d" strokeWidth="1" />
        <rect x={px + PITCH_W*0.38} y={py + PITCH_H*0.95} width={PITCH_W*0.24} height={PITCH_H*0.05} fill="none" stroke="#2d5a2d" strokeWidth="1" />

        {/* Players */}
        {players.map((p, i) => {
          const posCode = (p.posCode || p.pos || 'cmf').toLowerCase();
          const coords = POS_COORDS[posCode] || [50, 50];
          const cx = px + (coords[0] / 100) * PITCH_W;
          const cy = py + (coords[1] / 100) * PITCH_H;
          const ratingColor = getRatingColor(p.rating);

          return (
            <g key={p.id || i} style={{ animation: `fadeIn 0.4s ease ${i * 0.05}s both` }}>
              {/* Glow */}
              <circle cx={cx} cy={cy} r="22" fill={ratingColor} opacity="0.08" />
              {/* Avatar circle */}
              <circle cx={cx} cy={cy} r="16" fill="rgba(10,14,26,0.85)" stroke={ratingColor} strokeWidth="2" />
              {/* Rating */}
              <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="central"
                fill={ratingColor} fontSize="11" fontWeight="800" fontFamily="Inter">
                {p.rating}
              </text>
              {/* Name */}
              <rect x={cx - 32} y={cy + 19} width="64" height="16" rx="4" fill="rgba(10,14,26,0.9)" />
              <text x={cx} y={cy + 28} textAnchor="middle" dominantBaseline="central"
                fill="#e8eaf0" fontSize="8" fontWeight="600" fontFamily="Inter">
                {(p.name || '').length > 10 ? (p.name || '').substring(0, 9) + '.' : p.name}
              </text>
              {/* Position badge */}
              <rect x={cx + 10} y={cy - 22} width="18" height="12" rx="3" fill={ratingColor} opacity="0.2" />
              <text x={cx + 19} y={cy - 15} textAnchor="middle" dominantBaseline="central"
                fill={ratingColor} fontSize="7" fontWeight="700" fontFamily="Inter">
                {(posCode || '').toUpperCase().substring(0, 3)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
