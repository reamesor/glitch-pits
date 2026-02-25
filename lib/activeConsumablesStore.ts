"use client";

import { create } from "zustand";

const STORAGE_KEY = "glitch-pits-active-consumables";
const JACKPOT_KEY_DURATION_MS = 10 * 60 * 1000; // 10 minutes

export interface ActiveConsumablesState {
  glitchShield: boolean;
  doubleDownChip: boolean;
  speedHackRoundsLeft: number;
  phantomBet: boolean;
  glitchMultiplier: boolean;
  pitBribeBetsLeft: number;
  shadowCloakUsesLeft: number;
  jackpotKeyExpiry: number | null;
  bloodPact: boolean;
}

export interface ActiveConsumablesActions {
  setGlitchShield: (v: boolean) => void;
  setDoubleDownChip: (v: boolean) => void;
  setSpeedHackRoundsLeft: (n: number) => void;
  setPhantomBet: (v: boolean) => void;
  setGlitchMultiplier: (v: boolean) => void;
  setPitBribeBetsLeft: (n: number) => void;
  setShadowCloakUsesLeft: (n: number) => void;
  setJackpotKeyExpiry: (n: number | null) => void;
  setBloodPact: (v: boolean) => void;
  consumeGlitchShield: () => void;
  consumeDoubleDownChip: () => void;
  consumeSpeedHackRound: () => void;
  consumePhantomBet: () => void;
  consumeGlitchMultiplier: () => void;
  consumePitBribeBet: () => void;
  consumeShadowCloakUse: () => void;
  consumeJackpotKey: () => void;
  consumeBloodPact: () => void;
  purchaseConsumable: (id: string) => void;
}

const defaultState: ActiveConsumablesState = {
  glitchShield: false,
  doubleDownChip: false,
  speedHackRoundsLeft: 0,
  phantomBet: false,
  glitchMultiplier: false,
  pitBribeBetsLeft: 0,
  shadowCloakUsesLeft: 0,
  jackpotKeyExpiry: null,
  bloodPact: false,
};

function loadFromStorage(): ActiveConsumablesState {
  if (typeof window === "undefined") return defaultState;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      glitchShield: !!parsed.glitchShield,
      doubleDownChip: !!parsed.doubleDownChip,
      speedHackRoundsLeft: Math.max(0, Number(parsed.speedHackRoundsLeft) ?? 0),
      phantomBet: !!parsed.phantomBet,
      glitchMultiplier: !!parsed.glitchMultiplier,
      pitBribeBetsLeft: Math.max(0, Number(parsed.pitBribeBetsLeft) ?? 0),
      shadowCloakUsesLeft: Math.max(0, Number(parsed.shadowCloakUsesLeft) ?? 0),
      jackpotKeyExpiry: typeof parsed.jackpotKeyExpiry === "number" && parsed.jackpotKeyExpiry > Date.now() ? parsed.jackpotKeyExpiry : null,
      bloodPact: !!parsed.bloodPact,
    };
  } catch {
    return defaultState;
  }
}

function saveToStorage(state: ActiveConsumablesState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

function persist(get: () => ActiveConsumablesState & ActiveConsumablesActions) {
  saveToStorage({
    glitchShield: get().glitchShield,
    doubleDownChip: get().doubleDownChip,
    speedHackRoundsLeft: get().speedHackRoundsLeft,
    phantomBet: get().phantomBet,
    glitchMultiplier: get().glitchMultiplier,
    pitBribeBetsLeft: get().pitBribeBetsLeft,
    shadowCloakUsesLeft: get().shadowCloakUsesLeft,
    jackpotKeyExpiry: get().jackpotKeyExpiry,
    bloodPact: get().bloodPact,
  });
}

export const useActiveConsumablesStore = create<ActiveConsumablesState & ActiveConsumablesActions>((set, get) => ({
  ...loadFromStorage(),

  setGlitchShield: (v) => { set({ glitchShield: v }); persist(get); },
  setDoubleDownChip: (v) => { set({ doubleDownChip: v }); persist(get); },
  setSpeedHackRoundsLeft: (n) => { set({ speedHackRoundsLeft: n }); persist(get); },
  setPhantomBet: (v) => { set({ phantomBet: v }); persist(get); },
  setGlitchMultiplier: (v) => { set({ glitchMultiplier: v }); persist(get); },
  setPitBribeBetsLeft: (n) => { set({ pitBribeBetsLeft: n }); persist(get); },
  setShadowCloakUsesLeft: (n) => { set({ shadowCloakUsesLeft: n }); persist(get); },
  setJackpotKeyExpiry: (n) => { set({ jackpotKeyExpiry: n }); persist(get); },
  setBloodPact: (v) => { set({ bloodPact: v }); persist(get); },

  consumeGlitchShield: () => { set({ glitchShield: false }); persist(get); },
  consumeDoubleDownChip: () => { set({ doubleDownChip: false }); persist(get); },
  consumeSpeedHackRound: () => { set((s) => ({ speedHackRoundsLeft: Math.max(0, s.speedHackRoundsLeft - 1) })); persist(get); },
  consumePhantomBet: () => { set({ phantomBet: false }); persist(get); },
  consumeGlitchMultiplier: () => { set({ glitchMultiplier: false }); persist(get); },
  consumePitBribeBet: () => { set((s) => ({ pitBribeBetsLeft: Math.max(0, s.pitBribeBetsLeft - 1) })); persist(get); },
  consumeShadowCloakUse: () => { set((s) => ({ shadowCloakUsesLeft: Math.max(0, s.shadowCloakUsesLeft - 1) })); persist(get); },
  consumeJackpotKey: () => { set({ jackpotKeyExpiry: null }); persist(get); },
  consumeBloodPact: () => { set({ bloodPact: false }); persist(get); },

  purchaseConsumable: () => {},
}));

export function getActiveConsumablesState(): ActiveConsumablesState {
  return useActiveConsumablesStore.getState();
}

export { JACKPOT_KEY_DURATION_MS };
