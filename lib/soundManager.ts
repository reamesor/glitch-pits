/**
 * Global sound effects manager — Web Audio API only, all sounds generated programmatically.
 * Singleton: soundManager.play('SOUND_NAME'), soundManager.setSFXMuted(true/false).
 */

export type SoundName =
  | "ORB_POP"
  | "ORB_MISS"
  | "PITS_CHIME"
  | "BET_PLACED"
  | "WIN"
  | "LOSE"
  | "MULTIPLIER_REVEAL"
  | "REEL_SPIN"
  | "REEL_STOP"
  | "SPIN_WIN_BIG"
  | "SPIN_WIN_SMALL"
  | "SNAKE_EAT"
  | "SNAKE_DEATH";

let audioContext: AudioContext | null = null;
let masterGain: GainNode | null = null;
let isSFXMuted = false;

const MASTER_VOLUME = 0.4;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    if (!masterGain && audioContext) {
      masterGain = audioContext.createGain();
      masterGain.gain.value = MASTER_VOLUME;
      masterGain.connect(audioContext.destination);
    }
    return audioContext;
  } catch {
    return null;
  }
}

function out(): GainNode | null {
  const ctx = getContext();
  return ctx && masterGain ? masterGain : null;
}

// --- ORB_POP: short bubble pop with slight digital distortion ---
function playOrbPop() {
  const gain = out();
  const ctx = getContext();
  if (!ctx || !gain) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  const noise = ctx.createBufferSource();
  const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.06, ctx.sampleRate);
  const data = noiseBuf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.15;
  noise.buffer = noiseBuf;
  const noiseGain = ctx.createGain();
  noiseGain.gain.value = 0.08;
  osc.type = "sine";
  osc.frequency.setValueAtTime(400, now);
  osc.frequency.exponentialRampToValueAtTime(120, now + 0.06);
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(0.2, now + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
  osc.connect(g);
  g.connect(gain);
  noise.connect(noiseGain);
  noiseGain.connect(gain);
  osc.start(now);
  osc.stop(now + 0.08);
  noise.start(now);
  noise.stop(now + 0.06);
}

// --- ORB_MISS: quick low static fizzle ---
function playOrbMiss() {
  const gain = out();
  const ctx = getContext();
  if (!ctx || !gain) return;
  const now = ctx.currentTime;
  const noise = ctx.createBufferSource();
  const len = Math.floor(ctx.sampleRate * 0.08);
  const noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = noiseBuf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * 0.25;
  noise.buffer = noiseBuf;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 400;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(0.12, now + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
  noise.connect(filter);
  filter.connect(g);
  g.connect(gain);
  noise.start(now);
  noise.stop(now + 0.08);
}

// --- PITS_CHIME: tiny bright high-pitched coin chime ---
function playPitsChime() {
  const gain = out();
  const ctx = getContext();
  if (!ctx || !gain) return;
  const now = ctx.currentTime;
  const freqs = [1760, 2349.32];
  freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    const t0 = now + i * 0.04;
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(0.12, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.12);
    osc.connect(g);
    g.connect(gain);
    osc.start(t0);
    osc.stop(t0 + 0.12);
  });
}

// --- BET_PLACED: retro arcade blip, coin insert ---
function playBetPlaced() {
  const gain = out();
  const ctx = getContext();
  if (!ctx || !gain) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = "square";
  osc.frequency.setValueAtTime(220, now);
  osc.frequency.exponentialRampToValueAtTime(440, now + 0.06);
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(0.18, now + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
  osc.connect(g);
  g.connect(gain);
  osc.start(now);
  osc.stop(now + 0.08);
}

// --- WIN: short ascending 8-bit chiptune fanfare, 3-4 notes ---
function playWin() {
  const gain = out();
  const ctx = getContext();
  if (!ctx || !gain) return;
  const now = ctx.currentTime;
  const freqs = [329.63, 392, 523.25, 659.25];
  const noteLen = 0.14;
  const gap = 0.04;
  freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "square";
    osc.frequency.value = freq;
    const t0 = now + i * (noteLen + gap);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(0.2, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + noteLen);
    osc.connect(g);
    g.connect(gain);
    osc.start(t0);
    osc.stop(t0 + noteLen);
  });
}

// --- LOSE: descending "wah wah" + glitchy static burst at end ---
function playLose() {
  const gain = out();
  const ctx = getContext();
  if (!ctx || !gain) return;
  const now = ctx.currentTime;
  const freqs = [349.23, 261.63, 196];
  const noteLen = 0.13;
  const gap = 0.05;
  freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "square";
    osc.frequency.value = freq;
    const t0 = now + i * (noteLen + gap);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(0.18, t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + noteLen);
    osc.connect(g);
    g.connect(gain);
    osc.start(t0);
    osc.stop(t0 + noteLen);
  });
  const burstStart = now + 0.55;
  const noise = ctx.createBufferSource();
  const len = Math.floor(ctx.sampleRate * 0.06);
  const noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = noiseBuf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * 0.2;
  noise.buffer = noiseBuf;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0, burstStart);
  noiseGain.gain.linearRampToValueAtTime(0.15, burstStart + 0.01);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, burstStart + 0.06);
  noise.connect(noiseGain);
  noiseGain.connect(gain);
  noise.start(burstStart);
  noise.stop(burstStart + 0.06);
}

