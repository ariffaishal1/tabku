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
  findPrevSection,
  findNextSection,
} from './services/timelineExtractor';
import type { TabNote, ActiveChord, ActiveTechnique } from './types/guitar';
import { KeyboardShortcutsModal } from './components/Modals/KeyboardShortcutsModal';
import { ShareSnapshotModal } from './components/Modals/ShareSnapshotModal';
import { parsePracticeUrlParams } from './utils/snapshotService';
import { ScaleLabBar } from './components/ScaleLab/ScaleLabBar';
import { CountInOverlay } from './components/Overlays/CountInOverlay';
import { SpeedTrainerHUD } from './components/Overlays/SpeedTrainerHUD';
import { StageModeHUD } from './components/Overlays/StageModeHUD';
import { SplashScreen } from './components/Overlays/SplashScreen';
import { ToastContainer } from './components/Overlays/ToastNotification';
import {
  requestNativeFullscreen,
  exitNativeFullscreen,
  getActiveFullscreenElement,
} from './utils/fullscreen';

// Custom hooks
import { usePlayback } from './hooks/usePlayback';
import { useMetronome } from './hooks/useMetronome';
import { useABLoop } from './hooks/useABLoop';
import { useSpeedTrainer } from './hooks/useSpeedTrainer';
import { useScaleLab } from './hooks/useScaleLab';
import { useToast } from './hooks/useToast';
import { useAnimationLoop } from './hooks/useAnimationLoop';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useEngineState } from './hooks/useEngineState';
import { useSongControls } from './hooks/useSongControls';
import { useTheme } from './hooks/useTheme';

const DEFAULT_TUNING = [64, 59, 55, 50, 45, 40];
const DEFAULT_TUNING_NAMES = ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'];

