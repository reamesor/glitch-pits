"use client";

import { useState, useCallback } from "react";
import { useGameStore } from "@/lib/useGameStore";
import { useSocket } from "@/hooks/useSocket";
import { useActiveConsumablesStore } from "@/lib/activeConsumablesStore";
import { JACKPOT_KEY_DURATION_MS } from "@/lib/activeConsumablesStore";

interface BlackMarketModalProps {
  onClose: () => void;
}

const UPGRADES = [
  { stat: "attack", name: "Attack", cost: 200, effect: "+1 Hit chance" },
  { stat: "defense", name: "Defense", cost: 200, effect: "-1 Hit taken" },
  { stat: "luck", name: "Luck", cost: 150, effect: "+1 Survival luck" },
];

type ConsumableId =
  | "glitchShield"
  | "doubleDownChip"
  | "speedHack"
  | "phantomBet"
  | "glitchMultiplier"
  | "pitBribe"
  | "shadowCloak"
  | "jackpotKey"
  | "bloodPact";

interface ConsumableItem {
  id: ConsumableId;
  name: string;
  subLabel: string;
  cost: number;
  section: "consumables" | "powerPlays" | "darkTier";
}

const CONSUMABLES: ConsumableItem[] = [
  { id: "glitchShield", name: "GLITCH SHIELD", subLabel: "One-time loss protection", cost: 300, section: "consumables" },
  { id: "doubleDownChip", name: "DOUBLE DOWN CHIP", subLabel: "2x on your next win only", cost: 400, section: "consumables" },
  { id: "speedHack", name: "SPEED HACK", subLabel: "Faster autobet for 10 rounds", cost: 250, section: "consumables" },
  { id: "phantomBet", name: "PHANTOM BET", subLabel: "One risk-free bet", cost: 500, section: "powerPlays" },
  { id: "glitchMultiplier", name: "GLITCH MULTIPLIER", subLabel: "Force 3x on next bet", cost: 600, section: "powerPlays" },
  { id: "pitBribe", name: "PIT BRIBE", subLabel: "+5% win chance for 5 bets", cost: 750, section: "powerPlays" },
  { id: "shadowCloak", name: "SHADOW CLOAK", subLabel: "50% loss reduction for 3 bets", cost: 1000, section: "darkTier" },
  { id: "jackpotKey", name: "JACKPOT KEY", subLabel: "One shot at 5x", cost: 1500, section: "darkTier" },
  { id: "bloodPact", name: "GLADIATOR BLOOD PACT", subLabel: "Pay 200 now. Next bet cannot lose.", cost: 200, section: "darkTier" },
];

const SECTION_HEADERS: Record<string, string> = {
  consumables: "[ CONSUMABLES ]",
  powerPlays: "[ POWER PLAYS ]",
  darkTier: "[ DARK TIER ]",
};

function isActive(id: ConsumableId): boolean {
  const s = useActiveConsumablesStore.getState();
  switch (id) {
    case "glitchShield":
      return s.glitchShield;
    case "doubleDownChip":
      return s.doubleDownChip;
    case "speedHack":
      return s.speedHackRoundsLeft > 0;
    case "phantomBet":
      return s.phantomBet;
    case "glitchMultiplier":
      return s.glitchMultiplier;
    case "pitBribe":
      return s.pitBribeBetsLeft > 0;
    case "shadowCloak":
      return s.shadowCloakUsesLeft > 0;
    case "jackpotKey":
      return s.jackpotKeyExpiry != null && s.jackpotKeyExpiry > Date.now();
    case "bloodPact":
      return s.bloodPact;
    default:
      return false;
  }
}

