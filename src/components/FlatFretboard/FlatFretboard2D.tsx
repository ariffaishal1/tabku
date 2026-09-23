import React, { useRef, useEffect } from 'react';
import type { ExtractedNote } from '../../services/timelineExtractor';
import {
  ROOT_NOTES,
  SCALE_DEFINITIONS,
  checkNoteInScale,
  type ScaleDisplayMode,
  SCALE_POSITION_OPTIONS,
  getScalePositionInfo,
} from '../../services/scaleTheory';

interface FlatFretboard2DProps {
  activeNotes: ExtractedNote[];
  nextNotes: ExtractedNote[];
  activeTechniqueTitle?: string;
  tuningNames: string[];
  tuning?: number[];
  isPlaying?: boolean;
  isFlipped?: boolean;

  // Scale Lab Overlay Props (FR-NEXT-05)
  isScaleMode?: boolean;
  scaleRoot?: number;
  scaleId?: string;
  scaleDisplayMode?: ScaleDisplayMode;
  scalePosition?: number | 'all';
  onScaleChange?: (root: number, scaleId: string) => void;
  onScalePositionChange?: (position: number | 'all') => void;
  onToggleScaleMode?: () => void;
  onToggleDisplayMode?: () => void;
  backingProgressionName?: string;
}

const INLAY_SINGLE_FRETS = [3, 5, 7, 9, 15, 17, 19, 21];
const INLAY_DOUBLE_FRETS = [12, 24];

