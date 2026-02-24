"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useGameStore } from "@/lib/useGameStore";
import { useSocket } from "@/hooks/useSocket";
import { getMultiplierForAmount } from "@/lib/betMultipliers";
import { getRandomPitLore, getRandomOpponentName } from "@/lib/pitLore";
import { startBattleSound, stopBattleSound } from "@/lib/battleSound";
import { playJackpotSound } from "@/lib/jackpotSound";
import { soundManager } from "@/lib/soundManager";
import { musicManager } from "@/lib/musicManager";
import { PixelCharacter } from "@/components/PixelCharacter";
import { FeatureInfoIcon } from "@/components/FeatureInfoIcon";

const MIN_BET_PITS = 50;
const BET_AMOUNTS = [50, 100, 250, 500, 1000];
const AUTOBET_OPTIONS = [5, 10, 20, 50, 100, -1] as const; // -1 = unlimited
const LORE_INTERVAL_MS = 1600;
const RESULT_DISPLAY_MS = 2500;
const SERVER_TIMEOUT_MS = 6000;
const MIN_BATTLE_MS = 3000;
const AUTOBET_DELAY_MS = 1400; // Delay before next bet when autobet (gives time to change selection or stop)

export function GameCanvas() {
  const { socket } = useSocket();
  const mockBalance = useGameStore((s) => s.mockBalance);
  const characterCount = useGameStore((s) => s.characterCount);
  const walletAddress = useGameStore((s) => s.walletAddress);
  const lastBetResult = useGameStore((s) => s.lastBetResult);
  const playerName = useGameStore((s) => s.playerName);
  const selectedCharacterId = useGameStore((s) => s.selectedCharacterId);
  const setBalance = useGameStore((s) => s.setBalance);
  const setLastBetResult = useGameStore((s) => s.setLastBetResult);

  const [amount, setAmount] = useState(100);
  const [customAmountStr, setCustomAmountStr] = useState("");
  const [battlePhase, setBattlePhase] = useState<"idle" | "fighting" | "result">("idle");
  const [battleAmount, setBattleAmount] = useState(0);
  const [battleMultiplier, setBattleMultiplier] = useState(0);
  const [battleWon, setBattleWon] = useState(false);
  const [battlePayout, setBattlePayout] = useState(0);
  const [currentLore, setCurrentLore] = useState("");
  const [rumbleOpponent, setRumbleOpponent] = useState("");
  const battleStartTimeRef = useRef<number>(0);
  const [autobetRunning, setAutobetRunning] = useState(false);
  const [autobetLimit, setAutobetLimit] = useState<number>(10);
  const [autobetDone, setAutobetDone] = useState(0);
  const [autobetSessionProfit, setAutobetSessionProfit] = useState(0); // running P&L this session (PITS)
  const [winEffectActive, setWinEffectActive] = useState(false);
  const [balanceBounceActive, setBalanceBounceActive] = useState(false);
  const [bigWinVignetteActive, setBigWinVignetteActive] = useState(false);
  const previousPhaseRef = useRef<"idle" | "fighting" | "result">("idle");
  const autobetRunningRef = useRef(false);
  autobetRunningRef.current = autobetRunning;

  const JACKPOT_MIN_PAYOUT = 500;
  const JACKPOT_MIN_MULTIPLIER = 3;

  const multiplier = getMultiplierForAmount(amount);
  const potentialWin = Math.floor(amount * multiplier);
  const displayName = playerName || "Warrior";
  const canPlaceBet = (characterCount >= 1 || !!walletAddress) && amount >= MIN_BET_PITS && amount <= mockBalance && !autobetRunning;

  const handleCustomAmountBlur = () => {
    const parsed = parseInt(customAmountStr.replace(/\D/g, ""), 10);
    if (!Number.isNaN(parsed)) {
      const clamped = Math.min(mockBalance, Math.max(MIN_BET_PITS, parsed));
      setAmount(clamped);
    }
    setCustomAmountStr("");
  };

  // Battle-phase sound: start when fighting, stop when leaving
  useEffect(() => {
    if (battlePhase === "fighting") startBattleSound();
    return () => stopBattleSound();
  }, [battlePhase]);

  // Cycle lore during battle (one opponent name per rumble for consistent glitch story)
  useEffect(() => {
    if (battlePhase !== "fighting") return;
    const next = () => setCurrentLore(getRandomPitLore(displayName, rumbleOpponent));
    next();
    const id = setInterval(next, LORE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [battlePhase, displayName, rumbleOpponent]);

  // When betResult arrives, wait for minimum battle time then show result, then idle
  useEffect(() => {
    if (battlePhase !== "fighting" || lastBetResult === null) return;
    const elapsed = Date.now() - battleStartTimeRef.current;
    const waitMs = Math.max(0, MIN_BATTLE_MS - elapsed);

    const t = setTimeout(() => {
      const payout =
        lastBetResult.won && lastBetResult.payout === 0
          ? Math.floor(battleAmount * getMultiplierForAmount(battleAmount))
          : lastBetResult.payout;
      const mult = getMultiplierForAmount(battleAmount);
      useGameStore.getState().recordBetResult(battleAmount, lastBetResult.won, payout);
      if (payout !== lastBetResult.payout) {
        useGameStore.getState().setLastBetResult({ won: lastBetResult.won, payout });
      }
      setBattleWon(lastBetResult.won);
      setBattlePayout(payout);
      setBattlePhase("result");
      soundManager.play("MULTIPLIER_REVEAL");
      setTimeout(() => {
        soundManager.play(lastBetResult.won ? "WIN" : "LOSE");
        if (lastBetResult.won) musicManager.duckForWin();
        else musicManager.duckForLoss();
      }, 90);
      if (lastBetResult.won) {
        setWinEffectActive(true);
        setTimeout(() => setWinEffectActive(false), 2000);
        setBalanceBounceActive(true);
        setTimeout(() => setBalanceBounceActive(false), 4500);
        if (payout >= JACKPOT_MIN_PAYOUT || mult >= JACKPOT_MIN_MULTIPLIER) {
          playJackpotSound();
          setBigWinVignetteActive(true);
          setTimeout(() => setBigWinVignetteActive(false), 1500);
        }
      }
      if (autobetRunningRef.current) {
        setAutobetSessionProfit((p) => p + (lastBetResult.won ? payout : -battleAmount));
      }
    }, waitMs);

    const tIdle = setTimeout(() => {
      useGameStore.getState().setLastBetResult(null);
      setBattlePhase("idle");
    }, waitMs + RESULT_DISPLAY_MS);

    return () => {
      clearTimeout(t);
      clearTimeout(tIdle);
    };
  }, [battlePhase, lastBetResult, battleAmount]);

  // When returning to idle after a bet, run next autobet if active
  useEffect(() => {
    if (battlePhase !== "idle" || !autobetRunning) {
      previousPhaseRef.current = battlePhase;
      return;
    }
    const justFinishedBet = previousPhaseRef.current === "result";
    previousPhaseRef.current = battlePhase;

    if (!justFinishedBet) return;

    // After this bet we've completed (autobetDone + 1) bets; schedule one more if under limit
    const completed = autobetDone + 1;
    const remaining = autobetLimit < 0 ? 1 : autobetLimit - completed;
    const balance = useGameStore.getState().mockBalance;
    const canBet = characterCount >= 1 || !!walletAddress;
    if (remaining <= 0 || balance < amount || !canBet) {
      setAutobetRunning(false);
      return;
    }

    const t = setTimeout(() => {
      setAutobetDone((d) => d + 1);
      handlePlaceBetRef.current?.();
    }, AUTOBET_DELAY_MS);
    return () => clearTimeout(t);
  }, [battlePhase, autobetRunning, autobetLimit, autobetDone, amount, characterCount, walletAddress]);

  const handlePlaceBet = useCallback(() => {
    const canBet = characterCount >= 1 || !!walletAddress;
    if (amount < MIN_BET_PITS || amount > mockBalance || !canBet) return;

    soundManager.play("BET_PLACED");

    const betAmount = amount;
    const betMultiplier = multiplier;

    setLastBetResult(null);
    setBattleAmount(betAmount);
    setBattleMultiplier(betMultiplier);

    // Set opponent and first lore line immediately so words show as soon as battle starts
    const opponent = getRandomOpponentName();
    setRumbleOpponent(opponent);
    setCurrentLore(getRandomPitLore(displayName, opponent));

    battleStartTimeRef.current = Date.now();
    setBattlePhase("fighting");

    if (socket) socket.emit("placeBet", { amount: betAmount });

    // If server doesn't respond in time, run local simulation (use betAmount/betMultiplier so payout is correct)
    const timeoutId = setTimeout(() => {
      if (useGameStore.getState().lastBetResult !== null) return; // server already replied
      const won = Math.random() < 0.5;
      const payout = won ? Math.floor(betAmount * betMultiplier) : 0;
      setLastBetResult({ won, payout });
      const balance = useGameStore.getState().mockBalance;
      if (won) {
        setBalance(balance - betAmount + payout);
      } else {
        setBalance(balance - betAmount);
      }
    }, SERVER_TIMEOUT_MS);

    const unsub = useGameStore.subscribe((state) => {
      if (state.lastBetResult !== null) {
        clearTimeout(timeoutId);
        unsub();
      }
    });
  }, [amount, multiplier, mockBalance, characterCount, walletAddress, socket, displayName, setBalance, setLastBetResult]);

  const handlePlaceBetRef = useRef(handlePlaceBet);
  handlePlaceBetRef.current = handlePlaceBet;

  const startAutobet = () => {
    setAutobetRunning(true);
    setAutobetDone(0);
    setAutobetSessionProfit(0);
    handlePlaceBet();
  };

  const stopAutobet = () => setAutobetRunning(false);

  if (battlePhase === "fighting" || battlePhase === "result") {
    return (
      <>
      <div className={`relative flex min-h-0 w-full max-w-4xl flex-col items-center justify-center overflow-y-auto overflow-x-hidden rounded-lg border-2 border-[var(--glitch-pink)]/60 bg-[var(--bg-dark)] p-2 sm:p-4 ${bigWinVignetteActive ? "win-vignette" : ""}`}>
        {autobetRunning && (
          <div className="absolute left-0 right-0 top-0 z-10 flex flex-wrap items-center justify-center gap-2 border-b border-[var(--glitch-pink)]/30 bg-black/60 px-2 py-1.5 font-mono text-[10px] sm:gap-3 sm:text-xs">
            <span className="text-gray-400">
              Bet <span className="tabular-nums text-white">{autobetDone + 1}{autobetLimit >= 0 ? ` / ${autobetLimit}` : " ∞"}</span>
            </span>
            <span className={`tabular-nums font-semibold ${autobetSessionProfit >= 0 ? "text-[var(--glitch-teal)]" : "text-red-400"}`}>
              Session {autobetSessionProfit >= 0 ? "+" : ""}{autobetSessionProfit} PITS
            </span>
            <span className="text-gray-400">
              {battlePhase === "fighting" ? "Fighting…" : "Result"}
            </span>
            <button
              type="button"
              onClick={stopAutobet}
              className="ml-auto shrink-0 rounded border-2 border-red-500/70 bg-red-950/80 px-2 py-1 font-pixel text-[8px] text-red-300 transition hover:border-red-400 hover:bg-red-900/60 hover:text-red-200 sm:ml-0 sm:px-2.5 sm:text-[9px]"
            >
              STOP AUTOBET
            </button>
          </div>
        )}
        <div className="flex flex-col items-center justify-center">
          <div className="mb-1 flex items-center justify-center gap-1 sm:mb-2">
            <h2
              className="font-pixel glitch-text text-center text-[10px] uppercase sm:text-xs"
              data-text="THE GLITCH PIT"
              style={{ color: "var(--glitch-pink)" }}
            >
              THE GLITCH PIT
            </h2>
            <PixelCharacter characterId={selectedCharacterId} animated className="scale-75 sm:scale-100" />
          </div>
          <div className="game-box mb-2 w-full max-w-xs py-1.5 text-center">
            <p className="game-box-label">MATCH</p>
            <p className="font-mono text-center text-[10px] sm:text-xs" style={{ color: "var(--glitch-teal)" }}>
              {displayName} vs {rumbleOpponent || "…"}
            </p>
          </div>

          {battlePhase === "fighting" && (
            <div className="game-box w-full max-w-md py-1.5 text-center">
              <p className="game-box-label">BATTLE SIMULATOR</p>
              <p
                className="min-h-[2rem] animate-pulse text-center font-mono text-[10px] leading-relaxed text-gray-300 sm:text-xs"
                key={currentLore}
              >
                {currentLore || "Entering the Pit…"}
              </p>
            </div>
          )}

          {battlePhase === "result" && (
            <div
              className={`mx-auto flex w-full max-w-sm flex-col items-center rounded-xl border-2 px-4 py-5 text-center sm:py-6 ${battleWon ? "win-border-pulse" : ""}`}
              style={{
                background: battleWon
                  ? "linear-gradient(180deg, rgba(0,212,170,0.12) 0%, rgba(20,12,28,0.95) 50%)"
                  : "linear-gradient(180deg, rgba(60,60,60,0.2) 0%, rgba(20,12,28,0.95) 50%)",
                borderColor: battleWon ? "rgba(245,197,24,0.7)" : "rgba(255,255,255,0.15)",
                boxShadow: battleWon
                  ? "0 0 24px rgba(245,197,24,0.3), inset 0 1px 0 rgba(255,255,255,0.08)"
                  : "0 0 16px rgba(0,0,0,0.3)",
              }}
            >
              <p
                className={`text-center font-mono text-[10px] sm:text-xs ${battleWon ? "win-result-gold" : ""}`}
                style={!battleWon ? { color: "#9ca3af" } : undefined}
              >
                {battleWon
                  ? `You won ${battlePayout > 0 ? battlePayout : Math.floor(battleAmount * battleMultiplier)} PITS`
                  : "House wins."}
              </p>
              <div className="mt-4 flex w-full justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setLastBetResult(null);
                    setBattlePhase("idle");
                  }}
                  className="pixel-btn pixel-btn-accent font-pixel text-[10px] sm:text-xs"
                >
                  NEXT BET
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      </>
    );
  }

  return (
    <div className={`relative flex min-h-0 w-full max-w-4xl flex-col items-center justify-center overflow-y-auto overflow-x-hidden rounded-lg border-2 border-[var(--glitch-pink)]/50 bg-[var(--bg-dark)] p-3 shadow-[0_0_24px_rgba(255,105,180,0.15),0_0_40px_rgba(0,212,170,0.05)] sm:rounded-xl sm:p-4 ${bigWinVignetteActive ? "win-vignette" : ""}`}>
        <div className="flex w-full max-w-lg min-w-0 shrink-0 flex-col items-center gap-2 sm:gap-2.5">
        <div className="bet-on-header">
          <div className="flex items-center gap-1.5">
            <h2 className="bet-on-header-title">
              BET ON {displayName.toUpperCase()}
            </h2>
            <FeatureInfoIcon
              ariaLabel="How the Bet Battle works"
              content={
                <>
                  Stake 50–1000 PITS. Win = bet × multiplier (1.5× to 4× by tier). Lose = stake burned. Stats affect win chance.
                </>
              }
              className="text-[#00fff9]"
            />
          </div>
          <div className="bet-on-header-avatar">
            <PixelCharacter characterId={selectedCharacterId} animated className="scale-125 sm:scale-150" />
          </div>
        </div>
        <p className="shrink-0 text-center font-mono text-xs text-gray-400 sm:text-sm">
          Pick your stake. Place your bet. Multiply or burn.
        </p>

        <div className="flex w-full flex-col items-center gap-2.5">
          <div className="flex w-full shrink-0 flex-col items-center gap-1.5 rounded border border-[var(--glitch-pink)]/40 bg-[var(--bg-card)] px-3 py-2.5">
            <p className="game-box-label text-center">BALANCE</p>
            <p className={`font-pixel text-center text-base sm:text-lg ${balanceBounceActive ? "balance-win-bounce" : "animate-pulse-glow"}`} style={{ color: "var(--glitch-teal)" }}>
              {mockBalance.toLocaleString()} PITS
            </p>
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {BET_AMOUNTS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => {
                    setAmount(a);
                    setCustomAmountStr("");
                  }}
                  disabled={a > mockBalance}
                  className={`border-2 px-2 py-1.5 font-pixel text-[8px] transition-all sm:text-[9px] hover:scale-105 ${
                    amount === a && !customAmountStr
                      ? "border-[var(--glitch-pink)] bg-[var(--glitch-pink)]/20 shadow-[0_0_8px_rgba(255,105,180,0.4)]"
                      : "border-[#4a4a4a] bg-[#2a2a2a] hover:border-[#5a5a5a]"
                  }`}
                >
                  {a}→{getMultiplierForAmount(a)}x
                </button>
              ))}
            </div>
          </div>
          <div className="game-box w-full shrink-0 px-3 py-2.5">
            <p className="game-box-label mb-1.5 text-center">CUSTOM BET</p>
            <p className="mb-2 text-center font-mono text-[10px] text-gray-400 sm:text-xs">
              Min <strong className="text-white">{MIN_BET_PITS} PITS</strong> · Max <strong className="text-white">{mockBalance.toLocaleString()} PITS</strong>
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <input
                type="text"
                inputMode="numeric"
                value={customAmountStr !== "" ? customAmountStr : BET_AMOUNTS.includes(amount) ? "" : String(amount)}
                onChange={(e) => setCustomAmountStr(e.target.value.replace(/\D/g, ""))}
                onBlur={handleCustomAmountBlur}
                onKeyDown={(e) => e.key === "Enter" && handleCustomAmountBlur()}
                placeholder={String(amount)}
                className="w-28 border-2 border-[var(--glitch-pink)]/50 bg-[var(--bg-darker)] px-3 py-2 font-mono text-base tabular-nums text-white placeholder-gray-500 focus:border-[var(--glitch-pink)] focus:outline-none sm:w-32 sm:px-4 sm:py-2.5 sm:text-lg"
                aria-label="Custom bet amount in PITS"
              />
              <span className="font-mono text-xs text-gray-400 sm:text-sm">PITS</span>
            </div>
            <p className="mt-2 text-center font-mono text-xs text-gray-400 sm:text-sm">
              Your bet uses the <strong className="text-[var(--glitch-teal)]">{getMultiplierForAmount(amount)}×</strong> tier → win <span style={{ color: "var(--glitch-gold)" }}>{potentialWin} PITS</span> if you win.
            </p>
          </div>
          <p className="w-full shrink-0 text-center font-mono text-[10px] font-semibold sm:text-xs">
            Potential win: <span style={{ color: "var(--glitch-gold)" }}>{potentialWin} PITS</span> ({getMultiplierForAmount(amount)}× multiplier)
          </p>

          <button
            type="button"
            onClick={handlePlaceBet}
            disabled={!canPlaceBet}
            className="pixel-btn pixel-btn-accent pixel-btn-interactive w-full max-w-xs shrink-0 font-pixel text-[10px] sm:text-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            PLACE BET ({amount} PITS)
          </button>

          <div className="game-box w-full shrink-0 px-3 py-2.5">
            <p className="game-box-label mb-1.5 text-center">AUTOBET</p>
            <div className="mb-2 flex flex-wrap items-center justify-center gap-1">
              {AUTOBET_OPTIONS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setAutobetLimit(n)}
                  disabled={autobetRunning}
                  className={`border-2 px-1.5 py-1 font-pixel text-[8px] transition-colors sm:text-[9px] ${
                    autobetLimit === n
                      ? "border-[var(--glitch-teal)] bg-[var(--glitch-teal)]/20"
                      : "border-[#4a4a4a] bg-[#2a2a2a] hover:border-[#5a5a5a]"
                  }`}
                >
                  {n < 0 ? "∞" : n}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={startAutobet}
                disabled={!canPlaceBet}
                className="pixel-btn pixel-btn-interactive flex-1 max-w-[120px] font-pixel text-[9px]"
              >
                START
              </button>
              <button
                type="button"
                onClick={stopAutobet}
                disabled={!autobetRunning}
                className="pixel-btn flex-1 max-w-[120px] border-red-500/50 font-pixel text-[9px] text-red-400 disabled:opacity-50"
              >
                STOP
              </button>
            </div>
            {autobetRunning && (
              <div className="mt-2 w-full space-y-0.5 rounded border border-[var(--glitch-pink)]/30 bg-black/30 px-2 py-1.5 text-center font-mono text-[9px] sm:text-[10px]">
                <p className="flex justify-center gap-4 text-gray-300">
                  <span>Completed</span>
                  <span className="tabular-nums">
                    {autobetDone}{autobetLimit >= 0 ? ` / ${autobetLimit}` : " ∞"}
                  </span>
                </p>
                <p className="flex justify-center gap-4">
                  <span className="text-gray-400">Session</span>
                  <span
                    className={`tabular-nums font-semibold ${autobetSessionProfit >= 0 ? "text-[var(--glitch-teal)]" : "text-red-400"}`}
                  >
                    {autobetSessionProfit >= 0 ? "+" : ""}{autobetSessionProfit} PITS
                  </span>
                </p>
                <p className="flex justify-center gap-4 text-gray-400">
                  <span>Status</span>
                  <span className="text-gray-400">
                    {battlePhase === "idle" ? "Next in 1.4s" : battlePhase === "fighting" ? "Fighting…" : "Result"}
                  </span>
                </p>
              </div>
            )}
          </div>

          {lastBetResult !== null && battlePhase === "idle" && (
            <div
              className={`w-full shrink-0 rounded border-2 py-2 px-3 text-center ${lastBetResult.won ? "border-[var(--glitch-teal)]/50 bg-[rgba(0,212,170,0.06)]" : "border-red-500/40 bg-[rgba(220,38,38,0.06)]"}`}
            >
              <p className={`font-mono text-[10px] font-semibold sm:text-xs ${lastBetResult.won ? "win-result-gold" : ""}`}>
                {lastBetResult.won ? (
                  <span>WON {lastBetResult.payout} PITS</span>
                ) : (
                  <span className="text-red-400">HOUSE WINS</span>
                )}
              </p>
            </div>
          )}
        </div>

        {characterCount < 1 && !walletAddress && (
          <p className="shrink-0 text-center font-mono text-[10px] text-gray-400 sm:text-xs">Forge a character to enter the Pit.</p>
        )}
        {characterCount < 1 && walletAddress && (
          <p className="shrink-0 text-center font-mono text-[10px] text-gray-400 sm:text-xs">Forge a character to customize your gladiator (optional).</p>
        )}

        <p className="w-full max-w-full shrink-0 px-2 text-center font-mono text-[10px] text-gray-400 sm:px-0 sm:text-xs" style={{ overflowWrap: "break-word" }}>
          Your gladiator in the Pit · Win = bet × multiplier. Lose = burn.
        </p>
      </div>
    </div>
  );
}
