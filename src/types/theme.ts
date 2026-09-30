export type ThemeId = 'cyber-neon' | 'classic-parchment' | 'stealth-black';

export interface ThemeOption {
  id: ThemeId;
  name: string;
  icon: string;
  description: string;
}

export interface CanvasThemeColors {
  background: string;
  fretboardWood: string;
  fretboardBevel: string;
  fretWire: string;
  fretWireZero: string;
  markerDot: string;
  markerText: string;
  stringInactive: string;
  stringLabelText: string;
  stringLabelBg: string;
  gridLine: string;
  beatBar: string;
  measureBar: string;
  nowIndicator: string;
  nowGlow: string;
  textPrimary: string;
  textSecondary: string;
}

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  icon: string;
  description: string;
  canvas: CanvasThemeColors;
}
