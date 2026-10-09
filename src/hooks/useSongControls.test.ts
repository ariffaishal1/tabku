// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSongControls } from './useSongControls';
import { PRESET_SONGS } from '../services/presetTabs';
import type { AlphaTabSheetRef } from '../components/Player/AlphaTabSheet';
import type { TrackInfo } from '../types/guitar';

describe('useSongControls hook', () => {
  let mockAlphaTabRef: { current: AlphaTabSheetRef };
  let deps: any;

  beforeEach(() => {
    mockAlphaTabRef = {
      current: {
        setTranspose: vi.fn(),
        loadTex: vi.fn(),
        loadFile: vi.fn(),
        changeTrack: vi.fn(),
        toggleMute: vi.fn(),
        toggleSolo: vi.fn(),
      } as unknown as AlphaTabSheetRef,
    };

    deps = {
      alphaTabRef: mockAlphaTabRef,
      cancelCountIn: vi.fn(),
      resetLastScheduledBeat: vi.fn(),
      clearABLoop: vi.fn(),
      resetSync: vi.fn(),
      setTimeline: vi.fn(),
      isScaleMode: false,
      setIsScaleMode: vi.fn(),
      scaleRoot: 0,
      scaleId: 'minor_pentatonic',
      setBackingProgressionName: vi.fn(),
      showSuccess: vi.fn(),
      showInfo: vi.fn(),
      showError: vi.fn(),
    };
  });

  it('initializes with first preset song metadata', () => {
    const { result } = renderHook(() => useSongControls(deps));

    expect(result.current.selectedPresetId).toBe(PRESET_SONGS[0].id);
    expect(result.current.songTitle).toBe(PRESET_SONGS[0].title);
    expect(result.current.songArtist).toBe(PRESET_SONGS[0].artist);
    expect(result.current.tempo).toBe(PRESET_SONGS[0].tempo);
    expect(result.current.tracks).toEqual([]);
    expect(result.current.activeTrackIndex).toBe(0);
    expect(result.current.transpose).toBe(0);
  });

  it('changes transpose and clamps within -12 to +12 semitones', () => {
    const { result } = renderHook(() => useSongControls(deps));

    act(() => {
      result.current.handleTransposeChange(3);
    });
    expect(result.current.transpose).toBe(3);
    expect(mockAlphaTabRef.current.setTranspose).toHaveBeenCalledWith(3);
    expect(deps.showInfo).toHaveBeenCalledWith('Pitch Shifter', '+3 Semitone');

    // Clamps overflow
    act(() => {
      result.current.handleTransposeChange(20);
    });
    expect(result.current.transpose).toBe(12);
    expect(mockAlphaTabRef.current.setTranspose).toHaveBeenCalledWith(12);

    // Reset to 0
    act(() => {
      result.current.handleTransposeChange(0);
    });
    expect(result.current.transpose).toBe(0);
    expect(deps.showInfo).toHaveBeenCalledWith('Pitch Shifter', 'Kembali ke nada asli (0 st)');
  });

  it('loads standard preset and resets loop & transport', () => {
    const { result } = renderHook(() => useSongControls(deps));
    const targetPreset = PRESET_SONGS[1]; // Midnight Blues Jam

    act(() => {
      result.current.handleSelectPreset(targetPreset.id);
    });

    expect(deps.cancelCountIn).toHaveBeenCalled();
    expect(deps.clearABLoop).toHaveBeenCalled();
    expect(deps.resetSync).toHaveBeenCalled();
    expect(deps.resetLastScheduledBeat).toHaveBeenCalled();
    expect(deps.setTimeline).toHaveBeenCalledWith(null);
    expect(deps.setIsScaleMode).toHaveBeenCalledWith(false);

    expect(result.current.selectedPresetId).toBe(targetPreset.id);
    expect(result.current.songTitle).toBe(targetPreset.title);
    expect(result.current.songArtist).toBe(targetPreset.artist);
    expect(result.current.tempo).toBe(targetPreset.tempo);
    expect(mockAlphaTabRef.current.loadTex).toHaveBeenCalledWith(targetPreset.tex);
    expect(deps.showSuccess).toHaveBeenCalledWith('Preset Dimuat', `${targetPreset.title} · ${targetPreset.artist}`);
  });

  it('handles scale-practice-empty preset and activates scale mode with backing track', () => {
    const { result } = renderHook(() => useSongControls(deps));

    act(() => {
      result.current.handleSelectPreset('scale-practice-empty');
    });

    expect(deps.setIsScaleMode).toHaveBeenCalledWith(true);
    expect(deps.setBackingProgressionName).toHaveBeenCalled();
    expect(mockAlphaTabRef.current.loadTex).toHaveBeenCalled();
  });

  it('ignores nonexistent preset id', () => {
    const { result } = renderHook(() => useSongControls(deps));

    act(() => {
      result.current.handleSelectPreset('non-existent-id');
    });

    expect(deps.cancelCountIn).not.toHaveBeenCalled();
    expect(mockAlphaTabRef.current.loadTex).not.toHaveBeenCalled();
  });

  it('rejects unsupported file upload extension', () => {
    const { result } = renderHook(() => useSongControls(deps));
    const badFile = new File(['dummy'], 'audio.mp3', { type: 'audio/mp3' });

    act(() => {
      result.current.handleFileUpload(badFile);
    });

    expect(deps.showError).toHaveBeenCalledWith(
      'Format Berkas Tidak Didukung',
      expect.stringContaining('Guitar Pro'),
    );
    expect(mockAlphaTabRef.current.loadFile).not.toHaveBeenCalled();
  });

  it('accepts valid Guitar Pro file upload (.gp5) and updates title', () => {
    const { result } = renderHook(() => useSongControls(deps));
    const validFile = new File(['dummy gp data'], 'Hotel California.gp5');

    act(() => {
      result.current.handleFileUpload(validFile);
    });

    expect(deps.cancelCountIn).toHaveBeenCalled();
    expect(deps.clearABLoop).toHaveBeenCalled();
    expect(deps.resetSync).toHaveBeenCalled();
    expect(deps.setTimeline).toHaveBeenCalledWith(null);
    expect(result.current.songTitle).toBe('Hotel California');
    expect(result.current.songArtist).toBe('User Tab Import');
    expect(deps.showInfo).toHaveBeenCalledWith('Membaca Tab', 'Hotel California.gp5');
    expect(mockAlphaTabRef.current.loadFile).toHaveBeenCalledWith(validFile);
  });

  it('handles track switching', () => {
    const { result } = renderHook(() => useSongControls(deps));

    act(() => {
      result.current.handleSelectTrack(2);
    });

    expect(result.current.activeTrackIndex).toBe(2);
    expect(deps.cancelCountIn).toHaveBeenCalled();
    expect(deps.clearABLoop).toHaveBeenCalled();
    expect(deps.resetSync).toHaveBeenCalled();
    expect(mockAlphaTabRef.current.changeTrack).toHaveBeenCalledWith(2);
  });

  it('toggles track mute state', () => {
    const { result } = renderHook(() => useSongControls(deps));
    const initialTracks: TrackInfo[] = [
      {
        index: 0,
        name: 'Lead',
        instrument: 'Acoustic Guitar',
        isMuted: false,
        isSolo: false,
        volume: 1,
        tuning: [64, 59, 55, 50, 45, 40],
        tuningNames: ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'],
        stringCount: 6,
      },
      {
        index: 1,
        name: 'Rhythm',
        instrument: 'Electric Guitar',
        isMuted: false,
        isSolo: false,
        volume: 1,
        tuning: [64, 59, 55, 50, 45, 40],
        tuningNames: ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'],
        stringCount: 6,
      },
    ];

    act(() => {
      result.current.setTracks(initialTracks);
    });

    act(() => {
      result.current.handleToggleMute(1);
    });

    expect(result.current.tracks[1].isMuted).toBe(true);
    expect(result.current.tracks[0].isMuted).toBe(false);
    expect(mockAlphaTabRef.current.toggleMute).toHaveBeenCalledWith(1);
  });

  it('toggles track solo state', () => {
    const { result } = renderHook(() => useSongControls(deps));
    const initialTracks: TrackInfo[] = [
      {
        index: 0,
        name: 'Lead',
        instrument: 'Acoustic Guitar',
        isMuted: false,
        isSolo: false,
        volume: 1,
        tuning: [64, 59, 55, 50, 45, 40],
        tuningNames: ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'],
        stringCount: 6,
      },
      {
        index: 1,
        name: 'Rhythm',
        instrument: 'Electric Guitar',
        isMuted: false,
        isSolo: false,
        volume: 1,
        tuning: [64, 59, 55, 50, 45, 40],
        tuningNames: ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'],
        stringCount: 6,
      },
    ];

    act(() => {
      result.current.setTracks(initialTracks);
    });

    act(() => {
      result.current.handleToggleSolo(0);
    });

    expect(result.current.tracks[0].isSolo).toBe(true);
    expect(result.current.tracks[1].isSolo).toBe(false);
    expect(mockAlphaTabRef.current.toggleSolo).toHaveBeenCalledWith(0);
  });
});
