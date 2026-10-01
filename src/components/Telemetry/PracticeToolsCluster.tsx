import React from 'react';
import { Zap, TrendingUp, X, ArrowUpDown } from 'lucide-react';
import { formatTime } from '../../utils/guitarMath';

interface PracticeToolsClusterProps {
  speed: number;
  onSpeedChange?: (speed: number) => void;
  transpose?: number;
  onTransposeChange?: (semitones: number) => void;
  isSoloSlowdown: boolean;
  onToggleSoloSlowdown: () => void;
  isSpeedTrainer?: boolean;
  onToggleSpeedTrainer?: () => void;
  speedTrainerStep?: number;
  speedTrainerTarget?: number;
  speedTrainerLoopCount?: number;
  isLooping: boolean;
  onToggleLoop?: () => void;
  loopA?: number | null;
  loopB?: number | null;
  onSetLoopA?: () => void;
  onSetLoopB?: () => void;
  onClearABLoop?: () => void;
  isFlipped?: boolean;
  onToggleFlip?: () => void;
}

/**
 * Suite of guitar practice controls: Speed, Pitch/Transpose, Solo 50%,
 * Speed Trainer, A-B Looper, and Flipped Strings (Player POV).
 */
export const PracticeToolsCluster: React.FC<PracticeToolsClusterProps> = ({
  speed,
  onSpeedChange,
  transpose = 0,
  onTransposeChange,
  isSoloSlowdown,
  onToggleSoloSlowdown,
  isSpeedTrainer = false,
  onToggleSpeedTrainer,
  speedTrainerStep = 0.05,
  speedTrainerTarget = 1.0,
  speedTrainerLoopCount = 0,
  isLooping,
  onToggleLoop,
  loopA,
  loopB,
  onSetLoopA,
  onSetLoopB,
  onClearABLoop,
  isFlipped = false,
  onToggleFlip,
}) => {
  const hasABLoop = loopA != null && loopB != null;

  return (
    <>
      <div style={{ width: '1px', height: '16px', backgroundColor: 'var(--border-subtle)', margin: '0 1px' }} />

      {/* Speed Control with -/+ buttons */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
        }}
      >
        <button
          onClick={() => {
            const newSpeed = Math.max(0.25, Math.round((speed - 0.1) * 10) / 10);
            onSpeedChange?.(newSpeed);
          }}
          style={{
            width: '18px',
            height: '20px',
            borderRadius: '2px',
            border: '1px solid var(--border-medium)',
            backgroundColor: 'var(--bg-control)',
            color: 'var(--text-secondary)',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1,
            padding: 0,
          }}
          title="Kurangi kecepatan (-0.1x)"
        >
          −
        </button>
        <div
          style={{
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 5px',
            borderRadius: '3px',
            backgroundColor: 'var(--bg-control)',
            border: '1px solid var(--border-medium)',
            color: speed === 1.0 ? 'var(--text-secondary)' : 'var(--accent-coral)',
            fontSize: '10px',
            fontWeight: 700,
            fontFamily: 'var(--font-mono)',
            minWidth: '32px',
            textAlign: 'center',
            boxSizing: 'border-box',
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
            width: '18px',
            height: '20px',
            borderRadius: '2px',
            border: '1px solid var(--border-medium)',
            backgroundColor: 'var(--bg-control)',
            color: 'var(--text-secondary)',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1,
            padding: 0,
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
          gap: '2px',
        }}
      >
        <button
          onClick={() => {
            const newVal = Math.max(-12, transpose - 1);
            onTransposeChange?.(newVal);
          }}
          disabled={transpose <= -12}
          style={{
            width: '18px',
            height: '20px',
            borderRadius: '2px',
            border: '1px solid var(--border-medium)',
            backgroundColor: 'var(--bg-control)',
            color: transpose <= -12 ? 'var(--text-muted)' : 'var(--text-secondary)',
            fontSize: '11px',
            fontWeight: 700,
            cursor: transpose <= -12 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1,
            padding: 0,
          }}
          title="Turunkan tangga nada (-1 semitone / ½ nada)"
        >
          −
        </button>
        <div
          onClick={() => onTransposeChange?.(0)}
          style={{
            height: '20px',
            padding: '0 5px',
            borderRadius: '3px',
            backgroundColor: transpose !== 0 ? 'rgba(255, 184, 108, 0.16)' : 'var(--bg-control)',
            border: transpose !== 0 ? '1px solid var(--accent-amber)' : '1px solid var(--border-medium)',
            color: transpose !== 0 ? 'var(--accent-amber)' : 'var(--text-secondary)',
            fontSize: '10px',
            fontWeight: 700,
            fontFamily: 'var(--font-mono)',
            minWidth: '38px',
            textAlign: 'center',
            cursor: transpose !== 0 ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '2px',
            userSelect: 'none',
            boxShadow: transpose !== 0 ? '0 0 8px rgba(255, 184, 108, 0.25)' : 'none',
            transition: 'all 0.15s ease',
            boxSizing: 'border-box',
          }}
          title={
            transpose === 0
              ? 'Tangga Nada Asli (0 semitone). Gunakan −/+ untuk mengubah nada audio & tab.'
              : `Transpose: ${transpose > 0 ? `+${transpose}` : transpose} semitone (${Math.abs(transpose) % 2 === 0 ? `${Math.abs(transpose) / 2} nada penuh` : `${Math.abs(transpose) * 0.5} nada`}).\nKlik untuk reset ke nada asli.`
          }
        >
          <span style={{ fontSize: '8px', opacity: 0.7 }}>KEY</span>
          <span>{transpose === 0 ? '0' : transpose > 0 ? `+${transpose}` : `${transpose}`}</span>
        </div>
        <button
          onClick={() => {
            const newVal = Math.min(12, transpose + 1);
            onTransposeChange?.(newVal);
          }}
          disabled={transpose >= 12}
          style={{
            width: '18px',
            height: '20px',
            borderRadius: '2px',
            border: '1px solid var(--border-medium)',
            backgroundColor: 'var(--bg-control)',
            color: transpose >= 12 ? 'var(--text-muted)' : 'var(--text-secondary)',
            fontSize: '11px',
            fontWeight: 700,
            cursor: transpose >= 12 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1,
            padding: 0,
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
          gap: '4px',
          height: '24px',
          padding: '0 7px',
          borderRadius: '3px',
          border: isSoloSlowdown ? '1.5px solid var(--accent-coral)' : '1px solid var(--border-medium)',
          backgroundColor: isSoloSlowdown ? 'var(--accent-coral-glow)' : 'var(--bg-control)',
          color: isSoloSlowdown ? 'var(--accent-coral)' : 'var(--text-secondary)',
          fontSize: '9.5px',
          fontWeight: 800,
          fontFamily: 'var(--font-mono)',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          boxSizing: 'border-box',
        }}
        title="Latih bagian solo dengan kecepatan 50%"
      >
        <Zap size={11} fill={isSoloSlowdown ? 'var(--accent-coral)' : 'none'} />
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
            gap: '4px',
            height: '24px',
            padding: '0 7px',
            borderRadius: '3px',
            border: isSpeedTrainer ? '1.5px solid var(--accent-amber)' : '1px solid var(--border-medium)',
            backgroundColor: isSpeedTrainer ? 'rgba(255, 184, 108, 0.2)' : 'var(--bg-control)',
            color: isSpeedTrainer ? 'var(--accent-amber)' : 'var(--text-secondary)',
            fontSize: '9.5px',
            fontWeight: 800,
            fontFamily: 'var(--font-mono)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: isSpeedTrainer ? '0 0 8px rgba(255, 184, 108, 0.35)' : 'none',
            boxSizing: 'border-box',
          }}
          title={`Speed Trainer (FR-NEXT-06)\nKeyboard shortcut: T\n${isSpeedTrainer ? `Aktif: Naik +${Math.round(speedTrainerStep * 100)}% per putaran loop (Target: ${Math.round(speedTrainerTarget * 100)}%)\nPutaran selesai: ${speedTrainerLoopCount}x` : 'Otomatis naikkan tempo (+5%) setiap kali satu putaran loop A-B selesai'}`}
        >
          <TrendingUp size={11} color={isSpeedTrainer ? 'var(--accent-amber)' : 'var(--text-muted)'} />
          <span>TRAINER</span>
          {isSpeedTrainer && (
            <span
              style={{
                fontSize: '8px',
                backgroundColor: 'var(--accent-amber)',
                color: 'var(--text-inverse)',
                padding: '0 3px',
                borderRadius: '2px',
                fontWeight: 900,
                lineHeight: '12px',
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
          gap: '2px',
          backgroundColor: 'var(--bg-control)',
          padding: '2px 3px',
          borderRadius: '4px',
          height: '24px',
          boxSizing: 'border-box',
          border: hasABLoop ? '1px solid var(--accent-coral)' : '1px solid var(--border-subtle)',
        }}
      >
        {onToggleLoop && (
          <button
            onClick={onToggleLoop}
            style={{
              height: '18px',
              padding: '0 5px',
              borderRadius: '2px',
              border: isLooping ? '1px solid var(--accent-coral)' : '1px solid var(--border-medium)',
              backgroundColor: isLooping ? 'var(--accent-coral-glow)' : 'var(--bg-surface)',
              color: isLooping ? 'var(--accent-coral)' : 'var(--text-secondary)',
              fontSize: '9px',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
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
            gap: '2px',
            height: '18px',
            padding: '0 4px',
            borderRadius: '2px',
            border: loopA != null ? '1px solid var(--accent-green)' : '1px solid var(--border-medium)',
            backgroundColor: loopA != null ? 'rgba(80, 250, 123, 0.15)' : 'var(--bg-surface)',
            color: loopA != null ? 'var(--accent-green)' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '9px',
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
          }}
          title={`Tetapkan titik awal Loop [A]\nKeyboard shortcut: [\n${loopA != null ? `A: ${formatTime(loopA)}` : 'Belum diatur'}`}
        >
          <span>A</span>
          <span style={{ fontSize: '8px', opacity: 0.7 }}>[</span>
          {loopA != null && <span style={{ fontSize: '8px', color: 'var(--text-secondary)' }}>{formatTime(loopA)}</span>}
        </button>

        <button
          onClick={onSetLoopB}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            height: '18px',
            padding: '0 4px',
            borderRadius: '2px',
            border: loopB != null ? '1px solid var(--accent-coral)' : '1px solid var(--border-medium)',
            backgroundColor: loopB != null ? 'var(--accent-coral-glow)' : 'var(--bg-surface)',
            color: loopB != null ? 'var(--accent-coral)' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '9px',
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
          }}
          title={`Tetapkan titik akhir Loop [B]\nKeyboard shortcut: ]\n${loopB != null ? `B: ${formatTime(loopB)}` : 'Belum diatur'}`}
        >
          <span>B</span>
          <span style={{ fontSize: '8px', opacity: 0.7 }}>]</span>
          {loopB != null && <span style={{ fontSize: '8px', color: 'var(--text-secondary)' }}>{formatTime(loopB)}</span>}
        </button>

        {hasABLoop && onClearABLoop && (
          <button
            onClick={onClearABLoop}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              height: '18px',
              padding: '0 3px',
              borderRadius: '2px',
              border: '1px solid var(--border-strong)',
              backgroundColor: 'var(--bg-surface-elevated)',
              color: 'var(--accent-red)',
              cursor: 'pointer',
              fontSize: '8.5px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
            }}
            title="Hapus pengaturan Loop A-B\nKeyboard shortcut: Backspace"
          >
            <X size={10} />
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
            gap: '4px',
            height: '24px',
            padding: '0 7px',
            borderRadius: '3px',
            border: isFlipped ? '1.5px solid var(--accent-cyan)' : '1px solid var(--border-medium)',
            backgroundColor: isFlipped ? 'rgba(139, 233, 253, 0.15)' : 'var(--bg-control)',
            color: isFlipped ? 'var(--accent-cyan)' : 'var(--text-secondary)',
            fontSize: '9.5px',
            fontWeight: 800,
            fontFamily: 'var(--font-mono)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: isFlipped ? '0 0 6px rgba(139,233,233,0.3)' : 'none',
            boxSizing: 'border-box',
          }}
          title={`Balik urutan senar (Player POV)\nKeyboard shortcut: F\n${isFlipped ? 'Aktif: Senar 6 di atas, Senar 1 di bawah' : 'Normal: Senar 1 di atas, Senar 6 di bawah'}`}
        >
          <ArrowUpDown size={11} style={{ flexShrink: 0 }} />
          <span>FLIP</span>
        </button>
      )}
    </>
  );
};
