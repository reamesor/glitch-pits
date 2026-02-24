"use client";

import { DailySpinPanel } from "@/components/DailySpinPanel";
import { SnakePanel } from "@/components/SnakePanel";

/** Left panel: Daily Spin and Snake always visible, no buttons to open. */
export function GameArenaDecor() {
  return (
    <aside
      className="arena-decor relative flex min-h-0 w-[150px] shrink-0 flex-col gap-3 overflow-y-auto border-r border-[var(--glitch-pink)]/25 bg-[var(--bg-darker)]/80 py-3 px-2 sm:w-72 sm:py-4 sm:px-3 lg:w-80"
    >
      <div className="arena-decor-grid pointer-events-none absolute inset-0 opacity-[0.06]" aria-hidden />
      <div className="relative z-10 w-full shrink-0">
        <DailySpinPanel />
      </div>
      <div className="relative z-10 min-h-0 w-full flex-1 flex flex-col min-h-[200px]">
        <SnakePanel />
      </div>
    </aside>
  );
}
