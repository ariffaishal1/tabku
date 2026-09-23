import React, { useState, useEffect, useRef, useMemo } from 'react';
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
import type { TabNote, TrackInfo, ActiveChord, ActiveTechnique } from './types/guitar';

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

  // A-B Looper State (seconds, null = not set)
  const MIN_AB_LOOP_GAP_SEC = 0.5;
  const [loopA, setLoopA] = useState<number | null>(null);
  const [loopB, setLoopB] = useState<number | null>(null);
  const loopARef = useRef<number | null>(null);
  const loopBRef = useRef<number | null>(null);
  const lastLoopSeekTimeRef = useRef<number>(0);
  const wasLoopingBeforeABRef = useRef<boolean | null>(null);
  const lastABStatusRef = useRef<{ hasAB: boolean }>({ hasAB: false });

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

  // Keyboard shortcut: Spacebar for Play/Pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          alphaTabRef.current?.playPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handleSeek(Math.max(0, (currentTimeMs / 1000) - 5));
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleSeek(Math.min(durationSec, (currentTimeMs / 1000) + 5));
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
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTimeMs, durationSec, speed]);

  // 60FPS High-Precision Interpolation loop during playback + A-B Loop auto-seek
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
        animId = requestAnimationFrame(loop);
        return;
      }

      setCurrentTimeMs(interpolatedMs);
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

  // Handlers
  const handleSelectPreset = (presetId: string) => {
    const preset = PRESET_SONGS.find((p) => p.id === presetId);
    if (!preset) return;
    handleClearABLoop();
    setSelectedPresetId(presetId);
    setSongTitle(preset.title);
    setSongArtist(preset.artist);
    setTempo(preset.tempo);
    setTimeline(null);
    setCurrentTimeMs(0);
    lastSyncRef.current = { audioMs: 0, wallTime: performance.now() };
    alphaTabRef.current?.loadTex(preset.tex);
  };

  const handleFileUpload = (file: File) => {
    handleClearABLoop();
    setSongTitle(file.name.replace(/\.[^/.]+$/, ''));
    setSongArtist('User Tab Import');
    setTimeline(null);
    setCurrentTimeMs(0);
    lastSyncRef.current = { audioMs: 0, wallTime: performance.now() };
    alphaTabRef.current?.loadFile(file);
  };

  const handleSelectTrack = (trackIndex: number) => {
    handleClearABLoop();
    setActiveTrackIndex(trackIndex);
    setCurrentTimeMs(0);
    lastSyncRef.current = { audioMs: 0, wallTime: performance.now() };
    alphaTabRef.current?.changeTrack(trackIndex);
  };

  const handlePlayPause = () => {
    alphaTabRef.current?.playPause();
  };

  const handleStop = () => {
    alphaTabRef.current?.stop();
    setCurrentTimeMs(0);
    lastSyncRef.current = { audioMs: 0, wallTime: performance.now() };
    setActiveNotes([]);
    setActiveChord(null);
    setActiveTechnique(null);
  };

  const handleSeek = (seconds: number) => {
    alphaTabRef.current?.seek(seconds);
    const ms = seconds * 1000;
    setCurrentTimeMs(ms);
    lastSyncRef.current = { audioMs: ms, wallTime: performance.now() };
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
        tuning={activeTuning}
        selectedPresetId={selectedPresetId}
        onSelectPreset={handleSelectPreset}
        onFileUpload={handleFileUpload}
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
            tuningNames={activeTuningNames}
            activeTechniqueTitle={activeTechnique?.title}
            loopAMs={loopA !== null ? loopA * 1000 : undefined}
            loopBMs={loopB !== null ? loopB * 1000 : undefined}
          />
        </div>

        {/* Lower Panel: Flat 2D Fretboard (Frets 00-24 with NOW & NEXT Cues) */}
        <div style={{ flex: 1, minHeight: '200px', display: 'flex' }}>
          <FlatFretboard2D
            activeNotes={currentSoundingNotes}
            nextNotes={nextAttackNotes}
            activeTechniqueTitle={activeTechnique?.title}
            tuningNames={activeTuningNames}
            isPlaying={isPlaying}
          />
        </div>
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
        onSongInfoLoaded={(title, artist, songTempo) => {
          setSongTitle(title);
          setSongArtist(artist);
          setTempo(songTempo);
        }}
        onTimelineLoaded={(extractedTimeline) => {
          setTimeline(extractedTimeline);
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
        />
      </div>
    </div>
  );
};

export default App;
