import type { SongTimeline, ExtractedNote } from '../../services/timelineExtractor';
import { getUpcomingHighwayBeats } from '../../services/timelineExtractor';
import { checkNoteInScale, ROOT_NOTES, SCALE_DEFINITIONS } from '../../services/scaleTheory';
import type { CanvasThemeColors } from '../../types/theme';

export interface HighwayRenderParams {
  width: number;
  height: number;
  timeline: SongTimeline | null;
  currentTimeMs: number;
  activeNotes: ExtractedNote[];
  tuningNames: string[];
  loopAMs?: number;
  loopBMs?: number;
  isFlipped: boolean;
  speed: number;
  isScaleMode: boolean;
  scaleRoot: number;
  scaleId: string;
  scaleDisplayMode: 'degrees' | 'notes';
  tuning: number[];
  backingProgressionName?: string;
  canvasTheme?: CanvasThemeColors;
}

/** Compute vertical string coordinate */
export function getHighwayStringY(
  stringNum: number,
  numStrings: number,
  topPadding: number,
  stringSpacing: number,
  isFlipped: boolean,
): number {
  const index = stringNum - 1;
  const visualIndex = isFlipped ? numStrings - 1 - index : index;
  return topPadding + visualIndex * stringSpacing;
}

export function drawHighwayBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  theme?: CanvasThemeColors,
): void {
  ctx.fillStyle = theme?.background || '#120e0e';
  ctx.fillRect(0, 0, width, height);
}

export function drawHighwayRuler(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  strikeX: number,
  highwayWidth: number,
  bottomPadding: number,
  timeline: SongTimeline | null,
  currentTimeMs: number,
  speed: number,
  theme?: CanvasThemeColors,
): { barIndex: number; startMs: number; barX: number }[] {
  // Horizontal baseline for ruler
  ctx.beginPath();
  ctx.moveTo(0, 36);
  ctx.lineTo(width, 36);
  ctx.strokeStyle = theme?.fretboardBevel || '#221a1a';
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
            barX: strikeX + progress * highwayWidth,
          });
        }
      }
    }
  }

  // Time ticks calibrated to playback speed
  const timeTicks = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0];
  timeTicks.forEach((t) => {
    const tickX = strikeX + (t / 3.0) * highwayWidth;
    if (tickX < width - 10) {
      ctx.beginPath();
      ctx.moveTo(tickX, 30);
      ctx.lineTo(tickX, 36);
      ctx.strokeStyle = theme?.fretWire || '#382c2c';
      ctx.lineWidth = 1;
      ctx.stroke();

      const isNearBar = barStarts.some((b) => Math.abs(b.barX - tickX) < 24);
      if (!isNearBar) {
        ctx.fillStyle = theme?.markerText || '#655656';
        ctx.font = '700 8px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const realSeconds = speed > 0 ? t / speed : t;
        const label = speed === 1.0 ? `+${t.toFixed(1)}s` : `+${realSeconds.toFixed(1)}s`;
        ctx.fillText(label, tickX, 20);
      }
    }
  });

  // Draw Measure / Bar Dividers along the highway
  barStarts.forEach(({ barIndex, barX }) => {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(barX, 36);
    ctx.lineTo(barX, height - bottomPadding + 8);
    ctx.strokeStyle = theme?.measureBar || '#261e1e';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Sleek Bar badge in ruler strip
    ctx.fillStyle = theme?.stringLabelBg || '#1c1616';
    ctx.strokeStyle = theme?.fretWire || '#382c2c';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(barX + 2, 12, 26, 15, 3);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = theme?.textSecondary || '#8e7f7f';
    ctx.font = '800 8px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`M${barIndex}`, barX + 15, 20);
    ctx.restore();
  });

  return barStarts;
}

