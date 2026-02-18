"use client";

import { useState, useEffect } from "react";
import { useGameStore } from "@/lib/useGameStore";
import { useSocket } from "@/hooks/useSocket";
import { ForgeModal } from "@/components/ForgeModal";
import { BlackMarketModal } from "@/components/BlackMarketModal";
import { VictoryCongrats } from "@/components/VictoryCongrats";
import { GameHelp } from "@/components/GameHelp";
import { GlitchLog } from "@/components/GlitchLog";
import { GameCanvas } from "@/components/GameCanvas";
import { ConnectWalletModal } from "@/components/ConnectWalletModal";
import { DashboardModal } from "@/components/DashboardModal";
import { WALLET_STORAGE_KEY } from "@/lib/useGameStore";

export default function Home() {
  const [showForge, setShowForge] = useState(true);
  const [showBlackMarket, setShowBlackMarket] = useState(false);
  const [showGameHelp, setShowGameHelp] = useState(false);
  const [showConnectWallet, setShowConnectWallet] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const { socket, connected } = useSocket();
  const mockBalance = useGameStore((s) => s.mockBalance);
  const characterCount = useGameStore((s) => s.characterCount);
  const isForged = useGameStore((s) => s.isForged);
  const walletAddress = useGameStore((s) => s.walletAddress);
  const setWalletAddress = useGameStore((s) => s.setWalletAddress);
  const forgeCharacter = useGameStore((s) => s.forgeCharacter);
  const setPlayerName = useGameStore((s) => s.setPlayerName);
  const victoryData = useGameStore((s) => s.victoryData);
  const setVictoryData = useGameStore((s) => s.setVictoryData);

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

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(WALLET_STORAGE_KEY) : null;
    if (saved?.trim()) setWalletAddress(saved.trim());
  }, [setWalletAddress]);

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
            Forged:{" "}
            <span style={{ color: "var(--glitch-teal)" }}>{characterCount}</span>
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
          {walletAddress ? (
            <button
              type="button"
              onClick={() => setShowDashboard(true)}
              className="pixel-btn text-[8px]"
            >
              DASHBOARD
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowConnectWallet(true)}
              className="pixel-btn text-[8px]"
            >
              CONNECT WALLET
            </button>
          )}
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

      {/* Victory Congrats */}
      {victoryData && (
        <VictoryCongrats
          name={victoryData.name}
          amount={victoryData.amount}
          onClose={() => setVictoryData(null)}
        />
      )}

      {/* Black Market Modal */}
      {showBlackMarket && (
        <BlackMarketModal onClose={() => setShowBlackMarket(false)} />
      )}

      {showConnectWallet && (
        <ConnectWalletModal onClose={() => setShowConnectWallet(false)} />
      )}

      {showDashboard && (
        <DashboardModal onClose={() => setShowDashboard(false)} />
      )}
    </main>
  );
}
