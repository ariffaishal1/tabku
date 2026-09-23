import * as alphaTab from '@coderline/alphatab';
import { midiToNoteName, transposeChordName } from '../utils/guitarMath';
import { detectChord } from './chordDetector';

export interface ExtractedNote {
  string: number; // 1 = highest string (e.g. 1 is High E, 6 is Low E)
  fret: number; // 0..24
  noteName: string; // e.g. "G3"
  midiPitch: number;
  isBend?: boolean;
  bendAmount?: number;
  isSlide?: boolean;
  slideToFret?: number;
  isHammerPull?: boolean;
  hammerPullType?: 'hammer' | 'pull';
  isVibrato?: boolean;
  isHarmonic?: boolean;
  isPalmMute?: boolean;
  isGhost?: boolean;
}

export interface ExtractedBeat {
  id: string;
  startMs: number;
  durationMs: number;
  barIndex: number;
  masterBarIndex: number;
  sectionName?: string;
  chordName?: string;
  notes: ExtractedNote[];
  isRest: boolean;
}

export interface SectionMarker {
  name: string;
  startMs: number;
  barIndex: number;
}

export interface MetronomeClick {
  timeMs: number;
  barIndex: number;
  beatNumber: number;
  isStrong: boolean;
}

export interface SongTimeline {
  beats: ExtractedBeat[];
  sections: SectionMarker[];
  totalDurationMs: number;
  trackIndex: number;
  tuning: number[];
  tuningNames: string[];
  metronomeBeats?: MetronomeClick[];
  timeSignature?: string;
  transpose?: number;
}

const TICKS_PER_QUARTER = 960;

/**
 * Extracts a structured timeline of beats, notes, and sections from an AlphaTab score
 * for the given track, with optional pitch transposition.
 */
