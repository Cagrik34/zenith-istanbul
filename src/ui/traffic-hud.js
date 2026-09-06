/**
 * ZenithIstanbul - Architectural Telemetry HUD & Spatial Audio Synthesizer
 * Web Audio API procedural sound synthesizer (Low-frequency ingress, ambient acoustic resonance, gridlock alarm),
 * Telemetry gauge controller, and building inspector drawer.
 */

export class TrafficHUD {
  constructor() {
    this.audioCtx = null;
    this.audioEnabled = false;
    this.initAudio();
  }

  initAudio() {
    const enableAudioOnce = () => {
      if (!this.audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audioCtx = new AudioContext();
        this.audioEnabled = true;
      }
      window.removeEventListener('click', enableAudioOnce);
    };
    window.addEventListener('click', enableAudioOnce);
  }

  /**
   * Low-frequency acoustic ingress horn synthesizer (Maritime Bosphorus harmonic resonance)
   */
  playVapurDudugu() {
    if (!this.audioCtx || !this.audioEnabled) return;
    try {
      const now = this.audioCtx.currentTime;
      // Dual oscillator detuned pair (110 Hz and 113.5 Hz)
      const osc1 = this.audioCtx.createOscillator();
      const osc2 = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(110, now);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(113.5, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.35, now + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2.8);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 3.0);
      osc2.stop(now + 3.0);
    } catch (e) {
      console.warn('Audio synthesis telemetry note:', e);
    }
  }

  /**
   * Bridge Ingress Cyclic Deadlock Alert Synthesizer
   */
  playGridlockAlertTone() {
    if (!this.audioCtx || !this.audioEnabled) return;
    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(380, now);
      osc.frequency.exponentialRampToValueAtTime(340, now + 0.4);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.5);
    } catch (e) {}
  }

  /**
   * Backward-compatibility alias for deadlock alarm
   */
  playTrafficHonk() {
    return this.playGridlockAlertTone();
  }

  /**
   * Ambient coastal seagull resonance
   */
  playSeagull() {
    if (!this.audioCtx || !this.audioEnabled) return;
    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1800, now);
      osc.frequency.exponentialRampToValueAtTime(2600, now + 0.15);
      osc.frequency.exponentialRampToValueAtTime(1900, now + 0.35);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.45);
    } catch (e) {}
  }

  /**
   * Invariant Decoupled & Cycle Remediated Chime
   */
  playSuccessChime() {
    if (!this.audioCtx || !this.audioEnabled) return;
    try {
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const now = this.audioCtx.currentTime + (idx * 0.12);
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(now);
        osc.stop(now + 0.85);
      });
    } catch (e) {}
  }
}
