import { useState, useRef, useCallback, useEffect } from 'react';
import { generateBackingTrackTex, type ScaleDisplayMode } from '../services/scaleTheory';

export function useScaleLab(tempo: number) {
  // State
  const [isScaleMode, setIsScaleMode] = useState(true);
  const [scaleRoot, setScaleRoot] = useState(9); // Default A (pitch class 9)
  const [scaleId, setScaleId] = useState('minor_pentatonic');
  const [scaleDisplayMode, setScaleDisplayMode] = useState<ScaleDisplayMode>('degrees');
  const [scalePosition, setScalePosition] = useState<number | 'all'>('all');
  const [backingProgressionName, setBackingProgressionName] = useState('A Minor Rock/Ballad Groove');

  // Scale Lab Bar horizontal scroll state
  const scaleLabBarRef = useRef<HTMLDivElement>(null);
  const [scaleLabCanScrollRight, setScaleLabCanScrollRight] = useState(false);
  const [scaleLabCanScrollLeft, setScaleLabCanScrollLeft] = useState(false);

  /** Check if the scale lab bar has overflow and update scroll indicators. */
  const checkScaleLabScroll = useCallback(() => {
    const el = scaleLabBarRef.current;
    if (!el) return;
    const canLeft = el.scrollLeft > 6;
    const canRight = el.scrollLeft < el.scrollWidth - el.clientWidth - 6;
    setScaleLabCanScrollLeft(canLeft);
    setScaleLabCanScrollRight(canRight);
  }, []);

  // Responsive scroll detection
  useEffect(() => {
    if (!isScaleMode) {
      setScaleLabCanScrollLeft(false);
      setScaleLabCanScrollRight(false);
      return;
    }
    const timer = setTimeout(checkScaleLabScroll, 260);
    window.addEventListener('resize', checkScaleLabScroll);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkScaleLabScroll);
    };
  }, [isScaleMode, checkScaleLabScroll, scalePosition, scaleId, scaleRoot]);

  /** Toggle scale overlay mode on/off. */
  const toggleScaleMode = useCallback(() => {
    setIsScaleMode(prev => !prev);
  }, []);

  /** Toggle between degree labels (R, ♭3, 5) and note names (A, C, D). */
  const toggleDisplayMode = useCallback(() => {
    setScaleDisplayMode(prev => (prev === 'degrees' ? 'notes' : 'degrees'));
  }, []);

  /**
   * Update scale root & type. Returns the generated backing track info.
   * Caller is responsible for loading the tex into AlphaTab if appropriate.
   */
  const updateScaleConfig = useCallback((newRoot: number, newScaleId: string) => {
    setScaleRoot(newRoot);
    setScaleId(newScaleId);
    const currentTempo = tempo || 90;
    const backing = generateBackingTrackTex(newRoot, newScaleId, currentTempo);
    setBackingProgressionName(backing.progressionName);
    return backing;
  }, [tempo]);

  return {
    // State
    isScaleMode, setIsScaleMode,
    scaleRoot, setScaleRoot,
    scaleId, setScaleId,
    scaleDisplayMode,
    scalePosition, setScalePosition,
    backingProgressionName, setBackingProgressionName,
    // Refs
    scaleLabBarRef,
    // Scroll state
    scaleLabCanScrollLeft, scaleLabCanScrollRight,
    // Handlers
    checkScaleLabScroll, toggleScaleMode, toggleDisplayMode, updateScaleConfig,
  };
}
