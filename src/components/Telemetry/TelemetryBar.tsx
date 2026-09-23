import React from 'react';
import { Play, Pause, Square, Zap, Music, Volume2, VolumeX, X } from 'lucide-react';
import type { ExtractedNote } from '../../services/timelineExtractor';
import { formatTime } from '../../utils/guitarMath';

interface TelemetryBarProps {
  currentNotes: ExtractedNote[];
  nextNotes: ExtractedNote[];
  currentChordName?: string;
  nextChordName?: string;
  currentSection: string;
  nextSection: string;
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
  isLooping?: boolean;
  onToggleLoop?: () => void;
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
}

export const TelemetryBar: React.FC<TelemetryBarProps> = ({
  currentNotes,
  nextNotes,
  currentChordName,
  nextChordName,
  nextSection,
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
}) => {
  // Telemetry 1: Playing
  const primaryCurrent = currentNotes.length > 0 ? currentNotes[0] : null;
  const playingNoteTitle = currentChordName
    ? currentChordName
    : primaryCurrent
    ? primaryCurrent.noteName.replace(/\d/, '')
    : 'REST';

  const playingAdvice = primaryCurrent?.isBend
    ? 'EXPRESSION: BEND TO PITCH'
    : primaryCurrent?.isSlide
    ? `EXPRESSION: SLIDE TO ${primaryCurrent.slideToFret}`
    : primaryCurrent?.isVibrato
    ? 'EXPRESSION: WIDE VIBRATO'
    : primaryCurrent?.isPalmMute
    ? 'EXPRESSION: TIGHT PALM MUTE'
    : currentNotes.length > 1
    ? 'FULL CHORD ATTACK'
    : 'LET IT BREATHE';

  // Telemetry 2: Next Attack
  const primaryNext = nextNotes.length > 0 ? nextNotes[0] : null;
  const nextNoteTitle = nextChordName
    ? nextChordName
    : nextNotes.length > 1
    ? nextNotes.map((n) => n.noteName.replace(/\d/, '')).join(' + ')
    : primaryNext
    ? primaryNext.noteName.replace(/\d/, '')
    : '--';

  const nextCue = nextNotes.length > 1 ? 'CUE: PREPARE CHORD SHAPE' : 'CUE: SINGLE STRING ATTACK';

  // Telemetry 3: Next Section
  const formattedBar = barIndex < 10 ? `00${barIndex}` : barIndex < 100 ? `0${barIndex}` : `${barIndex}`;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const loopAPercent = loopA != null && duration > 0 ? (loopA / duration) * 100 : null;
  const loopBPercent = loopB != null && duration > 0 ? (loopB / duration) * 100 : null;
  const hasABLoop = loopA != null && loopB != null;
  const loopDurationSec = hasABLoop
    ? Math.max(0, (loopB as number) - (loopA as number))
    : 0;

  const [isSeekbarHovered, setIsSeekbarHovered] = React.useState(false);
  const [hoverTime, setHoverTime] = React.useState<number | null>(null);
  const [hoverX, setHoverX] = React.useState<number | null>(null);

  // Pulse state for A-B loop active indicator (glow/toggle animation during playback)
  const [loopPulseOn, setLoopPulseOn] = React.useState<boolean>(false);
  React.useEffect(() => {
    if (!hasABLoop || !isPlaying) {
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
        backgroundColor: '#141010',
        borderTop: '1px solid #2b2323',
        boxSizing: 'border-box',
        userSelect: 'none',
        flexShrink: 0,
      }}
    >
      {/* 1. Scrub Progress Bar — Always visible, interactive DAW-grade seekbar */}
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
        {/* Floating timestamp tooltip on hover */}
        {isSeekbarHovered && hoverTime !== null && hoverX !== null && (
          <div
            style={{
              position: 'absolute',
              left: `${Math.max(24, Math.min(window.innerWidth - 24, hoverX))}px`,
              bottom: '20px',
              transform: 'translateX(-50%)',
              backgroundColor: '#1a1414',
              border: '1px solid #FF7A65',
              borderRadius: '4px',
              padding: '2px 6px',
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 800,
              color: '#ffffff',
              pointerEvents: 'none',
              zIndex: 20,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.7)',
              whiteSpace: 'nowrap',
            }}
          >
            {formatTime(hoverTime)}
          </div>
        )}

        {/* Track Bar (Always visible with clear, stylish contrast) */}
        <div
          style={{
            width: '100%',
            height: isSeekbarHovered ? '8px' : '6px',
            backgroundColor: '#2c2222',
            borderTop: '1px solid #3d3030',
            borderBottom: '1px solid #3d3030',
            position: 'relative',
            transition: 'height 0.15s ease',
            overflow: 'visible',
          }}
        >
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
                borderRight: '2px solid #FF7A65',
                borderTop: '1px solid rgba(80, 250, 123, 0.6)',
                borderBottom: '1px solid rgba(80, 250, 123, 0.6)',
                boxSizing: 'border-box',
                pointerEvents: 'none',
                zIndex: 3,
                boxShadow: loopPulseOn
                  ? '0 0 18px rgba(80, 250, 123, 0.65), 0 0 4px rgba(255,122,101,0.4)'
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
                  backgroundColor: '#FF7A65',
                  boxShadow: '0 0 8px #FF7A65',
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
                  backgroundColor: '#FF7A65',
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
                B
              </div>
            </>
          )}

          {/* Played Progress Fill */}
          <div
            style={{
              height: '100%',
              width: `${Math.min(100, Math.max(0, progressPercent))}%`,
              backgroundColor: '#FF7A65',
              boxShadow: '0 0 10px rgba(255, 122, 101, 0.8)',
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
              backgroundColor: '#FF7A65',
              border: '2px solid #ffffff',
              boxShadow: '0 0 10px rgba(255, 122, 101, 0.9), 0 0 4px rgba(0, 0, 0, 0.9)',
              pointerEvents: 'none',
              zIndex: 5,
              transition: 'transform 0.15s ease',
            }}
          />
        </div>
      </div>

      {/* 2. Main Row: 3 Telemetry Cards + Integrated Transport Controls */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'stretch',
          height: '78px',
          padding: '0 16px',
        }}
      >
        {/* Block 01 / PLAYING */}
        <div
          style={{
            flex: '1 1 200px',
            maxWidth: '240px',
            borderRight: '1px solid #251e1e',
            padding: '10px 14px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              fontSize: '9.5px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 800,
              color: '#8e8080',
              letterSpacing: '0.8px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              marginBottom: '3px',
            }}
          >
            <span style={{ color: '#FF7A65' }}>01 /</span> PLAYING
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '20px',
                fontWeight: 900,
                fontFamily: 'var(--font-mono)',
                color: playingNoteTitle === 'REST' ? '#5a5050' : '#ffffff',
              }}
            >
              {playingNoteTitle}
            </span>
            {primaryCurrent?.isBend && (
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                  color: '#f1fa8c',
                  backgroundColor: 'rgba(241, 250, 140, 0.15)',
                  border: '1px solid rgba(241, 250, 140, 0.4)',
                  padding: '1px 5px',
                  borderRadius: '3px',
                }}
              >
                ⤴ BEND
              </span>
            )}
            {primaryCurrent?.isSlide && (
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                  color: '#8be9fd',
                  backgroundColor: 'rgba(139, 233, 253, 0.15)',
                  border: '1px solid rgba(139, 233, 253, 0.4)',
                  padding: '1px 5px',
                  borderRadius: '3px',
                }}
              >
                ➔ SLIDE
              </span>
            )}
            {primaryCurrent?.isVibrato && (
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                  color: '#ff79c6',
                  backgroundColor: 'rgba(255, 121, 198, 0.15)',
                  border: '1px solid rgba(255, 121, 198, 0.4)',
                  padding: '1px 5px',
                  borderRadius: '3px',
                }}
              >
                ∿ VIB
              </span>
            )}
            {primaryCurrent?.isHammerPull && (
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                  color: '#50fa7b',
                  backgroundColor: 'rgba(80, 250, 123, 0.15)',
                  border: '1px solid rgba(80, 250, 123, 0.4)',
                  padding: '1px 5px',
                  borderRadius: '3px',
                }}
              >
                {primaryCurrent.hammerPullType === 'pull' ? 'PULL' : 'HAMMER'}
              </span>
            )}
            {primaryCurrent?.isHarmonic && (
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                  color: '#8be9fd',
                  backgroundColor: 'rgba(139, 233, 253, 0.15)',
                  border: '1px solid rgba(139, 233, 253, 0.4)',
                  padding: '1px 5px',
                  borderRadius: '3px',
                }}
              >
                ◆ HARM
              </span>
            )}
          </div>
          <div
            style={{
              fontSize: '9.5px',
              fontFamily: 'var(--font-mono)',
              color: '#9e9191',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {playingAdvice}
          </div>
        </div>

        {/* Block 02 / NEXT ATTACK */}
        <div
          style={{
            flex: '1 1 200px',
            maxWidth: '240px',
            borderRight: '1px solid #251e1e',
            padding: '10px 14px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              fontSize: '9.5px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 800,
              color: '#8e8080',
              letterSpacing: '0.8px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              marginBottom: '3px',
            }}
          >
            <span style={{ color: '#FF7A65' }}>02 /</span> NEXT ATTACK
          </div>
          <div>
            <span
              style={{
                fontSize: '20px',
                fontWeight: 900,
                fontFamily: 'var(--font-mono)',
                color: nextNoteTitle === '--' ? '#5a5050' : '#FF7A65',
              }}
            >
              {nextNoteTitle}
            </span>
          </div>
          <div
            style={{
              fontSize: '9.5px',
              fontFamily: 'var(--font-mono)',
              color: '#9e9191',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {nextCue}
          </div>
        </div>

        {/* Block 03 / NEXT SECTION */}
        <div
          style={{
            flex: '1 1 200px',
            maxWidth: '240px',
            borderRight: '1px solid #251e1e',
            padding: '10px 14px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              fontSize: '9.5px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 800,
              color: '#8e8080',
              letterSpacing: '0.8px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              marginBottom: '3px',
            }}
          >
            <span style={{ color: '#FF7A65' }}>03 /</span> NEXT SECTION
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span
              style={{
                fontSize: '16px',
                fontWeight: 800,
                fontFamily: 'var(--font-sans)',
                color: '#ffffff',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {nextSection || 'Solo Section'}
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                fontFamily: 'var(--font-mono)',
                color: '#FF7A65',
              }}
            >
              BAR {formattedBar}
            </span>
          </div>
          <div
            style={{
              fontSize: '9.5px',
              fontFamily: 'var(--font-mono)',
              color: '#9e9191',
            }}
          >
            TEMPO: {tempo} BPM · {timeSignature}
          </div>
        </div>

        {/* Right Side: Integrated Transport Controls */}
        <div
          style={{
            flex: '2 1 350px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '12px',
            paddingLeft: '16px',
          }}
        >
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
                width: '22px',
                height: '22px',
                borderRadius: '3px',
                border: '1px solid #332828',
                backgroundColor: '#1c1616',
                color: '#a89d9d',
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
                padding: '4px 6px',
                borderRadius: '4px',
                backgroundColor: '#1c1616',
                border: '1px solid #332828',
                color: speed === 1.0 ? '#a89d9d' : '#FF7A65',
                fontSize: '10.5px',
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                minWidth: '38px',
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
                width: '22px',
                height: '22px',
                borderRadius: '3px',
                border: '1px solid #332828',
                backgroundColor: '#1c1616',
                color: '#a89d9d',
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

          {/* Loop toggle button */}
          {onToggleLoop && (
            <button
              onClick={onToggleLoop}
              style={{
                padding: '7px 10px',
                borderRadius: '4px',
                border: isLooping ? '1px solid #FF7A65' : '1px solid #3d3232',
                backgroundColor: isLooping ? 'rgba(255, 122, 101, 0.15)' : '#1f1919',
                color: isLooping ? '#FF7A65' : '#a89d9d',
                fontSize: '10.5px',
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                cursor: 'pointer',
              }}
              title="Ulangi bagian (Looping)"
            >
              LOOP
            </button>
          )}

          {/* A-B Looper Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              onClick={onSetLoopA}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 8px',
                borderRadius: '3px',
                border: loopA != null
                  ? `1.5px solid #50fa7b`
                  : '1px solid #3d3232',
                backgroundColor: loopA != null
                  ? (loopPulseOn && hasABLoop && isPlaying
                    ? 'rgba(80, 250, 123, 0.45)'
                    : 'rgba(80, 250, 123, 0.2)')
                  : '#1f1919',
                color: loopA != null ? '#50fa7b' : '#a89d9d',
                fontSize: '10px',
                fontWeight: 800,
                fontFamily: 'var(--font-mono)',
                cursor: 'pointer',
                transition: 'all 200ms ease',
                boxShadow: (loopA != null && loopPulseOn && hasABLoop && isPlaying)
                  ? '0 0 10px rgba(80,250,123,0.85), inset 0 0 4px rgba(80,250,123,0.35)'
                  : loopA != null
                    ? '0 0 4px rgba(80,250,123,0.35)'
                    : 'none',
              }}
              title="Tetapkan titik awal Loop A\nKeyboard shortcut:  ["
            >
              <span>A</span>
              <span style={{
                fontSize: '8px',
                opacity: loopA != null ? 1 : 0.45,
                fontWeight: 900,
                color: loopA != null ? '#b9ffcf' : '#6e6565',
                border: `0.5px solid ${loopA != null ? 'rgba(80,250,123,0.6)' : 'rgba(61,50,50,0.8)'}`,
                padding: '0px 3px',
                borderRadius: '2px',
                lineHeight: '11px',
              }}>
                [
              </span>
              {loopA != null && (
                <span style={{ fontSize: '9px', opacity: 0.95, marginLeft: '2px' }}>
                  {formatTime(loopA)}
                </span>
              )}
            </button>
            <button
              onClick={onSetLoopB}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 8px',
                borderRadius: '3px',
                border: loopB != null
                  ? `1.5px solid #FF7A65`
                  : '1px solid #3d3232',
                backgroundColor: loopB != null
                  ? (loopPulseOn && hasABLoop && isPlaying
                    ? 'rgba(255, 122, 101, 0.45)'
                    : 'rgba(255, 122, 101, 0.2)')
                  : '#1f1919',
                color: loopB != null ? '#FF7A65' : '#a89d9d',
                fontSize: '10px',
                fontWeight: 800,
                fontFamily: 'var(--font-mono)',
                cursor: 'pointer',
                transition: 'all 200ms ease',
                boxShadow: (loopB != null && loopPulseOn && hasABLoop && isPlaying)
                  ? '0 0 10px rgba(255,122,101,0.85), inset 0 0 4px rgba(255,122,101,0.35)'
                  : loopB != null
                    ? '0 0 4px rgba(255,122,101,0.35)'
                    : 'none',
              }}
              title="Tetapkan titik akhir Loop B\nKeyboard shortcut:  ]"
            >
              <span>B</span>
              <span style={{
                fontSize: '8px',
                opacity: loopB != null ? 1 : 0.45,
                fontWeight: 900,
                color: loopB != null ? '#ffd4cc' : '#6e6565',
                border: `0.5px solid ${loopB != null ? 'rgba(255,122,101,0.6)' : 'rgba(61,50,50,0.8)'}`,
                padding: '0px 3px',
                borderRadius: '2px',
                lineHeight: '11px',
              }}>
                ]
              </span>
              {loopB != null && (
                <span style={{ fontSize: '9px', opacity: 0.95, marginLeft: '2px' }}>
                  {formatTime(loopB)}
                </span>
              )}
            </button>
            {hasABLoop && (
              <>
                <div
                  aria-label="Durasi Loop A-B"
                  title={`Durasi loop: ${loopDurationSec.toFixed(2)} detik`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px',
                    padding: '4px 7px',
                    borderRadius: '3px',
                    border: loopPulseOn && isPlaying
                      ? '1.5px solid rgba(80,250,123,0.75)'
                      : '1px solid rgba(80,250,123,0.35)',
                    backgroundColor: loopPulseOn && isPlaying
                      ? 'rgba(80,250,123,0.18)'
                      : 'rgba(31,25,25,0.9)',
                    color: '#c1ffd3',
                    cursor: 'default',
                    fontSize: '9.5px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 800,
                    transition: 'all 220ms ease',
                    whiteSpace: 'nowrap',
                    minWidth: '0',
                  }}
                >
                  <span style={{
                    fontSize: '10px',
                    opacity: 0.9,
                    color: loopPulseOn && isPlaying ? '#ffffff' : '#50fa7b',
                    transition: 'all 220ms ease',
                  }}>⟳</span>
                  <span>{loopDurationSec.toFixed(1)}s</span>
                </div>
                <button
                  onClick={onClearABLoop}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                    padding: '4px 6px',
                    borderRadius: '3px',
                    border: '1px solid #5a4444',
                    backgroundColor: '#2a1e1e',
                    color: '#ff5555',
                    cursor: 'pointer',
                    fontSize: '9px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    transition: 'all 0.15s ease',
                  }}
                  title="Hapus pengaturan Loop A-B\nKeyboard shortcut:  Backspace"
                >
                  <span style={{
                    fontSize: '8px',
                    opacity: 0.8,
                    border: '0.5px solid rgba(255,85,85,0.5)',
                    padding: '0px 2px',
                    borderRadius: '2px',
                    lineHeight: '11px',
                  }}>⌫</span>
                  <X size={11} />
                  <span>CLR</span>
                </button>
              </>
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
                padding: '7px 10px',
                borderRadius: '4px',
                border: isFlipped ? '1.5px solid #8be9fd' : '1px solid #3d3232',
                backgroundColor: isFlipped ? 'rgba(139, 233, 253, 0.15)' : '#1f1919',
                color: isFlipped ? '#8be9fd' : '#a89d9d',
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

          {/* Solo Slow-Down 50% button */}
          <button
            onClick={onToggleSoloSlowdown}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '7px 12px',
              borderRadius: '4px',
              border: isSoloSlowdown ? '1.5px solid #FF7A65' : '1px solid #3d3232',
              backgroundColor: isSoloSlowdown ? 'rgba(255, 122, 101, 0.2)' : '#1f1919',
              color: isSoloSlowdown ? '#FF7A65' : '#c5b8b8',
              fontSize: '11px',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            title="Latih bagian solo dengan kecepatan 50%"
          >
            <Zap size={13} fill={isSoloSlowdown ? '#FF7A65' : 'none'} />
            <span>SOLO 50%</span>
          </button>

          {/* Stop button */}
          <button
            onClick={onStop}
            style={{
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #362c2c',
              backgroundColor: '#1f1919',
              color: '#a89d9d',
              cursor: 'pointer',
            }}
            title="Hentikan & Reset"
          >
            <Square size={14} />
          </button>

          {/* Big Play/Pause Button */}
          <button
            onClick={onPlayPause}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 18px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: '#FF7A65',
              color: '#120e0e',
              fontSize: '12px',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              cursor: 'pointer',
              boxShadow: '0 0 16px rgba(255, 122, 101, 0.4)',
              transition: 'all 0.15s ease',
            }}
          >
            {isPlaying ? <Pause size={15} /> : <Play size={15} fill="#120e0e" />}
            <span>{isPlaying ? 'PAUSE' : 'PLAY'}</span>
          </button>

          {/* Time text */}
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              color: '#9e9191',
              minWidth: '90px',
              textAlign: 'center',
            }}
          >
            <span style={{ color: '#ffffff' }}>{formatTime(currentTime)}</span>
            <span style={{ margin: '0 3px', color: '#524747' }}>/</span>
            <span>{formatTime(duration)}</span>
          </div>

          {/* Volume Control */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              borderLeft: '1px solid #282121',
              paddingLeft: '10px',
            }}
          >
            <button
              onClick={() => onVolumeChange(volume === 0 ? 0.8 : 0)}
              style={{
                background: 'none',
                border: 'none',
                color: volume === 0 ? '#ff5555' : '#8a7d7d',
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
                accentColor: '#FF7A65',
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
              border: isSheetExpanded ? '1px solid #4a3d3d' : '1px solid #332929',
              backgroundColor: isSheetExpanded ? '#282020' : '#181313',
              color: isSheetExpanded ? '#f0e6e6' : '#8a7d7d',
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
