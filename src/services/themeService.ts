import type { ThemeId, ThemeOption, ThemeDefinition } from '../types/theme';

export const THEME_STORAGE_KEY = 'tabku_active_theme';

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'cyber-neon',
    name: 'Cyber Neon',
    icon: 'zap',
    description: 'Pro dark obsidian studio dengan aksen Coral Red bercahaya',
  },
  {
    id: 'classic-parchment',
    name: 'Classic Parchment',
    icon: 'parchment',
    description: 'Tampilan lembaran partitur vintage & kayu hangat untuk music stand',
  },
  {
    id: 'stealth-black',
    name: 'Stealth Black',
    icon: 'stealth',
    description: 'OLED Pure Black kontras tinggi & hemat baterai tablet',
  },
];

export const THEME_DEFINITIONS: Record<ThemeId, ThemeDefinition> = {
  'cyber-neon': {
    id: 'cyber-neon',
    name: 'Cyber Neon',
    icon: 'zap',
    description: 'Pro dark obsidian studio dengan aksen Coral Red bercahaya',
    canvas: {
      background: '#120e0e',
      fretboardWood: '#181414',
      fretboardBevel: '#261e1e',
      fretWire: '#3a3030',
      fretWireZero: '#7a6868',
      markerDot: 'rgba(255, 255, 255, 0.08)',
      markerText: '#685e5e',
      stringInactive: '#382e2e',
      stringLabelText: '#8c7d7d',
      stringLabelBg: '#1e1818',
      gridLine: 'rgba(255, 122, 101, 0.05)',
      beatBar: 'rgba(255, 255, 255, 0.06)',
      measureBar: 'rgba(255, 255, 255, 0.22)',
      nowIndicator: '#FF7A65',
      nowGlow: 'rgba(255, 122, 101, 0.6)',
      textPrimary: '#ffffff',
      textSecondary: '#c5b8b8',
    },
  },
  'classic-parchment': {
    id: 'classic-parchment',
    name: 'Classic Parchment',
    icon: 'parchment',
    description: 'Tampilan lembaran partitur vintage & kayu hangat untuk music stand',
    canvas: {
      background: '#f6f1e5',
      fretboardWood: '#e7ddcb',
      fretboardBevel: '#dcd0bc',
      fretWire: '#baa993',
      fretWireZero: '#6d5e4b',
      markerDot: 'rgba(60, 48, 38, 0.12)',
      markerText: '#7d6b5b',
      stringInactive: '#b3a28c',
      stringLabelText: '#59493c',
      stringLabelBg: '#dfd4c0',
      gridLine: 'rgba(184, 58, 36, 0.06)',
      beatBar: 'rgba(60, 48, 38, 0.08)',
      measureBar: 'rgba(60, 48, 38, 0.28)',
      nowIndicator: '#b83a24',
      nowGlow: 'rgba(184, 58, 36, 0.4)',
      textPrimary: '#221a15',
      textSecondary: '#5a4b41',
    },
  },
  'stealth-black': {
    id: 'stealth-black',
    name: 'Stealth Black',
    icon: 'stealth',
    description: 'OLED Pure Black kontras tinggi & hemat baterai tablet',
    canvas: {
      background: '#000000',
      fretboardWood: '#0a0a0a',
      fretboardBevel: '#141414',
      fretWire: '#282828',
      fretWireZero: '#606060',
      markerDot: 'rgba(255, 255, 255, 0.12)',
      markerText: '#777777',
      stringInactive: '#262626',
      stringLabelText: '#888888',
      stringLabelBg: '#111111',
      gridLine: 'rgba(0, 255, 204, 0.04)',
      beatBar: 'rgba(255, 255, 255, 0.05)',
      measureBar: 'rgba(255, 255, 255, 0.2)',
      nowIndicator: '#00ffcc',
      nowGlow: 'rgba(0, 255, 204, 0.65)',
      textPrimary: '#ffffff',
      textSecondary: '#bbbbbb',
    },
  },
};

export const DEFAULT_THEME_ID: ThemeId = 'cyber-neon';

export function getStoredTheme(): ThemeId {
  try {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeId | null;
      if (saved && THEME_DEFINITIONS[saved]) {
        return saved;
      }
    }
  } catch {
    // LocalStorage might be inaccessible in restricted iframe/incognito
  }
  return DEFAULT_THEME_ID;
}

export function setStoredTheme(themeId: ThemeId): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, themeId);
    }
  } catch {
    // Ignore storage errors
  }
}

export function applyThemeToDocument(themeId: ThemeId): void {
  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.setAttribute('data-theme', themeId);
  }
}

export function getThemeDefinition(themeId: ThemeId): ThemeDefinition {
  return THEME_DEFINITIONS[themeId] || THEME_DEFINITIONS[DEFAULT_THEME_ID];
}