export function drawHighwayStrings(
  ctx: CanvasRenderingContext2D,
  width: number,
  strikeX: number,
  numStrings: number,
  tuningNames: string[],
  activeNotes: ExtractedNote[],
  getStringY: (s: number) => number,
  theme?: CanvasThemeColors,
): void {
  const stringGauges = [1.0, 1.2, 1.5, 1.9, 2.3, 2.8];

  for (let i = 0; i < numStrings; i++) {
    const stringNum = i + 1;
    const y = getStringY(stringNum);
    const pitchName = tuningNames[i] || `S${stringNum}`;
    const isCurrentActiveString = activeNotes.some((n) => n.string === stringNum);
    const baseGauge = stringGauges[i] || 1.2;

    // Draw String Line across the highway
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(strikeX - 10, y);
    ctx.lineTo(width, y);
    ctx.lineWidth = isCurrentActiveString ? baseGauge + 1.2 : baseGauge;
    ctx.strokeStyle = isCurrentActiveString
      ? theme?.nowIndicator || '#FF7A65'
      : i >= 3
      ? theme?.stringInactive || '#382c2c'
      : theme?.fretWire || '#2c2222';

    if (isCurrentActiveString) {
      ctx.shadowColor = theme?.nowGlow || '#FF7A65';
      ctx.shadowBlur = 8;
    }
    ctx.stroke();
    ctx.restore();

    // Draw String Pill Badge (left of strike line)
    const pillW = 38;
    const pillH = 18;
    const pillX = strikeX - 48;
    const pillY = y - pillH / 2;

    ctx.save();
    if (isCurrentActiveString) {
      ctx.fillStyle = theme?.nowIndicator || '#FF7A65';
      ctx.shadowColor = theme?.nowGlow || '#FF7A65';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillW, pillH, 3);
      ctx.fill();

      ctx.fillStyle = theme?.background === '#f6f1e5' ? '#ffffff' : '#120e0e';
      ctx.font = '800 9px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${stringNum} ${pitchName}`, pillX + pillW / 2, y);
    } else {
      ctx.fillStyle = theme?.stringLabelBg || '#1a1313';
      ctx.strokeStyle = theme?.fretboardBevel || '#2d2222';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillW, pillH, 3);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = theme?.stringLabelText || '#837474';
      ctx.font = '700 8.5px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${stringNum} ${pitchName}`, pillX + pillW / 2, y);
    }
    ctx.restore();
  }
}

