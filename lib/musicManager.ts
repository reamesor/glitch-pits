/**
 * Procedural lo-fi dark synthwave background music — Web Audio API only.
 * Singleton: start(), stop(), setVolume(0-1), duckForWin(), duckForLoss().
 * Music OFF by default; no autoplay.
 */

const BPM = 80;
const BEAT_DUR = 60 / BPM;
const BAR_DUR = BEAT_DUR * 4;
const LOOP_BARS = 8;
const LOOP_DUR = BAR_DUR * LOOP_BARS;

let audioContext: AudioContext | null = null;
let musicGain: GainNode | null = null;
let bassGain: GainNode | null = null;
let arpGain: GainNode | null = null;
let kickGain: GainNode | null = null;
let hatGain: GainNode | null = null;
let scheduledFrom = 0;
let rafId: number | null = null;
let userVolume = 0.25;
let isRunning = false;

// A minor dark
const BASS_ROOT = 55; // A1
const ARP_FREQS = [220, 261.63, 246.94, 293.66]; // A3, C4, B3, D4 — Am feel

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return audioContext;
  } catch {
    return null;
  }
}

function ensureNodes() {
  const ctx = getContext();
  if (!ctx || musicGain) return ctx;
  musicGain = ctx.createGain();
  musicGain.gain.value = 0;
  musicGain.connect(ctx.destination);

  bassGain = ctx.createGain();
  bassGain.gain.value = 0.35;
  bassGain.connect(musicGain);

  arpGain = ctx.createGain();
  arpGain.gain.value = 0.12;
  arpGain.connect(musicGain);

  kickGain = ctx.createGain();
  kickGain.gain.value = 0.2;
  kickGain.connect(musicGain);

  hatGain = ctx.createGain();
  hatGain.gain.value = 0.06;
  hatGain.connect(musicGain);

  return ctx;
}

function scheduleBass(ctx: AudioContext, from: number, to: number) {
  if (!bassGain) return;
  const steps = Math.ceil((to - from) / (BEAT_DUR * 2)) + 2;
  for (let i = 0; i < steps; i++) {
    const t = from + i * BEAT_DUR * 2;
    if (t >= to) break;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    const drift = 1 + (Math.sin(t * 0.3) * 0.02);
    osc.frequency.value = BASS_ROOT * drift;
    const len = BEAT_DUR * 1.8;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.7, t + 0.02);
    g.gain.linearRampToValueAtTime(0.4, t + len * 0.3);
    g.gain.exponentialRampToValueAtTime(0.001, t + len);
    osc.connect(g);
    g.connect(bassGain!);
    osc.start(t);
    osc.stop(t + len);
  }
}

function scheduleArp(ctx: AudioContext, from: number, to: number) {
  if (!arpGain) return;
  const step = BEAT_DUR * 2;
  let idx = 0;
  for (let t = from; t < to; t += step) {
    const freq = ARP_FREQS[idx % ARP_FREQS.length];
    idx++;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = freq;
    const len = step * 0.9;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.5, t + 0.03);
    g.gain.linearRampToValueAtTime(0.2, t + len * 0.5);
    g.gain.exponentialRampToValueAtTime(0.001, t + len);
    osc.connect(g);
    g.connect(arpGain);
    osc.start(t);
    osc.stop(t + len);
  }
}

function scheduleKick(ctx: AudioContext, from: number, to: number) {
  if (!kickGain) return;
  for (let t = from; t < to; t += BEAT_DUR) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(90, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.15);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.6, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.connect(g);
    g.connect(kickGain);
    osc.start(t);
    osc.stop(t + 0.2);
  }
}

function scheduleHat(ctx: AudioContext, from: number, to: number) {
  if (!hatGain) return;
  const half = BEAT_DUR / 2;
  for (let t = from; t < to; t += half) {
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.06), ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 6000;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.4, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    src.connect(filter);
    filter.connect(g);
    g.connect(hatGain);
    src.start(t);
    src.stop(t + 0.06);
  }
}

function scheduleLoop(from: number, to: number) {
  const ctx = getContext();
  if (!ctx || !musicGain) return;
  scheduleBass(ctx, from, to);
  scheduleArp(ctx, from, to);
  scheduleKick(ctx, from, to);
  scheduleHat(ctx, from, to);
}

function loop() {
  if (!isRunning || !audioContext) return;
  const now = audioContext.currentTime;
  if (scheduledFrom < now + 0.5) {
    const start = scheduledFrom;
    scheduleLoop(start, start + LOOP_DUR + 0.5);
    scheduledFrom = start + LOOP_DUR;
  }
  rafId = requestAnimationFrame(loop);
}

export const musicManager = {
  start(): void {
    try {
      const ctx = ensureNodes();
      if (!ctx || !musicGain) return;
      isRunning = true;
      scheduledFrom = ctx.currentTime;
      loop();
      const now = ctx.currentTime;
      musicGain.gain.cancelScheduledValues(now);
      musicGain.gain.setValueAtTime(musicGain.gain.value, now);
      musicGain.gain.linearRampToValueAtTime(userVolume, now + 1.5);
    } catch {
      // fail silently
    }
  },

  stop(): void {
    try {
      isRunning = false;
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      if (musicGain && audioContext) {
        const now = audioContext.currentTime;
        musicGain.gain.cancelScheduledValues(now);
        musicGain.gain.setValueAtTime(musicGain.gain.value, now);
        musicGain.gain.linearRampToValueAtTime(0, now + 1);
      }
    } catch {
      // fail silently
    }
  },

  setVolume(vol: number): void {
    userVolume = Math.max(0, Math.min(1, vol));
    if (!musicGain || !audioContext || !isRunning) return;
    const now = audioContext.currentTime;
    musicGain.gain.cancelScheduledValues(now);
    musicGain.gain.setValueAtTime(userVolume, now);
  },

  duckForWin(): void {
    try {
      if (!musicGain || !audioContext) return;
      const now = audioContext.currentTime;
      musicGain.gain.cancelScheduledValues(now);
      musicGain.gain.setValueAtTime(musicGain.gain.value, now);
      musicGain.gain.linearRampToValueAtTime(userVolume * 0.1, now + 0.2);
      musicGain.gain.linearRampToValueAtTime(userVolume, now + 2.2);
    } catch {
      // fail silently
    }
  },

  duckForLoss(): void {
    try {
      if (!audioContext || !bassGain) return;
      const now = audioContext.currentTime;
      const rumble = audioContext.createOscillator();
      const g = audioContext.createGain();
      rumble.type = "sine";
      rumble.frequency.setValueAtTime(45, now);
      rumble.frequency.linearRampToValueAtTime(35, now + 1);
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.25, now + 0.05);
      g.gain.linearRampToValueAtTime(0.1, now + 0.5);
      g.gain.exponentialRampToValueAtTime(0.001, now + 1);
      rumble.connect(g);
      g.connect(musicGain!);
      rumble.start(now);
      rumble.stop(now + 1);
    } catch {
      // fail silently
    }
  },
};
