import React, { useState, useEffect, useMemo } from 'react';
import type { SectionMarker } from '../../services/timelineExtractor';
import { findSectionAtTime } from '../../services/timelineExtractor';
import { getSectionStyle, SectionIcon } from '../../utils/sectionColors';
import { formatTime } from '../../utils/guitarMath';

interface ScrubberTimelineProps {
  currentTime: number;
  duration: number;
  onSeek: (seconds: number) => void;
  sections?: SectionMarker[];
  loopA?: number | null;
  loopB?: number | null;
  isPlaying: boolean;
}

/**
 * Interactive DAW-grade seekbar track with section tick marks,
 * glowing A-B loop boundary overlay, and floating hover timestamp tooltip.
 */
export const ScrubberTimeline: React.FC<ScrubberTimelineProps> = ({
  currentTime,
  duration,
  onSeek,
  sections,
  loopA,
  loopB,
  isPlaying,
}) => {
  const [isSeekbarHovered, setIsSeekbarHovered] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState<number | null>(null);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const loopAPercent = loopA != null && duration > 0 ? (loopA / duration) * 100 : null;
  const loopBPercent = loopB != null && duration > 0 ? (loopB / duration) * 100 : null;
  const hasABLoop = loopA != null && loopB != null;
  const hasSections = Boolean(sections && sections.length > 0);

  // Section under hover position on seekbar
  const hoveredSection = useMemo(() => {
    if (!sections || sections.length === 0 || hoverTime === null) return null;
    return findSectionAtTime(sections, hoverTime * 1000);
  }, [sections, hoverTime]);

  const hoveredStyle = hoveredSection ? getSectionStyle(hoveredSection.name) : null;

  // Pulse state for A-B loop active indicator (glow/toggle animation during playback)
  const [loopPulseOn, setLoopPulseOn] = useState<boolean>(false);
  // oxlint-disable-next-line react/set-state-in-effect -- intentional: synchronously reset pulse state when conditions change; the setInterval handles the ongoing animation
  useEffect(() => {
    if (!hasABLoop || !isPlaying) {
      // oxlint-disable-next-line react/set-state-in-effect -- intentional: guard reset
      setLoopPulseOn(false);
      return;
    }
    const id = window.setInterval(() => {
      setLoopPulseOn((prev) => !prev);
    }, 520);
    return () => window.clearInterval(id);
  }, [hasABLoop, isPlaying]);

  return (
    <div
      onMouseEnter={() => setIsSeekbarHovered(true)}
      onMouseLeave={() => {
        setIsSeekbarHovered(false);
        setHoverTime(null);
        setHoverX(null);
      }}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
        const ratio = Math.max(0, Math.min(1, clickX / rect.width));
        setHoverTime(ratio * duration);
        setHoverX(clickX);
      }}
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
        const ratio = Math.max(0, Math.min(1, clickX / rect.width));
        if (duration > 0) {
          onSeek(ratio * duration);
        }
      }}
      style={{
        width: '100%',
        height: '11px',
        backgroundColor: 'transparent',
        cursor: 'pointer',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        flexShrink: 0,
      }}
    >
      {/* Floating timestamp & section tooltip on hover */}
      {isSeekbarHovered && hoverTime !== null && hoverX !== null && (
        <div
          style={{
            position: 'absolute',
            left: `${Math.max(40, Math.min(window.innerWidth - 40, hoverX))}px`,
            bottom: '16px',
            transform: 'translateX(-50%)',
            backgroundColor: 'var(--bg-surface-elevated)',
            border: `1px solid ${hoveredStyle ? hoveredStyle.color : 'var(--accent-coral)'}`,
            borderRadius: '4px',
            padding: '2px 6px',
            fontSize: '9.5px',
            fontFamily: 'var(--font-mono)',
            fontWeight: 800,
            color: 'var(--text-primary)',
            pointerEvents: 'none',
            zIndex: 25,
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.75)',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          {hoveredSection && hoveredStyle ? (
            <>
              <SectionIcon category={hoveredStyle.category} size={10} color={hoveredStyle.color} />
              <span style={{ color: hoveredStyle.color, fontWeight: 900, textTransform: 'uppercase' }}>
                {hoveredSection.name}
              </span>
              <span style={{ color: 'var(--border-strong)' }}>·</span>
              <span style={{ color: 'var(--text-secondary)' }}>
                BAR {hoveredSection.barIndex < 10 ? `00${hoveredSection.barIndex}` : hoveredSection.barIndex < 100 ? `0${hoveredSection.barIndex}` : hoveredSection.barIndex}
              </span>
              <span style={{ color: 'var(--border-strong)' }}>·</span>
              <span>{formatTime(hoverTime)}</span>
            </>
          ) : (
            <span>{formatTime(hoverTime)}</span>
          )}
        </div>
      )}

      {/* Track Bar (Always visible with clear, stylish contrast) */}
      <div
        style={{
          width: '100%',
          height: isSeekbarHovered ? '5px' : '3px',
          backgroundColor: 'var(--border-subtle)',
          borderTop: '1px solid var(--border-medium)',
          borderBottom: '1px solid var(--border-medium)',
          position: 'relative',
          transition: 'height 0.15s ease',
          overflow: 'visible',
        }}
      >
        {/* Section Dividers / Tick marks on scrubber track */}
        {hasSections &&
          sections!.map((sec, idx) => {
            const tickPercent = duration > 0 ? (sec.startMs / (duration * 1000)) * 100 : 0;
            if (tickPercent <= 0.2 || tickPercent >= 99.8) return null;
            const tickStyle = getSectionStyle(sec.name);
            return (
              <div
                key={`sec-tick-${idx}`}
                style={{
                  position: 'absolute',
                  left: `${tickPercent}%`,
                  top: 0,
                  bottom: 0,
                  width: '1px',
                  backgroundColor: tickStyle.color,
                  opacity: 0.65,
                  zIndex: 3,
                  pointerEvents: 'none',
                }}
              />
            );
          })}

        {/* A-B Loop shaded region (Above progress bar, clear visible glowing region) */}
        {hasABLoop && loopAPercent != null && loopBPercent != null && (
          <div
            style={{
              position: 'absolute',
              left: `${loopAPercent}%`,
              width: `${loopBPercent - loopAPercent}%`,
              height: '100%',
              backgroundColor: loopPulseOn
                ? 'rgba(80, 250, 123, 0.32)'
                : 'rgba(80, 250, 123, 0.22)',
              borderLeft: '2px solid #50fa7b',
              borderRight: '2px solid var(--accent-coral)',
              borderTop: '1px solid rgba(80, 250, 123, 0.6)',
              borderBottom: '1px solid rgba(80, 250, 123, 0.6)',
              boxSizing: 'border-box',
              pointerEvents: 'none',
              zIndex: 3,
              boxShadow: loopPulseOn
                ? '0 0 18px rgba(80, 250, 123, 0.65), 0 0 4px var(--accent-coral-glow)'
                : '0 0 10px rgba(80, 250, 123, 0.3)',
              transition: 'background-color 240ms ease, box-shadow 240ms ease',
            }}
          />
        )}

        {/* Point A Flag & Marker */}
        {loopAPercent != null && (
          <>
            <div
              style={{
                position: 'absolute',
                left: `${loopAPercent}%`,
                width: '2px',
                height: '100%',
                backgroundColor: '#50fa7b',
                boxShadow: '0 0 8px #50fa7b',
                pointerEvents: 'none',
                zIndex: 4,
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: `${loopAPercent}%`,
                top: '-11px',
                transform: 'translateX(-50%)',
                backgroundColor: '#50fa7b',
                color: '#120e0e',
                fontSize: '7.5px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 900,
                padding: '0 2px',
                borderRadius: '2px',
                pointerEvents: 'none',
                zIndex: 6,
                boxShadow: '0 1px 4px rgba(0,0,0,0.8)',
                lineHeight: '10px',
              }}
            >
              A
            </div>
          </>
        )}

        {/* Point B Flag & Marker */}
        {loopBPercent != null && (
          <>
            <div
              style={{
                position: 'absolute',
                left: `${loopBPercent}%`,
                width: '2px',
                height: '100%',
                backgroundColor: 'var(--accent-coral)',
                boxShadow: '0 0 8px var(--accent-coral)',
                pointerEvents: 'none',
                zIndex: 4,
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: `${loopBPercent}%`,
                top: '-11px',
                transform: 'translateX(-50%)',
                backgroundColor: 'var(--accent-coral)',
                color: 'var(--text-inverse)',
                fontSize: '7.5px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 900,
                padding: '0 2px',
                borderRadius: '2px',
                pointerEvents: 'none',
                zIndex: 6,
                boxShadow: '0 1px 4px rgba(0,0,0,0.8)',
                lineHeight: '10px',
              }}
            >
              B
            </div>
          </>
        )}

        {/* Played Progress Fill */}
        <div
          style={{
            height: '100%',
            width: `${Math.min(100, Math.max(0, progressPercent))}%`,
            backgroundColor: 'var(--accent-coral)',
            boxShadow: '0 0 10px var(--accent-coral-glow)',
            position: 'relative',
            zIndex: 2,
          }}
        />

        {/* Scrubber Playhead Handle / Thumb (Always visible, marks exact position) */}
        <div
          style={{
            position: 'absolute',
            left: `${Math.min(100, Math.max(0, progressPercent))}%`,
            top: '50%',
            transform: `translate(-50%, -50%) scale(${isSeekbarHovered ? 1.3 : 1})`,
            width: '9px',
            height: '9px',
            borderRadius: '50%',
            backgroundColor: 'var(--accent-coral)',
            border: '1.5px solid var(--bg-primary)',
            boxShadow: '0 0 8px var(--accent-coral-glow), 0 0 3px rgba(0, 0, 0, 0.6)',
            pointerEvents: 'none',
            zIndex: 5,
            transition: 'transform 0.15s ease',
          }}
        />
      </div>
    </div>
  );
};
