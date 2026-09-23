export interface TabNote {
  string: number; // 1 = highest string (high E), 6 = lowest string (low E)
  fret: number; // 0 = open string, 1..24
  finger?: number; // 1 = index, 2 = middle, 3 = ring, 4 = pinky, 0 = thumb
  midiPitch: number;
  noteName: string; // e.g. "E4", "G#3"
  
  // Techniques
  isBend?: boolean;
  bendAmount?: number; // 0.5 (half step), 1.0 (full step), 1.5, 2.0
  isHammerPull?: boolean;
  hammerPullType?: 'hammer' | 'pull';
  isSlide?: boolean;
  slideType?: 'shift' | 'legato' | 'in' | 'out';
  slideToFret?: number;
  isVibrato?: boolean;
  isPalmMute?: boolean;
  isHarmonic?: boolean;
  isGhost?: boolean;
}

export interface TrackInfo {
  index: number;
  name: string;
  shortName?: string;
  instrument: string;
  tuning: number[]; // MIDI note values from highest string (index 0) to lowest string
  tuningNames: string[]; // e.g. ["E4", "B3", "G3", "D3", "A2", "E2"]
  stringCount: number;
  color?: string;
  isMuted: boolean;
  isSolo: boolean;
  volume: number;
  isPercussion?: boolean;
}

export interface ActiveChord {
  name: string; // e.g. "Am7", "G", "Cadd9", "E5"
  root: string; // e.g. "A", "G", "C", "E"
  quality: string; // "Minor 7th", "Major", "Power Chord"
  notes: string[]; // ["A", "C", "E", "G"]
  fretPositions: { string: number; fret: number; noteName: string }[];
}

export interface ActiveTechnique {
  type: 'bend' | 'hammer' | 'pull' | 'slide' | 'vibrato' | 'palmmute' | 'harmonic';
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  string: number;
  fret: number;
}
