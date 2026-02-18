/**
 * Pixel character presets: 6×8 grid, 0=transparent, 1–4=colors per preset.
 * Used for picker, profile picture, and in-pit display.
 */
export interface CharacterPreset {
  id: string;
  name: string;
  map: number[][];
  colors: Record<number, string>;
}

export const CHARACTER_PRESETS: CharacterPreset[] = [
  {
    id: "0",
    name: "Glitch",
    map: [
      [0, 0, 1, 1, 1, 0],
      [0, 1, 1, 1, 1, 1],
      [0, 2, 2, 3, 2, 2],
      [1, 2, 3, 3, 3, 2],
      [1, 1, 3, 3, 3, 1],
      [1, 1, 1, 3, 1, 1],
      [0, 1, 1, 1, 1, 0],
      [0, 0, 1, 1, 1, 0],
    ],
    colors: { 0: "transparent", 1: "var(--glitch-teal)", 2: "var(--glitch-pink)", 3: "#2a2a2a" },
  },
  {
    id: "1",
    name: "Knight",
    map: [
      [0, 0, 0, 3, 2, 0],
      [0, 0, 3, 3, 3, 3],
      [0, 3, 1, 3, 1, 3],
      [3, 3, 3, 3, 3, 3],
      [3, 1, 3, 3, 3, 1],
      [3, 3, 3, 3, 3, 3],
      [0, 3, 1, 1, 1, 3],
      [0, 0, 3, 3, 3, 0],
    ],
    colors: { 0: "transparent", 1: "#c44", 2: "#8b0000", 3: "#6b7280" },
  },
  {
    id: "2",
    name: "Rogue",
    map: [
      [0, 0, 0, 4, 0, 0],
      [0, 0, 4, 1, 4, 0],
      [0, 4, 1, 1, 1, 4],
      [4, 2, 3, 3, 3, 2],
      [4, 2, 3, 3, 3, 2],
      [0, 4, 2, 2, 2, 4],
      [0, 0, 4, 1, 4, 0],
      [0, 0, 0, 4, 4, 0],
    ],
    colors: { 0: "transparent", 1: "#fbbf24", 2: "#166534", 3: "#1c1917", 4: "#374151" },
  },
  {
    id: "3",
    name: "Mage",
    map: [
      [0, 0, 0, 2, 0, 0],
      [0, 0, 2, 2, 2, 0],
      [0, 2, 1, 2, 1, 2],
      [0, 3, 3, 3, 3, 3],
      [2, 3, 1, 3, 1, 3],
      [2, 3, 3, 3, 3, 2],
      [0, 2, 2, 2, 2, 0],
      [0, 0, 2, 2, 0, 0],
    ],
    colors: { 0: "transparent", 1: "#fef3c7", 2: "var(--glitch-pink)", 3: "#5b21b6" },
  },
  {
    id: "4",
    name: "Dwarf",
    map: [
      [0, 0, 1, 3, 1, 0],
      [0, 1, 1, 1, 1, 1],
      [0, 1, 2, 3, 2, 1],
      [1, 2, 3, 3, 3, 2],
      [1, 2, 3, 3, 3, 2],
      [1, 1, 2, 2, 2, 1],
      [0, 1, 1, 1, 1, 0],
      [0, 0, 2, 2, 2, 0],
    ],
    colors: { 0: "transparent", 1: "#b45309", 2: "#78350f", 3: "#1c1917" },
  },
  {
    id: "5",
    name: "Ghost",
    map: [
      [0, 0, 0, 1, 1, 0],
      [0, 0, 1, 1, 1, 1],
      [0, 1, 1, 1, 1, 1],
      [1, 1, 2, 1, 2, 1],
      [1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1],
      [0, 1, 1, 1, 1, 0],
    ],
    colors: { 0: "transparent", 1: "#f8fafc", 2: "#94a3b8" },
  },
  {
    id: "6",
    name: "Robot",
    map: [
      [0, 0, 2, 2, 2, 0],
      [0, 2, 1, 3, 1, 2],
      [0, 2, 3, 3, 3, 2],
      [2, 2, 1, 3, 1, 2],
      [2, 3, 3, 3, 3, 3],
      [2, 2, 3, 3, 3, 2],
      [0, 2, 1, 1, 1, 2],
      [0, 0, 2, 2, 2, 0],
    ],
    colors: { 0: "transparent", 1: "#22d3ee", 2: "#64748b", 3: "#1e293b" },
  },
  {
    id: "7",
    name: "Beast",
    map: [
      [0, 0, 0, 3, 3, 0],
      [0, 0, 3, 2, 3, 3],
      [0, 3, 2, 2, 2, 3],
      [3, 2, 2, 1, 2, 2],
      [3, 2, 2, 2, 2, 3],
      [3, 3, 2, 2, 3, 0],
      [0, 3, 3, 3, 0, 0],
      [0, 0, 3, 3, 0, 0],
    ],
    colors: { 0: "transparent", 1: "#f97316", 2: "#15803d", 3: "#14532d" },
  },
  {
    id: "8",
    name: "Void",
    map: [
      [0, 0, 1, 1, 1, 0],
      [0, 1, 2, 1, 2, 1],
      [0, 1, 1, 1, 1, 1],
      [1, 2, 3, 3, 3, 2],
      [1, 1, 3, 3, 3, 1],
      [1, 1, 3, 3, 3, 1],
      [0, 1, 1, 1, 1, 0],
      [0, 0, 1, 1, 1, 0],
    ],
    colors: { 0: "transparent", 1: "var(--glitch-teal)", 2: "var(--glitch-pink)", 3: "#0f172a" },
  },
  {
    id: "9",
    name: "Goblin",
    map: [
      [0, 0, 0, 2, 2, 0],
      [0, 0, 2, 2, 2, 2],
      [0, 2, 1, 2, 1, 2],
      [2, 1, 3, 3, 3, 1],
      [2, 2, 3, 3, 3, 2],
      [0, 2, 2, 2, 2, 0],
      [0, 2, 2, 2, 2, 0],
      [0, 0, 2, 2, 0, 0],
    ],
    colors: { 0: "transparent", 1: "#fef3c7", 2: "#15803d", 3: "#422006" },
  },
];

const PRESET_MAP = new Map(CHARACTER_PRESETS.map((p) => [p.id, p]));

export function getCharacterPreset(id: string): CharacterPreset {
  return PRESET_MAP.get(id) ?? CHARACTER_PRESETS[0];
}

export const DEFAULT_CHARACTER_ID = "0";
