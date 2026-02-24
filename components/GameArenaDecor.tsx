"use client";

import { DailySpinPanel } from "@/components/DailySpinPanel";
import { SnakePanel } from "@/components/SnakePanel";

/** Left panel: Daily Spin and Snake always visible, no buttons to open. */
export function GameArenaDecor() {
  return (
    <aside
      className="arena-decor relative flex min-h-0 w-[150px] shrink-0 flex-col gap-2 overflow-y-auto border-r border-[var(--glitch-pink)]/25 bg-[var(--bg-darker)]/80 py-2 px-1.5 sm:w-72 sm:py-3 sm:px-2 lg:w-80"
    >
      <div className="arena-decor-grid pointer-events-none absolute inset-0 opacity-[0.06]" aria-hidden />
      <div className="relative z-10 shrink-0">
        <DailySpinPanel />
      </div>
      <div className="relative z-10 shrink-0">
        <SnakePanel />
      </div>
    </aside>
  );
}
