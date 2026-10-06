import React from 'react';
import { Play, Pause, Square, Timer } from 'lucide-react';
import { formatTime } from '../../utils/guitarMath';

interface TransportCenterClusterProps {
  isPlaying: boolean;
  isCountingIn?: boolean;
  countInBeat?: number;
  currentTime: number;
  duration: number;
  onPlayPause: () => void;
  onStop: () => void;
}

/**
 * Main transport control center featuring Stop, Big Play/Pause,
 * Count-In visual indicator, and elapsed/total duration readout.
 */
export const TransportCenterCluster: React.FC<TransportCenterClusterProps> = ({
  isPlaying,
  isCountingIn = false,
  countInBeat = 0,
  currentTime,
  duration,
  onPlayPause,
  onStop,
}) => {
  return (
    <div
      className="telemetry-center-cluster"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flexShrink: 0,
      }}
    >
      {/* Stop button */}
      <button
        onClick={onStop}
        className="studio-btn-base"
        style={{
          width: '24px',
          height: '24px',
          padding: 0,
          borderRadius: '3px',
          border: '1px solid var(--border-medium)',
          backgroundColor: 'var(--bg-control)',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxSizing: 'border-box',
        }}
        title="Hentikan & Reset ke Awal"
        aria-label="Hentikan & Reset ke Awal"
      >
        <Square size={11} />
      </button>

      {/* Big Play/Pause Button */}
      <button
        onClick={onPlayPause}
        className={!isPlaying && !isCountingIn ? 'studio-btn-coral studio-play-pulse' : 'studio-btn-coral'}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          height: '26px',
          padding: '0 14px',
          borderRadius: '3px',
          border: 'none',
          backgroundColor: isCountingIn ? 'var(--accent-amber)' : 'var(--accent-coral)',
          color: 'var(--text-inverse)',
          fontSize: '10.5px',
          fontWeight: 800,
          fontFamily: 'var(--font-mono)',
          cursor: 'pointer',
          boxShadow: isCountingIn
            ? '0 0 14px rgba(255, 184, 108, 0.6)'
            : '0 0 12px var(--accent-coral-glow)',
          transition: 'all 0.15s ease',
          boxSizing: 'border-box',
        }}
        title={isCountingIn ? 'Hitungan awal aktif... Klik untuk batal' : isPlaying ? 'Jeda Lagu [Spasi]' : 'Putar Lagu [Spasi]'}
        aria-label={isCountingIn ? 'Hitungan awal aktif... Klik untuk batal' : isPlaying ? 'Jeda Lagu [Spasi]' : 'Putar Lagu [Spasi]'}
      >
        {isCountingIn ? (
          <>
            <Timer size={12} />
            <span>COUNT {countInBeat > 0 ? countInBeat : '...'}</span>
          </>
        ) : isPlaying ? (
          <>
            <Pause size={12} />
            <span>PAUSE</span>
          </>
        ) : (
          <>
            <Play size={12} fill="var(--text-inverse)" />
            <span>PLAY</span>
          </>
        )}
      </button>

      {/* Time text */}
      <div
        style={{
          fontSize: '10px',
          fontWeight: 700,
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-muted)',
          minWidth: '80px',
          textAlign: 'center',
        }}
      >
        <span style={{ color: 'var(--text-primary)' }}>{formatTime(currentTime)}</span>
        <span style={{ margin: '0 3px', color: 'var(--border-strong)' }}>/</span>
        <span style={{ color: 'var(--text-secondary)' }}>{formatTime(duration)}</span>
      </div>
    </div>
  );
};
