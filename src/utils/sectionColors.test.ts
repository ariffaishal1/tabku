import { describe, it, expect } from 'vitest';
import { getSectionStyle } from './sectionColors';
import {
  findSectionAtTime,
  findPrevSection,
  findNextSection,
  type SectionMarker,
} from '../services/timelineExtractor';

describe('sectionColors & Section Navigation', () => {
  describe('getSectionStyle', () => {
    it('should classify Solo sections correctly', () => {
      const style = getSectionStyle('Guitar Solo');
      expect(style.category).toBe('solo');
      expect(style.icon).toBe('🎸');
      expect(style.color).toBe('var(--accent-coral)');
    });

    it('should classify Chorus sections correctly', () => {
      const style = getSectionStyle('Chorus 1');
      expect(style.category).toBe('chorus');
      expect(style.icon).toBe('🌟');
      expect(style.color).toBe('var(--accent-amber)');
    });

    it('should classify Verse sections correctly', () => {
      const style = getSectionStyle('Verse Riff');
      expect(style.category).toBe('verse');
      expect(style.icon).toBe('📖');
      expect(style.color).toBe('var(--accent-cyan)');
    });

    it('should classify Intro sections correctly', () => {
      const style = getSectionStyle('Intro Theme');
      expect(style.category).toBe('intro');
      expect(style.icon).toBe('⚡');
    });

    it('should classify Bridge sections correctly', () => {
      const style = getSectionStyle('Bridge Interlude');
      expect(style.category).toBe('bridge');
      expect(style.icon).toBe('🌉');
    });

    it('should classify Outro sections correctly', () => {
      const outroStyle = getSectionStyle('Final Outro');
      expect(outroStyle.category).toBe('outro');
      expect(outroStyle.icon).toBe('🏁');
    });

    it('should fallback gracefully for arbitrary section names', () => {
      const style = getSectionStyle('Acoustic Part');
      expect(style.category).toBe('default');
      expect(style.icon).toBe('🎵');
    });
  });

  describe('Section Navigation helpers', () => {
    const mockSections: SectionMarker[] = [
      { name: 'Intro', startMs: 0, barIndex: 1, endMs: 8000, durationMs: 8000 },
      { name: 'Verse', startMs: 8000, barIndex: 5, endMs: 24000, durationMs: 16000 },
      { name: 'Chorus', startMs: 24000, barIndex: 13, endMs: 40000, durationMs: 16000 },
      { name: 'Guitar Solo', startMs: 40000, barIndex: 21, endMs: 56000, durationMs: 16000 },
    ];

    it('findSectionAtTime returns correct section for given timestamps', () => {
      expect(findSectionAtTime(mockSections, 0)?.name).toBe('Intro');
      expect(findSectionAtTime(mockSections, 4000)?.name).toBe('Intro');
      expect(findSectionAtTime(mockSections, 8000)?.name).toBe('Verse');
      expect(findSectionAtTime(mockSections, 15000)?.name).toBe('Verse');
      expect(findSectionAtTime(mockSections, 24000)?.name).toBe('Chorus');
      expect(findSectionAtTime(mockSections, 50000)?.name).toBe('Guitar Solo');
    });

    it('findSectionAtTime returns null when sections array is empty', () => {
      expect(findSectionAtTime([], 1000)).toBeNull();
    });

    it('findPrevSection rewinds to start of current section if more than 1.5s into it', () => {
      // 12s is 4s into Verse (which started at 8s) -> rewinds to Verse (8000ms)
      const prev = findPrevSection(mockSections, 12000);
      expect(prev?.name).toBe('Verse');
      expect(prev?.startMs).toBe(8000);
    });

    it('findPrevSection jumps to preceding section if within 1.5s of current section', () => {
      // 8.5s is 500ms into Verse (started at 8s) -> jumps back to Intro
      const prev = findPrevSection(mockSections, 8500);
      expect(prev?.name).toBe('Intro');
      expect(prev?.startMs).toBe(0);
    });

    it('findPrevSection remains at first section when already at beginning', () => {
      const prev = findPrevSection(mockSections, 500);
      expect(prev?.name).toBe('Intro');
      expect(prev?.startMs).toBe(0);
    });

    it('findNextSection jumps to next upcoming section', () => {
      expect(findNextSection(mockSections, 0)?.name).toBe('Verse');
      expect(findNextSection(mockSections, 4000)?.name).toBe('Verse');
      expect(findNextSection(mockSections, 8000)?.name).toBe('Chorus');
      expect(findNextSection(mockSections, 25000)?.name).toBe('Guitar Solo');
      expect(findNextSection(mockSections, 50000)).toBeNull();
    });
  });
});
