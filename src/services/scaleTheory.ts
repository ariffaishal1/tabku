export type ScaleDisplayMode = 'degrees' | 'notes';

export interface RootNoteOption {
  pitchClass: number; // 0..11 (0=C, 9=A, etc.)
  label: string;
  name: string;
}

export const ROOT_NOTES: RootNoteOption[] = [
  { pitchClass: 0, label: 'C', name: 'C' },
  { pitchClass: 1, label: 'C# / Db', name: 'C#' },
  { pitchClass: 2, label: 'D', name: 'D' },
  { pitchClass: 3, label: 'D# / Eb', name: 'D#' },
  { pitchClass: 4, label: 'E', name: 'E' },
  { pitchClass: 5, label: 'F', name: 'F' },
  { pitchClass: 6, label: 'F# / Gb', name: 'F#' },
  { pitchClass: 7, label: 'G', name: 'G' },
  { pitchClass: 8, label: 'G# / Ab', name: 'G#' },
  { pitchClass: 9, label: 'A', name: 'A' },
  { pitchClass: 10, label: 'A# / Bb', name: 'A#' },
  { pitchClass: 11, label: 'B', name: 'B' },
];

export interface ScaleDefinition {
  id: string;
  name: string;
  category: 'pentatonic' | 'blues' | 'diatonic' | 'modes';
  intervals: number[]; // semitones offset from root
  degrees: string[]; // degree labels: 'R', '♭3', '4', etc.
  description: string;
  backingType: 'minor' | 'major' | 'blues';
}

export const SCALE_DEFINITIONS: ScaleDefinition[] = [
  {
    id: 'minor_pentatonic',
    name: 'Minor Pentatonic',
    category: 'pentatonic',
    intervals: [0, 3, 5, 7, 10],
    degrees: ['R', '♭3', '4', '5', '♭7'],
    description: 'Fondasi utama solo gitar rock, blues, dan pop.',
    backingType: 'minor',
  },
  {
    id: 'major_pentatonic',
    name: 'Major Pentatonic',
    category: 'pentatonic',
    intervals: [0, 2, 4, 7, 9],
    degrees: ['R', '2', '3', '5', '6'],
    description: 'Melodi cerah untuk solo country, acoustic, dan southern rock.',
    backingType: 'major',
  },
  {
    id: 'blues',
    name: 'Blues Scale',
    category: 'blues',
    intervals: [0, 3, 5, 6, 7, 10],
    degrees: ['R', '♭3', '4', '♭5', '5', '♭7'],
    description: 'Minor pentatonic dengan tambahan nada blue note (♭5) yang soulful.',
    backingType: 'blues',
  },
  {
    id: 'natural_minor',
    name: 'Natural Minor (Aeolian)',
    category: 'diatonic',
    intervals: [0, 2, 3, 5, 7, 8, 10],
    degrees: ['R', '2', '♭3', '4', '5', '♭6', '♭7'],
    description: 'Skala minor diatonis penuh, standar musik emosional & metal.',
    backingType: 'minor',
  },
  {
    id: 'major',
    name: 'Major Scale (Ionian)',
    category: 'diatonic',
    intervals: [0, 2, 4, 5, 7, 9, 11],
    degrees: ['R', '2', '3', '4', '5', '6', '7'],
    description: 'Tangga nada diatonis dasar (Do Re Mi Fa Sol La Si Do).',
    backingType: 'major',
  },
  {
    id: 'dorian',
    name: 'Dorian Mode',
    category: 'modes',
    intervals: [0, 2, 3, 5, 7, 9, 10],
    degrees: ['R', '2', '♭3', '4', '5', '6', '♭7'],
    description: 'Minor dengan aksen 6 mayor khas Carlos Santana & Jazz-Funk.',
    backingType: 'minor',
  },
  {
    id: 'harmonic_minor',
    name: 'Harmonic Minor',
    category: 'diatonic',
    intervals: [0, 2, 3, 5, 7, 8, 11],
    degrees: ['R', '2', '♭3', '4', '5', '♭6', '7'],
    description: 'Nuansa neoclassical shredding & Spanish flamenco.',
    backingType: 'minor',
  },
];

