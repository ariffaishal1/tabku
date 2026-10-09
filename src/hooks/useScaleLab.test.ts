// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useScaleLab } from './useScaleLab';

describe('useScaleLab hook', () => {
  it('initializes with default scale theory state', () => {
    const { result } = renderHook(() => useScaleLab(100));

    expect(result.current.isScaleMode).toBe(true);
    expect(result.current.scaleRoot).toBe(9); // A
    expect(result.current.scaleId).toBe('minor_pentatonic');
    expect(result.current.scaleDisplayMode).toBe('degrees');
    expect(result.current.scalePosition).toBe('all');
    expect(result.current.backingProgressionName).toBe('A Minor Rock/Ballad Groove');
  });

  it('toggles scale mode', () => {
    const { result } = renderHook(() => useScaleLab(100));

    act(() => {
      result.current.toggleScaleMode();
    });
    expect(result.current.isScaleMode).toBe(false);

    act(() => {
      result.current.toggleScaleMode();
    });
    expect(result.current.isScaleMode).toBe(true);
  });

  it('toggles display mode between degrees and notes', () => {
    const { result } = renderHook(() => useScaleLab(100));

    expect(result.current.scaleDisplayMode).toBe('degrees');

    act(() => {
      result.current.toggleDisplayMode();
    });
    expect(result.current.scaleDisplayMode).toBe('notes');

    act(() => {
      result.current.toggleDisplayMode();
    });
    expect(result.current.scaleDisplayMode).toBe('degrees');
  });

  it('updates scale config and generates backing track', () => {
    const { result } = renderHook(() => useScaleLab(120));

    let backing: any;
    act(() => {
      backing = result.current.updateScaleConfig(0, 'major_pentatonic'); // C Major Pentatonic
    });

    expect(result.current.scaleRoot).toBe(0);
    expect(result.current.scaleId).toBe('major_pentatonic');
    expect(backing).toBeDefined();
    expect(backing.tex).toContain('\\tempo 120');
    expect(result.current.backingProgressionName).toBe(backing.progressionName);
  });

  it('updates scale position', () => {
    const { result } = renderHook(() => useScaleLab(100));

    act(() => {
      result.current.setScalePosition(2);
    });
    expect(result.current.scalePosition).toBe(2);

    act(() => {
      result.current.setScalePosition('all');
    });
    expect(result.current.scalePosition).toBe('all');
  });
});
