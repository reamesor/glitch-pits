"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useGameStore } from "@/lib/useGameStore";
import { soundManager } from "@/lib/soundManager";
import { PixelCharacter } from "@/components/PixelCharacter";
import { FeatureInfoIcon } from "@/components/FeatureInfoIcon";

const DAILY_SPIN_KEY = "glitch-pits-daily-spin";
const REEL_AVATAR_IDS = ["0", "1", "2", "3"]; // Glitch, Knight, Rogue, Mage
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
  const panelRef = useRef<HTMLDivElement>(null);
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
    <div ref={panelRef} className="daily-spin-panel flex h-full min-w-0 flex-col overflow-visible">
      <div className="panel-title-row w-full shrink-0 overflow-hidden">
        <div className="flex w-full items-center gap-1.5">
          <h3 className="daily-spin-title font-pixel glitch-text inline-block shrink-0 text-sm" data-text="DAILY SPIN" style={{ color: "#00ffff" }}>
            DAILY SPIN
          </h3>
          <FeatureInfoIcon
            ariaLabel="How Daily Spin works"
            content={
              <>
                3 free spins per day. Three matching = 50 PITS, two = 25, no match = 10. Nothing staked or burned.
              </>
            }
            className="shrink-0 text-[var(--glitch-teal)]"
            constrainToRef={panelRef}
          />
          {onClose && (
            <button type="button" onClick={onClose} className="ml-auto font-mono shrink-0 text-[9px] text-gray-400 hover:text-white" aria-label="Close">
              CLOSE
            </button>
          )}
        </div>
        <div className="mt-1 w-full border-b-2 border-[var(--glitch-teal)]/50 pb-1.5 mb-1" aria-hidden />
      </div>
      <div className="panel-content min-h-0 flex-1 flex flex-col">
        {!canSpin ? (
          <div className="py-1.5 text-center">
            <p className="font-pixel text-[9px] text-gray-300 sm:text-[10px]">3 SPINS USED</p>
            <p className="mt-0.5 font-mono text-[10px] tabular-nums text-[var(--glitch-teal)]">{formatCountdown(msLeft)}</p>
          </div>
        ) : (
          <>
            {/* Slot machine: one strip with three reel windows; no side borders to avoid extra vertical line */}
            <div className="daily-spin-reels mb-1.5 inline-flex items-center justify-center gap-0.5 rounded-lg border-y-2 border-[var(--glitch-pink)]/40 bg-[var(--bg-darker)] px-1 py-1 sm:gap-1 sm:px-1.5 sm:py-1.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded border border-[var(--glitch-pink)]/50 bg-black/50 sm:h-9 sm:w-9"
                  style={{ imageRendering: "pixelated" }}
                >
                  <span className="inline-flex shrink-0 scale-[0.7] origin-center sm:scale-[0.85]">
                    <PixelCharacter characterId={REEL_AVATAR_IDS[displayReels[i]]} size="sm" animated={false} />
                  </span>
                </div>
              ))}
            </div>
            {result !== null && (
              <p className="mb-0.5 text-center font-pixel text-[9px] animate-pulse sm:text-[10px]" style={{ color: "var(--glitch-pink)" }}>
                +{result} PITS
              </p>
            )}
            <button
              type="button"
              onClick={spin}
              disabled={spinning}
              className="mt-0.5 w-full rounded border-2 border-[var(--glitch-pink)] bg-[var(--glitch-pink)]/20 py-1.5 font-pixel text-[9px] text-white transition-colors hover:border-[var(--glitch-teal)] hover:bg-[var(--glitch-teal)]/30 hover:text-white disabled:opacity-50 sm:text-[10px]"
            >
              {spinning ? "…" : `SPIN (${triesLeft} left)`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
