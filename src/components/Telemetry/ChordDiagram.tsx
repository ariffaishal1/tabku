import React, { useRef, useEffect } from 'react';
import type { ExtractedNote } from '../../services/timelineExtractor';

interface ChordDiagramProps {
  notes: ExtractedNote[];
  chordName?: string;
  numStrings?: number;
  width?: number;
  height?: number;
}

/**
 * Mini chord diagram showing finger positions on a vertical fretboard.
 * Renders: string lines, fret lines, dot markers at positions, open/muted indicators.
 * Standard guitar orientation: String 6 (low E) on left, String 1 (high E) on right.
 */
export const ChordDiagram: React.FC<ChordDiagramProps> = ({
  notes,
  chordName,
  numStrings = 6,
  width = 80,
  height = 92,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const W = width;
    const H = height;

    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;

    ctx.save();
    ctx.scale(dpr, dpr);

    // Clear
    ctx.clearRect(0, 0, W, H);

    // Layout
    const topMargin = chordName ? 18 : 14; // space for chord name + open/muted indicators
    const leftMargin = 16;
    const rightMargin = 8;
    const bottomMargin = 5;
    const fretboardW = W - leftMargin - rightMargin;
    const fretboardH = H - topMargin - bottomMargin;
    const numFrets = 4;
    const stringSpacing = fretboardW / (numStrings - 1);
    const fretSpacing = fretboardH / numFrets;

    // Determine fret range to display
    const frets = notes.map(n => n.fret).filter(f => f > 0);
    const minFret = frets.length > 0 ? Math.min(...frets) : 1;
    const hasOpenString = notes.some(n => n.fret === 0);

    // Standard guitar chord diagram rule:
    // Chords below fret 5 (e.g. Em at fret 2, C at fret 3, etc.) or any chord with open strings
    // always start from Fret 1 with a thick nut at the top.
    // Only chords located entirely at fret 5 or higher (minFret >= 5) show the starting fret label on the left.
    const isHigherPosition = minFret >= 5 && !hasOpenString;
    const baseFret = isHigherPosition ? minFret : 1;

    // Draw chord name if provided
    if (chordName) {
      ctx.fillStyle = '#FF7A65';
      ctx.font = '800 9px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(chordName, W / 2, 1);
    }

    // Draw nut (thick line at top) if baseFret is 1
    if (baseFret === 1) {
      ctx.fillStyle = '#c5b8b8';
      ctx.fillRect(leftMargin - 1, topMargin - 2.5, fretboardW + 2, 3.5);
    } else {
      // Show base fret number on the left of the 1st fret box (e.g. "5fr" or "5")
      ctx.fillStyle = '#c5b8b8';
      ctx.font = '700 8.5px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${baseFret}fr`, leftMargin - 3, topMargin + fretSpacing / 2);
    }

    // Draw fret lines
    for (let f = 0; f <= numFrets; f++) {
      const y = topMargin + f * fretSpacing;
      ctx.beginPath();
      ctx.moveTo(leftMargin, y);
      ctx.lineTo(leftMargin + fretboardW, y);
      ctx.lineWidth = f === 0 ? 1.5 : 0.8;
      ctx.strokeStyle = f === 0 ? '#5a5050' : '#3a3232';
      ctx.stroke();
    }

    // Draw string lines
    for (let s = 0; s < numStrings; s++) {
      const x = leftMargin + s * stringSpacing;
      ctx.beginPath();
      ctx.moveTo(x, topMargin);
      ctx.lineTo(x, topMargin + fretboardH);
      ctx.lineWidth = 0.8;
      ctx.strokeStyle = '#3a3232';
      ctx.stroke();
    }

    // Build set of active strings
    const activeStringSet = new Set(notes.map(n => n.string));

    // Draw open/muted indicators at top (String 6 on left, String 1 on right)
    for (let s = 0; s < numStrings; s++) {
      const physicalString = numStrings - s;
      const x = leftMargin + s * stringSpacing;
      const note = notes.find(n => n.string === physicalString);

      if (note && note.fret === 0) {
        // Open string: draw "O"
        ctx.beginPath();
        ctx.arc(x, topMargin - 5, 3, 0, Math.PI * 2);
        ctx.strokeStyle = '#50fa7b';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      } else if (!activeStringSet.has(physicalString)) {
        // Muted: draw "×"
        ctx.fillStyle = '#5a5050';
        ctx.font = '700 7px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('×', x, topMargin - 5);
      }
    }

    // Draw finger dots (String 6 on left, String 1 on right)
    notes.forEach(n => {
      if (n.fret <= 0) return; // skip open strings (already shown as O)

      const s = numStrings - n.string; // 0-indexed column from left
      if (s < 0 || s >= numStrings) return;

      const x = leftMargin + s * stringSpacing;
      const relativeFret = n.fret - baseFret;

      if (relativeFret < 0 || relativeFret >= numFrets) return; // out of visible range

      const y = topMargin + relativeFret * fretSpacing + fretSpacing / 2;

      // Filled dot
      ctx.beginPath();
      ctx.arc(x, y, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = '#FF7A65';
      ctx.shadowColor = '#FF7A65';
      ctx.shadowBlur = 4;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Fret number inside dot
      ctx.fillStyle = '#120e0e';
      ctx.font = '800 6px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${n.fret}`, x, y);
    });

    ctx.restore();
  }, [notes, chordName, numStrings, width, height]);

  if (notes.length < 2) return null; // Only show for chords (2+ notes)

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
      }}
    />
  );
};