export function extractSongTimeline(
  score: alphaTab.model.Score,
  trackIndex: number,
  transpose: number = 0
): SongTimeline {
  const targetTrack = score.tracks.find((t) => t.index === trackIndex) || score.tracks[0];
  if (!targetTrack) {
    return {
      beats: [],
      sections: [],
      totalDurationMs: 0,
      trackIndex: 0,
      tuning: [64, 59, 55, 50, 45, 40],
      tuningNames: ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'],
      transpose,
    };
  }

  const staff = targetTrack.staves && targetTrack.staves.length > 0 ? targetTrack.staves[0] : null;
  const baseTuning: number[] = staff?.tuning ? Array.from(staff.tuning) : [64, 59, 55, 50, 45, 40];
  const tuning: number[] = transpose !== 0 ? baseTuning.map((p) => p + transpose) : baseTuning;
  const tuningNames = tuning.map((p) => midiToNoteName(p));

  // 1. Calculate MasterBar timeline (tempo, startMs, durationMs, section)
  let currentTempo = score.tempo || 120;
  let currentAccumulatedMs = 0;
  const masterBarTimeline: {
    index: number;
    startMs: number;
    durationMs: number;
    tempo: number;
    sectionName: string;
  }[] = [];

  const sections: SectionMarker[] = [];
  let currentSectionName = 'Intro';
  const metronomeBeats: MetronomeClick[] = [];

  for (let i = 0; i < score.masterBars.length; i++) {
    const mb = score.masterBars[i];

    // Check for section
    if (mb.section && mb.section.text) {
      currentSectionName = mb.section.text;
      sections.push({
        name: currentSectionName,
        startMs: currentAccumulatedMs,
        barIndex: i + 1,
      });
    }

    // Check for tempo automation
    if (mb.tempoAutomations && mb.tempoAutomations.length > 0) {
      currentTempo = mb.tempoAutomations[0].value;
    }

    // Calculate bar duration in ticks
    const durationTicks = mb.calculateDuration();
    // Milliseconds per tick = 60000 / (BPM * 960)
    const msPerTick = 60000 / (currentTempo * TICKS_PER_QUARTER);
    const barDurationMs = durationTicks * msPerTick;

    // Generate metronome beat pulses for this bar
    const numBeats = mb.timeSignatureNumerator || 4;
    const beatDurationMs = barDurationMs / numBeats;
    for (let b = 0; b < numBeats; b++) {
      metronomeBeats.push({
        timeMs: currentAccumulatedMs + b * beatDurationMs,
        barIndex: i + 1,
        beatNumber: b + 1,
        isStrong: b === 0,
      });
    }

    masterBarTimeline.push({
      index: i,
      startMs: currentAccumulatedMs,
      durationMs: barDurationMs,
      tempo: currentTempo,
      sectionName: currentSectionName,
    });

    currentAccumulatedMs += barDurationMs;
  }

  if (sections.length === 0) {
    sections.push({
      name: 'Main Section',
      startMs: 0,
      barIndex: 1,
    });
  }

  // 2. Extract Beats from the active track
  const beats: ExtractedBeat[] = [];

  if (staff && staff.bars) {
    for (let barIdx = 0; barIdx < staff.bars.length; barIdx++) {
      const bar = staff.bars[barIdx];
      const mbInfo = masterBarTimeline[barIdx] || {
        startMs: 0,
        durationMs: 2000,
        tempo: currentTempo,
        sectionName: 'Main',
      };
      const msPerTick = 60000 / (mbInfo.tempo * TICKS_PER_QUARTER);

      for (const voice of bar.voices) {
        for (let beatIdx = 0; beatIdx < voice.beats.length; beatIdx++) {
          const beat = voice.beats[beatIdx];

          // Beat start in ms = bar start ms + (playbackStart * msPerTick)
          const beatStartMs = mbInfo.startMs + beat.playbackStart * msPerTick;
          const beatDurationMs = Math.max(beat.playbackDuration * msPerTick, 50);

          const rawNotes = beat.notes || [];
          const isRest = rawNotes.length === 0 || beat.isRest;

          const numStrings = tuning.length;
          const extractedNotes: ExtractedNote[] = rawNotes.map((n) => {
            // AlphaTab menggunakan 1 untuk senar bass terbawah dan numStrings untuk senar nada tertinggi.
            // Konversi ke penomoran fisik tablatur standar: Senar 1 (High E / nada tertinggi) di atas, Senar numStrings (Low E / nada terendah) di bawah.
            const physicalString = numStrings - n.string + 1;
            const f = Math.max(0, n.fret + transpose);
            const midiPitch = n.realValue + transpose;

            const isBend = (n.bendPoints && n.bendPoints.length > 0) || false;
            let bendAmount = 1.0;
            if (isBend && n.bendPoints && n.bendPoints.length > 0) {
              const maxVal = Math.max(...n.bendPoints.map((bp) => bp.value));
              bendAmount = maxVal / 4;
            }

            const isSlide =
              (n.slideInType !== undefined && (n.slideInType as number) > 0) ||
              (n.slideOutType !== undefined && (n.slideOutType as number) > 0) ||
              n.slideTarget !== null;

            const isVibrato = n.vibrato !== undefined && (n.vibrato as number) > 0;

            return {
              string: physicalString,
              fret: f,
              noteName: midiToNoteName(midiPitch),
              midiPitch,
              isBend,
              bendAmount,
              isSlide,
              slideToFret: n.slideTarget ? Math.max(0, n.slideTarget.fret + transpose) : undefined,
              isHammerPull: n.isHammerPullOrigin,
              hammerPullType: n.isHammerPullOrigin ? 'hammer' : 'pull',
              isVibrato,
              isHarmonic: n.isHarmonic,
              isPalmMute: (n as any).isPalmMute ?? false,
              isGhost: n.isGhost,
            };
          });

          // Detect chord if multi-notes (with transposition support)
          let chordName = beat.chord?.name ? transposeChordName(beat.chord.name, transpose) : undefined;
          if (!chordName && extractedNotes.length > 1) {
            const detected = detectChord(extractedNotes as any);
            if (detected) chordName = detected.name;
          }

          beats.push({
            id: `b_${barIdx}_${voice.index}_${beatIdx}`,
            startMs: beatStartMs,
            durationMs: beatDurationMs,
            barIndex: barIdx + 1,
            masterBarIndex: barIdx,
            sectionName: mbInfo.sectionName,
            chordName,
            notes: extractedNotes,
            isRest,
          });
        }
      }
    }
  }

  // Sort beats by startMs
  beats.sort((a, b) => a.startMs - b.startMs);

  const timeSignature = score.masterBars.length > 0
    ? `${score.masterBars[0].timeSignatureNumerator || 4}/${score.masterBars[0].timeSignatureDenominator || 4}`
    : '4/4';

  return {
    beats,
    sections,
    totalDurationMs: currentAccumulatedMs,
    trackIndex: targetTrack.index,
    tuning,
    tuningNames,
    metronomeBeats,
    timeSignature,
    transpose,
  };
}

