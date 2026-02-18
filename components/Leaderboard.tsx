"use client";

import { useGameStore } from "@/lib/useGameStore";

export function Leaderboard() {
  const leaderboard = useGameStore((s) => s.leaderboard);

  return (
    <div className="flex flex-col">
      <h3
        className="font-pixel glitch-text mb-3 border-b-4 border-[#4a4a4a] pb-2 text-xs"
        data-text="LAST 10 WINNERS"
        style={{ color: "var(--glitch-gold, #ffd700)" }}
      >
        LAST 10 WINNERS
      </h3>
      <div className="flex flex-1 flex-col gap-1 overflow-y-auto">
        {leaderboard.length === 0 ? (
          <p className="font-pixel text-[8px] text-gray-500">No rumbles yet.</p>
        ) : (
          leaderboard.map((entry, i) => (
            <div
              key={entry.seedId + entry.date}
              className="flex items-center justify-between border-2 border-[#4a4a4a] p-2"
              style={{ backgroundColor: "rgba(255, 215, 0, 0.05)" }}
            >
              <span className="font-pixel text-[8px] text-gray-400">#{i + 1}</span>
              <span className="font-pixel text-[8px] text-white">{entry.name}</span>
              <span className="font-pixel text-[8px]" style={{ color: "var(--glitch-teal)" }}>
                {entry.amount} PITS
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
