import React, { useMemo } from 'react';
import type { ExtractedNote, SectionMarker } from '../../services/timelineExtractor';
import { findSectionAtTime } from '../../services/timelineExtractor';
import { SectionRibbon } from './SectionRibbon';
import { ScrubberTimeline } from './ScrubberTimeline';
import { SectionSelectorCluster } from './SectionSelectorCluster';
import { PracticeToolsCluster } from './PracticeToolsCluster';
import { TransportCenterCluster } from './TransportCenterCluster';
import { AudioToolsCluster } from './AudioToolsCluster';

export interface TelemetryBarProps {
  currentNotes?: ExtractedNote[];
  nextNotes?: ExtractedNote[];
  currentChordName?: string;
  nextChordName?: string;
  currentSection?: string;
  nextSection?: string;
  sections?: SectionMarker[];
  onPrevSection?: () => void;
  onNextSection?: () => void;
  barIndex: number;
  tempo: number;
  timeSignature?: string;

  // Playback controls
  isPlaying: boolean;
  onPlayPause: () => void;
  onStop: () => void;
  currentTime: number;
  duration: number;
  onSeek: (seconds: number) => void;
  speed: number;
  isSoloSlowdown: boolean;
  onToggleSoloSlowdown: () => void;
  isLooping: boolean;
  onToggleLoop: () => void;
  isSheetExpanded: boolean;
  onToggleSheet: () => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
  onSpeedChange?: (speed: number) => void;

  // A-B Looper
  loopA?: number | null;
  loopB?: number | null;
  onSetLoopA?: () => void;
  onSetLoopB?: () => void;
  onClearABLoop?: () => void;

  // Flip Strings (Player POV)
  isFlipped?: boolean;
  onToggleFlip?: () => void;

  // Metronome & Count-In
  isMetronomeOn?: boolean;
  onToggleMetronome?: () => void;
  metronomeVolume?: number;
  onMetronomeVolumeChange?: (vol: number) => void;
  isCountInEnabled?: boolean;
  onToggleCountIn?: () => void;
  isCountingIn?: boolean;
  countInBeat?: number;

  // Transpose / Virtual Pitch Shifter (FR-NEXT-04)
  transpose?: number;
  onTransposeChange?: (semitones: number) => void;

  // Speed Trainer (FR-NEXT-06)
  isSpeedTrainer?: boolean;
  onToggleSpeedTrainer?: () => void;
  speedTrainerStep?: number;
  speedTrainerTarget?: number;
  speedTrainerLoopCount?: number;

  // Stage / Fullscreen Focus Mode (Zen Mode)
  isStageMode?: boolean;
  onToggleStageMode?: () => void;
}

/**
 * Studio DAW-grade Telemetry & Transport Bar.
 * Orchestrates Section Ribbon, Scrubber Timeline, Navigation & Bar indicator,
 * Practice tools (Speed, Key Transpose, Trainer, A-B Loop), Playback transport,
 * and Audio tools (Metronome, Master Volume, 2D Sheet).
 */
