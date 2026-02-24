"use client";

import { useState, useEffect } from "react";
import { GlitchPitsLogo } from "@/components/GlitchPitsLogo";
import { PixelCharacter } from "@/components/PixelCharacter";
import { CHARACTER_PRESETS } from "@/lib/characterPresets";
import { startLandingSound, stopLandingSound } from "@/lib/landingSound";

const LANDING_SOUND_MUTED_KEY = "glitch-pits-landing-sound-muted";

interface LandingPageProps {
  onEnter: () => void;
  onEnterFunMode?: () => void;
  onOpenHelp: () => void;
  onOpenDashboard: () => void;
  hasWallet: boolean;
}

/* Scattered positions for Mememator-style background characters (all presets) */
const FLOATING_CHARS = CHARACTER_PRESETS.map((preset, i) => {
  const positions = [
    "left-[6%] top-[12%]", "right-[8%] top-[14%]", "left-[15%] top-[28%]", "right-[12%] top-[25%]",
    "left-[8%] bottom-[28%]", "right-[6%] bottom-[22%]", "left-[18%] bottom-[15%]", "right-[14%] bottom-[30%]",
    "left-[3%] top-[45%]", "right-[4%] top-[55%]", "left-[10%] top-[70%]", "right-[9%] top-[75%]",
    "left-[22%] top-[8%]", "right-[20%] top-[10%]", "left-[25%] bottom-[8%]", "right-[22%] bottom-[12%]",
  ];
  return { id: preset.id, position: positions[i % positions.length], scale: i % 3 === 0 ? "scale-100" : i % 3 === 1 ? "scale-125" : "scale-75", delay: i * 0.35 };
});

export function LandingPage({
  onEnter,
  onEnterFunMode,
  onOpenHelp,
  onOpenDashboard,
  hasWallet,
}: LandingPageProps) {
  const [muted, setMuted] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem(LANDING_SOUND_MUTED_KEY) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!muted) startLandingSound();
    else stopLandingSound();
    return () => stopLandingSound();
  }, [muted]);

  const toggleMute = () => {
    setMuted((m) => {
      const next = !m;
      try {
        localStorage.setItem(LANDING_SOUND_MUTED_KEY, next ? "1" : "0");
      } catch {}
      return next;
    });
  };

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[#050505]">
      {/* Mememator-style starfield background */}
      <div className="landing-starfield pointer-events-none absolute inset-0 opacity-75" aria-hidden />

      {/* Top nav - minimal like DGB / COLORS */}
      <header className="relative z-20 flex shrink-0 items-center justify-end px-4 py-3 sm:px-6">
        <nav className="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={toggleMute}
            className="landing-nav-btn font-mono text-[10px] text-gray-500 transition-colors hover:text-white sm:text-xs"
            title={muted ? "Unmute landing sound" : "Mute landing sound"}
          >
            {muted ? "SOUND OFF" : "SOUND ON"}
          </button>
          <button
            type="button"
            onClick={onOpenHelp}
            className="landing-nav-btn font-mono text-[10px] text-gray-500 transition-colors hover:text-white sm:text-xs"
          >
            HELP
          </button>
          {hasWallet && (
            <button
              type="button"
              onClick={onOpenDashboard}
              className="landing-nav-btn font-mono text-[10px] text-gray-500 transition-colors hover:text-white sm:text-xs"
            >
              DASHBOARD
            </button>
          )}
        </nav>
      </header>

      {/* Center: COLORS-style glow + title + Mememator-style Enter */}
      <div className="relative flex flex-1 flex-col items-center justify-center px-4">
        {/* Scattered pixel characters - Mememator-style, interactive */}
        {FLOATING_CHARS.map(({ id, position, scale, delay }) => (
          <div
            key={`${id}-${position}`}
            className={`landing-character absolute ${position} ${scale}`}
            style={{ animationDelay: `${delay}s` }}
            role="img"
            aria-label={CHARACTER_PRESETS.find((p) => p.id === id)?.name ?? "Character"}
          >
            <PixelCharacter
              characterId={id}
              animated
              size="lg"
              className="scale-100 sm:scale-125"
            />
          </div>
        ))}

        {/* COLORS-style neon streak behind title */}
        <div className="landing-neon-streak" aria-hidden />

        {/* Main title + tagline - DGB bold, Mememator clarity */}
        <div className="relative z-10 flex flex-col items-center gap-3">
          <h1 className="text-center">
            <GlitchPitsLogo size="xl" />
          </h1>
          <p className="max-w-sm text-center font-mono text-xs text-gray-500 sm:text-sm">
            Stake your PITS. Multiply or burn. No middle ground.
          </p>
          {/* CTAs: identical size for both buttons */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            {onEnterFunMode && (
              <div className="relative group">
                <button
                  type="button"
                  onClick={onEnterFunMode}
                  className="landing-cta-accent landing-cta-same-size pixel-btn pixel-btn-accent w-[220px] py-2.5 font-pixel text-[9px] sm:text-[10px]"
                  title="Play with virtual PITS, no wallet connection"
                >
                  TRY DEMO (FUN MODE)
                </button>
                <div
                  role="tooltip"
                  className="pointer-events-none absolute top-full left-1/2 z-30 mt-2 -translate-x-1/2 rounded border-2 border-[var(--glitch-pink)]/50 bg-[var(--bg-darker)] px-3 py-2 font-mono text-[10px] text-gray-300 opacity-0 shadow-[0_0_20px_rgba(255,105,180,0.2)] transition-opacity duration-200 group-hover:opacity-100 sm:text-xs"
                  style={{ width: "max-content", maxWidth: "min(260px, 90vw)" }}
                >
                  New? Try the demo first — no wallet required.
                  <span className="absolute bottom-full left-1/2 h-0 w-0 -translate-x-1/2 border-8 border-transparent border-b-[var(--bg-darker)]" style={{ marginBottom: "2px" }} aria-hidden />
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={onEnter}
              className="landing-cta-wallet landing-cta-same-size pixel-btn w-[220px] py-2.5 font-pixel text-[9px] sm:text-[10px]"
              title="Connect wallet to play with real PITS"
            >
              ENTER WITH WALLET
            </button>
          </div>
        </div>
      </div>

      {/* Footer - DGB style, compact */}
      <footer className="relative z-20 flex shrink-0 items-center justify-between border-t border-white/10 px-4 py-3 sm:px-6">
        <span className="font-mono text-[9px] text-gray-500 sm:text-[10px]">
          ৲ All in. Win or burn.
        </span>
        <span className="font-mono text-[9px] text-gray-500 sm:text-[10px]">
          Where are your gods now?
        </span>
        <span className="font-mono text-[9px] text-gray-500 sm:text-[10px]">
          Glitch Pits · Try demo above · reamesor
        </span>
      </footer>
    </div>
  );
}
