import { useState, useCallback } from 'react';

export interface EngineStateHandlers {
  /** Pass directly to AlphaTabSheet `onSoundFontProgress` */
  handleSoundFontProgress: (loaded: number, total: number) => void;
  /** Pass directly to AlphaTabSheet `onSoundFontLoaded` */
  handleSoundFontLoaded: () => void;
  /** Pass directly to AlphaTabSheet `onPlayerReady` */
  handlePlayerReady: () => void;
  /** Pass directly to AlphaTabSheet `onScoreLoading` */
  handleScoreLoading: () => void;
  /** Pass directly to AlphaTabSheet `onScoreLoaded` */
  handleScoreLoaded: () => void;
  /** Resets error state and reloads the page — pass to SplashScreen `onRetry` */
  handleRetry: () => void;
  /** Call from AlphaTabSheet `onError` after showing a toast */
  clearLoadingOnError: () => void;
}

export interface EngineStateValues {
  isEngineLoading: boolean;
  soundFontProgress: number;
  soundFontStatus: string;
  soundFontError: string | null;
  isLoadingScore: boolean;
  setSoundFontError: (err: string | null) => void;
}

/**
 * Manages AlphaTab audio engine + score loading state that drives the
 * SplashScreen and the loading indicator on the TopNav.
 *
 * Extracted from App.tsx to keep engine lifecycle concerns in one place.
 */
export function useEngineState(): EngineStateValues & EngineStateHandlers {
  const [isEngineLoading, setIsEngineLoading] = useState(true);
  const [soundFontProgress, setSoundFontProgress] = useState(15);
  const [soundFontStatus, setSoundFontStatus] = useState('Mengunduh SoundFont Sonivox...');
  const [soundFontError, setSoundFontError] = useState<string | null>(null);
  const [isLoadingScore, setIsLoadingScore] = useState(false);

  const handleSoundFontProgress = useCallback((loaded: number, total: number) => {
    const pct = total > 0 ? (loaded / total) * 100 : 0;
    setSoundFontProgress(pct);
    setSoundFontStatus(
      `Mengunduh SoundFont Sonivox (${(loaded / 1024 / 1024).toFixed(1)} MB)...`
    );
  }, []);

  const handleSoundFontLoaded = useCallback(() => {
    setSoundFontProgress(100);
    setSoundFontStatus('Menyiapkan AlphaSynth Audio Engine...');
  }, []);

  const handlePlayerReady = useCallback(() => {
    setSoundFontStatus('Siap Bermain!');
    setIsEngineLoading(false);
  }, []);

  const handleScoreLoading = useCallback(() => {
    setIsLoadingScore(true);
  }, []);

  const handleScoreLoaded = useCallback(() => {
    setIsLoadingScore(false);
  }, []);

  const clearLoadingOnError = useCallback(() => {
    setIsLoadingScore(false);
  }, []);

  const handleRetry = useCallback(() => {
    setSoundFontError(null);
    setIsEngineLoading(true);
    window.location.reload();
  }, []);

  return {
    isEngineLoading,
    soundFontProgress,
    soundFontStatus,
    soundFontError,
    isLoadingScore,
    setSoundFontError,
    handleSoundFontProgress,
    handleSoundFontLoaded,
    handlePlayerReady,
    handleScoreLoading,
    handleScoreLoaded,
    clearLoadingOnError,
    handleRetry,
  };
}
