// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';

describe('useKeyboardShortcuts hook', () => {
  let props: any;

  beforeEach(() => {
    props = {
      onPlayPause: vi.fn(),
      onSeek: vi.fn(),
      toggleMetronome: vi.fn(),
      toggleScaleMode: vi.fn(),
      toggleSpeedTrainer: vi.fn(),
      onSpeedChange: vi.fn(),
      onTransposeChange: vi.fn(),
      onSetLoopA: vi.fn(),
      onSetLoopB: vi.fn(),
      onClearABLoop: vi.fn(),
      setIsShortcutsOpen: vi.fn(),
      setIsFlipped: vi.fn(),
      currentTimeMsRef: { current: 10000 }, // 10s
      loopARef: { current: null },
      loopBRef: { current: null },
      durationSec: 100,
      speed: 1.0,
      transpose: 0,
      onCycleTheme: vi.fn(),
      onPrevSection: vi.fn(),
      onNextSection: vi.fn(),
      onToggleStageMode: vi.fn(),
    };
  });

  const dispatchKey = (code: string, opts: Partial<KeyboardEventInit> = {}) => {
    const event = new KeyboardEvent('keydown', {
      code,
      bubbles: true,
      cancelable: true,
      ...opts,
    });
    window.dispatchEvent(event);
  };

  it('triggers onPlayPause on Space', () => {
    renderHook(() => useKeyboardShortcuts(props));
    dispatchKey('Space');
    expect(props.onPlayPause).toHaveBeenCalledTimes(1);
  });

  it('toggles metronome on KeyM', () => {
    renderHook(() => useKeyboardShortcuts(props));
    dispatchKey('KeyM');
    expect(props.toggleMetronome).toHaveBeenCalledTimes(1);
  });

  it('handles seek -5s on ArrowLeft and seek +5s on ArrowRight', () => {
    renderHook(() => useKeyboardShortcuts(props));

    dispatchKey('ArrowLeft');
    expect(props.onSeek).toHaveBeenCalledWith(5); // 10s - 5s = 5s

    dispatchKey('ArrowRight');
    expect(props.onSeek).toHaveBeenCalledWith(15); // 10s + 5s = 15s
  });

  it('jumps to prev and next sections with Shift+ArrowLeft/Right', () => {
    renderHook(() => useKeyboardShortcuts(props));

    dispatchKey('ArrowLeft', { shiftKey: true });
    expect(props.onPrevSection).toHaveBeenCalledTimes(1);

    dispatchKey('ArrowRight', { shiftKey: true });
    expect(props.onNextSection).toHaveBeenCalledTimes(1);
  });

  it('adjusts speed with Minus and Equal', () => {
    renderHook(() => useKeyboardShortcuts(props));

    dispatchKey('Minus');
    expect(props.onSpeedChange).toHaveBeenCalledWith(0.9);

    dispatchKey('Equal');
    expect(props.onSpeedChange).toHaveBeenCalledWith(1.1);
  });

  it('sets loop A and B with brackets', () => {
    renderHook(() => useKeyboardShortcuts(props));

    dispatchKey('BracketLeft');
    expect(props.onSetLoopA).toHaveBeenCalledTimes(1);

    dispatchKey('BracketRight');
    expect(props.onSetLoopB).toHaveBeenCalledWith(props.onSeek);
  });

  it('clears A-B loop on Backspace only when a loop marker is active', () => {
    const { rerender } = renderHook(() => useKeyboardShortcuts(props));

    // No loop active -> Backspace does nothing
    dispatchKey('Backspace');
    expect(props.onClearABLoop).not.toHaveBeenCalled();

    // Loop active
    props.loopARef.current = 5;
    rerender();
    dispatchKey('Backspace');
    expect(props.onClearABLoop).toHaveBeenCalledTimes(1);
  });

  it('handles flip strings (KeyF), scale mode (KeyS), speed trainer (KeyT), cycle theme (KeyC), and stage mode (KeyZ)', () => {
    renderHook(() => useKeyboardShortcuts(props));

    dispatchKey('KeyF');
    expect(props.setIsFlipped).toHaveBeenCalledTimes(1);

    dispatchKey('KeyS');
    expect(props.toggleScaleMode).toHaveBeenCalledTimes(1);

    dispatchKey('KeyT');
    expect(props.toggleSpeedTrainer).toHaveBeenCalledTimes(1);

    dispatchKey('KeyC');
    expect(props.onCycleTheme).toHaveBeenCalledTimes(1);

    dispatchKey('KeyZ');
    expect(props.onToggleStageMode).toHaveBeenCalledTimes(1);
  });

  it('adjusts transpose with Shift+ArrowUp and Shift+ArrowDown', () => {
    renderHook(() => useKeyboardShortcuts(props));

    dispatchKey('ArrowUp', { shiftKey: true });
    expect(props.onTransposeChange).toHaveBeenCalledWith(1);

    dispatchKey('ArrowDown', { shiftKey: true });
    expect(props.onTransposeChange).toHaveBeenCalledWith(-1);
  });

  it('ignores shortcuts when user is typing in an input element', () => {
    renderHook(() => useKeyboardShortcuts(props));

    const input = document.createElement('input');
    document.body.appendChild(input);

    const event = new KeyboardEvent('keydown', {
      code: 'Space',
      bubbles: true,
      cancelable: true,
    });
    input.dispatchEvent(event);

    expect(props.onPlayPause).not.toHaveBeenCalled();
    document.body.removeChild(input);
  });
});
