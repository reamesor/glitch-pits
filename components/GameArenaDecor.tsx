"use client";

import { PixelCharacter } from "@/components/PixelCharacter";
import { CHARACTER_PRESETS } from "@/lib/characterPresets";

/** Decorative left panel for the game arena: fills empty space with glitch aesthetic. */
export function GameArenaDecor() {
  const presets = CHARACTER_PRESETS.slice(0, 5);
  return (
    <aside
      className="arena-decor relative hidden min-h-0 w-[140px] shrink-0 flex-col items-center justify-center gap-4 border-r-2 border-[var(--glitch-pink)]/30 bg-[var(--bg-darker)]/80 py-4 md:flex lg:w-[180px]"
      aria-hidden
    >
      <div className="arena-decor-grid pointer-events-none absolute inset-0 opacity-[0.06]" />
      <p className="relative z-10 font-pixel text-[7px] uppercase tracking-widest text-[var(--glitch-pink)]/80">
        Stake it
      </p>
      <p className="relative z-10 text-center font-mono text-[8px] leading-tight text-gray-500">
        Multiply or burn
      </p>
      <div className="relative z-10 flex flex-col items-center gap-3">
        {presets.map((p, i) => (
          <div
            key={p.id}
            className="animate-pixel-float opacity-70"
            style={{ animationDelay: `${i * 0.2}s` }}
          >
            <PixelCharacter characterId={p.id} size="sm" className="scale-75 lg:scale-90" />
          </div>
        ))}
      </div>
      <p className="relative z-10 font-mono text-[7px] text-gray-600">THE PIT</p>
    </aside>
  );
}
