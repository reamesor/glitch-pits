import { create } from "zustand";

const STARTING_TOKENS = 1000; // Imaginary tokens when joiner enters a character
const DASHBOARD_STORAGE_PREFIX = "glitch-pits-dashboard-";
export const WALLET_STORAGE_KEY = "glitch-pits-wallet";
export const CHARACTER_STORAGE_KEY = "glitch-pits-character";

export interface DashboardStats {
  totalWagered: number;
  totalWon: number;
  totalLost: number;
  upgradeCount: number;
}

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
  walletAddress: string | null;
  dashboardStats: DashboardStats;
  totalBurnedAllPits: number;
  selectedCharacterId: string;
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
  setWalletAddress: (address: string | null) => void;
  setTotalBurnedAllPits: (amount: number) => void;
  recordBetResult: (wagered: number, won: boolean, payout: number) => void;
  recordUpgrade: () => void;
  setSelectedCharacterId: (id: string) => void;
  reset: () => void;
}

const defaultDashboard: DashboardStats = {
  totalWagered: 0,
  totalWon: 0,
  totalLost: 0,
  upgradeCount: 0,
};

function loadDashboardFromStorage(address: string): DashboardStats {
  if (typeof window === "undefined") return defaultDashboard;
  try {
    const raw = localStorage.getItem(DASHBOARD_STORAGE_PREFIX + address.toLowerCase());
    if (!raw) return defaultDashboard;
    const parsed = JSON.parse(raw) as DashboardStats;
    return {
      totalWagered: parsed.totalWagered ?? 0,
      totalWon: parsed.totalWon ?? 0,
      totalLost: parsed.totalLost ?? 0,
      upgradeCount: parsed.upgradeCount ?? 0,
    };
  } catch {
    return defaultDashboard;
  }
}

function saveDashboardToStorage(address: string, stats: DashboardStats) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      DASHBOARD_STORAGE_PREFIX + address.toLowerCase(),
      JSON.stringify(stats)
    );
  } catch {
    // ignore
  }
}

const initialState: GameState = {
  mockBalance: STARTING_TOKENS,
  playerId: null,
  playerName: "",
  isForged: false,
  characterCount: 0,
  glitchLog: [],
  treasuryBalance: 0,
  victoryData: null,
  lastBetResult: null,
  walletAddress: null,
  dashboardStats: defaultDashboard,
  totalBurnedAllPits: 0,
  selectedCharacterId: "0",
};

function loadSelectedCharacterId(): string {
  if (typeof window === "undefined") return "0";
  try {
    const raw = localStorage.getItem(CHARACTER_STORAGE_KEY);
    if (raw && /^[0-9]+$/.test(raw)) return raw;
  } catch {
    // ignore
  }
  return "0";
}

function loadWalletFromStorage(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(WALLET_STORAGE_KEY);
    if (raw?.trim()) return raw.trim();
  } catch {
    // ignore
  }
  return null;
}

export const useGameStore = create<GameState & GameActions>((set) => ({
  ...initialState,
  selectedCharacterId: typeof window !== "undefined" ? loadSelectedCharacterId() : "0",
  walletAddress: typeof window !== "undefined" ? loadWalletFromStorage() : null,

  setBalance: (balance) => set({ mockBalance: balance }),

  addToBalance: (amount) =>
    set((state) => ({ mockBalance: state.mockBalance + amount })),

  forgeCharacter: () => {
    let success = false;
    set((state) => {
      if (state.isForged) return state;
      success = true;
      return { isForged: true };
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

  setTotalBurnedAllPits: (amount) => set({ totalBurnedAllPits: amount }),

  setWalletAddress: (address) =>
    set((state) => {
      const next = { ...state, walletAddress: address || null };
      if (address) {
        next.dashboardStats = loadDashboardFromStorage(address);
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(WALLET_STORAGE_KEY, address);
          } catch {
            // ignore
          }
        }
      } else {
        next.dashboardStats = defaultDashboard;
        if (typeof window !== "undefined") {
          try {
            localStorage.removeItem(WALLET_STORAGE_KEY);
          } catch {
            // ignore
          }
        }
      }
      return next;
    }),

  recordBetResult: (wagered, won, payout) =>
    set((state) => {
      const stats = {
        ...state.dashboardStats,
        totalWagered: state.dashboardStats.totalWagered + wagered,
        totalWon: state.dashboardStats.totalWon + (won ? payout : 0),
        totalLost: state.dashboardStats.totalLost + (won ? 0 : wagered),
      };
      if (state.walletAddress) {
        saveDashboardToStorage(state.walletAddress, stats);
      }
      return { dashboardStats: stats };
    }),

  recordUpgrade: () =>
    set((state) => {
      const stats = {
        ...state.dashboardStats,
        upgradeCount: state.dashboardStats.upgradeCount + 1,
      };
      if (state.walletAddress) {
        saveDashboardToStorage(state.walletAddress, stats);
      }
      return { dashboardStats: stats };
    }),

  setSelectedCharacterId: (id) => {
    set({ selectedCharacterId: id });
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(CHARACTER_STORAGE_KEY, id);
      } catch {
        // ignore
      }
    }
  },

  reset: () => set(initialState),
}));