export function BlackMarketModal({ onClose }: BlackMarketModalProps) {
  const mockBalance = useGameStore((s) => s.mockBalance);
  const setBalance = useGameStore((s) => s.setBalance);
  const { socket } = useSocket();
  const recordUpgrade = useGameStore((s) => s.recordUpgrade);

  const [equippedId, setEquippedId] = useState<ConsumableId | null>(null);

  const setGlitchShield = useActiveConsumablesStore((s) => s.setGlitchShield);
  const setDoubleDownChip = useActiveConsumablesStore((s) => s.setDoubleDownChip);
  const setSpeedHackRoundsLeft = useActiveConsumablesStore((s) => s.setSpeedHackRoundsLeft);
  const setPhantomBet = useActiveConsumablesStore((s) => s.setPhantomBet);
  const setGlitchMultiplier = useActiveConsumablesStore((s) => s.setGlitchMultiplier);
  const setPitBribeBetsLeft = useActiveConsumablesStore((s) => s.setPitBribeBetsLeft);
  const setShadowCloakUsesLeft = useActiveConsumablesStore((s) => s.setShadowCloakUsesLeft);
  const setJackpotKeyExpiry = useActiveConsumablesStore((s) => s.setJackpotKeyExpiry);
  const setBloodPact = useActiveConsumablesStore((s) => s.setBloodPact);

  const handleUpgrade = (stat: string, cost: number) => {
    if (mockBalance < cost) return;
    setBalance(mockBalance - cost);
    recordUpgrade();
    if (socket) socket.emit("upgrade", { stat, cost });
  };

  const showEquipped = useCallback((id: ConsumableId) => {
    setEquippedId(id);
    setTimeout(() => setEquippedId(null), 1500);
  }, []);

  const handlePurchaseConsumable = (item: ConsumableItem) => {
    if (mockBalance < item.cost) return;
    if (item.id === "bloodPact") {
      setBalance(mockBalance - item.cost);
      setBloodPact(true);
    } else if (item.id === "jackpotKey") {
      setBalance(mockBalance - item.cost);
      setJackpotKeyExpiry(Date.now() + JACKPOT_KEY_DURATION_MS);
    } else if (item.id === "speedHack") {
      setBalance(mockBalance - item.cost);
      setSpeedHackRoundsLeft(10);
    } else if (item.id === "pitBribe") {
      setBalance(mockBalance - item.cost);
      setPitBribeBetsLeft(5);
    } else if (item.id === "shadowCloak") {
      setBalance(mockBalance - item.cost);
      setShadowCloakUsesLeft(3);
    } else {
      setBalance(mockBalance - item.cost);
      switch (item.id) {
        case "glitchShield":
          setGlitchShield(true);
          break;
        case "doubleDownChip":
          setDoubleDownChip(true);
          break;
        case "phantomBet":
          setPhantomBet(true);
          break;
        case "glitchMultiplier":
          setGlitchMultiplier(true);
          break;
      }
    }
    showEquipped(item.id);
  };

  const sections = [
    { key: "consumables" as const, items: CONSUMABLES.filter((c) => c.section === "consumables") },
    { key: "powerPlays" as const, items: CONSUMABLES.filter((c) => c.section === "powerPlays") },
    { key: "darkTier" as const, items: CONSUMABLES.filter((c) => c.section === "darkTier") },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="flex h-full max-h-[90vh] w-full max-w-lg flex-col">
        <div
          className="flex flex-1 min-h-0 flex-col overflow-hidden border-4 border-[#4a4a4a] bg-[var(--bg-darker)]"
          style={{ imageRendering: "pixelated" }}
        >
          <div
            className="flex shrink-0 items-center justify-between px-3 py-2"
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
          <div className="min-h-0 flex-1 overflow-y-auto p-6">
            <p className="mb-4 text-center text-xs text-gray-500">
              Upgrade your character and buy consumables for the Pit.
            </p>
            <p className="mb-6 font-pixel text-center text-xs" style={{ color: "var(--glitch-teal)" }}>
              Balance: {mockBalance.toLocaleString()} PITS
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

            {sections.map(({ key, items }) => (
              <div key={key} className="mt-6 space-y-3">
                <p className="font-mono text-[10px] text-gray-500">{SECTION_HEADERS[key]}</p>
                {items.map((item) => {
                  const active = isActive(item.id);
                  const equipped = equippedId === item.id;
                  const canAfford = mockBalance >= item.cost;
                  const isDarkTier = item.section === "darkTier";
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between border-4 border-[#4a4a4a] p-4"
                      style={{ backgroundColor: isDarkTier ? "#1a0000" : "#252025" }}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="font-pixel text-xs text-white">{item.name}</p>
                          {active && (
                            <span className="shrink-0 font-mono text-[8px] text-[var(--glitch-pink)]" style={{ textShadow: "0 0 6px rgba(255,105,180,0.8)" }}>
                              [ ACTIVE ]
                            </span>
                          )}
                          {equipped && (
                            <span className="shrink-0 font-mono text-[8px] text-green-400">EQUIPPED</span>
                          )}
                        </div>
                        <p className="mt-1 text-[10px] text-gray-500" style={{ color: "var(--glitch-teal)", opacity: 0.85 }}>
                          {item.subLabel}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handlePurchaseConsumable(item)}
                        disabled={!canAfford || active}
                        className="pixel-btn shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {item.cost} PITS
                      </button>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
