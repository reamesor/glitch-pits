"use client";

interface VictoryCongratsProps {
  name: string;
  amount: number;
  onClose: () => void;
}

export function VictoryCongrats({ name, amount, onClose }: VictoryCongratsProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0a0a0a]/98">
      {/* Scanline overlay for glitchy victory */}
      <div
        className="pointer-events-none absolute inset-0 z-[101] opacity-40"
        style={{
          background: "linear-gradient(rgba(18,16,16,0) 50%, rgba(0,0,0,0.3) 50%), linear-gradient(90deg, rgba(255,0,0,.08), rgba(0,255,255,.06))",
          backgroundSize: "100% 4px, 3px 100%",
        }}
      />
      <div className="relative max-w-lg font-pixel">
        <div
          className="border-4 border-[#ffd700] p-8"
          style={{
            backgroundColor: "rgba(255, 215, 0, 0.08)",
            boxShadow: "0 0 60px rgba(255, 215, 0, 0.3), 0 0 20px var(--g-red)",
          }}
        >
          <p
            className="glitch-text mb-4 text-center text-2xl"
            data-text="🏆 YOU WON 🏆"
            style={{ color: "#ffd700" }}
          >
            🏆 YOU WON 🏆
          </p>
          <p className="mb-6 text-center text-base text-white">
            Bet vs House — payout
          </p>
          <p
            className="glitch-text mb-8 text-center text-xl font-semibold sm:text-2xl"
            style={{ color: "#ffd700" }}
          >
            {amount.toLocaleString()} PITS
          </p>
          <p className="mb-6 text-center text-sm text-gray-500">
            — Where are your gods now? —
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full border-4 border-[#ffd700] px-6 py-4 font-pixel text-sm text-[#ffd700] transition hover:bg-[#ffd700]/20"
          >
            START REVENGE
          </button>
        </div>
      </div>
    </div>
  );
}