export const App: React.FC = () => {
  const alphaTabRef = useRef<AlphaTabSheetRef>(null);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isStageMode, setIsStageMode] = useState(false);
  const pendingSeekRef = useRef<number | null>(null);

  // ──────────────────────────────────────────────
  // Core domain hooks
  // ──────────────────────────────────────────────
  const theme = useTheme();
  const toast = useToast();

  // Fullscreen / Stage Focus Mode sync
  const isStageModeRef = useRef(false);
  useEffect(() => {
    isStageModeRef.current = isStageMode;
  }, [isStageMode]);

  const toggleStageMode = useCallback(async () => {
    const next = !isStageModeRef.current;
    isStageModeRef.current = next;
    setIsStageMode(next);

    if (next) {
      const fsResult = await requestNativeFullscreen();
      if (fsResult.success) {
        toast.showInfo('Stage Focus Mode', 'Tampilan penuh aktif. Tekan Z atau Esc untuk kembali.');
      } else {
        toast.showInfo(
          'Stage Focus Mode',
          'Tampilan fokus aktif. (Untuk layar penuh Chrome tanpa tab, tekan F11 atau buka di tab terpisah).'
        );
      }
    } else {
      await exitNativeFullscreen();
    }
  }, [toast]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const activeEl = getActiveFullscreenElement();
      if (!activeEl && isStageModeRef.current) {
        isStageModeRef.current = false;
        setIsStageMode(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);
  const playback = usePlayback(alphaTabRef);
  const scaleLab = useScaleLab(PRESET_SONGS[0].tempo);

  // Engine (SoundFont / score loading) state
  const engine = useEngineState();

  // Song & track state + handlers
  // Note: met functions passed here are stable refs set up below via useCallback stubs;
  // they are only ever called from user-interaction handlers (never during render/init).
  const cancelCountInRef = useRef<() => void>(() => {});
  const resetLastScheduledBeatRef = useRef<(ms?: number) => void>(() => {});
  const clearABLoopRef = useRef<() => void>(() => {});

  const song = useSongControls({
    alphaTabRef,
    cancelCountIn: useCallback((...args) => cancelCountInRef.current(...args), []),
    resetLastScheduledBeat: useCallback((...args) => resetLastScheduledBeatRef.current(...args), []),
    clearABLoop: useCallback((...args) => clearABLoopRef.current(...args), []),
    resetSync: playback.resetSync,
    setTimeline: (t) => { setTimeline(t); },
    isScaleMode: scaleLab.isScaleMode,
    setIsScaleMode: scaleLab.setIsScaleMode,
    scaleRoot: scaleLab.scaleRoot,
    scaleId: scaleLab.scaleId,
    setBackingProgressionName: scaleLab.setBackingProgressionName,
    showSuccess: toast.showSuccess,
    showInfo: toast.showInfo,
    showError: toast.showError,
  });

  const met = useMetronome(song.tempo, playback.speed, alphaTabRef, playback.currentTimeMsRef);
  const abLoop = useABLoop(
    playback.currentTimeMsRef, playback.durationSec,
    playback.isLooping, playback.setIsLooping, alphaTabRef,
  );
  const speedTrainer = useSpeedTrainer(playback.changeSpeed, playback.speedRef);

  // Wire the forward-refs now that met and abLoop are available
  useEffect(() => { cancelCountInRef.current = met.cancelCountIn; }, [met.cancelCountIn]);
  useEffect(() => { resetLastScheduledBeatRef.current = met.resetLastScheduledBeat; }, [met.resetLastScheduledBeat]);
  useEffect(() => { clearABLoopRef.current = abLoop.clearABLoop; }, [abLoop.clearABLoop]);

  // ──────────────────────────────────────────────
  // Real-time Song Timeline
  // ──────────────────────────────────────────────
  const [timeline, setTimeline] = useState<SongTimeline | null>(null);
  const [activeNotes, setActiveNotes] = useState<TabNote[]>([]);
  const [activeChord, setActiveChord] = useState<ActiveChord | null>(null);
  const [activeTechnique, setActiveTechnique] = useState<ActiveTechnique | null>(null);
  const timelineRef = useRef<SongTimeline | null>(null);
  useEffect(() => { timelineRef.current = timeline; }, [timeline]);

  // Active track derived data
  const activeTrack = song.tracks.find((t) => t.index === song.activeTrackIndex) || song.tracks[0];
  const activeTuning = activeTrack?.tuning || DEFAULT_TUNING;
  const activeTuningNames = activeTrack?.tuningNames || DEFAULT_TUNING_NAMES;

  // Derive NOW and NEXT beat states
  const beatState = useMemo(() => {
    if (!timeline) return null;
    return getCurrentAndNextBeats(timeline, playback.currentTimeMs);
  }, [timeline, playback.currentTimeMs]);

  const currentSoundingNotes: ExtractedNote[] = useMemo(() => {
    if (beatState?.currentBeat && beatState.currentBeat.notes.length > 0) {
      return beatState.currentBeat.notes;
    }
    return activeNotes.map((n) => ({
      string: n.string, fret: n.fret, noteName: n.noteName, midiPitch: n.midiPitch,
      isBend: n.isBend, bendAmount: n.bendAmount, isSlide: n.isSlide,
      slideToFret: n.slideToFret, isVibrato: n.isVibrato, isHarmonic: n.isHarmonic,
      isPalmMute: n.isPalmMute,
    }));
  }, [beatState, activeNotes]);

  const nextAttackNotes: ExtractedNote[] = beatState?.nextBeat?.notes || [];
  const currentChordName = beatState?.currentBeat?.chordName || activeChord?.name;
  const nextChordName = beatState?.nextBeat?.chordName;
  const currentSection = beatState?.currentSection || 'Main Section';
  const nextSection = beatState?.nextSection || currentSection;
  const currentBarIndex = beatState?.barIndex || 1;

  // ──────────────────────────────────────────────
  // Cross-cutting orchestration handlers
  // ──────────────────────────────────────────────
  const handleSeek = useCallback((seconds: number) => {
    met.cancelCountIn();
    playback.seek(seconds);
    met.resetLastScheduledBeat(seconds * 1000);
  }, [met, playback]);

  const handlePrevSection = useCallback(() => {
    if (!timeline?.sections || timeline.sections.length === 0) return;
    const prev = findPrevSection(timeline.sections, playback.currentTimeMsRef.current ?? 0);
    if (prev) {
      handleSeek(prev.startMs / 1000);
    }
  }, [timeline, handleSeek, playback.currentTimeMsRef]);

  const handleNextSection = useCallback(() => {
    if (!timeline?.sections || timeline.sections.length === 0) return;
    const next = findNextSection(timeline.sections, playback.currentTimeMsRef.current ?? 0);
    if (next) {
      handleSeek(next.startMs / 1000);
    }
  }, [timeline, handleSeek, playback.currentTimeMsRef]);

  const handlePlayPause = useCallback(() => {
    if (met.isCountingInRef.current) {
      met.cancelCountIn();
      return;
    }
    if (playback.isPlaying) {
      alphaTabRef.current?.playPause();
      return;
    }
    if (met.isCountInEnabled) {
      met.startCountIn();
    } else {
      met.resumeAudio();
      met.resetLastScheduledBeat(playback.currentTimeMsRef.current ?? 0);
      alphaTabRef.current?.playPause();
    }
  }, [playback, met]);

  const handleStop = useCallback(() => {
    met.cancelCountIn();
    alphaTabRef.current?.stop();
    playback.resetSync();
    met.resetLastScheduledBeat();
    setActiveNotes([]);
    setActiveChord(null);
    setActiveTechnique(null);
  }, [met, playback]);

  const handleScaleConfigChange = useCallback((newRoot: number, newScaleId: string) => {
    const backing = scaleLab.updateScaleConfig(newRoot, newScaleId);
    if (song.selectedPresetId === 'scale-practice-empty' || scaleLab.isScaleMode) {
      met.cancelCountIn();
      abLoop.clearABLoop();
      setTimeline(null);
      playback.resetSync();
      met.resetLastScheduledBeat();
      alphaTabRef.current?.loadTex(backing.tex);
    }
  }, [song.selectedPresetId, scaleLab, met, abLoop, playback]);

  const handleToggleSpeedTrainer = useCallback(() => {
    if (speedTrainer.isSpeedTrainer) {
      speedTrainer.setIsSpeedTrainer(false);
      speedTrainer.setNotification(null);
    } else {
      speedTrainer.setIsSpeedTrainer(true);
      speedTrainer.setLoopCount(0);

      // Ensure a valid A-B loop range exists
      if (
        abLoop.loopARef.current === null ||
        abLoop.loopBRef.current === null ||
        abLoop.loopBRef.current <= abLoop.loopARef.current
      ) {
        const currentSec = (playback.currentTimeMsRef.current ?? 0) / 1000;
        const startSec = Math.max(0, currentSec);
        const endSec = playback.durationSec > 0
          ? Math.min(playback.durationSec, startSec + 4)
          : startSec + 4;
        abLoop.updateLoopA(startSec);
        abLoop.updateLoopB(endSec);
      }

      if ((playback.speedRef.current ?? 1) >= 1.0) {
        playback.changeSpeed(0.5);
        speedTrainer.setNotification('SPEED TRAINER AKTIF: Dimulai dari 50% (+5%/loop)');
      } else {
        speedTrainer.setNotification(
          `SPEED TRAINER AKTIF: ${Math.round((playback.speedRef.current ?? 1) * 100)}% ➔ 100%`,
        );
      }
    }
  }, [speedTrainer, abLoop, playback]);

  // ──────────────────────────────────────────────
  // Load Practice URL Parameters on Mount
  // ──────────────────────────────────────────────
  const initialUrlProcessedRef = useRef(false);
  useEffect(() => {
    if (initialUrlProcessedRef.current) return;
    if (typeof window === 'undefined' || !window.location.search) return;

    const params = parsePracticeUrlParams(window.location.search);
    const hasParams = Object.keys(params).length > 0;
    if (!hasParams) return;

    initialUrlProcessedRef.current = true;

    if (params.theme) {
      theme.setTheme(params.theme as any);
    }
    if (params.presetId && params.presetId !== song.selectedPresetId) {
      song.handleSelectPreset(params.presetId);
    }
    if (params.speed !== undefined && params.speed > 0) {
      playback.changeSpeed(params.speed);
    }
    if (params.transpose !== undefined && params.transpose !== 0) {
      song.handleTransposeChange(params.transpose);
    }
    if (params.loopA !== undefined && params.loopB !== undefined) {
      abLoop.updateLoopA(params.loopA);
      abLoop.updateLoopB(params.loopB);
    }
    if (params.seconds !== undefined && params.seconds > 0) {
      pendingSeekRef.current = params.seconds;
      setTimeout(() => {
        if (pendingSeekRef.current !== null) {
          handleSeek(params.seconds!);
          pendingSeekRef.current = null;
        }
      }, 800);
    }

    toast.showInfo(
      'Sesi Latihan Dimuat',
      'Pengaturan lagu, tempo, dan loop dimuat dari tautan yang dibagikan.',
    );
  }, [song, playback, abLoop, theme, handleSeek, toast]);

  // Snapshot metadata for export & share card
  const snapshotMeta = useMemo(() => ({
    songTitle: song.songTitle,
    songArtist: song.songArtist,
    activeTrackName: activeTrack?.name || 'Lead Guitar',
    tempo: song.tempo,
    timeSignature: met.timeSignature,
    tuningName: 'Guitar Tuning',
    tuningNotesFormatted: activeTuningNames.join(' '),
    currentTimeMs: playback.currentTimeMs,
    currentBar: currentBarIndex,
    speed: playback.speed,
    transpose: song.transpose,
    loopAMs: abLoop.loopA !== null ? abLoop.loopA * 1000 : undefined,
    loopBMs: abLoop.loopB !== null ? abLoop.loopB * 1000 : undefined,
    activeTechnique: activeTechnique ? activeTechnique.type : undefined,
    soundingNoteText: currentSoundingNotes.map((n) => n.noteName).filter(Boolean).join(', '),
    themeName: theme.themeOptions.find((t) => t.id === theme.themeId)?.name || 'Cyber Dark',
  }), [
    song.songTitle, song.songArtist, activeTrack?.name,
    song.tempo, met.timeSignature, activeTuningNames, playback.currentTimeMs,
    currentBarIndex, playback.speed, song.transpose, abLoop.loopA, abLoop.loopB,
    activeTechnique, currentSoundingNotes, theme.themeOptions, theme.themeId,
  ]);

  const snapshotUrlParams = useMemo(() => ({
    presetId: song.selectedPresetId,
    trackIndex: song.activeTrackIndex,
    seconds: playback.currentTimeMs / 1000,
    speed: playback.speed,
    transpose: song.transpose,
    loopA: abLoop.loopA ?? undefined,
    loopB: abLoop.loopB ?? undefined,
    theme: theme.themeId,
  }), [
    song.selectedPresetId, song.activeTrackIndex, playback.currentTimeMs,
    playback.speed, song.transpose, abLoop.loopA, abLoop.loopB, theme.themeId,
  ]);

  // ──────────────────────────────────────────────
  // 60 FPS Animation Loop
  // ──────────────────────────────────────────────
  useAnimationLoop({
    isPlaying: playback.isPlaying,
    speed: playback.speed,
    lastSyncRef: playback.lastSyncRef,
    currentTimeMsRef: playback.currentTimeMsRef,
    isSpeedTrainerRef: speedTrainer.isSpeedTrainerRef,
    triggerStepRef: speedTrainer.triggerStepRef,
    timelineRef,
    checkBoundary: abLoop.checkBoundary,
    scheduleClicks: met.scheduleClicks,
    onTimeUpdate: playback.setCurrentTimeMs,
    onSeek: handleSeek,
  });

  // ──────────────────────────────────────────────
  // Keyboard Shortcuts
  // ──────────────────────────────────────────────
  useKeyboardShortcuts({
    onPlayPause: handlePlayPause,
    onSeek: handleSeek,
    onPrevSection: handlePrevSection,
    onNextSection: handleNextSection,
    toggleMetronome: met.toggleMetronome,
    toggleScaleMode: scaleLab.toggleScaleMode,
    toggleSpeedTrainer: handleToggleSpeedTrainer,
    onSpeedChange: playback.changeSpeed,
    onTransposeChange: song.handleTransposeChange,
    onSetLoopA: abLoop.handleSetLoopA,
    onSetLoopB: abLoop.handleSetLoopB,
    onClearABLoop: abLoop.clearABLoop,
    setIsShortcutsOpen,
    setIsFlipped: playback.setIsFlipped,
    currentTimeMsRef: playback.currentTimeMsRef,
    loopARef: abLoop.loopARef,
    loopBRef: abLoop.loopBRef,
    durationSec: playback.durationSec,
    speed: playback.speed,
    transpose: song.transpose,
    onCycleTheme: theme.cycleTheme,
    onToggleStageMode: toggleStageMode,
    onOpenShare: () => setIsShareOpen(true),
  });

  // ──────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100vw',
        height: '100vh',
        backgroundColor: 'var(--bg-primary)',
        overflow: 'hidden',
      }}
    >
      {/* 1. Header Toolbar */}
      {!isStageMode && (
        <TopNav
          songTitle={song.songTitle}
          songArtist={song.songArtist}
          activeTrackName={activeTrack?.name || 'Lead Guitar'}
          tempo={song.tempo}
          timeSignature={met.timeSignature}
          tuning={activeTuning}
          selectedPresetId={song.selectedPresetId}
          onSelectPreset={song.handleSelectPreset}
          onFileUpload={song.handleFileUpload}
          transpose={song.transpose}
          isScaleMode={scaleLab.isScaleMode}
          onToggleScaleMode={scaleLab.toggleScaleMode}
          onOpenShortcuts={() => setIsShortcutsOpen(true)}
          onOpenShare={() => setIsShareOpen(true)}
          isLoadingScore={engine.isLoadingScore}
          themeId={theme.themeId}
          themeOptions={theme.themeOptions}
          onSelectTheme={theme.setTheme}
          isStageMode={isStageMode}
          onToggleStageMode={toggleStageMode}
        />
      )}

      {/* 2. Multi-Instrument Track Flow Switcher */}
      {!isStageMode && (
        <TrackSelector
          tracks={song.tracks}
          activeTrackIndex={song.activeTrackIndex}
          onSelectTrack={song.handleSelectTrack}
          onToggleMute={song.handleToggleMute}
          onToggleSolo={song.handleToggleSolo}
        />
      )}

      {/* 2b. Scale Lab Control Bar */}
      <ScaleLabBar
        isScaleMode={scaleLab.isScaleMode}
        scaleRoot={scaleLab.scaleRoot}
        scaleId={scaleLab.scaleId}
        scalePosition={scaleLab.scalePosition}
        scaleDisplayMode={scaleLab.scaleDisplayMode}
        backingProgressionName={scaleLab.backingProgressionName}
        scaleLabBarRef={scaleLab.scaleLabBarRef}
        scaleLabCanScrollLeft={scaleLab.scaleLabCanScrollLeft}
        scaleLabCanScrollRight={scaleLab.scaleLabCanScrollRight}
        onCheckScroll={scaleLab.checkScaleLabScroll}
        onScaleConfigChange={handleScaleConfigChange}
        onSetScalePosition={scaleLab.setScalePosition}
        onToggleDisplayMode={scaleLab.toggleDisplayMode}
      />

      {/* 3. Main Stage: String Flow Highway & Flat Fretboard 2D */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          overflow: 'hidden',
          backgroundColor: 'var(--bg-primary)',
          position: 'relative',
        }}
      >
        {/* Speed Trainer Floating HUD */}
        <SpeedTrainerHUD notification={speedTrainer.notification} />

        {/* Stage Mode / Zen Mode Floating HUD */}
        <StageModeHUD
          isActive={isStageMode}
          songTitle={song.songTitle}
          songArtist={song.songArtist}
          activeTrackName={activeTrack?.name || 'Lead Guitar'}
          tracks={song.tracks}
          activeTrackIndex={song.activeTrackIndex}
          onSelectTrack={song.handleSelectTrack}
          tempo={song.tempo}
          tuningNames={timeline?.tuningNames || activeTuningNames}
          onExitStageMode={toggleStageMode}
        />

        {/* Upper Panel: Horizontal Scrolling Highway */}
        {!scaleLab.isScaleMode && (
          <div style={{ flex: 1, minHeight: '200px', display: 'flex' }}>
            <StringFlowHighway
              timeline={timeline}
              currentTimeMs={playback.currentTimeMs}
              isPlaying={playback.isPlaying}
              activeNotes={currentSoundingNotes}
              activeChordName={currentChordName}
              tuningNames={timeline?.tuningNames || activeTuningNames}
              activeTechniqueTitle={activeTechnique?.title}
              loopAMs={abLoop.loopA !== null ? abLoop.loopA * 1000 : undefined}
              loopBMs={abLoop.loopB !== null ? abLoop.loopB * 1000 : undefined}
              isFlipped={playback.isFlipped}
              speed={playback.speed}
              isScaleMode={scaleLab.isScaleMode}
              scaleRoot={scaleLab.scaleRoot}
              scaleId={scaleLab.scaleId}
              scaleDisplayMode={scaleLab.scaleDisplayMode}
              tuning={activeTuning}
              backingProgressionName={scaleLab.backingProgressionName}
              canvasTheme={theme.theme.canvas}
            />
          </div>
        )}

        {/* Lower Panel: Flat 2D Fretboard */}
        <div style={{ flex: 1, minHeight: '200px', display: 'flex' }}>
          <FlatFretboard2D
            activeNotes={currentSoundingNotes}
            nextNotes={nextAttackNotes}
            activeTechniqueTitle={activeTechnique?.title}
            tuningNames={timeline?.tuningNames || activeTuningNames}
            tuning={activeTuning}
            isPlaying={playback.isPlaying}
            isFlipped={playback.isFlipped}
            isScaleMode={scaleLab.isScaleMode}
            scaleRoot={scaleLab.scaleRoot}
            scaleId={scaleLab.scaleId}
            scaleDisplayMode={scaleLab.scaleDisplayMode}
            scalePosition={scaleLab.scalePosition}
            backingProgressionName={scaleLab.backingProgressionName}
            canvasTheme={theme.theme.canvas}
          />
        </div>

        {/* Count-In Visual HUD Overlay */}
        <CountInOverlay
          isCountingIn={met.isCountingIn}
          countInBeat={met.countInBeat}
          timeSignature={met.timeSignature}
          tempo={song.tempo}
        />
      </div>

      {/* 4. AlphaTab 2D Sheet (Collapsible Notation Partitur) */}
      <AlphaTabSheet
        ref={alphaTabRef}
        initialTex={PRESET_SONGS[0].tex}
        activeTrackIndex={song.activeTrackIndex}
        onTracksLoaded={(loadedTracks, initialIdx) => {
          song.setTracks(loadedTracks);
          song.setActiveTrackIndex(initialIdx);
        }}
        onSongInfoLoaded={(title, artist, songTempo, songTimeSig) => {
          song.setSongTitle(title);
          song.setSongArtist(artist);
          song.setTempo(songTempo);
          if (songTimeSig) met.setTimeSignature(songTimeSig);
        }}
        onTimelineLoaded={(extractedTimeline) => {
          setTimeline(extractedTimeline);
          if (extractedTimeline.timeSignature) met.setTimeSignature(extractedTimeline.timeSignature);
        }}
        onActiveNotesChange={(notes, chord) => {
          setActiveNotes(notes);
          setActiveChord(chord);
        }}
        onTechniqueChange={setActiveTechnique}
        onPlayerPositionChange={(_currSec, totSec) => {
          playback.setDurationSec(totSec);
        }}
        onCurrentTimeMsChange={playback.syncTime}
        onPlayerStateChange={playback.setIsPlaying}
        isExpanded={playback.isSheetExpanded}
        onSoundFontProgress={engine.handleSoundFontProgress}
        onSoundFontLoaded={engine.handleSoundFontLoaded}
        onPlayerReady={engine.handlePlayerReady}
        onError={(err) => {
          engine.setSoundFontError(err);
          toast.showError('Sistem Error', err);
          engine.clearLoadingOnError();
        }}
        onScoreLoading={engine.handleScoreLoading}
        onScoreLoaded={() => {
          engine.handleScoreLoaded();
          if (pendingSeekRef.current !== null) {
            const seekSec = pendingSeekRef.current;
            pendingSeekRef.current = null;
            setTimeout(() => {
              handleSeek(seekSec);
            }, 300);
          }
        }}
      />

      {/* 5. Studio Telemetry & Transport Bar */}
      <div style={{ flexShrink: 0, width: '100%' }}>
        <TelemetryBar
          currentNotes={currentSoundingNotes}
          nextNotes={nextAttackNotes}
          currentChordName={currentChordName}
          nextChordName={nextChordName}
          currentSection={currentSection}
          nextSection={nextSection}
          sections={timeline?.sections || []}
          onPrevSection={handlePrevSection}
          onNextSection={handleNextSection}
          barIndex={currentBarIndex}
          tempo={song.tempo}
          timeSignature={met.timeSignature}
          isPlaying={playback.isPlaying}
          onPlayPause={handlePlayPause}
          onStop={handleStop}
          currentTime={playback.currentTimeMs / 1000}
          duration={playback.durationSec}
          onSeek={handleSeek}
          speed={playback.speed}
          isSoloSlowdown={playback.isSoloSlowdown}
          onToggleSoloSlowdown={playback.toggleSoloSlowdown}
          isLooping={playback.isLooping}
          onToggleLoop={playback.toggleLoop}
          isSheetExpanded={playback.isSheetExpanded}
          onToggleSheet={() => playback.setIsSheetExpanded(!playback.isSheetExpanded)}
          volume={playback.volume}
          onVolumeChange={playback.changeVolume}
          onSpeedChange={playback.changeSpeed}
          loopA={abLoop.loopA}
          loopB={abLoop.loopB}
          onSetLoopA={abLoop.handleSetLoopA}
          onSetLoopB={() => abLoop.handleSetLoopB(handleSeek)}
          onClearABLoop={abLoop.clearABLoop}
          isFlipped={playback.isFlipped}
          onToggleFlip={() => playback.setIsFlipped((prev) => !prev)}
          isMetronomeOn={met.isMetronomeOn}
          onToggleMetronome={met.toggleMetronome}
          metronomeVolume={met.metronomeVolume}
          onMetronomeVolumeChange={met.changeMetronomeVolume}
          isCountInEnabled={met.isCountInEnabled}
          onToggleCountIn={() => met.setIsCountInEnabled((prev) => !prev)}
          isCountingIn={met.isCountingIn}
          countInBeat={met.countInBeat}
          transpose={song.transpose}
          onTransposeChange={song.handleTransposeChange}
          isSpeedTrainer={speedTrainer.isSpeedTrainer}
          onToggleSpeedTrainer={handleToggleSpeedTrainer}
          speedTrainerStep={speedTrainer.step}
          speedTrainerTarget={speedTrainer.target}
          speedTrainerLoopCount={speedTrainer.loopCount}
          isStageMode={isStageMode}
          onToggleStageMode={toggleStageMode}
        />
      </div>

      {/* 6. Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* 6b. Share & Snapshot Modal */}
      <ShareSnapshotModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        meta={snapshotMeta}
        urlParams={snapshotUrlParams}
        onShowToast={toast.showSuccess}
      />

      {/* 7. Splash Loading Screen for Initial Audio/SoundFont Engine */}
      <SplashScreen
        isLoading={engine.isEngineLoading}
        progress={engine.soundFontProgress}
        statusText={engine.soundFontStatus}
        error={engine.soundFontError}
        onRetry={engine.handleRetry}
      />

      {/* 8. Global Studio Toast Notifications */}
      <ToastContainer toasts={toast.toasts} onDismiss={toast.dismissToast} />
    </div>
  );
};

export default App;
