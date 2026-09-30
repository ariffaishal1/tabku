import React from 'react';

interface CountInOverlayProps {
  isCountingIn: boolean;
  countInBeat: number;
  timeSignature: string;
  tempo: number;
}

export const CountInOverlay: React.FC<CountInOverlayProps> = ({
  isCountingIn,
  countInBeat,
  timeSignature,
  tempo,
}) => {
  if (!isCountingIn) return null;

  const beatsPerBar = parseInt(timeSignature.split('/')[0]) || 4;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(5px)',
        zIndex: 50,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          padding: '24px 48px',
          borderRadius: '12px',
          backgroundColor: 'var(--bg-surface-elevated)',
          border: '1.5px solid var(--accent-amber)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 24px var(--accent-amber)',
        }}
      >
        <div
          style={{
            fontSize: '11px',
            fontWeight: 800,
            fontFamily: 'var(--font-mono)',
            color: 'var(--accent-amber)',
            letterSpacing: '2.5px',
            textTransform: 'uppercase',
          }}
        >
          COUNT-IN · SIAPKAN PETIKAN
        </div>

        {/* Big Pulsing Beat Number with Scale Bounce Animation */}
        <div
          key={countInBeat}
          className="beat-pulse-anim"
          style={{
            fontSize: '92px',
            fontWeight: 900,
            fontFamily: 'var(--font-mono)',
            color: countInBeat === 1 ? 'var(--accent-amber)' : 'var(--text-primary)',
            lineHeight: 1,
            textShadow: countInBeat === 1
              ? '0 0 35px var(--accent-amber)'
              : '0 0 25px rgba(255, 255, 255, 0.75)',
            transformOrigin: 'center center',
          }}
        >
          {countInBeat > 0 ? countInBeat : '...'}
        </div>

        {/* Beat Dots Indicator */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {Array.from({ length: beatsPerBar }).map((_, idx) => {
            const isActive = idx < countInBeat;
            return (
              <div
                key={idx}
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: isActive ? 'var(--accent-amber)' : 'var(--bg-control)',
                  boxShadow: isActive ? '0 0 10px var(--accent-amber)' : 'none',
                  transform: isActive ? 'scale(1.2)' : 'scale(1)',
                  transition: 'all 0.12s ease',
                }}
              />
            );
          })}
        </div>

        <div
          style={{
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted)',
            marginTop: '2px',
          }}
        >
          {tempo} BPM · Birama {timeSignature}
        </div>
      </div>
    </div>
  );
};
