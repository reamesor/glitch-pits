"use client";

interface VictoryCongratsProps {
  name: string;
  amount: number;
  onClose: () => void;
}

export function VictoryCongrats({ name, amount, onClose }: VictoryCongratsProps) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      style={{ backgroundColor: "rgba(0,0,0,0.88)" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="victory-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Scrim: clearly dims everything behind so the popup doesn’t feel like it’s overlapping */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "linear-gradient(rgba(18,16,16,0) 50%, rgba(0,0,0,0.25) 50%), linear-gradient(90deg, rgba(255,0,0,.06), rgba(0,255,255,.04))",
          backgroundSize: "100% 4px, 3px 100%",
        }}
      />
      {/* Contained card — doesn’t bleed to edges; stays in center */}
      <div className="relative z-10 w-full max-w-sm font-pixel sm:max-w-md">
        <div
          className="rounded-lg border-2 border-[#ffd700] p-6 sm:p-8"
          style={{
            backgroundColor: "rgba(12,10,14,0.98)",
            boxShadow: "0 0 0 1px rgba(255,105,180,0.3), 0 0 40px rgba(255, 215, 0, 0.2), 0 8px 32px rgba(0,0,0,0.6)",
          }}
        >
          <p
            id="victory-title"
            className="glitch-text mb-3 text-center text-xl sm:text-2xl"
            data-text="🏆 YOU WON 🏆"
            style={{ color: "#ffd700" }}
          >
            🏆 YOU WON 🏆
          </p>
          <p className="mb-4 text-center text-sm text-gray-400">
            Bet vs House — payout
          </p>
          <p
            className="glitch-text mb-6 text-center text-lg font-semibold sm:text-xl"
            style={{ color: "#ffd700" }}
          >
            {amount.toLocaleString()} PITS
          </p>
          <p className="mb-6 text-center text-xs text-gray-500">
            — Where are your gods now? —
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded border-2 border-[#ffd700] px-4 py-3 font-pixel text-sm text-[#ffd700] transition hover:bg-[#ffd700]/15 focus:outline-none focus:ring-2 focus:ring-[#ffd700]/50"
          >
            START REVENGE
          </button>
        </div>
      </div>
    </div>
  );
}
