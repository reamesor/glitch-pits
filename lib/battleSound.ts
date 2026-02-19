/**
 * Looping battle/suspense sound during the fight phase. Upbeat, tense, curious — retro arcade.
 */

let audioContext: AudioContext | null = null;
let battleGainNode: GainNode | null = null;
let battleIntervalId: ReturnType<typeof setInterval> | null = null;
let battleNextTime = 0;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioContext) audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  return audioContext;
}

// Tense, curious ascending pattern — 4 notes per bar, ~0.4s per note
const BATTLE_FREQS = [261.63, 293.66, 329.63, 349.23]; // C4, D4, E4, F4
const BATTLE_NOTE_LEN = 0.25;
const BATTLE_BAR_MS = 700;

function scheduleBattleBar() {
  const ctx = getContext();
  if (!ctx || !battleGainNode) return;
  const now = ctx.currentTime;
  if (battleNextTime < now) battleNextTime = now;
  BATTLE_FREQS.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "square";
    osc.frequency.value = freq;
    const t0 = battleNextTime + i * (BATTLE_NOTE_LEN + 0.04);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(0.08, t0 + 0.02);
    g.gain.linearRampToValueAtTime(0.04, t0 + BATTLE_NOTE_LEN * 0.6);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + BATTLE_NOTE_LEN);
    osc.connect(g);
    g.connect(battleGainNode);
    osc.start(t0);
    osc.stop(t0 + BATTLE_NOTE_LEN);
  });
  battleNextTime += (BATTLE_NOTE_LEN + 0.04) * BATTLE_FREQS.length;
}

export function startBattleSound(): void {
  const ctx = getContext();
  if (!ctx) return;
  stopBattleSound();
  battleGainNode = ctx.createGain();
  battleGainNode.gain.value = 0.28;
  battleGainNode.connect(ctx.destination);
  battleNextTime = ctx.currentTime;
  scheduleBattleBar();
  battleIntervalId = setInterval(scheduleBattleBar, BATTLE_BAR_MS);
}

export function stopBattleSound(): void {
  if (battleIntervalId !== null) {
    clearInterval(battleIntervalId);
    battleIntervalId = null;
  }
  if (battleGainNode && audioContext) {
    const now = audioContext.currentTime;
    battleGainNode.gain.setValueAtTime(battleGainNode.gain.value, now);
    battleGainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    battleGainNode = null;
  }
}
