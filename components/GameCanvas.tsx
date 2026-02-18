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

    const tIdle = setTimeout(() => setBattlePhase("idle"), waitMs + RESULT_DISPLAY_MS);

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
      <div
        className="relative overflow-hidden rounded-xl border-2 border-[var(--glitch-pink)]/50 bg-[var(--bg-dark)] p-6 shadow-[0_0_40px_rgba(255,105,180,0.12)]"
        style={{ minHeight: 420 }}
      >
        <div className="flex flex-col items-center justify-center">
          <div className="mb-3 flex items-center gap-2">
            <PixelCharacter characterId={selectedCharacterId} animated />
            <h2
              className="font-pixel glitch-text text-center text-xs uppercase"
              data-text="THE GLITCH PIT"
              style={{ color: "var(--glitch-pink)" }}
            >
              THE GLITCH PIT
            </h2>
            <PixelCharacter characterId={selectedCharacterId} animated />
          </div>
            <div className="game-box mb-4 w-full max-w-xs">
            <p className="game-box-label">MATCH</p>
            <p className="font-mono text-center text-sm" style={{ color: "var(--glitch-teal)" }}>
              {displayName} vs {rumbleOpponent || "…"}
            </p>
          </div>

          {battlePhase === "fighting" && (
            <div className="game-box w-full max-w-md">
              <p className="game-box-label">BATTLE SIMULATOR</p>
              <p
                className="min-h-[3.5rem] animate-pulse text-center font-mono text-xs leading-relaxed text-gray-300"
                key={currentLore}
              >
                {currentLore || "Entering the Pit…"}
              </p>
            </div>
          )}

          {battlePhase === "result" && (
            <>
              <div
                className={`game-box w-full max-w-sm ${
                  battleWon ? "border-[var(--glitch-teal)]/60" : "border-red-500/50"
                }`}
                style={{
                  backgroundColor: battleWon ? "rgba(0, 212, 170, 0.12)" : "rgba(220, 38, 38, 0.12)",
                }}
              >
                <p className="game-box-label">RESULT</p>
                <p className="font-pixel text-center text-lg sm:text-xl" style={{ color: battleWon ? "var(--glitch-teal)" : "#f87171" }}>
                  {battleWon ? "VICTORY" : "DEFEAT"}
                </p>
                <p className="mt-3 text-center font-mono text-base font-semibold text-gray-200">
                  {battleWon
                    ? `+${battlePayout > 0 ? battlePayout : Math.floor(battleAmount * battleMultiplier)} PITS`
                    : "House wins."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBattlePhase("idle")}
                className="mt-4 w-full pixel-btn pixel-btn-accent pixel-btn-interactive font-pixel text-[10px]"
              >
                BACK — PLAY AGAIN
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative overflow-hidden rounded-xl border-2 border-[var(--glitch-pink)]/50 bg-[var(--bg-dark)] p-6 shadow-[0_0_40px_rgba(255,105,180,0.12)]"
      style={{ minHeight: 420 }}
    >
      <div className="mb-5 flex items-center justify-center gap-3">
        <PixelCharacter characterId={selectedCharacterId} animated />
        <h2
          className="font-pixel glitch-text text-center text-sm uppercase sm:text-base"
          data-text="BET ON YOUR CHARACTER"
          style={{ color: "var(--g-blue)" }}
        >
          BET ON YOUR CHARACTER
        </h2>
        <PixelCharacter characterId={selectedCharacterId} animated />
      </div>
      <p className="mb-6 text-center font-mono text-xs text-gray-400">
        Select amount, place your bet. Win = bet × multiplier. 50/50.
      </p>

      <div className="game-box mb-4">
        <p className="game-box-label">BALANCE (TOKENS)</p>
        <p className="font-pixel text-xl animate-pulse-glow sm:text-2xl" style={{ color: "var(--glitch-teal)" }}>
          {mockBalance.toLocaleString()}
        </p>
      </div>

      <div className="game-box mb-4">
        <p className="game-box-label">BET AMOUNT · MULTIPLIER</p>
        <div className="flex flex-wrap justify-center gap-2">
          {BET_AMOUNTS.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAmount(a)}
              disabled={a > mockBalance}
              className={`border-2 p-3 font-pixel text-[9px] transition-all hover:scale-105 ${
                amount === a
                  ? "border-[var(--glitch-pink)] bg-[var(--glitch-pink)]/20 shadow-[0_0_12px_rgba(255,105,180,0.4)]"
                  : "border-[#4a4a4a] bg-[#2a2a2a] hover:border-[#5a5a5a]"
              }`}
            >
              {a} → {getMultiplierForAmount(a)}x
            </button>
          ))}
        </div>
        <p className="mt-2 text-center font-mono text-xs text-gray-500">
          Potential win: <span style={{ color: "var(--glitch-gold)" }}>{potentialWin} tokens</span>
        </p>
      </div>

      <button
        type="button"
        onClick={handlePlaceBet}
        disabled={autobetRunning || amount > mockBalance || amount < 50 || characterCount < 1}
        className="pixel-btn pixel-btn-accent pixel-btn-interactive mb-6 w-full font-pixel text-[11px]"
      >
        PLACE BET ({amount} tokens)
      </button>

      <div className="game-box">
        <p className="game-box-label">AUTOBET</p>
        <div className="mb-2 flex flex-wrap gap-1">
          {AUTOBET_OPTIONS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setAutobetLimit(n)}
              disabled={autobetRunning}
              className={`border-2 px-2 py-1.5 font-pixel text-[9px] transition-colors ${
                autobetLimit === n
                  ? "border-[var(--glitch-teal)] bg-[var(--glitch-teal)]/20"
                  : "border-[#4a4a4a] bg-[#2a2a2a] hover:border-[#5a5a5a]"
              }`}
            >
              {n < 0 ? "Unlimited" : `${n} bets`}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={startAutobet}
            disabled={
              autobetRunning ||
              amount > mockBalance ||
              amount < 50 ||
              characterCount < 1
            }
            className="pixel-btn pixel-btn-interactive flex-1 text-[9px]"
          >
            START
          </button>
            <button
              type="button"
              onClick={stopAutobet}
              disabled={!autobetRunning}
              className="pixel-btn flex-1 border-red-500/50 text-[9px] text-red-400 disabled:opacity-50"
            >
              STOP
            </button>
        </div>
          {autobetRunning && (
            <p className="mt-2 font-mono text-xs text-gray-400">
              Running… {autobetDone}{autobetLimit >= 0 ? ` / ${autobetLimit}` : ""}
            </p>
          )}
      </div>

        {lastBetResult !== null && battlePhase === "idle" && (
          <div className="mt-6 space-y-3">
            <div
              className={`game-box ${lastBetResult.won ? "border-[var(--glitch-teal)]/60" : "border-red-500/50"}`}
              style={{
                backgroundColor: lastBetResult.won ? "rgba(0, 212, 170, 0.08)" : "rgba(220, 38, 38, 0.08)",
              }}
            >
              <p className="game-box-label">LAST RESULT</p>
              <p className="font-mono text-sm font-semibold">
                {lastBetResult.won ? (
                  <span style={{ color: "var(--glitch-teal)" }}>YOU WON {lastBetResult.payout} PITS</span>
                ) : (
                  <span className="text-red-400">HOUSE WINS. Try again.</span>
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setLastBetResult(null)}
              className="w-full pixel-btn pixel-btn-accent pixel-btn-interactive font-pixel text-[11px]"
            >
              REVENGE — PLAY AGAIN
            </button>
          </div>
        )}

        {!connected && (
          <p className="mt-6 font-mono text-xs text-gray-500">
            Offline mode: battle runs locally. Connect for real payouts.
          </p>
        )}
        {connected && characterCount < 1 && (
          <p className="mt-4 font-mono text-xs text-gray-500">Forge a character first.</p>
        )}

        <div className="mt-5 flex justify-center">
          <span className="font-mono text-xs text-gray-500">
            Your character in the Pit · Payout = bet × multiplier on win
          </span>
        </div>
      </div>
    );
}
