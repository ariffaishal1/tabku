import { Volume2, VolumeX, Metronome, Timer, Music, Maximize2, Minimize2 } from 'lucide-react';

interface AudioToolsClusterProps {
  isMetronomeOn?: boolean;
  onToggleMetronome?: () => void;
  metronomeVolume?: number;
  onMetronomeVolumeChange?: (vol: number) => void;
  isCountInEnabled?: boolean;
  onToggleCountIn?: () => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
  isSheetExpanded: boolean;
  onToggleSheet: () => void;
  isStageMode?: boolean;
  onToggleStageMode?: () => void;
}

/**
 * Audio and sheet display tools: Metronome click track, Count-In suite,
 * Metronome volume, Master volume fader, and 2D Partitur toggle.
 */
export const AudioToolsCluster: React.FC<AudioToolsClusterProps> = ({
  isMetronomeOn = false,
  onToggleMetronome,
  metronomeVolume = 0.7,
  onMetronomeVolumeChange,
  isCountInEnabled = false,
  onToggleCountIn,
  volume,
  onVolumeChange,
  isSheetExpanded,
  onToggleSheet,
  isStageMode = false,
  onToggleStageMode,
}) => {
  return (
    <div
      className="telemetry-right-cluster"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flexShrink: 0,
      }}
    >
      {/* Metronome & Count-In Suite */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          backgroundColor: 'var(--bg-control)',
          padding: '2px 3px',
          borderRadius: '4px',
          height: '24px',
          boxSizing: 'border-box',
          border:
            isMetronomeOn || isCountInEnabled
              ? '1px solid var(--accent-amber)'
              : '1px solid var(--border-subtle)',
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
              gap: '4px',
              height: '18px',
              padding: '0 5px',
              borderRadius: '2px',
              border: isMetronomeOn ? '1px solid var(--accent-amber)' : '1px solid var(--border-medium)',
              backgroundColor: isMetronomeOn ? 'rgba(255, 184, 108, 0.15)' : 'var(--bg-surface)',
              color: isMetronomeOn ? 'var(--accent-amber)' : 'var(--text-secondary)',
              fontSize: '9px',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: isMetronomeOn ? '0 0 6px rgba(255, 184, 108, 0.3)' : 'none',
            }}
            title={`Metronome Click Track\nKeyboard shortcut: M\n${isMetronomeOn ? 'Aktif (Ketukan menyala saat lagu berputar)' : 'Mati (Klik untuk menyalakan ketukan)'}`}
          >
            <Metronome size={10.5} />
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
              gap: '3px',
              height: '18px',
              padding: '0 5px',
              borderRadius: '2px',
              border: isCountInEnabled ? '1px solid var(--accent-amber)' : '1px solid var(--border-medium)',
              backgroundColor: isCountInEnabled ? 'rgba(255, 184, 108, 0.15)' : 'var(--bg-surface)',
              color: isCountInEnabled ? 'var(--accent-amber)' : 'var(--text-secondary)',
              fontSize: '9px',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: isCountInEnabled ? '0 0 6px rgba(255, 184, 108, 0.3)' : 'none',
            }}
            title={`Count-In 1 Birama\n${isCountInEnabled ? 'Aktif: Memberi ketukan hitungan awal 1 birama sebelum lagu berputar' : 'Mati: Lagu langsung berputar saat Play ditekan'}`}
          >
            <Timer size={10.5} />
            <span>COUNT-IN</span>
          </button>
        )}

        {/* Metronome Click Volume Slider */}
        {onMetronomeVolumeChange && (isMetronomeOn || isCountInEnabled) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              marginLeft: '1px',
              paddingLeft: '3px',
              borderLeft: '1px solid var(--border-medium)',
            }}
            title={`Volume Metronom: ${Math.round(metronomeVolume * 100)}%`}
          >
            <span
              style={{
                fontSize: '8px',
                color: 'var(--accent-amber)',
                fontWeight: 800,
                fontFamily: 'var(--font-mono)',
              }}
            >
              VOL
            </span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={metronomeVolume}
              onChange={(e) => onMetronomeVolumeChange(parseFloat(e.target.value))}
              style={{
                width: '32px',
                height: '3px',
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
          gap: '4px',
          borderLeft: '1px solid var(--border-subtle)',
          paddingLeft: '6px',
        }}
      >
        <button
          onClick={() => onVolumeChange(volume === 0 ? 0.8 : 0)}
          style={{
            background: 'none',
            border: 'none',
            color: volume === 0 ? 'var(--accent-red)' : 'var(--text-muted)',
            cursor: 'pointer',
            padding: '1px',
            display: 'flex',
            alignItems: 'center',
          }}
          title={volume === 0 ? 'Nyalakan suara' : 'Bisukan suara'}
        >
          {volume === 0 ? <VolumeX size={13} /> : <Volume2 size={13} />}
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={volume}
          onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
          style={{
            width: '44px',
            height: '3px',
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
          gap: '4px',
          height: '24px',
          padding: '0 7px',
          borderRadius: '3px',
          border: isSheetExpanded ? '1px solid var(--border-strong)' : '1px solid var(--border-medium)',
          backgroundColor: isSheetExpanded ? 'var(--bg-control-active)' : 'var(--bg-control)',
          color: isSheetExpanded ? 'var(--text-primary)' : 'var(--text-secondary)',
          fontSize: '9.5px',
          fontWeight: 700,
          fontFamily: 'var(--font-mono)',
          cursor: 'pointer',
          boxSizing: 'border-box',
        }}
        title="Buka / Tutup Notasi Partitur 2D"
      >
        <Music size={11} />
        <span>PARTITUR 2D</span>
      </button>

      {/* Toggle Stage / Fullscreen Focus Mode */}
      {onToggleStageMode && (
        <button
          onClick={onToggleStageMode}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            height: '24px',
            padding: '0 7px',
            borderRadius: '3px',
            border: isStageMode ? '1.5px solid var(--accent-cyan)' : '1px solid var(--border-medium)',
            backgroundColor: isStageMode ? 'rgba(139, 233, 253, 0.15)' : 'var(--bg-control)',
            color: isStageMode ? 'var(--accent-cyan)' : 'var(--text-secondary)',
            fontSize: '9.5px',
            fontWeight: 700,
            fontFamily: 'var(--font-mono)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: isStageMode ? '0 0 6px rgba(139, 233, 253, 0.3)' : 'none',
            boxSizing: 'border-box',
          }}
          title={`Stage / Fullscreen Focus Mode (Zen Mode)\nKeyboard shortcut: Z\n${isStageMode ? 'Aktif (Klik atau tekan Z / Esc untuk keluar)' : 'Non-aktif (Klik atau tekan Z untuk fokus layar penuh)'}`}
        >
          {isStageMode ? <Minimize2 size={11} /> : <Maximize2 size={11} />}
          <span>{isStageMode ? 'KELUAR' : 'STAGE'}</span>
        </button>
      )}
    </div>
  );
};
