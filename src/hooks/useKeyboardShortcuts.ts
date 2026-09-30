import { useEffect, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';

interface UseKeyboardShortcutsProps {
  onPlayPause: () => void;
  onSeek: (seconds: number) => void;
  toggleMetronome: () => void;
  toggleScaleMode: () => void;
  toggleSpeedTrainer: () => void;
  onSpeedChange: (speed: number) => void;
  onTransposeChange: (semitones: number) => void;
  onSetLoopA: () => void;
  onSetLoopB: (seek: (s: number) => void) => void;
  onClearABLoop: () => void;
  setIsShortcutsOpen: Dispatch<SetStateAction<boolean>>;
  setIsFlipped: Dispatch<SetStateAction<boolean>>;
  currentTimeMsRef: MutableRefObject<number | null>;
  loopARef: MutableRefObject<number | null>;
  loopBRef: MutableRefObject<number | null>;
  durationSec: number;
  speed: number;
  transpose: number;
  onCycleTheme?: () => void;
  onPrevSection?: () => void;
  onNextSection?: () => void;
}

/**
 * Registers and cleans up the global `keydown` listener that powers
 * all studio keyboard shortcuts. Extracted from App.tsx so that App
 * only needs to wire the handlers, not host the event boilerplate.
 *
 * Shortcut map (mirrors KeyboardShortcutsModal):
 *   Space          → Play / Pause
 *   M              → Toggle Metronome
 *   F              → Flip Strings
 *   S              → Toggle Scale Mode
 *   T              → Toggle Speed Trainer
 *   C              → Cycle Visual Theme (Cyber Neon / Parchment / Stealth)
 *   ←/→            → Seek ±5 s
 *   Shift+←/→      → Lompat ke Bagian Lagu Sebelumnya / Berikutnya
 *   -/+            → Speed ±0.1×
 *   [/]            → Set Loop A / B
 *   Backspace      → Clear A-B Loop
 *   Shift+↑/↓      → Transpose ±1 st
 *   ?  or  Shift+/ → Toggle Shortcuts Modal
 */
export function useKeyboardShortcuts({
  onPlayPause,
  onSeek,
  toggleMetronome,
  toggleScaleMode,
  toggleSpeedTrainer,
  onSpeedChange,
  onTransposeChange,
  onSetLoopA,
  onSetLoopB,
  onClearABLoop,
  setIsShortcutsOpen,
  setIsFlipped,
  currentTimeMsRef,
  loopARef,
  loopBRef,
  durationSec,
  speed,
  transpose,
  onCycleTheme,
  onPrevSection,
  onNextSection,
}: UseKeyboardShortcutsProps): void {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Never intercept when focus is inside an input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === '?') {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          onPlayPause();
          break;

        case 'Slash':
          if (e.shiftKey) {
            e.preventDefault();
            setIsShortcutsOpen((prev) => !prev);
          }
          break;

        case 'KeyM':
          e.preventDefault();
          toggleMetronome();
          break;

        case 'ArrowLeft':
          e.preventDefault();
          if (e.shiftKey && onPrevSection) {
            onPrevSection();
          } else {
            onSeek(Math.max(0, ((currentTimeMsRef.current ?? 0) / 1000) - 5));
          }
          break;

        case 'ArrowRight':
          e.preventDefault();
          if (e.shiftKey && onNextSection) {
            onNextSection();
          } else {
            onSeek(Math.min(durationSec, ((currentTimeMsRef.current ?? 0) / 1000) + 5));
          }
          break;

        case 'Minus':
        case 'NumpadSubtract':
          e.preventDefault();
          onSpeedChange(Math.max(0.25, speed - 0.1));
          break;

        case 'Equal':
        case 'NumpadAdd':
          e.preventDefault();
          onSpeedChange(Math.min(2.0, speed + 0.1));
          break;

        case 'BracketLeft':
          e.preventDefault();
          onSetLoopA();
          break;

        case 'BracketRight':
          e.preventDefault();
          onSetLoopB(onSeek);
          break;

        case 'Backspace':
          if (loopARef.current !== null || loopBRef.current !== null) {
            e.preventDefault();
            onClearABLoop();
          }
          break;

        case 'KeyF':
          e.preventDefault();
          setIsFlipped((prev) => !prev);
          break;

        case 'KeyS':
          e.preventDefault();
          toggleScaleMode();
          break;

        case 'KeyT':
          e.preventDefault();
          toggleSpeedTrainer();
          break;

        case 'KeyC':
          if (!e.metaKey && !e.ctrlKey && onCycleTheme) {
            e.preventDefault();
            onCycleTheme();
          }
          break;

        case 'ArrowUp':
          if (e.shiftKey) {
            e.preventDefault();
            onTransposeChange(transpose + 1);
          }
          break;

        case 'ArrowDown':
          if (e.shiftKey) {
            e.preventDefault();
            onTransposeChange(transpose - 1);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    onPlayPause, onSeek, onPrevSection, onNextSection, toggleMetronome, durationSec, speed,
    onSpeedChange, onTransposeChange, transpose, toggleScaleMode,
    toggleSpeedTrainer, onSetLoopA, onSetLoopB, onClearABLoop,
    currentTimeMsRef, loopARef, loopBRef, setIsFlipped, setIsShortcutsOpen,
    onCycleTheme,
  ]);
}
