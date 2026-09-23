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
        gap: '8px',
        padding: '6px 20px',
        backgroundColor: '#161212',
        borderBottom: '1px solid #282121',
        overflowX: 'auto',
        boxSizing: 'border-box',
        userSelect: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginRight: '8px',
          fontSize: '10px',
          fontWeight: '800',
          color: '#8c7d7d',
          letterSpacing: '0.8px',
          fontFamily: 'var(--font-mono)',
          whiteSpace: 'nowrap',
        }}
      >
        <Layers size={13} color="#FF7A65" />
        <span>TRACK FLOW:</span>
      </div>

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        {tracks.map((track) => {
          const isActive = track.index === activeTrackIndex;

          return (
            <div
              key={track.index}
              onClick={() => onSelectTrack(track.index)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 10px',
                borderRadius: '4px',
                border: `1px solid ${isActive ? '#FF7A65' : '#302626'}`,
                backgroundColor: isActive ? 'rgba(255, 122, 101, 0.15)' : '#1e1818',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {/* Active Indicator dot */}
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: isActive ? '#FF7A65' : '#574c4c',
                  boxShadow: isActive ? '0 0 6px #FF7A65' : 'none',
                }}
              />

              <span
                style={{
                  fontSize: '11.5px',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#ffffff' : '#b0a4a4',
                  whiteSpace: 'nowrap',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {track.name}
              </span>

              {/* String count badge */}
              <span
                style={{
                  fontSize: '9px',
                  fontFamily: 'var(--font-mono)',
                  color: isActive ? '#FF7A65' : '#726666',
                  padding: '1px 4px',
                  borderRadius: '2px',
                  backgroundColor: '#120e0e',
                  border: '1px solid #2e2424',
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
                    padding: '2px',
                    borderRadius: '2px',
                    border: 'none',
                    background: track.isMuted ? 'rgba(239, 68, 68, 0.3)' : 'transparent',
                    color: track.isMuted ? '#ff5555' : '#726666',
                    cursor: 'pointer',
                  }}
                >
                  {track.isMuted ? <VolumeX size={11} /> : <Volume2 size={11} />}
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
                    padding: '1px 4px',
                    borderRadius: '2px',
                    border: `1px solid ${track.isSolo ? '#FF7A65' : '#3d3232'}`,
                    background: track.isSolo ? '#FF7A65' : 'transparent',
                    color: track.isSolo ? '#120e0e' : '#726666',
                    fontSize: '9px',
                    fontWeight: 800,
                    fontFamily: 'var(--font-mono)',
                    cursor: 'pointer',
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
