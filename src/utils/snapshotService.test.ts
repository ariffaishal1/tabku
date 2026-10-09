// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import {
  formatSnapshotTime,
  generateShareableUrl,
  parsePracticeUrlParams,
  renderSnapshotCardToCanvas,
} from './snapshotService';

describe('snapshotService utility', () => {
  describe('formatSnapshotTime', () => {
    it('formats milliseconds to mm:ss.f string', () => {
      expect(formatSnapshotTime(0)).toBe('00:00.0');
      expect(formatSnapshotTime(5500)).toBe('00:05.5');
      expect(formatSnapshotTime(65200)).toBe('01:05.2');
      expect(formatSnapshotTime(130000)).toBe('02:10.0');
    });
  });

  describe('generateShareableUrl', () => {
    it('constructs url with practice parameters', () => {
      const url = generateShareableUrl('https://tabku.app/', {
        presetId: 'rock-anthem-solo',
        trackIndex: 1,
        seconds: 42.5,
        speed: 0.75,
        transpose: 2,
        loopA: 30,
        loopB: 45,
        theme: 'cyber-neon',
      });

      expect(url).toContain('song=rock-anthem-solo');
      expect(url).toContain('track=1');
      expect(url).toContain('t=42.5');
      expect(url).toContain('speed=0.75');
      expect(url).toContain('transpose=2');
      expect(url).toContain('loopA=30');
      expect(url).toContain('loopB=45');
      expect(url).toContain('theme=cyber-neon');
    });

    it('omits default values when not modified', () => {
      const url = generateShareableUrl('https://tabku.app/', {
        speed: 1.0,
        transpose: 0,
      });

      expect(url).not.toContain('speed=');
      expect(url).not.toContain('transpose=');
    });
  });

  describe('parsePracticeUrlParams', () => {
    it('parses valid search query string accurately', () => {
      const search = '?song=neon-horizon&track=2&t=15.5&speed=0.5&transpose=-1&loopA=10&loopB=20&theme=stealth-black';
      const parsed = parsePracticeUrlParams(search);

      expect(parsed.presetId).toBe('neon-horizon');
      expect(parsed.trackIndex).toBe(2);
      expect(parsed.seconds).toBe(15.5);
      expect(parsed.speed).toBe(0.5);
      expect(parsed.transpose).toBe(-1);
      expect(parsed.loopA).toBe(10);
      expect(parsed.loopB).toBe(20);
      expect(parsed.theme).toBe('stealth-black');
    });

    it('handles empty or missing parameters safely', () => {
      const parsed = parsePracticeUrlParams('');
      expect(parsed).toEqual({});
    });
  });

  describe('renderSnapshotCardToCanvas', () => {
    it('creates canvas without throwing in mock environment', () => {
      const meta = {
        songTitle: 'Neon Horizon',
        songArtist: 'TabKu Studio Sessions',
        activeTrackName: 'Lead Guitar',
        tempo: 105,
        tuningName: 'STANDARD E',
        tuningNotesFormatted: 'E B G D A E',
        currentTimeMs: 15000,
        speed: 1.0,
        transpose: 0,
      };

      const canvas = renderSnapshotCardToCanvas(null, null, meta);
      expect(canvas).toBeDefined();
      expect(canvas.width).toBeGreaterThan(0);
      expect(canvas.height).toBeGreaterThan(0);
    });
  });
});