const CHROMATIC_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export interface ScaleNoteMatch {
  isMatch: boolean;
  isRoot: boolean;
  isBlueNote: boolean;
  degree: string;
  noteName: string;
  interval: number;
}

/**
 * Check if a MIDI pitch falls within a scale given the root pitchClass (0..11) and scaleId.
 */
export function checkNoteInScale(
  midiPitch: number,
  rootPitchClass: number,
  scaleId: string
): ScaleNoteMatch | null {
  const scale = SCALE_DEFINITIONS.find((s) => s.id === scaleId) || SCALE_DEFINITIONS[0];
  const pitchClass = ((midiPitch % 12) + 12) % 12;
  const interval = ((pitchClass - rootPitchClass) % 12 + 12) % 12;

  const idx = scale.intervals.indexOf(interval);
  if (idx === -1) return null;

  const isRoot = interval === 0;
  const isBlueNote = scale.id === 'blues' && interval === 6;
  const degree = scale.degrees[idx];
  const noteName = CHROMATIC_NOTES[pitchClass];

  return {
    isMatch: true,
    isRoot,
    isBlueNote,
    degree,
    noteName,
    interval,
  };
}

/**
 * Standard guitar chord voicings in AlphaTex tab notation format (frets on strings 6 to 1).
 * Strings order in AlphaTex chord notation: (string.fret string.fret ...)
 */
interface ChordTabVoicing {
  name: string;
  tabNotes: string; // e.g. "(0.6 2.5 2.4 0.3 0.2 0.1)"
  bassNote: string; // e.g. "0.4"
}

// Map root index (0=C .. 11=B) to standard acoustic rhythm voicings
const MINOR_VOICINGS: Record<number, ChordTabVoicing> = {
  0: { name: 'Cm', tabNotes: '(x.6 3.5 5.4 5.3 4.2 3.1)', bassNote: '3.3' }, // C
  1: { name: 'C#m', tabNotes: '(x.6 4.5 6.4 6.3 5.2 4.1)', bassNote: '4.3' }, // C#
  2: { name: 'Dm', tabNotes: '(x.6 x.5 0.4 2.3 3.2 1.1)', bassNote: '0.3' }, // D
  3: { name: 'D#m', tabNotes: '(x.6 x.5 1.4 3.3 4.2 2.1)', bassNote: '1.3' }, // D#
  4: { name: 'Em', tabNotes: '(0.6 2.5 2.4 0.3 0.2 0.1)', bassNote: '2.4' }, // E
  5: { name: 'Fm', tabNotes: '(1.6 3.5 3.4 1.3 1.2 1.1)', bassNote: '3.4' }, // F
  6: { name: 'F#m', tabNotes: '(2.6 4.5 4.4 2.3 2.2 2.1)', bassNote: '4.4' }, // F#
  7: { name: 'Gm', tabNotes: '(3.6 5.5 5.4 3.3 3.2 3.1)', bassNote: '5.4' }, // G
  8: { name: 'G#m', tabNotes: '(4.6 6.5 6.4 4.3 4.2 4.1)', bassNote: '6.4' }, // G#
  9: { name: 'Am', tabNotes: '(x.6 0.5 2.4 2.3 1.2 0.1)', bassNote: '2.3' }, // A
  10: { name: 'Bbm', tabNotes: '(x.6 1.5 3.4 3.3 2.2 1.1)', bassNote: '3.3' }, // Bb
  11: { name: 'Bm', tabNotes: '(x.6 2.5 4.4 4.3 3.2 2.1)', bassNote: '4.3' }, // B
};

