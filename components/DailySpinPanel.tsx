"use client";

import { useState, useEffect, useCallback } from "react";
import { useGameStore } from "@/lib/useGameStore";
import { soundManager } from "@/lib/soundManager";

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

const SPINS_PER_DAY = 3;

function getSpinData(): { date: string; count: number } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DAILY_SPIN_KEY + "-" + getStorageKey());
    if (!raw) return null;
    return JSON.parse(raw) as { date: string; count: number };
  } catch {
    return null;
  }
}

function setSpinData(dateStr: string, count: number) {
  try {
    localStorage.setItem(DAILY_SPIN_KEY + "-" + getStorageKey(), JSON.stringify({ date: dateStr, count }));
  } catch {}
}

function msUntilMidnight(): number {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow.getTime() - now.getTime();
}

interface DailySpinPanelProps {
  onClose?: () => void;
}

export function DailySpinPanel({ onClose }: DailySpinPanelProps) {
  const addToBalance = useGameStore((s) => s.addToBalance);
  const [spinning, setSpinning] = useState(false);
  const [reels, setReels] = useState<number[]>([0, 0, 0]);
  const [displayReels, setDisplayReels] = useState<number[]>([0, 0, 0]);
  const [result, setResult] = useState<number | null>(null);
  const [spinData, setSpinDataState] = useState<{ date: string; count: number } | null>(null);
  const [msLeft, setMsLeft] = useState(0);

  const today = new Date().toISOString().slice(0, 10);
  const todayData = spinData && spinData.date.slice(0, 10) === today ? spinData : null;
  const spinsUsed = todayData?.count ?? 0;
  const triesLeft = Math.max(0, SPINS_PER_DAY - spinsUsed);
  const canSpin = triesLeft > 0;

  useEffect(() => {
    setSpinDataState(getSpinData());
  }, []);

  useEffect(() => {
    if (!canSpin && spinsUsed >= SPINS_PER_DAY) {
      const update = () => setMsLeft(msUntilMidnight());
      update();
      const t = setInterval(update, 1000);
      return () => clearInterval(t);
    }
  }, [canSpin, spinsUsed]);

  const spin = useCallback(() => {
    if (spinning || !canSpin) return;
    setSpinning(true);
    setResult(null);
    soundManager.play("REEL_SPIN");
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

    setTimeout(() => soundManager.play("REEL_STOP"), REEL_SPIN_MS);
    setTimeout(() => soundManager.play("REEL_STOP"), REEL_SPIN_MS + REEL_STAGGER_MS);
    setTimeout(() => soundManager.play("REEL_STOP"), REEL_SPIN_MS + REEL_STAGGER_MS * 2);

    const done = REEL_SPIN_MS + REEL_STAGGER_MS * 2 + 200;
    setTimeout(() => {
      clearInterval(iv);
      setDisplayReels(final);
      const counts: Record<number, number> = {};
      final.forEach((s) => { counts[s] = (counts[s] ?? 0) + 1; });
      const max = Math.max(...Object.values(counts));
      const reward = max >= 3 ? REWARDS.three : max >= 2 ? REWARDS.two : REWARDS.none;
      if (max >= 3) soundManager.play("SPIN_WIN_BIG");
      else soundManager.play("SPIN_WIN_SMALL");
      addToBalance(reward);
      setResult(reward);
      const nextCount = (todayData?.count ?? 0) + 1;
      setSpinDataState({ date: new Date().toISOString().slice(0, 10), count: nextCount });
      setSpinData(new Date().toISOString().slice(0, 10), nextCount);
      setSpinning(false);
    }, done);
  }, [canSpin, spinning, addToBalance, todayData?.count]);

  const formatCountdown = (ms: number) => {
    const s = Math.floor(ms / 1000) % 60;
    const m = Math.floor(ms / 60000) % 60;
    const h = Math.floor(ms / 3600000);
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="daily-spin-panel w-full rounded border border-[var(--glitch-pink)]/40 bg-[var(--bg-card)] p-3 sm:p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-pixel text-[8px] sm:text-[9px] text-[var(--glitch-pink)]">DAILY SPIN</span>
        {onClose && (
          <button type="button" onClick={onClose} className="font-mono text-[8px] text-gray-500 hover:text-white" aria-label="Close">
            CLOSE
          </button>
        )}
      </div>
      {!canSpin ? (
        <div className="py-3 text-center">
          <p className="font-pixel text-[8px] text-gray-400">3 SPINS USED</p>
          <p className="mt-2 font-mono text-[10px] tabular-nums text-[var(--glitch-teal)]">{formatCountdown(msLeft)}</p>
        </div>
      ) : (
        <>
          <div className="mb-2 flex justify-center gap-1 sm:gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex h-12 w-12 flex-1 max-w-14 items-center justify-center rounded border-2 border-[var(--glitch-pink)]/50 bg-[var(--bg-darker)] text-2xl sm:h-14 sm:w-14 sm:text-3xl">
                {SYMBOLS[displayReels[i]]}
              </div>
            ))}
          </div>
          {result !== null && (
            <p className="mb-2 text-center font-pixel text-[9px] animate-pulse sm:text-[10px]" style={{ color: "var(--glitch-pink)" }}>
              +{result} PITS
            </p>
          )}
          <button
            type="button"
            onClick={spin}
            disabled={spinning}
            className="w-full rounded border-2 border-[var(--glitch-pink)] bg-[var(--glitch-pink)]/20 py-2 font-pixel text-[8px] text-white hover:border-[var(--glitch-teal)] hover:bg-[var(--g-blue)]/80 hover:text-[#0a0a0a] disabled:opacity-50 sm:text-[9px]"
          >
            {spinning ? "…" : `SPIN (${triesLeft} left)`}
          </button>
        </>
      )}
    </div>
  );
}
