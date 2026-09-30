import React from 'react';
import { Play, Pause, Square, Zap, Music, Volume2, VolumeX, X, Metronome, Timer, TrendingUp, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import type { ExtractedNote, SectionMarker } from '../../services/timelineExtractor';
import { findSectionAtTime } from '../../services/timelineExtractor';
import { getSectionStyle } from '../../utils/sectionColors';
import { formatTime } from '../../utils/guitarMath';

interface TelemetryBarProps {
  currentNotes: ExtractedNote[];
  nextNotes: ExtractedNote[];
  currentChordName?: string;
  nextChordName?: string;
  currentSection?: string;
  nextSection?: string;
  sections?: SectionMarker[];
  onPrevSection?: () => void;
  onNextSection?: () => void;
  barIndex: number;
  tempo: number;
  timeSignature?: string;

  // Playback controls
  isPlaying: boolean;
  onPlayPause: () => void;
  onStop: () => void;
  currentTime: number;
  duration: number;
  onSeek: (seconds: number) => void;
  speed: number;
  isSoloSlowdown: boolean;
  onToggleSoloSlowdown: () => void;
  isLooping: boolean;
  onToggleLoop: () => void;
  isSheetExpanded: boolean;
  onToggleSheet: () => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
  onSpeedChange?: (speed: number) => void;

  // A-B Looper
  loopA?: number | null;
  loopB?: number | null;
  onSetLoopA?: () => void;
  onSetLoopB?: () => void;
  onClearABLoop?: () => void;

  // Flip Strings (Player POV)
  isFlipped?: boolean;
  onToggleFlip?: () => void;

  // Metronome & Count-In
  isMetronomeOn?: boolean;
  onToggleMetronome?: () => void;
  metronomeVolume?: number;
  onMetronomeVolumeChange?: (vol: number) => void;
  isCountInEnabled?: boolean;
  onToggleCountIn?: () => void;
  isCountingIn?: boolean;
  countInBeat?: number;

  // Transpose / Virtual Pitch Shifter (FR-NEXT-04)
  transpose?: number;
  onTransposeChange?: (semitones: number) => void;

  // Speed Trainer (FR-NEXT-06)
  isSpeedTrainer?: boolean;
  onToggleSpeedTrainer?: () => void;
  speedTrainerStep?: number;
  speedTrainerTarget?: number;
  speedTrainerLoopCount?: number;
}

export const TelemetryBar: React.FC<TelemetryBarProps> = ({
  currentSection,
  nextSection,
  sections,
  onPrevSection,
  onNextSection,
  barIndex,
  tempo,
  timeSignature = '4/4',
  isPlaying,
  onPlayPause,
  onStop,
  currentTime,
  duration,
  onSeek,
  speed,
  isSoloSlowdown,
  onToggleSoloSlowdown,
  isLooping,
  onToggleLoop,
  isSheetExpanded,
  onToggleSheet,
  volume,
  onVolumeChange,
  onSpeedChange,
  loopA,
  loopB,
  onSetLoopA,
  onSetLoopB,
  onClearABLoop,
  isFlipped = false,
  onToggleFlip,
  isMetronomeOn = false,
  onToggleMetronome,
  metronomeVolume = 0.7,
  onMetronomeVolumeChange,
  isCountInEnabled = false,
  onToggleCountIn,
  isCountingIn = false,
  countInBeat = 0,
  transpose = 0,
  onTransposeChange,
  isSpeedTrainer = false,
  onToggleSpeedTrainer,
  speedTrainerStep = 0.05,
  speedTrainerTarget = 1.0,
  speedTrainerLoopCount = 0,
}) => {
  // Bar number formatting
  const formattedBar = barIndex < 10 ? `00${barIndex}` : barIndex < 100 ? `0${barIndex}` : `${barIndex}`;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const loopAPercent = loopA != null && duration > 0 ? (loopA / duration) * 100 : null;
  const loopBPercent = loopB != null && duration > 0 ? (loopB / duration) * 100 : null;
  const hasABLoop = loopA != null && loopB != null;

  const [isSeekbarHovered, setIsSeekbarHovered] = React.useState(false);
  const [hoverTime, setHoverTime] = React.useState<number | null>(null);
  const [hoverX, setHoverX] = React.useState<number | null>(null);
  const [isSectionMenuOpen, setIsSectionMenuOpen] = React.useState(false);
  const sectionMenuRef = React.useRef<HTMLDivElement>(null);

  // Active section based on current playback time
  const activeSection = React.useMemo(() => {
    if (!sections || sections.length === 0) return null;
    return findSectionAtTime(sections, currentTime * 1000);
  }, [sections, currentTime]);

  const activeSectionDisplayName = activeSection?.name || currentSection || nextSection || 'Main';
  const activeStyle = getSectionStyle(activeSectionDisplayName);
  const hasSections = Boolean(sections && sections.length > 0);

  // Section under hover position on seekbar
  const hoveredSection = React.useMemo(() => {
    if (!sections || sections.length === 0 || hoverTime === null) return null;
    return findSectionAtTime(sections, hoverTime * 1000);
  }, [sections, hoverTime]);

  const hoveredStyle = hoveredSection ? getSectionStyle(hoveredSection.name) : null;

  // Dismiss section jump popover on outside click or Escape
  React.useEffect(() => {
    if (!isSectionMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (sectionMenuRef.current && !sectionMenuRef.current.contains(event.target as Node)) {
        setIsSectionMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSectionMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSectionMenuOpen]);

  // Pulse state for A-B loop active indicator (glow/toggle animation during playback)
  const [loopPulseOn, setLoopPulseOn] = React.useState<boolean>(false);
  // oxlint-disable-next-line react/set-state-in-effect -- intentional: synchronously reset pulse state when conditions change; the setInterval handles the ongoing animation
  React.useEffect(() => {
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
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        backgroundColor: 'var(--bg-surface)',
        borderTop: '1px solid var(--border-subtle)',
        boxSizing: 'border-box',
        userSelect: 'none',
        flexShrink: 0,
      }}
    >
      {/* 1. Mini-Map Section Ribbon (DAW-grade arrangement overview) */}
      {hasSections && duration > 0 && (
        <div
          className="telemetry-section-ribbon"
          style={{
            width: '100%',
            height: '18px',
            backgroundColor: 'var(--bg-primary)',
            borderBottom: '1px solid var(--border-subtle)',
            position: 'relative',
            display: 'flex',
            overflow: 'hidden',
          }}
        >
          {sections!.map((sec, idx) => {
            const startPct = (sec.startMs / (duration * 1000)) * 100;
            const durMs =
              sec.durationMs ??
              (idx < sections!.length - 1 ? sections![idx + 1].startMs - sec.startMs : duration * 1000 - sec.startMs);
            const widthPct = Math.max(0.5, (durMs / (duration * 1000)) * 100);
            const isCurrent = activeSection?.name === sec.name && activeSection?.startMs === sec.startMs;
            const style = getSectionStyle(sec.name);

            return (
              <div
                key={`ribbon-sec-${idx}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSeek(sec.startMs / 1000);
                }}
                title={`Lompat ke ${sec.name} (${formatTime(sec.startMs / 1000)}) · Bar ${sec.barIndex}`}
                style={{
                  position: 'absolute',
                  left: `${startPct}%`,
                  width: `${widthPct}%`,
                  height: '100%',
                  backgroundColor: isCurrent ? style.bg : 'transparent',
                  borderTop: isCurrent ? `2px solid ${style.color}` : `1px solid ${style.color}55`,
                  borderRight: idx < sections!.length - 1 ? '1px solid var(--border-medium)' : 'none',
                  boxSizing: 'border-box',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 4px',
                  gap: '3px',
                  overflow: 'hidden',
                  transition: 'background-color 0.15s ease, border-color 0.15s ease',
                  boxShadow: isCurrent ? `inset 0 0 8px ${style.bg}` : 'none',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = isCurrent ? style.bg : 'var(--bg-control)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = isCurrent ? style.bg : 'transparent';
                }}
              >
                <span style={{ fontSize: '9px', lineHeight: 1, flexShrink: 0 }}>
                  {style.icon}
                </span>
                <span
                  style={{
                    fontSize: '9px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: isCurrent ? 800 : 600,
                    color: isCurrent ? style.color : 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.4px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    lineHeight: '18px',
                  }}
                >
                  {sec.name}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* 2. Scrub Progress Bar — Always visible, interactive DAW-grade seekbar */}
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
          height: '16px',
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
              bottom: '22px',
              transform: 'translateX(-50%)',
              backgroundColor: 'var(--bg-surface-elevated)',
              border: `1px solid ${hoveredStyle ? hoveredStyle.color : 'var(--accent-coral)'}`,
              borderRadius: '4px',
              padding: '3px 8px',
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 800,
              color: 'var(--text-primary)',
              pointerEvents: 'none',
              zIndex: 25,
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.75)',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {hoveredSection ? (
              <>
                <span style={{ fontSize: '11px' }}>{hoveredStyle?.icon}</span>
                <span style={{ color: hoveredStyle?.color, fontWeight: 900, textTransform: 'uppercase' }}>
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
            height: isSeekbarHovered ? '8px' : '6px',
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
                  top: '-13px',
                  transform: 'translateX(-50%)',
                  backgroundColor: '#50fa7b',
                  color: '#120e0e',
                  fontSize: '8px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 900,
                  padding: '0 3px',
                  borderRadius: '2px',
                  pointerEvents: 'none',
                  zIndex: 6,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.8)',
                  lineHeight: '12px',
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
                  top: '-13px',
                  transform: 'translateX(-50%)',
                  backgroundColor: 'var(--accent-coral)',
                  color: 'var(--text-inverse)',
                  fontSize: '8px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 900,
                  padding: '0 3px',
                  borderRadius: '2px',
                  pointerEvents: 'none',
                  zIndex: 6,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.8)',
                  lineHeight: '12px',
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
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-coral)',
              border: '2px solid var(--bg-primary)',
              boxShadow: '0 0 10px var(--accent-coral-glow), 0 0 4px rgba(0, 0, 0, 0.6)',
              pointerEvents: 'none',
              zIndex: 5,
              transition: 'transform 0.15s ease',
            }}
          />
        </div>
      </div>

      {/* 2. Studio Transport & Practice Controls Bar */}
      <div
        className="telemetry-transport-row"
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: '58px',
          padding: '0 20px',
          gap: '16px',
        }}
      >
        {/* Left Side: Session Status & Practice Tools */}
        <div
          className="telemetry-left-cluster"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexShrink: 0,
          }}
        >
          {/* Song Section & Bar Indicator DAW Cluster */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              position: 'relative',
            }}
            ref={sectionMenuRef}
          >
            {/* Bar Badge */}
            <div
              style={{
                backgroundColor: 'var(--bg-control)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '4px',
                padding: '5px 8px',
                fontSize: '10px',
                fontWeight: 800,
                fontFamily: 'var(--font-mono)',
                color: 'var(--accent-coral)',
                letterSpacing: '0.5px',
                display: 'flex',
                alignItems: 'center',
                height: '28px',
                boxSizing: 'border-box',
              }}
              title={`Birama aktif: Bar ${barIndex}\nTempo: ${tempo} BPM · ${timeSignature}`}
            >
              BAR {formattedBar}
            </div>

            {/* Section Switcher & Popover Trigger */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'var(--bg-control)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '4px',
                padding: '2px',
                height: '28px',
                boxSizing: 'border-box',
              }}
            >
              {/* Prev Section Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPrevSection?.();
                }}
                disabled={!hasSections}
                title="Bagian Sebelumnya (Shift + ←)"
                style={{
                  width: '20px',
                  height: '22px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '3px',
                  color: hasSections ? 'var(--text-secondary)' : 'var(--text-muted)',
                  cursor: hasSections ? 'pointer' : 'not-allowed',
                  opacity: hasSections ? 1 : 0.4,
                  padding: 0,
                  transition: 'color 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (hasSections) e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={(e) => {
                  if (hasSections) e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                <ChevronLeft size={13} />
              </button>

              {/* Active Section Pill (Dropdown Trigger) */}
              <button
                onClick={() => {
                  if (hasSections) {
                    setIsSectionMenuOpen((prev) => !prev);
                  }
                }}
                disabled={!hasSections}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '0 6px',
                  height: '22px',
                  backgroundColor: isSectionMenuOpen ? 'var(--bg-surface-elevated)' : 'transparent',
                  border: '1px solid',
                  borderColor: isSectionMenuOpen ? activeStyle.color : 'transparent',
                  borderRadius: '3px',
                  cursor: hasSections ? 'pointer' : 'default',
                  transition: 'all 0.15s ease',
                }}
                title={hasSections ? `Bagian Lagu: ${activeSectionDisplayName} (Klik untuk daftar section)\nBirama: ${barIndex}\nTempo: ${tempo} BPM · ${timeSignature}` : undefined}
              >
                <span style={{ fontSize: '11px', lineHeight: 1 }}>{activeStyle.icon}</span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    fontFamily: 'var(--font-sans)',
                    color: activeStyle.color,
                    maxWidth: '100px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {activeSectionDisplayName}
                </span>
                {hasSections && (
                  <ChevronDown
                    size={11}
                    style={{
                      color: 'var(--text-muted)',
                      transform: isSectionMenuOpen ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.2s ease',
                      flexShrink: 0,
                    }}
                  />
                )}
              </button>

              {/* Next Section Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onNextSection?.();
                }}
                disabled={!hasSections}
                title="Bagian Berikutnya (Shift + →)"
                style={{
                  width: '20px',
                  height: '22px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '3px',
                  color: hasSections ? 'var(--text-secondary)' : 'var(--text-muted)',
                  cursor: hasSections ? 'pointer' : 'not-allowed',
                  opacity: hasSections ? 1 : 0.4,
                  padding: 0,
                  transition: 'color 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (hasSections) e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={(e) => {
                  if (hasSections) e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                <ChevronRight size={13} />
              </button>
            </div>

            {/* Section Jump Popover */}
            {isSectionMenuOpen && sections && sections.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 'calc(100% + 8px)',
                  left: 0,
                  width: '240px',
                  maxHeight: '260px',
                  overflowY: 'auto',
                  backgroundColor: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '8px',
                  boxShadow: '0 12px 32px rgba(0, 0, 0, 0.7), 0 0 1px rgba(255, 255, 255, 0.15)',
                  padding: '6px',
                  zIndex: 100,
                  backdropFilter: 'blur(16px)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '3px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '4px 6px 6px 6px',
                    borderBottom: '1px solid var(--border-subtle)',
                    marginBottom: '2px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-secondary)',
                      letterSpacing: '0.8px',
                    }}
                  >
                    BAGIAN LAGU ({sections.length})
                  </span>
                  <span
                    style={{
                      fontSize: '9px',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    Shift + ← / →
                  </span>
                </div>

                {sections.map((sec, idx) => {
                  const isCurrent = activeSection?.name === sec.name && activeSection?.startMs === sec.startMs;
                  const secStyle = getSectionStyle(sec.name);
                  return (
                    <button
                      key={`popover-sec-${idx}`}
                      onClick={() => {
                        onSeek(sec.startMs / 1000);
                        setIsSectionMenuOpen(false);
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 8px',
                        borderRadius: '5px',
                        border: isCurrent ? `1px solid ${secStyle.color}` : '1px solid transparent',
                        backgroundColor: isCurrent ? secStyle.bg : 'transparent',
                        cursor: 'pointer',
                        textAlign: 'left',
                        gap: '8px',
                        transition: 'all 0.12s ease',
                        boxSizing: 'border-box',
                      }}
                      onMouseEnter={(e) => {
                        if (!isCurrent) {
                          e.currentTarget.style.backgroundColor = 'var(--bg-control)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isCurrent) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                        <span style={{ fontSize: '13px', lineHeight: 1, flexShrink: 0 }}>{secStyle.icon}</span>
                        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: isCurrent ? 800 : 600,
                              color: isCurrent ? secStyle.color : 'var(--text-primary)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {sec.name}
                          </span>
                          <span
                            style={{
                              fontSize: '9px',
                              fontFamily: 'var(--font-mono)',
                              color: 'var(--text-muted)',
                            }}
                          >
                            Bar {sec.barIndex}
                          </span>
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: '10px',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          color: isCurrent ? secStyle.color : 'var(--text-secondary)',
                          flexShrink: 0,
                        }}
                      >
                        {formatTime(sec.startMs / 1000)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ width: '1px', height: '22px', backgroundColor: 'var(--border-subtle)', margin: '0 2px' }} />

          {/* Speed Control with -/+ buttons */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
            }}
          >
            <button
              onClick={() => {
                const newSpeed = Math.max(0.25, Math.round((speed - 0.1) * 10) / 10);
                onSpeedChange?.(newSpeed);
              }}
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '3px',
                border: '1px solid var(--border-medium)',
                backgroundColor: 'var(--bg-control)',
                color: 'var(--text-secondary)',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1,
              }}
              title="Kurangi kecepatan (-0.1x)"
            >
              −
            </button>
            <div
              style={{
                padding: '4px 7px',
                borderRadius: '4px',
                backgroundColor: 'var(--bg-control)',
                border: '1px solid var(--border-medium)',
                color: speed === 1.0 ? 'var(--text-secondary)' : 'var(--accent-coral)',
                fontSize: '11px',
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                minWidth: '40px',
                textAlign: 'center',
              }}
              title="Kecepatan pemutaran saat ini"
            >
              {speed.toFixed(1)}x
            </div>
            <button
              onClick={() => {
                const newSpeed = Math.min(2.0, Math.round((speed + 0.1) * 10) / 10);
                onSpeedChange?.(newSpeed);
              }}
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '3px',
                border: '1px solid var(--border-medium)',
                backgroundColor: 'var(--bg-control)',
                color: 'var(--text-secondary)',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1,
              }}
              title="Tambah kecepatan (+0.1x)"
            >
              +
            </button>
          </div>

          {/* Pitch / Transpose Stepper (-12 to +12 semitones) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
            }}
          >
            <button
              onClick={() => {
                const newVal = Math.max(-12, transpose - 1);
                onTransposeChange?.(newVal);
              }}
              disabled={transpose <= -12}
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '3px',
                border: '1px solid var(--border-medium)',
                backgroundColor: 'var(--bg-control)',
                color: transpose <= -12 ? 'var(--text-muted)' : 'var(--text-secondary)',
                fontSize: '13px',
                fontWeight: 700,
                cursor: transpose <= -12 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1,
              }}
              title="Turunkan tangga nada (-1 semitone / ½ nada)"
            >
              −
            </button>
            <div
              onClick={() => onTransposeChange?.(0)}
              style={{
                padding: '4px 7px',
                borderRadius: '4px',
                backgroundColor: transpose !== 0 ? 'rgba(255, 184, 108, 0.16)' : 'var(--bg-control)',
                border: transpose !== 0 ? '1px solid var(--accent-amber)' : '1px solid var(--border-medium)',
                color: transpose !== 0 ? 'var(--accent-amber)' : 'var(--text-secondary)',
                fontSize: '11px',
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                minWidth: '50px',
                textAlign: 'center',
                cursor: transpose !== 0 ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
                userSelect: 'none',
                boxShadow: transpose !== 0 ? '0 0 10px rgba(255, 184, 108, 0.25)' : 'none',
                transition: 'all 0.15s ease',
              }}
              title={
                transpose === 0
                  ? 'Tangga Nada Asli (0 semitone). Gunakan −/+ untuk mengubah nada audio & tab.'
                  : `Transpose: ${transpose > 0 ? `+${transpose}` : transpose} semitone (${Math.abs(transpose) % 2 === 0 ? `${Math.abs(transpose) / 2} nada penuh` : `${Math.abs(transpose) * 0.5} nada`}).\nKlik untuk reset ke nada asli.`
              }
            >
              <span style={{ fontSize: '9px', opacity: 0.7 }}>KEY</span>
              <span>{transpose === 0 ? '0' : transpose > 0 ? `+${transpose}` : `${transpose}`}</span>
            </div>
            <button
              onClick={() => {
                const newVal = Math.min(12, transpose + 1);
                onTransposeChange?.(newVal);
              }}
              disabled={transpose >= 12}
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '3px',
                border: '1px solid var(--border-medium)',
                backgroundColor: 'var(--bg-control)',
                color: transpose >= 12 ? 'var(--text-muted)' : 'var(--text-secondary)',
                fontSize: '13px',
                fontWeight: 700,
                cursor: transpose >= 12 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1,
              }}
              title="Naikkan tangga nada (+1 semitone / ½ nada)"
            >
              +
            </button>
          </div>

          {/* Solo Slow-Down 50% button */}
          <button
            onClick={onToggleSoloSlowdown}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 11px',
              borderRadius: '4px',
              border: isSoloSlowdown ? '1.5px solid var(--accent-coral)' : '1px solid var(--border-medium)',
              backgroundColor: isSoloSlowdown ? 'var(--accent-coral-glow)' : 'var(--bg-control)',
              color: isSoloSlowdown ? 'var(--accent-coral)' : 'var(--text-secondary)',
              fontSize: '10.5px',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            title="Latih bagian solo dengan kecepatan 50%"
          >
            <Zap size={13} fill={isSoloSlowdown ? 'var(--accent-coral)' : 'none'} />
            <span>SOLO 50%</span>
          </button>

          {/* Speed Trainer (FR-NEXT-06) */}
          {onToggleSpeedTrainer && (
            <button
              onClick={onToggleSpeedTrainer}
              className={isSpeedTrainer ? 'studio-btn-coral' : 'studio-btn-base'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 11px',
                borderRadius: '4px',
                border: isSpeedTrainer ? '1.5px solid var(--accent-amber)' : '1px solid var(--border-medium)',
                backgroundColor: isSpeedTrainer ? 'rgba(255, 184, 108, 0.2)' : 'var(--bg-control)',
                color: isSpeedTrainer ? 'var(--accent-amber)' : 'var(--text-secondary)',
                fontSize: '10.5px',
                fontWeight: 800,
                fontFamily: 'var(--font-mono)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: isSpeedTrainer ? '0 0 10px rgba(255, 184, 108, 0.35)' : 'none',
              }}
              title={`Speed Trainer (FR-NEXT-06)\nKeyboard shortcut: T\n${isSpeedTrainer ? `Aktif: Naik +${Math.round(speedTrainerStep * 100)}% per putaran loop (Target: ${Math.round(speedTrainerTarget * 100)}%)\nPutaran selesai: ${speedTrainerLoopCount}x` : 'Otomatis naikkan tempo (+5%) setiap kali satu putaran loop A-B selesai'}`}
            >
              <TrendingUp size={13} color={isSpeedTrainer ? 'var(--accent-amber)' : 'var(--text-muted)'} />
              <span>TRAINER</span>
              {isSpeedTrainer && (
                <span
                  style={{
                    fontSize: '9px',
                    backgroundColor: 'var(--accent-amber)',
                    color: 'var(--text-inverse)',
                    padding: '1px 4px',
                    borderRadius: '3px',
                    fontWeight: 900,
                  }}
                >
                  +{Math.round(speedTrainerStep * 100)}%
                </span>
              )}
            </button>
          )}

          {/* A-B Looper Cluster */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: 'var(--bg-control)',
              padding: '3px 5px',
              borderRadius: '5px',
              border: hasABLoop ? '1px solid var(--accent-coral)' : '1px solid var(--border-subtle)',
            }}
          >
            {onToggleLoop && (
              <button
                onClick={onToggleLoop}
                style={{
                  padding: '5px 8px',
                  borderRadius: '3px',
                  border: isLooping ? '1px solid var(--accent-coral)' : '1px solid var(--border-medium)',
                  backgroundColor: isLooping ? 'var(--accent-coral-glow)' : 'var(--bg-surface)',
                  color: isLooping ? 'var(--accent-coral)' : 'var(--text-secondary)',
                  fontSize: '10px',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer',
                }}
                title="Ulangi bagian (Looping global)"
              >
                LOOP
              </button>
            )}

            <button
              onClick={onSetLoopA}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                padding: '5px 7px',
                borderRadius: '3px',
                border: loopA != null ? '1px solid var(--accent-green)' : '1px solid var(--border-medium)',
                backgroundColor: loopA != null ? 'rgba(80, 250, 123, 0.15)' : 'var(--bg-surface)',
                color: loopA != null ? 'var(--accent-green)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '10px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
              }}
              title={`Tetapkan titik awal Loop [A]\nKeyboard shortcut: [\n${loopA != null ? `A: ${formatTime(loopA)}` : 'Belum diatur'}`}
            >
              <span>A</span>
              <span style={{ fontSize: '9px', opacity: 0.7 }}>[</span>
              {loopA != null && <span style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>{formatTime(loopA)}</span>}
            </button>

            <button
              onClick={onSetLoopB}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                padding: '5px 7px',
                borderRadius: '3px',
                border: loopB != null ? '1px solid var(--accent-coral)' : '1px solid var(--border-medium)',
                backgroundColor: loopB != null ? 'var(--accent-coral-glow)' : 'var(--bg-surface)',
                color: loopB != null ? 'var(--accent-coral)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '10px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
              }}
              title={`Tetapkan titik akhir Loop [B]\nKeyboard shortcut: ]\n${loopB != null ? `B: ${formatTime(loopB)}` : 'Belum diatur'}`}
            >
              <span>B</span>
              <span style={{ fontSize: '9px', opacity: 0.7 }}>]</span>
              {loopB != null && <span style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>{formatTime(loopB)}</span>}
            </button>

            {hasABLoop && onClearABLoop && (
              <button
                onClick={onClearABLoop}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px',
                  padding: '4px 6px',
                  borderRadius: '3px',
                  border: '1px solid var(--border-strong)',
                  backgroundColor: 'var(--bg-surface-elevated)',
                  color: 'var(--accent-red)',
                  cursor: 'pointer',
                  fontSize: '9px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                }}
                title="Hapus pengaturan Loop A-B\nKeyboard shortcut: Backspace"
              >
                <X size={11} />
                <span>CLR</span>
              </button>
            )}
          </div>

          {/* Flip Strings (Player POV) toggle */}
          {onToggleFlip && (
            <button
              onClick={onToggleFlip}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 10px',
                borderRadius: '4px',
                border: isFlipped ? '1.5px solid var(--accent-cyan)' : '1px solid var(--border-medium)',
                backgroundColor: isFlipped ? 'rgba(139, 233, 253, 0.15)' : 'var(--bg-control)',
                color: isFlipped ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                fontSize: '10px',
                fontWeight: 800,
                fontFamily: 'var(--font-mono)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: isFlipped ? '0 0 6px rgba(139,233,253,0.3)' : 'none',
              }}
              title={`Balik urutan senar (Player POV)\nKeyboard shortcut: F\n${isFlipped ? 'Aktif: Senar 6 di atas, Senar 1 di bawah' : 'Normal: Senar 1 di atas, Senar 6 di bawah'}`}
            >
              <span style={{ fontSize: '12px' }}>⇅</span>
              <span>FLIP</span>
            </button>
          )}
        </div>

        {/* Center: Main Playback Controls */}
        <div
          className="telemetry-center-cluster"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexShrink: 0,
          }}
        >
          {/* Stop button */}
          <button
            onClick={onStop}
            className="studio-btn-base"
            style={{
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid var(--border-medium)',
              backgroundColor: 'var(--bg-control)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Hentikan & Reset ke Awal"
          >
            <Square size={14} />
          </button>

          {/* Big Play/Pause Button */}
          <button
            onClick={onPlayPause}
            className={!isPlaying && !isCountingIn ? 'studio-btn-coral studio-play-pulse' : 'studio-btn-coral'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              padding: '8px 22px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: isCountingIn ? 'var(--accent-amber)' : 'var(--accent-coral)',
              color: 'var(--text-inverse)',
              fontSize: '12px',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              cursor: 'pointer',
              boxShadow: isCountingIn
                ? '0 0 18px rgba(255, 184, 108, 0.6)'
                : '0 0 16px var(--accent-coral-glow)',
              transition: 'all 0.15s ease',
            }}
            title={isCountingIn ? 'Hitungan awal aktif... Klik untuk batal' : isPlaying ? 'Jeda Lagu [Spasi]' : 'Putar Lagu [Spasi]'}
          >
            {isCountingIn ? (
              <>
                <Timer size={15} />
                <span>COUNT {countInBeat > 0 ? countInBeat : '...'}</span>
              </>
            ) : isPlaying ? (
              <>
                <Pause size={15} />
                <span>PAUSE</span>
              </>
            ) : (
              <>
                <Play size={15} fill="var(--text-inverse)" />
                <span>PLAY</span>
              </>
            )}
          </button>

          {/* Time text */}
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-muted)',
              minWidth: '95px',
              textAlign: 'center',
            }}
          >
            <span style={{ color: 'var(--text-primary)' }}>{formatTime(currentTime)}</span>
            <span style={{ margin: '0 3px', color: 'var(--border-strong)' }}>/</span>
            <span style={{ color: 'var(--text-secondary)' }}>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right Side: Audio & View Tools */}
        <div
          className="telemetry-right-cluster"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexShrink: 0,
          }}
        >
          {/* Metronome & Count-In Suite */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: 'var(--bg-control)',
              padding: '3px 6px',
              borderRadius: '5px',
              border: isMetronomeOn || isCountInEnabled ? '1px solid var(--accent-amber)' : '1px solid var(--border-subtle)',
              transition: 'border 0.2s ease',
            }}
          >
            {/* Metronome Toggle */}
            {onToggleMetronome && (
              <button
                onClick={onToggleMetronome}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '5px 8px',
                  borderRadius: '3px',
                  border: isMetronomeOn ? '1.5px solid var(--accent-amber)' : '1px solid var(--border-medium)',
                  backgroundColor: isMetronomeOn ? 'rgba(255, 184, 108, 0.15)' : 'var(--bg-surface)',
                  color: isMetronomeOn ? 'var(--accent-amber)' : 'var(--text-secondary)',
                  fontSize: '10px',
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isMetronomeOn ? '0 0 8px rgba(255, 184, 108, 0.3)' : 'none',
                }}
                title={`Metronome Click Track\nKeyboard shortcut: M\n${isMetronomeOn ? 'Aktif (Ketukan menyala saat lagu berputar)' : 'Mati (Klik untuk menyalakan ketukan)'}`}
              >
                <Metronome size={12} />
                <span>METRO</span>
              </button>
            )}

            {/* Count-In 1-Bar Toggle */}
            {onToggleCountIn && (
              <button
                onClick={onToggleCountIn}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '5px 7px',
                  borderRadius: '3px',
                  border: isCountInEnabled ? '1.5px solid var(--accent-amber)' : '1px solid var(--border-medium)',
                  backgroundColor: isCountInEnabled ? 'rgba(255, 184, 108, 0.15)' : 'var(--bg-surface)',
                  color: isCountInEnabled ? 'var(--accent-amber)' : 'var(--text-secondary)',
                  fontSize: '10px',
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isCountInEnabled ? '0 0 8px rgba(255, 184, 108, 0.3)' : 'none',
                }}
                title={`Count-In 1 Birama\n${isCountInEnabled ? 'Aktif: Memberi ketukan hitungan awal 1 birama sebelum lagu berputar' : 'Mati: Lagu langsung berputar saat Play ditekan'}`}
              >
                <Timer size={12} />
                <span>COUNT-IN</span>
              </button>
            )}

            {/* Metronome Click Volume Slider */}
            {onMetronomeVolumeChange && (isMetronomeOn || isCountInEnabled) && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  marginLeft: '2px',
                  paddingLeft: '4px',
                  borderLeft: '1px solid var(--border-medium)',
                }}
                title={`Volume Metronom: ${Math.round(metronomeVolume * 100)}%`}
              >
                <span style={{ fontSize: '9px', color: 'var(--accent-amber)', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>VOL</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={metronomeVolume}
                  onChange={(e) => onMetronomeVolumeChange(parseFloat(e.target.value))}
                  style={{
                    width: '42px',
                    height: '4px',
                    accentColor: 'var(--accent-amber)',
                    cursor: 'pointer',
                  }}
                />
              </div>
            )}
          </div>

          {/* Master Volume Control */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              borderLeft: '1px solid var(--border-subtle)',
              paddingLeft: '10px',
            }}
          >
            <button
              onClick={() => onVolumeChange(volume === 0 ? 0.8 : 0)}
              style={{
                background: 'none',
                border: 'none',
                color: volume === 0 ? 'var(--accent-red)' : 'var(--text-muted)',
                cursor: 'pointer',
                padding: '2px',
              }}
            >
              {volume === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              style={{
                width: '60px',
                accentColor: 'var(--accent-coral)',
                cursor: 'pointer',
              }}
            />
          </div>

          {/* Toggle Partitur 2D Sheet */}
          <button
            onClick={onToggleSheet}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 10px',
              borderRadius: '4px',
              border: isSheetExpanded ? '1px solid var(--border-strong)' : '1px solid var(--border-medium)',
              backgroundColor: isSheetExpanded ? 'var(--bg-control-active)' : 'var(--bg-control)',
              color: isSheetExpanded ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontSize: '10.5px',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              cursor: 'pointer',
            }}
            title="Buka / Tutup Notasi Partitur 2D"
          >
            <Music size={13} />
            <span>PARTITUR 2D</span>
          </button>
        </div>
      </div>
    </div>
  );
};
