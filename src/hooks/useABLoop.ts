import { useState, useRef, useCallback, useEffect } from 'react';
import type { AlphaTabSheetRef } from '../components/Player/AlphaTabSheet';

const MIN_AB_LOOP_GAP_SEC = 0.5;

export function useABLoop(
  currentTimeMsRef: React.RefObject<number>,
  durationSec: number,
  isLooping: boolean,
  setIsLooping: React.Dispatch<React.SetStateAction<boolean>>,
  alphaTabRef: React.RefObject<AlphaTabSheetRef | null>,
) {
  // State
  const [loopA, setLoopA] = useState<number | null>(null);
  const [loopB, setLoopB] = useState<number | null>(null);

  // Refs for high-frequency RAF access
  const loopARef = useRef<number | null>(null);
  const loopBRef = useRef<number | null>(null);
  const lastLoopSeekTimeRef = useRef(0);
  const wasLoopingBeforeABRef = useRef<boolean | null>(null);
  const lastABStatusRef = useRef({ hasAB: false });

  /** Set both state and ref for loop A. */
  const updateLoopA = useCallback((val: number | null) => {
    setLoopA(val);
    loopARef.current = val;
  }, []);

  /** Set both state and ref for loop B. */
  const updateLoopB = useCallback((val: number | null) => {
    setLoopB(val);
    loopBRef.current = val;
  }, []);

  // Auto-toggle isLooping when A-B range is set/cleared
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
  }, [loopA, loopB, isLooping, setIsLooping, alphaTabRef]);

  /** Set loop A marker at current playback position. */
  const handleSetLoopA = useCallback(() => {
    const currentSec = (currentTimeMsRef.current ?? 0) / 1000;
    const clampedA = durationSec > 0
      ? Math.min(Math.max(0, currentSec), Math.max(0, durationSec - MIN_AB_LOOP_GAP_SEC))
      : Math.max(0, currentSec);

    updateLoopA(clampedA);

    const b = loopBRef.current;
    if (b !== null) {
      const gap = b - clampedA;
      if (gap <= 0) {
        // B is at or before new A: reset B
        updateLoopB(null);
      } else if (gap < MIN_AB_LOOP_GAP_SEC) {
        // Gap is too small, expand B forward
        const expandedB = clampedA + MIN_AB_LOOP_GAP_SEC;
        const safeB = durationSec > 0 && expandedB > durationSec ? durationSec : expandedB;
        updateLoopB(safeB);
      }
    }
  }, [currentTimeMsRef, durationSec, updateLoopA, updateLoopB]);

  /** Set loop B marker at current playback position. Calls seekFn to jump to A. */
  const handleSetLoopB = useCallback((seekFn: (seconds: number) => void) => {
    const currentSec = (currentTimeMsRef.current ?? 0) / 1000;
    const clampedCurrent = durationSec > 0
      ? Math.min(Math.max(0, currentSec), durationSec)
      : Math.max(0, currentSec);
    const a = loopARef.current;

    if (a !== null && clampedCurrent > a) {
      const gap = clampedCurrent - a;
      const finalB = gap >= MIN_AB_LOOP_GAP_SEC
        ? clampedCurrent
        : (durationSec > 0 && a + MIN_AB_LOOP_GAP_SEC > durationSec
          ? durationSec
          : a + MIN_AB_LOOP_GAP_SEC);
      if (finalB <= a) return;
      updateLoopB(finalB);
      seekFn(a);
    } else if (a !== null && clampedCurrent <= a) {
      // User set B before A: swap so A < B
      let newA = clampedCurrent;
      let newB = a;
      const swapGap = newB - newA;
      if (swapGap < MIN_AB_LOOP_GAP_SEC) {
        const expandedB = newA + MIN_AB_LOOP_GAP_SEC;
        newB = durationSec > 0 && expandedB > durationSec ? durationSec : expandedB;
        if (newB <= newA) return;
      }
      updateLoopA(newA);
      updateLoopB(newB);
      seekFn(newA);
    } else {
      // A was not set: create fallback range
      const fallbackA = Math.max(0, clampedCurrent - MIN_AB_LOOP_GAP_SEC);
      const fallbackGap = clampedCurrent - fallbackA;
      const finalFallbackB = fallbackGap >= MIN_AB_LOOP_GAP_SEC
        ? clampedCurrent
        : fallbackA + MIN_AB_LOOP_GAP_SEC;
      if (durationSec > 0 && finalFallbackB > durationSec) {
        updateLoopA(0);
        return;
      }
      updateLoopA(fallbackA);
      updateLoopB(finalFallbackB);
      seekFn(fallbackA);
    }
  }, [currentTimeMsRef, durationSec, updateLoopA, updateLoopB]);

  /** Clear both A and B markers. */
  const clearABLoop = useCallback(() => {
    updateLoopA(null);
    updateLoopB(null);
  }, [updateLoopA, updateLoopB]);

  /**
   * Check if playback crossed the B boundary (RAF loop).
   * Returns the seek-target (A) if boundary was hit, or null otherwise.
   */
  const checkBoundary = useCallback((interpolatedMs: number): number | null => {
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
      return a; // Caller should seek to this value
    }
    return null;
  }, []);

  return {
    loopA, loopB,
    loopARef, loopBRef,
    handleSetLoopA, handleSetLoopB,
    clearABLoop, checkBoundary,
    updateLoopA, updateLoopB,
  };
}
