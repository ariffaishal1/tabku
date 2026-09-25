import { useState, useRef, useCallback, useEffect } from 'react';
import type { AlphaTabSheetRef } from '../components/Player/AlphaTabSheet';

export function usePlayback(alphaTabRef: React.RefObject<AlphaTabSheetRef | null>) {
  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [durationSec, setDurationSec] = useState(0);
  const [speed, setSpeed] = useState(1.0);
  const [isSoloSlowdown, setIsSoloSlowdown] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [isSheetExpanded, setIsSheetExpanded] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

  // Refs for high-frequency RAF access
  const lastSyncRef = useRef({ audioMs: 0, wallTime: performance.now() });
  const currentTimeMsRef = useRef(0);
  const speedRef = useRef(1.0);

  // Keep refs in sync with state
  useEffect(() => { currentTimeMsRef.current = currentTimeMs; }, [currentTimeMs]);
  useEffect(() => { speedRef.current = speed; }, [speed]);

  /** Seek to a position (seconds). Updates state + refs + AlphaTab. */
  const seek = useCallback((seconds: number) => {
    alphaTabRef.current?.seek(seconds);
    const ms = seconds * 1000;
    setCurrentTimeMs(ms);
    currentTimeMsRef.current = ms;
    lastSyncRef.current = { audioMs: ms, wallTime: performance.now() };
  }, [alphaTabRef]);

  /** Change playback speed and sync with AlphaTab. */
  const changeSpeed = useCallback((newSpeed: number) => {
    setSpeed(newSpeed);
    speedRef.current = newSpeed;
    alphaTabRef.current?.setSpeed(newSpeed);
    if (newSpeed === 1.0) setIsSoloSlowdown(false);
  }, [alphaTabRef]);

  /** Toggle 50% solo slowdown mode. */
  const toggleSoloSlowdown = useCallback(() => {
    if (isSoloSlowdown) {
      setIsSoloSlowdown(false);
      changeSpeed(1.0);
    } else {
      setIsSoloSlowdown(true);
      changeSpeed(0.5);
    }
  }, [isSoloSlowdown, changeSpeed]);

  /** Toggle global loop. */
  const toggleLoop = useCallback(() => {
    setIsLooping(prev => {
      const next = !prev;
      alphaTabRef.current?.setLoop(next);
      return next;
    });
  }, [alphaTabRef]);

  /** Change master volume. */
  const changeVolume = useCallback((newVolume: number) => {
    setVolume(newVolume);
    alphaTabRef.current?.setVolume(newVolume);
  }, [alphaTabRef]);

  /** Reset sync point to 0 (used on stop / song change). */
  const resetSync = useCallback(() => {
    setCurrentTimeMs(0);
    currentTimeMsRef.current = 0;
    lastSyncRef.current = { audioMs: 0, wallTime: performance.now() };
  }, []);

  return {
    // State
    isPlaying, setIsPlaying,
    currentTimeMs, setCurrentTimeMs,
    durationSec, setDurationSec,
    speed,
    isSoloSlowdown,
    isLooping, setIsLooping,
    volume,
    isSheetExpanded, setIsSheetExpanded,
    isFlipped, setIsFlipped,
    // Refs
    lastSyncRef, currentTimeMsRef, speedRef,
    // Handlers
    seek, changeSpeed, toggleSoloSlowdown, toggleLoop, changeVolume, resetSync,
  };
}
