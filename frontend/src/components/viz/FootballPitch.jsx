import { useState } from 'react';

const PITCH_W = 680;
const PITCH_H = 440;
const PAD = 20;
const W = PITCH_W + PAD * 2;
const H = PITCH_H + PAD * 2;

export default function FootballPitch({ heatmapData, onZoneClick, title, gridRows = 6, gridCols = 4, mode = 'loss' }) {
  const [hoveredZone, setHoveredZone] = useState(null);

  const px = PAD;
  const py = PAD;
  const pw = PITCH_W;
  const ph = PITCH_H;

  const zoneW = pw / gridCols;
  const zoneH = ph / gridRows;

  function getHeatColor(intensity, heatMode) {
    if (intensity <= 0) return 'rgba(0,212,255,0.02)';
    if (heatMode === 'activity') {
      if (intensity < 0.15) return 'rgba(0,212,255,0.06)';
      if (intensity < 0.3) return 'rgba(0,212,255,0.15)';
      if (intensity < 0.45) return 'rgba(0,255,136,0.2)';
      if (intensity < 0.6) return 'rgba(0,255,136,0.35)';
      if (intensity < 0.75) return 'rgba(255,184,0,0.4)';
      if (intensity < 0.9) return 'rgba(255,120,0,0.5)';
      return 'rgba(255,71,87,0.6)';
    }
    if (intensity < 0.1) return 'rgba(0,212,255,0.06)';
    if (intensity < 0.2) return 'rgba(0,212,255,0.12)';
    if (intensity < 0.35) return 'rgba(0,255,136,0.18)';
    if (intensity < 0.5) return 'rgba(255,184,0,0.25)';
    if (intensity < 0.7) return 'rgba(255,120,0,0.35)';
    if (intensity < 0.85) return 'rgba(255,71,87,0.45)';
    return 'rgba(255,40,50,0.6)';
  }

  const isActivity = mode === 'activity';
  const legendColors = isActivity
    ? ['rgba(0,212,255,0.15)', 'rgba(0,255,136,0.3)', 'rgba(255,184,0,0.4)', 'rgba(255,71,87,0.6)']
    : ['rgba(0,212,255,0.12)', 'rgba(0,255,136,0.18)', 'rgba(255,184,0,0.3)', 'rgba(255,71,87,0.55)'];

  return (
    <div className="pitch-container">
      {title && <div className="card-title" style={{ marginBottom: 12 }}>{title}</div>}
      <svg viewBox={`0 0 ${W} ${H}`} className="pitch-svg">
        <rect x="0" y="0" width={W} height={H} fill="#0d1a0d" rx="8" />
        <rect x={px} y={py} width={pw} height={ph} fill="#1a2e1a" stroke="#2d5a2d" strokeWidth="1.5" />
        <line x1={px + pw/2} y1={py} x2={px + pw/2} y2={py + ph} stroke="#2d5a2d" strokeWidth="1" />
        <circle cx={px + pw/2} cy={py + ph/2} r={ph * 0.14} fill="none" stroke="#2d5a2d" strokeWidth="1" />
        <circle cx={px + pw/2} cy={py + ph/2} r="3" fill="#2d5a2d" />
        <rect x={px} y={py + ph*0.2} width={pw*0.16} height={ph*0.6} fill="none" stroke="#2d5a2d" strokeWidth="1" />
        <rect x={px} y={py + ph*0.35} width={pw*0.06} height={ph*0.3} fill="none" stroke="#2d5a2d" strokeWidth="1" />
        <circle cx={px + pw*0.11} cy={py + ph/2} r="2.5" fill="#2d5a2d" />
        <rect x={px + pw*0.84} y={py + ph*0.2} width={pw*0.16} height={ph*0.6} fill="none" stroke="#2d5a2d" strokeWidth="1" />
        <rect x={px + pw*0.94} y={py + ph*0.35} width={pw*0.06} height={ph*0.3} fill="none" stroke="#2d5a2d" strokeWidth="1" />
        <circle cx={px + pw*0.89} cy={py + ph/2} r="2.5" fill="#2d5a2d" />
        <path d={`M ${px+8} ${py} A 8 8 0 0 0 ${px} ${py+8}`} fill="none" stroke="#2d5a2d" strokeWidth="1" />
        <path d={`M ${px+pw-8} ${py} A 8 8 0 0 1 ${px+pw} ${py+8}`} fill="none" stroke="#2d5a2d" strokeWidth="1" />
        <path d={`M ${px} ${py+ph-8} A 8 8 0 0 0 ${px+8} ${py+ph}`} fill="none" stroke="#2d5a2d" strokeWidth="1" />
        <path d={`M ${px+pw} ${py+ph-8} A 8 8 0 0 1 ${px+pw-8} ${py+ph}`} fill="none" stroke="#2d5a2d" strokeWidth="1" />

        {heatmapData && heatmapData.map((zone, i) => {
          const x = px + zone.col * zoneW;
          const y = py + (gridRows - 1 - zone.row) * zoneH;
          const isHovered = hoveredZone === i;

          return (
            <g key={i}>
              <rect
                className="heatmap-zone"
                x={x + 0.5}
                y={y + 0.5}
                width={zoneW - 1}
                height={zoneH - 1}
                fill={getHeatColor(zone.intensity, mode)}
                rx="2"
                opacity={isHovered ? 1 : 0.85}
                onMouseEnter={() => setHoveredZone(i)}
                onMouseLeave={() => setHoveredZone(null)}
                onClick={() => onZoneClick?.(zone)}
              />
              {zone.losses > 0 && zone.intensity > 0.15 && (
                <text
                  x={x + zoneW / 2}
                  y={y + zoneH / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={zone.intensity > 0.4 ? '#fff' : 'rgba(255,255,255,0.5)'}
                  fontSize={gridRows > 8 ? "10" : "13"}
                  fontWeight="700"
                  fontFamily="Inter"
                  pointerEvents="none"
                >
                  {zone.losses}
                </text>
              )}
            </g>
          );
        })}

        {hoveredZone !== null && heatmapData?.[hoveredZone] && (
          <g>
            <rect
              x={Math.min(px + heatmapData[hoveredZone].col * zoneW + zoneW/2 - 60, W - 140)}
              y={Math.max(py + (gridRows - 1 - heatmapData[hoveredZone].row) * zoneH - 38, 4)}
              width="120" height="32" rx="6"
              fill="rgba(10,14,26,0.95)" stroke="rgba(99,140,255,0.2)"
            />
            <text
              x={Math.min(px + heatmapData[hoveredZone].col * zoneW + zoneW/2, W - 80)}
              y={Math.max(py + (gridRows - 1 - heatmapData[hoveredZone].row) * zoneH - 25, 17)}
              textAnchor="middle" fill="#e8eaf0" fontSize="9" fontFamily="Inter" fontWeight="500"
            >
              {isActivity ? `Activity: ${heatmapData[hoveredZone].losses}` : `Losses: ${heatmapData[hoveredZone].losses} | Danger: ${heatmapData[hoveredZone].dangerous}`}
            </text>
          </g>
        )}

        <text x={px + 10} y={py + ph + 14} fill="#2d5a2d" fontSize="9" fontFamily="Inter">← DEF</text>
        <text x={px + pw - 40} y={py + ph + 14} fill="#2d5a2d" fontSize="9" fontFamily="Inter">ATK →</text>
      </svg>

      {/* Gradient Legend */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8 }}>
        <span style={{ fontSize: 10, color: '#5a6480' }}>Low</span>
        <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', width: 120 }}>
          {legendColors.map((c, i) => (
            <div key={i} style={{ flex: 1, background: c }} />
          ))}
        </div>
        <span style={{ fontSize: 10, color: '#5a6480' }}>High</span>
      </div>
    </div>
  );
}
