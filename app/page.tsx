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
import { GlitchPitsLogo } from "@/components/GlitchPitsLogo";
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
    <main className="relative flex h-full min-h-0 flex-col overflow-hidden" style={{ height: "100dvh" }}>
      <div className="bg-static" />
      {/* Top Bar */}
      <header
        className="flex shrink-0 flex-wrap items-center justify-between gap-1.5 border-b-2 border-[var(--glitch-pink)]/50 px-2 py-1.5 shadow-[0_4px_20px_rgba(255,105,180,0.1)] sm:px-4 sm:py-2"
        style={{ backgroundColor: "var(--bg-darker)" }}
      >
        <h1>
          <GlitchPitsLogo size="md" />
        </h1>

        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-4 md:gap-6">
          <div
            className="rounded border-2 border-[var(--glitch-teal)]/50 bg-[var(--bg-card)] px-2 py-0.5 text-center shadow-[0_0_10px_rgba(0,212,170,0.12)] sm:px-3 sm:py-1"
            title="Live balance — updates when you win or lose"
          >
            <p className="font-mono text-[7px] uppercase tracking-wider text-gray-500 sm:text-[9px]">Balance</p>
            <p
              className={`font-pixel text-sm sm:text-lg md:text-xl ${balanceJustUpdated ? "balance-updated" : "animate-pulse-glow"}`}
              style={{ color: "var(--glitch-teal)" }}
            >
              {mockBalance.toLocaleString()}
            </p>
            <p className="font-mono text-[7px] text-gray-500 sm:text-[8px]">PITS</p>
          </div>

          <span className="hidden font-mono text-xs text-gray-500 md:inline">
            Forged: <span style={{ color: "var(--glitch-teal)" }}>{characterCount}</span>
          </span>

          <div className="flex items-center gap-1 sm:gap-2">
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

          <span className="font-mono text-[10px] sm:text-sm">
            {connected ? (
              <span className="text-[var(--glitch-teal)]">● CONNECTED</span>
            ) : (
              <span className="text-[var(--glitch-pink)]">○ OFFLINE</span>
            )}
          </span>
        </div>
      </header>

      {/* Main Content: fit viewport, no scroll */}
      <div className="flex min-h-0 flex-1 flex-col gap-1 p-1.5 sm:flex-row sm:gap-2 sm:p-2">
        <section className="flex min-h-0 min-w-0 flex-1 items-center justify-center overflow-hidden">
          <GameCanvas />
        </section>
        <aside className="flex max-h-[30vh] shrink-0 flex-col sm:max-h-none sm:w-48 lg:w-60">
          <div className="game-box flex min-h-0 flex-1 flex-col overflow-hidden">
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
