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
});
