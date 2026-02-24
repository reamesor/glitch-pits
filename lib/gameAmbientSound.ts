/**
 * Constant looping ambient sound for the game (pit) view — like COLORS background music.
 * Soft arcade pad so it doesn't fight with round/jackpot sounds.
 */

let audioContext: AudioContext | null = null;
let gameGainNode: GainNode | null = null;
let gameIntervalId: ReturnType<typeof setInterval> | null = null;
let gameNextTime = 0;
let gameMusicMuted = false;

const GAME_AMBIENT_STORAGE_KEY = "glitch-pits-game-music-muted";

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioContext) audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  return audioContext;
}

export function isGameMusicMuted(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(GAME_AMBIENT_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setGameMusicMuted(muted: boolean): void {
  gameMusicMuted = muted;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(GAME_AMBIENT_STORAGE_KEY, muted ? "1" : "0");
    } catch {}
  }
  if (muted) stopGameAmbientSound();
}

// Gentle 2-bar loop: soft chord tones (pit / tension vibe, stays in background)
const GAME_FREQS = [196, 246.94, 293.66, 329.63, 392]; // G3, B3, D4, E4, G4 — minor-ish
const GAME_NOTE_LEN = 0.28;
const GAME_GAP = 0.08;
const GAME_BAR_MS = 1600;

function scheduleGameBar() {
  const ctx = getContext();
  const gain = gameGainNode;
  if (!ctx || !gain || gameMusicMuted) return;
  const now = ctx.currentTime;
  if (gameNextTime < now) gameNextTime = now;
  GAME_FREQS.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "square";
    osc.frequency.value = freq;
    const t0 = gameNextTime + i * (GAME_NOTE_LEN + GAME_GAP);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(0.04, t0 + 0.03);
    g.gain.linearRampToValueAtTime(0.025, t0 + GAME_NOTE_LEN * 0.6);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + GAME_NOTE_LEN);
    osc.connect(g);
    g.connect(gain);
    osc.start(t0);
    osc.stop(t0 + GAME_NOTE_LEN);
  });
  gameNextTime += (GAME_NOTE_LEN + GAME_GAP) * GAME_FREQS.length;
}

export function startGameAmbientSound(): void {
  if (gameMusicMuted) return;
  const ctx = getContext();
  if (!ctx) return;
  stopGameAmbientSound();
  gameMusicMuted = isGameMusicMuted();
  if (gameMusicMuted) return;
  gameGainNode = ctx.createGain();
  gameGainNode.gain.value = 0.18;
  gameGainNode.connect(ctx.destination);
  gameNextTime = ctx.currentTime;
  scheduleGameBar();
  gameIntervalId = setInterval(scheduleGameBar, GAME_BAR_MS);
}

export function stopGameAmbientSound(): void {
  if (gameIntervalId !== null) {
    clearInterval(gameIntervalId);
    gameIntervalId = null;
  }
  if (gameGainNode && audioContext) {
    const now = audioContext.currentTime;
    gameGainNode.gain.setValueAtTime(gameGainNode.gain.value, now);
    gameGainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    gameGainNode = null;
  }
}
