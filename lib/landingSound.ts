/**
 * Fun retro arcade loop for the landing page. Cheerful, welcoming chiptune vibe.
 */

let audioContext: AudioContext | null = null;
let landingGainNode: GainNode | null = null;
let landingIntervalId: ReturnType<typeof setInterval> | null = null;
let landingNextTime = 0;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioContext) audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  return audioContext;
}

// Friendly C major arpeggio — upbeat arcade feel
const LANDING_FREQS = [261.63, 329.63, 392, 523.25]; // C4, E4, G4, C5
const LANDING_NOTE_LEN = 0.22;
const LANDING_BAR_MS = 1200;

function scheduleLandingBar() {
  const ctx = getContext();
  if (!ctx || !landingGainNode) return;
  const now = ctx.currentTime;
  if (landingNextTime < now) landingNextTime = now;
  LANDING_FREQS.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "square";
    osc.frequency.value = freq;
    const t0 = landingNextTime + i * (LANDING_NOTE_LEN + 0.06);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(0.06, t0 + 0.02);
    g.gain.linearRampToValueAtTime(0.03, t0 + LANDING_NOTE_LEN * 0.6);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + LANDING_NOTE_LEN);
    osc.connect(g);
    g.connect(landingGainNode);
    osc.start(t0);
    osc.stop(t0 + LANDING_NOTE_LEN);
  });
  landingNextTime += (LANDING_NOTE_LEN + 0.06) * LANDING_FREQS.length;
}

export function startLandingSound(): void {
  const ctx = getContext();
  if (!ctx) return;
  stopLandingSound();
  landingGainNode = ctx.createGain();
  landingGainNode.gain.value = 0.22;
  landingGainNode.connect(ctx.destination);
  landingNextTime = ctx.currentTime;
  scheduleLandingBar();
  landingIntervalId = setInterval(scheduleLandingBar, LANDING_BAR_MS);
}

export function stopLandingSound(): void {
  if (landingIntervalId !== null) {
    clearInterval(landingIntervalId);
    landingIntervalId = null;
  }
  if (landingGainNode && audioContext) {
    const now = audioContext.currentTime;
    landingGainNode.gain.setValueAtTime(landingGainNode.gain.value, now);
    landingGainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    landingGainNode = null;
  }
}
