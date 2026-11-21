// Web Audio API Synthesizer for Incoming Order Alert Sound
// Plays a recurring crisp, loud store bell chime continuously until stopped

class OrderAlertSoundManager {
  constructor() {
    this.audioCtx = null;
    this.intervalId = null;
    this.isPlaying = false;
    this.initAutoplayUnlock();
  }

  // Listen for the first user interaction anywhere on the page to unlock AudioContext
  initAutoplayUnlock() {
    if (typeof window === "undefined") return;

    const unlock = () => {
      try {
        const ctx = this.getAudioContext();
        if (ctx && ctx.state === "suspended") {
          ctx.resume().catch(() => {});
        }
      } catch (e) {
        // Ignored
      }
    };

    window.addEventListener("click", unlock, { once: true, passive: true });
    window.addEventListener("pointerdown", unlock, { once: true, passive: true });
    window.addEventListener("keydown", unlock, { once: true, passive: true });
  }

  getAudioContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  playChimeTone() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Two-chime vibrant counter bell:
      // Note 1: 880 Hz (A5) with bell overtone
      // Note 2: 1174.66 Hz (D6) with bell overtone (higher pitch second chime)
      const chimes = [
        { freq: 880.0, harmonic: 1760.0, time: now, duration: 0.38, vol: 0.85 },
        { freq: 1174.66, harmonic: 2349.32, time: now + 0.16, duration: 0.55, vol: 0.85 },
      ];

      chimes.forEach(({ freq, harmonic, time, duration, vol }) => {
        // Fundamental tone
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, time);

        gain.gain.setValueAtTime(0.001, time);
        gain.gain.linearRampToValueAtTime(vol, time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(time);
        osc.stop(time + duration + 0.05);

        // Bell overtone for crisp acoustic presence
        const oscHarmonic = ctx.createOscillator();
        const gainHarmonic = ctx.createGain();
        oscHarmonic.type = "triangle";
        oscHarmonic.frequency.setValueAtTime(harmonic, time);

        gainHarmonic.gain.setValueAtTime(0.001, time);
        gainHarmonic.gain.linearRampToValueAtTime(vol * 0.35, time + 0.015);
        gainHarmonic.gain.exponentialRampToValueAtTime(0.0001, time + duration * 0.7);

        oscHarmonic.connect(gainHarmonic);
        gainHarmonic.connect(ctx.destination);

        oscHarmonic.start(time);
        oscHarmonic.stop(time + duration * 0.7 + 0.05);
      });
    } catch (err) {
      console.warn("Could not play synthesized order alert chime:", err);
    }
  }

  start() {
    if (this.isPlaying) return;
    this.isPlaying = true;

    // Play initial chime immediately
    this.playChimeTone();

    // Repeat chime continuously every 1.8 seconds until explicitly stopped
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this.intervalId = setInterval(() => {
      if (this.isPlaying) {
        this.playChimeTone();
      }
    }, 1800);
  }

  stop() {
    this.isPlaying = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

export const orderAlertSound = new OrderAlertSoundManager();
export default orderAlertSound;