export function drawHighwayStrikeLine(
  ctx: CanvasRenderingContext2D,
  height: number,
  strikeX: number,
  bottomPadding: number,
  currentTimeMs: number,
  activeNotes: ExtractedNote[],
  loopAMs?: number,
  theme?: CanvasThemeColors,
): void {
  const strikeBadgeW = 46;
  const strikeBadgeH = 16;
  const strikeBadgeX = strikeX - strikeBadgeW / 2;
  const strikeBadgeY = 8;

  const isLoopAAtStrike = loopAMs !== undefined && Math.abs(loopAMs - currentTimeMs) < 60;
  const strikeText = isLoopAAtStrike ? 'LOOP A' : 'STRIKE';
  const strikeColor = isLoopAAtStrike ? '#50fa7b' : theme?.nowIndicator || '#FF7A65';

  ctx.save();
  ctx.fillStyle = theme?.stringLabelBg || '#221918';
  ctx.strokeStyle = strikeColor;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(strikeBadgeX, strikeBadgeY, strikeBadgeW, strikeBadgeH, 3);
  ctx.fill();
  ctx.stroke();

  // Neon indicator dot
  ctx.fillStyle = strikeColor;
  ctx.beginPath();
  ctx.arc(strikeBadgeX + 7, strikeBadgeY + strikeBadgeH / 2, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Strike text
  ctx.fillStyle = strikeColor;
  ctx.font = '800 8.5px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(strikeText, strikeBadgeX + 25, strikeBadgeY + strikeBadgeH / 2);

  // Downward pointer arrow
  ctx.beginPath();
  ctx.moveTo(strikeX - 4, strikeBadgeY + strikeBadgeH);
  ctx.lineTo(strikeX + 4, strikeBadgeY + strikeBadgeH);
  ctx.lineTo(strikeX, strikeBadgeY + strikeBadgeH + 4);
  ctx.closePath();
  ctx.fillStyle = strikeColor;
  ctx.fill();
  ctx.restore();

  // Laser Strike Line
  const hasActiveHit = activeNotes.length > 0;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(strikeX, 29);
  ctx.lineTo(strikeX, height - bottomPadding + 8);
  ctx.lineWidth = hasActiveHit ? 2.5 : 2.0;
  ctx.strokeStyle = theme?.nowIndicator || '#FF7A65';
  if (hasActiveHit) {
    ctx.shadowColor = theme?.nowGlow || '#FF7A65';
    ctx.shadowBlur = 10;
  }
  ctx.stroke();
  ctx.restore();
}

export function drawHighwayStaticScale(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  strikeX: number,
  bottomPadding: number,
  numStrings: number,
  activeNotes: ExtractedNote[],
  scaleRoot: number,
  scaleId: string,
  scaleDisplayMode: 'degrees' | 'notes',
  tuning: number[],
  backingProgressionName: string | undefined,
  getStringY: (s: number) => number,
  theme?: CanvasThemeColors,
): void {
  const startHighwayX = strikeX + 20;
  const availableW = Math.max(100, width - startHighwayX - 30);
  const TOTAL_FRETS = 24;
  const fretColW = availableW / (TOTAL_FRETS + 1);

  // Top Fret Column Numbers on Highway Ruler
  for (let f = 0; f <= TOTAL_FRETS; f++) {
    const posX = startHighwayX + f * fretColW + fretColW / 2;
    const isMarkerFret = [0, 3, 5, 7, 9, 12, 15, 17, 19, 21, 24].includes(f);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(posX, 36);
    ctx.lineTo(posX, height - bottomPadding + 6);
    ctx.lineWidth = 1;
    ctx.strokeStyle = isMarkerFret
      ? theme?.measureBar || 'rgba(70, 56, 56, 0.4)'
      : theme?.gridLine || 'rgba(38, 30, 30, 0.25)';
    if (!isMarkerFret) ctx.setLineDash([2, 4]);
    ctx.stroke();

    if (isMarkerFret) {
      ctx.fillStyle = theme?.stringLabelBg || '#1c1616';
      ctx.strokeStyle = theme?.fretWire || '#382c2c';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(posX - 13, 13, 26, 15, 3);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle =
        f === 0 ? theme?.nowIndicator || '#FF7A65' : theme?.textSecondary || '#a89d9d';
      ctx.font = '800 8.5px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(f === 0 ? 'NUT' : f < 10 ? `0${f}` : `${f}`, posX, 20.5);
    }
    ctx.restore();
  }

  // Static Scale Nodes along each string
  for (let s = 1; s <= numStrings; s++) {
    const noteY = getStringY(s);
    const baseStringPitch = tuning[s - 1] ?? [64, 59, 55, 50, 45, 40][s - 1];

    for (let f = 0; f <= TOTAL_FRETS; f++) {
      const posX = startHighwayX + f * fretColW + fretColW / 2;
      const midi = baseStringPitch + f;
      const match = checkNoteInScale(midi, scaleRoot, scaleId);
      if (!match) continue;

      const isActivelyPlayed = activeNotes.some((an) => an.string === s && an.fret === f);
      const badgeW = match.isRoot ? 26 : 22;
      const badgeH = 20;
      const badgeX = posX - badgeW / 2;
      const badgeY = noteY - badgeH / 2;

      ctx.save();
      if (isActivelyPlayed) {
        ctx.fillStyle = theme?.nowIndicator || '#FF7A65';
        ctx.shadowColor = theme?.nowGlow || '#FF7A65';
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.roundRect(badgeX - 2, badgeY - 2, badgeW + 4, badgeH + 4, 5);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = theme?.background === '#f6f1e5' ? '#ffffff' : '#120e0e';
        ctx.font = '900 11px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(scaleDisplayMode === 'notes' ? match.noteName : match.degree, posX, noteY);
      } else if (match.isRoot) {
        ctx.fillStyle = theme?.nowIndicator || 'rgba(255, 122, 101, 0.9)';
        ctx.shadowColor = theme?.nowGlow || '#FF7A65';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 4);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = theme?.background === '#f6f1e5' ? '#ffffff' : '#120e0e';
        ctx.font = '900 10.5px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(scaleDisplayMode === 'notes' ? match.noteName : 'R', posX, noteY);
      } else if (match.isBlueNote) {
        ctx.fillStyle = 'rgba(255, 121, 198, 0.9)';
        ctx.shadowColor = '#ff79c6';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 4);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.fillStyle = '#120e0e';
        ctx.font = '900 10px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(scaleDisplayMode === 'notes' ? match.noteName : '♭5', posX, noteY);
      } else {
        ctx.fillStyle = 'rgba(32, 24, 24, 0.88)';
        ctx.strokeStyle = 'rgba(255, 184, 108, 0.7)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffb86c';
        ctx.font = '700 9.5px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(scaleDisplayMode === 'notes' ? match.noteName : match.degree, posX, noteY);
      }
      ctx.restore();
    }
  }

  // Center Highway HUD Banner
  const currentScaleDef =
    SCALE_DEFINITIONS.find((sd) => sd.id === scaleId) || SCALE_DEFINITIONS[0];
  const currentRootObj =
    ROOT_NOTES.find((rn) => rn.pitchClass === scaleRoot) || ROOT_NOTES[9];

  ctx.save();
  const bannerText = backingProgressionName
    ? `SCALE LAB · ${currentRootObj.name.toUpperCase()} ${currentScaleDef.name.toUpperCase()} · JAM: ${backingProgressionName.toUpperCase()}`
    : `SCALE LAB · ${currentRootObj.name.toUpperCase()} ${currentScaleDef.name.toUpperCase()} (STATIC ROADMAP)`;
  ctx.font = '800 10px "JetBrains Mono", monospace';
  const textW = ctx.measureText(bannerText).width;
  const bannerW = Math.min(Math.max(380, textW + 28), availableW - 20);
  const bannerH = 26;
  const bannerX = startHighwayX + (availableW - bannerW) / 2;
  const bannerY = 8;

  ctx.fillStyle = theme?.stringLabelBg || 'rgba(22, 17, 17, 0.88)';
  ctx.strokeStyle = theme?.fretboardBevel || '#3d3030';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(bannerX, bannerY, bannerW, bannerH, 4);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = theme?.nowIndicator || '#FF7A65';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(bannerText, bannerX + bannerW / 2, bannerY + bannerH / 2);
  ctx.restore();
}

