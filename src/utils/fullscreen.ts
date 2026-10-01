/**
 * Cross-browser Fullscreen API utility helpers.
 * Handles standard Fullscreen API as well as WebKit / Mozilla / MS vendor prefixes.
 */

export interface FullscreenDocument extends Document {
  webkitFullscreenElement?: Element;
  mozFullScreenElement?: Element;
  msFullscreenElement?: Element;
  webkitExitFullscreen?: () => Promise<void>;
  mozCancelFullScreen?: () => Promise<void>;
  msExitFullscreen?: () => Promise<void>;
  webkitFullscreenEnabled?: boolean;
  mozFullScreenEnabled?: boolean;
  msFullscreenEnabled?: boolean;
}

export interface FullscreenElement extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void>;
  mozRequestFullScreen?: () => Promise<void>;
  msRequestFullscreen?: () => Promise<void>;
}

/**
 * Checks whether the current browser environment permits Fullscreen API.
 * Returns false if inside a sandboxed iframe without allow="fullscreen".
 */
export function isFullscreenSupported(): boolean {
  if (typeof document === 'undefined') return false;
  const doc = document as FullscreenDocument;
  return Boolean(
    doc.fullscreenEnabled ||
    doc.webkitFullscreenEnabled ||
    doc.mozFullScreenEnabled ||
    doc.msFullscreenEnabled
  );
}

/**
 * Returns currently active fullscreen element across browser implementations.
 */
export function getActiveFullscreenElement(): Element | null {
  if (typeof document === 'undefined') return null;
  const doc = document as FullscreenDocument;
  return (
    doc.fullscreenElement ||
    doc.webkitFullscreenElement ||
    doc.mozFullScreenElement ||
    doc.msFullscreenElement ||
    null
  );
}

/**
 * Requests native browser window fullscreen on the given element.
 */
export async function requestNativeFullscreen(
  element: HTMLElement = document.documentElement
): Promise<{ success: boolean; reason?: string }> {
  if (!isFullscreenSupported()) {
    return {
      success: false,
      reason: 'Peramban membatasi fullscreen (misalnya di dalam preview iframe tanpa atribut allow="fullscreen").',
    };
  }

  const el = element as FullscreenElement;

  try {
    if (el.requestFullscreen) {
      await el.requestFullscreen();
      return { success: true };
    } else if (el.webkitRequestFullscreen) {
      await el.webkitRequestFullscreen();
      return { success: true };
    } else if (el.mozRequestFullScreen) {
      await el.mozRequestFullScreen();
      return { success: true };
    } else if (el.msRequestFullscreen) {
      await el.msRequestFullscreen();
      return { success: true };
    }
    return { success: false, reason: 'Metode requestFullscreen tidak tersedia di peramban ini.' };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.warn('[TabKu Fullscreen] Permintaan layar penuh ditolak peramban:', errorMsg);
    return { success: false, reason: errorMsg };
  }
}

/**
 * Exits native browser window fullscreen if currently active.
 */
export async function exitNativeFullscreen(): Promise<boolean> {
  if (typeof document === 'undefined') return false;
  const doc = document as FullscreenDocument;
  const activeEl = getActiveFullscreenElement();
  if (!activeEl) return false;

  try {
    if (doc.exitFullscreen) {
      await doc.exitFullscreen();
      return true;
    } else if (doc.webkitExitFullscreen) {
      await doc.webkitExitFullscreen();
      return true;
    } else if (doc.mozCancelFullScreen) {
      await doc.mozCancelFullScreen();
      return true;
    } else if (doc.msExitFullscreen) {
      await doc.msExitFullscreen();
      return true;
    }
  } catch (err) {
    console.warn('[TabKu Fullscreen] Keluar layar penuh gagal:', err);
  }
  return false;
}