const MAJOR_VOICINGS: Record<number, ChordTabVoicing> = {
  0: { name: 'C', tabNotes: '(x.6 3.5 2.4 0.3 1.2 0.1)', bassNote: '3.3' }, // C
  1: { name: 'C#', tabNotes: '(x.6 4.5 3.4 1.3 2.2 1.1)', bassNote: '4.3' }, // C#
  2: { name: 'D', tabNotes: '(x.6 x.5 0.4 2.3 3.2 2.1)', bassNote: '0.3' }, // D
  3: { name: 'Eb', tabNotes: '(x.6 x.5 1.4 3.3 4.2 3.1)', bassNote: '1.3' }, // Eb
  4: { name: 'E', tabNotes: '(0.6 2.5 2.4 1.3 0.2 0.1)', bassNote: '2.4' }, // E
  5: { name: 'F', tabNotes: '(1.6 3.5 3.4 2.3 1.2 1.1)', bassNote: '3.4' }, // F
  6: { name: 'F#', tabNotes: '(2.6 4.5 4.4 3.3 2.2 2.1)', bassNote: '4.4' }, // F#
  7: { name: 'G', tabNotes: '(3.6 2.5 0.4 0.3 3.2 3.1)', bassNote: '0.3' }, // G
  8: { name: 'Ab', tabNotes: '(4.6 6.5 6.4 5.3 4.2 4.1)', bassNote: '6.4' }, // Ab
  9: { name: 'A', tabNotes: '(x.6 0.5 2.4 2.3 2.2 0.1)', bassNote: '2.3' }, // A
  10: { name: 'Bb', tabNotes: '(x.6 1.5 3.4 3.3 3.2 1.1)', bassNote: '3.3' }, // Bb
  11: { name: 'B', tabNotes: '(x.6 2.5 4.4 4.3 4.2 2.1)', bassNote: '4.3' }, // B
};

const SEVENTH_VOICINGS: Record<number, ChordTabVoicing> = {
  0: { name: 'C7', tabNotes: '(x.6 3.5 2.4 3.3 1.2 0.1)', bassNote: '3.3' },
  1: { name: 'C#7', tabNotes: '(x.6 4.5 3.4 4.3 2.2 1.1)', bassNote: '4.3' },
  2: { name: 'D7', tabNotes: '(x.6 x.5 0.4 2.3 1.2 2.1)', bassNote: '0.3' },
  3: { name: 'Eb7', tabNotes: '(x.6 x.5 1.4 3.3 2.2 3.1)', bassNote: '1.3' },
  4: { name: 'E7', tabNotes: '(0.6 2.5 0.4 1.3 0.2 0.1)', bassNote: '2.4' },
  5: { name: 'F7', tabNotes: '(1.6 3.5 1.4 2.3 1.2 1.1)', bassNote: '3.4' },
  6: { name: 'F#7', tabNotes: '(2.6 4.5 2.4 3.3 2.2 2.1)', bassNote: '4.4' },
  7: { name: 'G7', tabNotes: '(3.6 2.5 0.4 0.3 0.2 1.1)', bassNote: '0.3' },
  8: { name: 'Ab7', tabNotes: '(4.6 6.5 4.4 5.3 4.2 4.1)', bassNote: '6.4' },
  9: { name: 'A7', tabNotes: '(x.6 0.5 2.4 0.3 2.2 0.1)', bassNote: '2.3' },
  10: { name: 'Bb7', tabNotes: '(x.6 1.5 3.4 1.3 3.2 1.1)', bassNote: '3.3' },
  11: { name: 'B7', tabNotes: '(x.6 2.5 1.4 2.3 0.2 2.1)', bassNote: '4.3' },
};

/**
 * Generate a complete AlphaTex string for the selected root and scale.
 * The generated score has:
 * - Track 1: "Lead Guitar (Scale Practice)" with 8 empty bars (rests)
 * - Track 2: "Rhythm Guitar (Backing Track)" playing a progression in the chosen key
 * - Track 3: "Bass Guitar (Backing Track)" providing the low groove
 */
