import React, { useRef, useEffect } from 'react';
import type { ExtractedNote } from '../../services/timelineExtractor';
import {
  ROOT_NOTES,
  SCALE_DEFINITIONS,
  type ScaleDisplayMode,
  getScalePositionInfo,
} from '../../services/scaleTheory';
import type { CanvasThemeColors } from '../../types/theme';
import {
  ROMAN_NUMERALS,
  drawFretboardCanvas,
} from '../../utils/canvasRenderers/fretboardRenderer';

interface FlatFretboard2DProps {
  activeNotes: ExtractedNote[];
  nextNotes: ExtractedNote[];
  activeTechniqueTitle?: string;
  tuningNames: string[];
  tuning?: number[];
  isPlaying?: boolean;
  isFlipped?: boolean;

  // Scale Lab Canvas Overlay Props (FR-NEXT-05)
  isScaleMode?: boolean;
  scaleRoot?: number;
  scaleId?: string;
  scaleDisplayMode?: ScaleDisplayMode;
  scalePosition?: number | 'all';
  backingProgressionName?: string;

  // Custom Theme Palette (FR-NEXT-08)
  canvasTheme?: CanvasThemeColors;
}

export const FlatFretboard2D: React.FC<FlatFretboard2DProps> = ({
  activeNotes,
  nextNotes,
  activeTechniqueTitle,
  tuningNames,
  tuning = [64, 59, 55, 50, 45, 40],
  isPlaying = false,
  isFlipped = false,
  isScaleMode = false,
  scaleRoot = 9,
  scaleId = 'minor_pentatonic',
  scaleDisplayMode = 'degrees',
  scalePosition = 'all',
  backingProgressionName,
  canvasTheme,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Derive active fret, hand position, and notes summary for left sub-panel
  const primaryNote = activeNotes.length > 0 ? activeNotes[0] : null;
  const frettedOnly = [...new Set(activeNotes.filter((n) => n.fret > 0).map((n) => n.fret))].sort(
    (a, b) => a - b,
  );

  const currentScale = SCALE_DEFINITIONS.find((s) => s.id === scaleId) || SCALE_DEFINITIONS[0];
  const currentRoot = ROOT_NOTES.find((r) => r.pitchClass === scaleRoot) || ROOT_NOTES[9];
  const positionInfo = getScalePositionInfo(scaleRoot, scaleId, scalePosition);

  let activeFretText = '--';
  let positionText = 'IDLE';
  let notesSummaryText = 'NO ACTIVE NOTES';

  if (activeNotes.length === 0) {
    if (isScaleMode) {
      activeFretText = scalePosition === 'all' ? currentRoot.name : `BOX ${scalePosition}`;
      positionText =
        scalePosition === 'all'
          ? `${currentRoot.name} ${currentScale.name.toUpperCase()}`
          : `${currentRoot.name} ${currentScale.name.toUpperCase()} · POSISI ${scalePosition}`;
      notesSummaryText =
        scalePosition === 'all'
          ? backingProgressionName
            ? `JAM · ${backingProgressionName.toUpperCase()}`
            : `${currentScale.description.toUpperCase()}`
          : `${positionInfo.label.toUpperCase()}`;
    } else {
      activeFretText = '--';
      positionText = 'IDLE';
      notesSummaryText = 'NO ACTIVE NOTES';
    }
  } else if (frettedOnly.length === 0) {
    activeFretText = 'OPEN';
    positionText = 'OPEN STRINGS';
    const openNotes = [...new Set(activeNotes.map((n) => n.noteName.replace(/\d/, '')))];
    notesSummaryText = `${activeNotes.length} STRINGS · ${openNotes.join(', ')}`;
  } else if (activeNotes.length === 1) {
    const n = activeNotes[0];
    const stringPitch = tuningNames[n.string - 1] || `S${n.string}`;
    const cleanNote = n.noteName.replace(/\d/, '');
    activeFretText = n.fret === 0 ? 'OPEN' : n.fret < 10 ? `0${n.fret}` : `${n.fret}`;
    positionText = n.fret === 0 ? 'OPEN STRING' : `POSITION ${ROMAN_NUMERALS[n.fret] || n.fret}`;
    notesSummaryText = `STRING ${n.string} (${stringPitch}) · ${cleanNote}`;
  } else {
    const minF = frettedOnly[0];
    const maxF = frettedOnly[frettedOnly.length - 1];
    const span = maxF - minF + 1;
    const minStr = minF < 10 ? `0${minF}` : `${minF}`;
    const maxStr = maxF < 10 ? `0${maxF}` : `${maxF}`;

    activeFretText = minF === maxF ? minStr : `${minStr}–${maxStr}`;

    if (minF <= 3 && activeNotes.some((n) => n.fret === 0)) {
      positionText = `OPEN POS · SPAN ${span}F`;
    } else {
      const posRoman = ROMAN_NUMERALS[minF] || `${minF}`;
      positionText = `POS ${posRoman} · SPAN ${span}F`;
    }

    const uniqueNotes = [...new Set(activeNotes.map((n) => n.noteName.replace(/\d/, '')))];
    notesSummaryText = `${activeNotes.length} STRINGS · ${uniqueNotes.join(', ')}`;
  }

  const techniqueText = activeTechniqueTitle
    ? activeTechniqueTitle
    : primaryNote?.isBend
    ? `BEND (+${primaryNote.bendAmount || 1} TONE)`
    : primaryNote?.isSlide
    ? `SLIDE TO FRET ${primaryNote.slideToFret || ''}`
    : primaryNote?.isVibrato
    ? 'VIBRATO ARTICULATION'
    : primaryNote?.isHarmonic
    ? 'NATURAL HARMONIC'
    : primaryNote?.isPalmMute
    ? 'PALM MUTE'
    : activeNotes.length > 1
    ? 'CHORD SHAPE'
    : activeNotes.length === 1
    ? 'STANDARD STROKE'
    : isScaleMode
    ? 'SCALE PRACTICE LAB'
    : 'IDLE';

  // Canvas drawing loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      if (width === 0 || height === 0) {
        animId = requestAnimationFrame(render);
        return;
      }

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      drawFretboardCanvas(ctx, {
        width,
        height,
        activeNotes,
        nextNotes,
        tuningNames,
        tuning,
        isFlipped,
        isPlaying,
        isScaleMode,
        scaleRoot,
        scaleId,
        scaleDisplayMode,
        scalePosition,
        positionInfo,
        canvasTheme,
      });

      ctx.restore();

      if (isPlaying) {
        animId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [
    activeNotes,
    nextNotes,
    tuningNames,
    tuning,
    isPlaying,
    isFlipped,
    isScaleMode,
    scaleRoot,
    scaleId,
    scaleDisplayMode,
    scalePosition,
    positionInfo,
    canvasTheme,
  ]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        width: '100%',
        height: '100%',
        backgroundColor: 'var(--bg-primary)',
        borderBottom: '1px solid var(--border-subtle)',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* 1. Left Sub-Panel: ACTIVE FRETS */}
      <div
        className="stage-hud-left-panel"
        style={{
          width: '175px',
          minWidth: '175px',
          backgroundColor: 'var(--bg-surface)',
          borderRight: '1px solid var(--border-subtle)',
          padding: '14px 12px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxSizing: 'border-box',
          userSelect: 'none',
        }}
      >
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '10px',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              letterSpacing: '1px',
              color: '#9e9191',
              marginBottom: '8px',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: isScaleMode ? '#8be9fd' : 'var(--accent-coral)',
                display: 'inline-block',
                boxShadow: isScaleMode ? '0 0 6px #8be9fd' : 'none',
              }}
            />
            {isScaleMode && activeNotes.length === 0 ? 'SCALE ROADMAP' : 'ACTIVE FRETS'}
          </div>

          <div
            style={{
              fontSize:
                activeFretText.length > 4 ? '30px' : activeFretText.length > 2 ? '36px' : '44px',
              fontWeight: 900,
              fontFamily: 'var(--font-mono)',
              lineHeight: 1.0,
              color: activeFretText === '--' ? 'var(--text-muted)' : 'var(--accent-coral)',
              letterSpacing: '-1px',
              marginBottom: '6px',
              textShadow: activeFretText !== '--' ? '0 0 20px var(--accent-coral-glow)' : 'none',
            }}
          >
            {activeFretText}
          </div>

          <div
            title={positionText}
            style={{
              fontSize: '10.5px',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-primary)',
              letterSpacing: '0.5px',
              marginBottom: '4px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {positionText}
          </div>

          <div
            title={notesSummaryText}
            style={{
              fontSize: '9px',
              fontWeight: 600,
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-muted)',
              letterSpacing: '0.3px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {notesSummaryText}
          </div>
        </div>

        {/* Technique Badge with Dynamic Color-Coding */}
        <div
          style={{
            padding: '5px 8px',
            borderRadius: '4px',
            backgroundColor: primaryNote?.isBend
              ? 'rgba(241, 250, 140, 0.12)'
              : primaryNote?.isSlide
              ? 'rgba(139, 233, 253, 0.12)'
              : primaryNote?.isVibrato
              ? 'rgba(255, 121, 198, 0.12)'
              : primaryNote?.isHammerPull
              ? 'rgba(80, 250, 123, 0.12)'
              : primaryNote?.isHarmonic
              ? 'rgba(139, 233, 253, 0.12)'
              : primaryNote?.isPalmMute
              ? 'rgba(255, 184, 108, 0.12)'
              : 'var(--bg-control)',
            border: primaryNote?.isBend
              ? '1px solid rgba(241, 250, 140, 0.4)'
              : primaryNote?.isSlide
              ? '1px solid rgba(139, 233, 253, 0.4)'
              : primaryNote?.isVibrato
              ? '1px solid rgba(255, 121, 198, 0.4)'
              : primaryNote?.isHammerPull
              ? '1px solid rgba(80, 250, 123, 0.4)'
              : primaryNote?.isHarmonic
              ? '1px solid rgba(139, 233, 253, 0.4)'
              : primaryNote?.isPalmMute
              ? '1px solid rgba(255, 184, 108, 0.4)'
              : '1px solid var(--border-medium)',
            fontSize: '9.5px',
            fontFamily: 'var(--font-mono)',
            fontWeight: 800,
            color: primaryNote?.isBend
              ? '#f1fa8c'
              : primaryNote?.isSlide
              ? '#8be9fd'
              : primaryNote?.isVibrato
              ? '#ff79c6'
              : primaryNote?.isHammerPull
              ? '#50fa7b'
              : primaryNote?.isHarmonic
              ? '#8be9fd'
              : primaryNote?.isPalmMute
              ? '#ffb86c'
              : 'var(--accent-coral)',
            letterSpacing: '0.5px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
          title={techniqueText}
        >
          {techniqueText}
        </div>
      </div>

      {/* 2. Right Canvas: 2D Flat Fretboard */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div style={{ flex: 1, position: 'relative', width: '100%', height: '100%' }}>
          <canvas
            ref={canvasRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'block',
            }}
          />
        </div>

        {/* Legend Bar at Bottom */}
        <div
          className="stage-legend-footer"
          style={{
            minHeight: '24px',
            backgroundColor: 'var(--bg-surface)',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '4px 16px',
            fontSize: '9.5px',
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
            color: 'var(--text-muted)',
            userSelect: 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {isScaleMode && (
              <>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      width: '8px',
                      height: '8px',
                      backgroundColor: 'var(--accent-coral)',
                      borderRadius: '50%',
                      boxShadow: '0 0 6px var(--accent-coral)',
                    }}
                  />
                  <span style={{ color: 'var(--accent-coral)', fontWeight: 800 }}>ROOT</span>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      width: '8px',
                      height: '8px',
                      backgroundColor: '#ff79c6',
                      borderRadius: '50%',
                      boxShadow: '0 0 6px #ff79c6',
                    }}
                  />
                  <span style={{ color: '#ff79c6', fontWeight: 800 }}>BLUE NOTE (♭5)</span>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      width: '8px',
                      height: '8px',
                      backgroundColor: 'var(--bg-control)',
                      border: '1px solid var(--border-medium)',
                      borderRadius: '50%',
                    }}
                  />
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>
                    SCALE TONE
                  </span>
                </span>
                {scalePosition !== 'all' && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '1px 6px',
                      backgroundColor: 'rgba(139, 233, 253, 0.1)',
                      border: '1px solid rgba(139, 233, 253, 0.35)',
                      borderRadius: '3px',
                      color: 'var(--accent-cyan)',
                      fontWeight: 800,
                      fontSize: '9px',
                    }}
                  >
                    BOX {scalePosition} ACTIVE
                  </span>
                )}
                <span style={{ color: 'var(--border-subtle)' }}>|</span>
              </>
            )}
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span
                style={{
                  display: 'inline-block',
                  width: '8px',
                  height: '8px',
                  backgroundColor: 'var(--accent-coral)',
                  borderRadius: '1px',
                }}
              />
              <span style={{ color: 'var(--accent-coral)', fontWeight: 700 }}>NOW</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span
                style={{
                  display: 'inline-block',
                  width: '8px',
                  height: '8px',
                  border: '1.5px solid var(--accent-coral)',
                  borderRadius: '1px',
                }}
              />
              <span style={{ color: 'var(--text-secondary)' }}>NEXT</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ color: '#f1fa8c', fontWeight: 800 }}>⤴</span>
              <span style={{ color: '#e0d880' }}>BEND</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ color: '#8be9fd', fontWeight: 800 }}>➔</span>
              <span style={{ color: '#7bc8d9' }}>SLIDE</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ color: '#ff79c6', fontWeight: 800 }}>∿</span>
              <span style={{ color: '#d96aa8' }}>VIB</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ color: '#50fa7b', fontWeight: 800 }}>H/P</span>
              <span style={{ color: '#44c965' }}>LEGATO</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ color: '#8be9fd', fontWeight: 800 }}>◆</span>
              <span style={{ color: '#7bc8d9' }}>HARM</span>
            </span>
          </div>

          <div style={{ color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
            {isScaleMode ? 'SCALE ROADMAP · 24 FRETS' : 'FULL FRETBOARD / 00-24'}
          </div>
        </div>
      </div>
    </div>
  );
};