export const TelemetryBar: React.FC<TelemetryBarProps> = ({
  currentSection,
  nextSection,
  sections,
  onPrevSection,
  onNextSection,
  barIndex,
  tempo,
  timeSignature = '4/4',
  isPlaying,
  onPlayPause,
  onStop,
  currentTime,
  duration,
  onSeek,
  speed,
  isSoloSlowdown,
  onToggleSoloSlowdown,
  isLooping,
  onToggleLoop,
  isSheetExpanded,
  onToggleSheet,
  volume,
  onVolumeChange,
  onSpeedChange,
  loopA,
  loopB,
  onSetLoopA,
  onSetLoopB,
  onClearABLoop,
  isFlipped = false,
  onToggleFlip,
  isMetronomeOn = false,
  onToggleMetronome,
  metronomeVolume = 0.7,
  onMetronomeVolumeChange,
  isCountInEnabled = false,
  onToggleCountIn,
  isCountingIn = false,
  countInBeat = 0,
  transpose = 0,
  onTransposeChange,
  isSpeedTrainer = false,
  onToggleSpeedTrainer,
  speedTrainerStep = 0.05,
  speedTrainerTarget = 1.0,
  speedTrainerLoopCount = 0,
  isStageMode = false,
  onToggleStageMode,
}) => {
  // Active section based on current playback time
  const activeSection = useMemo(() => {
    if (!sections || sections.length === 0) return null;
    return findSectionAtTime(sections, currentTime * 1000);
  }, [sections, currentTime]);

  const activeSectionDisplayName = activeSection?.name || currentSection || nextSection || 'Main';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        backgroundColor: 'var(--bg-surface)',
        borderTop: '1px solid var(--border-subtle)',
        boxSizing: 'border-box',
        userSelect: 'none',
        flexShrink: 0,
      }}
    >
      {/* 1. Mini-Map Section Ribbon (DAW-grade arrangement overview) */}
      <SectionRibbon
        sections={sections}
        duration={duration}
        activeSection={activeSection}
        onSeek={onSeek}
      />

      {/* 2. Scrub Progress Bar — Always visible, interactive DAW-grade seekbar */}
      <ScrubberTimeline
        currentTime={currentTime}
        duration={duration}
        onSeek={onSeek}
        sections={sections}
        loopA={loopA}
        loopB={loopB}
        isPlaying={isPlaying}
      />

      {/* 3. Studio Transport & Practice Controls Bar */}
      <div
        className="telemetry-transport-row"
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: '38px',
          padding: '0 12px',
          gap: '8px',
        }}
      >
        {/* Left Side: Session Status, Navigation & Practice Tools */}
        <div
          className="telemetry-left-cluster"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            flexShrink: 0,
          }}
        >
          {/* Song Section & Bar Indicator DAW Cluster */}
          <SectionSelectorCluster
            barIndex={barIndex}
            tempo={tempo}
            timeSignature={timeSignature}
            sections={sections}
            activeSection={activeSection}
            activeSectionDisplayName={activeSectionDisplayName}
            onPrevSection={onPrevSection}
            onNextSection={onNextSection}
            onSeek={onSeek}
          />

          {/* Speed, Pitch Shift, Solo 50%, Speed Trainer, A-B Looper, Flip POV */}
          <PracticeToolsCluster
            speed={speed}
            onSpeedChange={onSpeedChange}
            transpose={transpose}
            onTransposeChange={onTransposeChange}
            isSoloSlowdown={isSoloSlowdown}
            onToggleSoloSlowdown={onToggleSoloSlowdown}
            isSpeedTrainer={isSpeedTrainer}
            onToggleSpeedTrainer={onToggleSpeedTrainer}
            speedTrainerStep={speedTrainerStep}
            speedTrainerTarget={speedTrainerTarget}
            speedTrainerLoopCount={speedTrainerLoopCount}
            isLooping={isLooping}
            onToggleLoop={onToggleLoop}
            loopA={loopA}
            loopB={loopB}
            onSetLoopA={onSetLoopA}
            onSetLoopB={onSetLoopB}
            onClearABLoop={onClearABLoop}
            isFlipped={isFlipped}
            onToggleFlip={onToggleFlip}
          />
        </div>

        {/* Center: Main Playback Controls */}
        <TransportCenterCluster
          isPlaying={isPlaying}
          isCountingIn={isCountingIn}
          countInBeat={countInBeat}
          currentTime={currentTime}
          duration={duration}
          onPlayPause={onPlayPause}
          onStop={onStop}
        />

        {/* Right Side: Audio & View Tools */}
        <AudioToolsCluster
          isMetronomeOn={isMetronomeOn}
          onToggleMetronome={onToggleMetronome}
          metronomeVolume={metronomeVolume}
          onMetronomeVolumeChange={onMetronomeVolumeChange}
          isCountInEnabled={isCountInEnabled}
          onToggleCountIn={onToggleCountIn}
          volume={volume}
          onVolumeChange={onVolumeChange}
          isSheetExpanded={isSheetExpanded}
          onToggleSheet={onToggleSheet}
          isStageMode={isStageMode}
          onToggleStageMode={onToggleStageMode}
        />
      </div>
    </div>
  );
};