export function generateBackingTrackTex(
  rootPitchClass: number,
  scaleId: string,
  tempo: number = 90
): { tex: string; progressionName: string; chords: string[] } {
  const rootObj = ROOT_NOTES.find((r) => r.pitchClass === rootPitchClass) || ROOT_NOTES[9];
  const scale = SCALE_DEFINITIONS.find((s) => s.id === scaleId) || SCALE_DEFINITIONS[0];
  const root = rootObj.pitchClass;
  const rootName = rootObj.name;

  let chordProgression: ChordTabVoicing[] = [];
  let progressionName = '';

  if (scale.backingType === 'blues') {
    // 12-bar Blues Progression: I7 (4 bars), IV7 (2 bars), I7 (2 bars), V7, IV7, I7, V7
    const i7 = SEVENTH_VOICINGS[root];
    const iv7 = SEVENTH_VOICINGS[(root + 5) % 12];
    const v7 = SEVENTH_VOICINGS[(root + 7) % 12];

    chordProgression = [
      i7, i7, i7, i7,
      iv7, iv7, i7, i7,
      v7, iv7, i7, v7
    ];
    progressionName = `${rootName} Blues Shuffle (12-Bar Blues)`;
  } else if (scale.backingType === 'major') {
    // Major Key Progression: I - vi - IV - V (8 bars: I - vi - IV - V | I - vi - IV - V)
    const I = MAJOR_VOICINGS[root];
    const vi = MINOR_VOICINGS[(root + 9) % 12];
    const IV = MAJOR_VOICINGS[(root + 5) % 12];
    const V = MAJOR_VOICINGS[(root + 7) % 12];

    chordProgression = [I, vi, IV, V, I, vi, IV, V];
    progressionName = `${rootName} Major Pop/Acoustic Groove (${I.name} - ${vi.name} - ${IV.name} - ${V.name})`;
  } else {
    // Minor Key Progression: i - VII - VI - v (8 bars)
    const i = MINOR_VOICINGS[root];
    const VII = MAJOR_VOICINGS[(root + 10) % 12];
    const VI = MAJOR_VOICINGS[(root + 8) % 12];
    const v = MINOR_VOICINGS[(root + 7) % 12];

    chordProgression = [i, VII, VI, v, i, VII, VI, i];
    progressionName = `${rootName} Minor Rock/Ballad Groove (${i.name} - ${VII.name} - ${VI.name} - ${v.name})`;
  }

  const numBars = chordProgression.length;
  const chordNames = chordProgression.map((c) => c.name);

  // Build Lead Guitar Track (all whole-note rests)
  const leadBars = Array(numBars).fill(':1 r').join(' | ') + ' |';

  // Build Rhythm Guitar Track (quarter-note acoustic strum pattern: strum, strum, strum, strum)
  const rhythmBars = chordProgression
    .map((c) => `:4 ${c.tabNotes} ${c.tabNotes} ${c.tabNotes} ${c.tabNotes}`)
    .join(' | ') + ' |';

  // Build Bass Guitar Track
  const bassBars = chordProgression
    .map((c) => `:4 ${c.bassNote} ${c.bassNote} ${c.bassNote} ${c.bassNote}`)
    .join(' | ') + ' |';

  const tex = `\\title "Tab Kosong · Latihan Scale"
\\artist "TabKu Practice Studio"
\\tempo ${tempo}
.
\\track "Lead Guitar (Scale Practice)" "Lead"
\\instrument 29
\\tuning E4 B3 G3 D3 A2 E2
${leadBars}
.
\\track "Rhythm Backing Track" "Rhythm"
\\instrument 25
\\tuning E4 B3 G3 D3 A2 E2
${rhythmBars}
.
\\track "Bass Backing Track" "Bass"
\\instrument 33
\\tuning G2 D2 A1 E1
${bassBars}
`;

  return {
    tex,
    progressionName,
    chords: [...new Set(chordNames)],
  };
}
