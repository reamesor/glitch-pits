/**
 * Dopamine hit on every round — punchy, thrilling, keeps the action feeling alive.
 * Plays when the result is revealed (win or lose) so every round feels like an event.
 */

let audioContext: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioContext) audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  return audioContext;
}

export function playRoundSound(): void {
  const ctx = getContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const masterGain = ctx.createGain();
  masterGain.connect(ctx.destination);
  masterGain.gain.value = 0.4;

  // Punchy impact: short sweep up + bright hit (arcade "slot resolve" feel)
  const hitFreq = 180;
  const sweepOsc = ctx.createOscillator();
  const sweepGain = ctx.createGain();
  sweepOsc.type = "square";
  sweepOsc.frequency.setValueAtTime(hitFreq, now);
  sweepOsc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
  sweepGain.gain.setValueAtTime(0, now);
  sweepGain.gain.linearRampToValueAtTime(0.25, now + 0.01);
  sweepGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
  sweepOsc.connect(sweepGain);
  sweepGain.connect(masterGain);
  sweepOsc.start(now);
  sweepOsc.stop(now + 0.1);

  // Quick bright "ding" on top — dopamine chime
  const dingOsc = ctx.createOscillator();
  const dingGain = ctx.createGain();
  dingOsc.type = "sine";
  dingOsc.frequency.value = 1318.5; // E6
  dingGain.gain.setValueAtTime(0, now + 0.06);
  dingGain.gain.linearRampToValueAtTime(0.2, now + 0.07);
  dingGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
  dingOsc.connect(dingGain);
  dingGain.connect(masterGain);
  dingOsc.start(now + 0.06);
  dingOsc.stop(now + 0.2);
}
