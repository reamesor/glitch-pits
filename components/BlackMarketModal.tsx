"use client";

import { WindowedModal } from "./WindowedModal";

interface BlackMarketModalProps {
  onClose: () => void;
  mockBalance: number;
}

const SHOP_ITEMS = [
  { id: "antidote", name: "Antidote", cost: 500, effect: "Remove status effects" },
  { id: "shield", name: "Shield", cost: 800, effect: "Absorb 1 hit" },
  { id: "damage", name: "Damage Boost", cost: 1200, effect: "+50% damage for 30s" },
];

export function BlackMarketModal({ onClose, mockBalance }: BlackMarketModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg">
        <WindowedModal title="BLACK MARKET" onClose={onClose}>
          <p className="mb-4 text-center text-xs text-gray-500">
            All purchases = 100% BURN. No refunds.
          </p>
          <p
            className="mb-6 font-pixel text-center text-xs"
            style={{ color: "var(--glitch-teal)" }}
          >
            Balance: {mockBalance.toLocaleString()} Mock-PITS
          </p>

          <div className="space-y-3">
            {SHOP_ITEMS.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between border-4 border-[#4a4a4a] bg-[#252025] p-4"
                style={{ imageRendering: "pixelated" }}
              >
                <div>
                  <p className="font-pixel text-xs text-white">{item.name}</p>
                  <p className="mt-1 text-[10px] text-gray-500">{item.effect}</p>
                </div>
                <button
                  type="button"
                  disabled={mockBalance < item.cost}
                  className="pixel-btn shrink-0"
                >
                  BUY ({item.cost})
                </button>
              </div>
            ))}
          </div>
        </WindowedModal>
      </div>
    </div>
  );
}
