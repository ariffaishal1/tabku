import React, { useRef } from 'react';
import { PRESET_SONGS } from '../../services/presetTabs';
import { Upload, ChevronDown, Palette } from 'lucide-react';
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
}

export const TopNav: React.FC<TopNavProps> = ({
  songTitle,
  songArtist,
  activeTrackName,
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
        padding: '0 20px',
        height: '70px',
        backgroundColor: 'var(--bg-primary)',
        borderBottom: '1px solid var(--border-subtle)',
        gap: '20px',
        userSelect: 'none',
        boxSizing: 'border-box',
      }}
    >
      {/* 1. Left: Cyber Studio Breadcrumb & Big Title */}
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
        {/* Breadcrumb */}
        <div
          style={{
            fontSize: '9.5px',
            fontFamily: 'var(--font-mono)',
            fontWeight: 800,
            color: 'var(--text-muted)',
            letterSpacing: '1px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '2px',
          }}
        >
          <span style={{ color: 'var(--accent-coral)' }}>\\</span>
          <span>{tuning.length}-STRING</span>
          <span style={{ color: 'var(--border-strong)' }}>/</span>
          <span>STRING FLOW</span>
          <span style={{ color: 'var(--border-strong)' }}>/</span>
          <span style={{ color: 'var(--accent-coral)' }}>{activeTrackName.toUpperCase()}</span>
        </div>

        {/* Big Track Title & Controls */}
        <div className="topnav-title-bar" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1
            className="topnav-song-title"
            style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: 900,
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.5px',
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '360px',
            }}
            title={`${songArtist} \\ ${songTitle}`}
          >
            {songArtist.toUpperCase()} <span style={{ color: 'var(--accent-coral)' }}>\\</span> {songTitle.toUpperCase()}
          </h1>

          {/* Preset Selector Dropdown */}
          <div style={{ position: 'relative' }}>
            <select
              value={selectedPresetId}
              onChange={(e) => onSelectPreset(e.target.value)}
              className="studio-btn-base"
              style={{
                appearance: 'none',
                backgroundColor: 'var(--bg-control)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-medium)',
                borderRadius: '4px',
                padding: '5px 24px 5px 10px',
                fontSize: '11px',
                fontWeight: 600,
                fontFamily: 'var(--font-mono)',
                cursor: 'pointer',
                outline: 'none',
              }}
              title="Pilih lagu preset"
            >
              {PRESET_SONGS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.title} ({preset.artist})
                </option>
              ))}
            </select>
            <ChevronDown
              size={12}
              color="var(--text-muted)"
              style={{
                position: 'absolute',
                right: '8px',
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
              gap: '5px',
              padding: '5px 10px',
              borderRadius: '4px',
              border: '1px solid var(--border-medium)',
              backgroundColor: 'var(--bg-control)',
              color: 'var(--text-secondary)',
              fontSize: '11px',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              cursor: 'pointer',
            }}
            title="Buka file Guitar Pro (.gp, .gp5, .gpx)"
          >
            {isLoadingScore ? (
              <span className="spin-anim" style={{ display: 'inline-block', fontSize: '11px' }}>⚙️</span>
            ) : (
              <Upload size={12} />
            )}
            <span>{isLoadingScore ? 'MEMUAT...' : 'BUKA .GP'}</span>
          </button>

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
                  borderRadius: '4px',
                  padding: '5px 24px 5px 8px',
                  fontSize: '11px',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer',
                  outline: 'none',
                }}
                title="Pilih Tema Studio (Cyber Neon / Classic Parchment / Stealth Black)"
              >
                {themeOptions.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.icon} {t.name.toUpperCase()}
                  </option>
                ))}
              </select>
              <Palette
                size={12}
                color="var(--accent-coral)"
                style={{
                  position: 'absolute',
                  right: '7px',
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
                gap: '5px',
                padding: '5px 9px',
                borderRadius: '4px',
                border: '1px solid var(--border-medium)',
                backgroundColor: 'var(--bg-control)',
                color: 'var(--text-secondary)',
                fontSize: '11px',
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                cursor: 'pointer',
              }}
            >
              <span>⌨️</span>
              <span>SHORTCUTS</span>
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 900,
                  color: 'var(--accent-coral)',
                  backgroundColor: 'var(--accent-coral-glow)',
                  border: '1px solid var(--accent-coral)',
                  borderRadius: '3px',
                  padding: '0 4px',
                  lineHeight: '13px',
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
              gap: '5px',
              padding: '5px 10px',
              borderRadius: '4px',
              border: isScaleMode ? '1px solid var(--accent-coral)' : '1px solid var(--border-medium)',
              backgroundColor: isScaleMode ? 'var(--accent-coral)' : 'var(--bg-control)',
              color: isScaleMode ? 'var(--text-inverse)' : 'var(--text-secondary)',
              fontSize: '11px',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              cursor: 'pointer',
              boxShadow: isScaleMode ? '0 0 10px var(--accent-coral-glow)' : 'none',
            }}
          >
            <span>🗺️</span>
            <span>SCALE LAB</span>
          </button>
        </div>
      </div>

      {/* 2. Right: Develop Device Studio Tuning Card */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          backgroundColor: 'var(--accent-coral)',
          borderRadius: '4px',
          padding: '6px 14px',
          minWidth: '160px',
          color: 'var(--text-inverse)',
          boxShadow: '0 0 16px var(--accent-coral-glow)',
          boxSizing: 'border-box',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11px',
            fontWeight: 900,
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.8px',
          }}
        >
          <span>
            {tuningName}
            {transpose !== 0 && (
              <span style={{ marginLeft: '4px', fontSize: '9.5px', opacity: 0.9, backgroundColor: 'rgba(0,0,0,0.18)', padding: '1px 4px', borderRadius: '3px' }}>
                {transpose > 0 ? `+${transpose}` : transpose}st
              </span>
            )}
          </span>
          <span style={{ fontSize: '10px', opacity: 0.85 }}>{tempo} BPM</span>
        </div>

        <div
          style={{
            fontSize: '11.5px',
            fontWeight: 800,
            fontFamily: 'var(--font-mono)',
            letterSpacing: '1.2px',
            marginTop: '2px',
          }}
        >
          {tuningNotesFormatted}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '9px',
            fontWeight: 700,
            fontFamily: 'var(--font-mono)',
            opacity: 0.85,
            marginTop: '1px',
          }}
        >
          <span>METER: {timeSignature}</span>
          <span>TABKU STUDIO</span>
        </div>
      </div>
    </header>
  );
};
