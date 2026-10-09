import React, { useRef, useEffect } from 'react';
import type { SongTimeline, ExtractedNote } from '../../services/timelineExtractor';
import { ChordDiagram } from '../Telemetry/ChordDiagram';
import type { CanvasThemeColors } from '../../types/theme';
import { drawHighwayCanvas } from '../../utils/canvasRenderers/highwayRenderer';

interface StringFlowHighwayProps {
  timeline: SongTimeline | null;
  currentTimeMs: number;
  isPlaying: boolean;
  activeNotes: ExtractedNote[];
  activeChordName?: string;
  tuningNames: string[];
  activeTechniqueTitle?: string;
  loopAMs?: number;
  loopBMs?: number;
  isFlipped?: boolean;
  speed?: number;

  // Scale Mode props (FR-NEXT-05)
  isScaleMode?: boolean;
  scaleRoot?: number;
  scaleId?: string;
  scaleDisplayMode?: 'degrees' | 'notes';
  tuning?: number[];
  backingProgressionName?: string;

  // Custom Theme Palette (FR-NEXT-08)
  canvasTheme?: CanvasThemeColors;
}

export const StringFlowHighway: React.FC<StringFlowHighwayProps> = ({
  timeline,
  currentTimeMs,
  isPlaying,
  activeNotes,
  activeChordName,
  tuningNames,
  activeTechniqueTitle,
  loopAMs,
  loopBMs,
  isFlipped = false,
  speed = 1.0,
  isScaleMode = false,
  scaleRoot = 9,
  scaleId = 'minor_pentatonic',
  scaleDisplayMode = 'degrees',
  tuning = [64, 59, 55, 50, 45, 40],
  backingProgressionName,
  canvasTheme,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Derive sounding note & string for the left panel
  const primaryNote = activeNotes.length > 0 ? activeNotes[0] : null;
  const soundingNoteText = activeChordName
    ? activeChordName
    : primaryNote
    ? primaryNote.noteName.replace(/\d/, '')
    : 'REST';

  // Active technique chip for single note
  let activeTechLabel: string | null = null;
  let activeTechColor = canvasTheme?.nowIndicator || 'var(--accent-coral)';
  let activeTechBg = canvasTheme?.nowGlow || 'var(--accent-coral-glow)';

  if (activeTechniqueTitle) {
    activeTechLabel = activeTechniqueTitle.toUpperCase();
    if (activeTechLabel.includes('BEND')) {
      activeTechColor = '#ffb86c';
      activeTechBg = 'rgba(255, 184, 108, 0.2)';
    } else if (activeTechLabel.includes('VIBRATO')) {
      activeTechColor = '#ff79c6';
      activeTechBg = 'rgba(255, 121, 198, 0.2)';
    } else if (activeTechLabel.includes('SLIDE')) {
      activeTechColor = '#8be9fd';
      activeTechBg = 'rgba(139, 233, 253, 0.2)';
    } else if (activeTechLabel.includes('HARMONIC')) {
      activeTechColor = '#50fa7b';
      activeTechBg = 'rgba(80, 250, 123, 0.2)';
    }
  } else if (primaryNote) {
    if (primaryNote.isBend) {
      const stepStr =
        primaryNote.bendAmount !== undefined && Math.abs(primaryNote.bendAmount - 0.5) < 0.15
          ? '½ STEP'
          : 'FULL STEP';
      activeTechLabel = `⤴ BEND (${stepStr})`;
      activeTechColor = '#ffb86c';
      activeTechBg = 'rgba(255, 184, 108, 0.2)';
    } else if (primaryNote.isVibrato) {
      activeTechLabel = '∿ VIBRATO';
      activeTechColor = '#ff79c6';
      activeTechBg = 'rgba(255, 121, 198, 0.2)';
    } else if (primaryNote.isSlide) {
      activeTechLabel =
        primaryNote.slideToFret !== undefined
          ? `→ SLIDE TO ${primaryNote.slideToFret}`
          : '→ SLIDE';
      activeTechColor = '#8be9fd';
      activeTechBg = 'rgba(139, 233, 253, 0.2)';
    } else if (primaryNote.isHarmonic) {
      activeTechLabel = '◆ HARMONIC';
      activeTechColor = '#50fa7b';
      activeTechBg = 'rgba(80, 250, 123, 0.2)';
    } else if (primaryNote.isHammerPull) {
      activeTechLabel = primaryNote.hammerPullType === 'pull' ? '↷ PULL-OFF' : '↷ HAMMER-ON';
      activeTechColor = '#50fa7b';
      activeTechBg = 'rgba(80, 250, 123, 0.2)';
    } else if (primaryNote.isPalmMute) {
      activeTechLabel = '▪ PALM MUTE';
      activeTechColor = '#8be9fd';
      activeTechBg = 'rgba(139, 233, 253, 0.2)';
    }
  }

  // Canvas drawing loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      drawHighwayCanvas(ctx, {
        width,
        height,
        timeline,
        currentTimeMs,
        activeNotes,
        tuningNames,
        loopAMs,
        loopBMs,
        isFlipped,
        speed,
        isScaleMode,
        scaleRoot,
        scaleId,
        scaleDisplayMode,
        tuning,
        backingProgressionName,
        canvasTheme,
      });

      ctx.restore();

      // Only continue animation loop if playing; otherwise render once and stop
      if (isPlaying) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [
    timeline,
    currentTimeMs,
    activeNotes,
    tuningNames,
    isPlaying,
    loopAMs,
    loopBMs,
    isFlipped,
    speed,
    isScaleMode,
    scaleRoot,
    scaleId,
    scaleDisplayMode,
    tuning,
    backingProgressionName,
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
      {/* 1. Left Sub-Panel: SOUNDING NOTES & TECHNIQUE HUD */}
      <div
        className="stage-hud-left-panel"
        style={{
          width: '185px',
          minWidth: '185px',
          backgroundColor: 'var(--bg-surface)',
          borderRight: '1px solid var(--border-subtle)',
          padding: '16px 14px',
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
              marginBottom: '10px',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent-coral)',
                display: 'inline-block',
                boxShadow: isPlaying ? '0 0 6px var(--accent-coral)' : 'none',
              }}
            />
            SOUNDING NOTES
          </div>

          <div
            style={{
              fontSize: '44px',
              fontWeight: 900,
              fontFamily: 'var(--font-mono)',
              lineHeight: 1.0,
              color: soundingNoteText === 'REST' ? 'var(--text-muted)' : 'var(--text-primary)',
              letterSpacing: '-1px',
              marginBottom: '6px',
              textShadow:
                soundingNoteText !== 'REST' ? '0 0 20px var(--accent-coral-glow)' : 'none',
            }}
          >
            {soundingNoteText}
          </div>

          {activeNotes.length > 1 ? (
            <div
              style={{
                marginTop: '8px',
                padding: '6px 8px',
                borderRadius: '6px',
                backgroundColor: 'var(--bg-control)',
                border: '1px solid var(--border-subtle)',
                display: 'inline-flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <ChordDiagram
                notes={activeNotes}
                numStrings={tuningNames.length || 6}
                width={84}
                height={92}
                accentColor={canvasTheme?.nowIndicator}
                fretColor={canvasTheme?.fretWire}
              />
            </div>
          ) : primaryNote ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--accent-coral)',
                  letterSpacing: '0.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>STR 0{primaryNote.string}</span>
                <span style={{ color: 'var(--border-strong)' }}>•</span>
                <span>FRET {primaryNote.fret}</span>
              </div>

              {/* Active technique chip */}
              {activeTechLabel && (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '9.5px',
                    fontWeight: 800,
                    fontFamily: 'var(--font-mono)',
                    color: activeTechColor,
                    backgroundColor: activeTechBg,
                    border: `1px solid ${activeTechColor}`,
                    borderRadius: '4px',
                    padding: '3px 7px',
                    width: 'fit-content',
                    letterSpacing: '0.4px',
                  }}
                >
                  {activeTechLabel}
                </div>
              )}
            </div>
          ) : (
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-muted)',
                letterSpacing: '0.5px',
              }}
            >
              ALL STRINGS
            </div>
          )}
        </div>

        {/* Bottom Horizon Label */}
        <div
          style={{
            padding: '6px 8px',
            borderRadius: '4px',
            backgroundColor: 'var(--bg-control)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span
            style={{
              fontSize: '9.5px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              color: 'var(--text-secondary)',
              letterSpacing: '0.5px',
            }}
          >
            LOOK AHEAD
          </span>
          <span
            style={{
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 800,
              color: 'var(--accent-coral)',
            }}
          >
            3.0s
          </span>
        </div>
      </div>

      {/* 2. Right Canvas: Horizontal Scrolling Highway */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          height: '100%',
          overflow: 'hidden',
        }}
      >
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
    </div>
  );
};