const ROMAN_NUMERALS = [
  '', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
  'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX',
  'XXI', 'XXII', 'XXIII', 'XXIV'
];

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
  onScaleChange,
  onScalePositionChange,
  onToggleScaleMode,
  onToggleDisplayMode,
  backingProgressionName,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Derive active fret, hand position, and notes summary for left sub-panel
  const primaryNote = activeNotes.length > 0 ? activeNotes[0] : null;
  const frettedOnly = [...new Set(activeNotes.filter((n) => n.fret > 0).map((n) => n.fret))].sort(
    (a, b) => a - b
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
      positionText = scalePosition === 'all'
        ? `${currentRoot.name} ${currentScale.name.toUpperCase()}`
        : `${currentRoot.name} ${currentScale.name.toUpperCase()} · POSISI ${scalePosition}`;
      notesSummaryText = scalePosition === 'all'
        ? (backingProgressionName ? `JAM · ${backingProgressionName.toUpperCase()}` : `${currentScale.description.toUpperCase()}`)
        : `${positionInfo.label.toUpperCase()}`;
    } else {
      activeFretText = '--';
      positionText = 'IDLE';
      notesSummaryText = 'NO ACTIVE NOTES';
    }
  } else if (frettedOnly.length === 0) {
    // All sounding notes are open strings (fret 0)
    activeFretText = 'OPEN';
    positionText = 'OPEN STRINGS';
    const openNotes = [...new Set(activeNotes.map((n) => n.noteName.replace(/\d/, '')))];
    notesSummaryText = `${activeNotes.length} STRINGS · ${openNotes.join(', ')}`;
  } else if (activeNotes.length === 1) {
    // Single note
    const n = activeNotes[0];
    const stringPitch = tuningNames[n.string - 1] || `S${n.string}`;
    const cleanNote = n.noteName.replace(/\d/, '');
    activeFretText = n.fret === 0 ? 'OPEN' : n.fret < 10 ? `0${n.fret}` : `${n.fret}`;
    positionText = n.fret === 0 ? 'OPEN STRING' : `POSITION ${ROMAN_NUMERALS[n.fret] || n.fret}`;
    notesSummaryText = `STRING ${n.string} (${stringPitch}) · ${cleanNote}`;
  } else {
    // Multiple notes (chord or dyad)
    const minF = frettedOnly[0];
    const maxF = frettedOnly[frettedOnly.length - 1];
    const span = maxF - minF + 1;
    const minStr = minF < 10 ? `0${minF}` : `${minF}`;
    const maxStr = maxF < 10 ? `0${maxF}` : `${maxF}`;

    if (minF === maxF) {
      activeFretText = minStr;
    } else {
      activeFretText = `${minStr}–${maxStr}`;
    }

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

      // Background
      ctx.fillStyle = '#120e0e';
      ctx.fillRect(0, 0, width, height);

      const numStrings = tuningNames.length > 0 ? tuningNames.length : 6;
      const TOTAL_FRETS = 24; // 00 to 24 (25 total positions)

      const isFullHeight = height > 320;
      const leftMargin = 48; // Space for string pitch labels
      const rightMargin = 20;
      const topMargin = isFullHeight ? 56 : 46; // Generous headroom for Scale Lab toolbar
      const bottomMargin = isFullHeight ? 32 : 26; // Space for fret numbers

      const fretboardWidth = width - leftMargin - rightMargin;
      const fretboardHeight = Math.max(height - topMargin - bottomMargin, 60);

      const fretWidth = fretboardWidth / (TOTAL_FRETS + 1); // 25 columns (0..24)
      const stringSpacing = fretboardHeight / (numStrings - 1 || 1);

      // Helper: compute Y for a given physical string number (1-based)
      // Normal: String 1 (High E) at top, String 6 (Low E) at bottom
      // Flipped (Player POV): String 6 at top, String 1 at bottom
      const getStringY = (stringNum: number) => {
        const index = stringNum - 1;
        const visualIndex = isFlipped ? (numStrings - 1 - index) : index;
        return topMargin + visualIndex * stringSpacing;
      };

    // 1. Draw Fretboard Wood / Background Surface (with slight bevel above String 1)
    ctx.fillStyle = '#181414';
    ctx.fillRect(leftMargin, topMargin - 4, fretboardWidth, fretboardHeight + 8);

    // 2. Draw Inlay Dots (between string 3 and 4 or across board)
    const midY = topMargin + fretboardHeight / 2;
    ctx.fillStyle = '#3a3131';

    for (let f = 1; f <= TOTAL_FRETS; f++) {
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

    // 3. Draw Fret Wires & Fret Numbers
    for (let f = 0; f <= TOTAL_FRETS; f++) {
      const fretX = leftMargin + f * fretWidth;
      const fretCenterX = fretX + fretWidth / 2;

      // Fret Wire Line
      ctx.beginPath();
      ctx.moveTo(fretX, topMargin - 4);
      ctx.lineTo(fretX, topMargin + fretboardHeight + 4);

      if (f === 1) {
        // The Nut (thick white/bone line)
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#c5b8b8';
      } else {
        ctx.lineWidth = 1.0;
        ctx.strokeStyle = '#322b2b';
      }
      ctx.stroke();

      // Fret Number Label (00, 01, ..., 24)
      const formattedFret = f < 10 ? `0${f}` : `${f}`;
      const isSpecialFret = [0, 3, 5, 7, 9, 12, 15, 17, 19, 21, 24].includes(f);

      ctx.font = isSpecialFret ? '700 9.5px "JetBrains Mono", monospace' : '500 8.5px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = isSpecialFret ? '#a89d9d' : '#524949';
      ctx.fillText(formattedFret, fretCenterX, topMargin + fretboardHeight + 8);
    }

    // End fretboard border (fret 24 right border)
    const endFretX = leftMargin + (TOTAL_FRETS + 1) * fretWidth;
    ctx.beginPath();
    ctx.moveTo(endFretX, topMargin - 4);
    ctx.lineTo(endFretX, topMargin + fretboardHeight + 4);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#443a3a';
    ctx.stroke();

    // 4. Draw Strings (1 to 6)
    for (let i = 0; i < numStrings; i++) {
      const stringNum = i + 1;
      const y = getStringY(stringNum);
      const pitchName = tuningNames[i] || `S${stringNum}`;

      const isCurrentActive = activeNotes.some((n) => n.string === stringNum);

      // String Pitch Label at left
      ctx.font = '700 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = isCurrentActive ? '#FF7A65' : '#685e5e';
      ctx.fillText(pitchName, leftMargin - 12, y);

      // String line thickness (thicker for low bass strings)
      const stringThickness = 0.9 + (stringNum - 1) * 0.45;
      ctx.beginPath();
      ctx.moveTo(leftMargin, y);
      ctx.lineTo(endFretX, y);
      ctx.lineWidth = isCurrentActive ? stringThickness + 1.2 : stringThickness;
      ctx.strokeStyle = isCurrentActive ? '#ff7a65aa' : '#5e5252';
      ctx.stroke();
    }

    // 4.4 Draw Position Bounding Box Highlight Frame (if a specific Box Position is chosen)
    if (isScaleMode && scalePosition !== 'all') {
      positionInfo.ranges.forEach((r) => {
        const boxX1 = leftMargin + r.minFret * fretWidth;
        const boxX2 = leftMargin + (r.maxFret + 1) * fretWidth;
        const boxW = boxX2 - boxX1;
        const boxY = topMargin - 4;
        const boxH = fretboardHeight + 8;

        ctx.save();
        // Soft translucent cyber frame fill
        ctx.fillStyle = 'rgba(255, 122, 101, 0.05)';
        ctx.beginPath();
        ctx.roundRect(boxX1, boxY, boxW, boxH, 6);
        ctx.fill();

        // Glowing cyber frame border
        ctx.strokeStyle = '#FF7A65';
        ctx.lineWidth = 1.8;
        ctx.shadowColor = '#FF7A65';
        ctx.shadowBlur = 10;
        ctx.stroke();

        // Top cyber label badge on box
        const minFStr = r.minFret < 10 ? `0${r.minFret}` : `${r.minFret}`;
        const maxFStr = r.maxFret < 10 ? `0${r.maxFret}` : `${r.maxFret}`;
        const badgeText = `BOX ${scalePosition} · FRET ${minFStr}–${maxFStr}`;
        ctx.font = '800 8.5px "JetBrains Mono", monospace';
        const bW = ctx.measureText(badgeText).width + 12;
        const bH = 15;
        const bX = boxX1 + (boxW - bW) / 2;
        const bY = Math.max(3, boxY - bH - 3);

        ctx.fillStyle = '#1e1414';
        ctx.beginPath();
        ctx.roundRect(bX, bY, bW, bH, 3);
        ctx.fill();
        ctx.strokeStyle = '#FF7A65';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#FF7A65';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(badgeText, boxX1 + boxW / 2, bY + bH / 2);

        ctx.restore();
      });
    }

    // 4.5 Draw Scale Ghost Dots Roadmap Overlay (FR-NEXT-05)
    if (isScaleMode) {
      const rootR = isFullHeight ? 11 : 8.5;
      const blueR = isFullHeight ? 10 : 8;
      const toneR = isFullHeight ? 9.5 : 7.5;
      const rootFont = isFullHeight ? '900 10.5px "JetBrains Mono", monospace' : '900 8.5px "JetBrains Mono", monospace';
      const blueFont = isFullHeight ? '900 9.5px "JetBrains Mono", monospace' : '900 8px "JetBrains Mono", monospace';
      const toneFont = isFullHeight ? '700 9px "JetBrains Mono", monospace' : '700 7.5px "JetBrains Mono", monospace';

      for (let s = 1; s <= numStrings; s++) {
        const y = getStringY(s);
        const basePitch = (tuning && tuning[s - 1]) ?? [64, 59, 55, 50, 45, 40][s - 1] ?? (64 - (s - 1) * 5);

        for (let f = 0; f <= TOTAL_FRETS; f++) {
          const midiPitch = basePitch + f;
          const match = checkNoteInScale(midiPitch, scaleRoot, scaleId);
          if (!match) continue;

          // Don't draw ghost dot if this exact note is currently active (activeNotes draws on top)
          const isSoundingNow = activeNotes.some((an) => an.string === s && an.fret === f);
          if (isSoundingNow) continue;

          // Check if this fret falls within the active box position (if specific position chosen)
          const isInActiveBox = scalePosition === 'all' || positionInfo.ranges.some((r) => f >= r.minFret && f <= r.maxFret);

          const fretCenterX = leftMargin + f * fretWidth + fretWidth / 2;

          ctx.save();
          if (!isInActiveBox) {
            // Dimmed outside box
            ctx.globalAlpha = 0.16;
          }

          if (match.isRoot) {
            // Coral Red for Root Note
            if (isInActiveBox) {
              ctx.shadowColor = '#FF7A65';
              ctx.shadowBlur = isFullHeight ? 14 : 10;
            }
            ctx.fillStyle = '#FF7A65';
            ctx.beginPath();
            ctx.arc(fretCenterX, y, rootR, 0, Math.PI * 2);
            ctx.fill();

            // Root label inside
            ctx.fillStyle = '#120e0e';
            ctx.font = rootFont;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const label = scaleDisplayMode === 'degrees' ? match.degree : match.noteName;
            ctx.fillText(label, fretCenterX, y);
          } else if (match.isBlueNote) {
            // Neon Magenta for Blue Note (♭5)
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
            // Subtle tone pill
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

    // 5. Draw NEXT Attack Notes (Corner / Diamond brackets ◇)
    nextNotes.forEach((n) => {
      // Don't draw NEXT if already in activeNotes on the exact same fret
      const isAlreadyNow = activeNotes.some((an) => an.string === n.string && an.fret === n.fret);
      if (isAlreadyNow) return;

      const noteY = getStringY(n.string);
      const fretCenterX = leftMargin + n.fret * fretWidth + fretWidth / 2;

      const markerSize = Math.min(fretWidth * 0.72, 22);
      const half = markerSize / 2;

      ctx.save();
      ctx.strokeStyle = '#FF7A65';
      ctx.lineWidth = 2;

      // Draw Diamond / Corner Bracket cue
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

      // Next Note number inside
      ctx.fillStyle = '#FF7A65';
      ctx.font = '700 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${n.fret}`, fretCenterX, noteY);

      // Next Attack technique hint
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

    // 6. Draw NOW Sounding Notes (Filled Solid Box ■ + Visual Techniques)
    activeNotes.forEach((n) => {
      const noteY = getStringY(n.string);
      const fretCenterX = leftMargin + n.fret * fretWidth + fretWidth / 2;

      const markerW = Math.min(fretWidth * 0.8, 24);
      const markerH = 20;

      ctx.save();

      // Technique color themes
      // Bend: #f1fa8c (neon yellow)
      // Slide: #8be9fd (neon cyan)
      // Vibrato: #ff79c6 (neon magenta)
      // Hammer/Pull: #50fa7b (neon green)
      // Harmonic: #8be9fd (ethereal cyan)
      // Palm Mute: #ffb86c (amber)
      // Standard: #FF7A65 (coral red)

      // Base Box Fill & Glow
      if (n.isHarmonic) {
        ctx.shadowColor = '#8be9fd';
        ctx.shadowBlur = 16;
        ctx.fillStyle = '#8be9fd';
      } else if (n.isBend) {
        ctx.shadowColor = '#f1fa8c';
        ctx.shadowBlur = 14;
        ctx.fillStyle = '#FF7A65';
      } else if (n.isSlide) {
        ctx.shadowColor = '#8be9fd';
        ctx.shadowBlur = 14;
        ctx.fillStyle = '#FF7A65';
      } else if (n.isVibrato) {
        ctx.shadowColor = '#ff79c6';
        ctx.shadowBlur = 16;
        ctx.fillStyle = '#FF7A65';
      } else {
        ctx.shadowColor = '#FF7A65';
        ctx.shadowBlur = 14;
        ctx.fillStyle = '#FF7A65';
      }

      // Draw Main Note Box
      ctx.beginPath();
      ctx.roundRect(fretCenterX - markerW / 2, noteY - markerH / 2, markerW, markerH, 4);
      ctx.fill();

      // Fret text inside box
      ctx.fillStyle = '#120e0e';
      ctx.font = '900 11.5px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${n.fret}`, fretCenterX, noteY);

      // --- A. BEND VISUALIZATION ---
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

        // Upward curved arrow arc
        const startX = fretCenterX;
        const startY = noteY - markerH / 2 - 2;
        const arcH = 14;
        const peakY = Math.max(18, startY - arcH);
        const endX = fretCenterX + 6;

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(startX, peakY, endX, peakY);
        ctx.stroke();

        // Arrowhead
        ctx.beginPath();
        ctx.moveTo(endX + 3, peakY);
        ctx.lineTo(endX - 3, peakY - 3.5);
        ctx.lineTo(endX - 1, peakY);
        ctx.lineTo(endX - 3, peakY + 3.5);
        ctx.closePath();
        ctx.fill();

        // Step Label Badge (e.g. "⤴ FULL")
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

      // --- B. SLIDE VISUALIZATION ---
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

          // Slide dashed path along string
          ctx.beginPath();
          ctx.setLineDash([4, 2]);
          ctx.moveTo(fromX, noteY);
          ctx.lineTo(toX, noteY);
          ctx.stroke();
          ctx.setLineDash([]);

          // Arrowhead
          const arrowDir = isSlideUp ? 1 : -1;
          ctx.beginPath();
          ctx.moveTo(toX + arrowDir * 4, noteY);
          ctx.lineTo(toX - arrowDir * 3, noteY - 3.5);
          ctx.lineTo(toX, noteY);
          ctx.lineTo(toX - arrowDir * 3, noteY + 3.5);
          ctx.closePath();
          ctx.fill();

          // Destination ghost box
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
          // Slide beam
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

        // Slide Badge
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

      // --- C. VIBRATO VISUALIZATION ---
      if (n.isVibrato) {
        const vibColor = '#ff79c6';
        ctx.strokeStyle = vibColor;
        ctx.fillStyle = vibColor;
        ctx.lineWidth = 2;
        ctx.shadowColor = vibColor;
        ctx.shadowBlur = 10;

        // Animated sine-wave ribbon
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

        // Pulsing Ring around Box
        const pulse = isPlaying ? Math.sin(performance.now() * 0.008) * 0.5 + 0.5 : 0.4;
        ctx.strokeStyle = `rgba(255, 121, 198, ${0.3 + pulse * 0.5})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(
          fretCenterX - markerW / 2 - 3,
          noteY - markerH / 2 - 3,
          markerW + 6,
          markerH + 6,
          6
        );
        ctx.stroke();

        // Vibrato Badge
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

      // --- D. HAMMER-ON / PULL-OFF VISUALIZATION ---
      if (n.isHammerPull) {
        const hpColor = '#50fa7b';
        const hpLabel = n.hammerPullType === 'pull' ? 'P' : 'H';

        ctx.strokeStyle = hpColor;
        ctx.fillStyle = hpColor;
        ctx.lineWidth = 2;
        ctx.shadowColor = hpColor;
        ctx.shadowBlur = 6;

        // Slur curve above box
        const arcY = noteY - markerH / 2 - 3;
        ctx.beginPath();
        ctx.moveTo(fretCenterX - markerW / 2, arcY);
        ctx.quadraticCurveTo(fretCenterX, arcY - 7, fretCenterX + markerW / 2, arcY);
        ctx.stroke();

        // H / P badge
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

      // --- E. HARMONIC VISUALIZATION ---
      if (n.isHarmonic) {
        const harmColor = '#8be9fd';
        ctx.strokeStyle = harmColor;
        ctx.fillStyle = harmColor;
        ctx.lineWidth = 2;
        ctx.shadowColor = harmColor;
        ctx.shadowBlur = 12;

        // Diamond outline
        const dSize = Math.max(markerW, markerH) + 6;
        ctx.beginPath();
        ctx.moveTo(fretCenterX, noteY - dSize / 2);
        ctx.lineTo(fretCenterX + dSize / 2, noteY);
        ctx.lineTo(fretCenterX, noteY + dSize / 2);
        ctx.lineTo(fretCenterX - dSize / 2, noteY);
        ctx.closePath();
        ctx.stroke();

        // Badge
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

      // --- F. PALM MUTE VISUALIZATION ---
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

    ctx.restore();

    // Only continue animation loop if playing; otherwise render once and stop
    if (isPlaying) {
      animId = requestAnimationFrame(render);
    }
  };

  render();

  return () => {
    cancelAnimationFrame(animId);
  };
}, [activeNotes, nextNotes, tuningNames, tuning, isPlaying, isFlipped, isScaleMode, scaleRoot, scaleId, scaleDisplayMode, scalePosition]);

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
      {/* 1. Left Sub-Panel: ACTIVE FRETS */}
      <div
        style={{
          width: '175px',
          minWidth: '175px',
          backgroundColor: '#161212',
          borderRight: '1px solid #2b2323',
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
                backgroundColor: isScaleMode ? '#8be9fd' : '#FF7A65',
                display: 'inline-block',
                boxShadow: isScaleMode ? '0 0 6px #8be9fd' : 'none',
              }}
            />
            {isScaleMode && activeNotes.length === 0 ? 'SCALE ROADMAP' : 'ACTIVE FRETS'}
          </div>

          <div
            style={{
              fontSize: activeFretText.length > 4 ? '30px' : activeFretText.length > 2 ? '36px' : '44px',
              fontWeight: 900,
              fontFamily: 'var(--font-mono)',
              lineHeight: 1.0,
              color: activeFretText === '--' ? '#5a5050' : '#FF7A65',
              letterSpacing: '-1px',
              marginBottom: '6px',
              textShadow: activeFretText !== '--' ? '0 0 20px rgba(255, 122, 101, 0.5)' : 'none',
            }}
          >
            {activeFretText}
          </div>

          <div
            style={{
              fontSize: '10.5px',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              color: '#f0e6e6',
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
            style={{
              fontSize: '9px',
              fontWeight: 600,
              fontFamily: 'var(--font-mono)',
              color: '#9e9191',
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
              : '#201a1a',
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
              : '1px solid #362c2c',
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
              : '#FF7A65',
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

          {/* Floating Scale Lab Overlay Toolbar (FR-NEXT-05) */}
          <div
            style={{
              position: 'absolute',
              top: '8px',
              right: '16px',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(18, 14, 14, 0.90)',
              backdropFilter: 'blur(8px)',
              border: isScaleMode ? '1px solid #FF7A65' : '1px solid #362c2c',
              borderRadius: '6px',
              padding: '4px 10px',
              boxShadow: isScaleMode ? '0 0 14px rgba(255, 122, 101, 0.2)' : 'none',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {/* Scale Lab Toggle Button */}
            <button
              onClick={onToggleScaleMode}
              title="Toggle Fretboard Scale Roadmap Overlay (Key: S)"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: isScaleMode ? '#FF7A65' : '#231c1c',
                color: isScaleMode ? '#120e0e' : '#a89d9d',
                border: isScaleMode ? '1px solid #FF7A65' : '1px solid #362c2c',
                borderRadius: '4px',
                padding: '3px 8px',
                fontSize: '10px',
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <span>🗺️</span>
              <span>SCALE LAB</span>
            </button>

            {isScaleMode && (
              <>
                {/* Root Note Selector */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '9px', color: '#7a7070', fontWeight: 700 }}>ROOT</span>
                  <select
                    id="scale-root-select"
                    value={scaleRoot}
                    onChange={(e) => onScaleChange?.(parseInt(e.target.value, 10), scaleId)}
                    style={{
                      backgroundColor: '#181414',
                      color: '#FF7A65',
                      border: '1px solid #362c2c',
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
                  <span style={{ fontSize: '9px', color: '#7a7070', fontWeight: 700 }}>SCALE</span>
                  <select
                    id="scale-type-select"
                    value={scaleId}
                    onChange={(e) => onScaleChange?.(scaleRoot, e.target.value)}
                    style={{
                      backgroundColor: '#181414',
                      color: '#f0ecec',
                      border: '1px solid #362c2c',
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

                {/* Position / Box Selector (Segmented Pill Cluster) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <span style={{ fontSize: '9px', color: '#7a7070', fontWeight: 700, marginRight: '2px' }}>POSISI</span>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor: '#181414',
                      border: '1px solid #362c2c',
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
                          onClick={() => onScalePositionChange?.(opt.value)}
                          title={opt.label}
                          style={{
                            backgroundColor: isSelected ? '#8be9fd' : 'transparent',
                            color: isSelected ? '#120e0e' : '#a89d9d',
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

                {/* Degrees / Note Names Toggle */}
                <button
                  onClick={onToggleDisplayMode}
                  title="Toggle between Scale Degrees (R, ♭3, 5) and Pitch Note Names (A, C, D...)"
                  style={{
                    backgroundColor: '#201a1a',
                    color: scaleDisplayMode === 'degrees' ? '#f1fa8c' : '#8be9fd',
                    border: '1px solid #362c2c',
                    borderRadius: '4px',
                    padding: '3px 8px',
                    fontSize: '9.5px',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  {scaleDisplayMode === 'degrees' ? 'DEG (R, ♭3, 5)' : 'NOTE (A, C, D)'}
                </button>

                {/* Dynamic Backing Track Info Pill */}
                {backingProgressionName && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      backgroundColor: 'rgba(255, 122, 101, 0.1)',
                      border: '1px solid rgba(255, 122, 101, 0.3)',
                      borderRadius: '4px',
                      padding: '3px 8px',
                      fontSize: '9px',
                      color: '#ffb86c',
                      fontWeight: 700,
                    }}
                    title={`Active Dynamic Backing Track: ${backingProgressionName}`}
                  >
                    <span>🎵</span>
                    <span
                      style={{
                        maxWidth: '160px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {backingProgressionName}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Legend Bar at Bottom */}
        <div
          style={{
            height: '24px',
            backgroundColor: '#100d0d',
            borderTop: '1px solid #231c1c',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 20px',
            fontSize: '9.5px',
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
            color: '#7a7070',
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
                      backgroundColor: '#FF7A65',
                      borderRadius: '50%',
                      boxShadow: '0 0 6px #FF7A65',
                    }}
                  />
                  <span style={{ color: '#FF7A65', fontWeight: 800 }}>ROOT</span>
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
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.4)',
                      borderRadius: '50%',
                    }}
                  />
                  <span style={{ color: '#d0c4c4', fontWeight: 700 }}>SCALE TONE</span>
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
                      color: '#8be9fd',
                      fontWeight: 800,
                      fontSize: '9px',
                    }}
                  >
                    BOX {scalePosition} ACTIVE
                  </span>
                )}
                <span style={{ color: '#362c2c' }}>|</span>
              </>
            )}
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span
                style={{
                  display: 'inline-block',
                  width: '8px',
                  height: '8px',
                  backgroundColor: '#FF7A65',
                  borderRadius: '1px',
                }}
              />
              <span style={{ color: '#FF7A65', fontWeight: 700 }}>NOW</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span
                style={{
                  display: 'inline-block',
                  width: '8px',
                  height: '8px',
                  border: '1.5px solid #FF7A65',
                  borderRadius: '1px',
                }}
              />
              <span style={{ color: '#d0c4c4' }}>NEXT</span>
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

          <div style={{ color: '#685e5e', letterSpacing: '0.5px' }}>
            {isScaleMode ? 'SCALE ROADMAP · 24 FRETS' : 'FULL FRETBOARD / 00-24'}
          </div>
        </div>
      </div>
    </div>
  );
};
