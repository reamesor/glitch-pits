"use client";

import { useState, useEffect, useCallback } from "react";
import { useGameStore } from "@/lib/useGameStore";

const DAILY_SPIN_KEY = "glitch-pits-daily-spin";
const SYMBOLS = ["💀", "★", "◎", "⚡"]; // skull, star, coin, lightning
const REWARDS = { three: 50, two: 25, none: 10 };
const REEL_SPIN_MS = 2500;
const REEL_STAGGER_MS = 400;

function getStorageKey(): string {
  if (typeof window === "undefined") return "session";
  try {
    const wallet = useGameStore.getState().walletAddress;
    if (wallet) return wallet.toLowerCase().slice(0, 20);
    let sid = sessionStorage.getItem("glitch-pits-session-id");
    if (!sid) {
      sid = "s-" + Math.random().toString(36).slice(2, 12);
      sessionStorage.setItem("glitch-pits-session-id", sid);
    }
    return sid;
  } catch {
    return "session";
  }
}

function getLastSpinDate(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(DAILY_SPIN_KEY + "-" + getStorageKey());
  } catch {
    return null;
  }
}

function setLastSpinDate(dateStr: string) {
  try {
    localStorage.setItem(DAILY_SPIN_KEY + "-" + getStorageKey(), dateStr);
  } catch {}
}

function isSameDay(a: string, b: string): boolean {
  return a.slice(0, 10) === b.slice(0, 10);
}

function msUntilMidnight(): number {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow.getTime() - now.getTime();
}

interface DailySpinPanelProps {
  onClose: () => void;
}

export function DailySpinPanel({ onClose }: DailySpinPanelProps) {
  const addToBalance = useGameStore((s) => s.addToBalance);
  const [spinning, setSpinning] = useState(false);
  const [reels, setReels] = useState<number[]>([0, 0, 0]);
  const [displayReels, setDisplayReels] = useState<number[]>([0, 0, 0]);
  const [result, setResult] = useState<number | null>(null);
  const [lastSpinDate, setLastSpinDateState] = useState<string | null>(null);
  const [msLeft, setMsLeft] = useState(0);

  const canSpin = lastSpinDate === null || !isSameDay(lastSpinDate, new Date().toISOString());

  useEffect(() => {
    setLastSpinDateState(getLastSpinDate());
  }, []);

  useEffect(() => {
    if (!canSpin) {
      const update = () => setMsLeft(msUntilMidnight());
      update();
      const t = setInterval(update, 1000);
      return () => clearInterval(t);
    }
  }, [canSpin]);

  const spin = useCallback(() => {
    if (spinning || !canSpin) return;
    setSpinning(true);
    setResult(null);
    const final = [Math.floor(Math.random() * 4), Math.floor(Math.random() * 4), Math.floor(Math.random() * 4)];
    setReels(final);

    const start = Date.now();
    const iv = setInterval(() => {
      const elapsed = Date.now() - start;
      setDisplayReels([
        elapsed < REEL_SPIN_MS ? Math.floor((elapsed / 80) % 4) : final[0],
        elapsed < REEL_SPIN_MS + REEL_STAGGER_MS ? Math.floor((elapsed / 80) % 4) : final[1],
        elapsed < REEL_SPIN_MS + REEL_STAGGER_MS * 2 ? Math.floor((elapsed / 80) % 4) : final[2],
      ]);
    }, 80);

    const done = REEL_SPIN_MS + REEL_STAGGER_MS * 2 + 200;
    setTimeout(() => {
      clearInterval(iv);
      setDisplayReels(final);
      const counts: Record<number, number> = {};
      final.forEach((s) => { counts[s] = (counts[s] ?? 0) + 1; });
      const max = Math.max(...Object.values(counts));
      const reward = max >= 3 ? REWARDS.three : max >= 2 ? REWARDS.two : REWARDS.none;
      addToBalance(reward);
      setResult(reward);
      setLastSpinDateState(new Date().toISOString());
      setLastSpinDate(new Date().toISOString());
      setSpinning(false);
    }, done);
  }, [canSpin, spinning, addToBalance]);

  const formatCountdown = (ms: number) => {
    const s = Math.floor(ms / 1000) % 60;
    const m = Math.floor(ms / 60000) % 60;
    const h = Math.floor(ms / 3600000);
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="daily-spin-panel rounded border-2 border-[var(--glitch-pink)]/40 bg-[var(--bg-card)] p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-pixel text-[8px] text-[var(--glitch-pink)]">DAILY SPIN</span>
        <button
          type="button"
          onClick={onClose}
          className="font-mono text-[8px] text-gray-500 hover:text-white"
          aria-label="Close"
        >
          CLOSE
        </button>
      </div>
      {!canSpin ? (
        <div className="py-4 text-center">
          <p className="font-pixel text-[8px] text-gray-400">COME BACK TOMORROW</p>
          <p className="mt-2 font-mono text-[10px] tabular-nums text-[var(--glitch-teal)]">{formatCountdown(msLeft)}</p>
        </div>
      ) : (
        <>
          <div className="mb-2 flex justify-center gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="flex h-10 w-10 items-center justify-center rounded border-2 border-[var(--glitch-pink)]/50 bg-[var(--bg-darker)] text-xl"
              >
                {SYMBOLS[displayReels[i]]}
              </div>
            ))}
          </div>
          {result !== null && (
            <p className="mb-2 text-center font-pixel text-[9px] animate-pulse" style={{ color: "var(--glitch-pink)" }}>
              YOU WON {result} PITS
            </p>
          )}
          <button
            type="button"
            onClick={spin}
            disabled={spinning}
            className="w-full rounded border-2 border-[var(--glitch-pink)] bg-[var(--glitch-pink)]/20 py-1.5 font-pixel text-[8px] text-white hover:border-[var(--glitch-teal)] hover:bg-[var(--g-blue)]/80 hover:text-[#0a0a0a] disabled:opacity-50"
          >
            {spinning ? "SPINNING…" : "SPIN"}
          </button>
        </>
      )}
    </div>
  );
}
