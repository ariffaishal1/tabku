import type { ExtractedNote } from '../../services/timelineExtractor';
import {
  checkNoteInScale,
  type ScaleDisplayMode,
  type ScalePositionInfo,
} from '../../services/scaleTheory';
import type { CanvasThemeColors } from '../../types/theme';

export const INLAY_SINGLE_FRETS = [3, 5, 7, 9, 15, 17, 19, 21];
export const INLAY_DOUBLE_FRETS = [12, 24];

export const ROMAN_NUMERALS = [
  '', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
  'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX',
  'XXI', 'XXII', 'XXIII', 'XXIV'
];

export interface FretboardRenderParams {
  width: number;
  height: number;
  activeNotes: ExtractedNote[];
  nextNotes: ExtractedNote[];
  tuningNames: string[];
  tuning: number[];
  isFlipped: boolean;
  isPlaying: boolean;
  isScaleMode: boolean;
  scaleRoot: number;
  scaleId: string;
  scaleDisplayMode: ScaleDisplayMode;
  scalePosition: number | 'all';
  positionInfo: ScalePositionInfo;
  canvasTheme?: CanvasThemeColors;
}

/** Compute vertical string coordinate for fretboard */
export function getFretboardStringY(
  stringNum: number,
  numStrings: number,
  topMargin: number,
  stringSpacing: number,
  isFlipped: boolean,
): number {
  const index = stringNum - 1;
  const visualIndex = isFlipped ? numStrings - 1 - index : index;
  return topMargin + visualIndex * stringSpacing;
}

