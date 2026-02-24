"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useGameStore } from "@/lib/useGameStore";

const ORB_COLORS = ["#ff2d78", "#00ffff", "#c800ff", "#f5c518"] as const;
const ORB_SIZE_PX = 20;
const SPAWN_INTERVAL_MS = 1500;
const ORB_LIFETIME_MS = 4000;
const MAX_ORBS = 8;
const POP_REWARD = 0.01;
const FLOAT_TEXT_DURATION_MS = 800;

interface Orb {
  id: string;
  x: number; // percentage 0-100
  colorIndex: number;
  spawnTime: number;
  missed?: boolean;
}

interface FloatText {
  id: string;
  x: number;
  y: number;
}

export function GlitchPopper() {
  const addToBalance = useGameStore((s) => s.addToBalance);
  const playAreaRef = useRef<HTMLDivElement>(null);

  const [orbs, setOrbs] = useState<Orb[]>([]);
  const [popped, setPopped] = useState(0);
  const [earned, setEarned] = useState(0);
  const [floatTexts, setFloatTexts] = useState<FloatText[]>([]);
  const spawnCounterRef = useRef(0);

  const removeOrb = useCallback((id: string) => {
    setOrbs((prev) => prev.filter((o) => o.id !== id));
  }, []);

  const handleOrbClick = useCallback(
    (orb: Orb, e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation();
      removeOrb(orb.id);
      addToBalance(POP_REWARD);
      setPopped((p) => p + 1);
      setEarned((e) => e + POP_REWARD);

      const el = e.currentTarget;
      const playArea = playAreaRef.current;
      if (playArea) {
        const rect = el.getBoundingClientRect();
        const areaRect = playArea.getBoundingClientRect();
        const x = rect.left - areaRect.left + rect.width / 2;
        const y = rect.top - areaRect.top + rect.height / 2;
        const id = `ft-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        setFloatTexts((prev) => [...prev, { id, x, y }]);
        setTimeout(() => {
          setFloatTexts((prev) => prev.filter((t) => t.id !== id));
        }, FLOAT_TEXT_DURATION_MS);
      }
    },
    [addToBalance, removeOrb]
  );

  // Spawn orbs every 1.5s, max 8
  useEffect(() => {
    const t = setInterval(() => {
      setOrbs((prev) => {
        if (prev.length >= MAX_ORBS) return prev;
        spawnCounterRef.current += 1;
        return [
          ...prev,
          {
            id: `orb-${Date.now()}-${spawnCounterRef.current}`,
            x: 15 + Math.random() * 70,
            colorIndex: (spawnCounterRef.current - 1) % ORB_COLORS.length,
            spawnTime: Date.now(),
          },
        ];
      });
    }, SPAWN_INTERVAL_MS);
    return () => clearInterval(t);
  }, []);

  // Mark expired orbs as missed (red) at 3.8s, remove at 4s
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setOrbs((prev) =>
        prev
          .map((o) => {
            const age = now - o.spawnTime;
            if (age >= ORB_LIFETIME_MS) return null;
            if (age >= ORB_LIFETIME_MS - 200) return { ...o, missed: true };
            return o;
          })
          .filter((o): o is Orb => o !== null)
      );
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-full flex-col">
      <h3
        className="font-pixel glitch-text mb-3 border-b-2 border-[var(--glitch-teal)]/40 pb-2 text-sm"
        data-text="GLITCH POPPER"
        style={{ color: "#00ffff" }}
      >
        GLITCH POPPER
      </h3>

      <div className="mb-2 flex flex-wrap items-center justify-between gap-1 font-mono text-[9px] text-gray-500">
        <span>POPPED: {popped}</span>
        <span>EARNED: {earned.toFixed(2)} PITS</span>
      </div>
      <p className="mb-2 font-mono text-[8px] text-gray-600">[ CLICK THE GLITCHES ]</p>

      <div
        ref={playAreaRef}
        className="glitch-popper-play relative min-h-0 flex-1 overflow-hidden rounded border border-[var(--glitch-pink)]/20"
      >
        {orbs.map((orb) => {
          const isMissed = orb.missed === true;
          return (
            <div
              key={orb.id}
              role="button"
              tabIndex={0}
              onClick={(e) => handleOrbClick(orb, e)}
              onKeyDown={(e) => e.key === "Enter" && handleOrbClick(orb, e as unknown as React.MouseEvent<HTMLDivElement>)}
              className="glitch-popper-orb absolute cursor-pointer"
              style={{
                left: `${orb.x}%`,
                bottom: 0,
                width: ORB_SIZE_PX,
                height: ORB_SIZE_PX,
                marginLeft: -ORB_SIZE_PX / 2,
                backgroundColor: isMissed ? "#ff0000" : ORB_COLORS[orb.colorIndex],
                boxShadow: isMissed
                  ? "0 0 8px #ff0000"
                  : `0 0 6px ${ORB_COLORS[orb.colorIndex]}, inset 0 0 4px rgba(255,255,255,0.3)`,
                animation: isMissed
                  ? "glitch-popper-missed 0.2s ease-out forwards"
                  : "glitch-popper-float 4s linear forwards, glitch-popper-wobble 0.6s ease-in-out infinite, glitch-popper-flicker 0.15s ease-in-out infinite",
              }}
              aria-label="Pop glitch orb"
            />
          );
        })}

        {floatTexts.map((ft) => (
          <div
            key={ft.id}
            className="glitch-popper-float-text pointer-events-none absolute font-pixel text-[9px]"
            style={{
              left: ft.x,
              top: ft.y,
              transform: "translate(-50%, -50%)",
              color: "var(--glitch-pink)",
              textShadow: "0 0 8px var(--glitch-pink)",
            }}
          >
            +0.01 PITS
          </div>
        ))}
      </div>
    </div>
  );
}
