// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEngineState } from './useEngineState';

describe('useEngineState hook', () => {
  it('initializes with loading engine state', () => {
    const { result } = renderHook(() => useEngineState());

    expect(result.current.isEngineLoading).toBe(true);
    expect(result.current.soundFontProgress).toBe(15);
    expect(result.current.soundFontStatus).toContain('Mengunduh SoundFont');
    expect(result.current.soundFontError).toBeNull();
    expect(result.current.isLoadingScore).toBe(false);
  });

  it('updates progress on handleSoundFontProgress', () => {
    const { result } = renderHook(() => useEngineState());

    act(() => {
      // 5MB of 10MB
      result.current.handleSoundFontProgress(5 * 1024 * 1024, 10 * 1024 * 1024);
    });

    expect(result.current.soundFontProgress).toBe(50);
    expect(result.current.soundFontStatus).toContain('5.0 MB');
  });

  it('updates state when SoundFont loaded and player ready', () => {
    const { result } = renderHook(() => useEngineState());

    act(() => {
      result.current.handleSoundFontLoaded();
    });

    expect(result.current.soundFontProgress).toBe(100);
    expect(result.current.soundFontStatus).toContain('AlphaSynth');

    act(() => {
      result.current.handlePlayerReady();
    });

    expect(result.current.soundFontStatus).toBe('Siap Bermain!');
    expect(result.current.isEngineLoading).toBe(false);
  });

  it('handles score loading and loaded states', () => {
    const { result } = renderHook(() => useEngineState());

    act(() => {
      result.current.handleScoreLoading();
    });
    expect(result.current.isLoadingScore).toBe(true);

    act(() => {
      result.current.handleScoreLoaded();
    });
    expect(result.current.isLoadingScore).toBe(false);

    act(() => {
      result.current.handleScoreLoading();
    });
    expect(result.current.isLoadingScore).toBe(true);

    act(() => {
      result.current.clearLoadingOnError();
    });
    expect(result.current.isLoadingScore).toBe(false);
  });

  it('handles retry by clearing errors and reloading', () => {
    const originalLocation = window.location;
    const reloadMock = vi.fn();
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { reload: reloadMock },
    });

    const { result } = renderHook(() => useEngineState());

    act(() => {
      result.current.setSoundFontError('Download failed');
    });
    expect(result.current.soundFontError).toBe('Download failed');

    act(() => {
      result.current.handleRetry();
    });

    expect(result.current.soundFontError).toBeNull();
    expect(result.current.isEngineLoading).toBe(true);
    expect(reloadMock).toHaveBeenCalled();

    Object.defineProperty(window, 'location', {
      writable: true,
      value: originalLocation,
    });
  });
});
