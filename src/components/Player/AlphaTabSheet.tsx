import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import * as alphaTab from '@coderline/alphatab';
import type { TabNote, TrackInfo, ActiveChord, ActiveTechnique } from '../../types/guitar';
import { extractSongTimeline, type SongTimeline } from '../../services/timelineExtractor';
import { detectChord } from '../../services/chordDetector';
import { midiToNoteName, estimateFingers } from '../../utils/guitarMath';

export interface AlphaTabSheetRef {
  playPause: () => void;
  stop: () => void;
  setSpeed: (speed: number) => void;
  seek: (seconds: number) => void;
  setVolume: (volume: number) => void;
  setLoop: (loop: boolean) => void;
  changeTrack: (trackIndex: number) => void;
  loadTex: (tex: string) => void;
  loadFile: (file: File) => void;
  toggleMute: (trackIndex: number) => void;
  toggleSolo: (trackIndex: number) => void;
}

interface AlphaTabSheetProps {
  initialTex?: string;
  activeTrackIndex: number;
  onTracksLoaded: (tracks: TrackInfo[], activeIndex: number) => void;
  onSongInfoLoaded: (title: string, artist: string, tempo: number, timeSignature?: string) => void;
  onActiveNotesChange: (notes: TabNote[], chord: ActiveChord | null) => void;
  onTechniqueChange: (technique: ActiveTechnique | null) => void;
  onPlayerPositionChange: (currentSeconds: number, totalSeconds: number) => void;
  onCurrentTimeMsChange?: (currentTimeMs: number) => void;
  onTimelineLoaded?: (timeline: SongTimeline) => void;
  onPlayerStateChange: (isPlaying: boolean) => void;
  isExpanded: boolean;
}

