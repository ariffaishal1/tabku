import React from 'react';
import { Zap } from 'lucide-react';

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
        backgroundColor: 'var(--bg-surface-elevated)',
        backdropFilter: 'blur(8px)',
        border: '1.5px solid var(--accent-amber)',
        boxShadow: '0 6px 24px rgba(0, 0, 0, 0.75), 0 0 20px var(--accent-amber)',
        borderRadius: '20px',
        padding: '6px 20px',
        color: 'var(--accent-amber)',
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
      <Zap size={14} color="var(--accent-amber)" style={{ flexShrink: 0 }} />
      <span>{notification}</span>
    </div>
  );
};
