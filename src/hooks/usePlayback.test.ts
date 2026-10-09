// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePlayback } from './usePlayback';
import type { AlphaTabSheetRef } from '../components/Player/AlphaTabSheet';

describe('usePlayback hook', () => {
  let mockAlphaTabRef: { current: AlphaTabSheetRef };

  beforeEach(() => {
    mockAlphaTabRef = {
      current: {
        play: vi.fn(),
        pause: vi.fn(),
        seek: vi.fn(),
        setSpeed: vi.fn(),
        setLoop: vi.fn(),
        setVolume: vi.fn(),
        setTranspose: vi.fn(),
        loadTex: vi.fn(),
        loadFile: vi.fn(),
        changeTrack: vi.fn(),
        toggleMute: vi.fn(),
        toggleSolo: vi.fn(),
      } as unknown as AlphaTabSheetRef,
    };
  });

  it('initializes with correct default values', () => {
    const { result } = renderHook(() => usePlayback(mockAlphaTabRef));

    expect(result.current.isPlaying).toBe(false);
    expect(result.current.currentTimeMs).toBe(0);
    expect(result.current.durationSec).toBe(0);
    expect(result.current.speed).toBe(1.0);
    expect(result.current.isSoloSlowdown).toBe(false);
    expect(result.current.isLooping).toBe(false);
    expect(result.current.volume).toBe(0.8);
    expect(result.current.isSheetExpanded).toBe(false);
    expect(result.current.isFlipped).toBe(false);
    expect(result.current.currentTimeMsRef.current).toBe(0);
    expect(result.current.speedRef.current).toBe(1.0);
  });

  it('handles seek and syncs refs and alphaTab', () => {
    const { result } = renderHook(() => usePlayback(mockAlphaTabRef));

    act(() => {
      result.current.seek(15.5);
    });

    expect(mockAlphaTabRef.current.seek).toHaveBeenCalledWith(15.5);
    expect(result.current.currentTimeMs).toBe(15500);
    expect(result.current.currentTimeMsRef.current).toBe(15500);
    expect(result.current.lastSyncRef.current.audioMs).toBe(15500);
  });

  it('handles changeSpeed and updates speedRef and alphaTab', () => {
    const { result } = renderHook(() => usePlayback(mockAlphaTabRef));

    act(() => {
      result.current.changeSpeed(0.75);
    });

    expect(result.current.speed).toBe(0.75);
    expect(result.current.speedRef.current).toBe(0.75);
    expect(mockAlphaTabRef.current.setSpeed).toHaveBeenCalledWith(0.75);
  });

  it('resets isSoloSlowdown when speed is changed back to 1.0', () => {
    const { result } = renderHook(() => usePlayback(mockAlphaTabRef));

    act(() => {
      result.current.toggleSoloSlowdown();
    });
    expect(result.current.isSoloSlowdown).toBe(true);
    expect(result.current.speed).toBe(0.5);

    act(() => {
      result.current.changeSpeed(1.0);
    });
    expect(result.current.isSoloSlowdown).toBe(false);
    expect(result.current.speed).toBe(1.0);
  });

  it('toggles solo slowdown between 50% and 100%', () => {
    const { result } = renderHook(() => usePlayback(mockAlphaTabRef));

    // Toggle on -> 50%
    act(() => {
      result.current.toggleSoloSlowdown();
    });
    expect(result.current.isSoloSlowdown).toBe(true);
    expect(result.current.speed).toBe(0.5);
    expect(mockAlphaTabRef.current.setSpeed).toHaveBeenCalledWith(0.5);

    // Toggle off -> 100%
    act(() => {
      result.current.toggleSoloSlowdown();
    });
    expect(result.current.isSoloSlowdown).toBe(false);
    expect(result.current.speed).toBe(1.0);
    expect(mockAlphaTabRef.current.setSpeed).toHaveBeenCalledWith(1.0);
  });

  it('toggles global loop state', () => {
    const { result } = renderHook(() => usePlayback(mockAlphaTabRef));

    act(() => {
      result.current.toggleLoop();
    });
    expect(result.current.isLooping).toBe(true);
    expect(mockAlphaTabRef.current.setLoop).toHaveBeenCalledWith(true);

    act(() => {
      result.current.toggleLoop();
    });
    expect(result.current.isLooping).toBe(false);
    expect(mockAlphaTabRef.current.setLoop).toHaveBeenCalledWith(false);
  });

  it('changes master volume', () => {
    const { result } = renderHook(() => usePlayback(mockAlphaTabRef));

    act(() => {
      result.current.changeVolume(0.4);
    });
    expect(result.current.volume).toBe(0.4);
    expect(mockAlphaTabRef.current.setVolume).toHaveBeenCalledWith(0.4);
  });

  it('syncs audio time and lastSyncRef via syncTime', () => {
    const { result } = renderHook(() => usePlayback(mockAlphaTabRef));

    act(() => {
      result.current.syncTime(4200);
    });
    expect(result.current.currentTimeMs).toBe(4200);
    expect(result.current.lastSyncRef.current.audioMs).toBe(4200);
  });

  it('resets sync time via resetSync', () => {
    const { result } = renderHook(() => usePlayback(mockAlphaTabRef));

    act(() => {
      result.current.syncTime(5000);
    });
    expect(result.current.currentTimeMs).toBe(5000);

    act(() => {
      result.current.resetSync();
    });
    expect(result.current.currentTimeMs).toBe(0);
    expect(result.current.currentTimeMsRef.current).toBe(0);
    expect(result.current.lastSyncRef.current.audioMs).toBe(0);
    expect(result.current.lastSyncRef.current.wallTime).toBe(0);
  });

  it('allows updating other toggles (flip, sheetExpanded, isPlaying)', () => {
    const { result } = renderHook(() => usePlayback(mockAlphaTabRef));

    act(() => {
      result.current.setIsPlaying(true);
      result.current.setIsFlipped(true);
      result.current.setIsSheetExpanded(true);
      result.current.setDurationSec(120);
    });

    expect(result.current.isPlaying).toBe(true);
    expect(result.current.isFlipped).toBe(true);
    expect(result.current.isSheetExpanded).toBe(true);
    expect(result.current.durationSec).toBe(120);
  });
});