export const AlphaTabSheet = forwardRef<AlphaTabSheetRef, AlphaTabSheetProps>(({
  initialTex,
  activeTrackIndex,
  onTracksLoaded,
  onSongInfoLoaded,
  onActiveNotesChange,
  onTechniqueChange,
  onPlayerPositionChange,
  onCurrentTimeMsChange,
  onTimelineLoaded,
  onPlayerStateChange,
  isExpanded,
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<alphaTab.AlphaTabApi | null>(null);
  const activeTrackIndexRef = useRef(activeTrackIndex);

  const callbacksRef = useRef({
    onTracksLoaded,
    onSongInfoLoaded,
    onActiveNotesChange,
    onTechniqueChange,
    onPlayerPositionChange,
    onCurrentTimeMsChange,
    onTimelineLoaded,
    onPlayerStateChange,
  });

  useEffect(() => {
    callbacksRef.current = {
      onTracksLoaded,
      onSongInfoLoaded,
      onActiveNotesChange,
      onTechniqueChange,
      onPlayerPositionChange,
      onCurrentTimeMsChange,
      onTimelineLoaded,
      onPlayerStateChange,
    };
  });

  // Keep activeTrackIndexRef updated in event closures
  useEffect(() => {
    activeTrackIndexRef.current = activeTrackIndex;
  }, [activeTrackIndex]);

  // Expose control methods to parent
  useImperativeHandle(ref, () => ({
    playPause: () => {
      const api = apiRef.current;
      if (!api) return;
      if (api.isReadyForPlayback) {
        api.playPause();
      } else {
        console.log('[AlphaTab] Menunggu audio player siap...');
        // Subscribe to playerReady once
        const handler = () => {
          api.playPause();
        };
        api.playerReady.on(handler);
      }
    },
    stop: () => {
      apiRef.current?.stop();
    },
    setSpeed: (speed: number) => {
      if (apiRef.current) {
        apiRef.current.playbackSpeed = speed;
      }
    },
    seek: (seconds: number) => {
      if (apiRef.current) {
        apiRef.current.timePosition = seconds * 1000;
      }
    },
    setVolume: (vol: number) => {
      if (apiRef.current) {
        apiRef.current.masterVolume = vol;
      }
    },
    setLoop: (loop: boolean) => {
      if (apiRef.current) {
        apiRef.current.isLooping = loop;
      }
    },
    changeTrack: (trackIndex: number) => {
      if (apiRef.current && apiRef.current.score) {
        const targetTrack = apiRef.current.score.tracks.find(t => t.index === trackIndex);
        if (targetTrack) {
          apiRef.current.renderTracks([targetTrack]);
          const timeline = extractSongTimeline(apiRef.current.score, trackIndex);
          callbacksRef.current.onTimelineLoaded?.(timeline);
        }
      }
    },
    loadTex: (tex: string) => {
      if (apiRef.current) {
        apiRef.current.tex(tex);
      }
    },
    loadFile: async (file: File) => {
      if (apiRef.current) {
        const buffer = await file.arrayBuffer();
        apiRef.current.load(new Uint8Array(buffer));
      }
    },
    toggleMute: (trackIndex: number) => {
      if (apiRef.current && apiRef.current.score) {
        const track = apiRef.current.score.tracks.find(t => t.index === trackIndex);
        if (track) {
          track.playbackInfo.isMute = !track.playbackInfo.isMute;
          apiRef.current.changeTrackMute([track], track.playbackInfo.isMute);
        }
      }
    },
    toggleSolo: (trackIndex: number) => {
      if (apiRef.current && apiRef.current.score) {
        const track = apiRef.current.score.tracks.find(t => t.index === trackIndex);
        if (track) {
          track.playbackInfo.isSolo = !track.playbackInfo.isSolo;
          apiRef.current.changeTrackSolo([track], track.playbackInfo.isSolo);
        }
      }
    },
  }));

  // Initialize AlphaTab
  useEffect(() => {
    if (!containerRef.current) return;

    const api = new alphaTab.AlphaTabApi(containerRef.current, {
      core: {
        fontDirectory: '/font/',
      },
      display: {
        staveProfile: alphaTab.StaveProfile.ScoreTab,
        scale: 0.9,
      },
      player: {
        enablePlayer: true,
        soundFont: '/soundfont/sonivox.sf2',
      },
    });

    apiRef.current = api;

    if (initialTex) {
      api.tex(initialTex);
    }

    // 1. Score Loaded Event
    api.scoreLoaded.on((score) => {
      const songTitle = score.title || 'Untitled Tab';
      const songArtist = score.artist || 'Unknown Artist';
      const tempo = score.tempo || 120;
      const timeSignature = score.masterBars && score.masterBars.length > 0
        ? `${score.masterBars[0].timeSignatureNumerator || 4}/${score.masterBars[0].timeSignatureDenominator || 4}`
        : '4/4';
      callbacksRef.current.onSongInfoLoaded(songTitle, songArtist, tempo, timeSignature);

      // Extract tracks
      const tracks: TrackInfo[] = score.tracks.map((t) => {
        const staff = t.staves && t.staves.length > 0 ? t.staves[0] : null;
        const tuningArr: number[] = staff?.tuning ? Array.from(staff.tuning) : [64, 59, 55, 50, 45, 40];
        return {
          index: t.index,
          name: t.name || `Track ${t.index + 1}`,
          shortName: t.shortName || undefined,
          instrument: 'Guitar',
          tuning: tuningArr,
          tuningNames: tuningArr.map((p: number) => midiToNoteName(p)),
          stringCount: tuningArr.length,
          isMuted: t.playbackInfo ? t.playbackInfo.isMute : false,
          isSolo: t.playbackInfo ? t.playbackInfo.isSolo : false,
          volume: t.playbackInfo ? t.playbackInfo.volume / 16 : 1,
          isPercussion: t.isPercussion,
        };
      });

      const initialActiveIndex = tracks.length > 0 ? tracks[0].index : 0;
      callbacksRef.current.onTracksLoaded(tracks, initialActiveIndex);
      const timeline = extractSongTimeline(score, initialActiveIndex);
      callbacksRef.current.onTimelineLoaded?.(timeline);
    });

    // 2. Played Beat Changed Event (Core sync between Audio/Notation and 3D Fretboard)
    api.playedBeatChanged.on((beat) => {
      if (!beat) {
        callbacksRef.current.onActiveNotesChange([], null);
        callbacksRef.current.onTechniqueChange(null);
        return;
      }

      // Check if this beat belongs to the currently active track
      const beatTrack = beat.voice?.bar?.staff?.track;
      if (beatTrack && beatTrack.index !== activeTrackIndexRef.current) {
        // If this beat is from another track, do not update the visualizer
        return;
      }

      const beatStaff = beat.voice?.bar?.staff;
      const activeTuning: number[] = beatStaff?.tuning ? Array.from(beatStaff.tuning) : [64, 59, 55, 50, 45, 40];
      const rawNotes = beat.notes || [];

      // Map to TabNote
      const numStrings = activeTuning.length;
      const tabNotes: TabNote[] = rawNotes.map((n) => {
        // AlphaTab menggunakan 1 untuk senar bass terbawah dan numStrings untuk senar nada tertinggi.
        // Konversi ke penomoran fisik standar: Senar 1 (High E / nada tertinggi), Senar 6 (Low E / nada terendah)
        const physicalString = numStrings - n.string + 1;
        const f = n.fret;
        const midiPitch = n.realValue;

        // Bending detection
        const isBend = (n.bendPoints && n.bendPoints.length > 0) || false;
        let bendAmount = 1.0; // Default full bend
        if (isBend && n.bendPoints && n.bendPoints.length > 0) {
          const maxPoint = Math.max(...n.bendPoints.map((bp) => bp.value));
          bendAmount = maxPoint / 4; // in alphaTab quarter tones (4 = 1 whole step)
        }

        const isSlide = (n.slideInType !== undefined && (n.slideInType as number) > 0) ||
                        (n.slideOutType !== undefined && (n.slideOutType as number) > 0) ||
                        n.slideTarget !== null;

        const isVibrato = n.vibrato !== undefined && (n.vibrato as number) > 0;

        return {
          string: physicalString,
          fret: f,
          midiPitch,
          noteName: midiToNoteName(midiPitch),
          duration: beat.duration,
          isBend,
          bendAmount,
          isHammerPull: n.isHammerPullOrigin,
          hammerPullType: n.isHammerPullOrigin ? 'hammer' : 'pull',
          isSlide,
          slideToFret: n.slideTarget ? n.slideTarget.fret : undefined,
          isVibrato,
          isPalmMute: (n as any).isPalmMute ?? false,
          isHarmonic: n.isHarmonic,
          isGhost: n.isGhost,
        };
      });

      // Finger calculation heuristic
      const fingerMap = estimateFingers(tabNotes);
      tabNotes.forEach((tn) => {
        if (fingerMap.has(tn.string)) {
          tn.finger = fingerMap.get(tn.string);
        }
      });

      // Detect chord name from notes
      const chord = detectChord(tabNotes, beat.chord?.name);
      callbacksRef.current.onActiveNotesChange(tabNotes, chord);

      // Detect technique for beginner HUD
      const bentNote = tabNotes.find((n) => n.isBend);
      const hammerNote = tabNotes.find((n) => n.isHammerPull);
      const slideNote = tabNotes.find((n) => n.isSlide);
      const vibratoNote = tabNotes.find((n) => n.isVibrato);

      if (bentNote) {
        const stepLabel = bentNote.bendAmount && bentNote.bendAmount >= 1.0 ? 'Full Bend (1 Nada)' : 'Half Bend (½ Nada)';
        callbacksRef.current.onTechniqueChange({
          type: 'bend',
          title: `String Bending (${stepLabel})`,
          subtitle: `Senar ${bentNote.string} Fret ${bentNote.fret}`,
          description: 'Dorong/tarik senar ke arah atas menggunakan kekuatan pergelangan tangan agar nada naik.',
          badge: 'BEND',
          string: bentNote.string,
          fret: bentNote.fret,
        });
      } else if (hammerNote) {
        callbacksRef.current.onTechniqueChange({
          type: 'hammer',
          title: 'Hammer-on / Pull-off',
          subtitle: `Senar ${hammerNote.string} Fret ${hammerNote.fret}`,
          description: 'Ketuk fret baru dengan tegas tanpa memetik ulang, atau cungkil senar ke bawah untuk pull-off.',
          badge: 'H / P',
          string: hammerNote.string,
          fret: hammerNote.fret,
        });
      } else if (slideNote) {
        callbacksRef.current.onTechniqueChange({
          type: 'slide',
          title: 'Fret Slide',
          subtitle: `Senar ${slideNote.string} Fret ${slideNote.fret}`,
          description: 'Luncurkan jari ke fret target sambil tetap mempertahankan tekanan pada senar.',
          badge: 'SLIDE',
          string: slideNote.string,
          fret: slideNote.fret,
        });
      } else if (vibratoNote) {
        callbacksRef.current.onTechniqueChange({
          type: 'vibrato',
          title: 'Vibrato',
          subtitle: `Senar ${vibratoNote.string} Fret ${vibratoNote.fret}`,
          description: 'Goyangkan pergelangan tangan secara rileks dan berirama untuk menghidupkan resonansi nada.',
          badge: 'VIB',
          string: vibratoNote.string,
          fret: vibratoNote.fret,
        });
      } else {
        callbacksRef.current.onTechniqueChange(null);
      }
    });

    // 3. Player Position Changed Event
    api.playerPositionChanged.on((args) => {
      const currentSec = args.currentTime / 1000;
      const totalSec = args.endTime / 1000;
      callbacksRef.current.onPlayerPositionChange(currentSec, totalSec);
      callbacksRef.current.onCurrentTimeMsChange?.(args.currentTime);
    });

    // 4. Player State Changed Event
    api.playerStateChanged.on((args) => {
      callbacksRef.current.onPlayerStateChange(args.state === 1); // 1 = Playing
    });

    // 5. SoundFont & Player Ready Events
    api.soundFontLoaded.on(() => {
      console.log('[AlphaTab] SoundFont loaded');
    });

    api.playerReady.on(() => {
      console.log('[AlphaTab] Player ready');
    });

    api.midiLoaded.on((e) => {
      callbacksRef.current.onPlayerPositionChange(0, e.endTime / 1000);
    });

    return () => {
      api.destroy();
      apiRef.current = null;
    };
  }, []);

  return (
    <div
      style={{
        height: isExpanded ? '230px' : '0px',
        overflow: 'hidden',
        backgroundColor: '#ffffff',
        borderTop: isExpanded ? '1px solid var(--border-medium)' : 'none',
        position: 'relative',
        transition: 'height 0.2s ease',
      }}
    >
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '230px',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      />
    </div>
  );
});
