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
        backgroundColor: 'rgba(18, 14, 14, 0.75)',
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
          background: 'linear-gradient(180deg, rgba(35, 27, 27, 0.95) 0%, rgba(20, 16, 16, 0.98) 100%)',
          border: '1.5px solid #ffb86c',
          boxShadow: '0 0 35px rgba(255, 184, 108, 0.35)',
        }}
      >
        <div
          style={{
            fontSize: '11px',
            fontWeight: 800,
            fontFamily: 'var(--font-mono)',
            color: '#ffb86c',
            letterSpacing: '2.5px',
            textTransform: 'uppercase',
          }}
        >
          COUNT-IN · SIAPKAN PETIKAN
        </div>

        {/* Big Pulsing Beat Number */}
        <div
          key={countInBeat}
          style={{
            fontSize: '84px',
            fontWeight: 900,
            fontFamily: 'var(--font-mono)',
            color: countInBeat === 1 ? '#ffb86c' : '#ffffff',
            lineHeight: 1,
            textShadow: countInBeat === 1
              ? '0 0 30px rgba(255, 184, 108, 0.9)'
              : '0 0 20px rgba(255, 255, 255, 0.6)',
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
                  backgroundColor: isActive ? '#ffb86c' : '#3d3232',
                  boxShadow: isActive ? '0 0 10px #ffb86c' : 'none',
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
            color: '#a89d9d',
            marginTop: '2px',
          }}
        >
          {tempo} BPM · Birama {timeSignature}
        </div>
      </div>
    </div>
  );
};
