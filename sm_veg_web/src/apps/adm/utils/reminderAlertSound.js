/**
 * Reminder Alert Audio Utility for SM VegMart
 * Uses Web Audio API to synthesize a melodic reminder chime (G5 -> C6 harmonic bell).
 * Runs reliably without requiring external audio assets.
 */

let audioCtx = null;
let reminderIntervalId = null;
let isAudioUnlocked = false;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  return audioCtx;
}

function unlockAudioContext() {
  if (isAudioUnlocked) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === "suspended") {
    ctx.resume().then(() => {
      isAudioUnlocked = true;
    }).catch(() => {});
  } else if (ctx.state === "running") {
    isAudioUnlocked = true;
  }
}

// Auto-unlock on window user interaction
if (typeof window !== "undefined") {
  const events = ["click", "keydown", "touchstart", "pointerdown"];
  const onUserGesture = () => {
    unlockAudioContext();
    events.forEach((ev) => window.removeEventListener(ev, onUserGesture));
  };
  events.forEach((ev) => window.addEventListener(ev, onUserGesture, { passive: true }));
}

function synthesizeReminderBell() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.75, now);
    masterGain.connect(ctx.destination);

    // Note 1: G5 (783.99 Hz) at t = 0
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(783.99, now);

    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.exponentialRampToValueAtTime(0.65, now + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc1.connect(gain1);
    gain1.connect(masterGain);
    osc1.start(now);
    osc1.stop(now + 0.5);

    // Note 2: C6 (1046.50 Hz) at t = 0.12s (Warm ascending chime)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1046.50, now + 0.12);

    gain2.gain.setValueAtTime(0.001, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.85, now + 0.14);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

    osc2.connect(gain2);
    gain2.connect(masterGain);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.9);
  } catch (err) {
    console.warn("⚠️ [reminderAlertSound] Web Audio playback error:", err);
  }
}

export const reminderAlertSound = {
  playOnce: () => {
    synthesizeReminderBell();
  },

  startLoop: (intervalMs = 2200) => {
    reminderAlertSound.stop();
    synthesizeReminderBell();
    reminderIntervalId = setInterval(() => {
      synthesizeReminderBell();
    }, intervalMs);
  },

  stop: () => {
    if (reminderIntervalId) {
      clearInterval(reminderIntervalId);
      reminderIntervalId = null;
    }
  },
};

export default reminderAlertSound;