// --- MULTIPLIER_REVEAL: drum roll (0.5s) then cymbal crash ---
function playMultiplierReveal() {
  const gain = out();
  const ctx = getContext();
  if (!ctx || !gain) return;
  const now = ctx.currentTime;
  const rollSteps = 10;
  const stepLen = 0.05;
  for (let i = 0; i < rollSteps; i++) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 80 + i * 8;
    const t0 = now + i * stepLen;
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(0.12, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + stepLen);
    osc.connect(g);
    g.connect(gain);
    osc.start(t0);
    osc.stop(t0 + stepLen);
  }
  const crashTime = now + 0.5;
  const noise = ctx.createBufferSource();
  const len = Math.floor(ctx.sampleRate * 0.25);
  const noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = noiseBuf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  noise.buffer = noiseBuf;
  const filter = ctx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 800;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0, crashTime);
  noiseGain.gain.linearRampToValueAtTime(0.2, crashTime + 0.02);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, crashTime + 0.25);
  noise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(gain);
  noise.start(crashTime);
  noise.stop(crashTime + 0.25);
}

// --- REEL_SPIN: mechanical whirring (for Daily Spin, use when reels animate) ---
function playReelSpin() {
  const gain = out();
  const ctx = getContext();
  if (!ctx || !gain) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(80, now);
  osc.frequency.linearRampToValueAtTime(120, now + 0.3);
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(0.06, now + 0.02);
  g.gain.linearRampToValueAtTime(0.04, now + 0.25);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
  osc.connect(g);
  g.connect(gain);
  osc.start(now);
  osc.stop(now + 0.35);
}

// --- REEL_STOP: short distinct clunk ---
function playReelStop() {
  const gain = out();
  const ctx = getContext();
  if (!ctx || !gain) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(150, now);
  osc.frequency.exponentialRampToValueAtTime(60, now + 0.06);
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(0.15, now + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
  osc.connect(g);
  g.connect(gain);
  osc.start(now);
  osc.stop(now + 0.08);
}

// --- SPIN_WIN_BIG: rising chiptune fanfare (3 matching) ---
function playSpinWinBig() {
  const gain = out();
  const ctx = getContext();
  if (!ctx || !gain) return;
  const now = ctx.currentTime;
  const freqs = [523.25, 659.25, 783.99, 1046.5];
  const noteLen = 0.15;
  const gap = 0.03;
  freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "square";
    osc.frequency.value = freq;
    const t0 = now + i * (noteLen + gap);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(0.18, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + noteLen);
    osc.connect(g);
    g.connect(gain);
    osc.start(t0);
    osc.stop(t0 + noteLen);
  });
}

// --- SPIN_WIN_SMALL: single soft chime ---
function playSpinWinSmall() {
  const gain = out();
  const ctx = getContext();
  if (!ctx || !gain) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = 1318.5;
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(0.1, now + 0.02);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
  osc.connect(g);
  g.connect(gain);
  osc.start(now);
  osc.stop(now + 0.2);
}

// --- SNAKE_EAT: short 8-bit munch/beep ---
function playSnakeEat() {
  const gain = out();
  const ctx = getContext();
  if (!ctx || !gain) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = "square";
  osc.frequency.setValueAtTime(600, now);
  osc.frequency.exponentialRampToValueAtTime(900, now + 0.05);
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(0.15, now + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
  osc.connect(g);
  g.connect(gain);
  osc.start(now);
  osc.stop(now + 0.07);
}

// --- SNAKE_DEATH: retro descending death notes ---
function playSnakeDeath() {
  const gain = out();
  const ctx = getContext();
  if (!ctx || !gain) return;
  const now = ctx.currentTime;
  const freqs = [392, 293.66, 196, 146.83];
  const noteLen = 0.12;
  const gap = 0.05;
  freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "square";
    osc.frequency.value = freq;
    const t0 = now + i * (noteLen + gap);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(0.16, t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + noteLen);
    osc.connect(g);
    g.connect(gain);
    osc.start(t0);
    osc.stop(t0 + noteLen);
  });
}

const players: Record<SoundName, () => void> = {
  ORB_POP: playOrbPop,
  ORB_MISS: playOrbMiss,
  PITS_CHIME: playPitsChime,
  BET_PLACED: playBetPlaced,
  WIN: playWin,
  LOSE: playLose,
  MULTIPLIER_REVEAL: playMultiplierReveal,
  REEL_SPIN: playReelSpin,
  REEL_STOP: playReelStop,
  SPIN_WIN_BIG: playSpinWinBig,
  SPIN_WIN_SMALL: playSpinWinSmall,
  SNAKE_EAT: playSnakeEat,
  SNAKE_DEATH: playSnakeDeath,
};

export const soundManager = {
  play(name: SoundName): void {
    if (isSFXMuted) return;
    try {
      const fn = players[name];
      if (fn) fn();
    } catch {
      // fail silently
    }
  },

  setSFXMuted(muted: boolean): void {
    isSFXMuted = muted;
  },

  getSFXMuted(): boolean {
    return isSFXMuted;
  },
};
