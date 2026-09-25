import { describe, it, expect } from 'vitest';
import {
  midiToNoteName,
  getMidiPitch,
  getFretDistance,
  getFretCenterDistance,
  getFretInlayType,
  estimateFingers,
  getTuningDescription,
  formatTime,
  transposeSingleNote,
  transposeChordName,
  formatTranspose
} from './guitarMath';

describe('guitarMath utilities', () => {
  describe('midiToNoteName', () => {
    it('converts midi to note name with octave', () => {
      expect(midiToNoteName(60)).toBe('C4');
      expect(midiToNoteName(64)).toBe('E4');
      expect(midiToNoteName(69)).toBe('A4');
    });

    it('converts midi to note name without octave', () => {
      expect(midiToNoteName(60, false)).toBe('C');
      expect(midiToNoteName(65, false)).toBe('F');
    });
  });

  describe('getMidiPitch', () => {
    it('calculates correct midi pitch based on tuning', () => {
      const standardTuning = [64, 59, 55, 50, 45, 40];
      // 1st string (High E) open = 64
      expect(getMidiPitch(1, 0, standardTuning)).toBe(64);
      // 1st string 12th fret = 76 (E5)
      expect(getMidiPitch(1, 12, standardTuning)).toBe(76);
      // 6th string (Low E) 3rd fret (G) = 43
      expect(getMidiPitch(6, 3, standardTuning)).toBe(43);
    });
  });

  describe('getFretDistance', () => {
    it('returns 0 for fret 0 or negative', () => {
      expect(getFretDistance(0)).toBe(0);
      expect(getFretDistance(-1)).toBe(0);
    });

    it('returns half scale length for 12th fret', () => {
      // 12th fret should be exactly half the scale length
      expect(getFretDistance(12, 20)).toBe(10);
      expect(getFretDistance(12, 25.5)).toBe(12.75);
    });
  });

  describe('getFretCenterDistance', () => {
    it('returns 0 for open string', () => {
      expect(getFretCenterDistance(0)).toBe(0);
    });

    it('calculates a point between previous and current fret', () => {
      const scale = 20;
      const prev = getFretDistance(0, scale); // 0
      const curr = getFretDistance(1, scale);
      const center = getFretCenterDistance(1, scale);
      expect(center).toBeGreaterThan(prev);
      expect(center).toBeLessThan(curr);
    });
  });

  describe('getFretInlayType', () => {
    it('returns double for 12 and 24', () => {
      expect(getFretInlayType(12)).toBe('double');
      expect(getFretInlayType(24)).toBe('double');
    });

    it('returns single for odd frets except 11 and 13 (usually)', () => {
      expect(getFretInlayType(3)).toBe('single');
      expect(getFretInlayType(5)).toBe('single');
      expect(getFretInlayType(7)).toBe('single');
      expect(getFretInlayType(9)).toBe('single');
      expect(getFretInlayType(15)).toBe('single');
    });

    it('returns none for other frets', () => {
      expect(getFretInlayType(1)).toBe('none');
      expect(getFretInlayType(2)).toBe('none');
      expect(getFretInlayType(11)).toBe('none');
    });
  });

  describe('estimateFingers', () => {
    it('assigns index finger (1) to the lowest fret', () => {
      const notes = [
        { string: 3, fret: 5 }, // C
        { string: 2, fret: 6 }, // F
        { string: 1, fret: 5 }  // A
      ];
      const result = estimateFingers(notes);
      expect(result.get(3)).toBe(1); // 5th fret -> finger 1
      expect(result.get(2)).toBe(2); // 6th fret -> finger 2
      expect(result.get(1)).toBe(1); // 5th fret -> finger 1
    });

    it('returns empty map for empty or only open strings', () => {
      expect(estimateFingers([]).size).toBe(0);
      expect(estimateFingers([{ string: 1, fret: 0 }]).size).toBe(0);
    });
  });

  describe('getTuningDescription', () => {
    it('identifies Standard E', () => {
      expect(getTuningDescription([64, 59, 55, 50, 45, 40])).toBe('Standard E (E A D G B E)');
    });

    it('identifies Drop D', () => {
      expect(getTuningDescription([64, 59, 55, 50, 45, 38])).toBe('Drop D (D A D G B E)');
    });

    it('identifies Standard Bass', () => {
      expect(getTuningDescription([43, 38, 33, 28])).toBe('Standard Bass (E A D G)');
    });

    it('returns Custom for unknown tunings', () => {
      // D A D F# A D
      expect(getTuningDescription([62, 57, 54, 50, 45, 38])).toBe('Custom (D A D F# A D)');
    });
  });

  describe('formatTime', () => {
    it('formats seconds to mm:ss', () => {
      expect(formatTime(0)).toBe('00:00');
      expect(formatTime(30)).toBe('00:30');
      expect(formatTime(65)).toBe('01:05');
      expect(formatTime(600)).toBe('10:00');
    });

    it('handles negative or NaN', () => {
      expect(formatTime(-10)).toBe('00:00');
      expect(formatTime(NaN)).toBe('00:00');
    });
  });

  describe('transposeSingleNote', () => {
    it('transposes note up correctly', () => {
      expect(transposeSingleNote('C', 2)).toBe('D');
      expect(transposeSingleNote('E', 1)).toBe('F');
      expect(transposeSingleNote('B', 1)).toBe('C');
    });

    it('transposes note down correctly', () => {
      expect(transposeSingleNote('D', -2)).toBe('C');
      expect(transposeSingleNote('C', -1)).toBe('B');
    });

    it('returns original string if not a valid note', () => {
      expect(transposeSingleNote('H', 2)).toBe('H');
    });
  });

  describe('transposeChordName', () => {
    it('transposes standard chords', () => {
      expect(transposeChordName('Am', 2)).toBe('Bm');
      expect(transposeChordName('Cmaj7', 1)).toBe('C#maj7');
      expect(transposeChordName('F#m7b5', -1)).toBe('Fm7b5');
    });

    it('transposes slash chords', () => {
      expect(transposeChordName('D/F#', 2)).toBe('E/G#');
      expect(transposeChordName('C/G', -2)).toBe('A#/F'); // Simplification in scale mapping (A# instead of Bb)
    });
  });

  describe('formatTranspose', () => {
    it('formats transpose UI string', () => {
      expect(formatTranspose(0)).toBe('0');
      expect(formatTranspose(2)).toBe('+2');
      expect(formatTranspose(-1)).toBe('-1');
    });
  });
});
