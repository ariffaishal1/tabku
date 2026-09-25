import React from 'react';

interface SpeedTrainerHUDProps {
  notification: string | null;
}

export const SpeedTrainerHUD: React.FC<SpeedTrainerHUDProps> = ({ notification }) => {
  if (!notification) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: '12px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'rgba(22, 16, 16, 0.94)',
        border: '1.5px solid #ffb86c',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.6), 0 0 16px rgba(255, 184, 108, 0.4)',
        borderRadius: '6px',
        padding: '7px 18px',
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
        animation: 'modalFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <span style={{ fontSize: '14px' }}>⚡</span>
      <span>{notification}</span>
    </div>
  );
};
