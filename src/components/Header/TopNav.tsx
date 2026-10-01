import React, { useRef } from 'react';
import { PRESET_SONGS } from '../../services/presetTabs';
import { Upload, ChevronDown, Palette, Maximize2, Loader2, Keyboard, Compass } from 'lucide-react';
import { midiToNoteName } from '../../utils/guitarMath';
import type { ThemeId, ThemeOption } from '../../types/theme';

interface TopNavProps {
  songTitle: string;
  songArtist: string;
  activeTrackName: string;
  tempo: number;
  timeSignature?: string;
  tuning: number[];
  selectedPresetId: string;
  onSelectPreset: (presetId: string) => void;
  onFileUpload: (file: File) => void;
  transpose?: number;
  isScaleMode?: boolean;
  onToggleScaleMode?: () => void;
  onOpenShortcuts?: () => void;
  isLoadingScore?: boolean;
  themeId?: ThemeId;
  themeOptions?: ThemeOption[];
  onSelectTheme?: (themeId: ThemeId) => void;
  isStageMode?: boolean;
  onToggleStageMode?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  songTitle,
  songArtist,
  activeTrackName: _activeTrackName,
  tempo,
  timeSignature = '4/4',
  tuning,
  selectedPresetId,
  onSelectPreset,
  onFileUpload,
  transpose = 0,
  isScaleMode = false,
  onToggleScaleMode,
  onOpenShortcuts,
  isLoadingScore = false,
  themeId = 'cyber-neon',
  themeOptions = [],
  onSelectTheme,
  isStageMode = false,
  onToggleStageMode,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
      e.target.value = '';
    }
  };

  // Determine tuning name (Drop B, Standard E, Drop D, Half Step Down, etc.)
  const getTuningName = (t: number[]) => {
    if (!t || t.length === 0) return 'STANDARD E';

    // Build a lookup key from MIDI values
    const key = t.join(',');
    const tuningMap: Record<string, string> = {
      // 6-string guitar tunings
      '64,59,55,50,45,40': 'STANDARD E',
      '64,59,55,50,45,38': 'DROP D',
      '63,58,54,49,44,39': 'HALF STEP DOWN (Eb)',
      '62,57,53,48,43,38': 'FULL STEP DOWN (D)',
      '62,57,53,48,43,36': 'DROP C',
      '63,58,54,49,44,37': 'DROP C# (Db)',
      '64,59,55,50,45,36': 'DROP C (LOW)',
      '64,59,55,50,38,38': 'DOUBLE DROP D',
      '62,57,55,50,45,38': 'DADGAD',
      '62,55,50,43,38,31': 'DROP B',
      '61,56,52,47,42,35': 'DROP Bb',
      '64,59,55,50,47,38': 'OPEN D',
      '67,59,55,50,43,38': 'OPEN G',
      '64,60,55,48,45,40': 'OPEN A',
      // 4-string bass tunings
      '55,50,45,40': 'STANDARD BASS',
      '55,50,45,38': 'DROP D BASS',
      '53,48,43,36': 'DROP C BASS',
    };

    if (tuningMap[key]) return tuningMap[key];

    // Fallback: show the lowest string note
    const lowestNote = midiToNoteName(t[t.length - 1]).replace(/\d/, '');
    return `${lowestNote} TUNING`;
  };

  const tuningName = getTuningName(tuning);
  // Tuning notes formatted (e.g. "B  F#  B  E  G#  C#")
  const reversedTuning = [...tuning].reverse();
  const tuningNotesFormatted = reversedTuning
    .map((p) => midiToNoteName(p).replace(/\d/, ''))
    .join('  ');

  return (
    <header
      className="topnav-header"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 12px',
        height: '38px',
        backgroundColor: 'var(--bg-primary)',
        borderBottom: '1px solid var(--border-subtle)',
        gap: '10px',
        userSelect: 'none',
        boxSizing: 'border-box',
        flexShrink: 0,
      }}
    >
      {/* 1. Left: Brand & Single Unified Song / Preset Selector (Zero Duplicate Title Text) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flexShrink: 1 }}>
        {/* Brand Logo Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '11.5px',
            fontWeight: 900,
            fontFamily: 'var(--font-mono)',
            letterSpacing: '1px',
            color: 'var(--text-primary)',
            flexShrink: 0,
          }}
          title="TabKu — 3D Guitar Tab Visualizer & Studio Practice"
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-coral)',
              boxShadow: '0 0 8px var(--accent-coral)',
              display: 'inline-block',
            }}
          />
          <span>TABKU</span>
        </div>

        {/* Unified Song / Preset Selector */}
        <div style={{ position: 'relative', minWidth: 0, maxWidth: '240px' }}>
          <select
            value={selectedPresetId}
            onChange={(e) => onSelectPreset(e.target.value)}
            className="studio-btn-base"
            style={{
              appearance: 'none',
              backgroundColor: 'var(--bg-control)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-medium)',
              borderRadius: '3px',
              height: '24px',
              padding: '0 20px 0 7px',
              fontSize: '10px',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              cursor: 'pointer',
              outline: 'none',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '240px',
              display: 'block',
            }}
            title={`Lagu aktif: ${songArtist} - ${songTitle}\nKlik untuk beralih lagu preset`}
          >
            {!PRESET_SONGS.some((p) => p.id === selectedPresetId) && (
              <option value={selectedPresetId}>
                {songTitle} ({songArtist})
              </option>
            )}
            {PRESET_SONGS.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.title} · {preset.artist}
              </option>
            ))}
          </select>
          <ChevronDown
            size={10}
            color="var(--text-muted)"
            style={{
              position: 'absolute',
              right: '6px',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* Open Guitar Pro File Button */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".gp,.gp5,.gpx,.gp4,.gp3"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="studio-btn-base"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            height: '24px',
            padding: '0 7px',
            borderRadius: '3px',
            border: '1px solid var(--border-medium)',
            backgroundColor: 'var(--bg-control)',
            color: 'var(--text-secondary)',
            fontSize: '9.5px',
            fontWeight: 800,
            fontFamily: 'var(--font-mono)',
            cursor: 'pointer',
            flexShrink: 0,
            boxSizing: 'border-box',
          }}
          title="Buka file Guitar Pro (.gp, .gp5, .gpx)"
        >
          {isLoadingScore ? (
            <Loader2 size={11} className="spin-anim" />
          ) : (
            <Upload size={11} />
          )}
          <span>{isLoadingScore ? 'MEMUAT...' : 'BUKA .GP'}</span>
        </button>
      </div>

      {/* 2. Center: Utility Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        {/* Theme Selector (FR-NEXT-08) */}
        {onSelectTheme && themeOptions.length > 0 && (
          <div style={{ position: 'relative' }}>
            <select
              value={themeId}
              onChange={(e) => onSelectTheme(e.target.value as ThemeId)}
              className="studio-btn-base"
              style={{
                appearance: 'none',
                backgroundColor: 'var(--bg-control)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-medium)',
                borderRadius: '3px',
                height: '24px',
                padding: '0 18px 0 6px',
                fontSize: '9.5px',
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                cursor: 'pointer',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              title="Pilih Tema Visual Studio"
            >
              {themeOptions.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name.toUpperCase()}
                </option>
              ))}
            </select>
            <Palette
              size={10}
              color="var(--accent-coral)"
              style={{
                position: 'absolute',
                right: '5px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
              }}
            />
          </div>
        )}

        {/* Keyboard Shortcuts Help Button */}
        {onOpenShortcuts && (
          <button
            onClick={onOpenShortcuts}
            className="studio-btn-base"
            title="Daftar Keyboard Shortcuts (Tekan '?')"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              height: '24px',
              padding: '0 6px',
              borderRadius: '3px',
              border: '1px solid var(--border-medium)',
              backgroundColor: 'var(--bg-control)',
              color: 'var(--text-secondary)',
              fontSize: '9.5px',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              cursor: 'pointer',
              boxSizing: 'border-box',
            }}
          >
            <Keyboard size={11} />
            <span>SHORTCUTS</span>
            <span
              style={{
                fontSize: '8px',
                fontWeight: 900,
                color: 'var(--accent-coral)',
                backgroundColor: 'var(--accent-coral-glow)',
                border: '1px solid var(--accent-coral)',
                borderRadius: '2px',
                padding: '0 3px',
                lineHeight: '11px',
              }}
            >
              ?
            </span>
          </button>
        )}

        {/* Scale Lab Toggle Button */}
        <button
          onClick={onToggleScaleMode}
          className={isScaleMode ? 'studio-btn-coral' : 'scale-lab-btn-off'}
          title="Toggle Scale Lab — Tampilkan roadmap tangga nada di fretboard (Key: S)"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            height: '24px',
            padding: '0 7px',
            borderRadius: '3px',
            border: isScaleMode ? '1px solid var(--accent-coral)' : '1px solid var(--border-medium)',
            backgroundColor: isScaleMode ? 'var(--accent-coral)' : 'var(--bg-control)',
            color: isScaleMode ? 'var(--text-inverse)' : 'var(--text-secondary)',
            fontSize: '9.5px',
            fontWeight: 800,
            fontFamily: 'var(--font-mono)',
            cursor: 'pointer',
            boxShadow: isScaleMode ? '0 0 8px var(--accent-coral-glow)' : 'none',
            boxSizing: 'border-box',
          }}
        >
          <Compass size={11} />
          <span>SCALE LAB</span>
        </button>

        {/* Stage / Fullscreen Focus Mode Button */}
        {onToggleStageMode && (
          <button
            onClick={onToggleStageMode}
            className="studio-btn-base"
            title="Stage / Fullscreen Focus Mode (Shortcut: Z)"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              height: '24px',
              padding: '0 7px',
              borderRadius: '3px',
              border: isStageMode ? '1px solid var(--accent-cyan)' : '1px solid var(--border-medium)',
              backgroundColor: isStageMode ? 'rgba(139, 233, 253, 0.15)' : 'var(--bg-control)',
              color: isStageMode ? 'var(--accent-cyan)' : 'var(--text-secondary)',
              fontSize: '9.5px',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              cursor: 'pointer',
              boxShadow: isStageMode ? '0 0 8px rgba(139, 233, 253, 0.3)' : 'none',
              transition: 'all 0.15s ease',
              boxSizing: 'border-box',
            }}
          >
            <Maximize2 size={11} color={isStageMode ? 'var(--accent-cyan)' : 'currentColor'} />
            <span>STAGE</span>
            <span
              style={{
                fontSize: '8px',
                fontWeight: 900,
                color: isStageMode ? 'var(--accent-cyan)' : 'var(--text-muted)',
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-medium)',
                borderRadius: '2px',
                padding: '0 3px',
                lineHeight: '11px',
              }}
            >
              Z
            </span>
          </button>
        )}
      </div>

      {/* 3. Right: Sleek Studio Tuning & Tempo Badge (Zero Duplicate Text) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: 'var(--accent-coral)',
          borderRadius: '3px',
          height: '24px',
          padding: '0 8px',
          color: 'var(--text-inverse)',
          boxShadow: '0 0 10px var(--accent-coral-glow)',
          boxSizing: 'border-box',
          flexShrink: 0,
          fontSize: '9.5px',
          fontFamily: 'var(--font-mono)',
          fontWeight: 800,
          letterSpacing: '0.4px',
          userSelect: 'none',
        }}
        title={`Tuning: ${tuningName} (${tuningNotesFormatted})\nTempo: ${tempo} BPM · Birama: ${timeSignature}`}
      >
        <span>{tuningName}</span>
        {transpose !== 0 && (
          <span
            style={{
              fontSize: '8px',
              backgroundColor: 'rgba(0,0,0,0.22)',
              padding: '0 3px',
              borderRadius: '2px',
            }}
          >
            {transpose > 0 ? `+${transpose}` : transpose}st
          </span>
        )}
        <span style={{ opacity: 0.6 }}>·</span>
        <span style={{ letterSpacing: '0.6px', opacity: 0.95 }}>{tuningNotesFormatted}</span>
        <span style={{ opacity: 0.6 }}>·</span>
        <span style={{ opacity: 0.9 }}>{tempo} BPM</span>
        <span style={{ opacity: 0.6 }}>·</span>
        <span style={{ opacity: 0.9 }}>{timeSignature}</span>
      </div>
    </header>
  );
};
