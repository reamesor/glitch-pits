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
      className="fixed inset-0 z-[99] flex items-center justify-center pointer-events-none"
      aria-live="polite"
    >
      {/* Flash overlay */}
      <div
        className={`absolute inset-0 transition-opacity duration-300 ${
          flash ? "opacity-90" : "opacity-0"
        }`}
        style={{
          background: "radial-gradient(ellipse 80% 80% at 50% 50%, rgba(255,215,0,0.4) 0%, rgba(255,105,180,0.2) 50%, transparent 70%)",
        }}
      />
      {/* Jackpot card */}
      <div className="relative font-pixel text-center jackpot-pop-in">
        <p
          className="glitch-text text-xl sm:text-2xl md:text-3xl uppercase tracking-wider mb-1"
          data-text="BIG WIN"
          style={{
            color: "var(--glitch-gold)",
            textShadow: "0 0 20px rgba(255,215,0,0.8), 0 0 40px rgba(255,105,180,0.4)",
          }}
        >
          BIG WIN
        </p>
        <p
          className="text-2xl sm:text-3xl md:text-4xl tabular-nums font-bold"
          style={{
            color: "var(--glitch-teal)",
            textShadow: "0 0 16px rgba(0,212,170,0.9)",
          }}
        >
          +{payout.toLocaleString()} PITS
        </p>
        <p className="mt-1 text-[10px] sm:text-xs text-gray-400 uppercase">Jackpot round</p>
      </div>
    </div>
  );
}
