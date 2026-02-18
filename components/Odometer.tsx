"use client";

import { useEffect, useState } from "react";

/** Single digit with rolling animation when value changes */
function OdometerDigit({ digit, keyId }: { digit: string; keyId: string }) {
  const [display, setDisplay] = useState(digit);
  const [rolling, setRolling] = useState(false);

  useEffect(() => {
    if (digit !== display) {
      setRolling(true);
      const t = setTimeout(() => {
        setDisplay(digit);
        setRolling(false);
      }, 120);
      return () => clearTimeout(t);
    }
  }, [digit, display]);

  return (
    <span
      key={keyId}
      className={`inline-flex h-14 w-8 items-center justify-center rounded border border-zinc-700 bg-zinc-900 font-mono text-3xl tabular-nums transition-transform duration-150 sm:h-16 sm:w-10 sm:text-4xl ${
        rolling ? "animate-roll-up" : ""
      }`}
      style={{ color: "var(--glitch-teal)", textShadow: "0 0 8px rgba(0, 212, 170, 0.4)" }}
    >
      {display}
    </span>
  );
}

export function Odometer({ value }: { value: number }) {
  const str = Math.max(0, value).toLocaleString();
  const digits = str.split("");

  return (
    <div className="flex flex-wrap justify-center gap-1 font-mono">
      {digits.map((char, i) => (
        <OdometerDigit key={i} digit={char} keyId={`${i}`} />
      ))}
    </div>
  );
}
