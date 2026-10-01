import React from 'react';
import type { TrackInfo } from '../../types/guitar';
import { Volume2, VolumeX, Layers } from 'lucide-react';

interface TrackSelectorProps {
  tracks: TrackInfo[];
  activeTrackIndex: number;
  onSelectTrack: (index: number) => void;
  onToggleMute?: (index: number) => void;
  onToggleSolo?: (index: number) => void;
}

export const TrackSelector: React.FC<TrackSelectorProps> = ({
  tracks,
  activeTrackIndex,
  onSelectTrack,
  onToggleMute,
  onToggleSolo,
}) => {
  if (!tracks || tracks.length === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '2px 12px',
        minHeight: '26px',
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        boxSizing: 'border-box',
        userSelect: 'none',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          marginRight: '4px',
          fontSize: '9px',
          fontWeight: 800,
          color: 'var(--text-muted)',
          letterSpacing: '0.6px',
          fontFamily: 'var(--font-mono)',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        <Layers size={11} color="var(--accent-coral)" />
        <span>TRACK FLOW:</span>
      </div>

      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        {tracks.map((track) => {
          const isActive = track.index === activeTrackIndex;

          return (
            <div
              key={track.index}
              onClick={() => onSelectTrack(track.index)}
              className="studio-btn-base"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                height: '20px',
                padding: '0 6px',
                borderRadius: '3px',
                border: `1px solid ${isActive ? 'var(--accent-coral)' : 'var(--border-subtle)'}`,
                backgroundColor: isActive ? 'var(--accent-coral-glow)' : 'var(--bg-surface-elevated)',
                boxShadow: isActive ? '0 0 8px var(--accent-coral-glow)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxSizing: 'border-box',
              }}
            >
              {/* Active Indicator dot */}
              <span
                style={{
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  backgroundColor: isActive ? 'var(--accent-coral)' : 'var(--border-strong)',
                  boxShadow: isActive ? '0 0 5px var(--accent-coral)' : 'none',
                }}
              />

              <span
                style={{
                  fontSize: '10px',
                  fontWeight: isActive ? 800 : 500,
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  whiteSpace: 'nowrap',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {track.name}
              </span>

              {/* String count badge */}
              <span
                style={{
                  fontSize: '8px',
                  fontFamily: 'var(--font-mono)',
                  color: isActive ? 'var(--accent-coral)' : 'var(--text-muted)',
                  padding: '0 3px',
                  borderRadius: '2px',
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border-medium)',
                  lineHeight: '11px',
                }}
              >
                {track.stringCount}S
              </span>

              {/* Mute button */}
              {onToggleMute && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleMute(track.index);
                  }}
                  title={track.isMuted ? 'Unmute track' : 'Mute track'}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1px',
                    borderRadius: '2px',
                    border: 'none',
                    background: track.isMuted ? 'rgba(239, 68, 68, 0.3)' : 'transparent',
                    color: track.isMuted ? 'var(--accent-red)' : 'var(--text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  {track.isMuted ? <VolumeX size={10} /> : <Volume2 size={10} />}
                </button>
              )}

              {/* Solo button */}
              {onToggleSolo && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSolo(track.index);
                  }}
                  title={track.isSolo ? 'Disable Solo' : 'Solo track'}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 3px',
                    borderRadius: '2px',
                    border: `1px solid ${track.isSolo ? 'var(--accent-coral)' : 'var(--border-medium)'}`,
                    background: track.isSolo ? 'var(--accent-coral)' : 'transparent',
                    color: track.isSolo ? 'var(--text-inverse)' : 'var(--text-muted)',
                    fontSize: '8px',
                    fontWeight: 800,
                    fontFamily: 'var(--font-mono)',
                    cursor: 'pointer',
                    lineHeight: '12px',
                  }}
                >
                  S
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
