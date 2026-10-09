// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTheme } from './useTheme';
import { THEME_STORAGE_KEY, DEFAULT_THEME_ID } from '../services/themeService';

describe('useTheme hook', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initializes with default theme cyber-neon', () => {
    const { result } = renderHook(() => useTheme());

    expect(result.current.themeId).toBe(DEFAULT_THEME_ID);
    expect(result.current.theme.name).toBe('Cyber Neon');
    expect(result.current.themeOptions.length).toBeGreaterThan(0);
  });

  it('changes theme explicitly and updates stored theme', () => {
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.setTheme('classic-parchment');
    });

    expect(result.current.themeId).toBe('classic-parchment');
    expect(result.current.theme.name).toBe('Classic Parchment');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('classic-parchment');
  });

  it('cycles through theme options sequentially', () => {
    const { result } = renderHook(() => useTheme());
    const totalThemes = result.current.themeOptions.length;

    const initialId = result.current.themeId;
    act(() => {
      result.current.cycleTheme();
    });

    expect(result.current.themeId).not.toBe(initialId);

    // Cycle through remaining to loop back
    for (let i = 1; i < totalThemes; i++) {
      act(() => {
        result.current.cycleTheme();
      });
    }

    expect(result.current.themeId).toBe(initialId);
  });
});
