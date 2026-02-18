"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useGameStore } from "@/lib/useGameStore";
import { useSocket } from "@/hooks/useSocket";
import { getMultiplierForAmount } from "@/lib/betMultipliers";
import { getRandomPitLore, getRandomOpponentName } from "@/lib/pitLore";

const BET_AMOUNTS = [50, 100, 250, 500, 1000];
const LORE_INTERVAL_MS = 1600;
const RESULT_DISPLAY_MS = 2500;
const SERVER_TIMEOUT_MS = 6000;
const MIN_BATTLE_MS = 3000; // Show battle + lore for at least 3s before result

export function GameCanvas() {
  const { socket, connected } = useSocket();
  const mockBalance = useGameStore((s) => s.mockBalance);
  const characterCount = useGameStore((s) => s.characterCount);
  const lastBetResult = useGameStore((s) => s.lastBetResult);
  const playerName = useGameStore((s) => s.playerName);
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
      useGameStore.getState().recordBetResult(battleAmount, lastBetResult.won, lastBetResult.payout);
      setBattleWon(lastBetResult.won);
      setBattlePayout(lastBetResult.payout);
      setBattlePhase("result");
    }, waitMs);

    const tIdle = setTimeout(() => setBattlePhase("idle"), waitMs + RESULT_DISPLAY_MS);

    return () => {
      clearTimeout(t);
      clearTimeout(tIdle);
    };
  }, [battlePhase, lastBetResult, battleAmount]);

  const runLocalFallback = useCallback(() => {
    const won = Math.random() < 0.5;
    const payout = won ? Math.floor(battleAmount * battleMultiplier) : 0;
    setLastBetResult({ won, payout });
    const balance = useGameStore.getState().mockBalance;
    if (won) {
      setBalance(balance - battleAmount + payout);
    } else {
      setBalance(balance - battleAmount);
    }
    // useEffect will switch to result then idle when lastBetResult is set
  }, [battleAmount, battleMultiplier, setBalance, setLastBetResult]);

  const handlePlaceBet = () => {
    if (amount < 50 || amount > mockBalance || characterCount < 1) return;

    setLastBetResult(null);
    setBattleAmount(amount);
    setBattleMultiplier(multiplier);

    // Set opponent and first lore line immediately so words show as soon as battle starts
    const opponent = getRandomOpponentName();
    setRumbleOpponent(opponent);
    setCurrentLore(getRandomPitLore(displayName, opponent));

    battleStartTimeRef.current = Date.now();
    setBattlePhase("fighting");

    if (socket) socket.emit("placeBet", { amount });

    // If server doesn't respond in time, run local simulation so something always happens
    const timeoutId = setTimeout(() => {
      if (useGameStore.getState().lastBetResult !== null) return; // server already replied
      runLocalFallback();
    }, SERVER_TIMEOUT_MS);

    const unsub = useGameStore.subscribe((state) => {
      if (state.lastBetResult !== null) {
        clearTimeout(timeoutId);
        unsub();
      }
    });
  };

  if (battlePhase === "fighting" || battlePhase === "result") {
    return (
      <div
        className="relative overflow-hidden rounded-lg border-2 bg-black"
        style={{ borderColor: "rgba(255, 105, 180, 0.4)" }}
      >
        <div
          className="flex flex-col items-center justify-center p-8"
          style={{ minHeight: 400, backgroundColor: "var(--bg-dark)" }}
        >
          <h2
            className="font-pixel glitch-text mb-4 text-center text-xs uppercase"
            data-text="THE GLITCH PIT"
            style={{ color: "var(--glitch-pink)" }}
          >
            THE GLITCH PIT
          </h2>
          <p className="mb-2 font-pixel text-center text-[10px]" style={{ color: "var(--glitch-teal)" }}>
            {displayName} vs {rumbleOpponent || "…"}
          </p>

          {battlePhase === "fighting" && (
            <>
              <p className="mb-3 font-pixel text-center text-[8px] uppercase tracking-wider text-gray-500">
                — Battle simulator —
              </p>
              <p
                className="max-w-md animate-pulse text-center font-mono text-[10px] leading-relaxed text-gray-300"
                key={currentLore}
              >
                {currentLore || "Entering the Pit…"}
              </p>
              <p className="mt-4 font-pixel text-[8px] text-gray-500">
                Lore feed…
              </p>
            </>
          )}

          {battlePhase === "result" && (
            <div
              className={`mt-4 rounded border-2 px-6 py-4 font-pixel text-center text-sm ${
                battleWon ? "border-[var(--glitch-teal)]" : "border-red-500/80"
              }`}
              style={{
                backgroundColor: battleWon ? "rgba(0, 212, 170, 0.15)" : "rgba(220, 38, 38, 0.15)",
              }}
            >
              <p style={{ color: battleWon ? "var(--glitch-teal)" : "#f87171" }}>
                {battleWon ? "VICTORY" : "DEFEAT"}
              </p>
              <p className="mt-2 text-[10px] text-gray-300">
                {battleWon ? `+${battlePayout} PITS` : "House wins."}
              </p>
            </div>
          )}
        </div>
        <div className="absolute bottom-2 left-2 font-pixel text-[8px] text-gray-500">
          Your character in the Pit
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative overflow-hidden rounded-lg border-2 bg-black"
      style={{ borderColor: "rgba(255, 105, 180, 0.4)" }}
    >
      <div
        className="flex flex-col items-center justify-center p-8"
        style={{ minHeight: 400, backgroundColor: "var(--bg-dark)" }}
      >
        <h2
          className="font-pixel glitch-text mb-2 text-center text-xs uppercase"
          data-text="BET ON YOUR CHARACTER"
          style={{ color: "var(--g-blue)" }}
        >
          BET ON YOUR CHARACTER
        </h2>
        <p className="mb-6 text-center font-mono text-[10px] text-gray-400">
          Your character fights in the Glitch Pit. No other players needed — just place your bet. Win = bet × multiplier. 50/50.
        </p>

        <p className="mb-4 font-pixel text-center text-xs" style={{ color: "var(--glitch-teal)" }}>
          Balance: {mockBalance} PITS
        </p>

        <div className="mb-4">
          <label className="mb-2 block font-pixel text-[8px] text-gray-500">AMOUNT · MULTIPLIER</label>
          <div className="flex flex-wrap justify-center gap-2">
            {BET_AMOUNTS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAmount(a)}
                disabled={a > mockBalance}
                className={`border-2 p-3 font-pixel text-[8px] ${
                  amount === a
                    ? "border-[var(--glitch-pink)] bg-[var(--glitch-pink)]/20"
                    : "border-[#4a4a4a] bg-[#2a2a2a]"
                }`}
              >
                {a} → {getMultiplierForAmount(a)}x
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6 rounded border-2 border-[#4a4a4a] px-4 py-3 font-mono text-[10px]">
          <span className="text-gray-500">Potential win: </span>
          <span style={{ color: "var(--glitch-gold, #ffd700)" }}>{potentialWin} PITS</span>
        </div>

        <button
          type="button"
          onClick={handlePlaceBet}
          disabled={amount > mockBalance || amount < 50 || characterCount < 1}
          className="pixel-btn pixel-btn-accent"
        >
          PLACE BET ({amount} PITS)
        </button>

        {lastBetResult !== null && battlePhase === "idle" && (
          <div className="mt-6 space-y-3">
            <div
              className={`rounded border-2 px-4 py-3 font-pixel text-[10px] ${
                lastBetResult.won ? "border-[var(--glitch-teal)]" : "border-red-500/80"
              }`}
              style={{
                backgroundColor: lastBetResult.won ? "rgba(0, 212, 170, 0.1)" : "rgba(220, 38, 38, 0.1)",
              }}
            >
              {lastBetResult.won ? (
                <>YOU WON {lastBetResult.payout} PITS</>
              ) : (
                <>HOUSE WINS. Try again.</>
              )}
            </div>
            <button
              type="button"
              onClick={() => setLastBetResult(null)}
              className="w-full pixel-btn pixel-btn-accent font-pixel text-[10px]"
            >
              REVENGE — PLAY AGAIN
            </button>
          </div>
        )}

        {!connected && (
          <p className="mt-6 font-pixel text-[8px] text-gray-500">
            Offline mode: battle runs locally. Connect for real payouts.
          </p>
        )}
        {connected && characterCount < 1 && (
          <p className="mt-4 font-pixel text-[8px] text-gray-500">Forge a character first.</p>
        )}
      </div>

      <div className="absolute bottom-2 left-2 font-pixel text-[8px] text-gray-500">
        Your character in the Pit · Payout = bet × multiplier on win
      </div>
    </div>
  );
}
