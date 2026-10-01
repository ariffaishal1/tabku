import React from 'react';
import { Zap, Flag, Star, BookOpen, Flame, GitCommit, Music } from 'lucide-react';

/**
 * Utility to classify musical song sections and assign curated,
 * theme-compatible colors and icons for the Mini-Map Section Seekbar.
 */

export type SectionCategory = 'intro' | 'verse' | 'chorus' | 'solo' | 'bridge' | 'outro' | 'default';

export interface SectionStyle {
  color: string;
  bg: string;
  glow: string;
  icon: string;
  category: SectionCategory;
}

/**
 * Maps a section name (e.g. "Intro", "Guitar Solo", "Chorus 2", "Outro")
 * to a distinct, beautiful visual style for the DAW seekbar mini-map.
 */
export function getSectionStyle(sectionName: string): SectionStyle {
  const norm = (sectionName || '').trim().toLowerCase();

  // Intro / Count / Opening
  if (norm.includes('intro') || norm.includes('start') || norm.includes('open') || norm.includes('count')) {
    return {
      color: '#38bdf8',
      bg: 'rgba(56, 189, 248, 0.16)',
      glow: 'rgba(56, 189, 248, 0.3)',
      icon: 'zap',
      category: 'intro',
    };
  }

  // Outro / Ending / Coda
  if (norm.includes('outro') || norm.includes('end') || norm.includes('coda') || norm.includes('fade')) {
    return {
      color: 'var(--accent-green)',
      bg: 'rgba(80, 250, 123, 0.16)',
      glow: 'rgba(80, 250, 123, 0.3)',
      icon: 'flag',
      category: 'outro',
    };
  }

  // Chorus / Refrain / Hook
  if (norm.includes('chorus') || norm.includes('refrain') || norm.includes('hook')) {
    return {
      color: 'var(--accent-amber)',
      bg: 'rgba(255, 184, 108, 0.18)',
      glow: 'rgba(255, 184, 108, 0.35)',
      icon: 'star',
      category: 'chorus',
    };
  }

  // Verse / Bait / Stanza
  if (norm.includes('verse') || norm.includes('stanza') || norm.includes('bait') || norm.includes('boogie')) {
    return {
      color: 'var(--accent-cyan)',
      bg: 'rgba(139, 233, 253, 0.16)',
      glow: 'rgba(139, 233, 253, 0.3)',
      icon: 'book-open',
      category: 'verse',
    };
  }

  // Solo / Lead Guitar / Riff / Jam Climax
  if (
    norm.includes('solo') ||
    norm.includes('lead') ||
    norm.includes('riff') ||
    norm.includes('jam') ||
    norm.includes('lick') ||
    norm.includes('sweep')
  ) {
    return {
      color: 'var(--accent-coral)',
      bg: 'rgba(255, 122, 101, 0.18)',
      glow: 'var(--accent-coral-glow)',
      icon: 'flame',
      category: 'solo',
    };
  }

  // Bridge / Breakdown / Interlude
  if (norm.includes('bridge') || norm.includes('interlude') || norm.includes('break') || norm.includes('trans')) {
    return {
      color: '#c084fc',
      bg: 'rgba(192, 132, 252, 0.18)',
      glow: 'rgba(192, 132, 252, 0.35)',
      icon: 'git-commit',
      category: 'bridge',
    };
  }

  // Default / Generic Main Section
  return {
    color: 'var(--text-secondary)',
    bg: 'var(--bg-control)',
    glow: 'rgba(255, 255, 255, 0.1)',
    icon: 'music',
    category: 'default',
  };
}

/**
 * Clean SVG Icon component for section markers, replacing platform emojis.
 */
export const SectionIcon: React.FC<{
  category: SectionCategory;
  size?: number;
  color?: string;
  style?: React.CSSProperties;
}> = ({ category, size = 10, color, style }) => {
  const iconProps = {
    size,
    color: color || 'currentColor',
    style: { flexShrink: 0, display: 'inline-block', verticalAlign: '-1px', ...style },
  };

  switch (category) {
    case 'intro':
      return React.createElement(Zap, iconProps);
    case 'outro':
      return React.createElement(Flag, iconProps);
    case 'chorus':
      return React.createElement(Star, iconProps);
    case 'verse':
      return React.createElement(BookOpen, iconProps);
    case 'solo':
      return React.createElement(Flame, iconProps);
    case 'bridge':
      return React.createElement(GitCommit, iconProps);
    default:
      return React.createElement(Music, iconProps);
  }
};