export function drawHighwayScrollingNotes(
  ctx: CanvasRenderingContext2D,
  strikeX: number,
  highwayWidth: number,
  topPadding: number,
  availableHeight: number,
  timeline: SongTimeline,
  currentTimeMs: number,
  getStringY: (s: number) => number,
  theme?: CanvasThemeColors,
): void {
  const upcoming = getUpcomingHighwayBeats(timeline, currentTimeMs, 3000);

  upcoming.forEach(({ beat, progress, timeOffsetMs }) => {
    const noteX = strikeX + progress * highwayWidth;
    const isAtStrikeLine = timeOffsetMs >= -50 && timeOffsetMs <= 90;

    beat.notes.forEach((n) => {
      const noteY = getStringY(n.string);
      const badgeW = n.fret >= 10 ? 28 : 24;
      const badgeH = 22;
      const badgeX = noteX - badgeW / 2;
      const badgeY = noteY - badgeH / 2;

      // Duration Tail
      const durationPx = (beat.durationMs / 3000) * highwayWidth;
      const tailStartX = noteX + badgeW / 2;
      const tailLength = Math.max(0, durationPx - badgeW / 2);

      if (tailLength > 4) {
        ctx.save();
        if (n.isVibrato) {
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
          const grad = ctx.createLinearGradient(tailStartX, noteY, tailStartX + tailLength, noteY);
          if (isAtStrikeLine || progress < 0.2) {
            grad.addColorStop(0, theme?.nowGlow || 'rgba(255, 122, 101, 0.6)');
            grad.addColorStop(1, 'rgba(0, 0, 0, 0.05)');
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

      // Slide Beam & Target Ghost Badge
      if (n.isSlide && n.slideToFret !== undefined) {
        ctx.save();
        const slideDist = 46;
        const targetX = noteX + slideDist;

        ctx.beginPath();
        ctx.moveTo(noteX + badgeW / 2 + 2, noteY);
        ctx.lineTo(targetX - 12, noteY);
        ctx.strokeStyle = '#8be9fd';
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 2]);
        ctx.stroke();
        ctx.setLineDash([]);

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

        ctx.font = '700 7.5px "JetBrains Mono", monospace';
        ctx.fillStyle = '#8be9fd';
        ctx.fillText('SLIDE →', noteX + slideDist / 2, noteY - 10);
        ctx.restore();
      }

      // Note Badge (Body)
      ctx.save();
      if (isAtStrikeLine) {
        ctx.fillStyle = theme?.nowIndicator || '#FF7A65';
        ctx.shadowColor = theme?.nowGlow || '#FF7A65';
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.roundRect(badgeX - 2, badgeY - 2, badgeW + 4, badgeH + 4, 5);
        ctx.fill();

        ctx.strokeStyle = theme?.nowGlow || 'rgba(255, 122, 101, 0.45)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(badgeX - 5, badgeY - 5, badgeW + 10, badgeH + 10, 6);
        ctx.stroke();

        ctx.fillStyle = theme?.background === '#f6f1e5' ? '#ffffff' : '#120e0e';
        ctx.font = '900 12px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${n.fret}`, noteX, noteY);
      } else {
        ctx.fillStyle = theme?.stringLabelBg || '#1a1313';
        ctx.strokeStyle =
          progress < 0.25 ? theme?.nowIndicator || '#FF7A65' : theme?.fretWire || '#574d4d';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle =
          progress < 0.25 ? theme?.nowIndicator || '#FF7A65' : theme?.textPrimary || '#f5e8e8';
        ctx.font = '700 11px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${n.fret}`, noteX, noteY);
      }
      ctx.restore();

      // Technique Visuals
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

        ctx.beginPath();
        ctx.moveTo(noteX + 2, noteY - 11);
        ctx.quadraticCurveTo(noteX + 8, noteY - 22, noteX + 16, noteY - 20);
        ctx.strokeStyle = '#ffb86c';
        ctx.lineWidth = 2.0;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(noteX + 15, noteY - 24);
        ctx.lineTo(noteX + 20, noteY - 20);
        ctx.lineTo(noteX + 15, noteY - 16);
        ctx.fillStyle = '#ffb86c';
        ctx.fill();

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
      } else if (n.isVibrato) {
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
      } else if (n.isHammerPull) {
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
      } else if (n.isHarmonic) {
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
      } else if (n.isPalmMute) {
        ctx.save();
        ctx.fillStyle = '#8be9fd';
        ctx.font = '800 8px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('P.M.', noteX, noteY - 16);
        ctx.restore();
      }
    });

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

export function drawHighwayLoopMarkers(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  strikeX: number,
  highwayWidth: number,
  bottomPadding: number,
  currentTimeMs: number,
  loopAMs?: number,
  loopBMs?: number,
  theme?: CanvasThemeColors,
): void {
  if (loopAMs === undefined && loopBMs === undefined) return;

  const lookAheadMs = 3000;
  const xA =
    loopAMs !== undefined
      ? strikeX + ((loopAMs - currentTimeMs) / lookAheadMs) * highwayWidth
      : null;
  const xB =
    loopBMs !== undefined
      ? strikeX + ((loopBMs - currentTimeMs) / lookAheadMs) * highwayWidth
      : null;
  const isInLoop =
    loopAMs !== undefined &&
    loopBMs !== undefined &&
    currentTimeMs >= loopAMs &&
    currentTimeMs <= loopBMs;

  // Shaded Active Loop Zone between A and B
  if (loopAMs !== undefined && loopBMs !== undefined && loopBMs > loopAMs) {
    const leftX = Math.max(strikeX, Math.min(width, xA !== null ? xA : strikeX));
    const rightX = Math.max(strikeX, Math.min(width, xB !== null ? xB : width));

    if (rightX > leftX) {
      ctx.save();
      const loopGrad = ctx.createLinearGradient(leftX, 0, rightX, 0);
      loopGrad.addColorStop(0, 'rgba(80, 250, 123, 0.12)');
      loopGrad.addColorStop(1, theme?.nowGlow || 'rgba(255, 122, 101, 0.12)');
      ctx.fillStyle = loopGrad;
      ctx.fillRect(leftX, 36, rightX - leftX, height - bottomPadding - 28);

      ctx.strokeStyle = 'rgba(80, 250, 123, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 3]);
      ctx.beginPath();
      ctx.moveTo(leftX, 36);
      ctx.lineTo(rightX, 36);
      ctx.moveTo(leftX, height - bottomPadding + 8);
      ctx.lineTo(rightX, height - bottomPadding + 8);
      ctx.stroke();
      ctx.setLineDash([]);

      const ribbonW = rightX - leftX;
      if (ribbonW > 60) {
        ctx.fillStyle = 'rgba(255, 184, 108, 0.15)';
        ctx.strokeStyle = 'rgba(255, 184, 108, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(leftX + 2, 11, ribbonW - 4, 16, 3);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffb86c';
        ctx.font = '800 8.5px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('LOOP REGION', leftX + ribbonW / 2, 19);
      }
      ctx.restore();
    }
  }

  // Marker A
  if (loopAMs !== undefined && xA !== null && xA >= strikeX - 10 && xA <= width + 20) {
    ctx.save();
    const isAtStrike = Math.abs(xA - strikeX) < 22;

    ctx.beginPath();
    ctx.moveTo(xA, isAtStrike ? 30 : 26);
    ctx.lineTo(xA, height - bottomPadding + 8);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#50fa7b';
    ctx.shadowColor = '#50fa7b';
    ctx.shadowBlur = 12;
    ctx.stroke();

    if (!isAtStrike) {
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#50fa7b';
      ctx.beginPath();
      ctx.roundRect(xA - 14, 8, 28, 17, 3);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(xA - 4, 25);
      ctx.lineTo(xA + 4, 25);
      ctx.lineTo(xA, 29);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#120e0e';
      ctx.font = '900 9px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('A [', xA, 16.5);
    }

    const secA = (loopAMs / 1000).toFixed(1);
    ctx.fillStyle = '#181313';
    ctx.strokeStyle = '#50fa7b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(xA - 18, height - bottomPadding + 8, 36, 14, 3);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#50fa7b';
    ctx.font = '800 8px "JetBrains Mono", monospace';
    ctx.fillText(`${secA}s`, xA, height - bottomPadding + 15);
    ctx.restore();
  }

  // Marker B
  if (loopBMs !== undefined && xB !== null && xB >= strikeX - 10 && xB <= width + 20) {
    ctx.save();
    const isAtStrike = Math.abs(xB - strikeX) < 22;

    ctx.beginPath();
    ctx.moveTo(xB, isAtStrike ? 30 : 26);
    ctx.lineTo(xB, height - bottomPadding + 8);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = theme?.nowIndicator || '#FF7A65';
    ctx.shadowColor = theme?.nowGlow || '#FF7A65';
    ctx.shadowBlur = 12;
    ctx.stroke();

    if (!isAtStrike) {
      ctx.shadowBlur = 0;
      ctx.fillStyle = theme?.nowIndicator || '#FF7A65';
      ctx.beginPath();
      ctx.roundRect(xB - 14, 8, 28, 17, 3);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(xB - 4, 25);
      ctx.lineTo(xB + 4, 25);
      ctx.lineTo(xB, 29);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = theme?.background === '#f6f1e5' ? '#ffffff' : '#120e0e';
      ctx.font = '900 9px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('] B', xB, 16.5);
    }

    const secB = (loopBMs / 1000).toFixed(1);
    ctx.fillStyle = theme?.stringLabelBg || '#181313';
    ctx.strokeStyle = theme?.nowIndicator || '#FF7A65';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(xB - 18, height - bottomPadding + 8, 36, 14, 3);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = theme?.nowIndicator || '#FF7A65';
    ctx.font = '800 8px "JetBrains Mono", monospace';
    ctx.fillText(`${secB}s`, xB, height - bottomPadding + 15);
    ctx.restore();
  }

  // In-Loop Active Indicator
  if (isInLoop) {
    ctx.save();
    ctx.fillStyle = 'rgba(80, 250, 123, 0.18)';
    ctx.strokeStyle = '#50fa7b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(strikeX - 22, height - bottomPadding - 18, 44, 15, 3);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#50fa7b';
    ctx.font = '800 8px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('IN LOOP', strikeX, height - bottomPadding - 10.5);
    ctx.restore();
  }
}

/** Master highway draw orchestrator */
export function drawHighwayCanvas(ctx: CanvasRenderingContext2D, p: HighwayRenderParams): void {
  const STRIKE_X = 88;
  const highwayWidth = p.width - STRIKE_X - 24;
  const numStrings = p.tuningNames.length > 0 ? p.tuningNames.length : 6;
  const topPadding = 52;
  const bottomPadding = 26;
  const availableHeight = p.height - topPadding - bottomPadding;
  const stringSpacing = availableHeight / (numStrings - 1 || 1);

  const getStringY = (stringNum: number) =>
    getHighwayStringY(stringNum, numStrings, topPadding, stringSpacing, p.isFlipped);

  // 1. Dark Studio Background
  drawHighwayBackground(ctx, p.width, p.height, p.canvasTheme);

  // 2. Horizon Ruler Strip & Bar Markers
  drawHighwayRuler(
    ctx,
    p.width,
    p.height,
    STRIKE_X,
    highwayWidth,
    bottomPadding,
    p.timeline,
    p.currentTimeMs,
    p.speed,
    p.canvasTheme,
  );

  // 3. String Lines & Pill Badges
  drawHighwayStrings(
    ctx,
    p.width,
    STRIKE_X,
    numStrings,
    p.tuningNames,
    p.activeNotes,
    getStringY,
    p.canvasTheme,
  );

  // 4. Vertical Strike Line & Header Marker
  drawHighwayStrikeLine(
    ctx,
    p.height,
    STRIKE_X,
    bottomPadding,
    p.currentTimeMs,
    p.activeNotes,
    p.loopAMs,
    p.canvasTheme,
  );

  // 5. Scale Roadmap (Static) OR Upcoming Scrolling Notes (Normal)
  if (p.isScaleMode) {
    drawHighwayStaticScale(
      ctx,
      p.width,
      p.height,
      STRIKE_X,
      bottomPadding,
      numStrings,
      p.activeNotes,
      p.scaleRoot,
      p.scaleId,
      p.scaleDisplayMode,
      p.tuning,
      p.backingProgressionName,
      getStringY,
      p.canvasTheme,
    );
  } else if (p.timeline && p.timeline.beats.length > 0) {
    drawHighwayScrollingNotes(
      ctx,
      STRIKE_X,
      highwayWidth,
      topPadding,
      availableHeight,
      p.timeline,
      p.currentTimeMs,
      getStringY,
      p.canvasTheme,
    );
  }

  // 6. A-B Loop markers and shaded active zone
  drawHighwayLoopMarkers(
    ctx,
    p.width,
    p.height,
    STRIKE_X,
    highwayWidth,
    bottomPadding,
    p.currentTimeMs,
    p.loopAMs,
    p.loopBMs,
    p.canvasTheme,
  );
}
