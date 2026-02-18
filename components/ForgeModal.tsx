"use client";

import { useState } from "react";
import { useGameStore } from "@/lib/useGameStore";
import { WindowedModal } from "./WindowedModal";

const FORGE_COST = 1000;

const CLOTHES_OPTIONS = [
  { id: "vest", label: "Vest", color: "#4a4a6a" },
  { id: "cape", label: "Cape", color: "#8b0000" },
  { id: "armor", label: "Armor", color: "#708090" },
];

const WEAPON_OPTIONS = [
  { id: "sword", label: "Sword" },
  { id: "axe", label: "Axe" },
  { id: "spear", label: "Spear" },
];

interface ForgeModalProps {
  onForge: (data: { name: string; clothes: string; weapon: string }) => void;
  connected?: boolean;
}

export function ForgeModal({ onForge, connected = false }: ForgeModalProps) {
  const [name, setName] = useState("");
  const [clothes, setClothes] = useState("vest");
  const [weapon, setWeapon] = useState("sword");
  const mockBalance = useGameStore((s) => s.mockBalance);

  const canForge = connected && mockBalance >= FORGE_COST && name.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canForge) return;
    onForge({
      name: name.trim() || `Player_${Math.random().toString(36).slice(2, 8)}`,
      clothes,
      weapon,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md">
        <WindowedModal title="THE FORGE" closable={false}>
          <p className="mb-4 text-center text-sm text-gray-400">
            Burn 1,000 Mock-PITS to enter the Pits.
          </p>
          {!connected && (
            <p className="mb-2 text-center text-xs text-amber-400">
              Connect to a server first (see game area)
            </p>
          )}
          <p
            className="mb-4 font-pixel text-center text-xs"
            style={{ color: "var(--glitch-teal)" }}
          >
            Balance: {mockBalance.toLocaleString()} Mock-PITS
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Enter your name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={16}
              className="w-full border-4 border-[#4a4a4a] bg-[#2a2a2a] px-4 py-3 font-pixel text-xs text-white placeholder-gray-500 focus:border-[var(--glitch-purple)] focus:outline-none"
              style={{ imageRendering: "pixelated" }}
            />

            <div>
              <label className="mb-2 block font-pixel text-[8px] text-gray-400">
                CLOTHES
              </label>
              <div className="flex gap-2">
                {CLOTHES_OPTIONS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setClothes(c.id)}
                    className={`flex-1 border-2 px-2 py-2 font-pixel text-[8px] ${
                      clothes === c.id
                        ? "border-[var(--glitch-pink)] bg-[var(--glitch-pink)]/20"
                        : "border-[#4a4a4a] bg-[#2a2a2a]"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block font-pixel text-[8px] text-gray-400">
                WEAPON
              </label>
              <div className="flex gap-2">
                {WEAPON_OPTIONS.map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => setWeapon(w.id)}
                    className={`flex-1 border-2 px-2 py-2 font-pixel text-[8px] ${
                      weapon === w.id
                        ? "border-[var(--glitch-teal)] bg-[var(--glitch-teal)]/20"
                        : "border-[#4a4a4a] bg-[#2a2a2a]"
                    }`}
                  >
                    {w.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={!canForge}
              className="pixel-btn pixel-btn-accent w-full"
            >
              FORGE ({FORGE_COST} PITS)
            </button>
          </form>
        </WindowedModal>
      </div>
    </div>
  );
}
