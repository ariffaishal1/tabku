import { describe, it, expect } from 'vitest';
import {
  checkNoteInScale,
  getScalePositionInfo,
  generateBackingTrackTex,
  SCALE_DEFINITIONS,
  ROOT_NOTES,
} from './scaleTheory';

describe('scaleTheory service', () => {
  describe('checkNoteInScale', () => {
    it('correctly identifies A Minor Pentatonic root (A = pitchClass 9)', () => {
      // MIDI 69 is A4 (pitchClass 9)
      const result = checkNoteInScale(69, 9, 'minor_pentatonic');
      expect(result).not.toBeNull();
      expect(result?.isMatch).toBe(true);
      expect(result?.isRoot).toBe(true);
      expect(result?.degree).toBe('R');
      expect(result?.noteName).toBe('A');
      expect(result?.isBlueNote).toBe(false);
    });

    it('correctly identifies other intervals in A Minor Pentatonic', () => {
      // C (pitchClass 0) -> minor 3rd (♭3)
      const cNote = checkNoteInScale(60, 9, 'minor_pentatonic');
      expect(cNote).not.toBeNull();
      expect(cNote?.isMatch).toBe(true);
      expect(cNote?.isRoot).toBe(false);
      expect(cNote?.degree).toBe('♭3');
      expect(cNote?.noteName).toBe('C');

      // D (pitchClass 2) -> 4th (4)
      const dNote = checkNoteInScale(62, 9, 'minor_pentatonic');
      expect(dNote).not.toBeNull();
      expect(dNote?.degree).toBe('4');

      // E (pitchClass 4) -> 5th (5)
      const eNote = checkNoteInScale(64, 9, 'minor_pentatonic');
      expect(eNote).not.toBeNull();
      expect(eNote?.degree).toBe('5');

      // G (pitchClass 7) -> minor 7th (♭7)
      const gNote = checkNoteInScale(67, 9, 'minor_pentatonic');
      expect(gNote).not.toBeNull();
      expect(gNote?.degree).toBe('♭7');

      // F# (pitchClass 6) -> not in Minor Pentatonic (returns null)
      const fSharpNote = checkNoteInScale(66, 9, 'minor_pentatonic');
      expect(fSharpNote).toBeNull();
    });

    it('identifies blue note (♭5) in Blues scale', () => {
      // In A Blues, D# / Eb is the blue note (interval 6 semitones, pitchClass 3, MIDI 63)
      const blueNote = checkNoteInScale(63, 9, 'blues');
      expect(blueNote).not.toBeNull();
      expect(blueNote?.isMatch).toBe(true);
      expect(blueNote?.isBlueNote).toBe(true);
      expect(blueNote?.degree).toBe('♭5');
    });
  });

  describe('getScalePositionInfo', () => {
    it('returns 0..24 range when position is all', () => {
      const posAll = getScalePositionInfo(9, 'minor_pentatonic', 'all');
      expect(posAll.position).toBe('all');
      expect(posAll.ranges).toHaveLength(1);
      expect(posAll.ranges[0].minFret).toBe(0);
      expect(posAll.ranges[0].maxFret).toBe(24);
      expect(posAll.label).toContain('Semua Fret');
    });

    it('calculates Box 1 for A Minor Pentatonic with base at frets 5..8', () => {
      // Root on 6th string Low E (pitch 40): fret = (9 - 4 + 12) % 12 = 5
      const box1 = getScalePositionInfo(9, 'minor_pentatonic', 1);
      expect(box1.ranges.some((r) => r.minFret === 5 && r.maxFret === 8)).toBe(true);
      expect(box1.label).toContain('Posisi 1');
    });

    it('calculates octave copies within 0..24 frets', () => {
      const box1 = getScalePositionInfo(9, 'minor_pentatonic', 1);
      // Box 1 for A Minor Pentatonic should also appear at fret 17..20 (5 + 12 = 17)
      expect(box1.ranges.some((r) => r.minFret === 17 && r.maxFret === 20)).toBe(true);
    });
  });

  describe('generateBackingTrackTex', () => {
    it('generates valid AlphaTex with correct tempo and structure', () => {
      const result = generateBackingTrackTex(9, 'minor_pentatonic', 90);
      expect(result.progressionName).toBeDefined();
      expect(result.tex).toContain('\\tempo 90');
      expect(result.tex).toContain('\\track "Lead Guitar (Scale Practice)"');
      expect(result.tex).toContain('\\track "Rhythm Backing Track"');
      expect(result.tex).toContain('\\track "Bass Backing Track"');
    });

    it('supports major and blues backing tracks', () => {
      const majorResult = generateBackingTrackTex(0, 'major_pentatonic', 110);
      expect(majorResult.tex).toContain('\\tempo 110');
      expect(majorResult.progressionName).toContain('C');

      const bluesResult = generateBackingTrackTex(4, 'blues', 80);
      expect(bluesResult.tex).toContain('\\tempo 80');
      expect(bluesResult.progressionName).toContain('E');
    });
  });

  describe('Definitions integrity', () => {
    it('all scale definitions have matching intervals and degrees count', () => {
      for (const scale of SCALE_DEFINITIONS) {
        expect(scale.intervals.length).toBe(scale.degrees.length);
        expect(scale.intervals[0]).toBe(0); // must start with Root (0)
        expect(scale.degrees[0]).toBe('R');
      }
    });

    it('has 12 root notes covering chromatic scale 0..11', () => {
      expect(ROOT_NOTES.length).toBe(12);
      ROOT_NOTES.forEach((r, idx) => {
        expect(r.pitchClass).toBe(idx);
      });
    });
  });
});
