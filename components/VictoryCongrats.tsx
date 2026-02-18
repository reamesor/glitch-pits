"use client";

interface VictoryCongratsProps {
  name: string;
  amount: number;
  onClose: () => void;
}

export function VictoryCongrats({ name, amount, onClose }: VictoryCongratsProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95">
      <div
        className="relative max-w-lg animate-pulse"
        style={{
          fontFamily: "'Press Start 2P', monospace",
        }}
      >
        <div
          className="border-4 border-[#ffd700] p-8"
          style={{
            backgroundColor: "rgba(255, 215, 0, 0.1)",
            boxShadow: "0 0 60px rgba(255, 215, 0, 0.3)",
          }}
        >
          <p className="mb-4 text-center text-2xl" style={{ color: "#ffd700" }}>
            🏆 YOU HAVE KILLED ALL 🏆
          </p>
          <p className="mb-6 text-center text-sm text-white">
            You took all the betting amounts
          </p>
          <p className="mb-8 text-center text-lg" style={{ color: "#ffd700" }}>
            {amount.toLocaleString()} PITS
          </p>
          <p className="mb-6 text-center text-xs text-gray-500">
            — Where are your gods now? —
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full border-4 border-[#ffd700] px-6 py-4 font-pixel text-xs text-[#ffd700] transition hover:bg-[#ffd700]/20"
          >
            CONTINUE
          </button>
        </div>
      </div>
    </div>
  );
}
