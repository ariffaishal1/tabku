import React, { useRef, useEffect } from 'react';
import type { SongTimeline, ExtractedNote } from '../../services/timelineExtractor';
import { getUpcomingHighwayBeats } from '../../services/timelineExtractor';
import { ChordDiagram } from '../Telemetry/ChordDiagram';

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
  let activeTechColor = '#FF7A65';
  let activeTechBg = 'rgba(255, 122, 101, 0.15)';

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
      activeTechLabel = primaryNote.slideToFret !== undefined ? `→ SLIDE TO ${primaryNote.slideToFret}` : '→ SLIDE';
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

      // 1. Dark Studio Background with subtle grid/vignette
      ctx.fillStyle = '#120e0e';
      ctx.fillRect(0, 0, width, height);

      const numStrings = tuningNames.length > 0 ? tuningNames.length : 6;
      // Generous top padding (52px) so String 1 has full headroom for bend arcs and badges
      const topPadding = 52;
      const bottomPadding = 26;
      const availableHeight = height - topPadding - bottomPadding;
      const stringSpacing = availableHeight / (numStrings - 1 || 1);

      // Helper: compute Y for a given physical string number (1-based)
      // Normal: String 1 (High E) at top, String 6 (Low E) at bottom
      // Flipped (Player POV): String 6 at top, String 1 at bottom
      const getStringY = (stringNum: number) => {
        const index = stringNum - 1; // 0-based
        const visualIndex = isFlipped ? (numStrings - 1 - index) : index;
        return topPadding + visualIndex * stringSpacing;
      };

      const STRIKE_X = 88; // Vertical Strike Line position
      const highwayWidth = width - STRIKE_X - 24;

      // 2. Top Header / Time Horizon Ruler Strip (y = 0..36)
      // Horizontal baseline for ruler
      ctx.beginPath();
      ctx.moveTo(0, 36);
      ctx.lineTo(width, 36);
      ctx.strokeStyle = '#221a1a';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Collect measure / bar starts for highway dividers & ruler badges
      const barStarts: { barIndex: number; startMs: number; barX: number }[] = [];
      if (timeline && timeline.beats.length > 0) {
        let lastBar = -1;
        for (const b of timeline.beats) {
          if (b.barIndex !== lastBar) {
            lastBar = b.barIndex;
            const offsetMs = b.startMs - currentTimeMs;
            if (offsetMs >= -100 && offsetMs <= 3000) {
              const progress = offsetMs / 3000;
              barStarts.push({
                barIndex: b.barIndex,
                startMs: b.startMs,
                barX: STRIKE_X + progress * highwayWidth,
              });
            }
          }
        }
      }

      // Time ticks (+0.5s, +1.0s, +1.5s, +2.0s, +2.5s, +3.0s)
      const timeTicks = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0];
      timeTicks.forEach((t) => {
        const tickX = STRIKE_X + (t / 3.0) * highwayWidth;
        if (tickX < width - 10) {
          ctx.beginPath();
          ctx.moveTo(tickX, 30);
          ctx.lineTo(tickX, 36);
          ctx.strokeStyle = '#382c2c';
          ctx.lineWidth = 1;
          ctx.stroke();

          // Only draw time text if not colliding with a bar badge (within 24px)
          const isNearBar = barStarts.some((b) => Math.abs(b.barX - tickX) < 24);
          if (!isNearBar) {
            ctx.fillStyle = '#655656';
            ctx.font = '700 8px "JetBrains Mono", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`+${t.toFixed(1)}s`, tickX, 20);
          }
        }
      });

      // 3. Draw Measure / Bar Dividers along the highway
      barStarts.forEach(({ barIndex, barX }) => {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(barX, 36);
        ctx.lineTo(barX, height - bottomPadding + 8);
        ctx.strokeStyle = '#261e1e';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Sleek Bar badge in ruler strip
        ctx.fillStyle = '#1c1616';
        ctx.strokeStyle = '#382c2c';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(barX + 2, 12, 26, 15, 3);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#8e7f7f';
        ctx.font = '800 8px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`M${barIndex}`, barX + 15, 20);
        ctx.restore();
      });

      // 4. String Lines with Realistic Gauges & Glow
      // Wound strings (4-6) are thicker; plain steel strings (1-3) are thinner
      const stringGauges = [1.0, 1.2, 1.5, 1.9, 2.3, 2.8];

      for (let i = 0; i < numStrings; i++) {
        const stringNum = i + 1; // 1 = highest string (High E)
        const y = getStringY(stringNum);
        const pitchName = tuningNames[i] || `S${stringNum}`;
        const isCurrentActiveString = activeNotes.some((n) => n.string === stringNum);
        const baseGauge = stringGauges[i] || 1.2;

        // Draw String Line across the highway
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(STRIKE_X - 10, y);
        ctx.lineTo(width, y);
        ctx.lineWidth = isCurrentActiveString ? baseGauge + 1.2 : baseGauge;
        ctx.strokeStyle = isCurrentActiveString
          ? '#FF7A65'
          : i >= 3
          ? '#382c2c' // wound string warm metallic
          : '#2c2222'; // plain string steel

        if (isCurrentActiveString) {
          ctx.shadowColor = '#FF7A65';
          ctx.shadowBlur = 8;
        }
        ctx.stroke();
        ctx.restore();

        // Draw String Pill Badge (to the left of the Strike line)
        const pillW = 38;
        const pillH = 18;
        const pillX = STRIKE_X - 48;
        const pillY = y - pillH / 2;

        ctx.save();
        if (isCurrentActiveString) {
          ctx.fillStyle = '#FF7A65';
          ctx.shadowColor = '#FF7A65';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.roundRect(pillX, pillY, pillW, pillH, 3);
          ctx.fill();

          ctx.fillStyle = '#120e0e';
          ctx.font = '800 9px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${stringNum} ${pitchName}`, pillX + pillW / 2, y);
        } else {
          ctx.fillStyle = '#1a1313';
          ctx.strokeStyle = '#2d2222';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(pillX, pillY, pillW, pillH, 3);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#837474';
          ctx.font = '700 8.5px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${stringNum} ${pitchName}`, pillX + pillW / 2, y);
        }
        ctx.restore();
      }

      // 5. Vertical Strike Line & Strike Header Marker
      // Strike Header Marker sits cleanly in the top ruler zone (y = 8..25) with downward pointer
      // Crucially, this is completely separated from String 1 (y = 52), so it NEVER occludes notes or bends!
      const strikeBadgeW = 46;
      const strikeBadgeH = 16;
      const strikeBadgeX = STRIKE_X - strikeBadgeW / 2;
      const strikeBadgeY = 8;

      ctx.save();
      ctx.fillStyle = '#221918';
      ctx.strokeStyle = '#FF7A65';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(strikeBadgeX, strikeBadgeY, strikeBadgeW, strikeBadgeH, 3);
      ctx.fill();
      ctx.stroke();

      // Neon indicator dot
      ctx.fillStyle = '#FF7A65';
      ctx.beginPath();
      ctx.arc(strikeBadgeX + 7, strikeBadgeY + strikeBadgeH / 2, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Strike text
      ctx.fillStyle = '#FF7A65';
      ctx.font = '800 8.5px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('STRIKE', strikeBadgeX + 25, strikeBadgeY + strikeBadgeH / 2);

      // Downward pointer arrow pointing to the strike line
      ctx.beginPath();
      ctx.moveTo(STRIKE_X - 4, strikeBadgeY + strikeBadgeH);
      ctx.lineTo(STRIKE_X + 4, strikeBadgeY + strikeBadgeH);
      ctx.lineTo(STRIKE_X, strikeBadgeY + strikeBadgeH + 4);
      ctx.closePath();
      ctx.fillStyle = '#FF7A65';
      ctx.fill();
      ctx.restore();

      // Laser Strike Line (starts at y = 29, well clear of the badge, running through all strings)
      const hasActiveHit = activeNotes.length > 0;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(STRIKE_X, 29);
      ctx.lineTo(STRIKE_X, height - bottomPadding + 8);
      ctx.lineWidth = hasActiveHit ? 2.5 : 2.0;
      ctx.strokeStyle = '#FF7A65';
      if (hasActiveHit) {
        ctx.shadowColor = '#FF7A65';
        ctx.shadowBlur = 10;
      }
      ctx.stroke();
      ctx.restore();

      // 6. Upcoming Highway Notes & Technique Visuals
      if (timeline && timeline.beats.length > 0) {
        const upcoming = getUpcomingHighwayBeats(timeline, currentTimeMs, 3000);

        upcoming.forEach(({ beat, progress, timeOffsetMs }) => {
          const noteX = STRIKE_X + progress * highwayWidth;
          const isAtStrikeLine = timeOffsetMs >= -50 && timeOffsetMs <= 90;

          beat.notes.forEach((n) => {
            const noteY = getStringY(n.string);

            const badgeW = n.fret >= 10 ? 28 : 24;
            const badgeH = 22;
            const badgeX = noteX - badgeW / 2;
            const badgeY = noteY - badgeH / 2;

            // A. DURATION TAIL (trailing forward to the RIGHT behind the attack)
            const durationPx = (beat.durationMs / 3000) * highwayWidth;
            const tailStartX = noteX + badgeW / 2;
            const tailLength = Math.max(0, durationPx - badgeW / 2);

            if (tailLength > 4) {
              ctx.save();
              if (n.isVibrato) {
                // Dynamic animated sine-wave ribbon tail for vibrato!
                ctx.beginPath();
                const waveSpeed = 0.025;
                const waveFreq = 6.0;
                const waveAmp = isAtStrikeLine ? 4.5 : 3.0;
                ctx.moveTo(tailStartX, noteY);
                for (let x = tailStartX; x <= tailStartX + tailLength; x += 3) {
                  const phase = (x - currentTimeMs * waveSpeed) / waveFreq;
                  const wy = noteY + Math.sin(phase) * waveAmp;
                  ctx.lineTo(x, wy);
                }
                ctx.lineWidth = 2.5;
                ctx.strokeStyle = isAtStrikeLine ? '#ff79c6' : 'rgba(255, 121, 198, 0.65)';
                if (isAtStrikeLine) {
                  ctx.shadowColor = '#ff79c6';
                  ctx.shadowBlur = 8;
                }
                ctx.stroke();
              } else {
                // Smooth gradient sustain tail
                const grad = ctx.createLinearGradient(tailStartX, noteY, tailStartX + tailLength, noteY);
                if (isAtStrikeLine || progress < 0.2) {
                  grad.addColorStop(0, 'rgba(255, 122, 101, 0.6)');
                  grad.addColorStop(1, 'rgba(255, 122, 101, 0.05)');
                } else {
                  grad.addColorStop(0, 'rgba(100, 85, 85, 0.4)');
                  grad.addColorStop(1, 'rgba(100, 85, 85, 0.05)');
                }
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.roundRect(tailStartX, noteY - 3, tailLength, 6, [0, 3, 3, 0]);
                ctx.fill();
              }
              ctx.restore();
            }

            // B. SLIDE BEAM & TARGET GHOST BADGE
            if (n.isSlide && n.slideToFret !== undefined) {
              ctx.save();
              const slideDist = 46;
              const targetX = noteX + slideDist;

              // Laser trajectory
              ctx.beginPath();
              ctx.moveTo(noteX + badgeW / 2 + 2, noteY);
              ctx.lineTo(targetX - 12, noteY);
              ctx.strokeStyle = '#8be9fd';
              ctx.lineWidth = 2;
              ctx.setLineDash([3, 2]);
              ctx.stroke();
              ctx.setLineDash([]);

              // Target ghost box
              ctx.fillStyle = 'rgba(139, 233, 253, 0.15)';
              ctx.strokeStyle = '#8be9fd';
              ctx.lineWidth = 1.2;
              ctx.beginPath();
              ctx.roundRect(targetX - 10, noteY - 9, 20, 18, 3);
              ctx.fill();
              ctx.stroke();

              ctx.fillStyle = '#8be9fd';
              ctx.font = '700 9.5px "JetBrains Mono", monospace';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(`${n.slideToFret}`, targetX, noteY);

              // Slide tag above beam
              ctx.font = '700 7.5px "JetBrains Mono", monospace';
              ctx.fillStyle = '#8be9fd';
              ctx.fillText('SLIDE →', noteX + slideDist / 2, noteY - 10);
              ctx.restore();
            }

            // C. NOTE BADGE (BODY)
            ctx.save();
            if (isAtStrikeLine) {
              // Glowing Hit State with pulse shadow
              ctx.fillStyle = '#FF7A65';
              ctx.shadowColor = '#FF7A65';
              ctx.shadowBlur = 16;
              ctx.beginPath();
              ctx.roundRect(badgeX - 2, badgeY - 2, badgeW + 4, badgeH + 4, 5);
              ctx.fill();

              // Hit shockwave ring
              ctx.strokeStyle = 'rgba(255, 122, 101, 0.45)';
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.roundRect(badgeX - 5, badgeY - 5, badgeW + 10, badgeH + 10, 6);
              ctx.stroke();

              ctx.fillStyle = '#120e0e';
              ctx.font = '900 12px "JetBrains Mono", monospace';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(`${n.fret}`, noteX, noteY);
            } else {
              ctx.fillStyle = '#1a1313';
              ctx.strokeStyle = progress < 0.25 ? '#FF7A65' : '#574d4d';
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 4);
              ctx.fill();
              ctx.stroke();

              ctx.fillStyle = progress < 0.25 ? '#FF7A65' : '#f5e8e8';
              ctx.font = '700 11px "JetBrains Mono", monospace';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(`${n.fret}`, noteX, noteY);
            }
            ctx.restore();

            // D. TECHNIQUE VISUALS ABOVE / AROUND NOTE
            // 1. BEND (Upward curved trajectory arc + amber step pill)
            if (n.isBend) {
              ctx.save();
              let bendStepText = 'BEND';
              if (n.bendAmount !== undefined) {
                if (Math.abs(n.bendAmount - 1.0) < 0.15) bendStepText = 'FULL';
                else if (Math.abs(n.bendAmount - 0.5) < 0.15) bendStepText = '½';
                else if (Math.abs(n.bendAmount - 1.5) < 0.15) bendStepText = '1½';
                else if (Math.abs(n.bendAmount - 2.0) < 0.15) bendStepText = '2';
                else if (n.bendAmount > 0) bendStepText = `${n.bendAmount}`;
              }

              // Curved upward trajectory arc
              ctx.beginPath();
              ctx.moveTo(noteX + 2, noteY - 11);
              ctx.quadraticCurveTo(noteX + 8, noteY - 22, noteX + 16, noteY - 20);
              ctx.strokeStyle = '#ffb86c';
              ctx.lineWidth = 2.0;
              ctx.stroke();

              // Arrowhead
              ctx.beginPath();
              ctx.moveTo(noteX + 15, noteY - 24);
              ctx.lineTo(noteX + 20, noteY - 20);
              ctx.lineTo(noteX + 15, noteY - 16);
              ctx.fillStyle = '#ffb86c';
              ctx.fill();

              // Step pill badge
              const bPillW = bendStepText === 'FULL' ? 38 : 34;
              const bPillH = 15;
              const bPillX = noteX - bPillW / 2;
              const bPillY = noteY - 25;

              ctx.fillStyle = '#241a12';
              ctx.strokeStyle = '#ffb86c';
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.roundRect(bPillX, bPillY, bPillW, bPillH, 3);
              ctx.fill();
              ctx.stroke();

              ctx.fillStyle = '#ffb86c';
              ctx.font = '800 8.5px "JetBrains Mono", monospace';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(`⤴ ${bendStepText}`, bPillX + bPillW / 2, bPillY + bPillH / 2);
              ctx.restore();
            }
            // 2. VIBRATO BADGE
            else if (n.isVibrato) {
              ctx.save();
              const vPillW = 28;
              const vPillH = 14;
              const vPillX = noteX - vPillW / 2;
              const vPillY = noteY - 23;

              ctx.fillStyle = '#24121e';
              ctx.strokeStyle = '#ff79c6';
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.roundRect(vPillX, vPillY, vPillW, vPillH, 3);
              ctx.fill();
              ctx.stroke();

              ctx.fillStyle = '#ff79c6';
              ctx.font = '800 8px "JetBrains Mono", monospace';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText('∿ VIB', noteX, vPillY + vPillH / 2);
              ctx.restore();
            }
            // 3. HAMMER-ON / PULL-OFF
            else if (n.isHammerPull) {
              ctx.save();
              const hpLabel = n.hammerPullType === 'pull' ? 'P' : 'H';
              ctx.beginPath();
              ctx.arc(noteX, noteY - 10, 10, Math.PI, 0, false);
              ctx.strokeStyle = '#50fa7b';
              ctx.lineWidth = 1.5;
              ctx.stroke();

              ctx.fillStyle = '#50fa7b';
              ctx.font = '800 8.5px "JetBrains Mono", monospace';
              ctx.textAlign = 'center';
              ctx.fillText(hpLabel, noteX, noteY - 17);
              ctx.restore();
            }
            // 4. NATURAL HARMONIC
            else if (n.isHarmonic) {
              ctx.save();
              ctx.strokeStyle = '#50fa7b';
              ctx.lineWidth = 1.5;
              ctx.save();
              ctx.translate(noteX, noteY);
              ctx.rotate(Math.PI / 4);
              ctx.strokeRect(-13, -13, 26, 26);
              ctx.restore();

              ctx.fillStyle = '#50fa7b';
              ctx.font = '800 8px "JetBrains Mono", monospace';
              ctx.textAlign = 'center';
              ctx.fillText('◆ NH', noteX, noteY - 18);
              ctx.restore();
            }
            // 5. PALM MUTE
            else if (n.isPalmMute) {
              ctx.save();
              ctx.fillStyle = '#8be9fd';
              ctx.font = '800 8px "JetBrains Mono", monospace';
              ctx.textAlign = 'center';
              ctx.fillText('P.M.', noteX, noteY - 16);
              ctx.restore();
            }
          });

          // Draw Rest marker for silent beats
          if (beat.isRest && beat.notes.length === 0) {
            const centerY = topPadding + availableHeight / 2;
            ctx.save();
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = '#3a3232';
            ctx.beginPath();
            ctx.roundRect(noteX - 10, centerY - 10, 20, 20, 3);
            ctx.fill();
            ctx.fillStyle = '#807272';
            ctx.font = '700 10px "JetBrains Mono", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('R', noteX, centerY);
            ctx.restore();
          }
        });
      }

      // 7. A-B Loop markers on highway
      if (loopAMs !== undefined || loopBMs !== undefined) {
        const lookAheadMs = 3000;
        const drawLoopMarker = (markerMs: number, color: string, label: string) => {
          const offset = markerMs - currentTimeMs;
          if (offset >= 0 && offset <= lookAheadMs) {
            const progress = offset / lookAheadMs;
            const markerX = STRIKE_X + progress * highwayWidth;

            ctx.save();
            ctx.beginPath();
            ctx.moveTo(markerX, 36);
            ctx.lineTo(markerX, height - bottomPadding + 10);
            ctx.lineWidth = 2;
            ctx.strokeStyle = color;
            ctx.setLineDash([4, 3]);
            ctx.stroke();
            ctx.setLineDash([]);

            // Label badge
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.roundRect(markerX - 8, height - bottomPadding + 6, 16, 14, 2);
            ctx.fill();
            ctx.fillStyle = '#120e0e';
            ctx.font = '800 9px "JetBrains Mono", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, markerX, height - bottomPadding + 13);
            ctx.restore();
          }
        };

        if (loopAMs !== undefined) drawLoopMarker(loopAMs, '#50fa7b', 'A');
        if (loopBMs !== undefined) drawLoopMarker(loopBMs, '#ff5555', 'B');
      }

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
  }, [timeline, currentTimeMs, activeNotes, tuningNames, isPlaying, loopAMs, loopBMs, isFlipped]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        width: '100%',
        height: '100%',
        backgroundColor: '#120e0e',
        borderBottom: '1px solid #2b2323',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* 1. Left Sub-Panel: SOUNDING NOTES & TECHNIQUE HUD */}
      <div
        style={{
          width: '185px',
          minWidth: '185px',
          backgroundColor: '#161212',
          borderRight: '1px solid #2b2323',
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
                backgroundColor: '#FF7A65',
                display: 'inline-block',
                boxShadow: isPlaying ? '0 0 6px #FF7A65' : 'none',
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
              color: soundingNoteText === 'REST' ? '#5a5050' : '#ffffff',
              letterSpacing: '-1px',
              marginBottom: '6px',
              textShadow: soundingNoteText !== 'REST' ? '0 0 20px rgba(255, 122, 101, 0.4)' : 'none',
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
                backgroundColor: '#201a1a',
                border: '1px solid #2b2323',
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
              />
            </div>
          ) : primaryNote ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  color: '#FF7A65',
                  letterSpacing: '0.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>STR 0{primaryNote.string}</span>
                <span style={{ color: '#574d4d' }}>•</span>
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
                color: '#655757',
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
            backgroundColor: '#201a1a',
            border: '1px solid #362c2c',
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
              color: '#a89d9d',
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
              color: '#FF7A65',
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
