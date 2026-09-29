import { describe, it, expect } from 'vitest';
import {
  extractSongTimeline,
  getUpcomingHighwayBeats,
  getCurrentAndNextBeats,
  type SongTimeline,
  type ExtractedBeat,
} from './timelineExtractor';

describe('timelineExtractor', () => {
  describe('getUpcomingHighwayBeats', () => {
    const mockTimeline: SongTimeline = {
      beats: [
        {
          id: 'b1',
          startMs: 0,
          durationMs: 500,
          barIndex: 1,
          masterBarIndex: 0,
          notes: [{ string: 1, fret: 0, noteName: 'E4', midiPitch: 64 }],
          isRest: false,
        },
        {
          id: 'b2',
          startMs: 500,
          durationMs: 500,
          barIndex: 1,
          masterBarIndex: 0,
          notes: [{ string: 2, fret: 1, noteName: 'C4', midiPitch: 60 }],
          isRest: false,
        },
        {
          id: 'b3',
          startMs: 1000,
          durationMs: 500,
          barIndex: 1,
          masterBarIndex: 0,
          notes: [],
          isRest: true,
        },
        {
          id: 'b4',
          startMs: 3500,
          durationMs: 500,
          barIndex: 2,
          masterBarIndex: 1,
          notes: [{ string: 3, fret: 2, noteName: 'A3', midiPitch: 57 }],
          isRest: false,
        },
        {
          id: 'b5',
          startMs: 5000,
          durationMs: 500,
          barIndex: 3,
          masterBarIndex: 2,
          notes: [{ string: 1, fret: 3, noteName: 'G4', midiPitch: 67 }],
          isRest: false,
        },
      ],
      sections: [{ name: 'Intro', startMs: 0, barIndex: 1 }],
      totalDurationMs: 6000,
      trackIndex: 0,
      tuning: [64, 59, 55, 50, 45, 40],
      tuningNames: ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'],
    };

    it('returns empty array when timeline beats are empty', () => {
      const emptyTimeline: SongTimeline = {
        ...mockTimeline,
        beats: [],
      };
      const result = getUpcomingHighwayBeats(emptyTimeline, 0);
      expect(result).toEqual([]);
    });

    it('queries beats within default look-ahead window (3000ms)', () => {
      // At currentTimeMs = 0, window is [-150, 3000]
      // Beats: b1 (0ms), b2 (500ms), b3 (1000ms)
      const result = getUpcomingHighwayBeats(mockTimeline, 0);
      expect(result).toHaveLength(3);
      expect(result[0].beat.id).toBe('b1');
      expect(result[1].beat.id).toBe('b2');
      expect(result[2].beat.id).toBe('b3');
    });

    it('includes beats in threshold window (-150ms) for smooth strike line animation', () => {
      // At currentTimeMs = 100, b1 is at startMs = 0 (offset -100ms >= -150ms)
      const result = getUpcomingHighwayBeats(mockTimeline, 100);
      expect(result.some((item) => item.beat.id === 'b1')).toBe(true);
    });

    it('excludes beats that finished further in past (< -150ms)', () => {
      // At currentTimeMs = 600, b1 at 0ms is -600ms (< -150ms) -> excluded
      const result = getUpcomingHighwayBeats(mockTimeline, 600);
      expect(result.some((item) => item.beat.id === 'b1')).toBe(false);
      // b2 at 500ms (-100ms >= -150ms) is included
      expect(result.some((item) => item.beat.id === 'b2')).toBe(true);
    });

    it('calculates timeOffsetMs and progress correctly', () => {
      const lookAhead = 2000;
      const result = getUpcomingHighwayBeats(mockTimeline, 0, lookAhead);
      // b2 is at 500ms
      const b2Result = result.find((item) => item.beat.id === 'b2');
      expect(b2Result).toBeDefined();
      expect(b2Result?.timeOffsetMs).toBe(500);
      expect(b2Result?.progress).toBe(500 / 2000); // 0.25
    });

    it('clamps progress to [0, 1] range', () => {
      // For beat at 0ms when currentTimeMs is 50ms, timeOffsetMs is -50ms -> progress clamped to 0
      const result = getUpcomingHighwayBeats(mockTimeline, 50, 2000);
      const b1Result = result.find((item) => item.beat.id === 'b1');
      expect(b1Result?.progress).toBe(0);
    });

    it('stops scanning when beat startMs exceeds lookAhead window', () => {
      // With lookAhead = 1000, b4 (3500ms) and b5 (5000ms) are omitted
      const result = getUpcomingHighwayBeats(mockTimeline, 0, 1000);
      expect(result.length).toBe(3);
    });
  });

  describe('getCurrentAndNextBeats', () => {
    const beats: ExtractedBeat[] = [
      {
        id: 'b1',
        startMs: 0,
        durationMs: 500,
        barIndex: 1,
        masterBarIndex: 0,
        sectionName: 'Verse 1',
        notes: [{ string: 1, fret: 0, noteName: 'E4', midiPitch: 64 }],
        isRest: false,
      },
      {
        id: 'b2_rest',
        startMs: 500,
        durationMs: 250,
        barIndex: 1,
        masterBarIndex: 0,
        sectionName: 'Verse 1',
        notes: [],
        isRest: true,
      },
      {
        id: 'b3',
        startMs: 750,
        durationMs: 250,
        barIndex: 1,
        masterBarIndex: 0,
        sectionName: 'Verse 1',
        notes: [{ string: 2, fret: 3, noteName: 'D4', midiPitch: 62 }],
        isRest: false,
      },
      {
        id: 'b4',
        startMs: 2000,
        durationMs: 500,
        barIndex: 2,
        masterBarIndex: 1,
        sectionName: 'Chorus',
        notes: [{ string: 1, fret: 5, noteName: 'A4', midiPitch: 69 }],
        isRest: false,
      },
    ];

    const timeline: SongTimeline = {
      beats,
      sections: [
        { name: 'Verse 1', startMs: 0, barIndex: 1 },
        { name: 'Chorus', startMs: 2000, barIndex: 2 },
      ],
      totalDurationMs: 3000,
      trackIndex: 0,
      tuning: [64, 59, 55, 50, 45, 40],
      tuningNames: ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'],
    };

    it('identifies sounding currentBeat and immediate nextBeat during playback', () => {
      // At 200ms: inside b1 (0..500ms)
      const res = getCurrentAndNextBeats(timeline, 200);
      expect(res.currentBeat?.id).toBe('b1');
      expect(res.nextBeat?.id).toBe('b3'); // b2 is a rest, so b3 is the next playable note
      expect(res.currentSection).toBe('Verse 1');
      expect(res.nextSection).toBe('Chorus');
      expect(res.barIndex).toBe(1);
    });

    it('returns null for currentBeat during a rest beat', () => {
      // At 600ms: inside b2_rest (500..750ms)
      const res = getCurrentAndNextBeats(timeline, 600);
      expect(res.currentBeat).toBeNull();
      expect(res.nextBeat?.id).toBe('b3');
    });

    it('returns previous barIndex when in a gap before next beat', () => {
      // At 1200ms: gap between b3 (ends at 1000ms) and b4 (starts at 2000ms)
      const res = getCurrentAndNextBeats(timeline, 1200);
      expect(res.currentBeat).toBeNull();
      expect(res.nextBeat?.id).toBe('b4');
      expect(res.barIndex).toBe(1); // from previous beat
    });

    it('updates currentSection and nextSection when transitioning into new section', () => {
      // At 2100ms: inside b4 in Chorus
      const res = getCurrentAndNextBeats(timeline, 2100);
      expect(res.currentBeat?.id).toBe('b4');
      expect(res.currentSection).toBe('Chorus');
      // No more upcoming sections, so nextSection falls back to currentSection
      expect(res.nextSection).toBe('Chorus');
      expect(res.nextBeat).toBeNull();
    });

    it('returns null for both beats when playback exceeds song length', () => {
      const res = getCurrentAndNextBeats(timeline, 4000);
      expect(res.currentBeat).toBeNull();
      expect(res.nextBeat).toBeNull();
    });
  });

  describe('extractSongTimeline', () => {
    it('returns fallback standard tuning when score has no tracks', () => {
      const mockScore = {
        tracks: [],
        masterBars: [],
        tempo: 120,
      } as any;

      const result = extractSongTimeline(mockScore, 0);
      expect(result.beats).toHaveLength(0);
      expect(result.sections).toHaveLength(0);
      expect(result.totalDurationMs).toBe(0);
      expect(result.tuning).toEqual([64, 59, 55, 50, 45, 40]);
      expect(result.tuningNames).toEqual(['E4', 'B3', 'G3', 'D3', 'A2', 'E2']);
      expect(result.transpose).toBe(0);
    });

    it('applies transposition to track tuning', () => {
      const mockScore = {
        tracks: [{ index: 0, staves: [] }],
        masterBars: [],
        tempo: 120,
      } as any;

      const result = extractSongTimeline(mockScore, 0, 2);
      expect(result.transpose).toBe(2);
      // E4(64)+2=66(F#4), B3(59)+2=61(C#4), G3(55)+2=57(A3), D3(50)+2=52(E3), A2(45)+2=47(B2), E2(40)+2=42(F#2)
      expect(result.tuning).toEqual([66, 61, 57, 52, 47, 42]);
      expect(result.tuningNames).toEqual(['F#4', 'C#4', 'A3', 'E3', 'B2', 'F#2']);
    });

    it('extracts masterBar timeline, sections, tempo automations, and metronome clicks', () => {
      const mockScore = {
        tempo: 120,
        masterBars: [
          {
            section: { text: 'Intro' },
            tempoAutomations: [{ value: 120 }],
            calculateDuration: () => 3840, // 4 beats * 960 ticks = 3840 ticks (2000ms at 120bpm)
            timeSignatureNumerator: 4,
            timeSignatureDenominator: 4,
          },
          {
            section: { text: 'Verse' },
            tempoAutomations: [{ value: 60 }],
            calculateDuration: () => 3840, // at 60bpm, 3840 ticks = 4000ms
            timeSignatureNumerator: 4,
            timeSignatureDenominator: 4,
          },
        ],
        tracks: [
          {
            index: 0,
            staves: [
              {
                tuning: [64, 59, 55, 50, 45, 40],
                bars: [
                  {
                    voices: [
                      {
                        index: 0,
                        beats: [
                          {
                            playbackStart: 0,
                            playbackDuration: 960,
                            isRest: false,
                            notes: [
                              {
                                string: 6, // AlphaTab string 6 is highest string (High E) in 6-string
                                fret: 0,
                                realValue: 64,
                                bendPoints: [],
                                isHarmonic: false,
                                isGhost: false,
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      } as any;

      const timeline = extractSongTimeline(mockScore, 0);

      // Total duration = 2000ms (bar 1) + 4000ms (bar 2) = 6000ms
      expect(timeline.totalDurationMs).toBeCloseTo(6000);
      expect(timeline.sections).toHaveLength(2);
      expect(timeline.sections[0].name).toBe('Intro');
      expect(timeline.sections[0].startMs).toBe(0);
      expect(timeline.sections[1].name).toBe('Verse');
      expect(timeline.sections[1].startMs).toBeCloseTo(2000);

      // Metronome clicks: 4 beats per bar * 2 bars = 8 clicks
      expect(timeline.metronomeBeats).toBeDefined();
      expect(timeline.metronomeBeats?.length).toBe(8);
      expect(timeline.metronomeBeats?.[0].isStrong).toBe(true);
      expect(timeline.metronomeBeats?.[1].isStrong).toBe(false);

      // Note physical string conversion: 6 strings - 6 + 1 = 1 (High E)
      expect(timeline.beats).toHaveLength(1);
      const note = timeline.beats[0].notes[0];
      expect(note.string).toBe(1);
      expect(note.noteName).toBe('E4');
    });

    it('extracts note techniques: bend, slide, hammer-on, vibrato', () => {
      const mockScore = {
        tempo: 120,
        masterBars: [
          {
            calculateDuration: () => 3840,
            timeSignatureNumerator: 4,
            timeSignatureDenominator: 4,
          },
        ],
        tracks: [
          {
            index: 0,
            staves: [
              {
                tuning: [64, 59, 55, 50, 45, 40],
                bars: [
                  {
                    voices: [
                      {
                        index: 0,
                        beats: [
                          {
                            playbackStart: 0,
                            playbackDuration: 960,
                            isRest: false,
                            notes: [
                              {
                                string: 5,
                                fret: 7,
                                realValue: 59,
                                bendPoints: [{ value: 4 }], // Full bend
                                slideInType: 1,
                                slideTarget: { fret: 9 },
                                vibrato: 1,
                                isHammerPullOrigin: true,
                                isHarmonic: true,
                                isGhost: true,
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      } as any;

      const timeline = extractSongTimeline(mockScore, 0);
      const note = timeline.beats[0].notes[0];

      expect(note.isBend).toBe(true);
      expect(note.bendAmount).toBe(1); // 4 / 4 = 1.0
      expect(note.isSlide).toBe(true);
      expect(note.slideToFret).toBe(9);
      expect(note.isVibrato).toBe(true);
      expect(note.isHammerPull).toBe(true);
      expect(note.hammerPullType).toBe('hammer');
      expect(note.isHarmonic).toBe(true);
      expect(note.isGhost).toBe(true);
    });

    it('detects chord on multi-note beats and handles chord transposition', () => {
      const mockScore = {
        tempo: 120,
        masterBars: [
          {
            calculateDuration: () => 3840,
            timeSignatureNumerator: 4,
            timeSignatureDenominator: 4,
          },
        ],
        tracks: [
          {
            index: 0,
            staves: [
              {
                tuning: [64, 59, 55, 50, 45, 40],
                bars: [
                  {
                    voices: [
                      {
                        index: 0,
                        beats: [
                          {
                            playbackStart: 0,
                            playbackDuration: 960,
                            isRest: false,
                            chord: { name: 'Am' },
                            notes: [
                              { string: 1, fret: 0, realValue: 40 },
                              { string: 2, fret: 2, realValue: 47 },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      } as any;

      // With transpose +2, 'Am' should transpose to 'Bm'
      const timeline = extractSongTimeline(mockScore, 0, 2);
      expect(timeline.beats[0].chordName).toBe('Bm');
    });
  });
});
