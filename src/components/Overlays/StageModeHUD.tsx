import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Minimize2, Music2, ChevronDown } from 'lucide-react';
import type { TrackInfo } from '../../types/guitar';

interface StageModeHUDProps {
  isActive: boolean;
  songTitle: string;
  songArtist: string;
  activeTrackName: string;
  tracks: TrackInfo[];
  activeTrackIndex: number;
  onSelectTrack: (index: number) => void;
  tempo: number;
  tuningNames: string[];
  onExitStageMode: () => void;
}

/**
 * Floating Stage Mode / Zen Mode HUD with Auto-Hide.
 * Automatically slides out of view during playback so it does NOT obstruct
 * the guitar fret highway, and smoothly reveals when the mouse approaches
 * the top edge or hovers the subtle notch tab.
 */
export const StageModeHUD: React.FC<StageModeHUDProps> = ({
  isActive,
  songTitle,
  songArtist,
  activeTrackName,
  tracks,
  activeTrackIndex,
  onSelectTrack,
  tempo,
  tuningNames,
  onExitStageMode,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startHideTimer = useCallback((delayMs = 2500) => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }
    hideTimerRef.current = setTimeout(() => {
      setIsVisible(false);
    }, delayMs);
  }, []);

  const cancelHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  // Show initially for 3.5 seconds whenever stage mode is turned on
  useEffect(() => {
    if (isActive) {
      // oxlint-disable-next-line react/set-state-in-effect -- intentional: reset visibility to true whenever stage mode is engaged
      setIsVisible(true);
      startHideTimer(3500);
    } else {
      cancelHideTimer();
    }
    return () => cancelHideTimer();
  }, [isActive, startHideTimer, cancelHideTimer]);

  // Reveal when mouse approaches top edge of the screen (top 50px)
  useEffect(() => {
    if (!isActive) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (e.clientY <= 50) {
        setIsVisible(true);
        cancelHideTimer();
      } else if (!isHovered) {
        startHideTimer(1500);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isActive, isHovered, startHideTimer, cancelHideTimer]);

  if (!isActive) return null;

  // Format tuning summary (e.g. "E B G D A E")
  const tuningSummary = tuningNames.length > 0
    ? [...tuningNames].reverse().map(n => n.replace(/\d/, '')).join(' ')
    : '';

  return (
    <>
      {/* 1. Top Edge Hover Sensor Strip */}
      <div
        onMouseEnter={() => {
          setIsVisible(true);
          cancelHideTimer();
        }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '24px',
          zIndex: 49,
          pointerEvents: 'auto',
          cursor: 'pointer',
        }}
      />

      {/* 2. Floating Stage HUD (Smooth slide-in / slide-out) */}
      <div
        onMouseEnter={() => {
          setIsHovered(true);
          setIsVisible(true);
          cancelHideTimer();
        }}
        onMouseLeave={() => {
          setIsHovered(false);
          startHideTimer(1500);
        }}
        style={{
          position: 'absolute',
          top: '12px',
          left: '50%',
          transform: isVisible
            ? 'translateX(-50%) translateY(0)'
            : 'translateX(-50%) translateY(-150%)',
          opacity: isVisible ? 1 : 0,
          pointerEvents: isVisible ? 'auto' : 'none',
          transition: 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '6px 14px',
          borderRadius: '30px',
          backgroundColor: 'rgba(18, 14, 14, 0.88)',
          border: '1px solid var(--border-medium)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.65), 0 0 1px rgba(255, 255, 255, 0.1)',
          userSelect: 'none',
          maxWidth: '92vw',
        }}
      >
        {/* Live Stage Focus Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '2px 8px',
            borderRadius: '12px',
            backgroundColor: 'rgba(139, 233, 253, 0.15)',
            border: '1px solid var(--accent-cyan)',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-cyan)',
              boxShadow: '0 0 8px var(--accent-cyan)',
              display: 'inline-block',
            }}
          />
          <span
            style={{
              fontSize: '9px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 900,
              color: 'var(--accent-cyan)',
              letterSpacing: '0.8px',
            }}
          >
            STAGE FOCUS
          </span>
        </div>

        {/* Song Title & Artist */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            fontWeight: 800,
            color: 'var(--text-primary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '220px',
          }}
          title={`${songArtist} - ${songTitle}`}
        >
          <span style={{ color: 'var(--text-secondary)' }}>{songArtist.toUpperCase()}</span>
          <span style={{ color: 'var(--accent-coral)' }}>/</span>
          <span>{songTitle.toUpperCase()}</span>
        </div>

        {/* Active Track Name Badge */}
        <div
          style={{
            fontSize: '9.5px',
            fontFamily: 'var(--font-mono)',
            fontWeight: 800,
            color: 'var(--accent-coral)',
            backgroundColor: 'var(--accent-coral-glow)',
            border: '1px solid var(--accent-coral)',
            borderRadius: '10px',
            padding: '1px 7px',
            whiteSpace: 'nowrap',
          }}
          title={`Trek aktif: ${activeTrackName}`}
        >
          {activeTrackName.toUpperCase()}
        </div>

        {/* Tuning & Tempo Pill */}
        <div
          style={{
            fontSize: '9.5px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            whiteSpace: 'nowrap',
          }}
        >
          <span>{tempo} BPM</span>
          {tuningSummary && (
            <>
              <span style={{ color: 'var(--border-strong)' }}>·</span>
              <span style={{ color: 'var(--accent-coral)' }}>{tuningSummary}</span>
            </>
          )}
        </div>

        {/* Quick Track Switcher Pills (If multiple tracks available) */}
        {tracks.length > 1 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              borderLeft: '1px solid var(--border-subtle)',
              paddingLeft: '8px',
            }}
          >
            {tracks.map((t) => {
              const isCurrent = t.index === activeTrackIndex;
              return (
                <button
                  key={`stage-track-${t.index}`}
                  onClick={() => onSelectTrack(t.index)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '12px',
                    border: isCurrent ? '1px solid var(--accent-coral)' : '1px solid transparent',
                    backgroundColor: isCurrent ? 'var(--accent-coral-glow)' : 'transparent',
                    color: isCurrent ? 'var(--accent-coral)' : 'var(--text-secondary)',
                    fontSize: '9px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 800,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap',
                  }}
                  title={`Pindah ke trek ${t.name}`}
                >
                  <Music2 size={10} style={{ display: 'inline', marginRight: '3px', verticalAlign: '-1px' }} />
                  {t.shortName || t.name.split(' ')[0]}
                </button>
              );
            })}
          </div>
        )}

        {/* Exit Stage Mode Button */}
        <button
          onClick={onExitStageMode}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '4px 10px',
            borderRadius: '16px',
            border: '1px solid var(--border-strong)',
            backgroundColor: 'var(--bg-control)',
            color: 'var(--text-secondary)',
            fontSize: '10px',
            fontFamily: 'var(--font-mono)',
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            marginLeft: '4px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--accent-coral-glow)';
            e.currentTarget.style.borderColor = 'var(--accent-coral)';
            e.currentTarget.style.color = 'var(--accent-coral)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-control)';
            e.currentTarget.style.borderColor = 'var(--border-strong)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
          title="Kembali ke tampilan normal (Shortcut: Z atau Esc)"
        >
          <Minimize2 size={11} />
          <span>KELUAR</span>
          <span
            style={{
              fontSize: '8px',
              backgroundColor: 'var(--bg-primary)',
              padding: '1px 4px',
              borderRadius: '3px',
              color: 'var(--text-muted)',
            }}
          >
            Z
          </span>
        </button>
      </div>

      {/* 3. Minimal Auto-Hide Notch Tab (Visible when HUD is hidden, 0% obstruction) */}
      {!isVisible && (
        <div
          onClick={() => {
            setIsVisible(true);
            cancelHideTimer();
          }}
          onMouseEnter={() => {
            setIsVisible(true);
            cancelHideTimer();
          }}
          title="Arahkan kursor ke sini untuk menampilkan kontrol Stage (Shortcut: Z / Esc)"
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2px 14px 4px 14px',
            backgroundColor: 'rgba(18, 14, 14, 0.7)',
            borderBottomLeftRadius: '8px',
            borderBottomRightRadius: '8px',
            border: '1px solid var(--border-subtle)',
            borderTop: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.4)',
          }}
        >
          <span
            style={{
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-cyan)',
              boxShadow: '0 0 6px var(--accent-cyan)',
              display: 'inline-block',
              marginRight: '6px',
            }}
          />
          <span
            style={{
              fontSize: '8.5px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 800,
              color: 'var(--text-secondary)',
              letterSpacing: '0.6px',
            }}
          >
            STAGE
          </span>
          <ChevronDown size={11} color="var(--text-muted)" style={{ marginLeft: '4px' }} />
        </div>
      )}
    </>
  );
};
