import React from 'react';
import { Play, Pause, Square, Zap, Music, Volume2, VolumeX, X, Metronome, Timer } from 'lucide-react';
import type { ExtractedNote } from '../../services/timelineExtractor';
import { formatTime } from '../../utils/guitarMath';

interface TelemetryBarProps {
  currentNotes: ExtractedNote[];
  nextNotes: ExtractedNote[];
  currentChordName?: string;
  nextChordName?: string;
  currentSection?: string;
  nextSection?: string;
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
}

export const TelemetryBar: React.FC<TelemetryBarProps> = ({
  currentSection,
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

      {/* 2. Studio Transport & Practice Controls Bar */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '58px',
          padding: '0 20px',
          gap: '16px',
        }}
      >
        {/* Left Side: Session Status & Practice Tools */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexShrink: 0,
          }}
        >
          {/* Song Section & Bar Indicator Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#1b1414',
              border: '1px solid #332828',
              borderRadius: '4px',
              padding: '5px 10px',
            }}
            title={`Bagian Lagu: ${currentSection || nextSection || 'Main'}\nBirama: ${barIndex}\nTempo: ${tempo} BPM · ${timeSignature}`}
          >
            <span style={{ fontSize: '10px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#FF7A65' }}>
              BAR {formattedBar}
            </span>
            <span style={{ color: '#4a3d3d', fontSize: '10px' }}>·</span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                fontFamily: 'var(--font-sans)',
                color: '#e0d5d5',
                maxWidth: '120px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {currentSection || nextSection || 'Main'}
            </span>
          </div>

          <div style={{ width: '1px', height: '22px', backgroundColor: '#282020', margin: '0 2px' }} />

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
                padding: '4px 7px',
                borderRadius: '4px',
                backgroundColor: '#1c1616',
                border: '1px solid #332828',
                color: speed === 1.0 ? '#a89d9d' : '#FF7A65',
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
                border: '1px solid #332828',
                backgroundColor: '#1c1616',
                color: transpose <= -12 ? '#4a3d3d' : '#a89d9d',
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
                backgroundColor: transpose !== 0 ? 'rgba(255, 184, 108, 0.16)' : '#1c1616',
                border: transpose !== 0 ? '1px solid #ffb86c' : '1px solid #332828',
                color: transpose !== 0 ? '#ffb86c' : '#a89d9d',
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
                border: '1px solid #332828',
                backgroundColor: '#1c1616',
                color: transpose >= 12 ? '#4a3d3d' : '#a89d9d',
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
              border: isSoloSlowdown ? '1.5px solid #FF7A65' : '1px solid #3d3232',
              backgroundColor: isSoloSlowdown ? 'rgba(255, 122, 101, 0.2)' : '#1f1919',
              color: isSoloSlowdown ? '#FF7A65' : '#c5b8b8',
              fontSize: '10.5px',
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

          {/* A-B Looper Cluster */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: '#1a1414',
              padding: '3px 5px',
              borderRadius: '5px',
              border: hasABLoop ? '1px solid #5a3830' : '1px solid #2d2424',
            }}
          >
            {onToggleLoop && (
              <button
                onClick={onToggleLoop}
                style={{
                  padding: '5px 8px',
                  borderRadius: '3px',
                  border: isLooping ? '1px solid #FF7A65' : '1px solid #3d3232',
                  backgroundColor: isLooping ? 'rgba(255, 122, 101, 0.15)' : '#1f1919',
                  color: isLooping ? '#FF7A65' : '#a89d9d',
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
                border: loopA != null ? '1px solid #50fa7b' : '1px solid #3d3232',
                backgroundColor: loopA != null ? 'rgba(80, 250, 123, 0.15)' : '#1f1919',
                color: loopA != null ? '#50fa7b' : '#a89d9d',
                cursor: 'pointer',
                fontSize: '10px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
              }}
              title={`Tetapkan titik awal Loop [A]\nKeyboard shortcut: [\n${loopA != null ? `A: ${formatTime(loopA)}` : 'Belum diatur'}`}
            >
              <span>A</span>
              <span style={{ fontSize: '9px', opacity: 0.7 }}>[</span>
              {loopA != null && <span style={{ fontSize: '9px', color: '#c5b8b8' }}>{formatTime(loopA)}</span>}
            </button>

            <button
              onClick={onSetLoopB}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                padding: '5px 7px',
                borderRadius: '3px',
                border: loopB != null ? '1px solid #FF7A65' : '1px solid #3d3232',
                backgroundColor: loopB != null ? 'rgba(255, 122, 101, 0.15)' : '#1f1919',
                color: loopB != null ? '#FF7A65' : '#a89d9d',
                cursor: 'pointer',
                fontSize: '10px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
              }}
              title={`Tetapkan titik akhir Loop [B]\nKeyboard shortcut: ]\n${loopB != null ? `B: ${formatTime(loopB)}` : 'Belum diatur'}`}
            >
              <span>B</span>
              <span style={{ fontSize: '9px', opacity: 0.7 }}>]</span>
              {loopB != null && <span style={{ fontSize: '9px', color: '#c5b8b8' }}>{formatTime(loopB)}</span>}
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
                  border: '1px solid #5a4444',
                  backgroundColor: '#2a1e1e',
                  color: '#ff5555',
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
        </div>

        {/* Center: Main Playback Controls */}
        <div
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
            style={{
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #362c2c',
              backgroundColor: '#1f1919',
              color: '#a89d9d',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
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
              gap: '7px',
              padding: '8px 22px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: isCountingIn ? '#ffb86c' : '#FF7A65',
              color: '#120e0e',
              fontSize: '12px',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              cursor: 'pointer',
              boxShadow: isCountingIn
                ? '0 0 18px rgba(255, 184, 108, 0.6)'
                : '0 0 16px rgba(255, 122, 101, 0.4)',
              transition: 'all 0.15s ease',
            }}
            title={isCountingIn ? 'Hitungan awal aktif... Klik untuk batal' : isPlaying ? 'Jeda Lagu (Space)' : 'Putar Lagu (Space)'}
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
                <Play size={15} fill="#120e0e" />
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
              color: '#9e9191',
              minWidth: '95px',
              textAlign: 'center',
            }}
          >
            <span style={{ color: '#ffffff' }}>{formatTime(currentTime)}</span>
            <span style={{ margin: '0 3px', color: '#524747' }}>/</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right Side: Audio & View Tools */}
        <div
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
              backgroundColor: '#181313',
              padding: '3px 6px',
              borderRadius: '5px',
              border: isMetronomeOn || isCountInEnabled ? '1px solid #5a4730' : '1px solid #2d2424',
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
                  border: isMetronomeOn ? '1.5px solid #ffb86c' : '1px solid #3d3232',
                  backgroundColor: isMetronomeOn ? 'rgba(255, 184, 108, 0.15)' : '#1f1919',
                  color: isMetronomeOn ? '#ffb86c' : '#a89d9d',
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
                  border: isCountInEnabled ? '1.5px solid #ffb86c' : '1px solid #3d3232',
                  backgroundColor: isCountInEnabled ? 'rgba(255, 184, 108, 0.15)' : '#1f1919',
                  color: isCountInEnabled ? '#ffb86c' : '#a89d9d',
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
                  borderLeft: '1px solid #332828',
                }}
                title={`Volume Metronom: ${Math.round(metronomeVolume * 100)}%`}
              >
                <span style={{ fontSize: '9px', color: '#ffb86c', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>VOL</span>
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
                    accentColor: '#ffb86c',
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
