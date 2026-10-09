import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getHighwayStringY,
  drawHighwayBackground,
  drawHighwayRuler,
  drawHighwayStrings,
  drawHighwayStrikeLine,
  drawHighwayLoopMarkers,
  drawHighwayCanvas,
  type HighwayRenderParams,
} from './highwayRenderer';

describe('highwayRenderer utility', () => {
  let mockCtx: any;

  beforeEach(() => {
    mockCtx = {
      save: vi.fn(),
      restore: vi.fn(),
      scale: vi.fn(),
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      beginPath: vi.fn(),
      closePath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      arc: vi.fn(),
      roundRect: vi.fn(),
      quadraticCurveTo: vi.fn(),
      fillText: vi.fn(),
      setLineDash: vi.fn(),
      measureText: vi.fn().mockReturnValue({ width: 50 }),
      createLinearGradient: vi.fn().mockReturnValue({
        addColorStop: vi.fn(),
      }),
    };
  });

  describe('getHighwayStringY', () => {
    it('calculates physical string Y correctly in standard orientation', () => {
      // 6 strings, topPadding=52, stringSpacing=20
      // String 1 (High E) is at index 0 -> 52
      // String 6 (Low E) is at index 5 -> 52 + 5 * 20 = 152
      expect(getHighwayStringY(1, 6, 52, 20, false)).toBe(52);
      expect(getHighwayStringY(6, 6, 52, 20, false)).toBe(152);
    });

    it('calculates flipped string Y correctly in Player POV orientation', () => {
      // In flipped mode, String 6 is at top (index 0) and String 1 is at bottom (index 5)
      expect(getHighwayStringY(6, 6, 52, 20, true)).toBe(52);
      expect(getHighwayStringY(1, 6, 52, 20, true)).toBe(152);
    });
  });

  describe('drawHighwayBackground', () => {
    it('fills background with default color when theme is not provided', () => {
      drawHighwayBackground(mockCtx, 800, 300);
      expect(mockCtx.fillStyle).toBe('#120e0e');
      expect(mockCtx.fillRect).toHaveBeenCalledWith(0, 0, 800, 300);
    });

    it('fills background with theme color when provided', () => {
      drawHighwayBackground(mockCtx, 800, 300, { background: '#000000' } as any);
      expect(mockCtx.fillStyle).toBe('#000000');
      expect(mockCtx.fillRect).toHaveBeenCalledWith(0, 0, 800, 300);
    });
  });

  describe('drawHighwayRuler', () => {
    it('draws timeline ruler strip and collects bar starts', () => {
      const mockTimeline: any = {
        beats: [
          { barIndex: 1, startMs: 0 },
          { barIndex: 1, startMs: 500 },
          { barIndex: 2, startMs: 1000 },
          { barIndex: 3, startMs: 2000 },
        ],
      };

      const barStarts = drawHighwayRuler(
        mockCtx,
        800,
        300,
        88,
        680,
        26,
        mockTimeline,
        0,
        1.0,
      );

      expect(barStarts.length).toBe(3);
      expect(barStarts[0].barIndex).toBe(1);
      expect(barStarts[1].barIndex).toBe(2);
      expect(barStarts[2].barIndex).toBe(3);
      expect(mockCtx.stroke).toHaveBeenCalled();
    });
  });

  describe('drawHighwayStrings', () => {
    it('draws strings across the highway with indicators', () => {
      const getStringY = vi.fn((s: number) => 50 + s * 20);
      drawHighwayStrings(
        mockCtx,
        800,
        88,
        6,
        ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'],
        [{ string: 1, fret: 5, midiPitch: 69, noteName: 'A4' } as any],
        getStringY,
      );

      expect(mockCtx.stroke).toHaveBeenCalled();
      expect(mockCtx.fillText).toHaveBeenCalled();
    });
  });

  describe('drawHighwayStrikeLine', () => {
    it('draws strike line and strike header badge', () => {
      drawHighwayStrikeLine(mockCtx, 300, 88, 26, 1000, []);
      expect(mockCtx.fillText).toHaveBeenCalledWith('STRIKE', expect.any(Number), expect.any(Number));
      expect(mockCtx.stroke).toHaveBeenCalled();
    });

    it('shows LOOP A in badge when loop A is at strike position', () => {
      drawHighwayStrikeLine(mockCtx, 300, 88, 26, 1000, [], 1010);
      expect(mockCtx.fillText).toHaveBeenCalledWith('LOOP A', expect.any(Number), expect.any(Number));
    });
  });

  describe('drawHighwayLoopMarkers', () => {
    it('draws loop zone and A-B markers when active', () => {
      drawHighwayLoopMarkers(
        mockCtx,
        800,
        300,
        88,
        680,
        26,
        5000,
        4000,
        7000,
      );

      expect(mockCtx.createLinearGradient).toHaveBeenCalled();
      expect(mockCtx.fillRect).toHaveBeenCalled();
      expect(mockCtx.stroke).toHaveBeenCalled();
    });
  });

  describe('drawHighwayCanvas master coordinator', () => {
    it('renders highway without throwing errors', () => {
      const params: HighwayRenderParams = {
        width: 800,
        height: 300,
        timeline: null,
        currentTimeMs: 0,
        activeNotes: [],
        tuningNames: ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'],
        isFlipped: false,
        speed: 1.0,
        isScaleMode: false,
        scaleRoot: 9,
        scaleId: 'minor_pentatonic',
        scaleDisplayMode: 'degrees',
        tuning: [64, 59, 55, 50, 45, 40],
      };

      expect(() => drawHighwayCanvas(mockCtx, params)).not.toThrow();
      expect(mockCtx.fillRect).toHaveBeenCalled();
    });
  });
});
