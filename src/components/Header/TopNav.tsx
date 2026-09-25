import React, { useRef } from 'react';
import { PRESET_SONGS } from '../../services/presetTabs';
import { Upload, ChevronDown } from 'lucide-react';
import { midiToNoteName } from '../../utils/guitarMath';

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
  // AlphaTab tuning is ordered [highest string ... lowest string]
  // In guitar tab tuning display, usually ordered lowest string to highest: e.g. E A D G B E or B F# B E G# C#
  const reversedTuning = [...tuning].reverse();
  const tuningNotesFormatted = reversedTuning
    .map((p) => midiToNoteName(p).replace(/\d/, ''))
    .join('  ');

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        height: '70px',
        backgroundColor: '#120e0e',
        borderBottom: '1px solid #282121',
        gap: '20px',
        userSelect: 'none',
        boxSizing: 'border-box',
      }}
    >
      {/* 1. Left: Cyber Studio Breadcrumb & Big Title */}
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Breadcrumb */}
        <div
          style={{
            fontSize: '9.5px',
            fontFamily: 'var(--font-mono)',
            fontWeight: 800,
            color: '#8c7d7d',
            letterSpacing: '1px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '2px',
          }}
        >
          <span style={{ color: '#FF7A65' }}>\\</span>
          <span>{tuning.length}-STRING</span>
          <span style={{ color: '#524545' }}>/</span>
          <span>STRING FLOW</span>
          <span style={{ color: '#524545' }}>/</span>
          <span style={{ color: '#FF7A65' }}>{activeTrackName.toUpperCase()}</span>
        </div>

        {/* Big Track Title & Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h1
            style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: 900,
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.5px',
              color: '#ffffff',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '380px',
            }}
            title={`${songArtist} \\ ${songTitle}`}
          >
            {songArtist.toUpperCase()} <span style={{ color: '#FF7A65' }}>\\</span> {songTitle.toUpperCase()}
          </h1>

          {/* Preset Selector Dropdown */}
          <div style={{ position: 'relative' }}>
            <select
              value={selectedPresetId}
              onChange={(e) => onSelectPreset(e.target.value)}
              className="studio-btn-base"
              style={{
                appearance: 'none',
                backgroundColor: '#1d1717',
                color: '#d4c7c7',
                border: '1px solid #3d3232',
                borderRadius: '4px',
                padding: '4px 24px 4px 10px',
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
              color="#a09191"
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
              padding: '4px 10px',
              borderRadius: '4px',
              border: '1px solid #3d3232',
              backgroundColor: '#1d1717',
              color: '#d4c7c7',
              fontSize: '11px',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              cursor: 'pointer',
            }}
            title="Buka file Guitar Pro (.gp, .gp5, .gpx)"
          >
            <Upload size={12} />
            <span>BUKA .GP</span>
          </button>

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
                padding: '4px 9px',
                borderRadius: '4px',
                border: '1px solid #3d3232',
                backgroundColor: '#1d1717',
                color: '#d4c7c7',
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
                  color: '#FF7A65',
                  backgroundColor: 'rgba(255, 122, 101, 0.15)',
                  border: '1px solid rgba(255, 122, 101, 0.3)',
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
              padding: '4px 10px',
              borderRadius: '4px',
              border: isScaleMode ? '1px solid #FF7A65' : '1px solid #3d3232',
              backgroundColor: isScaleMode ? '#FF7A65' : '#1d1717',
              color: isScaleMode ? '#120e0e' : '#a89d9d',
              fontSize: '11px',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              cursor: 'pointer',
              boxShadow: isScaleMode ? '0 0 10px rgba(255, 122, 101, 0.4)' : 'none',
            }}
          >
            <span>🗺️</span>
            <span>SCALE LAB</span>
          </button>
        </div>
      </div>

      {/* 2. Right: Develop Device Studio Coral Red Tuning Card */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          backgroundColor: '#FF7A65',
          borderRadius: '4px',
          padding: '6px 14px',
          minWidth: '170px',
          color: '#120e0e',
          boxShadow: '0 0 16px rgba(255, 122, 101, 0.3)',
          boxSizing: 'border-box',
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
              <span style={{ marginLeft: '4px', fontSize: '9.5px', opacity: 0.9, backgroundColor: 'rgba(0,0,0,0.15)', padding: '1px 4px', borderRadius: '3px' }}>
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
          <span>DEVELOP DEVICE STYLE</span>
        </div>
      </div>
    </header>
  );
};
