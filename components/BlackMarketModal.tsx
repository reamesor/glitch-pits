"use client";

import { useGameStore } from "@/lib/useGameStore";
import { useSocket } from "@/hooks/useSocket";

interface BlackMarketModalProps {
  onClose: () => void;
}

const UPGRADES = [
  { stat: "attack", name: "Attack", cost: 200, effect: "+1 Hit chance" },
  { stat: "defense", name: "Defense", cost: 200, effect: "-1 Hit taken" },
  { stat: "luck", name: "Luck", cost: 150, effect: "+1 Survival luck" },
];

export function BlackMarketModal({ onClose }: BlackMarketModalProps) {
  const mockBalance = useGameStore((s) => s.mockBalance);
  const setBalance = useGameStore((s) => s.setBalance);
  const { socket } = useSocket();

  const recordUpgrade = useGameStore((s) => s.recordUpgrade);

  const handleUpgrade = (stat: string, cost: number) => {
    if (mockBalance < cost) return;
    const newBalance = mockBalance - cost;
    setBalance(newBalance);
    recordUpgrade();
    if (socket) socket.emit("upgrade", { stat, cost });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg">
        <div
          className="overflow-hidden border-4 border-[#4a4a4a] bg-[var(--bg-darker)]"
          style={{ imageRendering: "pixelated" }}
        >
          <div
            className="flex items-center justify-between px-3 py-2"
            style={{
              backgroundColor: "var(--window-blue)",
              borderBottom: "3px solid var(--window-blue-dark)",
            }}
          >
            <span className="font-pixel text-[10px] text-white">BLACK MARKET</span>
            <button
              type="button"
              onClick={onClose}
              className="flex h-5 w-6 items-center justify-center border-2 border-[#2d4a72] bg-[#c44]"
            >
              ×
            </button>
          </div>
          <div className="p-6">
            <p className="mb-4 text-center text-xs text-gray-500">
              Upgrade your character to increase win chances in the Rumble.
            </p>
            <p
              className="mb-6 font-pixel text-center text-xs"
              style={{ color: "var(--glitch-teal)" }}
            >
              Balance: {mockBalance.toLocaleString()} tokens
            </p>

            <div className="space-y-3">
              {UPGRADES.map((u) => (
                <div
                  key={u.stat}
                  className="flex items-center justify-between border-4 border-[#4a4a4a] bg-[#252025] p-4"
                >
                  <div>
                    <p className="font-pixel text-xs text-white">{u.name}</p>
                    <p className="mt-1 text-[10px] text-gray-500">{u.effect}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUpgrade(u.stat, u.cost)}
                    disabled={mockBalance < u.cost}
                    className="pixel-btn shrink-0"
                  >
                    +1 ({u.cost})
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
