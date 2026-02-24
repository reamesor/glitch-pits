"use client";

import { DailySpinPanel } from "@/components/DailySpinPanel";
import { SnakePanel } from "@/components/SnakePanel";

/** Left panel: Daily Spin and Snake always visible, no buttons to open. */
export function GameArenaDecor() {
  return (
    <aside
      className="arena-decor relative flex min-h-0 w-full shrink-0 flex-col gap-3 overflow-y-auto overflow-x-hidden border-r-0 border-b border-[var(--glitch-pink)]/25 bg-[var(--bg-darker)]/80 py-3 px-3 sm:w-72 sm:border-b-0 sm:border-r sm:py-4 sm:px-3 lg:w-80"
    >
      <div className="arena-decor-grid pointer-events-none absolute inset-0 opacity-[0.06]" aria-hidden />
      <div className="relative z-10 w-full shrink-0">
        <DailySpinPanel />
      </div>
      <div className="relative z-10 min-h-[180px] min-w-0 flex-1 flex flex-col sm:min-h-[200px]">
        <SnakePanel />
      </div>
    </aside>
  );
}
