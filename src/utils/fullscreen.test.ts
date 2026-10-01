import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isFullscreenSupported,
  getActiveFullscreenElement,
  requestNativeFullscreen,
  exitNativeFullscreen,
} from './fullscreen';

describe('fullscreen utility helpers', () => {
  let mockDoc: any;

  beforeEach(() => {
    mockDoc = {
      fullscreenEnabled: true,
      fullscreenElement: null,
      documentElement: {
        requestFullscreen: vi.fn().mockResolvedValue(undefined),
      },
      exitFullscreen: vi.fn().mockResolvedValue(undefined),
    };
    (globalThis as any).document = mockDoc;
  });

  afterEach(() => {
    delete (globalThis as any).document;
    vi.restoreAllMocks();
  });

  describe('isFullscreenSupported', () => {
    it('returns true when document.fullscreenEnabled is true', () => {
      mockDoc.fullscreenEnabled = true;
      expect(isFullscreenSupported()).toBe(true);
    });

    it('returns false when document.fullscreenEnabled is false and no vendor prefixes', () => {
      mockDoc.fullscreenEnabled = false;
      mockDoc.webkitFullscreenEnabled = false;
      mockDoc.mozFullScreenEnabled = false;
      mockDoc.msFullscreenEnabled = false;
      expect(isFullscreenSupported()).toBe(false);
    });
  });

  describe('getActiveFullscreenElement', () => {
    it('returns active element when fullscreen is engaged', () => {
      const fakeEl = { id: 'fake-fullscreen-el' };
      mockDoc.fullscreenElement = fakeEl;
      expect(getActiveFullscreenElement()).toBe(fakeEl as any);
    });

    it('returns null when no element is in fullscreen', () => {
      mockDoc.fullscreenElement = null;
      mockDoc.webkitFullscreenElement = undefined;
      expect(getActiveFullscreenElement()).toBeNull();
    });
  });

  describe('requestNativeFullscreen', () => {
    it('handles unsupported environment gracefully', async () => {
      mockDoc.fullscreenEnabled = false;
      mockDoc.webkitFullscreenEnabled = false;

      const res = await requestNativeFullscreen();
      expect(res.success).toBe(false);
      expect(res.reason).toContain('Peramban membatasi fullscreen');
    });

    it('resolves success when requestFullscreen succeeds', async () => {
      mockDoc.fullscreenEnabled = true;
      const el: any = {
        requestFullscreen: vi.fn().mockResolvedValue(undefined),
      };

      const res = await requestNativeFullscreen(el);
      expect(res.success).toBe(true);
      expect(el.requestFullscreen).toHaveBeenCalled();
    });

    it('catches and reports error when requestFullscreen rejects', async () => {
      mockDoc.fullscreenEnabled = true;
      const el: any = {
        requestFullscreen: vi.fn().mockRejectedValue(new Error('API can only be initiated by a user gesture')),
      };

      const res = await requestNativeFullscreen(el);
      expect(res.success).toBe(false);
      expect(res.reason).toContain('API can only be initiated by a user gesture');
    });
  });

  describe('exitNativeFullscreen', () => {
    it('does nothing and returns false when no fullscreen element is active', async () => {
      mockDoc.fullscreenElement = null;
      const res = await exitNativeFullscreen();
      expect(res).toBe(false);
    });

    it('calls exitFullscreen when an element is in fullscreen', async () => {
      const fakeEl = { id: 'active-el' };
      mockDoc.fullscreenElement = fakeEl;
      const res = await exitNativeFullscreen();
      expect(res).toBe(true);
      expect(mockDoc.exitFullscreen).toHaveBeenCalled();
    });
  });
});
