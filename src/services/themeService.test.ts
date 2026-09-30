import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  THEME_OPTIONS,
  THEME_DEFINITIONS,
  DEFAULT_THEME_ID,
  getStoredTheme,
  setStoredTheme,
  applyThemeToDocument,
  getThemeDefinition,
  THEME_STORAGE_KEY,
} from './themeService';

describe('themeService', () => {
  let store: Record<string, string> = {};
  let attributes: Record<string, string> = {};

  beforeEach(() => {
    store = {};
    attributes = {};

    // Mock localStorage
    const mockLocalStorage = {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
    };
    const globalObj = globalThis as unknown as { localStorage?: unknown; document?: unknown };
    globalObj.localStorage = mockLocalStorage;

    // Mock document
    const mockDocument = {
      documentElement: {
        setAttribute: (name: string, value: string) => {
          attributes[name] = value;
        },
        getAttribute: (name: string) => attributes[name] || null,
        removeAttribute: (name: string) => {
          delete attributes[name];
        },
      },
    };
    globalObj.document = mockDocument;
  });

  afterEach(() => {
    const globalObj = globalThis as unknown as { localStorage?: unknown; document?: unknown };
    delete globalObj.localStorage;
    delete globalObj.document;
  });

  it('provides the 3 expected themes in THEME_OPTIONS', () => {
    expect(THEME_OPTIONS.map((t) => t.id)).toEqual(['cyber-neon', 'classic-parchment', 'stealth-black']);
  });

  it('contains full canvas colors for each theme', () => {
    for (const opt of THEME_OPTIONS) {
      const def = THEME_DEFINITIONS[opt.id];
      expect(def).toBeDefined();
      expect(def.canvas.background).toBeDefined();
      expect(def.canvas.fretboardWood).toBeDefined();
      expect(def.canvas.nowIndicator).toBeDefined();
      expect(def.canvas.nowGlow).toBeDefined();
    }
  });

  it('returns DEFAULT_THEME_ID when no storage exists', () => {
    expect(getStoredTheme()).toBe(DEFAULT_THEME_ID);
  });

  it('saves and retrieves stored theme', () => {
    setStoredTheme('classic-parchment');
    expect(globalThis.localStorage.getItem(THEME_STORAGE_KEY)).toBe('classic-parchment');
    expect(getStoredTheme()).toBe('classic-parchment');
  });

  it('falls back to default if stored theme is invalid', () => {
    globalThis.localStorage.setItem(THEME_STORAGE_KEY, 'invalid-theme-id');
    expect(getStoredTheme()).toBe(DEFAULT_THEME_ID);
  });

  it('applies data-theme attribute to document element', () => {
    applyThemeToDocument('stealth-black');
    expect(globalThis.document.documentElement.getAttribute('data-theme')).toBe('stealth-black');
  });

  it('retrieves correct theme definition with fallback', () => {
    const cyber = getThemeDefinition('cyber-neon');
    expect(cyber.id).toBe('cyber-neon');

    const fallback = getThemeDefinition('non-existent' as unknown as Parameters<typeof getThemeDefinition>[0]);
    expect(fallback.id).toBe(DEFAULT_THEME_ID);
  });
});
