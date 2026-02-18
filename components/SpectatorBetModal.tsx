"use client";

import { useState } from "react";
import { useGameStore } from "@/lib/useGameStore";
import { useSocket } from "@/hooks/useSocket";
import { WindowedModal } from "./WindowedModal";

const BET_AMOUNTS = [50, 100, 250, 500, 1000];

interface SpectatorBetModalProps {
  onClose: () => void;
}

export function SpectatorBetModal({ onClose }: SpectatorBetModalProps) {
  const [warriorId, setWarriorId] = useState<string>("");
  const [amount, setAmount] = useState(100);
  const mockBalance = useGameStore((s) => s.mockBalance);
  const playerId = useGameStore((s) => s.playerId);
  const rumbleState = useGameStore((s) => s.rumbleState);
  const { socket } = useSocket();

  const participants = rumbleState?.participants || [];
  const isInPit = rumbleState?.participants.some((p) => p.id === playerId) ?? false;

  const handleBet = () => {
    if (!socket || !warriorId || amount < 50 || amount > mockBalance || isInPit) return;
    socket.emit("betOnWarrior", { warriorId, amount });
    onClose();
  };

  if (rumbleState?.phase !== "entries" || participants.length < 2 || isInPit) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md">
        <WindowedModal title="BET ON A WARRIOR" onClose={onClose}>
          <p className="mb-4 text-center text-xs text-gray-400">
            You didn&apos;t enter the pit. Bet $PITS on who will be the last one standing.
          </p>
          <p className="mb-4 font-pixel text-center text-xs" style={{ color: "var(--glitch-teal)" }}>
            Balance: {mockBalance} PITS · Spectator pool: {rumbleState?.spectatorPool || 0} PITS
          </p>

          <div className="mb-4">
            <label className="mb-2 block font-pixel text-[8px] text-gray-400">WARRIOR</label>
            <div className="flex flex-wrap gap-2">
              {participants.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setWarriorId(p.id)}
                  className={`border-2 p-2 font-pixel text-[8px] ${
                    warriorId === p.id
                      ? "border-[var(--glitch-pink)] bg-[var(--glitch-pink)]/20"
                      : "border-[#4a4a4a] bg-[#2a2a2a]"
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="mb-2 block font-pixel text-[8px] text-gray-400">AMOUNT (min 50)</label>
            <div className="flex flex-wrap gap-2">
              {BET_AMOUNTS.map((a) => (
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
                  {a}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleBet}
            disabled={!warriorId || amount > mockBalance || amount < 50}
            className="pixel-btn pixel-btn-accent w-full"
          >
            BET {amount} PITS
          </button>
        </WindowedModal>
      </div>
    </div>
  );
}