/**
 * Query beats that fall within the look-ahead window [currentTimeMs, currentTimeMs + lookAheadMs].
 */
export function getUpcomingHighwayBeats(
  timeline: SongTimeline,
  currentTimeMs: number,
  lookAheadMs: number = 3000
): { beat: ExtractedBeat; timeOffsetMs: number; progress: number }[] {
  const windowEndMs = currentTimeMs + lookAheadMs;
  const result: { beat: ExtractedBeat; timeOffsetMs: number; progress: number }[] = [];

  // Slight threshold (-150ms) to allow notes right on the strike line to finish playing smoothly
  const minTime = currentTimeMs - 150;

  for (const b of timeline.beats) {
    if (b.startMs >= minTime && b.startMs <= windowEndMs) {
      // Include both note beats and rest beats (for rest marker visualization)
      if (b.notes.length > 0 || b.isRest) {
        const timeOffsetMs = b.startMs - currentTimeMs;
        const progress = Math.max(0, Math.min(1, timeOffsetMs / lookAheadMs));
        result.push({
          beat: b,
          timeOffsetMs,
          progress,
        });
      }
    } else if (b.startMs > windowEndMs) {
      break;
    }
  }

  return result;
}

/**
 * Returns currently sounding beat (NOW) and immediate next attack beat (NEXT).
 */
export function getCurrentAndNextBeats(
  timeline: SongTimeline,
  currentTimeMs: number
): {
  currentBeat: ExtractedBeat | null;
  nextBeat: ExtractedBeat | null;
  currentSection: string;
  nextSection: string;
  barIndex: number;
} {
  let currentBeat: ExtractedBeat | null = null;
  let nextBeat: ExtractedBeat | null = null;
  let currentSection = 'Main Section';
  let nextSection = '';
  let barIndex = 1;

  for (let i = 0; i < timeline.beats.length; i++) {
    const b = timeline.beats[i];
    const isCurrent = currentTimeMs >= b.startMs && currentTimeMs < b.startMs + b.durationMs;

    if (isCurrent && !b.isRest) {
      currentBeat = b;
      barIndex = b.barIndex;
      if (b.sectionName) currentSection = b.sectionName;
    }

    if (b.startMs > currentTimeMs && !b.isRest && b.notes.length > 0) {
      if (!nextBeat) {
        nextBeat = b;
        if (!currentBeat && i > 0) {
          // If in gap before next beat, use previous beat's bar info
          barIndex = timeline.beats[i - 1].barIndex;
        }
      }
    }

    if (currentBeat && nextBeat) break;
  }

  // Find next section
  const upcomingSec = timeline.sections.find((s) => s.startMs > currentTimeMs);
  if (upcomingSec) {
    nextSection = upcomingSec.name;
  } else {
    nextSection = currentSection;
  }

  return {
    currentBeat,
    nextBeat,
    currentSection,
    nextSection,
    barIndex,
  };
}
