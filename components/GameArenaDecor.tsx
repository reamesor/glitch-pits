"use client";

import { useState } from "react";
import { DailySpinPanel } from "@/components/DailySpinPanel";
import { SnakePanel } from "@/components/SnakePanel";

/** Left panel: Mini games (Daily Spin, Snake) only. */
export function GameArenaDecor() {
  const [dailySpinOpen, setDailySpinOpen] = useState(false);
  const [snakeOpen, setSnakeOpen] = useState(false);

  return (
    <aside
      className="arena-decor relative flex min-h-0 w-[140px] shrink-0 flex-col overflow-y-auto border-r-2 border-[var(--glitch-pink)]/30 bg-[var(--bg-darker)]/80 py-4 lg:w-[180px]"
    >
      <div className="arena-decor-grid pointer-events-none absolute inset-0 opacity-[0.06]" aria-hidden />
      {/* Mini features at TOP so they're always visible */}
      <div className="relative z-10 shrink-0 pb-3 border-b border-[var(--glitch-pink)]/20">
        <p className="mb-2 text-center font-pixel text-[6px] uppercase tracking-wider text-[var(--glitch-pink)]/60">
          Mini
        </p>
        <div className="flex w-full flex-col gap-2 px-2">
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
      </div>

      {dailySpinOpen && (
        <div className="relative z-10 w-full shrink-0 overflow-y-auto px-2 pt-2">
          <DailySpinPanel onClose={() => setDailySpinOpen(false)} />
        </div>
      )}
      {snakeOpen && (
        <div className="relative z-10 w-full shrink-0 overflow-y-auto px-2 pt-2">
          <SnakePanel onClose={() => setSnakeOpen(false)} />
        </div>
      )}
    </aside>
  );
}
