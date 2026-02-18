"use client";

import { useState } from "react";
import { useGameStore } from "@/lib/useGameStore";
import { WindowedModal } from "./WindowedModal";

const FORGE_COST = 1000;

interface ForgeModalProps {
  onForge: (playerName: string) => void;
}

export function ForgeModal({ onForge }: ForgeModalProps) {
  const [name, setName] = useState("");
  const mockBalance = useGameStore((s) => s.mockBalance);

  const canForge = mockBalance >= FORGE_COST && name.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canForge) return;
    onForge(name.trim() || `Player_${Math.random().toString(36).slice(2, 8)}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md">
        <WindowedModal title="THE FORGE" closable={false}>
          <p className="mb-4 text-center text-sm text-gray-400">
            Burn 1,000 Mock-PITS to enter the Pits.
          </p>
          <p
            className="mb-6 font-pixel text-center text-xs"
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
