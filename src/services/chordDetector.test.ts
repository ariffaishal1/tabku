import { describe, it, expect } from 'vitest';
import { detectChord } from './chordDetector';
import type { TabNote } from '../types/guitar';

describe('chordDetector', () => {
  it('returns null for empty notes', () => {
    expect(detectChord([])).toBeNull();
  });

  it('detects a single note', () => {
    const notes: TabNote[] = [
      { string: 6, fret: 5, midiPitch: 45, noteName: 'A2' }
    ];
    const result = detectChord(notes);
    expect(result).not.toBeNull();
    expect(result?.name).toBe('A');
    expect(result?.quality).toBe('Single Note');
  });

  it('detects a power chord (5th)', () => {
    const notes: TabNote[] = [
      { string: 6, fret: 5, midiPitch: 45, noteName: 'A2' },
      { string: 5, fret: 7, midiPitch: 52, noteName: 'E3' }
    ];
    const result = detectChord(notes);
    expect(result?.name).toBe('A5');
    expect(result?.quality).toBe('Power Chord (5th)');
  });

  it('detects a basic major chord triad (A Major)', () => {
    const notes: TabNote[] = [
      { string: 5, fret: 0, midiPitch: 45, noteName: 'A2' },
      { string: 4, fret: 2, midiPitch: 52, noteName: 'E3' },
      { string: 3, fret: 2, midiPitch: 57, noteName: 'A3' },
      { string: 2, fret: 2, midiPitch: 61, noteName: 'C#4' },
      { string: 1, fret: 0, midiPitch: 64, noteName: 'E4' }
    ];
    const result = detectChord(notes);
    expect(result?.name).toBe('A');
    expect(result?.quality).toBe('Major');
  });

  it('detects a basic minor chord triad (A Minor)', () => {
    const notes: TabNote[] = [
      { string: 5, fret: 0, midiPitch: 45, noteName: 'A2' },
      { string: 4, fret: 2, midiPitch: 52, noteName: 'E3' },
      { string: 3, fret: 2, midiPitch: 57, noteName: 'A3' },
      { string: 2, fret: 1, midiPitch: 60, noteName: 'C4' },
      { string: 1, fret: 0, midiPitch: 64, noteName: 'E4' }
    ];
    const result = detectChord(notes);
    expect(result?.name).toBe('Am');
    expect(result?.quality).toBe('Minor');
  });

  it('detects a dominant 7th chord (G7)', () => {
    const notes: TabNote[] = [
      { string: 6, fret: 3, midiPitch: 43, noteName: 'G2' },
      { string: 5, fret: 2, midiPitch: 47, noteName: 'B2' },
      { string: 4, fret: 0, midiPitch: 50, noteName: 'D3' },
      { string: 3, fret: 0, midiPitch: 55, noteName: 'G3' },
      { string: 2, fret: 0, midiPitch: 59, noteName: 'B3' },
      { string: 1, fret: 1, midiPitch: 65, noteName: 'F4' }
    ];
    const result = detectChord(notes);
    expect(result?.name).toBe('G7');
    expect(result?.quality).toBe('Dominant 7th');
  });

  it('detects inverted chords (slash chords) e.g. D/F#', () => {
    const notes: TabNote[] = [
      { string: 6, fret: 2, midiPitch: 42, noteName: 'F#2' },
      { string: 3, fret: 2, midiPitch: 57, noteName: 'A3' },
      { string: 2, fret: 3, midiPitch: 62, noteName: 'D4' },
      { string: 1, fret: 2, midiPitch: 66, noteName: 'F#4' }
    ];
    const result = detectChord(notes);
    expect(result?.name).toBe('D/F#');
    expect(result?.quality).toBe('Major');
  });

  it('prefers knownChordName if provided and valid', () => {
    const notes: TabNote[] = [
      { string: 6, fret: 5, midiPitch: 45, noteName: 'A2' },
      { string: 5, fret: 7, midiPitch: 52, noteName: 'E3' }
    ];
    // Even though it's structurally A5, if the file says Am7, prefer it
    const result = detectChord(notes, 'Am7');
    expect(result?.name).toBe('Am7');
    expect(result?.quality).toBe('Minor');
  });

  it('detects inverted 4th power chord dyad', () => {
    // E3 (52) and A3 (57): 4th inversion of A5
    const notes: TabNote[] = [
      { string: 5, fret: 7, midiPitch: 52, noteName: 'E3' },
      { string: 4, fret: 7, midiPitch: 57, noteName: 'A3' }
    ];
    const result = detectChord(notes);
    expect(result?.name).toBe('A5');
    expect(result?.quality).toBe('Power Chord (Inverted 4th)');
  });

  it('detects major and minor 3rd dyads', () => {
    // C4 (60) + E4 (64) -> C (3rd)
    const majorDyad: TabNote[] = [
      { string: 5, fret: 3, midiPitch: 60, noteName: 'C4' },
      { string: 4, fret: 2, midiPitch: 64, noteName: 'E4' }
    ];
    const resMajor = detectChord(majorDyad);
    expect(resMajor?.name).toBe('C (3rd)');
    expect(resMajor?.quality).toBe('Major 3rd Dyad');

    // A3 (57) + C4 (60) -> Am (3rd)
    const minorDyad: TabNote[] = [
      { string: 4, fret: 7, midiPitch: 57, noteName: 'A3' },
      { string: 3, fret: 5, midiPitch: 60, noteName: 'C4' }
    ];
    const resMinor = detectChord(minorDyad);
    expect(resMinor?.name).toBe('Am (3rd)');
    expect(resMinor?.quality).toBe('Minor 3rd Dyad');
  });

  it('detects suspended chords (sus4 and sus2)', () => {
    // Dsus4: D(62), G(67), A(69)
    const dSus4: TabNote[] = [
      { string: 4, fret: 0, midiPitch: 62, noteName: 'D4' },
      { string: 3, fret: 2, midiPitch: 69, noteName: 'A4' },
      { string: 2, fret: 3, midiPitch: 67, noteName: 'G4' }
    ];
    expect(detectChord(dSus4)?.name).toBe('Dsus4');

    // Dsus2: D(62), E(64), A(69)
    const dSus2: TabNote[] = [
      { string: 4, fret: 0, midiPitch: 62, noteName: 'D4' },
      { string: 3, fret: 2, midiPitch: 69, noteName: 'A4' },
      { string: 1, fret: 0, midiPitch: 64, noteName: 'E4' }
    ];
    expect(detectChord(dSus2)?.name).toBe('Dsus2');
  });

  it('detects diminished and augmented triads', () => {
    // Bdim: B(59), D(62), F(65)
    const bDim: TabNote[] = [
      { string: 5, fret: 2, midiPitch: 59, noteName: 'B3' },
      { string: 4, fret: 0, midiPitch: 62, noteName: 'D4' },
      { string: 2, fret: 6, midiPitch: 65, noteName: 'F4' }
    ];
    expect(detectChord(bDim)?.name).toBe('Bdim');

    // Caug: C(60), E(64), G#(68)
    const cAug: TabNote[] = [
      { string: 5, fret: 3, midiPitch: 60, noteName: 'C4' },
      { string: 4, fret: 2, midiPitch: 64, noteName: 'E4' },
      { string: 3, fret: 1, midiPitch: 68, noteName: 'G#4' }
    ];
    expect(detectChord(cAug)?.name).toBe('Caug');
  });

  it('detects 7th chords: maj7, m7, and m7b5', () => {
    // Cmaj7: C(60), E(64), G(67), B(71)
    const cMaj7: TabNote[] = [
      { string: 5, fret: 3, midiPitch: 60, noteName: 'C4' },
      { string: 4, fret: 2, midiPitch: 64, noteName: 'E4' },
      { string: 3, fret: 0, midiPitch: 67, noteName: 'G4' },
      { string: 2, fret: 0, midiPitch: 71, noteName: 'B4' }
    ];
    expect(detectChord(cMaj7)?.name).toBe('Cmaj7');

    // Am7: A(57), C(60), E(64), G(67)
    const aM7: TabNote[] = [
      { string: 4, fret: 7, midiPitch: 57, noteName: 'A3' },
      { string: 3, fret: 5, midiPitch: 60, noteName: 'C4' },
      { string: 2, fret: 5, midiPitch: 64, noteName: 'E4' },
      { string: 1, fret: 3, midiPitch: 67, noteName: 'G4' }
    ];
    expect(detectChord(aM7)?.name).toBe('Am7');

    // Bm7b5: B(59), D(62), F(65), A(69)
    const bm7b5: TabNote[] = [
      { string: 5, fret: 2, midiPitch: 59, noteName: 'B3' },
      { string: 4, fret: 0, midiPitch: 62, noteName: 'D4' },
      { string: 3, fret: 2, midiPitch: 69, noteName: 'A4' },
      { string: 2, fret: 6, midiPitch: 65, noteName: 'F4' }
    ];
    expect(detectChord(bm7b5)?.name).toBe('Bm7b5');
  });

  it('detects extended chords: Cadd9 and C9', () => {
    // Cadd9: C(60), D(62), E(64), G(67)
    const cAdd9: TabNote[] = [
      { string: 5, fret: 3, midiPitch: 60, noteName: 'C4' },
      { string: 4, fret: 2, midiPitch: 64, noteName: 'E4' },
      { string: 3, fret: 0, midiPitch: 67, noteName: 'G4' },
      { string: 2, fret: 3, midiPitch: 62, noteName: 'D4' }
    ];
    expect(detectChord(cAdd9)?.name).toBe('Cadd9');
  });

  it('falls back to complex voicing for non-standard clusters', () => {
    // C(60), C#(61), D(62) cluster
    const cluster: TabNote[] = [
      { string: 5, fret: 3, midiPitch: 60, noteName: 'C4' },
      { string: 5, fret: 4, midiPitch: 61, noteName: 'C#4' },
      { string: 5, fret: 5, midiPitch: 62, noteName: 'D4' }
    ];
    const result = detectChord(cluster);
    expect(result?.name).toBe('C chord');
    expect(result?.quality).toBe('Complex Voicing');
  });
});
