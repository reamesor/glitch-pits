import { create } from "zustand";

const DEFAULT_BALANCE = 5000;
const FORGE_COST = 1000;

export interface GameState {
  mockBalance: number;
  playerId: string | null;
  playerName: string;
  isForged: boolean;
  playerCount: number;
  glitchLog: Array<{ id: string; type: string; message: string }>;
  treasuryBalance: number;
}

interface GameActions {
  setBalance: (balance: number) => void;
  addToBalance: (amount: number) => void;
  forgeCharacter: () => boolean;
  setPlayerId: (id: string) => void;
  setPlayerName: (name: string) => void;
  setPlayerCount: (count: number) => void;
  addGlitchLog: (entry: { type: string; message: string }) => void;
  setTreasuryBalance: (amount: number) => void;
  reset: () => void;
}

const initialState: GameState = {
  mockBalance: DEFAULT_BALANCE,
  playerId: null,
  playerName: "",
  isForged: false,
  playerCount: 0,
  glitchLog: [],
  treasuryBalance: 0,
};

export const useGameStore = create<GameState & GameActions>((set) => ({
  ...initialState,

  setBalance: (balance) => set({ mockBalance: balance }),

  addToBalance: (amount) =>
    set((state) => ({ mockBalance: state.mockBalance + amount })),

  forgeCharacter: () =>
    set((state) => {
      if (state.mockBalance < FORGE_COST || state.isForged) return state;
      return {
        mockBalance: state.mockBalance - FORGE_COST,
        isForged: true,
      };
    }),

  setPlayerId: (id) => set({ playerId: id }),

  setPlayerName: (name) => set({ playerName: name }),

  setPlayerCount: (count) => set({ playerCount: count }),

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
