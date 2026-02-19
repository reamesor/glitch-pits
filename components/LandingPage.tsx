"use client";

import { GlitchPitsLogo } from "@/components/GlitchPitsLogo";
import { PixelCharacter } from "@/components/PixelCharacter";
import { BackgroundMusic } from "@/components/BackgroundMusic";
import { CHARACTER_PRESETS } from "@/lib/characterPresets";

interface LandingPageProps {
  onEnter: () => void;
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
  onOpenHelp,
  onOpenDashboard,
  hasWallet,
}: LandingPageProps) {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[#050505]">
      {/* Mememator-style starfield background */}
      <div className="landing-starfield pointer-events-none absolute inset-0 opacity-60" aria-hidden />

      {/* Top nav - minimal like DGB / COLORS */}
      <header className="relative z-20 flex shrink-0 items-center justify-between px-4 py-3 sm:px-6">
        <div className="opacity-90">
          <GlitchPitsLogo size="sm" />
        </div>
        <nav className="flex items-center gap-3 sm:gap-4">
          <BackgroundMusic />
          <button
            type="button"
            onClick={onOpenHelp}
            className="font-mono text-[10px] text-gray-400 transition hover:text-white sm:text-xs"
          >
            HELP
          </button>
          {hasWallet && (
            <button
              type="button"
              onClick={onOpenDashboard}
              className="font-mono text-[10px] text-gray-400 transition hover:text-white sm:text-xs"
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
          {/* Mememator-style Enter: teal border, clear CTA */}
          <button
            type="button"
            onClick={onEnter}
            className="mt-2 rounded-full border-2 border-[var(--glitch-teal)] bg-black/60 px-8 py-3 font-mono text-sm font-medium text-white transition hover:bg-[var(--glitch-teal)]/20 hover:shadow-[0_0_24px_rgba(0,212,170,0.3)] sm:text-base"
          >
            ENTER
          </button>
        </div>
      </div>

      {/* Footer - DGB style, compact */}
      <footer className="relative z-20 flex shrink-0 items-center justify-between border-t border-white/10 px-4 py-3 sm:px-6">
        <span className="font-mono text-[9px] text-gray-600 sm:text-[10px]">
          ৲ All in. Win or burn.
        </span>
        <span className="font-mono text-[9px] text-gray-600 sm:text-[10px]">
          Where are your gods now?
        </span>
        <span className="font-mono text-[9px] text-gray-500 sm:text-[10px]">
          Glitch Pits · created by reamesor
        </span>
      </footer>
    </div>
  );
}
