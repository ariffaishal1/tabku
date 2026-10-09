// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSpeedTrainer } from './useSpeedTrainer';

describe('useSpeedTrainer hook', () => {
  let changeSpeedMock: ReturnType<typeof vi.fn<(speed: number) => void>>;
  let speedRef: { current: number };

  beforeEach(() => {
    vi.useFakeTimers();
    changeSpeedMock = vi.fn((speed: number) => {
      speedRef.current = speed;
    });
    speedRef = { current: 0.7 };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes with default trainer settings', () => {
    const { result } = renderHook(() => useSpeedTrainer(changeSpeedMock, speedRef));

    expect(result.current.isSpeedTrainer).toBe(false);
    expect(result.current.step).toBe(0.05);
    expect(result.current.target).toBe(1.0);
    expect(result.current.loopCount).toBe(0);
    expect(result.current.notification).toBeNull();
    expect(result.current.isSpeedTrainerRef.current).toBe(false);
  });

  it('increments tempo by step when triggered and below target', () => {
    speedRef.current = 0.8;
    const { result } = renderHook(() => useSpeedTrainer(changeSpeedMock, speedRef));

    act(() => {
      result.current.triggerStepRef.current();
    });

    expect(changeSpeedMock).toHaveBeenCalledWith(0.85);
    expect(result.current.loopCount).toBe(1);
    expect(result.current.notification).toContain('TEMPO NAIK: 85% (+5%) · Loop 1x');
  });

  it('notifies target reached when next speed reaches or caps at target', () => {
    speedRef.current = 0.98;
    const { result } = renderHook(() => useSpeedTrainer(changeSpeedMock, speedRef));

    act(() => {
      result.current.triggerStepRef.current();
    });

    expect(changeSpeedMock).toHaveBeenCalledWith(1.0);
    expect(result.current.loopCount).toBe(1);
    expect(result.current.notification).toContain('TARGET TERCAPAI: 100% (Siklus 1x)!');
  });

  it('handles speed already at or above target without increasing speed further', () => {
    speedRef.current = 1.0;
    const { result } = renderHook(() => useSpeedTrainer(changeSpeedMock, speedRef));

    act(() => {
      result.current.triggerStepRef.current();
    });

    expect(changeSpeedMock).not.toHaveBeenCalled();
    expect(result.current.loopCount).toBe(1);
    expect(result.current.notification).toContain('SIKLUS 1x: TEMPO PENUH 100%');
  });

  it('auto-clears notification after 2200ms', () => {
    speedRef.current = 0.7;
    const { result } = renderHook(() => useSpeedTrainer(changeSpeedMock, speedRef));

    act(() => {
      result.current.triggerStepRef.current();
    });
    expect(result.current.notification).not.toBeNull();

    act(() => {
      vi.advanceTimersByTime(2200);
    });

    expect(result.current.notification).toBeNull();
  });

  it('synchronizes isSpeedTrainer ref when toggled', () => {
    const { result } = renderHook(() => useSpeedTrainer(changeSpeedMock, speedRef));

    expect(result.current.isSpeedTrainerRef.current).toBe(false);

    act(() => {
      result.current.setIsSpeedTrainer(true);
    });

    expect(result.current.isSpeedTrainer).toBe(true);
    expect(result.current.isSpeedTrainerRef.current).toBe(true);
  });

  it('allows customizing step and target', () => {
    speedRef.current = 0.6;
    const { result } = renderHook(() => useSpeedTrainer(changeSpeedMock, speedRef));

    act(() => {
      result.current.setStep(0.1);
      result.current.setTarget(0.8);
    });

    expect(result.current.step).toBe(0.1);
    expect(result.current.target).toBe(0.8);

    act(() => {
      result.current.triggerStepRef.current();
    });

    expect(changeSpeedMock).toHaveBeenCalledWith(0.7);
    expect(result.current.notification).toContain('TEMPO NAIK: 70% (+10%)');
  });
});
