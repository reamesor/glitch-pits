"use client";

import { useState } from "react";
import { useGameStore } from "@/lib/useGameStore";
import { PixelCharacter } from "@/components/PixelCharacter";
import { CharacterPicker } from "@/components/CharacterPicker";
import { getCharacterPreset } from "@/lib/characterPresets";

interface DashboardModalProps {
  onClose: () => void;
}

export function DashboardModal({ onClose }: DashboardModalProps) {
  const [showPicker, setShowPicker] = useState(false);
  const walletAddress = useGameStore((s) => s.walletAddress);
  const dashboardStats = useGameStore((s) => s.dashboardStats);
  const mockBalance = useGameStore((s) => s.mockBalance);
  const totalBurnedAllPits = useGameStore((s) => s.totalBurnedAllPits);
  const setWalletAddress = useGameStore((s) => s.setWalletAddress);
  const selectedCharacterId = useGameStore((s) => s.selectedCharacterId);
  const setSelectedCharacterId = useGameStore((s) => s.setSelectedCharacterId);
  const playerName = useGameStore((s) => s.playerName);
  const preset = getCharacterPreset(selectedCharacterId);

  const net = dashboardStats.totalWon - dashboardStats.totalLost;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-lg rounded-xl border-2 border-[var(--glitch-pink)]/50 bg-[var(--bg-darker)] shadow-[0_0_60px_rgba(255,105,180,0.15)]">
        <div className="flex items-center justify-between border-b-2 border-[var(--glitch-pink)]/30 px-4 py-3">
          <div className="flex items-center gap-2">
            <PixelCharacter characterId={selectedCharacterId} animated={false} size="sm" />
            <span className="font-pixel text-xs text-white">DASHBOARD</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded border-2 border-[#4a4a4a] bg-[#c44] font-pixel text-xs hover:bg-[#d55]"
          >
            ×
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-6">
          {walletAddress ? (
            <>
              <p className="mb-2 font-mono text-xs text-gray-500 break-all">
                {walletAddress.slice(0, 10)}…{walletAddress.slice(-8)}
              </p>
              <button
                type="button"
                onClick={() => setWalletAddress(null)}
                className="mb-4 text-xs text-gray-500 underline hover:text-gray-400"
              >
                Disconnect
              </button>

              <div className="game-box mb-4 flex items-center gap-4 border-[var(--glitch-teal)]/40">
                <div className="flex-shrink-0" style={{ imageRendering: "pixelated" }}>
                  <PixelCharacter characterId={selectedCharacterId} animated size="lg" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="game-box-label">PROFILE</p>
                  <p className="font-mono text-base font-semibold text-white">
                    {playerName || "Gladiator"}
                  </p>
                  <p className="font-mono text-xs text-gray-500">{preset.name}</p>
                  <button
                    type="button"
                    onClick={() => setShowPicker((v) => !v)}
                    className="mt-1 font-pixel text-[9px] text-[var(--glitch-teal)] hover:underline"
                  >
                    {showPicker ? "HIDE PICKER" : "CHANGE CHARACTER"}
                  </button>
                </div>
              </div>

              {showPicker && (
                <div className="mb-4">
                  <CharacterPicker
                    selectedId={selectedCharacterId}
                    onSelect={(id) => {
                      setSelectedCharacterId(id);
                      setShowPicker(false);
                    }}
                  />
                </div>
              )}

              <div className="game-box mb-4">
                <p className="game-box-label">CURRENT TOKENS (IN-GAME)</p>
                <p className="font-pixel text-xl animate-pulse-glow sm:text-2xl" style={{ color: "var(--glitch-gold, #ffd700)" }}>
                  {mockBalance.toLocaleString()}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="game-box">
                  <p className="game-box-label">TOTAL WAGERED</p>
                  <p className="font-mono text-base font-semibold" style={{ color: "var(--glitch-teal)" }}>
                    {dashboardStats.totalWagered.toLocaleString()}
                  </p>
                </div>
                <div className="game-box">
                  <p className="game-box-label">TOTAL WON</p>
                  <p className="font-mono text-base font-semibold" style={{ color: "var(--glitch-teal)" }}>
                    +{dashboardStats.totalWon.toLocaleString()}
                  </p>
                </div>
                <div className="game-box">
                  <p className="game-box-label">TOTAL LOST</p>
                  <p className="font-mono text-base font-semibold text-red-400">
                    −{dashboardStats.totalLost.toLocaleString()}
                  </p>
                </div>
                <div className="game-box">
                  <p className="game-box-label">NET (WON − LOST)</p>
                  <p className="font-mono text-base font-semibold" style={{ color: net >= 0 ? "var(--glitch-teal)" : "#f87171" }}>
                    {net >= 0 ? "+" : ""}
                    {net.toLocaleString()}
                  </p>
                </div>
                <div className="game-box sm:col-span-2">
                  <p className="game-box-label">UPGRADES (BLACK MARKET)</p>
                  <p className="font-mono text-base font-semibold" style={{ color: "var(--glitch-pink)" }}>
                    {dashboardStats.upgradeCount}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <p className="text-center text-sm text-gray-500">
              Connect a wallet to see your dashboard.
            </p>
          )}

          <div className="game-box mt-4 border-red-500/40">
            <p className="game-box-label">TOTAL BURNED (ALL GLITCH PITS)</p>
            <p className="font-mono text-base font-semibold text-red-400">
              {totalBurnedAllPits.toLocaleString()} tokens
            </p>
            <p className="mt-1 text-xs text-gray-500">
              House wins across all players · live from server
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
