import { useState, useCallback, type RefObject } from 'react';
import type { AlphaTabSheetRef } from '../components/Player/AlphaTabSheet';
import { PRESET_SONGS } from '../services/presetTabs';
import { generateBackingTrackTex } from '../services/scaleTheory';
import type { TrackInfo } from '../types/guitar';

interface UseSongControlsDeps {
  alphaTabRef: RefObject<AlphaTabSheetRef | null>;
  // From useMetronome
  cancelCountIn: () => void;
  resetLastScheduledBeat: (ms?: number) => void;
  // From useABLoop
  clearABLoop: () => void;
  // From usePlayback
  resetSync: () => void;
  // Timeline reset (App-level state setter)
  setTimeline: (t: null) => void;
  // From useScaleLab
  isScaleMode: boolean;
  setIsScaleMode: (v: boolean) => void;
  scaleRoot: number;
  scaleId: string;
  setBackingProgressionName: (name: string) => void;
  // From useToast
  showSuccess: (title: string, msg: string) => void;
  showInfo: (title: string, msg: string) => void;
  showError: (title: string, msg: string) => void;
}

export interface SongControlsState {
  selectedPresetId: string;
  songTitle: string;
  setSongTitle: (v: string) => void;
  songArtist: string;
  setSongArtist: (v: string) => void;
  tempo: number;
  setTempo: (v: number) => void;
  tracks: TrackInfo[];
  setTracks: React.Dispatch<React.SetStateAction<TrackInfo[]>>;
  activeTrackIndex: number;
  setActiveTrackIndex: (v: number) => void;
  transpose: number;
  handleTransposeChange: (semitones: number) => void;
  handleSelectPreset: (presetId: string) => void;
  handleFileUpload: (file: File) => void;
  handleSelectTrack: (trackIndex: number) => void;
  handleToggleMute: (trackIndex: number) => void;
  handleToggleSolo: (trackIndex: number) => void;
}

const VALID_GP_EXTENSIONS = ['.gp', '.gp5', '.gpx', '.gp4', '.gp3'];

/**
 * Owns all song & track state (title, artist, tempo, tracks, transpose, etc.)
 * and exposes the handlers that mutate it, including coordination with AlphaTab,
 * metronome, A-B loop, and scale mode resets.
 *
 * Extracted from App.tsx so the orchestrator only needs to wire hooks together,
 * not manage individual state variables.
 */
export function useSongControls({
  alphaTabRef,
  cancelCountIn,
  resetLastScheduledBeat,
  clearABLoop,
  resetSync,
  setTimeline,
  setIsScaleMode,
  scaleRoot,
  scaleId,
  setBackingProgressionName,
  showSuccess,
  showInfo,
  showError,
}: UseSongControlsDeps): SongControlsState {
  const [selectedPresetId, setSelectedPresetId] = useState(PRESET_SONGS[0].id);
  const [songTitle, setSongTitle] = useState(PRESET_SONGS[0].title);
  const [songArtist, setSongArtist] = useState(PRESET_SONGS[0].artist);
  const [tempo, setTempo] = useState(PRESET_SONGS[0].tempo);
  const [tracks, setTracks] = useState<TrackInfo[]>([]);
  const [activeTrackIndex, setActiveTrackIndex] = useState(0);
  const [transpose, setTranspose] = useState(0);

  const handleTransposeChange = useCallback(
    (newTranspose: number) => {
      const clamped = Math.max(-12, Math.min(12, newTranspose));
      setTranspose(clamped);
      alphaTabRef.current?.setTranspose(clamped);
      if (clamped !== 0) {
        showInfo('Pitch Shifter', `${clamped > 0 ? '+' : ''}${clamped} Semitone`);
      } else {
        showInfo('Pitch Shifter', 'Kembali ke nada asli (0 st)');
      }
    },
    [alphaTabRef, showInfo],
  );

  const handleSelectPreset = useCallback(
    (presetId: string) => {
      const preset = PRESET_SONGS.find((p) => p.id === presetId);
      if (!preset) return;

      cancelCountIn();
      clearABLoop();
      setTranspose(0);
      setSelectedPresetId(presetId);
      setSongTitle(preset.title);
      setSongArtist(preset.artist);
      setTempo(preset.tempo);
      setTimeline(null);
      resetSync();
      resetLastScheduledBeat();
      showSuccess('Preset Dimuat', `${preset.title} · ${preset.artist}`);

      if (presetId === 'scale-practice-empty') {
        setIsScaleMode(true);
        const backing = generateBackingTrackTex(scaleRoot, scaleId, preset.tempo);
        setBackingProgressionName(backing.progressionName);
        alphaTabRef.current?.loadTex(backing.tex);
      } else {
        setIsScaleMode(false);
        alphaTabRef.current?.loadTex(preset.tex);
      }
    },
    [
      alphaTabRef, cancelCountIn, clearABLoop, resetSync, resetLastScheduledBeat,
      setTimeline, setIsScaleMode, scaleRoot, scaleId,
      setBackingProgressionName, showSuccess,
    ],
  );

  const handleFileUpload = useCallback(
    (file: File) => {
      const lowerName = file.name.toLowerCase();
      const isValid = VALID_GP_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
      if (!isValid) {
        showError(
          'Format Berkas Tidak Didukung',
          `Harap pilih berkas Guitar Pro (${VALID_GP_EXTENSIONS.join(', ')}).`,
        );
        return;
      }

      cancelCountIn();
      clearABLoop();
      setTranspose(0);
      setSongTitle(file.name.replace(/\.[^/.]+$/, ''));
      setSongArtist('User Tab Import');
      setTimeline(null);
      resetSync();
      resetLastScheduledBeat();
      showInfo('Membaca Tab', file.name);
      alphaTabRef.current?.loadFile(file);
    },
    [
      alphaTabRef, cancelCountIn, clearABLoop, resetSync,
      resetLastScheduledBeat, setTimeline, showInfo, showError,
    ],
  );

  const handleSelectTrack = useCallback(
    (trackIndex: number) => {
      cancelCountIn();
      clearABLoop();
      setActiveTrackIndex(trackIndex);
      resetSync();
      resetLastScheduledBeat();
      alphaTabRef.current?.changeTrack(trackIndex);
    },
    [alphaTabRef, cancelCountIn, clearABLoop, resetSync, resetLastScheduledBeat],
  );

  const handleToggleMute = useCallback(
    (trackIndex: number) => {
      setTracks((prev) =>
        prev.map((t) => (t.index === trackIndex ? { ...t, isMuted: !t.isMuted } : t)),
      );
      alphaTabRef.current?.toggleMute(trackIndex);
    },
    [alphaTabRef],
  );

  const handleToggleSolo = useCallback(
    (trackIndex: number) => {
      setTracks((prev) =>
        prev.map((t) => (t.index === trackIndex ? { ...t, isSolo: !t.isSolo } : t)),
      );
      alphaTabRef.current?.toggleSolo(trackIndex);
    },
    [alphaTabRef],
  );

  return {
    selectedPresetId,
    songTitle, setSongTitle,
    songArtist, setSongArtist,
    tempo, setTempo,
    tracks, setTracks,
    activeTrackIndex, setActiveTrackIndex,
    transpose,
    handleTransposeChange,
    handleSelectPreset,
    handleFileUpload,
    handleSelectTrack,
    handleToggleMute,
    handleToggleSolo,
  };
}
