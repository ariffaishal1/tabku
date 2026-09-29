import { describe, it, expect } from 'vitest';
import { PRESET_SONGS } from './presetTabs';

describe('presetTabs service', () => {
  it('contains predefined preset songs', () => {
    expect(PRESET_SONGS.length).toBeGreaterThanOrEqual(6);
  });

  it('every preset song has unique and well-formatted id', () => {
    const ids = new Set<string>();
    for (const song of PRESET_SONGS) {
      expect(song.id).toBeTruthy();
      expect(song.id).toMatch(/^[a-z0-9-]+$/);
      expect(ids.has(song.id)).toBe(false);
      ids.add(song.id);
    }
  });

  it('every preset song has valid metadata fields', () => {
    for (const song of PRESET_SONGS) {
      expect(typeof song.title).toBe('string');
      expect(song.title.trim().length).toBeGreaterThan(0);

      expect(typeof song.artist).toBe('string');
      expect(song.artist.trim().length).toBeGreaterThan(0);

      expect(typeof song.genre).toBe('string');
      expect(song.genre.trim().length).toBeGreaterThan(0);

      expect(typeof song.description).toBe('string');
      expect(song.description.trim().length).toBeGreaterThan(10);

      expect(typeof song.tempo).toBe('number');
      expect(song.tempo).toBeGreaterThanOrEqual(40);
      expect(song.tempo).toBeLessThanOrEqual(250);
    }
  });

  it('every preset song has non-empty valid AlphaTex score with tracks', () => {
    for (const song of PRESET_SONGS) {
      expect(typeof song.tex).toBe('string');
      expect(song.tex.trim().length).toBeGreaterThan(20);
      expect(song.tex).toContain('\\track');
      expect(song.tex).toContain('\\tuning');
      expect(song.tex).toContain('|');
    }
  });

  it('scale-practice-empty has dynamically generated backing track', () => {
    const scalePractice = PRESET_SONGS.find((s) => s.id === 'scale-practice-empty');
    expect(scalePractice).toBeDefined();
    expect(scalePractice?.tex).toContain('Lead Guitar (Scale Practice)');
    expect(scalePractice?.tex).toContain('Rhythm Backing Track');
    expect(scalePractice?.tex).toContain('Bass Backing Track');
  });

  it('rock-anthem-solo has Lead, Rhythm, and Bass tracks', () => {
    const rock = PRESET_SONGS.find((s) => s.id === 'rock-anthem-solo');
    expect(rock).toBeDefined();
    expect(rock?.tempo).toBe(105);
    expect(rock?.tex).toContain('\\track "Lead Guitar (Solo)"');
    expect(rock?.tex).toContain('\\track "Rhythm Guitar (Chords)"');
    expect(rock?.tex).toContain('\\track "Bass Guitar"');
  });

  it('heavy-drop-d features Drop D tuning', () => {
    const metal = PRESET_SONGS.find((s) => s.id === 'heavy-drop-d');
    expect(metal).toBeDefined();
    expect(metal?.tempo).toBe(128);
    expect(metal?.tex).toContain('\\tuning E4 B3 G3 D3 A2 D2');
    expect(metal?.tex).toContain('\\tuning G2 D2 A1 D1');
  });

  it('blues-shuffle-lead features 12-bar blues shuffle with boogie track', () => {
    const blues = PRESET_SONGS.find((s) => s.id === 'blues-shuffle-lead');
    expect(blues).toBeDefined();
    expect(blues?.tempo).toBe(90);
    expect(blues?.genre).toContain('Blues');
    expect(blues?.tex).toContain('\\track "Rhythm Guitar (Boogie)"');
  });
});
