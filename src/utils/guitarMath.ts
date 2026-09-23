const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/**
 * Convert a MIDI pitch number to a readable note name (e.g. 60 -> "C4", 64 -> "E4")
 */
export function midiToNoteName(midi: number, includeOctave = true): string {
  const noteIndex = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  const name = NOTE_NAMES[noteIndex];
  return includeOctave ? `${name}${octave}` : name;
}

/**
 * Convert string number and fret to MIDI pitch given the track tuning.
 * stringIndex is 1-based (1 = highest string, e.g. High E)
 */
export function getMidiPitch(stringIndex: number, fret: number, tuning: number[]): number {
  const baseTuning = tuning[stringIndex - 1] ?? 64;
  return baseTuning + fret;
}

/**
 * Calculate physical distance of a fret wire from the nut using the standard 12-TET rule:
 * d_n = scaleLength * (1 - 2^(-n / 12))
 */
export function getFretDistance(fretNumber: number, scaleLength: number = 20): number {
  if (fretNumber <= 0) return 0;
  return scaleLength * (1 - Math.pow(2, -fretNumber / 12));
}

/**
 * Get the center position of a fret space (where the player presses the string)
 */
export function getFretCenterDistance(fretNumber: number, scaleLength: number = 20): number {
  if (fretNumber === 0) return 0; // Open string at the nut
  const prevFret = getFretDistance(fretNumber - 1, scaleLength);
  const currFret = getFretDistance(fretNumber, scaleLength);
  // Press slightly behind the fret wire, roughly 65% across the fret towards the higher fret
  return prevFret + (currFret - prevFret) * 0.65;
}

/**
 * Check if a fret number has an inlay marker
 */
export function getFretInlayType(fretNumber: number): 'none' | 'single' | 'double' {
  if (fretNumber === 12 || fretNumber === 24) return 'double';
  if ([3, 5, 7, 9, 15, 17, 19, 21].includes(fretNumber)) return 'single';
  return 'none';
}

/**
 * Suggest ergonomic finger assignment (1=Index, 2=Middle, 3=Ring, 4=Pinky)
 * for a cluster of fretted notes played together or in sequence.
 */
export function estimateFingers(notes: { string: number; fret: number }[]): Map<number, number> {
  const result = new Map<number, number>(); // key: string, value: finger
  const fretted = notes.filter(n => n.fret > 0);
  if (fretted.length === 0) return result;

  const minFret = Math.min(...fretted.map(n => n.fret));
  
  for (const n of fretted) {
    const offset = n.fret - minFret;
    // Map offset 0->1(index), 1->2(middle), 2->3(ring), 3+->4(pinky)
    let finger = offset + 1;
    if (finger > 4) finger = 4;
    result.set(n.string, finger);
  }

  return result;
}

/**
 * Human-readable tuning description
 */
export function getTuningDescription(tuning: number[]): string {
  if (!tuning || tuning.length === 0) return 'Standard E';
  const notes = tuning.map(p => midiToNoteName(p, false));
  const noteStr = notes.join(' ');

  if (noteStr === 'E B G D A E') return 'Standard E (E A D G B E)';
  if (noteStr === 'E B G D A D') return 'Drop D (D A D G B E)';
  if (noteStr === 'D# A# F# C# G# D#' || noteStr === 'Eb Bb Gb Db Ab Eb') return 'Half Step Down (Eb)';
  if (noteStr === 'D A F C G D') return 'Full Step Down (D)';
  if (noteStr === 'D B G D A D') return 'Double Drop D';
  if (noteStr === 'D A G D A D') return 'DADGAD';
  if (noteStr === 'G D A E') return 'Standard Bass (E A D G)';
  
  return `Custom (${notes.slice().reverse().join(' ')})`;
}

/**
 * Formats time in seconds to mm:ss
 */
export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

const CHROMATIC_SCALE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const NOTE_TO_SEMITONE_MAP: Record<string, number> = {
  'C': 0, 'B#': 0,
  'C#': 1, 'Db': 1,
  'D': 2,
  'D#': 3, 'Eb': 3,
  'E': 4, 'Fb': 4,
  'F': 5, 'E#': 5,
  'F#': 6, 'Gb': 6,
  'G': 7,
  'G#': 8, 'Ab': 8,
  'A': 9,
  'A#': 10, 'Bb': 10,
  'B': 11, 'Cb': 11,
};

/**
 * Transpose a single note name by a number of semitones.
 * e.g. "A" + 2 -> "B", "C#" + 1 -> "D"
 */
export function transposeSingleNote(note: string, semitones: number): string {
  const clean = note.trim();
  if (!(clean in NOTE_TO_SEMITONE_MAP)) return note;
  const originalVal = NOTE_TO_SEMITONE_MAP[clean];
  const newVal = ((originalVal + semitones) % 12 + 12) % 12;
  return CHROMATIC_SCALE[newVal];
}

/**
 * Transpose a chord name (including root, modifiers, and slash bass notes).
 * e.g. "Am" + 2 -> "Bm", "D/F#" + 2 -> "E/G#", "C#m7" + 2 -> "D#m7"
 */
export function transposeChordName(chordName: string, semitones: number): string {
  if (!chordName || semitones === 0) return chordName;

  // Handle slash chords like D/F# or C/G
  if (chordName.includes('/')) {
    const parts = chordName.split('/');
    return `${transposeChordName(parts[0], semitones)}/${transposeChordName(parts[1], semitones)}`;
  }

  // Regex to match root note: e.g. "C#", "Bb", "A", "F#"
  const match = chordName.match(/^([A-G][#b]?)(.*)$/);
  if (!match) return chordName;

  const root = match[1];
  const suffix = match[2];
  const newRoot = transposeSingleNote(root, semitones);
  return `${newRoot}${suffix}`;
}

/**
 * Format transpose value for user-friendly UI display.
 * e.g. 0 -> "ORIGINAL", +1 -> "+1 (½)", +2 -> "+2 (1)", -1 -> "-1 (-½)"
 */
export function formatTranspose(semitones: number): string {
  if (semitones === 0) return '0';
  const sign = semitones > 0 ? '+' : '';
  return `${sign}${semitones}`;
}
