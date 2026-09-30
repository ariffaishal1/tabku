import React from 'react';
import { ROOT_NOTES, SCALE_DEFINITIONS, SCALE_POSITION_OPTIONS, type ScaleDisplayMode } from '../../services/scaleTheory';

interface ScaleLabBarProps {
  isScaleMode: boolean;
  scaleRoot: number;
  scaleId: string;
  scalePosition: number | 'all';
  scaleDisplayMode: ScaleDisplayMode;
  backingProgressionName: string;
  scaleLabBarRef: React.RefObject<HTMLDivElement | null>;
  scaleLabCanScrollLeft: boolean;
  scaleLabCanScrollRight: boolean;
  onCheckScroll: () => void;
  onScaleConfigChange: (root: number, scaleId: string) => void;
  onSetScalePosition: (pos: number | 'all') => void;
  onToggleDisplayMode: () => void;
}

export const ScaleLabBar: React.FC<ScaleLabBarProps> = ({
  isScaleMode,
  scaleRoot,
  scaleId,
  scalePosition,
  scaleDisplayMode,
  backingProgressionName,
  scaleLabBarRef,
  scaleLabCanScrollLeft,
  scaleLabCanScrollRight,
  onCheckScroll,
  onScaleConfigChange,
  onSetScalePosition,
  onToggleDisplayMode,
}) => {
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: isScaleMode ? '36px' : '0px',
        maxHeight: isScaleMode ? '36px' : '0px',
        opacity: isScaleMode ? 1 : 0,
        overflow: 'hidden',
        flexShrink: 0,
        transition:
          'height 0.22s cubic-bezier(0.4, 0, 0.2, 1), max-height 0.22s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.18s ease',
        pointerEvents: isScaleMode ? 'auto' : 'none',
      }}
    >
      {/* Left Scroll Indicator Arrow / Gradient */}
      {isScaleMode && scaleLabCanScrollLeft && (
        <button
          onClick={() => scaleLabBarRef.current?.scrollBy({ left: -140, behavior: 'smooth' })}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: '32px',
            background: 'linear-gradient(to right, var(--bg-surface) 55%, transparent)',
            border: 'none',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            paddingLeft: '6px',
            color: 'var(--accent-coral)',
            fontSize: '14px',
            fontWeight: 900,
            cursor: 'pointer',
            outline: 'none',
            boxShadow: '2px 0 8px rgba(0,0,0,0.5)',
          }}
          title="Scroll ke kiri (opsi Scale Lab sebelumnya)"
        >
          ‹
        </button>
      )}

      <div
        ref={scaleLabBarRef}
        onScroll={onCheckScroll}
        className="scale-lab-bar-scroll"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '0 16px',
          height: '36px',
          backgroundColor: 'var(--bg-surface)',
          borderBottom: isScaleMode ? '1px solid var(--border-subtle)' : '1px solid transparent',
          boxSizing: 'border-box',
          fontFamily: 'var(--font-mono)',
          overflowX: isScaleMode ? 'auto' : 'hidden',
          overflowY: 'hidden',
          width: '100%',
        }}
      >
        {/* Label */}
        <span
          style={{
            fontSize: '9px',
            fontWeight: 900,
            color: 'var(--accent-coral)',
            letterSpacing: '1px',
            marginRight: '4px',
            whiteSpace: 'nowrap',
          }}
        >
          🗺️ SCALE LAB
        </span>

        <span style={{ color: 'var(--border-strong)', fontSize: '10px' }}>|</span>

        {/* Root Note Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 700 }}>ROOT</span>
          <select
            id="scale-root-select"
            value={scaleRoot}
            onChange={(e) => onScaleConfigChange(parseInt(e.target.value, 10), scaleId)}
            style={{
              backgroundColor: 'var(--bg-control)',
              color: 'var(--accent-coral)',
              border: '1px solid var(--border-medium)',
              borderRadius: '4px',
              padding: '2px 6px',
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 800,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {ROOT_NOTES.map((r) => (
              <option key={r.pitchClass} value={r.pitchClass}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        {/* Scale Type Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 700 }}>SCALE</span>
          <select
            id="scale-type-select"
            value={scaleId}
            onChange={(e) => onScaleConfigChange(scaleRoot, e.target.value)}
            style={{
              backgroundColor: 'var(--bg-control)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-medium)',
              borderRadius: '4px',
              padding: '2px 6px',
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {SCALE_DEFINITIONS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <span style={{ color: 'var(--border-strong)', fontSize: '10px' }}>|</span>

        {/* Position / Box Selector (Segmented Pill Cluster) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
          <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 700, marginRight: '2px' }}>POSISI</span>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'var(--bg-control)',
              border: '1px solid var(--border-medium)',
              borderRadius: '4px',
              padding: '1px',
              gap: '1px',
            }}
          >
            {SCALE_POSITION_OPTIONS.map((opt) => {
              const isSelected = scalePosition === opt.value;
              const labelShort = opt.value === 'all' ? 'ALL' : `${opt.value}`;
              return (
                <button
                  key={opt.value}
                  id={`scale-pos-btn-${opt.value}`}
                  onClick={() => onSetScalePosition(opt.value)}
                  title={opt.label}
                  style={{
                    backgroundColor: isSelected ? 'var(--accent-cyan)' : 'transparent',
                    color: isSelected ? 'var(--text-inverse)' : 'var(--text-secondary)',
                    border: 'none',
                    borderRadius: '3px',
                    padding: '2px 7px',
                    fontSize: '9.5px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: isSelected ? 900 : 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {labelShort}
                </button>
              );
            })}
          </div>
        </div>

        <span style={{ color: 'var(--border-strong)', fontSize: '10px' }}>|</span>

        {/* Degrees / Note Names Toggle */}
        <button
          onClick={onToggleDisplayMode}
          title="Toggle antara Scale Degrees (R, ♭3, 5) dan Nama Not (A, C, D...)"
          style={{
            backgroundColor: 'var(--bg-control)',
            color: scaleDisplayMode === 'degrees' ? 'var(--accent-amber)' : 'var(--accent-cyan)',
            border: '1px solid var(--border-medium)',
            borderRadius: '4px',
            padding: '3px 8px',
            fontSize: '9.5px',
            fontWeight: 800,
            fontFamily: 'var(--font-mono)',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {scaleDisplayMode === 'degrees' ? 'DEG (R, ♭3, 5)' : 'NOTE (A, C, D)'}
        </button>

        {/* Backing Track Info Pill */}
        {backingProgressionName && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              backgroundColor: 'var(--accent-coral-glow)',
              border: '1px solid var(--border-medium)',
              borderRadius: '4px',
              padding: '2px 8px',
              fontSize: '9px',
              color: 'var(--accent-amber)',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              marginLeft: '4px',
            }}
            title={`Active Backing Track: ${backingProgressionName}`}
          >
            <span>🎵</span>
            <span
              style={{
                maxWidth: '200px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {backingProgressionName}
            </span>
          </div>
        )}
      </div>

      {/* Right Scroll Indicator Arrow / Gradient */}
      {isScaleMode && scaleLabCanScrollRight && (
        <button
          onClick={() => scaleLabBarRef.current?.scrollBy({ left: 140, behavior: 'smooth' })}
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: '32px',
            background: 'linear-gradient(to left, var(--bg-surface) 55%, transparent)',
            border: 'none',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            paddingRight: '6px',
            color: 'var(--accent-coral)',
            fontSize: '14px',
            fontWeight: 900,
            cursor: 'pointer',
            outline: 'none',
            boxShadow: '-2px 0 8px rgba(0,0,0,0.3)',
          }}
          title="Scroll ke kanan (opsi Scale Lab lainnya)"
        >
          ›
        </button>
      )}
    </div>
  );
};
