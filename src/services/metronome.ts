/**
 * Metronome Audio Service using Web Audio API
 * Provides high-precision click track and count-in audio.
 */

class MetronomeService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private _volume: number = 0.7;

  /**
   * Initialize or return the AudioContext.
   * Lazily initialized on first user interaction to comply with browser autoplay policies.
   */
  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this._volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch((err) => {
        console.warn('[Metronome] AudioContext resume failed:', err);
      });
    }

    return this.ctx;
  }

  /**
   * Resume audio context on user interaction (e.g. click Play or toggle Metronome)
   */
  public resume(): void {
    const ctx = this.getContext();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  }

  /**
   * Get the current AudioContext time (useful for lookahead scheduling)
   */
  public getCurrentTime(): number {
    return this.ctx ? this.ctx.currentTime : 0;
  }

  /**
   * Set metronome click volume (0.0 to 1.0)
   */
  public setVolume(vol: number): void {
    const clamped = Math.max(0, Math.min(1, vol));
    this._volume = clamped;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(clamped, this.ctx.currentTime);
    }
  }

  /**
   * Get current volume
   */
  public getVolume(): number {
    return this._volume;
  }

  /**
   * Play a single metronome click at target time (or immediately).
   * @param targetTime Scheduled time in AudioContext seconds. If omitted, plays immediately.
   * @param isStrong Beat 1 of measure (higher pitch, more prominent) vs weak beats
   */
  public playClick(targetTime?: number, isStrong: boolean = false): void {
    try {
      const ctx = this.getContext();
      const startTime = targetTime !== undefined ? Math.max(targetTime, ctx.currentTime) : ctx.currentTime;

      // Click envelope gain
      const clickGain = ctx.createGain();
      const peakGain = isStrong ? 1.0 : 0.65;
      const duration = isStrong ? 0.05 : 0.038;

      // Quick 1ms attack to avoid audio click/pop, then exponential decay
      clickGain.gain.setValueAtTime(0.0001, startTime);
      clickGain.gain.exponentialRampToValueAtTime(peakGain, startTime + 0.001);
      clickGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      // Pitch: Strong beat 1200Hz -> 1000Hz, Weak beats 850Hz -> 750Hz (woodblock punch)
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      const baseFreq = isStrong ? 1200 : 850;
      const endFreq = isStrong ? 1000 : 750;

      osc.frequency.setValueAtTime(baseFreq, startTime);
      osc.frequency.exponentialRampToValueAtTime(endFreq, startTime + duration);

      // Route: osc -> clickGain -> masterGain -> destination
      if (this.masterGain) {
        osc.connect(clickGain);
        clickGain.connect(this.masterGain);
      } else {
        osc.connect(clickGain);
        clickGain.connect(ctx.destination);
      }

      osc.start(startTime);
      osc.stop(startTime + duration + 0.01);

      // Clean up nodes after sound finishes
      osc.onended = () => {
        osc.disconnect();
        clickGain.disconnect();
      };
    } catch (err) {
      console.warn('[Metronome] playClick error:', err);
    }
  }

  /**
   * Clean up resources
   */
  public dispose(): void {
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
      this.masterGain = null;
    }
  }
}

// Singleton export
export const metronome = new MetronomeService();