export function drawFretboardWoodAndInlays(
  ctx: CanvasRenderingContext2D,
  leftMargin: number,
  topMargin: number,
  fretboardWidth: number,
  fretboardHeight: number,
  fretWidth: number,
  totalFrets: number,
  isFullHeight: boolean,
  theme?: CanvasThemeColors,
): void {
  // Wood / Background Surface
  ctx.fillStyle = theme?.fretboardWood || '#181414';
  ctx.fillRect(leftMargin, topMargin - 4, fretboardWidth, fretboardHeight + 8);

  // Inlay Dots
  const midY = topMargin + fretboardHeight / 2;
  ctx.fillStyle = theme?.markerDot || '#3a3131';

  for (let f = 1; f <= totalFrets; f++) {
    const fretCenterX = leftMargin + f * fretWidth + fretWidth / 2;

    if (INLAY_SINGLE_FRETS.includes(f)) {
      ctx.beginPath();
      ctx.arc(fretCenterX, midY, isFullHeight ? 6 : 4.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (INLAY_DOUBLE_FRETS.includes(f)) {
      const doubleOffset = isFullHeight ? 26 : 18;
      ctx.beginPath();
      ctx.arc(fretCenterX, midY - doubleOffset, isFullHeight ? 5 : 4, 0, Math.PI * 2);
      ctx.arc(fretCenterX, midY + doubleOffset, isFullHeight ? 5 : 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export function drawFretboardWiresAndStrings(
  ctx: CanvasRenderingContext2D,
  leftMargin: number,
  topMargin: number,
  fretboardHeight: number,
  fretWidth: number,
  endFretX: number,
  totalFrets: number,
  numStrings: number,
  tuningNames: string[],
  activeNotes: ExtractedNote[],
  getStringY: (s: number) => number,
  theme?: CanvasThemeColors,
): void {
  // Fret Wires & Fret Numbers
  for (let f = 0; f <= totalFrets; f++) {
    const fretX = leftMargin + f * fretWidth;
    const fretCenterX = fretX + fretWidth / 2;

    ctx.beginPath();
    ctx.moveTo(fretX, topMargin - 4);
    ctx.lineTo(fretX, topMargin + fretboardHeight + 4);

    if (f === 1) {
      // The Nut
      ctx.lineWidth = 4;
      ctx.strokeStyle = theme?.fretWireZero || '#c5b8b8';
    } else {
      ctx.lineWidth = 1.0;
      ctx.strokeStyle = theme?.fretWire || '#322b2b';
    }
    ctx.stroke();

    const formattedFret = f < 10 ? `0${f}` : `${f}`;
    const isSpecialFret = [0, 3, 5, 7, 9, 12, 15, 17, 19, 21, 24].includes(f);

    ctx.font = isSpecialFret
      ? '700 9.5px "JetBrains Mono", monospace'
      : '500 8.5px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = isSpecialFret
      ? theme?.textSecondary || '#a89d9d'
      : theme?.markerText || '#524949';
    ctx.fillText(formattedFret, fretCenterX, topMargin + fretboardHeight + 8);
  }

  // End fretboard border (fret 24 right border)
  ctx.beginPath();
  ctx.moveTo(endFretX, topMargin - 4);
  ctx.lineTo(endFretX, topMargin + fretboardHeight + 4);
  ctx.lineWidth = 2;
  ctx.strokeStyle = theme?.fretWire || '#443a3a';
  ctx.stroke();

  // Strings (1 to numStrings)
  for (let i = 0; i < numStrings; i++) {
    const stringNum = i + 1;
    const y = getStringY(stringNum);
    const pitchName = tuningNames[i] || `S${stringNum}`;
    const isCurrentActive = activeNotes.some((n) => n.string === stringNum);

    // String Pitch Label at left
    ctx.font = '700 11px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = isCurrentActive
      ? theme?.nowIndicator || '#FF7A65'
      : theme?.stringLabelText || '#685e5e';
    ctx.fillText(pitchName, leftMargin - 12, y);

    // String line thickness
    const stringThickness = 0.9 + (stringNum - 1) * 0.45;
    ctx.beginPath();
    ctx.moveTo(leftMargin, y);
    ctx.lineTo(endFretX, y);
    ctx.lineWidth = isCurrentActive ? stringThickness + 1.2 : stringThickness;
    ctx.strokeStyle = isCurrentActive
      ? theme?.nowIndicator
        ? `${theme.nowIndicator}cc`
        : '#ff7a65aa'
      : theme?.stringInactive || '#5e5252';
    ctx.stroke();
  }
}

export function drawFretboardPositionBox(
  ctx: CanvasRenderingContext2D,
  leftMargin: number,
  topMargin: number,
  fretboardHeight: number,
  fretWidth: number,
  scalePosition: number,
  positionInfo: ScalePositionInfo,
  theme?: CanvasThemeColors,
): void {
  positionInfo.ranges.forEach((r) => {
    const boxX1 = leftMargin + r.minFret * fretWidth;
    const boxX2 = leftMargin + (r.maxFret + 1) * fretWidth;
    const boxW = boxX2 - boxX1;
    const boxY = topMargin - 4;
    const boxH = fretboardHeight + 8;

    ctx.save();
    ctx.strokeStyle = theme?.nowIndicator || '#FF7A65';
    ctx.lineWidth = 2;
    ctx.shadowColor = theme?.nowGlow || '#FF7A65';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.roundRect(boxX1, boxY, boxW, boxH, 6);
    ctx.stroke();

    const minFStr = r.minFret < 10 ? `0${r.minFret}` : `${r.minFret}`;
    const maxFStr = r.maxFret < 10 ? `0${r.maxFret}` : `${r.maxFret}`;
    const badgeText = `BOX ${scalePosition} · FRET ${minFStr}–${maxFStr}`;
    ctx.font = '800 8.5px "JetBrains Mono", monospace';
    const bW = ctx.measureText(badgeText).width + 12;
    const bH = 15;
    const bX = boxX1 + (boxW - bW) / 2;
    const bY = Math.max(3, boxY - bH - 3);

    ctx.fillStyle = theme?.fretboardBevel || '#1e1414';
    ctx.beginPath();
    ctx.roundRect(bX, bY, bW, bH, 3);
    ctx.fill();
    ctx.strokeStyle = theme?.nowIndicator || '#FF7A65';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = theme?.nowIndicator || '#FF7A65';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(badgeText, boxX1 + boxW / 2, bY + bH / 2);
    ctx.restore();
  });
}

export function drawFretboardScaleOverlay(
  ctx: CanvasRenderingContext2D,
  leftMargin: number,
  fretWidth: number,
  totalFrets: number,
  numStrings: number,
  tuning: number[],
  activeNotes: ExtractedNote[],
  scaleRoot: number,
  scaleId: string,
  scaleDisplayMode: ScaleDisplayMode,
  scalePosition: number | 'all',
  positionInfo: ScalePositionInfo,
  isFullHeight: boolean,
  getStringY: (s: number) => number,
  theme?: CanvasThemeColors,
): void {
  const rootR = isFullHeight ? 11 : 8.5;
  const blueR = isFullHeight ? 10 : 8;
  const toneR = isFullHeight ? 9.5 : 7.5;
  const rootFont = isFullHeight
    ? '900 10.5px "JetBrains Mono", monospace'
    : '900 8.5px "JetBrains Mono", monospace';
  const blueFont = isFullHeight
    ? '900 9.5px "JetBrains Mono", monospace'
    : '900 8px "JetBrains Mono", monospace';
  const toneFont = isFullHeight
    ? '700 9px "JetBrains Mono", monospace'
    : '700 7.5px "JetBrains Mono", monospace';

  for (let s = 1; s <= numStrings; s++) {
    const y = getStringY(s);
    const basePitch = (tuning && tuning[s - 1]) ?? [64, 59, 55, 50, 45, 40][s - 1] ?? (64 - (s - 1) * 5);

    for (let f = 0; f <= totalFrets; f++) {
      const midiPitch = basePitch + f;
      const match = checkNoteInScale(midiPitch, scaleRoot, scaleId);
      if (!match) continue;

      const isSoundingNow = activeNotes.some((an) => an.string === s && an.fret === f);
      if (isSoundingNow) continue;

      const isInActiveBox =
        scalePosition === 'all' ||
        positionInfo.ranges.some((r) => f >= r.minFret && f <= r.maxFret);

      const fretCenterX = leftMargin + f * fretWidth + fretWidth / 2;

      ctx.save();
      if (!isInActiveBox) {
        ctx.globalAlpha = 0.16;
      }

      if (match.isRoot) {
        if (isInActiveBox) {
          ctx.shadowColor = theme?.nowGlow || '#FF7A65';
          ctx.shadowBlur = isFullHeight ? 14 : 10;
        }
        ctx.fillStyle = theme?.nowIndicator || '#FF7A65';
        ctx.beginPath();
        ctx.arc(fretCenterX, y, rootR, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = theme?.background === '#f6f1e5' ? '#ffffff' : '#120e0e';
        ctx.font = rootFont;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const label = scaleDisplayMode === 'degrees' ? match.degree : match.noteName;
        ctx.fillText(label, fretCenterX, y);
      } else if (match.isBlueNote) {
        if (isInActiveBox) {
          ctx.shadowColor = '#ff79c6';
          ctx.shadowBlur = isFullHeight ? 12 : 8;
        }
        ctx.fillStyle = '#ff79c6';
        ctx.beginPath();
        ctx.arc(fretCenterX, y, blueR, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#120e0e';
        ctx.font = blueFont;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const label = scaleDisplayMode === 'degrees' ? match.degree : match.noteName;
        ctx.fillText(label, fretCenterX, y);
      } else {
        ctx.fillStyle = isInActiveBox ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.05)';
        ctx.strokeStyle = isInActiveBox ? 'rgba(255, 255, 255, 0.32)' : 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(fretCenterX, y, toneR, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isInActiveBox ? '#d0c4c4' : '#706464';
        ctx.font = toneFont;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const label = scaleDisplayMode === 'degrees' ? match.degree : match.noteName;
        ctx.fillText(label, fretCenterX, y);
      }
      ctx.restore();
    }
  }
}

export function drawFretboardNextNotes(
  ctx: CanvasRenderingContext2D,
  leftMargin: number,
  fretWidth: number,
  nextNotes: ExtractedNote[],
  activeNotes: ExtractedNote[],
  getStringY: (s: number) => number,
  theme?: CanvasThemeColors,
): void {
  nextNotes.forEach((n) => {
    const isAlreadyNow = activeNotes.some((an) => an.string === n.string && an.fret === n.fret);
    if (isAlreadyNow) return;

    const noteY = getStringY(n.string);
    const fretCenterX = leftMargin + n.fret * fretWidth + fretWidth / 2;
    const markerSize = Math.min(fretWidth * 0.72, 22);
    const half = markerSize / 2;

    ctx.save();
    ctx.strokeStyle = theme?.nowIndicator || '#FF7A65';
    ctx.lineWidth = 2;

    const cornerLen = 5;
    // Top-Left corner
    ctx.beginPath();
    ctx.moveTo(fretCenterX - half, noteY - half + cornerLen);
    ctx.lineTo(fretCenterX - half, noteY - half);
    ctx.lineTo(fretCenterX - half + cornerLen, noteY - half);
    ctx.stroke();

    // Top-Right corner
    ctx.beginPath();
    ctx.moveTo(fretCenterX + half - cornerLen, noteY - half);
    ctx.lineTo(fretCenterX + half, noteY - half);
    ctx.lineTo(fretCenterX + half, noteY - half + cornerLen);
    ctx.stroke();

    // Bottom-Left corner
    ctx.beginPath();
    ctx.moveTo(fretCenterX - half, noteY + half - cornerLen);
    ctx.lineTo(fretCenterX - half, noteY + half);
    ctx.lineTo(fretCenterX - half + cornerLen, noteY + half);
    ctx.stroke();

    // Bottom-Right corner
    ctx.beginPath();
    ctx.moveTo(fretCenterX + half - cornerLen, noteY + half);
    ctx.lineTo(fretCenterX + half, noteY + half);
    ctx.lineTo(fretCenterX + half, noteY + half - cornerLen);
    ctx.stroke();

    ctx.fillStyle = theme?.nowIndicator || '#FF7A65';
    ctx.font = '700 10px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${n.fret}`, fretCenterX, noteY);

    if (n.isBend) {
      ctx.fillStyle = '#f1fa8c';
      ctx.font = '900 8px "JetBrains Mono", monospace';
      ctx.fillText('⤴', fretCenterX, noteY - half - 4);
    } else if (n.isSlide) {
      ctx.fillStyle = '#8be9fd';
      ctx.font = '900 8px "JetBrains Mono", monospace';
      ctx.fillText('➔', fretCenterX, noteY - half - 4);
    } else if (n.isVibrato) {
      ctx.fillStyle = '#ff79c6';
      ctx.font = '900 8px "JetBrains Mono", monospace';
      ctx.fillText('∿', fretCenterX, noteY - half - 4);
    } else if (n.isHammerPull) {
      ctx.fillStyle = '#50fa7b';
      ctx.font = '900 7.5px "JetBrains Mono", monospace';
      ctx.fillText(n.hammerPullType === 'pull' ? 'P' : 'H', fretCenterX, noteY - half - 4);
    }

    ctx.restore();
  });
}

export function drawFretboardNowNotes(
  ctx: CanvasRenderingContext2D,
  leftMargin: number,
  fretWidth: number,
  activeNotes: ExtractedNote[],
  isPlaying: boolean,
  getStringY: (s: number) => number,
  theme?: CanvasThemeColors,
): void {
  activeNotes.forEach((n) => {
    const noteY = getStringY(n.string);
    const fretCenterX = leftMargin + n.fret * fretWidth + fretWidth / 2;
    const markerW = Math.min(fretWidth * 0.8, 24);
    const markerH = 20;

    ctx.save();

    if (n.isHarmonic) {
      ctx.shadowColor = '#8be9fd';
      ctx.shadowBlur = 16;
      ctx.fillStyle = '#8be9fd';
    } else if (n.isBend) {
      ctx.shadowColor = '#f1fa8c';
      ctx.shadowBlur = 14;
      ctx.fillStyle = theme?.nowIndicator || '#FF7A65';
    } else if (n.isSlide) {
      ctx.shadowColor = '#8be9fd';
      ctx.shadowBlur = 14;
      ctx.fillStyle = theme?.nowIndicator || '#FF7A65';
    } else if (n.isVibrato) {
      ctx.shadowColor = '#ff79c6';
      ctx.shadowBlur = 16;
      ctx.fillStyle = theme?.nowIndicator || '#FF7A65';
    } else {
      ctx.shadowColor = theme?.nowGlow || '#FF7A65';
      ctx.shadowBlur = 14;
      ctx.fillStyle = theme?.nowIndicator || '#FF7A65';
    }

    ctx.beginPath();
    ctx.roundRect(fretCenterX - markerW / 2, noteY - markerH / 2, markerW, markerH, 4);
    ctx.fill();

    ctx.fillStyle = theme?.background === '#f6f1e5' ? '#ffffff' : '#120e0e';
    ctx.font = '900 11.5px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${n.fret}`, fretCenterX, noteY);

    // Bend
    if (n.isBend) {
      const bendSteps = n.bendAmount ?? 1.0;
      let stepLabel = 'FULL';
      if (Math.abs(bendSteps - 0.5) < 0.15) stepLabel = '½';
      else if (Math.abs(bendSteps - 1.0) < 0.15) stepLabel = 'FULL';
      else if (Math.abs(bendSteps - 1.5) < 0.15) stepLabel = '1½';
      else if (Math.abs(bendSteps - 2.0) < 0.15) stepLabel = '2';
      else stepLabel = `${bendSteps}`;
      const bendColor = '#f1fa8c';

      ctx.strokeStyle = bendColor;
      ctx.fillStyle = bendColor;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = bendColor;
      ctx.shadowBlur = 10;

      const startX = fretCenterX;
      const startY = noteY - markerH / 2 - 2;
      const arcH = 14;
      const peakY = Math.max(18, startY - arcH);
      const endX = fretCenterX + 6;

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.quadraticCurveTo(startX, peakY, endX, peakY);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(endX + 3, peakY);
      ctx.lineTo(endX - 3, peakY - 3.5);
      ctx.lineTo(endX - 1, peakY);
      ctx.lineTo(endX - 3, peakY + 3.5);
      ctx.closePath();
      ctx.fill();

      const badgeText = `⤴ ${stepLabel}`;
      ctx.font = '900 8.5px "JetBrains Mono", monospace';
      const badgeW = ctx.measureText(badgeText).width + 8;
      const badgeH = 13;
      const badgeX = fretCenterX - badgeW / 2;
      const badgeY = Math.max(3, peakY - badgeH - 2);

      ctx.fillStyle = '#1a1610';
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 3);
      ctx.fill();
      ctx.strokeStyle = bendColor;
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = bendColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(badgeText, fretCenterX, badgeY + badgeH / 2);
    }

    // Slide
    if (n.isSlide) {
      const slideColor = '#8be9fd';
      ctx.strokeStyle = slideColor;
      ctx.fillStyle = slideColor;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = slideColor;
      ctx.shadowBlur = 10;

      if (n.slideToFret !== undefined && n.slideToFret !== n.fret) {
        const targetX = leftMargin + n.slideToFret * fretWidth + fretWidth / 2;
        const isSlideUp = n.slideToFret > n.fret;
        const fromX = isSlideUp ? fretCenterX + markerW / 2 + 2 : fretCenterX - markerW / 2 - 2;
        const toX = isSlideUp ? targetX - markerW / 2 - 4 : targetX + markerW / 2 + 4;

        ctx.beginPath();
        ctx.setLineDash([4, 2]);
        ctx.moveTo(fromX, noteY);
        ctx.lineTo(toX, noteY);
        ctx.stroke();
        ctx.setLineDash([]);

        const arrowDir = isSlideUp ? 1 : -1;
        ctx.beginPath();
        ctx.moveTo(toX + arrowDir * 4, noteY);
        ctx.lineTo(toX - arrowDir * 3, noteY - 3.5);
        ctx.lineTo(toX, noteY);
        ctx.lineTo(toX - arrowDir * 3, noteY + 3.5);
        ctx.closePath();
        ctx.fill();

        ctx.lineWidth = 1.5;
        ctx.strokeStyle = 'rgba(139, 233, 253, 0.8)';
        ctx.fillStyle = 'rgba(139, 233, 253, 0.15)';
        ctx.beginPath();
        ctx.roundRect(targetX - markerW / 2, noteY - markerH / 2, markerW, markerH, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = slideColor;
        ctx.font = '900 10px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${n.slideToFret}`, targetX, noteY);
      } else {
        const arrowX = fretCenterX + markerW / 2 + 3;
        ctx.beginPath();
        ctx.moveTo(arrowX, noteY);
        ctx.lineTo(arrowX + 16, noteY);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(arrowX + 19, noteY);
        ctx.lineTo(arrowX + 13, noteY - 3.5);
        ctx.lineTo(arrowX + 15, noteY);
        ctx.lineTo(arrowX + 13, noteY + 3.5);
        ctx.closePath();
        ctx.fill();
      }

      const badgeText = '➔ SLIDE';
      ctx.font = '900 8px "JetBrains Mono", monospace';
      const bW = ctx.measureText(badgeText).width + 6;
      const bH = 12;
      const bX = fretCenterX - bW / 2;
      const bY = Math.max(3, noteY - markerH / 2 - bH - 3);

      ctx.fillStyle = '#0e171b';
      ctx.beginPath();
      ctx.roundRect(bX, bY, bW, bH, 2);
      ctx.fill();
      ctx.strokeStyle = slideColor;
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = slideColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(badgeText, fretCenterX, bY + bH / 2);
    }

    // Vibrato
    if (n.isVibrato) {
      const vibColor = '#ff79c6';
      ctx.strokeStyle = vibColor;
      ctx.fillStyle = vibColor;
      ctx.lineWidth = 2;
      ctx.shadowColor = vibColor;
      ctx.shadowBlur = 10;

      const waveW = Math.max(markerW + 10, 26);
      const waveStartX = fretCenterX - waveW / 2;
      const waveY = Math.max(18, noteY - markerH / 2 - 8);
      const phase = isPlaying ? performance.now() * 0.012 : 0;

      ctx.beginPath();
      for (let x = 0; x <= waveW; x += 2) {
        const waveAmp = 3;
        const y = waveY + Math.sin(x / 3.5 + phase) * waveAmp;
        if (x === 0) ctx.moveTo(waveStartX + x, y);
        else ctx.lineTo(waveStartX + x, y);
      }
      ctx.stroke();

      const pulse = isPlaying ? Math.sin(performance.now() * 0.008) * 0.5 + 0.5 : 0.4;
      ctx.strokeStyle = `rgba(255, 121, 198, ${0.3 + pulse * 0.5})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(
        fretCenterX - markerW / 2 - 3,
        noteY - markerH / 2 - 3,
        markerW + 6,
        markerH + 6,
        6,
      );
      ctx.stroke();

      const badgeText = '∿ VIB';
      ctx.font = '900 8px "JetBrains Mono", monospace';
      const bW = ctx.measureText(badgeText).width + 6;
      const bH = 11;
      const bX = fretCenterX - bW / 2;
      const bY = Math.max(3, waveY - 5 - bH);

      ctx.fillStyle = '#1c0f16';
      ctx.beginPath();
      ctx.roundRect(bX, bY, bW, bH, 2);
      ctx.fill();
      ctx.strokeStyle = vibColor;
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = vibColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(badgeText, fretCenterX, bY + bH / 2);
    }

    // Hammer-on / Pull-off
    if (n.isHammerPull) {
      const hpColor = '#50fa7b';
      const hpLabel = n.hammerPullType === 'pull' ? 'P' : 'H';

      ctx.strokeStyle = hpColor;
      ctx.fillStyle = hpColor;
      ctx.lineWidth = 2;
      ctx.shadowColor = hpColor;
      ctx.shadowBlur = 6;

      const arcY = noteY - markerH / 2 - 3;
      ctx.beginPath();
      ctx.moveTo(fretCenterX - markerW / 2, arcY);
      ctx.quadraticCurveTo(fretCenterX, arcY - 7, fretCenterX + markerW / 2, arcY);
      ctx.stroke();

      const bW = 14;
      const bH = 12;
      const bX = fretCenterX - bW / 2;
      const bY = Math.max(3, arcY - 7 - bH);

      ctx.fillStyle = '#0f1c12';
      ctx.beginPath();
      ctx.roundRect(bX, bY, bW, bH, 2);
      ctx.fill();
      ctx.strokeStyle = hpColor;
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = hpColor;
      ctx.font = '900 8.5px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(hpLabel, fretCenterX, bY + bH / 2);
    }

    // Harmonic
    if (n.isHarmonic) {
      const harmColor = '#8be9fd';
      ctx.strokeStyle = harmColor;
      ctx.fillStyle = harmColor;
      ctx.lineWidth = 2;
      ctx.shadowColor = harmColor;
      ctx.shadowBlur = 12;

      const dSize = Math.max(markerW, markerH) + 6;
      ctx.beginPath();
      ctx.moveTo(fretCenterX, noteY - dSize / 2);
      ctx.lineTo(fretCenterX + dSize / 2, noteY);
      ctx.lineTo(fretCenterX, noteY + dSize / 2);
      ctx.lineTo(fretCenterX - dSize / 2, noteY);
      ctx.closePath();
      ctx.stroke();

      const badgeText = '◆ HARM';
      ctx.font = '900 8px "JetBrains Mono", monospace';
      const bW = ctx.measureText(badgeText).width + 6;
      const bH = 11;
      const bX = fretCenterX - bW / 2;
      const bY = noteY - dSize / 2 - bH - 2;

      ctx.fillStyle = '#0d181c';
      ctx.beginPath();
      ctx.roundRect(bX, bY, bW, bH, 2);
      ctx.fill();
      ctx.strokeStyle = harmColor;
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = harmColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(badgeText, fretCenterX, bY + bH / 2);
    }

    // Palm Mute
    if (n.isPalmMute) {
      const pmColor = '#ffb86c';
      ctx.strokeStyle = pmColor;
      ctx.fillStyle = pmColor;

      ctx.setLineDash([3, 2]);
      ctx.lineWidth = 1.5;
      ctx.strokeRect(fretCenterX - markerW / 2 - 2, noteY - markerH / 2 - 2, markerW + 4, markerH + 4);
      ctx.setLineDash([]);

      const badgeText = 'P.M.';
      ctx.font = '900 8px "JetBrains Mono", monospace';
      const bW = 20;
      const bH = 11;
      const bX = fretCenterX - bW / 2;
      const bY = Math.max(3, noteY - markerH / 2 - bH - 2);

      ctx.fillStyle = '#1c150c';
      ctx.beginPath();
      ctx.roundRect(bX, bY, bW, bH, 2);
      ctx.fill();
      ctx.strokeStyle = pmColor;
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = pmColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(badgeText, fretCenterX, bY + bH / 2);
    }

    ctx.restore();
  });
}

/** Master fretboard draw orchestrator */
export function drawFretboardCanvas(ctx: CanvasRenderingContext2D, p: FretboardRenderParams): void {
  // Clear Background
  ctx.fillStyle = p.canvasTheme?.background || '#120e0e';
  ctx.fillRect(0, 0, p.width, p.height);

  const numStrings = p.tuningNames.length > 0 ? p.tuningNames.length : 6;
  const TOTAL_FRETS = 24;

  const isFullHeight = p.height > 320;
  const leftMargin = 48;
  const rightMargin = 20;
  const topMargin = isFullHeight ? 36 : 28;
  const bottomMargin = isFullHeight ? 32 : 26;

  const fretboardWidth = p.width - leftMargin - rightMargin;
  const fretboardHeight = Math.max(p.height - topMargin - bottomMargin, 60);

  const fretWidth = fretboardWidth / (TOTAL_FRETS + 1);
  const stringSpacing = fretboardHeight / (numStrings - 1 || 1);
  const endFretX = leftMargin + (TOTAL_FRETS + 1) * fretWidth;

  const getStringY = (stringNum: number) =>
    getFretboardStringY(stringNum, numStrings, topMargin, stringSpacing, p.isFlipped);

  // 1. Draw Wood & Inlay Dots
  drawFretboardWoodAndInlays(
    ctx,
    leftMargin,
    topMargin,
    fretboardWidth,
    fretboardHeight,
    fretWidth,
    TOTAL_FRETS,
    isFullHeight,
    p.canvasTheme,
  );

  // 2. Draw Fret Wires & Strings
  drawFretboardWiresAndStrings(
    ctx,
    leftMargin,
    topMargin,
    fretboardHeight,
    fretWidth,
    endFretX,
    TOTAL_FRETS,
    numStrings,
    p.tuningNames,
    p.activeNotes,
    getStringY,
    p.canvasTheme,
  );

  // 3. Draw Position Box Highlight
  if (p.isScaleMode && p.scalePosition !== 'all') {
    drawFretboardPositionBox(
      ctx,
      leftMargin,
      topMargin,
      fretboardHeight,
      fretWidth,
      p.scalePosition,
      p.positionInfo,
      p.canvasTheme,
    );
  }

  // 4. Draw Scale Ghost Dots Overlay
  if (p.isScaleMode) {
    drawFretboardScaleOverlay(
      ctx,
      leftMargin,
      fretWidth,
      TOTAL_FRETS,
      numStrings,
      p.tuning,
      p.activeNotes,
      p.scaleRoot,
      p.scaleId,
      p.scaleDisplayMode,
      p.scalePosition,
      p.positionInfo,
      isFullHeight,
      getStringY,
      p.canvasTheme,
    );
  }

  // 5. Draw NEXT Attack Notes
  drawFretboardNextNotes(
    ctx,
    leftMargin,
    fretWidth,
    p.nextNotes,
    p.activeNotes,
    getStringY,
    p.canvasTheme,
  );

  // 6. Draw NOW Sounding Notes
  drawFretboardNowNotes(
    ctx,
    leftMargin,
    fretWidth,
    p.activeNotes,
    p.isPlaying,
    getStringY,
    p.canvasTheme,
  );
}
