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
import { generateBackingTrackTex } from './services/scaleTheory';
import type { TabNote, TrackInfo, ActiveChord, ActiveTechnique } from './types/guitar';
import { KeyboardShortcutsModal } from './components/Modals/KeyboardShortcutsModal';
import { ScaleLabBar } from './components/ScaleLab/ScaleLabBar';
import { CountInOverlay } from './components/Overlays/CountInOverlay';
import { SpeedTrainerHUD } from './components/Overlays/SpeedTrainerHUD';

// Custom hooks
import { usePlayback } from './hooks/usePlayback';
import { useMetronome } from './hooks/useMetronome';
import { useABLoop } from './hooks/useABLoop';
import { useSpeedTrainer } from './hooks/useSpeedTrainer';
import { useScaleLab } from './hooks/useScaleLab';

export const App: React.FC = () => {
  const alphaTabRef = useRef<AlphaTabSheetRef>(null);

  // ──────────────────────────────────────────────
  // Song & Track State
  // ──────────────────────────────────────────────
  const [selectedPresetId, setSelectedPresetId] = useState(PRESET_SONGS[0].id);
  const [songTitle, setSongTitle] = useState(PRESET_SONGS[0].title);
  const [songArtist, setSongArtist] = useState(PRESET_SONGS[0].artist);
  const [tempo, setTempo] = useState(PRESET_SONGS[0].tempo);
  const [tracks, setTracks] = useState<TrackInfo[]>([]);
  const [activeTrackIndex, setActiveTrackIndex] = useState(0);
  const [transpose, setTranspose] = useState(0);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // ──────────────────────────────────────────────
  // Custom Hooks
  // ──────────────────────────────────────────────
  const playback = usePlayback(alphaTabRef);
  const met = useMetronome(tempo, playback.speed, alphaTabRef, playback.currentTimeMsRef);
  const abLoop = useABLoop(
    playback.currentTimeMsRef, playback.durationSec,
    playback.isLooping, playback.setIsLooping, alphaTabRef,
  );
  const speedTrainer = useSpeedTrainer(playback.changeSpeed, playback.speedRef);
  const scaleLab = useScaleLab(tempo);

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
  const activeTrack = tracks.find((t) => t.index === activeTrackIndex) || tracks[0];
  const activeTuning = activeTrack?.tuning || [64, 59, 55, 50, 45, 40];
  const activeTuningNames = activeTrack?.tuningNames || ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'];

  // Derive active NOW and NEXT beat states
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
  // Orchestration Handlers (cross-cutting concerns)
  // ──────────────────────────────────────────────
  const handleSeek = useCallback((seconds: number) => {
    met.cancelCountIn();
    playback.seek(seconds);
    met.resetLastScheduledBeat(seconds * 1000);
  }, [met.cancelCountIn, playback.seek, met.resetLastScheduledBeat]);

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
  }, [playback.isPlaying, met.isCountInEnabled, met.startCountIn, met.cancelCountIn,
      met.resumeAudio, met.resetLastScheduledBeat]);

  const handleStop = useCallback(() => {
    met.cancelCountIn();
    alphaTabRef.current?.stop();
    playback.resetSync();
    met.resetLastScheduledBeat();
    setActiveNotes([]);
    setActiveChord(null);
    setActiveTechnique(null);
  }, [met.cancelCountIn, playback.resetSync, met.resetLastScheduledBeat]);

  const handleTransposeChange = useCallback((newTranspose: number) => {
    const clamped = Math.max(-12, Math.min(12, newTranspose));
    setTranspose(clamped);
    alphaTabRef.current?.setTranspose(clamped);
  }, []);

  const handleScaleConfigChange = useCallback((newRoot: number, newScaleId: string) => {
    const backing = scaleLab.updateScaleConfig(newRoot, newScaleId);
    if (selectedPresetId === 'scale-practice-empty' || scaleLab.isScaleMode) {
      met.cancelCountIn();
      abLoop.clearABLoop();
      setTimeline(null);
      playback.resetSync();
      met.resetLastScheduledBeat();
      alphaTabRef.current?.loadTex(backing.tex);
    }
  }, [selectedPresetId, scaleLab.isScaleMode, scaleLab.updateScaleConfig,
      met.cancelCountIn, abLoop.clearABLoop, playback.resetSync, met.resetLastScheduledBeat]);

  const handleSelectPreset = (presetId: string) => {
    const preset = PRESET_SONGS.find((p) => p.id === presetId);
    if (!preset) return;
    met.cancelCountIn();
    abLoop.clearABLoop();
    setTranspose(0);
    setSelectedPresetId(presetId);
    setSongTitle(preset.title);
    setSongArtist(preset.artist);
    setTempo(preset.tempo);
    setTimeline(null);
    playback.resetSync();
    met.resetLastScheduledBeat();

    if (presetId === 'scale-practice-empty') {
      scaleLab.setIsScaleMode(true);
      const backing = generateBackingTrackTex(scaleLab.scaleRoot, scaleLab.scaleId, preset.tempo);
      scaleLab.setBackingProgressionName(backing.progressionName);
      alphaTabRef.current?.loadTex(backing.tex);
    } else {
      scaleLab.setIsScaleMode(false);
      alphaTabRef.current?.loadTex(preset.tex);
    }
  };

  const handleFileUpload = (file: File) => {
    met.cancelCountIn();
    abLoop.clearABLoop();
    setTranspose(0);
    setSongTitle(file.name.replace(/\.[^/.]+$/, ''));
    setSongArtist('User Tab Import');
    setTimeline(null);
    playback.resetSync();
    met.resetLastScheduledBeat();
    alphaTabRef.current?.loadFile(file);
  };

  const handleSelectTrack = (trackIndex: number) => {
    met.cancelCountIn();
    abLoop.clearABLoop();
    setActiveTrackIndex(trackIndex);
    playback.resetSync();
    met.resetLastScheduledBeat();
    alphaTabRef.current?.changeTrack(trackIndex);
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

  // Speed Trainer toggle (cross-cutting: reads AB loop refs, sets playback speed)
  const handleToggleSpeedTrainer = useCallback(() => {
    if (speedTrainer.isSpeedTrainer) {
      speedTrainer.setIsSpeedTrainer(false);
      speedTrainer.setNotification(null);
    } else {
      speedTrainer.setIsSpeedTrainer(true);
      speedTrainer.setLoopCount(0);

      // Ensure an A-B loop range exists
      if (abLoop.loopARef.current === null || abLoop.loopBRef.current === null ||
          abLoop.loopBRef.current <= abLoop.loopARef.current) {
        const currentSec = (playback.currentTimeMsRef.current ?? 0) / 1000;
        const startSec = Math.max(0, currentSec);
        const endSec = playback.durationSec > 0
          ? Math.min(playback.durationSec, startSec + 4)
          : startSec + 4;
        abLoop.updateLoopA(startSec);
        abLoop.updateLoopB(endSec);
      }

      // Drop to 50% if at full speed
      if ((playback.speedRef.current ?? 1) >= 1.0) {
        playback.changeSpeed(0.5);
        speedTrainer.setNotification('⚡ SPEED TRAINER AKTIF: Dimulai dari 50% (+5%/loop)');
      } else {
        speedTrainer.setNotification(
          `⚡ SPEED TRAINER AKTIF: ${Math.round((playback.speedRef.current ?? 1) * 100)}% ➔ 100%`
        );
      }
    }
  }, [speedTrainer.isSpeedTrainer, playback.durationSec, playback.changeSpeed,
      abLoop.updateLoopA, abLoop.updateLoopB]);

  // ──────────────────────────────────────────────
  // 60FPS Animation Loop (time interpolation + A-B boundary + metronome)
  // ──────────────────────────────────────────────
  const { isPlaying, speed } = playback;

  useEffect(() => {
    if (!isPlaying) return;
    let animId: number;

    const loop = () => {
      const elapsedWallMs = (performance.now() - playback.lastSyncRef.current.wallTime) * speed;
      const interpolatedMs = Math.max(0, playback.lastSyncRef.current.audioMs + elapsedWallMs);

      // A-B Looper: auto-seek back to A when reaching B
      const seekTarget = abLoop.checkBoundary(interpolatedMs);
      if (seekTarget !== null) {
        handleSeek(seekTarget);
        // Speed Trainer: bump tempo on completed loop cycle
        if (speedTrainer.isSpeedTrainerRef.current) {
          speedTrainer.triggerStepRef.current();
        }
        animId = requestAnimationFrame(loop);
        return;
      }

      // Metronome Click Track: schedule clicks
      met.scheduleClicks(interpolatedMs, speed, timelineRef.current);

      playback.setCurrentTimeMs(interpolatedMs);
      playback.currentTimeMsRef.current = interpolatedMs;
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, speed, handleSeek, abLoop.checkBoundary, met.scheduleClicks]);

  // ──────────────────────────────────────────────
  // Keyboard Shortcuts
  // ──────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === '?') {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          handlePlayPause();
          break;
        case 'Slash':
          if (e.shiftKey) {
            e.preventDefault();
            setIsShortcutsOpen((prev) => !prev);
          }
          break;
        case 'KeyM':
          e.preventDefault();
          met.toggleMetronome();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handleSeek(Math.max(0, ((playback.currentTimeMsRef.current ?? 0) / 1000) - 5));
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleSeek(Math.min(playback.durationSec, ((playback.currentTimeMsRef.current ?? 0) / 1000) + 5));
          break;
        case 'Minus':
        case 'NumpadSubtract':
          e.preventDefault();
          playback.changeSpeed(Math.max(0.25, playback.speed - 0.1));
          break;
        case 'Equal':
        case 'NumpadAdd':
          e.preventDefault();
          playback.changeSpeed(Math.min(2.0, playback.speed + 0.1));
          break;
        case 'BracketLeft':
          e.preventDefault();
          abLoop.handleSetLoopA();
          break;
        case 'BracketRight':
          e.preventDefault();
          abLoop.handleSetLoopB(handleSeek);
          break;
        case 'Backspace':
          if (abLoop.loopARef.current !== null || abLoop.loopBRef.current !== null) {
            e.preventDefault();
            abLoop.clearABLoop();
          }
          break;
        case 'KeyF':
          e.preventDefault();
          playback.setIsFlipped((prev) => !prev);
          break;
        case 'KeyS':
          e.preventDefault();
          scaleLab.toggleScaleMode();
          break;
        case 'KeyT':
          e.preventDefault();
          handleToggleSpeedTrainer();
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
  }, [handlePlayPause, handleSeek, met.toggleMetronome, playback.durationSec, playback.speed,
      playback.changeSpeed, handleTransposeChange, transpose, scaleLab.toggleScaleMode,
      handleToggleSpeedTrainer, abLoop.handleSetLoopA, abLoop.handleSetLoopB, abLoop.clearABLoop]);

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
        backgroundColor: '#120e0e',
        overflow: 'hidden',
      }}
    >
      {/* 1. Header Toolbar */}
      <TopNav
        songTitle={songTitle}
        songArtist={songArtist}
        activeTrackName={activeTrack?.name || 'Lead Guitar'}
        tempo={tempo}
        timeSignature={met.timeSignature}
        tuning={activeTuning}
        selectedPresetId={selectedPresetId}
        onSelectPreset={handleSelectPreset}
        onFileUpload={handleFileUpload}
        transpose={transpose}
        isScaleMode={scaleLab.isScaleMode}
        onToggleScaleMode={scaleLab.toggleScaleMode}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
      />

      {/* 2. Multi-Instrument Track Flow Switcher */}
      <TrackSelector
        tracks={tracks}
        activeTrackIndex={activeTrackIndex}
        onSelectTrack={handleSelectTrack}
        onToggleMute={handleToggleMute}
        onToggleSolo={handleToggleSolo}
      />

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
          backgroundColor: '#120e0e',
          position: 'relative',
        }}
      >
        {/* Speed Trainer Floating HUD */}
        <SpeedTrainerHUD notification={speedTrainer.notification} />

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
              isScaleMode={scaleLab.isScaleMode}
              scaleRoot={scaleLab.scaleRoot}
              scaleId={scaleLab.scaleId}
              scaleDisplayMode={scaleLab.scaleDisplayMode}
              tuning={activeTuning}
              backingProgressionName={scaleLab.backingProgressionName}
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
          />
        </div>

        {/* Count-In Visual HUD Overlay */}
        <CountInOverlay
          isCountingIn={met.isCountingIn}
          countInBeat={met.countInBeat}
          timeSignature={met.timeSignature}
          tempo={tempo}
        />
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
        onCurrentTimeMsChange={(currMs) => {
          playback.lastSyncRef.current = { audioMs: currMs, wallTime: performance.now() };
          playback.setCurrentTimeMs(currMs);
        }}
        onPlayerStateChange={playback.setIsPlaying}
        isExpanded={playback.isSheetExpanded}
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
          barIndex={currentBarIndex}
          tempo={tempo}
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
          transpose={transpose}
          onTransposeChange={handleTransposeChange}
          isSpeedTrainer={speedTrainer.isSpeedTrainer}
          onToggleSpeedTrainer={handleToggleSpeedTrainer}
          speedTrainerStep={speedTrainer.step}
          speedTrainerTarget={speedTrainer.target}
          speedTrainerLoopCount={speedTrainer.loopCount}
        />
      </div>

      {/* 6. Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
};

export default App;
