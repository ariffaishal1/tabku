import { useState, useRef, useCallback, useEffect } from 'react';
import { metronome } from '../services/metronome';
import type { SongTimeline } from '../services/timelineExtractor';
import type { AlphaTabSheetRef } from '../components/Player/AlphaTabSheet';

export function useMetronome(
  tempo: number,
  speed: number,
  alphaTabRef: React.RefObject<AlphaTabSheetRef | null>,
  currentTimeMsRef: React.RefObject<number>,
) {
  // State
  const [timeSignature, setTimeSignature] = useState('4/4');
  const [isMetronomeOn, setIsMetronomeOn] = useState(false);
  const [metronomeVolume, setMetronomeVolume] = useState(0.7);
  const [isCountInEnabled, setIsCountInEnabled] = useState(false);
  const [isCountingIn, setIsCountingIn] = useState(false);
  const [countInBeat, setCountInBeat] = useState(0);

  // Refs for high-frequency RAF access
  const isMetronomeOnRef = useRef(false);
  const isCountingInRef = useRef(false);
  const countInTimeoutsRef = useRef<number[]>([]);
  const lastScheduledBeatTimeRef = useRef(-1);
  const tempoRef = useRef(tempo);
  const timeSignatureRef = useRef('4/4');

  // Keep refs in sync
  useEffect(() => { isMetronomeOnRef.current = isMetronomeOn; }, [isMetronomeOn]);
  useEffect(() => { isCountingInRef.current = isCountingIn; }, [isCountingIn]);
  useEffect(() => { tempoRef.current = tempo; }, [tempo]);
  useEffect(() => { timeSignatureRef.current = timeSignature; }, [timeSignature]);

  /** Cancel any in-progress count-in. */
  const cancelCountIn = useCallback(() => {
    countInTimeoutsRef.current.forEach(id => window.clearTimeout(id));
    countInTimeoutsRef.current = [];
    setIsCountingIn(false);
    setCountInBeat(0);
    isCountingInRef.current = false;
  }, []);

  /** Start a 1-bar count-in, then auto-trigger AlphaTab playback. */
  const startCountIn = useCallback(() => {
    cancelCountIn();
    metronome.resume();
    setIsCountingIn(true);
    isCountingInRef.current = true;

    const beatsPerBar = parseInt(timeSignatureRef.current.split('/')[0]) || 4;
    const currentTempo = tempoRef.current || 120;
    const beatDurationSec = (60 / currentTempo) / speed;
    const beatDurationMs = beatDurationSec * 1000;

    for (let b = 1; b <= beatsPerBar; b++) {
      const timeoutId = window.setTimeout(() => {
        if (!isCountingInRef.current) return;
        setCountInBeat(b);
        metronome.playClick(undefined, b === 1);
      }, (b - 1) * beatDurationMs);
      countInTimeoutsRef.current.push(timeoutId);
    }

    const finishTimeoutId = window.setTimeout(() => {
      if (!isCountingInRef.current) return;
      setIsCountingIn(false);
      setCountInBeat(0);
      isCountingInRef.current = false;
      lastScheduledBeatTimeRef.current = (currentTimeMsRef.current ?? 0) - 1;
      alphaTabRef.current?.playPause();
    }, beatsPerBar * beatDurationMs);

    countInTimeoutsRef.current.push(finishTimeoutId);
  }, [cancelCountIn, speed, alphaTabRef, currentTimeMsRef]);

  /** Toggle metronome on/off. */
  const toggleMetronome = useCallback(() => {
    setIsMetronomeOn(prev => {
      const next = !prev;
      isMetronomeOnRef.current = next;
      if (next) {
        metronome.resume();
        lastScheduledBeatTimeRef.current = (currentTimeMsRef.current ?? 0) - 1;
      }
      return next;
    });
  }, [currentTimeMsRef]);

  /** Change metronome click volume. */
  const changeMetronomeVolume = useCallback((vol: number) => {
    setMetronomeVolume(vol);
    metronome.setVolume(vol);
  }, []);

  /** Resume the Web Audio context (needed before first play). */
  const resumeAudio = useCallback(() => {
    metronome.resume();
  }, []);

  /** Reset the last-scheduled-beat tracking point. */
  const resetLastScheduledBeat = useCallback((ms?: number) => {
    lastScheduledBeatTimeRef.current = ms !== undefined ? ms - 1 : -1;
  }, []);

  /**
   * Schedule metronome clicks during the RAF loop.
   * Called every animation frame when isPlaying.
   */
  const scheduleClicks = useCallback((interpolatedMs: number, spd: number, timeline: SongTimeline | null) => {
    if (!isMetronomeOnRef.current) return;

    const lookaheadSongMs = 70 * spd;
    const windowStart = interpolatedMs;
    const windowEnd = interpolatedMs + lookaheadSongMs;
    const lastScheduled = lastScheduledBeatTimeRef.current;

    const metroBeats = timeline?.metronomeBeats;
    if (metroBeats && metroBeats.length > 0) {
      for (let i = 0; i < metroBeats.length; i++) {
        const mb = metroBeats[i];
        if (mb.timeMs >= windowStart && mb.timeMs < windowEnd && mb.timeMs > lastScheduled) {
          const delayWallSec = Math.max(0, (mb.timeMs - interpolatedMs) / (1000 * spd));
          const targetAudioTime = metronome.getCurrentTime() + delayWallSec;
          metronome.playClick(targetAudioTime, mb.isStrong);
          lastScheduledBeatTimeRef.current = mb.timeMs;
        } else if (mb.timeMs >= windowEnd) {
          break;
        }
      }
    } else {
      // Mathematical fallback based on tempo & timeSignature
      const beatsPerBar = parseInt(timeSignatureRef.current.split('/')[0]) || 4;
      const currentTempo = tempoRef.current || 120;
      const beatDurationMs = 60000 / currentTempo;
      const beatIdx = Math.floor(interpolatedMs / beatDurationMs);
      const beatTimeMs = beatIdx * beatDurationMs;
      if (beatTimeMs >= windowStart && beatTimeMs < windowEnd && beatTimeMs > lastScheduled) {
        const delayWallSec = Math.max(0, (beatTimeMs - interpolatedMs) / (1000 * spd));
        const targetAudioTime = metronome.getCurrentTime() + delayWallSec;
        metronome.playClick(targetAudioTime, beatIdx % beatsPerBar === 0);
        lastScheduledBeatTimeRef.current = beatTimeMs;
      }
    }
  }, []);

  return {
    // State
    timeSignature, setTimeSignature,
    isMetronomeOn,
    metronomeVolume,
    isCountInEnabled, setIsCountInEnabled,
    isCountingIn, countInBeat,
    // Refs
    isCountingInRef,
    lastScheduledBeatTimeRef,
    // Handlers
    cancelCountIn, startCountIn,
    toggleMetronome, changeMetronomeVolume,
    resumeAudio, resetLastScheduledBeat,
    scheduleClicks,
  };
}
