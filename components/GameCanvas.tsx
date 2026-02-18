"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useGameStore } from "@/lib/useGameStore";
import { useSocket } from "@/hooks/useSocket";
import { getMultiplierForAmount } from "@/lib/betMultipliers";
import { getRandomPitLore, getRandomOpponentName } from "@/lib/pitLore";
import { PixelCharacter } from "@/components/PixelCharacter";

const BET_AMOUNTS = [50, 100, 250, 500, 1000];
const AUTOBET_OPTIONS = [5, 10, 20, 50, 100, -1] as const; // -1 = unlimited
const LORE_INTERVAL_MS = 1600;
const RESULT_DISPLAY_MS = 2500;
const SERVER_TIMEOUT_MS = 6000;
const MIN_BATTLE_MS = 3000;
const AUTOBET_DELAY_MS = 600; // Delay before next bet when autobet

export function GameCanvas() {
  const { socket, connected } = useSocket();
  const mockBalance = useGameStore((s) => s.mockBalance);
  const characterCount = useGameStore((s) => s.characterCount);
  const lastBetResult = useGameStore((s) => s.lastBetResult);
  const playerName = useGameStore((s) => s.playerName);
  const selectedCharacterId = useGameStore((s) => s.selectedCharacterId);
  const setBalance = useGameStore((s) => s.setBalance);
  const setLastBetResult = useGameStore((s) => s.setLastBetResult);

  const [amount, setAmount] = useState(100);
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
  const previousPhaseRef = useRef<"idle" | "fighting" | "result">("idle");

  const multiplier = getMultiplierForAmount(amount);
  const potentialWin = Math.floor(amount * multiplier);
  const displayName = playerName || "Warrior";

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
      useGameStore.getState().recordBetResult(battleAmount, lastBetResult.won, payout);
      if (payout !== lastBetResult.payout) {
        useGameStore.getState().setLastBetResult({ won: lastBetResult.won, payout });
      }
      setBattleWon(lastBetResult.won);
      setBattlePayout(payout);
      setBattlePhase("result");
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
    if (remaining <= 0 || balance < amount || characterCount < 1) {
      setAutobetRunning(false);
      return;
    }

    const t = setTimeout(() => {
      setAutobetDone((d) => d + 1);
      handlePlaceBetRef.current?.();
    }, AUTOBET_DELAY_MS);
    return () => clearTimeout(t);
  }, [battlePhase, autobetRunning, autobetLimit, autobetDone, amount, characterCount]);

  const handlePlaceBet = useCallback(() => {
    if (amount < 50 || amount > mockBalance || characterCount < 1) return;

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
  }, [amount, multiplier, mockBalance, characterCount, socket, displayName, setBalance, setLastBetResult]);

  const handlePlaceBetRef = useRef(handlePlaceBet);
  handlePlaceBetRef.current = handlePlaceBet;

  const startAutobet = () => {
    setAutobetRunning(true);
    setAutobetDone(0);
    handlePlaceBet();
  };

  const stopAutobet = () => setAutobetRunning(false);

  if (battlePhase === "fighting" || battlePhase === "result") {
    return (
      <div className="relative flex h-full max-h-full w-full max-w-4xl flex-col justify-center overflow-hidden rounded-lg border-2 border-[var(--glitch-pink)]/50 bg-[var(--bg-dark)] p-2 shadow-[0_0_24px_rgba(255,105,180,0.12)] sm:rounded-xl sm:p-3">
        <div className="flex flex-col items-center justify-center">
          <div className="mb-1 flex items-center gap-1 sm:mb-2">
            <PixelCharacter characterId={selectedCharacterId} animated className="scale-75 sm:scale-100" />
            <h2
              className="font-pixel glitch-text text-center text-[10px] uppercase sm:text-xs"
              data-text="THE GLITCH PIT"
              style={{ color: "var(--glitch-pink)" }}
            >
              THE GLITCH PIT
            </h2>
            <PixelCharacter characterId={selectedCharacterId} animated className="scale-75 sm:scale-100" />
          </div>
          <div className="game-box mb-2 w-full max-w-xs py-1.5">
            <p className="game-box-label">MATCH</p>
            <p className="font-mono text-center text-[10px] sm:text-xs" style={{ color: "var(--glitch-teal)" }}>
              {displayName} vs {rumbleOpponent || "…"}
            </p>
          </div>

          {battlePhase === "fighting" && (
            <div className="game-box w-full max-w-md py-1.5">
              <p className="game-box-label">BATTLE SIMULATOR</p>
              <p
                className="min-h-[2rem] animate-pulse text-center font-mono text-[9px] leading-relaxed text-gray-300 sm:text-[10px]"
                key={currentLore}
              >
                {currentLore || "Entering the Pit…"}
              </p>
            </div>
          )}

          {battlePhase === "result" && (
            <p
              className="text-center font-mono text-[10px] sm:text-xs"
              style={{ color: battleWon ? "var(--glitch-teal)" : "#9ca3af" }}
            >
              {battleWon
                ? `You won ${battlePayout > 0 ? battlePayout : Math.floor(battleAmount * battleMultiplier)} PITS`
                : "House wins."}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full max-h-full w-full max-w-4xl flex-col overflow-hidden rounded-lg border-2 border-[var(--glitch-pink)]/50 bg-[var(--bg-dark)] p-2 shadow-[0_0_24px_rgba(255,105,180,0.12)] sm:rounded-xl sm:p-3">
      <div className="mb-1 flex shrink-0 flex-wrap items-center justify-center gap-1 sm:mb-2">
        <PixelCharacter characterId={selectedCharacterId} animated className="scale-75 sm:scale-100" />
        <h2
          className="font-pixel glitch-text text-center text-[10px] uppercase sm:text-xs"
          data-text="BET ON YOUR CHARACTER"
          style={{ color: "var(--g-blue)" }}
        >
          BET ON YOUR CHARACTER
        </h2>
        <PixelCharacter characterId={selectedCharacterId} animated className="scale-75 sm:scale-100" />
      </div>
      <p className="mb-2 shrink-0 text-center font-mono text-[9px] text-gray-400 sm:text-[10px]">
        Select amount, place your bet. Win = bet × multiplier. 50/50.
      </p>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 md:grid-cols-2 md:gap-2">
        <div className="flex min-h-0 flex-col gap-2">
          <div className="game-box shrink-0 py-1.5">
            <p className="game-box-label">BALANCE (TOKENS)</p>
            <p className="font-pixel text-base animate-pulse-glow sm:text-lg" style={{ color: "var(--glitch-teal)" }}>
              {mockBalance.toLocaleString()}
            </p>
          </div>
          <div className="game-box min-h-0 shrink py-1.5">
            <p className="game-box-label">BET AMOUNT · MULTIPLIER</p>
            <div className="flex flex-wrap justify-center gap-1">
              {BET_AMOUNTS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAmount(a)}
                  disabled={a > mockBalance}
                  className={`border-2 px-2 py-1.5 font-pixel text-[8px] transition-all sm:p-2 sm:text-[9px] hover:scale-105 ${
                    amount === a
                      ? "border-[var(--glitch-pink)] bg-[var(--glitch-pink)]/20 shadow-[0_0_12px_rgba(255,105,180,0.4)]"
                      : "border-[#4a4a4a] bg-[#2a2a2a] hover:border-[#5a5a5a]"
                  }`}
                >
                  {a} → {getMultiplierForAmount(a)}x
                </button>
              ))}
            </div>
            <p className="mt-0.5 text-center font-mono text-[9px] text-gray-500 sm:text-[10px]">
              Potential win: <span style={{ color: "var(--glitch-gold)" }}>{potentialWin} tokens</span>
            </p>
          </div>
        </div>

        <div className="flex min-h-0 flex-col gap-2">
          <button
            type="button"
            onClick={handlePlaceBet}
            disabled={autobetRunning || amount > mockBalance || amount < 50 || characterCount < 1}
            className="pixel-btn pixel-btn-accent pixel-btn-interactive w-full shrink-0 font-pixel text-[9px] sm:text-[10px]"
          >
            PLACE BET ({amount} tokens)
          </button>

          <div className="game-box min-h-0 shrink py-1.5">
            <p className="game-box-label">AUTOBET</p>
            <div className="mb-1 flex flex-wrap gap-1">
              {AUTOBET_OPTIONS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setAutobetLimit(n)}
                  disabled={autobetRunning}
                  className={`border-2 px-1.5 py-1 font-pixel text-[8px] transition-colors sm:px-2 sm:py-1.5 sm:text-[9px] ${
                    autobetLimit === n
                      ? "border-[var(--glitch-teal)] bg-[var(--glitch-teal)]/20"
                      : "border-[#4a4a4a] bg-[#2a2a2a] hover:border-[#5a5a5a]"
                  }`}
                >
                  {n < 0 ? "Unlimited" : `${n} bets`}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={startAutobet}
                disabled={
                  autobetRunning ||
                  amount > mockBalance ||
                  amount < 50 ||
                  characterCount < 1
                }
                className="pixel-btn pixel-btn-interactive flex-1 text-[8px] sm:text-[9px]"
              >
                START
              </button>
              <button
                type="button"
                onClick={stopAutobet}
                disabled={!autobetRunning}
                className="pixel-btn flex-1 border-red-500/50 text-[8px] text-red-400 disabled:opacity-50 sm:text-[9px]"
              >
                STOP
              </button>
            </div>
            {autobetRunning && (
              <p className="mt-0.5 font-mono text-[9px] text-gray-400 sm:text-[10px]">
                Running… {autobetDone}{autobetLimit >= 0 ? ` / ${autobetLimit}` : ""}
              </p>
            )}
          </div>

          {lastBetResult !== null && battlePhase === "idle" && (
            <div
              className={`rounded border-2 py-2 px-3 ${lastBetResult.won ? "border-[var(--glitch-teal)]/50 bg-[rgba(0,212,170,0.06)]" : "border-red-500/40 bg-[rgba(220,38,38,0.06)]"}`}
            >
              <p className="font-mono text-xs font-semibold sm:text-sm">
                {lastBetResult.won ? (
                  <span style={{ color: "var(--glitch-teal)" }}>LAST RESULT: YOU WON {lastBetResult.payout} PITS</span>
                ) : (
                  <span className="text-red-400">LAST RESULT: HOUSE WINS. Try again.</span>
                )}
              </p>
            </div>
          )}
        </div>
      </div>

      {!connected && (
        <p className="mt-1 shrink-0 font-mono text-[9px] text-gray-500 sm:text-[10px]">
          Offline mode: battle runs locally. Connect for real payouts.
        </p>
      )}
      {connected && characterCount < 1 && (
        <p className="mt-1 shrink-0 font-mono text-[9px] text-gray-500 sm:text-[10px]">Forge a character first.</p>
      )}

      <p className="mt-1 shrink-0 text-center font-mono text-[9px] text-gray-500 sm:text-[10px]">
        Your character in the Pit · Payout = bet × multiplier on win
      </p>
    </div>
  );
}
