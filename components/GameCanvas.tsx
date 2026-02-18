"use client";

import { useEffect, useRef } from "react";
import { useGameStore } from "@/lib/useGameStore";
import { useSocket } from "@/hooks/useSocket";
import { LobbyView } from "./LobbyView";

const ARENA_WIDTH = 800;
const ARENA_HEIGHT = 600;
const RUMBLE_LOG_TYPES = new Set(["rumble", "kill", "event", "arena", "critical", "winner", "payout"]);

export function GameCanvas() {
  const { socket, connected } = useSocket();
  const rumbleState = useGameStore((s) => s.rumbleState);
  const glitchLog = useGameStore((s) => s.glitchLog);
  const playerId = useGameStore((s) => s.playerId);
  const characterCount = useGameStore((s) => s.characterCount);
  const arenaLogRef = useRef<HTMLDivElement>(null);

  const participants = rumbleState?.participants || [];
  const phase = rumbleState?.phase || "idle";
  const gameMode = rumbleState?.gameMode ?? null;
  const isDuelArena = gameMode === "duel";
  const SYSTEM_SENTINEL_ID = "SYSTEM_SENTINEL";

  const rumbleLoreEntries = glitchLog.filter((e) => RUMBLE_LOG_TYPES.has(e.type));

  useEffect(() => {
    arenaLogRef.current?.scrollTo({ top: arenaLogRef.current.scrollHeight, behavior: "smooth" });
  }, [rumbleLoreEntries.length]);

  const handleOpenPit = () => socket?.emit("openPit");
  const handleResetRumble = () => socket?.emit("resetRumble");

  return (
    <div
      className="relative overflow-hidden rounded-lg border-2 bg-black"
      style={{ borderColor: isDuelArena ? "rgba(255, 0, 193, 0.6)" : "rgba(255, 105, 180, 0.4)" }}
    >
      <div
        className="flex flex-col items-center justify-center p-8 transition-colors duration-500"
        style={{
          minHeight: ARENA_HEIGHT,
          backgroundColor: isDuelArena ? "rgba(80, 0, 20, 0.6)" : "var(--bg-dark)",
        }}
      >
        {/* Lobby: Odometer + 60s countdown (before match) */}
        {phase === "entries" && <LobbyView />}

        {/* Battle Arena: after timer hits zero */}
        {(phase === "idle" || phase === "battle" || phase === "finished") && (
          <>
            {phase === "idle" && (
              <>
                {participants.length === 0 && (
                  <p className="font-pixel text-center text-xs text-gray-500">
                    {characterCount < 1
                      ? "Forge a character first"
                      : "Open the pit to enter (1 = Duel vs House, 2-3 = Rumble)"}
                  </p>
                )}
                {connected && characterCount >= 1 && (
                  <button type="button" onClick={handleOpenPit} className="pixel-btn pixel-btn-accent">
                    OPEN PIT
                  </button>
                )}
              </>
            )}

            {(phase === "battle" || phase === "finished") && (
              <>
                {rumbleState?.seedId && (
                  <div className="mb-4 rounded border-2 border-[#4a4a4a] px-3 py-2 font-mono text-[8px] text-gray-400" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
                    Seed: <span className="text-[var(--glitch-teal)]">{rumbleState.seedId}</span>
                    <span className="ml-2 text-gray-500">(verify fairness)</span>
                  </div>
                )}

                {isDuelArena && (
                  <p className="font-pixel mb-2 text-[8px] uppercase" style={{ color: "var(--g-red)" }}>Vs. House · 2x Payout</p>
                )}

                {/* Central Rumble Lore — text lores on the black screen */}
                <div className="mb-4 flex w-full max-w-2xl flex-col">
                  <p className="font-pixel mb-2 text-[8px] uppercase text-gray-500">
                    RUMBLE LORE · Wish for the gods you win
                  </p>
                  <div
                    ref={arenaLogRef}
                    className="max-h-32 overflow-y-auto rounded border-2 border-[var(--glitch-purple)] p-3 font-mono text-[10px]"
                    style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
                  >
                    {rumbleLoreEntries.length === 0 ? (
                      <p className="text-gray-500">Awaiting transmissions… Wish for the gods you win.</p>
                    ) : (
                      rumbleLoreEntries.map((entry) => (
                        <p key={entry.id} className="mb-1.5 leading-tight text-gray-300">
                          <span className="text-gray-500">[{entry.type.toUpperCase()}] </span>
                          {entry.message}
                        </p>
                      ))
                    )}
                  </div>
                </div>

                <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                  {participants.map((p) => {
                    const isSentinel = p.id === SYSTEM_SENTINEL_ID;
                    return (
                      <div
                        key={p.id}
                        className="flex flex-col items-center rounded border-4 p-3 transition-all duration-300"
                        style={{
                          borderColor: isSentinel ? "var(--g-red)" : p.id === playerId ? "var(--glitch-teal)" : "#4a4a4a",
                          backgroundColor: isSentinel ? "rgba(255, 0, 193, 0.15)" : "rgba(107, 75, 154, 0.2)",
                          opacity: p.isAlive === false ? 0.5 : 1,
                          filter: p.isAlive === false ? "brightness(0.35) grayscale(0.8)" : "none",
                          boxShadow: isSentinel && p.isAlive ? "0 0 12px rgba(255, 0, 193, 0.4)" : undefined,
                        }}
                      >
                        <div
                          className="mb-2 flex h-14 w-14 items-center justify-center rounded border-2 border-black font-pixel text-xl"
                          style={{
                            backgroundColor: isSentinel ? "var(--g-red)" : p.id === playerId ? "var(--glitch-teal)" : "var(--glitch-pink)",
                            color: isSentinel ? "#000" : "#000",
                            imageRendering: "pixelated",
                          }}
                        >
                          {isSentinel ? "S" : p.name.charAt(0)}
                        </div>
                        <span className="font-pixel text-[8px] text-white">{p.name}</span>
                        {p.loreClass && <span className="font-pixel text-[6px] text-gray-400">{p.loreClass}</span>}
                        {p.isAlive === false && <span className="mt-1 font-pixel text-[8px] text-red-500">DE-REZZED</span>}
                      </div>
                    );
                  })}
                </div>

                {phase === "battle" && (
                  <p className="font-pixel text-xs text-[var(--glitch-pink)]">BATTLE IN PROGRESS...</p>
                )}
                {phase === "finished" && rumbleState?.winner && (
                  <div className="flex flex-col items-center gap-4">
                    <p className="font-pixel text-xs text-[#ffd700]">🏆 {rumbleState.winner.name} WINS!</p>
                    <button type="button" onClick={handleResetRumble} className="pixel-btn">NEW RUMBLE</button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {!connected && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-8 text-center" style={{ fontFamily: "'Press Start 2P', monospace" }}>
          <p className="mb-4 text-xs" style={{ color: "var(--glitch-pink)" }}>○ OFFLINE</p>
          <p className="mb-6 max-w-md text-[8px] leading-relaxed text-gray-400">
            Deploy the socket-server to Railway and add NEXT_PUBLIC_SOCKET_URL to Vercel.
          </p>
        </div>
      )}

      <div className="absolute bottom-2 left-2 font-pixel text-[8px] text-gray-500">
        {isDuelArena ? "Duel vs House · 2x Payout" : "Rumble · Winner takes all"} · 60s countdown · 3s per elimination
      </div>
    </div>
  );
}
