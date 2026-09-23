import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { TopNav } from './components/Header/TopNav';
import { TrackSelector } from './components/Header/TrackSelector';
import { StringFlowHighway } from './components/StringFlow/StringFlowHighway';
import { FlatFretboard2D } from './components/FlatFretboard/FlatFretboard2D';
import { TelemetryBar } from './components/Telemetry/TelemetryBar';
import { AlphaTabSheet, type AlphaTabSheetRef } from './components/Player/AlphaTabSheet';
import { PRESET_SONGS } from './services/presetTabs';
import {
  type SongTimeline,
  type ExtractedNote,
  getCurrentAndNextBeats,
} from './services/timelineExtractor';
import { metronome } from './services/metronome';
import type { TabNote, TrackInfo, ActiveChord, ActiveTechnique } from './types/guitar';
import { generateBackingTrackTex, type ScaleDisplayMode } from './services/scaleTheory';

export const App: React.FC = () => {
  const alphaTabRef = useRef<AlphaTabSheetRef>(null);

  // Song & Track State
  const [selectedPresetId, setSelectedPresetId] = useState<string>(PRESET_SONGS[0].id);
  const [songTitle, setSongTitle] = useState<string>(PRESET_SONGS[0].title);
  const [songArtist, setSongArtist] = useState<string>(PRESET_SONGS[0].artist);
  const [tempo, setTempo] = useState<number>(PRESET_SONGS[0].tempo);
  const [tracks, setTracks] = useState<TrackInfo[]>([]);
  const [activeTrackIndex, setActiveTrackIndex] = useState<number>(0);

  // Playback & Timing State
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTimeMs, setCurrentTimeMs] = useState<number>(0);
  const [durationSec, setDurationSec] = useState<number>(0);
  const [speed, setSpeed] = useState<number>(1.0);
  const [isSoloSlowdown, setIsSoloSlowdown] = useState<boolean>(false);
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.8);
  const [isSheetExpanded, setIsSheetExpanded] = useState<boolean>(false);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);

  // Metronome & Count-In State
  const [timeSignature, setTimeSignature] = useState<string>('4/4');
  const [isMetronomeOn, setIsMetronomeOn] = useState<boolean>(false);
  const [metronomeVolume, setMetronomeVolume] = useState<number>(0.7);
  const [isCountInEnabled, setIsCountInEnabled] = useState<boolean>(false);
  const [isCountingIn, setIsCountingIn] = useState<boolean>(false);
  const [countInBeat, setCountInBeat] = useState<number>(0);

  const isMetronomeOnRef = useRef<boolean>(false);
  const isCountingInRef = useRef<boolean>(false);
  const countInTimeoutsRef = useRef<number[]>([]);
  const lastScheduledBeatTimeRef = useRef<number>(-1);
  const timelineRef = useRef<SongTimeline | null>(null);
  const tempoRef = useRef<number>(tempo);
  const timeSignatureRef = useRef<string>('4/4');
  const currentTimeMsRef = useRef<number>(0);

  // A-B Looper State (seconds, null = not set)
  const MIN_AB_LOOP_GAP_SEC = 0.5;
  const [loopA, setLoopA] = useState<number | null>(null);
  const [loopB, setLoopB] = useState<number | null>(null);
  const loopARef = useRef<number | null>(null);
  const loopBRef = useRef<number | null>(null);
  const lastLoopSeekTimeRef = useRef<number>(0);
  const wasLoopingBeforeABRef = useRef<boolean | null>(null);
  const lastABStatusRef = useRef<{ hasAB: boolean }>({ hasAB: false });

  // Transpose / Virtual Pitch Shifter (FR-NEXT-04: -12 to +12 semitones)
  const [transpose, setTranspose] = useState<number>(0);

  // Scale Practice Lab State (FR-NEXT-05)
  const [isScaleMode, setIsScaleMode] = useState<boolean>(true);
  const [scaleRoot, setScaleRoot] = useState<number>(9); // Default A (pitch class 9)
  const [scaleId, setScaleId] = useState<string>('minor_pentatonic');
  const [scaleDisplayMode, setScaleDisplayMode] = useState<ScaleDisplayMode>('degrees');
  const [backingProgressionName, setBackingProgressionName] = useState<string>(
    'A Minor Rock/Ballad Groove'
  );

  // Real-time Song Timeline (Look-ahead highway & Fretboard data)
  const [timeline, setTimeline] = useState<SongTimeline | null>(null);
  const [activeNotes, setActiveNotes] = useState<TabNote[]>([]);
  const [activeChord, setActiveChord] = useState<ActiveChord | null>(null);
  const [activeTechnique, setActiveTechnique] = useState<ActiveTechnique | null>(null);

  const lastSyncRef = useRef<{ audioMs: number; wallTime: number }>({
    audioMs: 0,
    wallTime: performance.now(),
  });

  // Active track information
  const activeTrack = tracks.find((t) => t.index === activeTrackIndex) || tracks[0];
  const activeTuning = activeTrack?.tuning || [64, 59, 55, 50, 45, 40];
  const activeTuningNames = activeTrack?.tuningNames || ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'];

  // Keep refs in sync for animation loop & callbacks
  useEffect(() => {
    isMetronomeOnRef.current = isMetronomeOn;
  }, [isMetronomeOn]);

  useEffect(() => {
    isCountingInRef.current = isCountingIn;
  }, [isCountingIn]);

  useEffect(() => {
    timelineRef.current = timeline;
  }, [timeline]);

  useEffect(() => {
    tempoRef.current = tempo;
  }, [tempo]);

  useEffect(() => {
    timeSignatureRef.current = timeSignature;
  }, [timeSignature]);

  useEffect(() => {
    currentTimeMsRef.current = currentTimeMs;
  }, [currentTimeMs]);

  // 60FPS High-Precision Interpolation loop during playback + A-B Loop auto-seek + Metronome Sync
  useEffect(() => {
    if (!isPlaying) return;
    let animId: number;

    const loop = () => {
      const elapsedWallMs = (performance.now() - lastSyncRef.current.wallTime) * speed;
      const interpolatedMs = Math.max(0, lastSyncRef.current.audioMs + elapsedWallMs);

      // A-B Looper: auto-seek back to A when reaching B
      const a = loopARef.current;
      const b = loopBRef.current;
      const now = performance.now();
      if (
        a !== null &&
        b !== null &&
        b > a &&
        interpolatedMs >= b * 1000 &&
        now - lastLoopSeekTimeRef.current > 300
      ) {
        lastLoopSeekTimeRef.current = now;
        handleSeek(a);
        lastScheduledBeatTimeRef.current = a * 1000 - 1;
        animId = requestAnimationFrame(loop);
        return;
      }

      // Metronome Click Track: Speed-aware lookahead scheduling
      if (isMetronomeOnRef.current) {
        const lookaheadSongMs = 70 * speed;
        const windowStart = interpolatedMs;
        const windowEnd = interpolatedMs + lookaheadSongMs;
        const lastScheduled = lastScheduledBeatTimeRef.current;

        const metroBeats = timelineRef.current?.metronomeBeats;
        if (metroBeats && metroBeats.length > 0) {
          for (let i = 0; i < metroBeats.length; i++) {
            const mb = metroBeats[i];
            if (mb.timeMs >= windowStart && mb.timeMs < windowEnd && mb.timeMs > lastScheduled) {
              const delayWallSec = Math.max(0, (mb.timeMs - interpolatedMs) / (1000 * speed));
              const targetAudioTime = metronome.getCurrentTime() + delayWallSec;
              metronome.playClick(targetAudioTime, mb.isStrong);
              lastScheduledBeatTimeRef.current = mb.timeMs;
            } else if (mb.timeMs >= windowEnd) {
              break;
            }
          }
        } else {
          // Mathematical fallback based on tempo & timeSignature
          const beatsPerBar = parseInt(timeSignatureRef.current.split('/')[0]) || 4;
          const currentTempo = tempoRef.current || 120;
          const beatDurationMs = 60000 / currentTempo;
          const beatIdx = Math.floor(interpolatedMs / beatDurationMs);
          const beatTimeMs = beatIdx * beatDurationMs;
          if (beatTimeMs >= windowStart && beatTimeMs < windowEnd && beatTimeMs > lastScheduled) {
            const delayWallSec = Math.max(0, (beatTimeMs - interpolatedMs) / (1000 * speed));
            const targetAudioTime = metronome.getCurrentTime() + delayWallSec;
            metronome.playClick(targetAudioTime, beatIdx % beatsPerBar === 0);
            lastScheduledBeatTimeRef.current = beatTimeMs;
          }
        }
      }

      setCurrentTimeMs(interpolatedMs);
      currentTimeMsRef.current = interpolatedMs;
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, speed]);

  // A-B Looper: auto-toggle isLooping global when A-B is set/cleared
  useEffect(() => {
    const hasAB = loopA !== null && loopB !== null;
    const prevHasAB = lastABStatusRef.current.hasAB;

    if (hasAB && !prevHasAB) {
      // A-B just became active: remember previous isLooping, then force global loop ON
      if (wasLoopingBeforeABRef.current === null) {
        wasLoopingBeforeABRef.current = isLooping;
      }
      if (!isLooping) {
        setIsLooping(true);
        alphaTabRef.current?.setLoop(true);
      }
    } else if (!hasAB && prevHasAB) {
      // A-B just cleared: restore previous isLooping state
      const restore = wasLoopingBeforeABRef.current;
      if (restore !== null) {
        if (restore !== isLooping) {
          setIsLooping(restore);
          alphaTabRef.current?.setLoop(restore);
        }
      }
      wasLoopingBeforeABRef.current = null;
    }

    lastABStatusRef.current.hasAB = hasAB;
  }, [loopA, loopB, isLooping]);

  // Derive active NOW and NEXT beat states
  const beatState = useMemo(() => {
    if (!timeline) return null;
    return getCurrentAndNextBeats(timeline, currentTimeMs);
  }, [timeline, currentTimeMs]);

  // Convert activeNotes fallback to ExtractedNote if timeline beat not yet ready
  const currentSoundingNotes: ExtractedNote[] = useMemo(() => {
    if (beatState?.currentBeat && beatState.currentBeat.notes.length > 0) {
      return beatState.currentBeat.notes;
    }
    return activeNotes.map((n) => ({
      string: n.string,
      fret: n.fret,
      noteName: n.noteName,
      midiPitch: n.midiPitch,
      isBend: n.isBend,
      bendAmount: n.bendAmount,
      isSlide: n.isSlide,
      slideToFret: n.slideToFret,
      isVibrato: n.isVibrato,
      isHarmonic: n.isHarmonic,
      isPalmMute: n.isPalmMute,
    }));
  }, [beatState, activeNotes]);

  const nextAttackNotes: ExtractedNote[] = beatState?.nextBeat?.notes || [];
  const currentChordName = beatState?.currentBeat?.chordName || activeChord?.name;
  const nextChordName = beatState?.nextBeat?.chordName;
  const currentSection = beatState?.currentSection || 'Main Section';
  const nextSection = beatState?.nextSection || currentSection;
  const currentBarIndex = beatState?.barIndex || 1;

  // Metronome & Count-In Handlers
  const cancelCountIn = useCallback(() => {
    countInTimeoutsRef.current.forEach((id) => window.clearTimeout(id));
    countInTimeoutsRef.current = [];
    setIsCountingIn(false);
    setCountInBeat(0);
    isCountingInRef.current = false;
  }, []);

  const startCountIn = useCallback(() => {
    cancelCountIn();
    metronome.resume();
    setIsCountingIn(true);
    isCountingInRef.current = true;

    const beatsPerBar = parseInt(timeSignatureRef.current.split('/')[0]) || 4;
    const currentTempo = tempoRef.current || 120;
    const beatDurationSec = (60 / currentTempo) / speed;
    const beatDurationMs = beatDurationSec * 1000;

    for (let b = 1; b <= beatsPerBar; b++) {
      const timeoutId = window.setTimeout(() => {
        if (!isCountingInRef.current) return;
        setCountInBeat(b);
        metronome.playClick(undefined, b === 1);
      }, (b - 1) * beatDurationMs);
      countInTimeoutsRef.current.push(timeoutId);
    }

    const finishTimeoutId = window.setTimeout(() => {
      if (!isCountingInRef.current) return;
      setIsCountingIn(false);
      setCountInBeat(0);
      isCountingInRef.current = false;
      lastScheduledBeatTimeRef.current = currentTimeMsRef.current - 1;
      alphaTabRef.current?.playPause();
    }, beatsPerBar * beatDurationMs);

    countInTimeoutsRef.current.push(finishTimeoutId);
  }, [cancelCountIn, speed]);

  const handleToggleMetronome = useCallback(() => {
    setIsMetronomeOn((prev) => {
      const next = !prev;
      isMetronomeOnRef.current = next;
      if (next) {
        metronome.resume();
        lastScheduledBeatTimeRef.current = currentTimeMsRef.current - 1;
      }
      return next;
    });
  }, []);

  const handleMetronomeVolumeChange = useCallback((vol: number) => {
    setMetronomeVolume(vol);
    metronome.setVolume(vol);
  }, []);

  const handleTransposeChange = useCallback((newTranspose: number) => {
    const clamped = Math.max(-12, Math.min(12, newTranspose));
    setTranspose(clamped);
    alphaTabRef.current?.setTranspose(clamped);
  }, []);

  // Scale Lab Handlers (FR-NEXT-05)
  const handleScaleConfigChange = useCallback((newRoot: number, newScaleId: string) => {
    setScaleRoot(newRoot);
    setScaleId(newScaleId);

    const currentTempo = tempoRef.current || 90;
    const backing = generateBackingTrackTex(newRoot, newScaleId, currentTempo);
    setBackingProgressionName(backing.progressionName);

    if (selectedPresetId === 'scale-practice-empty' || isScaleMode) {
      cancelCountIn();
      handleClearABLoop();
      setTimeline(null);
      setCurrentTimeMs(0);
      lastScheduledBeatTimeRef.current = -1;
      lastSyncRef.current = { audioMs: 0, wallTime: performance.now() };
      alphaTabRef.current?.loadTex(backing.tex);
    }
  }, [selectedPresetId, isScaleMode, cancelCountIn]);

  const handleToggleScaleMode = useCallback(() => {
    setIsScaleMode((prev) => !prev);
  }, []);

  const handleToggleDisplayMode = useCallback(() => {
    setScaleDisplayMode((prev) => (prev === 'degrees' ? 'notes' : 'degrees'));
  }, []);

  // Handlers
  const handleSelectPreset = (presetId: string) => {
    const preset = PRESET_SONGS.find((p) => p.id === presetId);
    if (!preset) return;
    cancelCountIn();
    handleClearABLoop();
    setTranspose(0);
    setSelectedPresetId(presetId);
    setSongTitle(preset.title);
    setSongArtist(preset.artist);
    setTempo(preset.tempo);
    setTimeline(null);
    setCurrentTimeMs(0);
    lastScheduledBeatTimeRef.current = -1;
    lastSyncRef.current = { audioMs: 0, wallTime: performance.now() };

    if (presetId === 'scale-practice-empty') {
      setIsScaleMode(true);
      const backing = generateBackingTrackTex(scaleRoot, scaleId, preset.tempo);
      setBackingProgressionName(backing.progressionName);
      alphaTabRef.current?.loadTex(backing.tex);
    } else {
      setIsScaleMode(false);
      alphaTabRef.current?.loadTex(preset.tex);
    }
  };

  const handleFileUpload = (file: File) => {
    cancelCountIn();
    handleClearABLoop();
    setTranspose(0);
    setSongTitle(file.name.replace(/\.[^/.]+$/, ''));
    setSongArtist('User Tab Import');
    setTimeline(null);
    setCurrentTimeMs(0);
    lastScheduledBeatTimeRef.current = -1;
    lastSyncRef.current = { audioMs: 0, wallTime: performance.now() };
    alphaTabRef.current?.loadFile(file);
  };

  const handleSelectTrack = (trackIndex: number) => {
    cancelCountIn();
    handleClearABLoop();
    setActiveTrackIndex(trackIndex);
    setCurrentTimeMs(0);
    lastScheduledBeatTimeRef.current = -1;
    lastSyncRef.current = { audioMs: 0, wallTime: performance.now() };
    alphaTabRef.current?.changeTrack(trackIndex);
  };

  const handlePlayPause = useCallback(() => {
    if (isCountingInRef.current) {
      cancelCountIn();
      return;
    }

    if (isPlaying) {
      alphaTabRef.current?.playPause();
      return;
    }

    if (isCountInEnabled) {
      startCountIn();
    } else {
      metronome.resume();
      lastScheduledBeatTimeRef.current = currentTimeMsRef.current - 1;
      alphaTabRef.current?.playPause();
    }
  }, [isPlaying, isCountInEnabled, startCountIn, cancelCountIn]);

  const handleStop = () => {
    cancelCountIn();
    alphaTabRef.current?.stop();
    setCurrentTimeMs(0);
    lastSyncRef.current = { audioMs: 0, wallTime: performance.now() };
    lastScheduledBeatTimeRef.current = -1;
    setActiveNotes([]);
    setActiveChord(null);
    setActiveTechnique(null);
  };

  const handleSeek = (seconds: number) => {
    cancelCountIn();
    alphaTabRef.current?.seek(seconds);
    const ms = seconds * 1000;
    setCurrentTimeMs(ms);
    lastSyncRef.current = { audioMs: ms, wallTime: performance.now() };
    lastScheduledBeatTimeRef.current = ms - 1;
  };

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
    alphaTabRef.current?.setSpeed(newSpeed);
    if (newSpeed === 1.0) {
      setIsSoloSlowdown(false);
    }
  };

  const handleToggleSoloSlowdown = () => {
    if (isSoloSlowdown) {
      setIsSoloSlowdown(false);
      handleSpeedChange(1.0);
    } else {
      setIsSoloSlowdown(true);
      handleSpeedChange(0.5);
    }
  };

  const handleToggleLoop = () => {
    const newLoop = !isLooping;
    setIsLooping(newLoop);
    alphaTabRef.current?.setLoop(newLoop);
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    alphaTabRef.current?.setVolume(newVolume);
  };

  const handleToggleMute = (trackIndex: number) => {
    setTracks(prev => prev.map(t =>
      t.index === trackIndex ? { ...t, isMuted: !t.isMuted } : t
    ));
    alphaTabRef.current?.toggleMute(trackIndex);
  };

  const handleToggleSolo = (trackIndex: number) => {
    setTracks(prev => prev.map(t =>
      t.index === trackIndex ? { ...t, isSolo: !t.isSolo } : t
    ));
    alphaTabRef.current?.toggleSolo(trackIndex);
  };

  // A-B Looper handlers
  const handleSetLoopA = () => {
    const currentSec = currentTimeMs / 1000;
    const clampedA = durationSec > 0
      ? Math.min(Math.max(0, currentSec), Math.max(0, durationSec - MIN_AB_LOOP_GAP_SEC))
      : Math.max(0, currentSec);

    setLoopA(clampedA);
    loopARef.current = clampedA;

    const b = loopBRef.current;
    if (b !== null) {
      const gap = b - clampedA;
      if (gap <= 0) {
        // B is at or before new A: reset B to null (user must re-set)
        setLoopB(null);
        loopBRef.current = null;
      } else if (gap < MIN_AB_LOOP_GAP_SEC) {
        // Gap is too small, expand B forward to meet minimum gap
        const expandedB = clampedA + MIN_AB_LOOP_GAP_SEC;
        const safeB = durationSec > 0 && expandedB > durationSec
          ? durationSec
          : expandedB;
        setLoopB(safeB);
        loopBRef.current = safeB;
        // eslint-disable-next-line no-console
        console.debug(`[ABLoop] Gap terlalu kecil (${gap.toFixed(2)}s < ${MIN_AB_LOOP_GAP_SEC}s). B di-ekspansi ke ${safeB.toFixed(2)}s.`);
      }
    }
  };

  const handleSetLoopB = () => {
    const currentSec = currentTimeMs / 1000;
    const clampedCurrent = durationSec > 0 ? Math.min(Math.max(0, currentSec), durationSec) : Math.max(0, currentSec);
    const a = loopARef.current;

    if (a !== null && clampedCurrent > a) {
      const gap = clampedCurrent - a;
      const finalB = gap >= MIN_AB_LOOP_GAP_SEC
        ? clampedCurrent
        : (durationSec > 0 && a + MIN_AB_LOOP_GAP_SEC > durationSec
          ? durationSec
          : a + MIN_AB_LOOP_GAP_SEC);
      if (finalB <= a) {
        // eslint-disable-next-line no-console
        console.warn('[ABLoop] Tidak dapat menetapkan B: sisa durasi dari A kurang dari minimum gap.');
        return;
      }
      if (gap < MIN_AB_LOOP_GAP_SEC) {
        // eslint-disable-next-line no-console
        console.debug(`[ABLoop] Gap terlalu kecil. B dinaikkan dari ${clampedCurrent.toFixed(2)}s ke ${finalB.toFixed(2)}s.`);
      }
      setLoopB(finalB);
      loopBRef.current = finalB;
      handleSeek(a);
    } else if (a !== null && clampedCurrent <= a) {
      // User set B before A: swap so A < B, then enforce min gap
      let newA = clampedCurrent;
      let newB = a;
      const swapGap = newB - newA;
      if (swapGap < MIN_AB_LOOP_GAP_SEC) {
        const expandedB = newA + MIN_AB_LOOP_GAP_SEC;
        newB = durationSec > 0 && expandedB > durationSec ? durationSec : expandedB;
        if (newB <= newA) {
          // eslint-disable-next-line no-console
          console.warn('[ABLoop] Swap gagal: tidak ada ruang untuk loop minimum.');
          return;
        }
      }
      setLoopA(newA);
      loopARef.current = newA;
      setLoopB(newB);
      loopBRef.current = newB;
      handleSeek(newA);
    } else {
      // A was not set yet: set A = max(0, current - MIN_GAP), B = currentSec, ensure min gap
      const fallbackA = Math.max(0, clampedCurrent - MIN_AB_LOOP_GAP_SEC);
      const fallbackGap = clampedCurrent - fallbackA;
      const finalFallbackB = fallbackGap >= MIN_AB_LOOP_GAP_SEC
        ? clampedCurrent
        : fallbackA + MIN_AB_LOOP_GAP_SEC;
      if (durationSec > 0 && finalFallbackB > durationSec) {
        // eslint-disable-next-line no-console
        console.warn('[ABLoop] Tidak dapat membuat loop otomatis: durasi lagu kurang.');
        setLoopA(0);
        loopARef.current = 0;
        return;
      }
      setLoopA(fallbackA);
      loopARef.current = fallbackA;
      setLoopB(finalFallbackB);
      loopBRef.current = finalFallbackB;
      handleSeek(fallbackA);
    }
  };

  const handleClearABLoop = () => {
    setLoopA(null);
    setLoopB(null);
    loopARef.current = null;
    loopBRef.current = null;
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          handlePlayPause();
          break;
        case 'KeyM':
          e.preventDefault();
          handleToggleMetronome();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handleSeek(Math.max(0, (currentTimeMsRef.current / 1000) - 5));
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleSeek(Math.min(durationSec, (currentTimeMsRef.current / 1000) + 5));
          break;
        case 'Minus':
        case 'NumpadSubtract':
          e.preventDefault();
          handleSpeedChange(Math.max(0.25, speed - 0.1));
          break;
        case 'Equal':
        case 'NumpadAdd':
          e.preventDefault();
          handleSpeedChange(Math.min(2.0, speed + 0.1));
          break;
        case 'BracketLeft':
          e.preventDefault();
          handleSetLoopA();
          break;
        case 'BracketRight':
          e.preventDefault();
          handleSetLoopB();
          break;
        case 'Backspace':
          if (loopARef.current !== null || loopBRef.current !== null) {
            e.preventDefault();
            handleClearABLoop();
          }
          break;
        case 'KeyF':
          e.preventDefault();
          setIsFlipped((prev) => !prev);
          break;
        case 'KeyS':
          e.preventDefault();
          handleToggleScaleMode();
          break;
        case 'ArrowUp':
          if (e.shiftKey) {
            e.preventDefault();
            handleTransposeChange(transpose + 1);
          }
          break;
        case 'ArrowDown':
          if (e.shiftKey) {
            e.preventDefault();
            handleTransposeChange(transpose - 1);
          }
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePlayPause, handleToggleMetronome, durationSec, speed, handleTransposeChange, transpose, handleToggleScaleMode]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100vw',
        height: '100vh',
        backgroundColor: '#120e0e',
        overflow: 'hidden',
      }}
    >
      {/* 1. Header Toolbar (Develop Device Studio Style) */}
      <TopNav
        songTitle={songTitle}
        songArtist={songArtist}
        activeTrackName={activeTrack?.name || 'Lead Guitar'}
        tempo={tempo}
        timeSignature={timeSignature}
        tuning={activeTuning}
        selectedPresetId={selectedPresetId}
        onSelectPreset={handleSelectPreset}
        onFileUpload={handleFileUpload}
        transpose={transpose}
      />

      {/* 2. Multi-Instrument Track Flow Switcher */}
      <TrackSelector
        tracks={tracks}
        activeTrackIndex={activeTrackIndex}
        onSelectTrack={handleSelectTrack}
        onToggleMute={handleToggleMute}
        onToggleSolo={handleToggleSolo}
      />

      {/* 3. Main Stage: String Flow Highway & Flat Fretboard 2D */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          overflow: 'hidden',
          backgroundColor: '#120e0e',
          position: 'relative',
        }}
      >
        {/* Upper Panel: Horizontal Scrolling Highway (Look-Ahead Horizon 3.0s) */}
        <div style={{ flex: 1, minHeight: '200px', display: 'flex' }}>
          <StringFlowHighway
            timeline={timeline}
            currentTimeMs={currentTimeMs}
            isPlaying={isPlaying}
            activeNotes={currentSoundingNotes}
            activeChordName={currentChordName}
            tuningNames={timeline?.tuningNames || activeTuningNames}
            activeTechniqueTitle={activeTechnique?.title}
            loopAMs={loopA !== null ? loopA * 1000 : undefined}
            loopBMs={loopB !== null ? loopB * 1000 : undefined}
            isFlipped={isFlipped}
            isScaleMode={isScaleMode}
            scaleRoot={scaleRoot}
            scaleId={scaleId}
            scaleDisplayMode={scaleDisplayMode}
            tuning={activeTuning}
            backingProgressionName={backingProgressionName}
          />
        </div>

        {/* Lower Panel: Flat 2D Fretboard (Frets 00-24 with NOW & NEXT Cues) */}
        <div style={{ flex: 1, minHeight: '200px', display: 'flex' }}>
          <FlatFretboard2D
            activeNotes={currentSoundingNotes}
            nextNotes={nextAttackNotes}
            activeTechniqueTitle={activeTechnique?.title}
            tuningNames={timeline?.tuningNames || activeTuningNames}
            tuning={activeTuning}
            isPlaying={isPlaying}
            isFlipped={isFlipped}
            isScaleMode={isScaleMode}
            scaleRoot={scaleRoot}
            scaleId={scaleId}
            scaleDisplayMode={scaleDisplayMode}
            onScaleChange={handleScaleConfigChange}
            onToggleScaleMode={handleToggleScaleMode}
            onToggleDisplayMode={handleToggleDisplayMode}
            backingProgressionName={backingProgressionName}
          />
        </div>

        {/* Count-In Visual HUD Overlay */}
        {isCountingIn && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(18, 14, 14, 0.75)',
              backdropFilter: 'blur(5px)',
              zIndex: 50,
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
                padding: '24px 48px',
                borderRadius: '12px',
                background: 'linear-gradient(180deg, rgba(35, 27, 27, 0.95) 0%, rgba(20, 16, 16, 0.98) 100%)',
                border: '1.5px solid #ffb86c',
                boxShadow: '0 0 35px rgba(255, 184, 108, 0.35)',
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                  color: '#ffb86c',
                  letterSpacing: '2.5px',
                  textTransform: 'uppercase',
                }}
              >
                COUNT-IN · SIAPKAN PETIKAN
              </div>

              {/* Big Pulsing Beat Number */}
              <div
                key={countInBeat}
                style={{
                  fontSize: '84px',
                  fontWeight: 900,
                  fontFamily: 'var(--font-mono)',
                  color: countInBeat === 1 ? '#ffb86c' : '#ffffff',
                  lineHeight: 1,
                  textShadow: countInBeat === 1
                    ? '0 0 30px rgba(255, 184, 108, 0.9)'
                    : '0 0 20px rgba(255, 255, 255, 0.6)',
                }}
              >
                {countInBeat > 0 ? countInBeat : '...'}
              </div>

              {/* Beat Dots Indicator */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                {Array.from({ length: parseInt(timeSignature.split('/')[0]) || 4 }).map((_, idx) => {
                  const isActive = idx < countInBeat;
                  return (
                    <div
                      key={idx}
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: isActive ? '#ffb86c' : '#3d3232',
                        boxShadow: isActive ? '0 0 10px #ffb86c' : 'none',
                        transform: isActive ? 'scale(1.2)' : 'scale(1)',
                        transition: 'all 0.12s ease',
                      }}
                    />
                  );
                })}
              </div>

              <div
                style={{
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  color: '#a89d9d',
                  marginTop: '2px',
                }}
              >
                {tempo} BPM · Birama {timeSignature}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. AlphaTab 2D Sheet (Collapsible Notation Partitur) */}
      <AlphaTabSheet
        ref={alphaTabRef}
        initialTex={PRESET_SONGS[0].tex}
        activeTrackIndex={activeTrackIndex}
        onTracksLoaded={(loadedTracks, initialIdx) => {
          setTracks(loadedTracks);
          setActiveTrackIndex(initialIdx);
        }}
        onSongInfoLoaded={(title, artist, songTempo, songTimeSig) => {
          setSongTitle(title);
          setSongArtist(artist);
          setTempo(songTempo);
          if (songTimeSig) setTimeSignature(songTimeSig);
        }}
        onTimelineLoaded={(extractedTimeline) => {
          setTimeline(extractedTimeline);
          if (extractedTimeline.timeSignature) setTimeSignature(extractedTimeline.timeSignature);
        }}
        onActiveNotesChange={(notes, chord) => {
          setActiveNotes(notes);
          setActiveChord(chord);
        }}
        onTechniqueChange={setActiveTechnique}
        onPlayerPositionChange={(_currSec, totSec) => {
          setDurationSec(totSec);
        }}
        onCurrentTimeMsChange={(currMs) => {
          lastSyncRef.current = { audioMs: currMs, wallTime: performance.now() };
          setCurrentTimeMs(currMs);
        }}
        onPlayerStateChange={setIsPlaying}
        isExpanded={isSheetExpanded}
      />

      {/* 5. Studio Telemetry & Integrated Transport Bar */}
      <div style={{ flexShrink: 0, width: '100%' }}>
        <TelemetryBar
          currentNotes={currentSoundingNotes}
          nextNotes={nextAttackNotes}
          currentChordName={currentChordName}
          nextChordName={nextChordName}
          currentSection={currentSection}
          nextSection={nextSection}
          barIndex={currentBarIndex}
          tempo={tempo}
          timeSignature={timeSignature}
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          onStop={handleStop}
          currentTime={currentTimeMs / 1000}
          duration={durationSec}
          onSeek={handleSeek}
          speed={speed}
          isSoloSlowdown={isSoloSlowdown}
          onToggleSoloSlowdown={handleToggleSoloSlowdown}
          isLooping={isLooping}
          onToggleLoop={handleToggleLoop}
          isSheetExpanded={isSheetExpanded}
          onToggleSheet={() => setIsSheetExpanded(!isSheetExpanded)}
          volume={volume}
          onVolumeChange={handleVolumeChange}
          onSpeedChange={handleSpeedChange}
          loopA={loopA}
          loopB={loopB}
          onSetLoopA={handleSetLoopA}
          onSetLoopB={handleSetLoopB}
          onClearABLoop={handleClearABLoop}
          isFlipped={isFlipped}
          onToggleFlip={() => setIsFlipped((prev) => !prev)}
          isMetronomeOn={isMetronomeOn}
          onToggleMetronome={handleToggleMetronome}
          metronomeVolume={metronomeVolume}
          onMetronomeVolumeChange={handleMetronomeVolumeChange}
          isCountInEnabled={isCountInEnabled}
          onToggleCountIn={() => setIsCountInEnabled((prev) => !prev)}
          isCountingIn={isCountingIn}
          countInBeat={countInBeat}
          transpose={transpose}
          onTransposeChange={handleTransposeChange}
        />
      </div>
    </div>
  );
};

export default App;
