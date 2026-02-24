/**
 * Jackpot / BIG WIN fanfare — thrilling arcade celebration so everyone gets hyped.
 */

let audioContext: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioContext) audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  return audioContext;
}

export function playJackpotSound(): void {
  const ctx = getContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const masterGain = ctx.createGain();
  masterGain.connect(ctx.destination);
  masterGain.gain.value = 0.45;

  // Triumphant ascending fanfare (major, bright)
  const freqs = [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98]; // C5 → G6
  const noteLen = 0.14;
  const gap = 0.03;
  freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "square";
    osc.frequency.value = freq;
    const t0 = now + i * (noteLen + gap);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(0.28, t0 + 0.015);
    g.gain.linearRampToValueAtTime(0.12, t0 + noteLen * 0.5);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + noteLen);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(t0);
    osc.stop(t0 + noteLen);
  });

  // Sparkle: high shimmer at the peak
  const sparkleStart = now + (noteLen + gap) * (freqs.length - 1);
  for (let i = 0; i < 4; i++) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 2093 + i * 523; // C7, E7, G7, C8
    const t0 = sparkleStart + i * 0.06;
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(0.15, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.12);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(t0);
    osc.stop(t0 + 0.12);
  }
}
