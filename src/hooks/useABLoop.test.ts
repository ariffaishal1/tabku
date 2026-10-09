// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useABLoop } from './useABLoop';
import type { AlphaTabSheetRef } from '../components/Player/AlphaTabSheet';

describe('useABLoop hook', () => {
  let currentTimeMsRef: { current: number };
  let mockAlphaTabRef: { current: AlphaTabSheetRef };
  let isLooping: boolean;
  let setIsLooping: (val: boolean | ((prev: boolean) => boolean)) => void;

  beforeEach(() => {
    currentTimeMsRef = { current: 10000 }; // 10s
    isLooping = false;
    setIsLooping = vi.fn((val) => {
      if (typeof val === 'function') {
        isLooping = val(isLooping);
      } else {
        isLooping = val;
      }
    });
    mockAlphaTabRef = {
      current: {
        setLoop: vi.fn(),
      } as unknown as AlphaTabSheetRef,
    };
  });

  it('initializes with null loopA and loopB', () => {
    const { result } = renderHook(() =>
      useABLoop(currentTimeMsRef, 60, isLooping, setIsLooping, mockAlphaTabRef),
    );

    expect(result.current.loopA).toBeNull();
    expect(result.current.loopB).toBeNull();
    expect(result.current.loopARef.current).toBeNull();
    expect(result.current.loopBRef.current).toBeNull();
  });

  it('sets loop A correctly at current playback position', () => {
    currentTimeMsRef.current = 15000; // 15 seconds
    const { result } = renderHook(() =>
      useABLoop(currentTimeMsRef, 60, isLooping, setIsLooping, mockAlphaTabRef),
    );

    act(() => {
      result.current.handleSetLoopA();
    });

    expect(result.current.loopA).toBe(15);
    expect(result.current.loopARef.current).toBe(15);
  });

  it('clamps loop A to duration minus 0.5s if current time exceeds boundary', () => {
    currentTimeMsRef.current = 60000; // 60s, same as duration
    const { result } = renderHook(() =>
      useABLoop(currentTimeMsRef, 60, isLooping, setIsLooping, mockAlphaTabRef),
    );

    act(() => {
      result.current.handleSetLoopA();
    });

    expect(result.current.loopA).toBe(59.5);
  });

  it('resets B if new A is placed at or after B', () => {
    const { result } = renderHook(() =>
      useABLoop(currentTimeMsRef, 60, isLooping, setIsLooping, mockAlphaTabRef),
    );

    // Set A at 10s
    currentTimeMsRef.current = 10000;
    act(() => {
      result.current.handleSetLoopA();
    });

    // Set B at 20s
    currentTimeMsRef.current = 20000;
    const seekFn = vi.fn();
    act(() => {
      result.current.handleSetLoopB(seekFn);
    });
    expect(result.current.loopB).toBe(20);

    // Now set A at 25s (after B) -> B should be reset
    currentTimeMsRef.current = 25000;
    act(() => {
      result.current.handleSetLoopA();
    });
    expect(result.current.loopA).toBe(25);
    expect(result.current.loopB).toBeNull();
  });

  it('sets loop B after A and calls seekFn back to A', () => {
    const { result } = renderHook(() =>
      useABLoop(currentTimeMsRef, 60, isLooping, setIsLooping, mockAlphaTabRef),
    );

    currentTimeMsRef.current = 10000; // 10s
    act(() => {
      result.current.handleSetLoopA();
    });

    currentTimeMsRef.current = 18000; // 18s
    const seekFn = vi.fn();
    act(() => {
      result.current.handleSetLoopB(seekFn);
    });

    expect(result.current.loopA).toBe(10);
    expect(result.current.loopB).toBe(18);
    expect(seekFn).toHaveBeenCalledWith(10);
  });

  it('swaps A and B when user sets B before current A', () => {
    const { result } = renderHook(() =>
      useABLoop(currentTimeMsRef, 60, isLooping, setIsLooping, mockAlphaTabRef),
    );

    // Set A at 30s
    currentTimeMsRef.current = 30000;
    act(() => {
      result.current.handleSetLoopA();
    });

    // User is now at 12s and sets B -> should swap so A=12, B=30
    currentTimeMsRef.current = 12000;
    const seekFn = vi.fn();
    act(() => {
      result.current.handleSetLoopB(seekFn);
    });

    expect(result.current.loopA).toBe(12);
    expect(result.current.loopB).toBe(30);
    expect(seekFn).toHaveBeenCalledWith(12);
  });

  it('creates fallback A when B is pressed without prior A', () => {
    const { result } = renderHook(() =>
      useABLoop(currentTimeMsRef, 60, isLooping, setIsLooping, mockAlphaTabRef),
    );

    currentTimeMsRef.current = 10000; // 10s
    const seekFn = vi.fn();
    act(() => {
      result.current.handleSetLoopB(seekFn);
    });

    expect(result.current.loopA).toBe(9.5);
    expect(result.current.loopB).toBe(10);
    expect(seekFn).toHaveBeenCalledWith(9.5);
  });

  it('clears both loop points when clearABLoop is called', () => {
    const { result } = renderHook(() =>
      useABLoop(currentTimeMsRef, 60, isLooping, setIsLooping, mockAlphaTabRef),
    );

    act(() => {
      result.current.updateLoopA(5);
      result.current.updateLoopB(15);
    });
    expect(result.current.loopA).toBe(5);
    expect(result.current.loopB).toBe(15);

    act(() => {
      result.current.clearABLoop();
    });
    expect(result.current.loopA).toBeNull();
    expect(result.current.loopB).toBeNull();
    expect(result.current.loopARef.current).toBeNull();
    expect(result.current.loopBRef.current).toBeNull();
  });

  it('checks loop boundary and triggers seek to A when B is reached', () => {
    const { result } = renderHook(() =>
      useABLoop(currentTimeMsRef, 60, isLooping, setIsLooping, mockAlphaTabRef),
    );

    act(() => {
      result.current.updateLoopA(4);
      result.current.updateLoopB(8);
    });

    // Before boundary
    expect(result.current.checkBoundary(7000)).toBeNull();

    // At or after boundary (8s = 8000ms)
    const target = result.current.checkBoundary(8100);
    expect(target).toBe(4);

    // Calling immediately within throttle window (<300ms) returns null
    expect(result.current.checkBoundary(8200)).toBeNull();
  });

  it('auto-enables global loop when A-B is set, and restores when cleared', () => {
    isLooping = false;
    const { result, rerender } = renderHook(
      ({ currentLooping }) =>
        useABLoop(currentTimeMsRef, 60, currentLooping, setIsLooping, mockAlphaTabRef),
      { initialProps: { currentLooping: false } },
    );

    // Set A and B
    act(() => {
      result.current.updateLoopA(5);
      result.current.updateLoopB(10);
    });

    expect(setIsLooping).toHaveBeenCalledWith(true);
    expect(mockAlphaTabRef.current.setLoop).toHaveBeenCalledWith(true);

    // Re-render with looping true as simulated state update
    rerender({ currentLooping: true });

    // Clear A-B -> should restore previous loop state (which was false)
    act(() => {
      result.current.clearABLoop();
    });

    expect(setIsLooping).toHaveBeenCalledWith(false);
    expect(mockAlphaTabRef.current.setLoop).toHaveBeenCalledWith(false);
  });
});
