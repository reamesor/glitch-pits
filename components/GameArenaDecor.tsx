"use client";

import { DailySpinPanel } from "@/components/DailySpinPanel";
import { SnakePanel } from "@/components/SnakePanel";

/** Left panel: Daily Spin and Snake — same structure and styling as right panel (game-box, gaps). */
export function GameArenaDecor() {
  return (
    <aside
      className="arena-decor flex min-h-0 w-full shrink-0 flex-col gap-1.5 overflow-hidden sm:w-80 sm:gap-3 lg:w-96"
    >
      <div className="game-box w-full min-h-[140px] shrink-0 px-1.5 py-1.5 sm:min-h-[160px] sm:px-3 sm:py-3">
        <DailySpinPanel />
      </div>
      <div className="game-box flex min-h-[100px] min-w-0 flex-1 flex-col overflow-hidden px-1.5 py-1.5 sm:min-h-[160px] sm:px-3 sm:py-3">
        <SnakePanel />
      </div>
    </aside>
  );
}
