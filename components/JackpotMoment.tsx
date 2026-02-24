"use client";

import { useEffect, useState } from "react";

interface JackpotMomentProps {
  payout: number;
  onDone: () => void;
  durationMs?: number;
}

export function JackpotMoment({ payout, onDone, durationMs = 2800 }: JackpotMomentProps) {
  const [visible, setVisible] = useState(true);
  const [flash, setFlash] = useState(true);

  useEffect(() => {
    const tFlash = setTimeout(() => setFlash(false), 400);
    const tDone = setTimeout(() => {
      setVisible(false);
      onDone();
    }, durationMs);
    return () => {
      clearTimeout(tFlash);
      clearTimeout(tDone);
    };
  }, [onDone, durationMs]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[99] flex items-center justify-center p-4 sm:p-6"
      style={{ backgroundColor: "rgba(0,0,0,0.82)" }}
      aria-live="polite"
      role="dialog"
      aria-modal="true"
    >
      {/* Flash: subtle, doesn’t obscure content behind */}
      <div
        className={`pointer-events-none absolute inset-0 transition-opacity duration-300 ${
          flash ? "opacity-100" : "opacity-0"
        }`}
        style={{
          background: "radial-gradient(ellipse 70% 70% at 50% 50%, rgba(255,215,0,0.25) 0%, rgba(255,105,180,0.12) 40%, transparent 70%)",
        }}
      />
      {/* Jackpot card — contained so it doesn’t overlap; clear layer above scrim */}
      <div
        className="relative z-10 font-pixel text-center jackpot-pop-in w-full max-w-xs rounded-lg border-2 px-6 py-5 sm:max-w-sm sm:px-8 sm:py-6"
        style={{
          background: "linear-gradient(145deg, rgba(16,10,22,0.98) 0%, rgba(32,18,42,0.98) 100%)",
          borderColor: "var(--glitch-gold)",
          boxShadow: "0 0 0 1px rgba(255,105,180,0.4), 0 0 32px rgba(255,215,0,0.2), 0 8px 32px rgba(0,0,0,0.5)",
        }}
      >
        <p
          className="glitch-text mb-1 text-lg sm:text-xl md:text-2xl uppercase tracking-wider"
          data-text="BIG WIN"
          style={{
            color: "var(--glitch-gold)",
            textShadow: "0 0 16px rgba(255,215,0,0.7), 0 0 24px rgba(255,105,180,0.3)",
          }}
        >
          BIG WIN
        </p>
        <p
          className="text-xl sm:text-2xl md:text-3xl tabular-nums font-bold"
          style={{
            color: "var(--glitch-teal)",
            textShadow: "0 0 12px rgba(0,212,170,0.8)",
          }}
        >
          +{payout.toLocaleString()} PITS
        </p>
        <p className="mt-1 text-[10px] sm:text-xs text-gray-400 uppercase">Jackpot round</p>
      </div>
    </div>
  );
}
