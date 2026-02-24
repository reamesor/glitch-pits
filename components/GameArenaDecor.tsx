"use client";

import { useState } from "react";
import { PixelCharacter } from "@/components/PixelCharacter";
import { CHARACTER_PRESETS } from "@/lib/characterPresets";
import { DailySpinPanel } from "@/components/DailySpinPanel";
import { SnakePanel } from "@/components/SnakePanel";

/** Left panel: decorative content + optional Daily Spin and Snake (collapsed by default). */
export function GameArenaDecor() {
  const presets = CHARACTER_PRESETS.slice(0, 5);
  const [dailySpinOpen, setDailySpinOpen] = useState(false);
  const [snakeOpen, setSnakeOpen] = useState(false);

  return (
    <aside
      className="arena-decor relative hidden min-h-0 w-[140px] shrink-0 flex-col items-center gap-4 overflow-y-auto border-r-2 border-[var(--glitch-pink)]/30 bg-[var(--bg-darker)]/80 py-4 md:flex lg:w-[180px]"
    >
      <div className="arena-decor-grid pointer-events-none absolute inset-0 opacity-[0.06]" aria-hidden />
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

      <div className="relative z-10 flex w-full flex-col gap-2 px-2">
        <button
          type="button"
          onClick={() => { setDailySpinOpen((o) => !o); setSnakeOpen(false); }}
          className="arena-sidebar-btn w-full rounded border-2 border-[var(--glitch-pink)]/50 bg-[var(--bg-card)]/80 py-1.5 font-mono text-[8px] text-gray-400 transition hover:border-[var(--glitch-pink)] hover:bg-[var(--glitch-pink)]/10 hover:text-white hover:shadow-[0_0_12px_rgba(255,105,180,0.3)]"
        >
          [ DAILY SPIN ]
        </button>
        <button
          type="button"
          onClick={() => { setSnakeOpen((o) => !o); setDailySpinOpen(false); }}
          className="arena-sidebar-btn w-full rounded border-2 border-[var(--glitch-pink)]/50 bg-[var(--bg-card)]/80 py-1.5 font-mono text-[8px] text-gray-400 transition hover:border-[var(--glitch-pink)] hover:bg-[var(--glitch-pink)]/10 hover:text-white hover:shadow-[0_0_12px_rgba(255,105,180,0.3)]"
        >
          [ PLAY SNAKE ]
        </button>
      </div>

      {dailySpinOpen && (
        <div className="relative z-10 w-full shrink-0 px-2">
          <DailySpinPanel onClose={() => setDailySpinOpen(false)} />
        </div>
      )}
      {snakeOpen && (
        <div className="relative z-10 w-full shrink-0 px-2">
          <SnakePanel onClose={() => setSnakeOpen(false)} />
        </div>
      )}
    </aside>
  );
}
