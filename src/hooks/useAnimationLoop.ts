import { useEffect, type MutableRefObject } from 'react';
import type { SongTimeline } from '../services/timelineExtractor';

interface UseAnimationLoopProps {
  isPlaying: boolean;
  speed: number;
  lastSyncRef: MutableRefObject<{ wallTime: number; audioMs: number }>;
  currentTimeMsRef: MutableRefObject<number | null>;
  isSpeedTrainerRef: MutableRefObject<boolean>;
  triggerStepRef: MutableRefObject<() => void>;
  timelineRef: MutableRefObject<SongTimeline | null>;
  checkBoundary: (currentMs: number) => number | null;
  scheduleClicks: (currentMs: number, speed: number, timeline: SongTimeline | null) => void;
  onTimeUpdate: (ms: number) => void;
  onSeek: (seconds: number) => void;
}

/**
 * Runs the 60 FPS requestAnimationFrame loop while the track is playing.
 *
 * Responsibilities (mirroring the original App.tsx loop):
 * - Wall-clock time interpolation between AlphaTab sync events.
 * - A-B looper boundary check and auto-seek.
 * - Speed Trainer step trigger on completed loop cycles.
 * - Metronome click scheduling.
 * - Propagates the interpolated timestamp to the shared ref and state.
 */
export function useAnimationLoop({
  isPlaying,
  speed,
  lastSyncRef,
  currentTimeMsRef,
  isSpeedTrainerRef,
  triggerStepRef,
  timelineRef,
  checkBoundary,
  scheduleClicks,
  onTimeUpdate,
  onSeek,
}: UseAnimationLoopProps): void {
  useEffect(() => {
    if (!isPlaying) return;

    let animId: number;

    const loop = () => {
      const elapsedWallMs = (performance.now() - lastSyncRef.current.wallTime) * speed;
      const interpolatedMs = Math.max(0, lastSyncRef.current.audioMs + elapsedWallMs);

      // A-B Looper: auto-seek back to A when reaching B
      const seekTarget = checkBoundary(interpolatedMs);
      if (seekTarget !== null) {
        onSeek(seekTarget);
        // Speed Trainer: bump tempo on completed loop cycle
        if (isSpeedTrainerRef.current) {
          triggerStepRef.current();
        }
        animId = requestAnimationFrame(loop);
        return;
      }

      // Metronome Click Track: schedule upcoming clicks
      scheduleClicks(interpolatedMs, speed, timelineRef.current);

      onTimeUpdate(interpolatedMs);
      currentTimeMsRef.current = interpolatedMs;
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [
    isPlaying, speed, onSeek, checkBoundary, scheduleClicks,
    lastSyncRef, isSpeedTrainerRef, triggerStepRef, onTimeUpdate, currentTimeMsRef, timelineRef,
  ]);
}
