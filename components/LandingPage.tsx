"use client";

import { GlitchPitsLogo } from "@/components/GlitchPitsLogo";
import { PixelCharacter } from "@/components/PixelCharacter";
import { CHARACTER_PRESETS } from "@/lib/characterPresets";

interface LandingPageProps {
  onEnter: () => void;
  onOpenHelp: () => void;
  onOpenBlackMarket: () => void;
  onOpenDashboard: () => void;
  onOpenConnectWallet: () => void;
  hasWallet: boolean;
}

const FLOATING_CHARS = [
  { id: CHARACTER_PRESETS[0].id, position: "top-left" },
  { id: CHARACTER_PRESETS[1].id, position: "top-right" },
  { id: CHARACTER_PRESETS[3].id, position: "bottom-left" },
  { id: CHARACTER_PRESETS[4].id, position: "bottom-right" },
  { id: CHARACTER_PRESETS[5].id, position: "mid-left" },
  { id: CHARACTER_PRESETS[6].id, position: "mid-right" },
];

const positionClasses: Record<string, string> = {
  "top-left": "left-[8%] top-[18%]",
  "top-right": "right-[10%] top-[20%]",
  "bottom-left": "left-[12%] bottom-[22%]",
  "bottom-right": "right-[8%] bottom-[18%]",
  "mid-left": "left-[5%] top-1/2 -translate-y-1/2",
  "mid-right": "right-[5%] top-1/2 -translate-y-1/2",
};

export function LandingPage({
  onEnter,
  onOpenHelp,
  onOpenBlackMarket,
  onOpenDashboard,
  onOpenConnectWallet,
  hasWallet,
}: LandingPageProps) {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[var(--bg-darker)]">
      {/* Top nav - minimal like DGB */}
      <header className="flex shrink-0 items-center justify-between px-6 py-4">
        <div className="opacity-90">
          <GlitchPitsLogo size="sm" />
        </div>
        <nav className="flex items-center gap-4">
          <button
            type="button"
            onClick={onOpenHelp}
            className="font-mono text-xs text-gray-400 transition hover:text-white"
          >
            HELP
          </button>
          <button
            type="button"
            onClick={onOpenBlackMarket}
            className="font-mono text-xs text-gray-400 transition hover:text-white"
          >
            BLACK MARKET
          </button>
          {hasWallet ? (
            <button
              type="button"
              onClick={onOpenDashboard}
              className="font-mono text-xs text-gray-400 transition hover:text-white"
            >
              DASHBOARD
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenConnectWallet}
              className="font-mono text-xs text-[var(--glitch-teal)] transition hover:opacity-90"
            >
              CONNECT WALLET
            </button>
          )}
        </nav>
      </header>

      {/* Center: big title + floating characters */}
      <div className="relative flex flex-1 flex-col items-center justify-center px-4">
        {/* Floating pixel characters - interactive, DGB-style */}
        {FLOATING_CHARS.map(({ id, position }, i) => (
          <div
            key={`${id}-${position}`}
            className={`landing-character absolute ${positionClasses[position]}`}
            style={{ animationDelay: `${i * 0.5}s` }}
            role="img"
            aria-label={CHARACTER_PRESETS.find((p) => p.id === id)?.name ?? "Character"}
          >
            <PixelCharacter
              characterId={id}
              animated
              size="lg"
              className="scale-150 sm:scale-[2] md:scale-[2.5]"
            />
          </div>
        ))}

        {/* Main title */}
        <div className="relative z-10 flex flex-col items-center gap-4">
          <h1 className="text-center">
            <GlitchPitsLogo size="xl" />
          </h1>
          <p className="max-w-md text-center font-mono text-sm text-gray-500 sm:text-base">
            Where the House holds the line. You hold the tokens.
          </p>
          <button
            type="button"
            onClick={onEnter}
            className="pixel-btn pixel-btn-accent pixel-btn-interactive mt-4 font-pixel text-xs sm:text-sm"
          >
            ENTER THE PITS
          </button>
        </div>
      </div>

      {/* Footer - DGB style */}
      <footer className="flex shrink-0 items-center justify-between border-t border-white/10 px-6 py-4">
        <span className="font-mono text-[10px] text-gray-600 sm:text-xs">
          ৲ 50/50 · Bet. Win or burn.
        </span>
        <span className="font-mono text-[10px] text-gray-600 sm:text-xs">
          Where are your gods now?
        </span>
        <span className="font-mono text-[10px] uppercase tracking-wider text-gray-600 sm:text-xs">
          Glitch Pits
        </span>
      </footer>
    </div>
  );
}
