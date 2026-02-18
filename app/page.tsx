"use client";

import { useState, useEffect } from "react";
import { useGameStore } from "@/lib/useGameStore";
import { useSocket } from "@/hooks/useSocket";
import { ForgeModal } from "@/components/ForgeModal";
import { BlackMarketModal } from "@/components/BlackMarketModal";
import { GameHelp } from "@/components/GameHelp";
import { GlitchLog } from "@/components/GlitchLog";
import { GameCanvas } from "@/components/GameCanvas";

export default function Home() {
  const [showForge, setShowForge] = useState(true);
  const [showBlackMarket, setShowBlackMarket] = useState(false);
  const [showGameHelp, setShowGameHelp] = useState(false);
  const { socket, connected } = useSocket();
  const mockBalance = useGameStore((s) => s.mockBalance);
  const playerCount = useGameStore((s) => s.playerCount);
  const isForged = useGameStore((s) => s.isForged);
  const forgeCharacter = useGameStore((s) => s.forgeCharacter);
  const setPlayerName = useGameStore((s) => s.setPlayerName);

  const handleForge = (data: { name: string; clothes: string; weapon: string }) => {
    if (!forgeCharacter() || !socket) return;
    setPlayerName(data.name);
    socket.emit("forge", data);
    setShowForge(false);
  };

  useEffect(() => {
    if (!isForged && mockBalance >= 1000) {
      setShowForge(true);
    }
  }, [isForged, mockBalance]);

  return (
    <main className="relative flex h-screen flex-col">
      <div className="bg-static" />
      {/* Top Bar */}
      <header
        className="flex shrink-0 items-center justify-between border-b-4 px-6 py-3"
        style={{
          borderColor: "var(--glitch-purple)",
          backgroundColor: "var(--bg-darker)",
        }}
      >
        <h1
          className="font-pixel glitch-text text-sm"
          data-text="GLITCH PITS"
          style={{ color: "var(--glitch-pink)" }}
        >
          GLITCH PITS
        </h1>
        <div className="flex items-center gap-6">
          <span
            className="font-pixel text-xs"
            style={{ color: "var(--glitch-teal)" }}
          >
            {mockBalance.toLocaleString()} Mock-PITS
          </span>
          <span className="text-xs text-gray-500">
            Players:{" "}
            <span style={{ color: "var(--glitch-teal)" }}>{playerCount}</span>
          </span>
          <span className="text-xs text-gray-500">
            Burn Rate:{" "}
            <span style={{ color: "var(--glitch-pink)" }}>1,000</span> PITS
          </span>
          <button
            type="button"
            onClick={() => setShowGameHelp(true)}
            className="pixel-btn text-[8px]"
          >
            HELP
          </button>
          <button
            type="button"
            onClick={() => setShowBlackMarket(true)}
            className="pixel-btn text-[8px]"
          >
            BLACK MARKET
          </button>
          <span className="text-xs text-gray-500">
            {connected ? (
              <span style={{ color: "var(--glitch-teal)" }}>● CONNECTED</span>
            ) : (
              <span style={{ color: "var(--glitch-pink)" }}>○ OFFLINE</span>
            )}
          </span>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Game Arena (Center) */}
        <section className="flex flex-1 items-center justify-center p-4">
          <GameCanvas />
        </section>

        {/* Glitch Log Sidebar */}
        <aside
          className="flex w-80 shrink-0 flex-col border-l-4 p-4"
          style={{
            borderColor: "var(--glitch-purple)",
            backgroundColor: "var(--bg-darker)",
          }}
        >
          <GlitchLog />
        </aside>
      </div>

      {/* Forge Modal */}
      {showForge && <ForgeModal onForge={handleForge} connected={connected} />}

      {/* Game Help Modal */}
      {showGameHelp && <GameHelp onClose={() => setShowGameHelp(false)} />}

      {/* Black Market Modal */}
      {showBlackMarket && (
        <BlackMarketModal
          onClose={() => setShowBlackMarket(false)}
          mockBalance={mockBalance}
        />
      )}
    </main>
  );
}
