import { useState, useEffect, useCallback } from 'react';
import type { ThemeId, ThemeDefinition, ThemeOption } from '../types/theme';
import {
  getStoredTheme,
  setStoredTheme,
  applyThemeToDocument,
  getThemeDefinition,
  THEME_OPTIONS,
} from '../services/themeService';

export interface UseThemeReturn {
  themeId: ThemeId;
  theme: ThemeDefinition;
  themeOptions: ThemeOption[];
  setTheme: (themeId: ThemeId) => void;
  cycleTheme: () => void;
}

export function useTheme(): UseThemeReturn {
  const [themeId, setThemeId] = useState<ThemeId>(() => getStoredTheme());

  useEffect(() => {
    applyThemeToDocument(themeId);
  }, [themeId]);

  const setTheme = useCallback((newThemeId: ThemeId) => {
    setThemeId(newThemeId);
    setStoredTheme(newThemeId);
    applyThemeToDocument(newThemeId);
  }, []);

  const cycleTheme = useCallback(() => {
    const currentIndex = THEME_OPTIONS.findIndex((t) => t.id === themeId);
    const nextIndex = (currentIndex + 1) % THEME_OPTIONS.length;
    const nextTheme = THEME_OPTIONS[nextIndex].id;
    setTheme(nextTheme);
  }, [themeId, setTheme]);

  const theme = getThemeDefinition(themeId);

  return {
    themeId,
    theme,
    themeOptions: THEME_OPTIONS,
    setTheme,
    cycleTheme,
  };
}
