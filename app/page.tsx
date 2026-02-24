"use client";

import { useState, useEffect, useRef } from "react";
import { useGameStore } from "@/lib/useGameStore";
import { useSocket } from "@/hooks/useSocket";
import { ForgeModal } from "@/components/ForgeModal";
import { BlackMarketModal } from "@/components/BlackMarketModal";
import { VictoryCongrats } from "@/components/VictoryCongrats";
import { GameHelp } from "@/components/GameHelp";
import { GlitchPopper } from "@/components/GlitchPopper";
import { GameCanvas } from "@/components/GameCanvas";
import { CharacterPicker } from "@/components/CharacterPicker";
import { GameArenaDecor } from "@/components/GameArenaDecor";
import { ConnectToEnterModal } from "@/components/ConnectToEnterModal";
import { DashboardModal } from "@/components/DashboardModal";
import { WalletSync } from "@/components/WalletSync";
import { ConnectWalletButton } from "@/components/ConnectWalletButton";
import { GlitchPitsLogo } from "@/components/GlitchPitsLogo";
import { LandingPage } from "@/components/LandingPage";
import { WALLET_STORAGE_KEY, CHARACTER_STORAGE_KEY } from "@/lib/useGameStore";
import { setGameMusicMuted } from "@/lib/gameAmbientSound";
import { musicManager } from "@/lib/musicManager";

export default function Home() {
  const [showForge, setShowForge] = useState(true);
  const [showBlackMarket, setShowBlackMarket] = useState(false);
  const [showGameHelp, setShowGameHelp] = useState(false);
  const [showConnectToEnter, setShowConnectToEnter] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const { socket } = useSocket();
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
  const selectedCharacterId = useGameStore((s) => s.selectedCharacterId);
  const prevBalanceRef = useRef(mockBalance);
  const [balanceJustUpdated, setBalanceJustUpdated] = useState(false);
  const [showLandingView, setShowLandingView] = useState(false);
  const [funMode, setFunMode] = useState(false); // play without wallet (e.g. in Cursor browser)
  const [gameMusicMuted, setGameMusicMutedState] = useState(() =>
    typeof window !== "undefined" ? (localStorage.getItem("glitch-pits-game-music-muted") === "1" || !localStorage.getItem("glitch-pits-game-music-muted")) : true
  );
  const [musicVolume, setMusicVolume] = useState(25);

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
    if (!forgeCharacter()) return;
    setPlayerName(data.name);
    if (data.characterId != null) setSelectedCharacterId(data.characterId);
    if (socket) socket.emit("forge", { name: data.name, clothes: data.clothes, weapon: data.weapon });
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
    else setShowLandingView(false); // from landing, go into the Pits
  };

  const handleEnterFunMode = () => {
    setFunMode(true);
    setShowLandingView(false);
    setShowConnectToEnter(false);
    useGameStore.getState().forgeCharacter();
    useGameStore.getState().setCharacterCount(1);
    useGameStore.getState().setPlayerName("Gladiator");
    setShowForge(false);
  };

  // When wallet connects (e.g. from ConnectToEnterModal), close that modal
  useEffect(() => {
    if (walletAddress && showConnectToEnter) setShowConnectToEnter(false);
  }, [walletAddress, showConnectToEnter]);

  // Background music: play when in pit and music ON, stop when leaving or music OFF
  const inPit = (walletAddress || funMode) && !showLandingView;
  useEffect(() => {
    if (!inPit) {
      musicManager.stop();
      return;
    }
    if (!gameMusicMuted) musicManager.start();
    else musicManager.stop();
    return () => musicManager.stop();
  }, [inPit, gameMusicMuted]);

  useEffect(() => {
    musicManager.setVolume(musicVolume / 100);
  }, [musicVolume]);

  const toggleGameMusic = () => {
    const next = !gameMusicMuted;
    setGameMusicMutedState(next);
    setGameMusicMuted(next);
    if (next) musicManager.stop();
    else musicManager.start();
  };

  if (!inPit) {
    return (
      <main className="relative flex h-full min-h-0 flex-col overflow-hidden" style={{ height: "100dvh" }}>
        <WalletSync />
        <LandingPage
          onEnter={handleEnterPits}
          onEnterFunMode={handleEnterFunMode}
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
      {/* Top Bar — logo left, nav right */}
      <header className="app-header relative flex shrink-0 items-center justify-between gap-6 px-4 py-3 sm:gap-8 sm:px-6 sm:py-4">
        <h1 className="header-logo z-10 shrink-0">
          <button
            type="button"
            onClick={() => setShowLandingView(true)}
            className="header-logo-btn flex items-center rounded-md py-2.5 pl-3 pr-4 transition-all sm:py-3 sm:pl-4 sm:pr-5 focus:outline-none focus:ring-2 focus:ring-[var(--glitch-pink)]/50 focus:ring-offset-2 focus:ring-offset-[var(--bg-darker)]"
            title="Back to landing"
          >
            <GlitchPitsLogo size="md" className="block" />
          </button>
        </h1>

        <div className="z-10 flex flex-wrap items-center justify-end gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggleGameMusic}
              className="app-header-nav-btn rounded px-2 py-1.5 sm:px-2.5"
              title={gameMusicMuted ? "Play background music" : "Mute background music"}
            >
              {gameMusicMuted ? "MUSIC OFF" : "MUSIC ON"}
            </button>
            {!gameMusicMuted && (
              <input
                type="range"
                min={0}
                max={100}
                value={musicVolume}
                onChange={(e) => setMusicVolume(Number(e.target.value))}
                className="music-volume-slider"
                aria-label="Music volume"
              />
            )}
          </div>
          <span className="app-header-forged hidden font-mono text-gray-500 md:inline-flex items-center gap-1">
            Forged: <span className="font-semibold tabular-nums" style={{ color: "var(--glitch-teal)" }}>{characterCount}</span>
          </span>
          <button
            type="button"
            onClick={() => setShowGameHelp(true)}
            className="app-header-nav-btn rounded px-2 py-1.5 sm:px-2.5"
          >
            HELP
          </button>
          <button
            type="button"
            onClick={() => setShowBlackMarket(true)}
            className="app-header-nav-btn rounded px-2 py-1.5 sm:px-2.5"
          >
            BLACK MARKET
          </button>
          {walletAddress ? (
            <button
              type="button"
              onClick={() => setShowDashboard(true)}
              className="app-header-nav-btn rounded px-2 py-1.5 sm:px-2.5"
            >
              DASHBOARD
            </button>
          ) : (
            <ConnectWalletButton />
          )}
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
        <aside className="flex max-h-[30vh] shrink-0 flex-col gap-3 sm:max-h-none sm:w-72 lg:w-80">
          <div className="game-box shrink-0 px-4 py-3 sm:px-5 sm:py-4">
            <CharacterPicker
              selectedId={selectedCharacterId}
              onSelect={setSelectedCharacterId}
              compact
            />
          </div>
          <div className="game-box flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-2.5 sm:px-5 sm:py-3">
            <div className="min-h-0 flex-1 overflow-hidden">
              <GlitchPopper />
            </div>
          </div>
        </aside>
      </div>

      {/* Forge Modal */}
      {showForge && <ForgeModal onForge={handleForge} />}

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

      {/* Footer watermark — update version when you deploy to confirm live */}
      <footer className="flex shrink-0 justify-center border-t border-white/10 px-4 py-2">
        <span className="font-mono text-[9px] text-gray-500 sm:text-[10px]">
          created by reamesor <span className="text-gray-600">· v2</span>
        </span>
      </footer>
    </main>
  );
}
