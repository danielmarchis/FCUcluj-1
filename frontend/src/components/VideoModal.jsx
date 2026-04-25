import { useEffect } from 'react';

export default function VideoModal({ isOpen, onClose, title }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.85)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border-color)',
        borderRadius: 8, width: '90%', maxWidth: 800, overflow: 'hidden',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
      }}>
        <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)' }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>{title || 'Tactical Camera View'}</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18 }}>✕</button>
        </div>
        <div style={{ padding: 20 }}>
          <div style={{
            width: '100%', aspectRatio: '16/9', background: '#000',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative'
          }}>
            {/* Mock Video Placeholder */}
            <div style={{ color: 'var(--text-muted)', textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>▶️</div>
              <p>Simulated Tactical Video Clip</p>
              <p style={{ fontSize: 12, opacity: 0.5 }}>(Video data not available in current dataset)</p>
            </div>
            
            {/* Fake progress bar */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: 4, background: '#333' }}>
              <div style={{ width: '30%', height: '100%', background: 'var(--accent-blue)' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
