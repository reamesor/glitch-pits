import { create } from "zustand";

const DEFAULT_BALANCE = 5000;
const FORGE_COST = 1000;

export interface GameState {
  mockBalance: number;
  playerId: string | null;
  playerName: string;
  isForged: boolean;
  characterCount: number;
  glitchLog: Array<{ id: string; type: string; message: string }>;
  treasuryBalance: number;
  victoryData: { name: string; amount: number } | null;
  lastBetResult: { won: boolean; payout: number } | null;
}

interface GameActions {
  setBalance: (balance: number) => void;
  addToBalance: (amount: number) => void;
  forgeCharacter: () => boolean;
  setPlayerId: (id: string) => void;
  setPlayerName: (name: string) => void;
  setCharacterCount: (count: number) => void;
  setVictoryData: (data: { name: string; amount: number } | null) => void;
  setLastBetResult: (data: { won: boolean; payout: number } | null) => void;
  addGlitchLog: (entry: { type: string; message: string }) => void;
  setTreasuryBalance: (amount: number) => void;
  reset: () => void;
}

const initialState: GameState = {
  mockBalance: DEFAULT_BALANCE,
  playerId: null,
  playerName: "",
  isForged: false,
  characterCount: 0,
  glitchLog: [],
  treasuryBalance: 0,
  victoryData: null,
  lastBetResult: null,
};

export const useGameStore = create<GameState & GameActions>((set) => ({
  ...initialState,

  setBalance: (balance) => set({ mockBalance: balance }),

  addToBalance: (amount) =>
    set((state) => ({ mockBalance: state.mockBalance + amount })),

  forgeCharacter: () => {
    let success = false;
    set((state) => {
      if (state.mockBalance < FORGE_COST || state.isForged) return state;
      success = true;
      return {
        mockBalance: state.mockBalance - FORGE_COST,
        isForged: true,
      };
    });
    return success;
  },

  setPlayerId: (id) => set({ playerId: id }),

  setPlayerName: (name) => set({ playerName: name }),

  setCharacterCount: (count) => set({ characterCount: count }),
  setVictoryData: (data) => set({ victoryData: data }),
  setLastBetResult: (data) => set({ lastBetResult: data }),

  addGlitchLog: (entry) =>
    set((state) => ({
      glitchLog: [
        ...state.glitchLog.slice(-49),
        { ...entry, id: `log-${Date.now()}-${Math.random().toString(36).slice(2)}` },
      ],
    })),

  setTreasuryBalance: (amount) =>
    set((state) => ({ treasuryBalance: state.treasuryBalance + amount })),

  reset: () => set(initialState),
}));
