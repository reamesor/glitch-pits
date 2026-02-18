"use client";

import { useState } from "react";
import { useGameStore } from "@/lib/useGameStore";
import { useSocket } from "@/hooks/useSocket";
import { EnterPitModal } from "./EnterPitModal";

const ARENA_WIDTH = 800;
const ARENA_HEIGHT = 600;

export function GameCanvas() {
  const { socket, connected } = useSocket();
  const rumbleState = useGameStore((s) => s.rumbleState);
  const playerId = useGameStore((s) => s.playerId);
  const characterCount = useGameStore((s) => s.characterCount);
  const [showEnterPit, setShowEnterPit] = useState(false);

  const participants = rumbleState?.participants || [];
  const phase = rumbleState?.phase || "idle";

  const handleOpenPit = () => {
    socket?.emit("openPit");
  };

  const handleRunRumble = () => {
    socket?.emit("runRumble");
  };

  const handleResetRumble = () => {
    socket?.emit("resetRumble");
  };

  return (
    <div
      className="relative overflow-hidden rounded-lg border-2 bg-black"
      style={{ borderColor: "rgba(255, 105, 180, 0.4)" }}
    >
      <div
        className="flex flex-col items-center justify-center p-8"
        style={{ minHeight: ARENA_HEIGHT, backgroundColor: "#050508" }}
      >
        {/* Participants grid */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {participants.map((p) => (
            <div
              key={p.id}
              className={`flex flex-col items-center rounded border-4 p-3 ${
                p.isAlive === false ? "opacity-50" : ""
              }`}
              style={{
                borderColor: p.id === playerId ? "var(--glitch-teal)" : "#4a4a4a",
                backgroundColor: "rgba(107, 75, 154, 0.2)",
              }}
            >
              <div
                className="mb-2 flex h-12 w-12 items-center justify-center rounded font-pixel text-lg"
                style={{
                  backgroundColor: p.id === playerId ? "var(--glitch-teal)" : "var(--glitch-pink)",
                  color: "#000",
                }}
              >
                {p.name.charAt(0)}
              </div>
              <span className="font-pixel text-[8px] text-white">{p.name}</span>
              {p.isAlive === false && (
                <span className="mt-1 font-pixel text-[8px] text-red-500">DE-REZZED</span>
              )}
            </div>
          ))}
        </div>

        {participants.length === 0 && (
          <p className="font-pixel text-center text-xs text-gray-500">
            {characterCount < 2
              ? `Need ${2 - characterCount} more character(s) to enter the pit`
              : phase === "idle"
                ? "Open the pit to let fighters enter with their bet"
                : "Enter the pit with your character and bet amount"}
          </p>
        )}

        {/* Rumble controls */}
        {connected && characterCount >= 2 && (
          <div className="flex flex-wrap items-center justify-center gap-4">
            {phase === "idle" && (
              <button
                type="button"
                onClick={handleOpenPit}
                className="pixel-btn pixel-btn-accent"
              >
                OPEN PIT
              </button>
            )}
            {phase === "entries" && (
              <>
                <p className="flex items-center font-pixel text-[10px] text-[var(--glitch-teal)]">
                  Pool: {rumbleState?.prizePool || 0} PITS · Enter with your bet!
                </p>
                <button
                  type="button"
                  onClick={() => setShowEnterPit(true)}
                  className="pixel-btn pixel-btn-accent"
                >
                  ENTER PIT
                </button>
                {participants.length >= 2 && (
                  <button
                    type="button"
                    onClick={handleRunRumble}
                    className="pixel-btn"
                  >
                    RUN RUMBLE
                  </button>
                )}
              </>
            )}
            {phase === "battle" && (
              <p className="font-pixel text-xs text-[var(--glitch-pink)]">
                BATTLE IN PROGRESS...
              </p>
            )}
            {phase === "finished" && rumbleState?.winner && (
              <div className="flex flex-col items-center gap-4">
                <p className="font-pixel text-xs text-[#ffd700]">
                  🏆 {rumbleState.winner.name} WINS!
                </p>
                <button
                  type="button"
                  onClick={handleResetRumble}
                  className="pixel-btn"
                >
                  NEW RUMBLE
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {!connected && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-8 text-center"
          style={{ fontFamily: "'Press Start 2P', monospace" }}
        >
          <p className="mb-4 text-xs" style={{ color: "var(--glitch-pink)" }}>
            ○ OFFLINE
          </p>
          <p className="mb-6 max-w-md text-[8px] leading-relaxed text-gray-400">
            Deploy the socket-server to Railway and add NEXT_PUBLIC_SOCKET_URL to Vercel.
          </p>
        </div>
      )}

      <div className="absolute bottom-2 left-2 font-pixel text-[8px] text-gray-500">
        Enter with your bet · Winner takes all · Upgrade in Black Market
      </div>

      {showEnterPit && <EnterPitModal onClose={() => setShowEnterPit(false)} />}
    </div>
  );
}
