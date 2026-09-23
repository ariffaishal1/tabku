import type { TabNote, ActiveChord } from '../types/guitar';
import { midiToNoteName } from '../utils/guitarMath';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

interface ChordPattern {
  name: string;
  quality: string;
  intervals: number[]; // Set of semitone intervals relative to root
}

const CHORD_PATTERNS: ChordPattern[] = [
  // Triads
  { name: '', quality: 'Major', intervals: [0, 4, 7] },
  { name: 'm', quality: 'Minor', intervals: [0, 3, 7] },
  { name: 'sus4', quality: 'Suspended 4th', intervals: [0, 5, 7] },
  { name: 'sus2', quality: 'Suspended 2nd', intervals: [0, 2, 7] },
  { name: 'dim', quality: 'Diminished', intervals: [0, 3, 6] },
  { name: 'aug', quality: 'Augmented', intervals: [0, 4, 8] },
  { name: '5', quality: 'Power Chord', intervals: [0, 7] },

  // Seventh Chords
  { name: '7', quality: 'Dominant 7th', intervals: [0, 4, 7, 10] },
  { name: 'maj7', quality: 'Major 7th', intervals: [0, 4, 7, 11] },
  { name: 'm7', quality: 'Minor 7th', intervals: [0, 3, 7, 10] },
  { name: 'm(maj7)', quality: 'Minor Major 7th', intervals: [0, 3, 7, 11] },
  { name: 'm7b5', quality: 'Half Diminished', intervals: [0, 3, 6, 10] },
  { name: 'dim7', quality: 'Diminished 7th', intervals: [0, 3, 6, 9] },
  { name: '7sus4', quality: '7th Suspended 4th', intervals: [0, 5, 7, 10] },

  // Extended / Added Tone Chords
  { name: 'add9', quality: 'Add 9', intervals: [0, 2, 4, 7] },
  { name: 'm(add9)', quality: 'Minor Add 9', intervals: [0, 2, 3, 7] },
  { name: '6', quality: 'Major 6th', intervals: [0, 4, 7, 9] },
  { name: 'm6', quality: 'Minor 6th', intervals: [0, 3, 7, 9] },
  { name: '9', quality: 'Dominant 9th', intervals: [0, 2, 4, 7, 10] },
  { name: 'maj9', quality: 'Major 9th', intervals: [0, 2, 4, 7, 11] },
  { name: 'm9', quality: 'Minor 9th', intervals: [0, 2, 3, 7, 10] },
];

/**
 * Detects chord from an array of TabNotes actively sounding
 */
export function detectChord(notes: TabNote[], knownChordName?: string | null): ActiveChord | null {
  if (!notes || notes.length === 0) return null;

  // Filter out duplicate pitches
  const pitches = notes.map(n => n.midiPitch).sort((a, b) => a - b);
  const pitchClasses = Array.from(new Set(pitches.map(p => ((p % 12) + 12) % 12)));

  const fretPositions = notes.map(n => ({
    string: n.string,
    fret: n.fret,
    noteName: midiToNoteName(n.midiPitch, false)
  }));

  // If AlphaTab provided a known chord name (e.g. from GP file markup), prefer and parse it
  if (knownChordName && knownChordName.trim() !== '') {
    const cleanName = knownChordName.trim();
    // Extract root
    const rootMatch = cleanName.match(/^[A-G][#b]?/);
    const root = rootMatch ? rootMatch[0] : midiToNoteName(pitches[0], false);
    return {
      name: cleanName,
      root: root,
      quality: cleanName.includes('m') && !cleanName.includes('maj') ? 'Minor' : 'Major',
      notes: pitchClasses.map(pc => NOTE_NAMES[pc]),
      fretPositions
    };
  }

  // Single note
  if (pitchClasses.length === 1) {
    const rootName = NOTE_NAMES[pitchClasses[0]];
    return {
      name: rootName,
      root: rootName,
      quality: 'Single Note',
      notes: [rootName],
      fretPositions
    };
  }

  // Two notes (Dyad or Power Chord)
  if (pitchClasses.length === 2) {
    const p0 = pitchClasses[0];
    const p1 = pitchClasses[1];
    const diff = (p1 - p0 + 12) % 12;

    if (diff === 7) {
      const root = NOTE_NAMES[p0];
      return {
        name: `${root}5`,
        root,
        quality: 'Power Chord (5th)',
        notes: [root, NOTE_NAMES[p1]],
        fretPositions
      };
    } else if (diff === 5) {
      const root = NOTE_NAMES[p1];
      return {
        name: `${root}5`,
        root,
        quality: 'Power Chord (Inverted 4th)',
        notes: [root, NOTE_NAMES[p0]],
        fretPositions
      };
    } else if (diff === 4) {
      const root = NOTE_NAMES[p0];
      return {
        name: `${root} (3rd)`,
        root,
        quality: 'Major 3rd Dyad',
        notes: [root, NOTE_NAMES[p1]],
        fretPositions
      };
    } else if (diff === 3) {
      const root = NOTE_NAMES[p0];
      return {
        name: `${root}m (3rd)`,
        root,
        quality: 'Minor 3rd Dyad',
        notes: [root, NOTE_NAMES[p1]],
        fretPositions
      };
    }
  }

  // 3 or more notes: Evaluate each pitch class as potential root
  const bassPitchClass = ((pitches[0] % 12) + 12) % 12; // Lowest sounding note
  let bestMatch: { chordName: string; root: string; quality: string; score: number; isBassInversion: boolean } | null = null;

  for (const rootCandidate of pitchClasses) {
    const rootName = NOTE_NAMES[rootCandidate];
    // Calculate intervals of all notes relative to candidate root
    const intervals = pitchClasses.map(pc => (pc - rootCandidate + 12) % 12).sort((a, b) => a - b);
    const intervalSet = new Set(intervals);

    for (const pattern of CHORD_PATTERNS) {
      const patternSet = new Set(pattern.intervals);
      
      // Calculate intersection and differences
      let matchCount = 0;
      for (const i of pattern.intervals) {
        if (intervalSet.has(i)) matchCount++;
      }

      // Check if all pitch classes in the chord belong to the pattern
      const extraNotes = intervals.filter(i => !patternSet.has(i));

      // Exact match
      if (matchCount === pattern.intervals.length && extraNotes.length === 0) {
        const isBassRoot = rootCandidate === bassPitchClass;
        let chordName = `${rootName}${pattern.name}`;
        if (!isBassRoot) {
          chordName = `${chordName}/${NOTE_NAMES[bassPitchClass]}`;
        }

        const score = 100 - (isBassRoot ? 0 : 5) - pattern.intervals.length;
        if (!bestMatch || score > bestMatch.score) {
          bestMatch = {
            chordName,
            root: rootName,
            quality: pattern.quality,
            score,
            isBassInversion: !isBassRoot
          };
        }
      }
    }
  }

  if (bestMatch) {
    return {
      name: bestMatch.chordName,
      root: bestMatch.root,
      quality: bestMatch.quality,
      notes: pitchClasses.map(pc => NOTE_NAMES[pc]),
      fretPositions
    };
  }

  // Fallback: Name by lowest root and notes
  const lowestRoot = NOTE_NAMES[bassPitchClass];
  return {
    name: `${lowestRoot} chord`,
    root: lowestRoot,
    quality: 'Complex Voicing',
    notes: pitchClasses.map(pc => NOTE_NAMES[pc]),
    fretPositions
  };
}
