"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useGameStore } from "@/lib/useGameStore";
import { useSocket } from "@/hooks/useSocket";
import { getMultiplierForAmount } from "@/lib/betMultipliers";
import { getRandomPitLore, getRandomOpponentName } from "@/lib/pitLore";
import { useActiveConsumablesStore } from "@/lib/activeConsumablesStore";
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

  const consumables = useActiveConsumablesStore();
  const thisBetUsedJackpotKeyRef = useRef(false);
  const [useJackpotKeyForNextBet, setUseJackpotKeyForNextBet] = useState(false);

  const [amount, setAmount] = useState(100);
  const [customAmountStr, setCustomAmountStr] = useState("");
  const [battlePhase, setBattlePhase] = useState<"idle" | "fighting" | "result">("idle");
  const [battleAmount, setBattleAmount] = useState(0);
  const [battleMultiplier, setBattleMultiplier] = useState(0);
  const [battleWon, setBattleWon] = useState(false);
  const [battlePayout, setBattlePayout] = useState(0);
  const [resultMessage, setResultMessage] = useState<string | null>(null); // e.g. "[ SHIELD BLOCKED ]"
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

  const baseMultiplier = getMultiplierForAmount(amount);
  const glitchMultActive = consumables.glitchMultiplier;
  const jackpotKeyActive = consumables.jackpotKeyExpiry != null && consumables.jackpotKeyExpiry > Date.now();
  const effectiveMultiplier = glitchMultActive ? 3 : (useJackpotKeyForNextBet && jackpotKeyActive ? 5 : baseMultiplier);
  const multiplier = effectiveMultiplier;
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

  // When betResult arrives, wait for minimum battle time then apply consumables, update balance, show result
  useEffect(() => {
    if (battlePhase !== "fighting" || lastBetResult === null) return;
    const elapsed = Date.now() - battleStartTimeRef.current;
    const waitMs = Math.max(0, MIN_BATTLE_MS - elapsed);

    const t = setTimeout(() => {
      const store = useGameStore.getState();
      const cons = useActiveConsumablesStore.getState();
      let effectiveWon = lastBetResult.won;
      let effectivePayout = lastBetResult.payout;
      if (lastBetResult.won) {
        if (lastBetResult.payout === 0 || cons.glitchMultiplier) {
          effectivePayout = Math.floor(battleAmount * battleMultiplier);
        }
      }
      let msg: string | null = null;

      if (cons.bloodPact) {
        effectiveWon = true;
        effectivePayout = Math.floor(battleAmount * battleMultiplier);
        useActiveConsumablesStore.getState().consumeBloodPact();
        msg = "[ PACT FULFILLED ]";
      }

      if (!effectiveWon) {
        if (cons.glitchShield) {
          useActiveConsumablesStore.getState().consumeGlitchShield();
          msg = "[ SHIELD BLOCKED ]";
        } else if (cons.phantomBet) {
          useActiveConsumablesStore.getState().consumePhantomBet();
          msg = "[ PHANTOM CONSUMED ]";
        } else if (cons.shadowCloakUsesLeft > 0) {
          useActiveConsumablesStore.getState().consumeShadowCloakUse();
          const halfLoss = Math.floor(battleAmount / 2);
          msg = `[ CLOAK REDUCED LOSS ] -${halfLoss} PITS`;
        }
      }

      if (effectiveWon) {
        if (cons.doubleDownChip) {
          effectivePayout = effectivePayout * 2;
          useActiveConsumablesStore.getState().consumeDoubleDownChip();
          msg = "[ 2X CHIP APPLIED ]";
        }
        if (cons.phantomBet && !cons.doubleDownChip) {
          useActiveConsumablesStore.getState().consumePhantomBet();
          if (!msg) msg = "[ PHANTOM CONSUMED ]";
        } else if (cons.phantomBet) useActiveConsumablesStore.getState().consumePhantomBet();
      }

      if (cons.glitchMultiplier) useActiveConsumablesStore.getState().consumeGlitchMultiplier();
      if (thisBetUsedJackpotKeyRef.current) {
        useActiveConsumablesStore.getState().consumeJackpotKey();
        thisBetUsedJackpotKeyRef.current = false;
      }
      if (cons.pitBribeBetsLeft > 0) useActiveConsumablesStore.getState().consumePitBribeBet();
      if (cons.speedHackRoundsLeft > 0 && autobetRunningRef.current) useActiveConsumablesStore.getState().consumeSpeedHackRound();

      const balance = store.mockBalance;
      let newBalance: number;
      if (effectiveWon) {
        newBalance = balance - battleAmount + effectivePayout;
      } else {
        if (msg === "[ SHIELD BLOCKED ]") newBalance = balance;
        else if (msg?.startsWith("[ CLOAK")) newBalance = balance - Math.floor(battleAmount / 2);
        else newBalance = balance - battleAmount;
      }
      setBalance(newBalance);

      useGameStore.getState().recordBetResult(battleAmount, effectiveWon, effectiveWon ? effectivePayout : 0);
      if (effectiveWon && effectivePayout !== lastBetResult.payout) {
        useGameStore.getState().setLastBetResult({ won: true, payout: effectivePayout });
      } else if (!effectiveWon) {
        useGameStore.getState().setLastBetResult({ won: false, payout: 0 });
      }

      setResultMessage(msg);
      setBattleWon(effectiveWon);
      setBattlePayout(effectiveWon ? effectivePayout : 0);
      setBattlePhase("result");
      soundManager.play("MULTIPLIER_REVEAL");
      setTimeout(() => {
        soundManager.play(effectiveWon ? "WIN" : "LOSE");
        if (effectiveWon) musicManager.duckForWin();
        else musicManager.duckForLoss();
      }, 90);
      if (effectiveWon) {
        setWinEffectActive(true);
        setTimeout(() => setWinEffectActive(false), 2000);
        setBalanceBounceActive(true);
        setTimeout(() => setBalanceBounceActive(false), 4500);
        const mult = battleMultiplier;
        if (effectivePayout >= JACKPOT_MIN_PAYOUT || mult >= JACKPOT_MIN_MULTIPLIER) {
          playJackpotSound();
          setBigWinVignetteActive(true);
          setTimeout(() => setBigWinVignetteActive(false), 1500);
        }
      }
      if (autobetRunningRef.current) {
        const sessionDelta = effectiveWon ? effectivePayout : (msg === "[ SHIELD BLOCKED ]" ? 0 : msg?.startsWith("[ CLOAK") ? -Math.floor(battleAmount / 2) : -battleAmount);
        setAutobetSessionProfit((p) => p + sessionDelta);
      }
    }, waitMs);

    const tIdle = setTimeout(() => {
      setResultMessage(null);
      useGameStore.getState().setLastBetResult(null);
      setBattlePhase("idle");
    }, waitMs + RESULT_DISPLAY_MS);

    return () => {
      clearTimeout(t);
      clearTimeout(tIdle);
    };
  }, [battlePhase, lastBetResult, battleAmount, battleMultiplier]);

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

    const speedHackActive = useActiveConsumablesStore.getState().speedHackRoundsLeft > 0;
    const delayMs = speedHackActive ? AUTOBET_DELAY_MS / 2 : AUTOBET_DELAY_MS;
    const t = setTimeout(() => {
      setAutobetDone((d) => d + 1);
      handlePlaceBetRef.current?.();
    }, delayMs);
    return () => clearTimeout(t);
  }, [battlePhase, autobetRunning, autobetLimit, autobetDone, amount, characterCount, walletAddress]);

  const handlePlaceBet = useCallback(() => {
    const canBet = characterCount >= 1 || !!walletAddress;
    if (amount < MIN_BET_PITS || amount > mockBalance || !canBet) return;

    soundManager.play("BET_PLACED");

    const betAmount = amount;
    const betMultiplier = effectiveMultiplier;
    if (useJackpotKeyForNextBet && jackpotKeyActive) {
      thisBetUsedJackpotKeyRef.current = true;
      setUseJackpotKeyForNextBet(false);
    }

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

    // If server doesn't respond in time, run local simulation. Balance is updated in result effect (consumables-aware).
    const timeoutId = setTimeout(() => {
      if (useGameStore.getState().lastBetResult !== null) return; // server already replied
      const pitBribeActive = useActiveConsumablesStore.getState().pitBribeBetsLeft > 0;
      const winChance = pitBribeActive ? 0.55 : 0.5;
      const won = Math.random() < winChance;
      const payout = won ? Math.floor(betAmount * betMultiplier) : 0;
      setLastBetResult({ won, payout });
    }, SERVER_TIMEOUT_MS);

    const unsub = useGameStore.subscribe((state) => {
      if (state.lastBetResult !== null) {
        clearTimeout(timeoutId);
        unsub();
      }
    });
  }, [amount, effectiveMultiplier, mockBalance, characterCount, walletAddress, socket, displayName, setBalance, setLastBetResult, useJackpotKeyForNextBet, jackpotKeyActive]);

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
      <div className={`relative flex min-h-0 w-full min-w-0 max-w-4xl flex-col items-center justify-center overflow-hidden overflow-x-hidden rounded-lg border-2 border-[var(--glitch-pink)]/60 bg-[var(--bg-dark)] pt-1 px-1.5 pb-1.5 sm:pt-2 sm:px-3 sm:pb-3 ${bigWinVignetteActive ? "win-vignette" : ""}`}>
        {autobetRunning && (
          <div className="absolute left-0 right-0 top-0 z-10 flex min-w-0 flex-shrink-0 flex-wrap items-center justify-center gap-2 border-b border-[var(--glitch-pink)]/30 bg-black/60 px-2 py-1.5 font-mono text-[10px] sm:gap-3 sm:text-xs">
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
        <div className="flex min-w-0 flex-1 flex-col items-center justify-center overflow-hidden">
          <div className="mb-4 flex min-w-0 flex-shrink-0 items-center justify-center gap-2 sm:mb-5">
            <h2
              className="font-pixel glitch-text text-center text-[10px] uppercase sm:text-xs"
              data-text="THE GLITCH PIT"
              style={{ color: "var(--glitch-pink)" }}
            >
              THE GLITCH PIT
            </h2>
            <PixelCharacter characterId={selectedCharacterId} animated className="scale-75 sm:scale-100" />
          </div>
          <div className="game-box mb-4 w-full max-w-xs py-3 text-center sm:mb-5 sm:py-4">
            <p className="game-box-label mb-1">MATCH</p>
            <p className="font-mono text-center text-[10px] sm:text-xs" style={{ color: "var(--glitch-teal)" }}>
              {displayName} vs {rumbleOpponent || "…"}
            </p>
          </div>

          {battlePhase === "fighting" && (
            <div className="game-box w-full max-w-md py-3 text-center sm:py-4">
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
              className={`mx-auto mt-2 flex w-full max-w-sm flex-col items-center rounded-xl border-2 px-5 py-6 text-center sm:mt-3 sm:py-8 ${battleWon ? "win-border-pulse" : ""}`}
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
              {resultMessage && (
                <p
                  className="mt-3 text-center font-mono text-[10px]"
                  style={{
                    color: resultMessage.includes("SHIELD") ? "var(--glitch-teal)" : resultMessage.includes("2X") ? "#f5c518" : resultMessage.includes("CLOAK") ? "#a78bfa" : resultMessage.includes("PACT") ? "#f5c518" : "var(--glitch-pink)",
                  }}
                >
                  {resultMessage}
                </p>
              )}
              <div className="mt-6 flex w-full justify-center sm:mt-8">
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
    <div className={`relative flex min-h-0 w-full min-w-0 max-w-4xl flex-col items-center justify-center overflow-hidden overflow-x-hidden rounded-lg border-2 border-[var(--glitch-pink)]/50 bg-[var(--bg-dark)] pt-1 px-1.5 pb-1.5 shadow-[0_0_24px_rgba(255,105,180,0.15),0_0_40px_rgba(0,212,170,0.05)] sm:rounded-xl sm:pt-2 sm:px-3 sm:pb-3 ${bigWinVignetteActive ? "win-vignette" : ""}`}>
        <div className="flex w-full max-w-lg min-w-0 shrink-0 flex-col items-center gap-1 overflow-x-hidden sm:gap-2">
        <div className="bet-on-header">
          <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-1.5">
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
            <PixelCharacter characterId={selectedCharacterId} animated className="scale-100 sm:scale-125 md:scale-150" />
          </div>
        </div>
        <p className="shrink-0 text-center font-mono text-xs text-gray-400 sm:text-sm">
          Pick your stake. Place your bet. Multiply or burn.
        </p>

        <div className="flex w-full flex-col items-center gap-2">
          <div className="flex w-full shrink-0 flex-col items-center gap-1 rounded border border-[var(--glitch-pink)]/40 bg-[var(--bg-card)] px-2 py-2">
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
                    setUseJackpotKeyForNextBet(false);
                  }}
                  disabled={a > mockBalance}
                  className={`border-2 px-2 py-1.5 font-pixel text-[8px] transition-all sm:text-[9px] hover:scale-105 ${
                    (amount === a && !customAmountStr) || (glitchMultActive && a === 500)
                      ? "border-[var(--glitch-pink)] bg-[var(--glitch-pink)]/20 shadow-[0_0_8px_rgba(255,105,180,0.4)]"
                      : "border-[#4a4a4a] bg-[#2a2a2a] hover:border-[#5a5a5a]"
                  }`}
                >
                  {a}→{getMultiplierForAmount(a)}x
                </button>
              ))}
              {jackpotKeyActive && (
                <button
                  type="button"
                  onClick={() => {
                    setAmount(1000);
                    setCustomAmountStr("");
                    setUseJackpotKeyForNextBet(true);
                  }}
                  disabled={1000 > mockBalance}
                  className={`border-2 px-2 py-1.5 font-pixel text-[8px] transition-all sm:text-[9px] hover:scale-105 ${
                    useJackpotKeyForNextBet ? "border-[#f5c518] bg-[#f5c518]/25 shadow-[0_0_8px_rgba(245,197,24,0.6)]" : "border-[#f5c518]/70 bg-[#f5c518]/10"
                  }`}
                  style={{ color: "#f5c518" }}
                >
                  1000→5x
                </button>
              )}
            </div>
            {glitchMultActive && (
              <p className="mt-1 font-mono text-[9px] text-[var(--glitch-pink)]">[ GLITCH MULTIPLIER ACTIVE ]</p>
            )}
          </div>
          <div className="game-box w-full shrink-0 px-2 py-2">
            <p className="game-box-label mb-1 text-center">CUSTOM BET</p>
            <p className="mb-1.5 text-center font-mono text-[10px] text-gray-400 sm:text-xs">
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
            <p className="mt-1.5 text-center font-mono text-[10px] text-gray-400 sm:text-xs">
              Your bet uses the <strong className="text-[var(--glitch-teal)]">{multiplier}×</strong> tier → win <span style={{ color: "var(--glitch-gold)" }}>{potentialWin} PITS</span> if you win.
            </p>
          </div>
          <p className="w-full shrink-0 text-center font-mono text-[9px] font-semibold sm:text-[10px]">
            Potential win: <span style={{ color: "var(--glitch-gold)" }}>{potentialWin} PITS</span> ({multiplier}× multiplier)
          </p>

          {/* Active consumables strip */}
          {(consumables.glitchShield || consumables.doubleDownChip || consumables.phantomBet || consumables.glitchMultiplier || consumables.bloodPact || consumables.pitBribeBetsLeft > 0 || consumables.shadowCloakUsesLeft > 0 || consumables.speedHackRoundsLeft > 0 || jackpotKeyActive) && (
            <div className="flex w-full max-w-xs shrink-0 flex-wrap items-center justify-center gap-1.5 rounded border border-[var(--glitch-pink)]/30 bg-black/40 px-2 py-1.5 font-mono text-[8px] sm:text-[9px]">
              {consumables.glitchShield && <span className="rounded bg-[var(--glitch-teal)]/20 px-1 text-[var(--glitch-teal)]">SHIELD</span>}
              {consumables.doubleDownChip && <span className="rounded bg-yellow-500/20 px-1 text-yellow-400">2X CHIP</span>}
              {consumables.phantomBet && <span className="rounded bg-[var(--glitch-pink)]/20 px-1 text-[var(--glitch-pink)]">PHANTOM BET</span>}
              {consumables.glitchMultiplier && <span className="rounded bg-[var(--glitch-pink)]/20 px-1 text-[var(--glitch-pink)]">GLITCH 3X</span>}
              {consumables.bloodPact && <span className="rounded bg-red-900/50 px-1 text-red-400" style={{ animation: "pulse 1s ease-in-out infinite" }}>BLOOD PACT</span>}
              {consumables.pitBribeBetsLeft > 0 && <span className="rounded bg-[var(--glitch-teal)]/20 px-1 text-[var(--glitch-teal)]">PIT BRIBE: {consumables.pitBribeBetsLeft}</span>}
              {consumables.shadowCloakUsesLeft > 0 && <span className="rounded bg-purple-900/40 px-1 text-purple-300">CLOAK: {consumables.shadowCloakUsesLeft}</span>}
              {consumables.speedHackRoundsLeft > 0 && <span className="rounded bg-cyan-900/40 px-1 text-cyan-300">SPEED: {consumables.speedHackRoundsLeft}</span>}
              {jackpotKeyActive && consumables.jackpotKeyExpiry != null && (
                <span className="rounded bg-[#f5c518]/20 px-1" style={{ color: "#f5c518" }}>
                  KEY: {Math.max(0, Math.floor((consumables.jackpotKeyExpiry - Date.now()) / 60000))}:{Math.max(0, Math.floor(((consumables.jackpotKeyExpiry - Date.now()) / 1000) % 60)).toString().padStart(2, "0")}
                </span>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={handlePlaceBet}
            disabled={!canPlaceBet}
            className="pixel-btn pixel-btn-accent pixel-btn-interactive w-full max-w-xs shrink-0 font-pixel text-[10px] sm:text-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            PLACE BET ({amount} PITS)
          </button>

          <div className="game-box w-full shrink-0 px-2 py-2">
            <p className="game-box-label mb-1 text-center">AUTOBET</p>
            <div className="mb-1.5 flex flex-wrap items-center justify-center gap-1">
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
              <div className="mt-1.5 w-full space-y-0.5 rounded border border-[var(--glitch-pink)]/30 bg-black/30 px-2 py-1 text-center font-mono text-[9px] sm:text-[10px]">
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

        <p className="w-full max-w-full shrink-0 px-2 text-center font-mono text-[9px] text-gray-400 sm:px-0 sm:text-[10px]" style={{ overflowWrap: "break-word" }}>
          Your gladiator in the Pit · Win = bet × multiplier. Lose = burn.
        </p>
      </div>
    </div>
  );
}
