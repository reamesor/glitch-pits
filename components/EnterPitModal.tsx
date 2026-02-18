"use client";

import { useState } from "react";
import { useGameStore } from "@/lib/useGameStore";
import { useSocket } from "@/hooks/useSocket";
import { WindowedModal } from "./WindowedModal";
import {
  getMultiplierForAmount,
  SYSTEM_SENTINEL_ID,
  SYSTEM_SENTINEL_NAME,
} from "@/lib/betMultipliers";

const BET_AMOUNTS = [50, 100, 250, 500, 1000];

type Mode = "live" | "bet";

interface EnterPitModalProps {
  onClose: () => void;
}

export function EnterPitModal({ onClose }: EnterPitModalProps) {
  const [mode, setMode] = useState<Mode>("live");
  const [amount, setAmount] = useState(100);
  const [warriorId, setWarriorId] = useState<string>("");
  const mockBalance = useGameStore((s) => s.mockBalance);
  const playerId = useGameStore((s) => s.playerId);
  const rumbleState = useGameStore((s) => s.rumbleState);
  const { socket } = useSocket();

  const participants = rumbleState?.participants || [];
  const alreadyInPit = participants.some((p) => p.id === playerId);
  const isDuel = participants.length === 1;

  // Bet targets: participants + System Sentinel in duel
  const betTargets = [
    ...participants.map((p) => ({ id: p.id, name: p.name })),
    ...(isDuel ? [{ id: SYSTEM_SENTINEL_ID, name: SYSTEM_SENTINEL_NAME }] : []),
  ].filter((t) => t.id !== playerId);

  const multiplier = getMultiplierForAmount(amount);
  const potentialWin = Math.floor(amount * multiplier);

  const handleLiveEnter = () => {
    if (!socket || amount < 50 || amount > mockBalance || alreadyInPit) return;
    socket.emit("enterPit", { amount });
    onClose();
  };

  const handleBetOnly = () => {
    if (!socket || !warriorId || amount < 50 || amount > mockBalance || alreadyInPit) return;
    socket.emit("betOnWarrior", { warriorId, amount });
    onClose();
  };

  if (rumbleState?.phase !== "entries") return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md">
        <WindowedModal title="ENTER PIT / BET" onClose={onClose}>
          {/* Mode toggle: Live Pit vs Bet Only */}
          <div className="mb-6 flex border-2 border-[#4a4a4a]">
            <button
              type="button"
              onClick={() => setMode("live")}
              className={`flex-1 border-r-2 border-[#4a4a4a] p-3 font-pixel text-[8px] ${
                mode === "live"
                  ? "bg-[var(--glitch-pink)]/30 text-[var(--glitch-pink)]"
                  : "bg-[#2a2a2a] text-gray-500"
              }`}
            >
              LIVE PIT
            </button>
            <button
              type="button"
              onClick={() => setMode("bet")}
              className={`flex-1 p-3 font-pixel text-[8px] ${
                mode === "bet"
                  ? "bg-[var(--glitch-teal)]/20 text-[var(--glitch-teal)]"
                  : "bg-[#2a2a2a] text-gray-500"
              }`}
            >
              BET ONLY
            </button>
          </div>

          <p className="mb-4 text-center text-xs text-gray-400">
            {mode === "live"
              ? "Put your character in the pit. Winner takes all (or 2x in Duel)."
              : "Bet on who wins. Bigger bet = higher multiplier. Lose it all if wrong."}
          </p>
          <p className="mb-4 font-pixel text-center text-xs" style={{ color: "var(--glitch-teal)" }}>
            Balance: {mockBalance} PITS · Pool: {rumbleState?.prizePool || 0} PITS
          </p>

          {mode === "live" && (
            <>
              <div className="mb-6">
                <label className="mb-2 block font-pixel text-[8px] text-gray-400">BET AMOUNT (min 50)</label>
                <div className="flex flex-wrap gap-2">
                  {BET_AMOUNTS.map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setAmount(a)}
                      disabled={a > mockBalance}
                      className={`border-2 p-2 font-pixel text-[8px] ${
                        amount === a
                          ? "border-[var(--glitch-pink)] bg-[var(--glitch-pink)]/20"
                          : "border-[#4a4a4a] bg-[#2a2a2a]"
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={handleLiveEnter}
                disabled={alreadyInPit || amount > mockBalance || amount < 50}
                className="pixel-btn pixel-btn-accent w-full"
              >
                {alreadyInPit ? "ALREADY IN" : `ENTER PIT (${amount} PITS)`}
              </button>
            </>
          )}

          {mode === "bet" && (
            <>
              {betTargets.length === 0 ? (
                <p className="mb-4 font-pixel text-[8px] text-gray-500">You’re the only one — enter Live Pit or wait for others.</p>
              ) : (
                <>
                  <div className="mb-4">
                    <label className="mb-2 block font-pixel text-[8px] text-gray-400">BET ON</label>
                    <div className="flex flex-wrap gap-2">
                      {betTargets.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setWarriorId(t.id)}
                          className={`border-2 p-2 font-pixel text-[8px] ${
                            warriorId === t.id
                              ? "border-[var(--glitch-teal)] bg-[var(--glitch-teal)]/20"
                              : "border-[#4a4a4a] bg-[#2a2a2a]"
                          }`}
                        >
                          {t.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="mb-2 block font-pixel text-[8px] text-gray-400">AMOUNT · MULTIPLIER</label>
                    <div className="flex flex-wrap gap-2">
                      {BET_AMOUNTS.map((a) => {
                        const mult = getMultiplierForAmount(a);
                        return (
                          <button
                            key={a}
                            type="button"
                            onClick={() => setAmount(a)}
                            disabled={a > mockBalance}
                            className={`border-2 p-2 font-pixel text-[8px] ${
                              amount === a
                                ? "border-[var(--glitch-teal)] bg-[var(--glitch-teal)]/20"
                                : "border-[#4a4a4a] bg-[#2a2a2a]"
                            }`}
                          >
                            {a} → {mult}x
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="mb-4 rounded border-2 border-[#4a4a4a] p-3 font-pixel text-[8px]">
                    <span className="text-gray-500">Multiplier: </span>
                    <span style={{ color: "var(--glitch-teal)" }}>{multiplier}x</span>
                    <span className="text-gray-500"> · Potential win: </span>
                    <span style={{ color: "var(--glitch-gold, #ffd700)" }}>{potentialWin} PITS</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleBetOnly}
                    disabled={!warriorId || amount > mockBalance || amount < 50}
                    className="pixel-btn pixel-btn-accent w-full"
                  >
                    BET {amount} PITS ({multiplier}x)
                  </button>
                </>
              )}
            </>
          )}
        </WindowedModal>
      </div>
    </div>
  );
}
