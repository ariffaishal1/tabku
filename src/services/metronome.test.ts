import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { metronome } from './metronome';

describe('metronome service', () => {
  let mockGainNode: any;
  let mockOscillator: any;
  let mockAudioContext: any;
  const originalWindow = globalThis.window;

  beforeEach(() => {
    mockGainNode = {
      gain: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
      disconnect: vi.fn(),
    };

    mockOscillator = {
      type: 'triangle',
      frequency: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      onended: null as any,
    };

    mockAudioContext = {
      state: 'running',
      currentTime: 10.5,
      destination: {},
      createGain: vi.fn(() => mockGainNode),
      createOscillator: vi.fn(() => ({ ...mockOscillator, frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() } })),
      resume: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
    };

    class MockAudioContextClass {
      constructor() {
        return mockAudioContext;
      }
    }

    // Mock window
    (globalThis as any).window = {
      AudioContext: MockAudioContextClass,
    };
  });

  afterEach(() => {
    metronome.dispose();
    (globalThis as any).window = originalWindow;
    vi.restoreAllMocks();
  });

  it('sets and gets volume within [0, 1] range', () => {
    metronome.setVolume(0.5);
    expect(metronome.getVolume()).toBe(0.5);

    // Clamps to 1
    metronome.setVolume(1.8);
    expect(metronome.getVolume()).toBe(1.0);

    // Clamps to 0
    metronome.setVolume(-0.4);
    expect(metronome.getVolume()).toBe(0);
  });

  it('returns current audio context time or 0 if uninitialized', () => {
    // Before context is initialized
    expect(metronome.getCurrentTime()).toBe(0);

    // After context initialized via resume
    metronome.resume();
    expect(metronome.getCurrentTime()).toBe(10.5);
  });

  it('resumes suspended audio context', () => {
    mockAudioContext.state = 'suspended';
    metronome.resume();
    expect(mockAudioContext.resume).toHaveBeenCalled();
  });

  it('plays strong click with 1200Hz base frequency and higher gain', () => {
    let createdOsc: any;
    let createdGain: any;
    mockAudioContext.createOscillator.mockImplementation(() => {
      createdOsc = {
        type: 'triangle',
        frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
        connect: vi.fn(),
        disconnect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        onended: null as any,
      };
      return createdOsc;
    });
    mockAudioContext.createGain.mockImplementation(() => {
      createdGain = {
        gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
        connect: vi.fn(),
        disconnect: vi.fn(),
      };
      return createdGain;
    });

    metronome.playClick(undefined, true);

    expect(createdOsc.frequency.setValueAtTime).toHaveBeenCalledWith(1200, 10.5);
    expect(createdOsc.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(1000, 10.5 + 0.05);
    expect(createdGain.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(1.0, 10.5 + 0.001);

    // Test onended cleanup
    expect(typeof createdOsc.onended).toBe('function');
    createdOsc.onended();
    expect(createdOsc.disconnect).toHaveBeenCalled();
    expect(createdGain.disconnect).toHaveBeenCalled();
  });

  it('plays weak click with 850Hz base frequency and standard gain', () => {
    let createdOsc: any;
    let createdGain: any;
    mockAudioContext.createOscillator.mockImplementation(() => {
      createdOsc = {
        type: 'triangle',
        frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
        connect: vi.fn(),
        disconnect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        onended: null as any,
      };
      return createdOsc;
    });
    mockAudioContext.createGain.mockImplementation(() => {
      createdGain = {
        gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
        connect: vi.fn(),
        disconnect: vi.fn(),
      };
      return createdGain;
    });

    metronome.playClick(12.0, false);

    expect(createdOsc.frequency.setValueAtTime).toHaveBeenCalledWith(850, 12.0);
    expect(createdOsc.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(750, 12.0 + 0.038);
    expect(createdGain.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.65, 12.0 + 0.001);
  });

  it('updates masterGain immediately when volume changed on initialized context', () => {
    metronome.resume(); // initializes context and masterGain
    metronome.setVolume(0.4);
    expect(mockGainNode.gain.setValueAtTime).toHaveBeenCalledWith(0.4, 10.5);
  });

  it('disposes audio context cleanly', () => {
    metronome.resume(); // initializes ctx
    metronome.dispose();
    expect(mockAudioContext.close).toHaveBeenCalled();
    expect(metronome.getCurrentTime()).toBe(0);
  });
});
