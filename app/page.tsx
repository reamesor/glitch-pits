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
  const openedConnectModalRef = useRef(false);
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
    if (!walletAddress) {
      openedConnectModalRef.current = true;
      setShowConnectToEnter(true);
    } else {
      setShowLandingView(false); // from landing, go into the Pits
    }
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

  // When wallet connects after clicking "Enter with wallet", close modal and go to main app
  useEffect(() => {
    if (!walletAddress) return;
    if (showConnectToEnter) {
      setShowConnectToEnter(false);
      setShowLandingView(false);
    } else if (openedConnectModalRef.current) {
      setShowLandingView(false);
    }
    openedConnectModalRef.current = false;
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
      <main className="relative flex h-full min-h-0 w-full min-w-0 max-w-full flex-col overflow-hidden overflow-x-hidden" style={{ height: "100dvh" }}>
        <WalletSync />
        <LandingPage
          onEnter={handleEnterPits}
          onEnterFunMode={handleEnterFunMode}
          onOpenHelp={() => setShowGameHelp(true)}
        />
        {showGameHelp && <GameHelp onClose={() => setShowGameHelp(false)} />}
        {showBlackMarket && <BlackMarketModal onClose={() => setShowBlackMarket(false)} />}
        {showDashboard && <DashboardModal onClose={() => setShowDashboard(false)} />}
        {showConnectToEnter && <ConnectToEnterModal onClose={() => setShowConnectToEnter(false)} />}
      </main>
    );
  }

  return (
    <main className="relative flex h-full min-h-0 w-full min-w-0 max-w-full flex-col overflow-hidden overflow-x-hidden" style={{ height: "100dvh" }}>
      <WalletSync />
      <div className="bg-static" />
      {/* Top Bar — logo left, nav right; compact on mobile, touch-friendly */}
      <header className="app-header relative flex shrink-0 flex-wrap items-center justify-between gap-1.5 px-2 py-1.5 sm:gap-4 sm:px-4 sm:py-2.5 md:gap-6">
        <h1 className="header-logo z-10 shrink-0">
          <button
            type="button"
            onClick={() => setShowLandingView(true)}
            className="header-logo-btn flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md py-2 pl-2 pr-2 transition-all sm:min-h-0 sm:min-w-0 sm:py-3 sm:pl-4 sm:pr-5"
            title="Back to landing"
          >
            <GlitchPitsLogo size="md" className="block" />
          </button>
        </h1>

        <div className="z-10 flex flex-wrap items-center justify-end gap-1 sm:gap-3">
          <div className="flex items-center gap-1 sm:gap-1.5">
            <button
              type="button"
              onClick={toggleGameMusic}
              className="app-header-nav-btn min-h-[40px] rounded px-2 py-2 sm:min-h-[32px] sm:px-2.5 sm:py-1.5"
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
                className="music-volume-slider music-volume-slider-mobile"
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
            className="app-header-nav-btn min-h-[40px] rounded px-2 py-2 sm:min-h-[32px] sm:px-2.5 sm:py-1.5"
          >
            HELP
          </button>
          <button
            type="button"
            onClick={() => setShowBlackMarket(true)}
            className="app-header-nav-btn min-h-[40px] rounded px-2 py-2 sm:min-h-[32px] sm:px-2.5 sm:py-1.5"
          >
            BLACK MARKET
          </button>
          {walletAddress ? (
            <button
              type="button"
              onClick={() => setShowDashboard(true)}
              className="app-header-nav-btn min-h-[40px] rounded px-2 py-2 sm:min-h-[32px] sm:px-2.5 sm:py-1.5"
            >
              DASHBOARD
            </button>
          ) : (
            <ConnectWalletButton />
          )}
        </div>
      </header>

      {/* Main Content: mobile = scrollable column (no overlap); sm+ = row, no scroll */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-1.5 overflow-x-hidden overflow-y-auto p-1.5 sm:flex-row sm:gap-3 sm:overflow-hidden sm:p-3">
        <section className="arena-section flex min-h-0 min-w-0 flex-shrink-0 flex-col gap-1.5 overflow-hidden sm:min-h-0 sm:flex-1 sm:flex-row sm:gap-3">
          <GameArenaDecor />
          <div className="flex min-h-[220px] min-w-0 max-w-full flex-shrink-0 items-center justify-center overflow-hidden overflow-x-hidden bg-[var(--bg-dark)] px-1.5 pt-1 pb-1.5 sm:min-h-0 sm:flex-1 sm:px-3 sm:pt-1.5 sm:pb-2">
            <GameCanvas />
          </div>
        </section>
        <aside className="flex min-w-0 shrink-0 flex-col gap-1.5 sm:w-64 sm:min-w-[16rem] sm:gap-3 lg:w-72">
          <div className="game-box shrink-0 px-1.5 py-1.5 sm:px-3 sm:py-3">
            <CharacterPicker
              selectedId={selectedCharacterId}
              onSelect={setSelectedCharacterId}
              compact
            />
          </div>
          <div className="game-box flex min-h-[100px] min-w-0 flex-shrink-0 flex-col overflow-hidden px-1.5 py-1.5 sm:min-h-0 sm:flex-1 sm:px-3 sm:py-3">
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
      <footer className="flex shrink-0 justify-center border-t border-white/10 px-2 py-1 sm:px-3 sm:py-1.5">
        <span className="font-mono text-[10px] text-gray-400 sm:text-xs">
          created by reamesor <span className="text-gray-500">· v2</span>
        </span>
      </footer>
    </main>
  );
}
