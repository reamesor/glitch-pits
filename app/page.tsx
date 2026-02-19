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
import { GameArenaDecor } from "@/components/GameArenaDecor";
import { ConnectToEnterModal } from "@/components/ConnectToEnterModal";
import { DashboardModal } from "@/components/DashboardModal";
import { WalletSync } from "@/components/WalletSync";
import { ConnectWalletButton } from "@/components/ConnectWalletButton";
import { GlitchPitsLogo } from "@/components/GlitchPitsLogo";
import { LandingPage } from "@/components/LandingPage";
import { BackgroundMusic } from "@/components/BackgroundMusic";
import { WALLET_STORAGE_KEY, CHARACTER_STORAGE_KEY } from "@/lib/useGameStore";

export default function Home() {
  const [showForge, setShowForge] = useState(true);
  const [showBlackMarket, setShowBlackMarket] = useState(false);
  const [showGameHelp, setShowGameHelp] = useState(false);
  const [showConnectToEnter, setShowConnectToEnter] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const { socket, connected } = useSocket();
  const mockBalance = useGameStore((s) => s.mockBalance);
  const characterCount = useGameStore((s) => s.characterCount);
  const isForged = useGameStore((s) => s.isForged);
  const walletAddress = useGameStore((s) => s.walletAddress);
  const setWalletAddress = useGameStore((s) => s.setWalletAddress);
  const forgeCharacter = useGameStore((s) => s.forgeCharacter);
  const setBalance = useGameStore((s) => s.setBalance);
  const addToBalance = useGameStore((s) => s.addToBalance);
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
    addToBalance(1000); // +1000 PITS for entering the pit with a new character (initial 1000 + 1000 = 2000)
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

  const handleEnterPits = () => {
    if (!walletAddress) setShowConnectToEnter(true);
  };

  // When wallet connects (e.g. from ConnectToEnterModal), close that modal
  useEffect(() => {
    if (walletAddress && showConnectToEnter) setShowConnectToEnter(false);
  }, [walletAddress, showConnectToEnter]);

  if (!walletAddress) {
    return (
      <main className="relative flex h-full min-h-0 flex-col overflow-hidden" style={{ height: "100dvh" }}>
        <WalletSync />
        <LandingPage
          onEnter={handleEnterPits}
          onOpenHelp={() => setShowGameHelp(true)}
          onOpenDashboard={() => setShowDashboard(true)}
          hasWallet={!!walletAddress}
        />
        {showGameHelp && <GameHelp onClose={() => setShowGameHelp(false)} />}
        {showBlackMarket && <BlackMarketModal onClose={() => setShowBlackMarket(false)} />}
        {showDashboard && <DashboardModal onClose={() => setShowDashboard(false)} />}
        {showConnectToEnter && <ConnectToEnterModal onClose={() => setShowConnectToEnter(false)} />}
      </main>
    );
  }

  return (
    <main className="relative flex h-full min-h-0 flex-col overflow-hidden" style={{ height: "100dvh" }}>
      <WalletSync />
      <div className="bg-static" />
      {/* Top Bar — slick glass header */}
      <header className="app-header flex shrink-0 items-center justify-between gap-3 px-3 py-2 sm:px-5 sm:py-2.5">
        <h1 className="shrink-0">
          <GlitchPitsLogo size="lg" />
        </h1>

        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3 md:gap-4">
          <div
            className="app-header-balance rounded-lg px-3 py-1.5 text-center sm:px-4 sm:py-2"
            title="Live balance — updates when you win or lose"
          >
            <p className="font-mono text-[8px] uppercase tracking-widest text-gray-500 sm:text-[9px]">Balance</p>
            <p
              className={`font-pixel text-base sm:text-lg md:text-xl tabular-nums ${balanceJustUpdated ? "balance-updated" : "animate-pulse-glow"}`}
              style={{ color: "var(--glitch-teal)" }}
            >
              {mockBalance.toLocaleString()}
            </p>
            <p className="font-mono text-[8px] font-medium uppercase tracking-wider text-gray-500 sm:text-[9px]">PITS</p>
          </div>

          <span className="hidden font-mono text-[10px] text-gray-500 md:inline">
            Forged: <span className="font-semibold" style={{ color: "var(--glitch-teal)" }}>{characterCount}</span>
          </span>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <BackgroundMusic />
            <button
              type="button"
              onClick={() => setShowGameHelp(true)}
              className="app-header-nav-btn rounded-md px-2.5 py-1.5 font-pixel text-[9px] sm:px-3 sm:py-2"
            >
              HELP
            </button>
            <button
              type="button"
              onClick={() => setShowBlackMarket(true)}
              className="app-header-nav-btn rounded-md px-2.5 py-1.5 font-pixel text-[9px] sm:px-3 sm:py-2"
            >
              BLACK MARKET
            </button>
            {walletAddress ? (
              <button
                type="button"
                onClick={() => setShowDashboard(true)}
                className="app-header-nav-btn rounded-md px-2.5 py-1.5 font-pixel text-[9px] sm:px-3 sm:py-2"
              >
                DASHBOARD
              </button>
            ) : (
              <ConnectWalletButton />
            )}
          </div>

          <span className={`app-header-status font-mono ${connected ? "connected" : "offline"}`}>
            {connected ? "● CONNECTED" : "○ OFFLINE"}
          </span>
        </div>
      </header>

      {/* Main Content: fit viewport, no scroll */}
      <div className="flex min-h-0 flex-1 flex-col gap-1 p-1.5 sm:flex-row sm:gap-2 sm:p-2">
        <section className="arena-section flex min-h-0 min-w-0 flex-1 items-stretch overflow-hidden sm:flex-row">
          <GameArenaDecor />
          <div className="flex min-h-0 min-w-0 flex-1 items-center justify-center overflow-hidden bg-[var(--bg-dark)] px-4 py-3 sm:px-6 sm:py-4">
            <GameCanvas />
          </div>
        </section>
        <aside className="flex max-h-[30vh] shrink-0 flex-col sm:max-h-none sm:w-48 lg:w-56">
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

      {showDashboard && (
        <DashboardModal onClose={() => setShowDashboard(false)} />
      )}

      {/* Footer watermark */}
      <footer className="flex shrink-0 justify-center border-t border-white/10 px-4 py-2">
        <span className="font-mono text-[9px] text-gray-500 sm:text-[10px]">
          created by reamesor
        </span>
      </footer>
    </main>
  );
}
