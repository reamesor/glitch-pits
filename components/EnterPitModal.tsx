"use client";

import { useState } from "react";
import { useGameStore } from "@/lib/useGameStore";
import { useSocket } from "@/hooks/useSocket";
import { WindowedModal } from "./WindowedModal";

const BET_AMOUNTS = [50, 100, 250, 500, 1000];

interface EnterPitModalProps {
  onClose: () => void;
}

export function EnterPitModal({ onClose }: EnterPitModalProps) {
  const [amount, setAmount] = useState(100);
  const mockBalance = useGameStore((s) => s.mockBalance);
  const playerId = useGameStore((s) => s.playerId);
  const rumbleState = useGameStore((s) => s.rumbleState);
  const { socket } = useSocket();

  const alreadyEntered = rumbleState?.participants.some((p) => p.id === playerId) ?? false;

  const handleEnter = () => {
    if (!socket || amount < 50 || amount > mockBalance || alreadyEntered) return;
    socket.emit("enterPit", { amount });
    onClose();
  };

  if (rumbleState?.phase !== "entries") return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md">
        <WindowedModal title="ENTER THE PIT" onClose={onClose}>
          <p className="mb-4 text-center text-xs text-gray-400">
            Put your character in the pit with your bet. Winner takes all.
          </p>
          <p className="mb-6 font-pixel text-center text-xs" style={{ color: "var(--glitch-teal)" }}>
            Balance: {mockBalance} PITS · Pool: {rumbleState?.prizePool || 0} PITS
          </p>

          <div className="mb-6">
            <label className="mb-2 block font-pixel text-[8px] text-gray-400">
              BET AMOUNT (min 50)
            </label>
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
            onClick={handleEnter}
            disabled={alreadyEntered || amount > mockBalance || amount < 50}
            className="pixel-btn pixel-btn-accent w-full"
          >
            {alreadyEntered ? "ALREADY IN" : `ENTER PIT (${amount} PITS)`}
          </button>
        </WindowedModal>
      </div>
    </div>
  );
}
