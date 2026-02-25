"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useGameStore } from "@/lib/useGameStore";
import { soundManager } from "@/lib/soundManager";
import { FeatureInfoIcon } from "@/components/FeatureInfoIcon";

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
      soundManager.play("ORB_POP");
      soundManager.play("PITS_CHIME");
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

  // Remove expired orbs at 4s; play ORB_MISS when orb expires (no red "missed" state so no stuck circle)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setOrbs((prev) =>
        prev
          .map((o) => {
            const age = now - o.spawnTime;
            if (age >= ORB_LIFETIME_MS) {
              soundManager.play("ORB_MISS");
              return null;
            }
            return o;
          })
          .filter((o): o is Orb => o !== null)
      );
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-full flex-col">
      <div className="panel-title-row w-full shrink-0 overflow-visible">
        <div className="flex w-full items-center gap-1.5">
          <h3
            className="font-pixel glitch-text inline-block shrink-0 text-sm"
            data-text="GLITCH POPPER"
            style={{ color: "#00ffff" }}
          >
            GLITCH POPPER
          </h3>
          <FeatureInfoIcon
            ariaLabel="How Glitch Popper works"
            content={<>Click orbs before they disappear. 0.01 PITS per pop. No stake; missed orbs don’t deduct.</>}
            className="shrink-0 text-[var(--glitch-teal)]"
          />
        </div>
        <div className="mt-1 w-full border-b-2 border-[var(--glitch-teal)]/50 pb-1.5 mb-1" aria-hidden />
      </div>

      <div className="panel-content min-h-0 flex-1 flex flex-col">
        <div className="mb-0.5 flex flex-wrap items-center justify-between gap-1.5 font-mono text-[9px] text-gray-400 sm:text-[10px]">
          <span>POPPED: {popped}</span>
          <span>EARNED: {earned.toFixed(2)} PITS</span>
        </div>
        <p className="mb-1 font-mono text-[9px] text-gray-400 sm:text-[10px]">[ CLICK THE GLITCHES ]</p>

        <div
          ref={playAreaRef}
          className="glitch-popper-play relative min-h-0 flex-1 overflow-hidden rounded border border-[var(--glitch-pink)]/20"
        >
        {orbs.map((orb) => (
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
              backgroundColor: ORB_COLORS[orb.colorIndex],
              boxShadow: `0 0 6px ${ORB_COLORS[orb.colorIndex]}, inset 0 0 4px rgba(255,255,255,0.3)`,
              animation: "glitch-popper-float 4s linear forwards, glitch-popper-wobble 0.6s ease-in-out infinite, glitch-popper-flicker 0.15s ease-in-out infinite",
            }}
            aria-label="Pop glitch orb"
          />
        ))}

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
    </div>
  );
}
