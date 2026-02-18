"use client";

import { useEffect, useState } from "react";
import { useGameStore } from "@/lib/useGameStore";
import { useSocket } from "@/hooks/useSocket";
import { Odometer } from "./Odometer";
import { EnterPitModal } from "./EnterPitModal";

const COUNTDOWN_START = 60;

export function LobbyView() {
  const { socket, connected } = useSocket();
  const rumbleState = useGameStore((s) => s.rumbleState);
  const playerId = useGameStore((s) => s.playerId);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showEnterPit, setShowEnterPit] = useState(false);

  const participants = rumbleState?.participants || [];
  const prizePool = rumbleState?.prizePool ?? 0;
  const isInPit = participants.some((p) => p.id === playerId);
  const myEntry = participants.find((p) => p.id === playerId);
  const myBet = myEntry?.betAmount ?? 0;
  const isDuelMode = participants.length === 1;
  const isRumbleMode = participants.length >= 2 && participants.length <= 3;
  const canStart = participants.length >= 1;
  const fighterCount = isDuelMode ? 2 : participants.length;
  const winChancePercent = fighterCount > 0 ? Math.round(100 / fighterCount) : 0;
  const potentialWin = isDuelMode ? myBet * 2 : Math.floor(prizePool * 0.95);
  const loreLine = isDuelMode
    ? "You are attempting to bypass the firewall. Defeat the Sentinel to double your data."
    : "Multiple fragments detected. System unstable. Only one can remain.";

  useEffect(() => {
    if (countdown === null || countdown <= 0) return;
    const t = setInterval(() => {
      setCountdown((c) => {
        if (c === null || c <= 1) {
          if (c === 1) socket?.emit("runRumble");
          return null;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [countdown, socket]);

  const startCountdown = () => {
    if (canStart && connected) setCountdown(COUNTDOWN_START);
  };

  if (rumbleState?.phase !== "entries") return null;

  return (
    <div
      className="flex flex-col items-center justify-center rounded-lg border-4 border-[var(--glitch-purple)] p-8"
      style={{ backgroundColor: "var(--bg-darker)", minHeight: 320 }}
    >
      <h2
        className="font-pixel glitch-text mb-6 text-center text-xs uppercase"
        data-text="LOBBY"
        style={{ color: "var(--g-blue)" }}
      >
        LOBBY
      </h2>

      {/* Mode indicator */}
      {isDuelMode && (
        <div className="mb-4 rounded border-2 border-[var(--g-red)] px-4 py-2" style={{ backgroundColor: "rgba(255, 0, 193, 0.1)" }}>
          <p className="font-pixel text-[10px]" style={{ color: "var(--g-red)" }}>VS. HOUSE</p>
          <p className="font-pixel text-[8px] text-gray-400">2x Payout · Defeat the Sentinel to double your data</p>
        </div>
      )}
      {isRumbleMode && (
        <div className="mb-4 rounded border-2 border-[var(--g-blue)] px-4 py-2" style={{ backgroundColor: "rgba(0, 255, 249, 0.08)" }}>
          <p className="font-pixel text-[10px]" style={{ color: "var(--g-blue)" }}>RUMBLE ROYALE</p>
          <p className="font-pixel text-[8px] text-gray-400">Winner Takes All · Max 3 players</p>
        </div>
      )}

      {/* Your stake & game details (after you enter) */}
      {isInPit && (
        <div
          className="mb-6 w-full max-w-md rounded border-2 p-4"
          style={{ borderColor: "var(--glitch-teal)", backgroundColor: "rgba(0, 212, 170, 0.08)" }}
        >
          <p className="font-pixel mb-3 text-[10px] uppercase" style={{ color: "var(--glitch-teal)" }}>
            YOUR ENTRY · GAME DETAILS
          </p>
          <div className="mb-2 font-mono text-[10px] text-gray-300">
            <span className="text-gray-500">Your bet: </span>
            <span style={{ color: "var(--glitch-teal)" }}>{myBet} PITS</span>
          </div>
          <div className="mb-2 font-mono text-[10px] text-gray-300">
            <span className="text-gray-500">Mode: </span>
            {isDuelMode ? "Duel (2x payout)" : "Rumble (Winner Takes All)"}
          </div>
          <div className="mb-2 font-mono text-[10px] text-gray-300">
            <span className="text-gray-500">Win chance: </span>
            <span style={{ color: "var(--glitch-gold, #ffd700)" }}>{winChancePercent}%</span>
            <span className="text-gray-500"> ({fighterCount} fighters)</span>
          </div>
          <div className="mb-2 font-mono text-[10px] text-gray-300">
            <span className="text-gray-500">Pot at risk: </span>
            <span style={{ color: "var(--glitch-pink)" }}>{prizePool} PITS</span>
          </div>
          <div className="mb-3 font-mono text-[10px] text-gray-300">
            <span className="text-gray-500">If you win: </span>
            <span style={{ color: "var(--glitch-gold, #ffd700)" }}>{potentialWin} PITS</span>
          </div>
          <p className="mb-3 font-mono text-[9px] italic text-gray-400">&quot;{loreLine}&quot;</p>
          <p className="font-pixel text-[8px] uppercase" style={{ color: "var(--g-red)" }}>
            Wish for the gods you win.
          </p>
        </div>
      )}

      {/* Grand Pot — Odometer */}
      <p className="font-pixel mb-2 text-[8px] uppercase text-gray-500">Grand Pot · $PITS</p>
      <div className="mb-8">
        <Odometer value={prizePool} />
      </div>

      {/* Countdown to System Format (Match Start) */}
      {countdown !== null ? (
        <div className="mb-8 text-center">
          <p className="font-pixel mb-2 text-[8px] uppercase text-gray-500">System Format in</p>
          <p
            className="font-pixel glitch-text text-4xl tabular-nums"
            style={{ color: "var(--g-red)", textShadow: "0.05em 0 0 var(--g-red), -0.05em -0.025em 0 var(--g-blue)" }}
          >
            {countdown}
          </p>
          <p className="font-pixel mt-2 text-[8px] text-gray-500">seconds</p>
        </div>
      ) : (
        <>
          <p className="font-pixel mb-4 text-center text-[8px] text-gray-500">
            {participants.length}/3 in pit · {isDuelMode ? "Duel (2x) or wait for more" : isRumbleMode ? "Ready to start" : "Ready"}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setShowEnterPit(true)}
              className="pixel-btn pixel-btn-accent"
            >
              ENTER PIT / BET
            </button>
            <button
              type="button"
              onClick={startCountdown}
              disabled={!canStart || !connected}
              className="pixel-btn"
            >
              START COUNTDOWN
            </button>
          </div>
        </>
      )}

      {showEnterPit && <EnterPitModal onClose={() => setShowEnterPit(false)} />}
    </div>
  );
}
