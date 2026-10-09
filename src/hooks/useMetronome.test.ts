// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMetronome } from './useMetronome';
import { metronome } from '../services/metronome';
import type { AlphaTabSheetRef } from '../components/Player/AlphaTabSheet';
import type { SongTimeline } from '../services/timelineExtractor';

describe('useMetronome hook', () => {
  let mockAlphaTabRef: { current: AlphaTabSheetRef };
  let currentTimeMsRef: { current: number };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(metronome, 'resume').mockImplementation(() => {});
    vi.spyOn(metronome, 'playClick').mockImplementation(() => {});
    vi.spyOn(metronome, 'setVolume').mockImplementation(() => {});
    vi.spyOn(metronome, 'getCurrentTime').mockReturnValue(1.0);

    mockAlphaTabRef = {
      current: {
        playPause: vi.fn(),
      } as unknown as AlphaTabSheetRef,
    };
    currentTimeMsRef = { current: 0 };
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('initializes with default metronome settings', () => {
    const { result } = renderHook(() =>
      useMetronome(120, 1.0, mockAlphaTabRef, currentTimeMsRef),
    );

    expect(result.current.timeSignature).toBe('4/4');
    expect(result.current.isMetronomeOn).toBe(false);
    expect(result.current.metronomeVolume).toBe(0.7);
    expect(result.current.isCountInEnabled).toBe(false);
    expect(result.current.isCountingIn).toBe(false);
    expect(result.current.countInBeat).toBe(0);
  });

  it('toggles metronome on and off and resumes audio context', () => {
    const { result } = renderHook(() =>
      useMetronome(120, 1.0, mockAlphaTabRef, currentTimeMsRef),
    );

    act(() => {
      result.current.toggleMetronome();
    });
    expect(result.current.isMetronomeOn).toBe(true);
    expect(metronome.resume).toHaveBeenCalled();

    act(() => {
      result.current.toggleMetronome();
    });
    expect(result.current.isMetronomeOn).toBe(false);
  });

  it('changes metronome volume and informs metronome service', () => {
    const { result } = renderHook(() =>
      useMetronome(120, 1.0, mockAlphaTabRef, currentTimeMsRef),
    );

    act(() => {
      result.current.changeMetronomeVolume(0.9);
    });

    expect(result.current.metronomeVolume).toBe(0.9);
    expect(metronome.setVolume).toHaveBeenCalledWith(0.9);
  });

  it('executes 1-bar count-in sequence and triggers playPause', () => {
    const { result } = renderHook(() =>
      useMetronome(120, 1.0, mockAlphaTabRef, currentTimeMsRef),
    );

    act(() => {
      result.current.startCountIn();
    });

    expect(result.current.isCountingIn).toBe(true);

    // At 120 BPM, 1 beat = 500ms
    // Beat 1 timer fires on first tick (0ms)
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current.countInBeat).toBe(1);
    expect(metronome.playClick).toHaveBeenCalledWith(undefined, true);

    // Advance to beat 2 (+500ms)
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current.countInBeat).toBe(2);

    // Advance through beats 3 and 4 (+1000ms)
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.countInBeat).toBe(4);

    // Finish count-in (+500ms -> total 2000ms for 4 beats)
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current.isCountingIn).toBe(false);
    expect(result.current.countInBeat).toBe(0);
    expect(mockAlphaTabRef.current.playPause).toHaveBeenCalled();
  });

  it('cancels count-in mid-way without triggering playPause', () => {
    const { result } = renderHook(() =>
      useMetronome(120, 1.0, mockAlphaTabRef, currentTimeMsRef),
    );

    act(() => {
      result.current.startCountIn();
    });
    expect(result.current.isCountingIn).toBe(true);

    act(() => {
      vi.advanceTimersByTime(500); // at beat 2
      result.current.cancelCountIn();
    });

    expect(result.current.isCountingIn).toBe(false);
    expect(result.current.countInBeat).toBe(0);

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(mockAlphaTabRef.current.playPause).not.toHaveBeenCalled();
  });

  it('schedules clicks during RAF loop with mathematical fallback', () => {
    const { result } = renderHook(() =>
      useMetronome(120, 1.0, mockAlphaTabRef, currentTimeMsRef),
    );

    act(() => {
      result.current.toggleMetronome();
    });

    // At 120 BPM, beat occurs at 500ms. Lookahead is [480, 550]
    act(() => {
      result.current.scheduleClicks(480, 1.0, null);
    });

    expect(metronome.playClick).toHaveBeenCalled();
  });

  it('schedules clicks during RAF loop with timeline metronome beats', () => {
    const { result } = renderHook(() =>
      useMetronome(120, 1.0, mockAlphaTabRef, currentTimeMsRef),
    );

    act(() => {
      result.current.toggleMetronome();
    });

    const mockTimeline: Partial<SongTimeline> = {
      metronomeBeats: [
        { timeMs: 500, isStrong: true, barIndex: 1, beatNumber: 1 },
        { timeMs: 1000, isStrong: false, barIndex: 1, beatNumber: 2 },
      ],
    };

    act(() => {
      result.current.scheduleClicks(480, 1.0, mockTimeline as SongTimeline);
    });

    expect(metronome.playClick).toHaveBeenCalled();
  });
});
