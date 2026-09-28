import React from 'react';

interface SpeedTrainerHUDProps {
  notification: string | null;
}

export const SpeedTrainerHUD: React.FC<SpeedTrainerHUDProps> = ({ notification }) => {
  if (!notification) return null;

  return (
    <div
      className="toast-enter"
      style={{
        position: 'absolute',
        top: '14px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'rgba(25, 18, 18, 0.95)',
        backdropFilter: 'blur(8px)',
        border: '1.5px solid #ffb86c',
        boxShadow: '0 6px 24px rgba(0, 0, 0, 0.75), 0 0 20px rgba(255, 184, 108, 0.45)',
        borderRadius: '20px',
        padding: '6px 20px',
        color: '#ffb86c',
        fontFamily: 'var(--font-mono)',
        fontSize: '11.5px',
        fontWeight: 800,
        letterSpacing: '0.6px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        zIndex: 60,
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ fontSize: '14px', display: 'flex', alignItems: 'center' }}>⚡</span>
      <span>{notification}</span>
    </div>
  );
};
