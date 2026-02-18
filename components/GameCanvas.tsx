"use client";

import { useState } from "react";
import { useGameStore } from "@/lib/useGameStore";
import { useSocket } from "@/hooks/useSocket";
import { getMultiplierForAmount } from "@/lib/betMultipliers";

const BET_AMOUNTS = [50, 100, 250, 500, 1000];

export function GameCanvas() {
  const { socket, connected } = useSocket();
  const mockBalance = useGameStore((s) => s.mockBalance);
  const characterCount = useGameStore((s) => s.characterCount);
  const lastBetResult = useGameStore((s) => s.lastBetResult);
  const [amount, setAmount] = useState(100);

  const multiplier = getMultiplierForAmount(amount);
  const potentialWin = Math.floor(amount * multiplier);

  const handlePlaceBet = () => {
    if (!socket || amount < 50 || amount > mockBalance) return;
    useGameStore.getState().setLastBetResult(null);
    socket.emit("placeBet", { amount });
  };

  return (
    <div
      className="relative overflow-hidden rounded-lg border-2 bg-black"
      style={{ borderColor: "rgba(255, 105, 180, 0.4)" }}
    >
      <div
        className="flex flex-col items-center justify-center p-8"
        style={{ minHeight: 400, backgroundColor: "var(--bg-dark)" }}
      >
        <h2
          className="font-pixel glitch-text mb-2 text-center text-xs uppercase"
          data-text="BET VS HOUSE"
          style={{ color: "var(--g-blue)" }}
        >
          BET VS HOUSE
        </h2>
        <p className="mb-6 text-center font-mono text-[10px] text-gray-400">
          Place your bet. Win = bet × multiplier. 50/50. Higher bet = higher multiplier.
        </p>

        <p className="mb-4 font-pixel text-center text-xs" style={{ color: "var(--glitch-teal)" }}>
          Balance: {mockBalance} PITS
        </p>

        <div className="mb-4">
          <label className="mb-2 block font-pixel text-[8px] text-gray-500">AMOUNT · MULTIPLIER</label>
          <div className="flex flex-wrap justify-center gap-2">
            {BET_AMOUNTS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAmount(a)}
                disabled={a > mockBalance}
                className={`border-2 p-3 font-pixel text-[8px] ${
                  amount === a
                    ? "border-[var(--glitch-pink)] bg-[var(--glitch-pink)]/20"
                    : "border-[#4a4a4a] bg-[#2a2a2a]"
                }`}
              >
                {a} → {getMultiplierForAmount(a)}x
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6 rounded border-2 border-[#4a4a4a] px-4 py-3 font-mono text-[10px]">
          <span className="text-gray-500">Potential win: </span>
          <span style={{ color: "var(--glitch-gold, #ffd700)" }}>{potentialWin} PITS</span>
        </div>

        <button
          type="button"
          onClick={handlePlaceBet}
          disabled={!connected || amount > mockBalance || amount < 50 || characterCount < 1}
          className="pixel-btn pixel-btn-accent"
        >
          PLACE BET ({amount} PITS)
        </button>

        {lastBetResult !== null && (
          <div
            className={`mt-6 rounded border-2 px-4 py-3 font-pixel text-[10px] ${
              lastBetResult.won ? "border-[var(--glitch-teal)]" : "border-red-500/80"
            }`}
            style={{
              backgroundColor: lastBetResult.won ? "rgba(0, 212, 170, 0.1)" : "rgba(220, 38, 38, 0.1)",
            }}
          >
            {lastBetResult.won ? (
              <>YOU WON {lastBetResult.payout} PITS</>
            ) : (
              <>HOUSE WINS. Try again.</>
            )}
          </div>
        )}

        {!connected && (
          <p className="mt-6 font-pixel text-[8px] text-gray-500">
            Connect to place bets (see DEPLOY.md for socket server).
          </p>
        )}
        {connected && characterCount < 1 && (
          <p className="mt-4 font-pixel text-[8px] text-gray-500">Forge a character first.</p>
        )}
      </div>

      <div className="absolute bottom-2 left-2 font-pixel text-[8px] text-gray-500">
        Bettor vs House · Payout = bet × multiplier on win
      </div>
    </div>
  );
}
