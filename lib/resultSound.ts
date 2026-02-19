/**
 * Procedural win/lose result sounds (Web Audio). Retro / arcade vibe, matches site aesthetic.
 */

let audioContext: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioContext) audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  return audioContext;
}

export function playResultSound(won: boolean): void {
  const ctx = getContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const masterGain = ctx.createGain();
  masterGain.connect(ctx.destination);
  masterGain.gain.value = 0.35;

  if (won) {
    // Win: arcade victory arpeggio — ascending 4-note chime (square, chiptune feel)
    const freqs = [261.63, 329.63, 392, 523.25]; // C4, E4, G4, C5
    const noteLen = 0.18;
    const gap = 0.04;
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "square";
      osc.frequency.value = freq;
      const t0 = now + i * (noteLen + gap);
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(0.2, t0 + 0.02);
      g.gain.linearRampToValueAtTime(0.12, t0 + noteLen * 0.5);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + noteLen);
      osc.connect(g);
      g.connect(masterGain);
      osc.start(t0);
      osc.stop(t0 + noteLen);
    });
  } else {
    // Lose: retro "wrong" / miss — two descending error beeps (square, no low rumble)
    const freqs = [440, 320]; // A4 then E4
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "square";
      osc.frequency.value = freq;
      const t0 = now + i * 0.28;
      const len = 0.22;
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(0.15, t0 + 0.02);
      g.gain.linearRampToValueAtTime(0.08, t0 + len * 0.4);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + len);
      osc.connect(g);
      g.connect(masterGain);
      osc.start(t0);
      osc.stop(t0 + len);
    });
  }
}
