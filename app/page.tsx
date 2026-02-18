"use client";

import { useState, useEffect, useRef } from "react";
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
import { WALLET_STORAGE_KEY, CHARACTER_STORAGE_KEY } from "@/lib/useGameStore";

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
  const setSelectedCharacterId = useGameStore((s) => s.setSelectedCharacterId);
  const prevBalanceRef = useRef(mockBalance);
  const [balanceJustUpdated, setBalanceJustUpdated] = useState(false);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(CHARACTER_STORAGE_KEY) : null;
    if (saved != null) setSelectedCharacterId(saved);
  }, [setSelectedCharacterId]);

  useEffect(() => {
    if (mockBalance > prevBalanceRef.current) {
      setBalanceJustUpdated(true);
      setTimeout(() => setBalanceJustUpdated(false), 1500);
    }
    prevBalanceRef.current = mockBalance;
  }, [mockBalance]);

  const handleForge = (data: { name: string; clothes: string; weapon: string; characterId?: string }) => {
    if (!forgeCharacter() || !socket) return;
    setPlayerName(data.name);
    if (data.characterId != null) setSelectedCharacterId(data.characterId);
    socket.emit("forge", { name: data.name, clothes: data.clothes, weapon: data.weapon });
    setShowForge(false);
  };

  useEffect(() => {
    if (!isForged) {
      setShowForge(true);
    }
  }, [isForged]);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(WALLET_STORAGE_KEY) : null;
    if (saved?.trim()) setWalletAddress(saved.trim());
  }, [setWalletAddress]);

  return (
    <main className="relative flex h-screen flex-col">
      <div className="bg-static" />
      {/* Top Bar */}
      <header
        className="flex shrink-0 items-center justify-between border-b-2 border-[var(--glitch-pink)]/50 px-6 py-4 shadow-[0_4px_30px_rgba(255,105,180,0.12)]"
        style={{ backgroundColor: "var(--bg-darker)" }}
      >
        <h1
          className="font-pixel glitch-text text-base sm:text-lg"
          data-text="GLITCH PITS"
          style={{ color: "var(--glitch-pink)" }}
        >
          GLITCH PITS
        </h1>

        <div className="flex items-center gap-4 sm:gap-8">
          <div
            className="rounded-lg border-2 border-[var(--glitch-teal)]/50 bg-[var(--bg-card)] px-5 py-2.5 text-center shadow-[0_0_20px_rgba(0,212,170,0.15)]"
            title="Live balance — updates when you win or lose"
          >
            <p className="font-mono text-[10px] uppercase tracking-wider text-gray-500">Balance</p>
            <p
              className={`font-pixel text-xl sm:text-2xl ${balanceJustUpdated ? "balance-updated" : "animate-pulse-glow"}`}
              style={{ color: "var(--glitch-teal)" }}
            >
              {mockBalance.toLocaleString()}
            </p>
            <p className="font-mono text-[9px] text-gray-500">PITS</p>
          </div>

          <span className="hidden font-mono text-sm text-gray-500 sm:inline">
            Forged: <span style={{ color: "var(--glitch-teal)" }}>{characterCount}</span>
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowGameHelp(true)}
              className="pixel-btn text-[9px]"
            >
              HELP
            </button>
            <button
              type="button"
              onClick={() => setShowBlackMarket(true)}
              className="pixel-btn text-[9px]"
            >
              BLACK MARKET
            </button>
            {walletAddress ? (
              <button
                type="button"
                onClick={() => setShowDashboard(true)}
                className="pixel-btn text-[9px]"
              >
                DASHBOARD
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowConnectWallet(true)}
                className="pixel-btn text-[9px]"
              >
                CONNECT WALLET
              </button>
            )}
          </div>

          <span className="font-mono text-sm">
            {connected ? (
              <span className="text-[var(--glitch-teal)]">● CONNECTED</span>
            ) : (
              <span className="text-[var(--glitch-pink)]">○ OFFLINE</span>
            )}
          </span>
        </div>
      </header>

      {/* Main Content - COLORS-style layout */}
      <div className="flex flex-1 overflow-hidden gap-4 p-4">
        {/* Game Arena (Center) */}
        <section className="flex flex-1 items-center justify-center min-w-0">
          <GameCanvas />
        </section>

        {/* Glitch Log - box dashboard */}
        <aside className="flex w-80 shrink-0 flex-col">
          <div className="game-box flex h-full min-h-0 flex-1 flex-col overflow-hidden">
            <div className="min-h-0 flex-1 overflow-auto">
              <GlitchLog />
            </div>
          </div>
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
