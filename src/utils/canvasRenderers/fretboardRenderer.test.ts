import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getFretboardStringY,
  drawFretboardWoodAndInlays,
  drawFretboardWiresAndStrings,
  drawFretboardPositionBox,
  drawFretboardScaleOverlay,
  drawFretboardNextNotes,
  drawFretboardNowNotes,
  drawFretboardCanvas,
  type FretboardRenderParams,
} from './fretboardRenderer';
import { getScalePositionInfo } from '../../services/scaleTheory';

describe('fretboardRenderer utility', () => {
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
      measureText: vi.fn().mockReturnValue({ width: 40 }),
    };
  });

  describe('getFretboardStringY', () => {
    it('calculates physical string Y correctly in standard orientation', () => {
      // 6 strings, topMargin=28, stringSpacing=25
      // String 1 is at index 0 -> 28
      // String 6 is at index 5 -> 28 + 5 * 25 = 153
      expect(getFretboardStringY(1, 6, 28, 25, false)).toBe(28);
      expect(getFretboardStringY(6, 6, 28, 25, false)).toBe(153);
    });

    it('calculates physical string Y correctly in Player POV (flipped) orientation', () => {
      expect(getFretboardStringY(6, 6, 28, 25, true)).toBe(28);
      expect(getFretboardStringY(1, 6, 28, 25, true)).toBe(153);
    });
  });

  describe('drawFretboardWoodAndInlays', () => {
    it('draws wood background and inlay dots', () => {
      drawFretboardWoodAndInlays(mockCtx, 48, 28, 700, 150, 28, 24, false);

      expect(mockCtx.fillRect).toHaveBeenCalledWith(48, 24, 700, 158);
      expect(mockCtx.arc).toHaveBeenCalled(); // inlays at 3, 5, 7, 9, 12, etc.
      expect(mockCtx.fill).toHaveBeenCalled();
    });
  });

  describe('drawFretboardWiresAndStrings', () => {
    it('draws 25 fret wires, nut, fret numbers, and strings', () => {
      const getStringY = vi.fn((s: number) => 30 + s * 20);

      drawFretboardWiresAndStrings(
        mockCtx,
        48,
        28,
        150,
        28,
        748,
        24,
        6,
        ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'],
        [],
        getStringY,
      );

      expect(mockCtx.stroke).toHaveBeenCalled();
      expect(mockCtx.fillText).toHaveBeenCalled();
    });
  });

  describe('drawFretboardPositionBox', () => {
    it('draws position bounding box for scale practice box 1', () => {
      const positionInfo = getScalePositionInfo(9, 'minor_pentatonic', 1);

      drawFretboardPositionBox(
        mockCtx,
        48,
        28,
        150,
        28,
        1,
        positionInfo,
      );

      expect(mockCtx.roundRect).toHaveBeenCalled();
      expect(mockCtx.stroke).toHaveBeenCalled();
      expect(mockCtx.fillText).toHaveBeenCalled();
    });
  });

  describe('drawFretboardScaleOverlay', () => {
    it('draws scale ghost dots overlay on matching scale pitches', () => {
      const positionInfo = getScalePositionInfo(9, 'minor_pentatonic', 'all');
      const getStringY = vi.fn((s: number) => 30 + s * 20);

      drawFretboardScaleOverlay(
        mockCtx,
        48,
        28,
        24,
        6,
        [64, 59, 55, 50, 45, 40],
        [],
        9,
        'minor_pentatonic',
        'degrees',
        'all',
        positionInfo,
        false,
        getStringY,
      );

      expect(mockCtx.arc).toHaveBeenCalled();
      expect(mockCtx.fillText).toHaveBeenCalled();
    });
  });

  describe('drawFretboardNextNotes', () => {
    it('draws diamond corner indicators for upcoming notes', () => {
      const getStringY = vi.fn((s: number) => 30 + s * 20);
      const nextNotes = [
        { string: 2, fret: 5, midiPitch: 64, noteName: 'E4', isBend: true } as any,
      ];

      drawFretboardNextNotes(
        mockCtx,
        48,
        28,
        nextNotes,
        [],
        getStringY,
      );

      expect(mockCtx.stroke).toHaveBeenCalled();
      expect(mockCtx.fillText).toHaveBeenCalledWith('5', expect.any(Number), expect.any(Number));
      expect(mockCtx.fillText).toHaveBeenCalledWith('⤴', expect.any(Number), expect.any(Number));
    });
  });

  describe('drawFretboardNowNotes', () => {
    it('draws solid boxes and techniques for sounding notes', () => {
      const getStringY = vi.fn((s: number) => 30 + s * 20);
      const activeNotes = [
        {
          string: 1,
          fret: 7,
          midiPitch: 71,
          noteName: 'B4',
          isBend: true,
          bendAmount: 1.0,
        } as any,
        {
          string: 3,
          fret: 9,
          midiPitch: 64,
          noteName: 'E4',
          isSlide: true,
          slideToFret: 11,
        } as any,
      ];

      drawFretboardNowNotes(
        mockCtx,
        48,
        28,
        activeNotes,
        true,
        getStringY,
      );

      expect(mockCtx.roundRect).toHaveBeenCalled();
      expect(mockCtx.fill).toHaveBeenCalled();
      expect(mockCtx.fillText).toHaveBeenCalledWith('7', expect.any(Number), expect.any(Number));
      expect(mockCtx.fillText).toHaveBeenCalledWith('9', expect.any(Number), expect.any(Number));
    });
  });

  describe('drawFretboardCanvas master coordinator', () => {
    it('renders entire fretboard without errors', () => {
      const positionInfo = getScalePositionInfo(9, 'minor_pentatonic', 'all');
      const params: FretboardRenderParams = {
        width: 800,
        height: 250,
        activeNotes: [],
        nextNotes: [],
        tuningNames: ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'],
        tuning: [64, 59, 55, 50, 45, 40],
        isFlipped: false,
        isPlaying: false,
        isScaleMode: false,
        scaleRoot: 9,
        scaleId: 'minor_pentatonic',
        scaleDisplayMode: 'degrees',
        scalePosition: 'all',
        positionInfo,
      };

      expect(() => drawFretboardCanvas(mockCtx, params)).not.toThrow();
      expect(mockCtx.fillRect).toHaveBeenCalled();
    });
  });
});
