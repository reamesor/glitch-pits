"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useGameStore } from "@/lib/useGameStore";
import { soundManager } from "@/lib/soundManager";
import { FeatureInfoIcon } from "@/components/FeatureInfoIcon";

const W = 14;
const H = 20;
const CELL = 12;
const CANVAS_W = W * CELL;
const CANVAS_H = H * CELL;
const PITS_CAP = 20;

type Dir = "up" | "down" | "left" | "right";

interface SnakePanelProps {
  onClose?: () => void;
}

export function SnakePanel({ onClose }: SnakePanelProps) {
  const addToBalance = useGameStore((s) => s.addToBalance);
  const panelRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<"idle" | "countdown" | "playing" | "gameover">("idle");
  const [countdown, setCountdown] = useState(3);
  const [score, setScore] = useState(0);
  const [earned, setEarned] = useState(0);
  const [confirmClose, setConfirmClose] = useState(false);
  const gameRef = useRef<{ snake: { x: number; y: number }[]; dir: Dir; food: { x: number; y: number }; loop: ReturnType<typeof setInterval> | null }>({
    snake: [],
    dir: "right",
    food: { x: 0, y: 0 },
    loop: null,
  });

  const startGame = useCallback(() => {
    setScore(0);
    setEarned(0);
    setCountdown(3);
    const cx = Math.floor(W / 2);
    const cy = Math.floor(H / 2);
    const snake = [{ x: cx - 2, y: cy }, { x: cx - 1, y: cy }, { x: cx, y: cy }];
    let food = { x: cx + 3, y: cy };
    const set = new Set(snake.map((s) => `${s.x},${s.y}`));
    if (set.has(`${food.x},${food.y}`)) {
      food = { x: cx + 4, y: cy };
    }
    gameRef.current = { snake, dir: "right", food, loop: null };
    setStatus("countdown");
  }, []);

  // 3-second countdown then start playing
  useEffect(() => {
    if (status !== "countdown") return;
    if (countdown <= 0) {
      setStatus("playing");
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [status, countdown]);

  const spawnFood = useCallback((snake: { x: number; y: number }[]) => {
    const set = new Set(snake.map((s) => `${s.x},${s.y}`));
    let x: number, y: number;
    do {
      x = Math.floor(Math.random() * W);
      y = Math.floor(Math.random() * H);
    } while (set.has(`${x},${y}`));
    return { x, y };
  }, []);

  const tick = useCallback(() => {
    const g = gameRef.current;
    if (!g || status !== "playing" || g.snake.length === 0) return;
    const head = g.snake[g.snake.length - 1];
    const nextHead = { ...head };
    if (g.dir === "up") nextHead.y -= 1;
    if (g.dir === "down") nextHead.y += 1;
    if (g.dir === "left") nextHead.x -= 1;
    if (g.dir === "right") nextHead.x += 1;
    if (nextHead.x < 0 || nextHead.x >= W || nextHead.y < 0 || nextHead.y >= H) {
      endGame(g.snake.length - 3);
      return;
    }
    if (g.snake.some((s) => s.x === nextHead.x && s.y === nextHead.y)) {
      endGame(g.snake.length - 3);
      return;
    }
    const next = [...g.snake, nextHead];
    if (nextHead.x === g.food.x && nextHead.y === g.food.y) {
      soundManager.play("SNAKE_EAT");
      setScore((s) => s + 1);
      g.food = spawnFood(next);
      g.snake = next;
    } else {
      g.snake = next.slice(1);
    }
    gameRef.current = g;
  }, [status, spawnFood]);

  function endGame(finalScore: number) {
    soundManager.play("SNAKE_DEATH");
    const g = gameRef.current;
    if (g?.loop) clearInterval(g.loop);
    gameRef.current.loop = null;
    const pits = Math.min(PITS_CAP, Math.round(finalScore / 10));
    if (pits > 0) addToBalance(pits);
    setEarned(pits);
    setStatus("gameover");
  }

  useEffect(() => {
    if (status !== "playing") return;
    const id = setInterval(tick, 120);
    if (gameRef.current) gameRef.current.loop = id;
    return () => {
      clearInterval(id);
      if (gameRef.current) gameRef.current.loop = null;
    };
  }, [status, tick]);

  useEffect(() => {
    return () => {
      if (gameRef.current?.loop) clearInterval(gameRef.current.loop);
    };
  }, []);

  useEffect(() => {
    if (status !== "playing") return;
    const handle = (e: KeyboardEvent) => {
      const g = gameRef.current;
      if (!g) return;
      const k = e.key;
      if (k === "ArrowUp" || k === "w" || k === "W") {
        if (g.dir !== "down") g.dir = "up";
      }
      if (k === "ArrowDown" || k === "s" || k === "S") {
        if (g.dir !== "up") g.dir = "down";
      }
      if (k === "ArrowLeft" || k === "a" || k === "A") {
        if (g.dir !== "right") g.dir = "left";
      }
      if (k === "ArrowRight" || k === "d" || k === "D") {
        if (g.dir !== "left") g.dir = "right";
      }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [status]);

  useEffect(() => {
    if (status !== "playing" && status !== "countdown") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const draw = () => {
      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      for (let x = 0; x <= W; x++) {
        ctx.strokeStyle = "rgba(40,40,40,0.5)";
        ctx.beginPath();
        ctx.moveTo(x * CELL, 0);
        ctx.lineTo(x * CELL, CANVAS_H);
        ctx.stroke();
      }
      for (let y = 0; y <= H; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * CELL);
        ctx.lineTo(CANVAS_W, y * CELL);
        ctx.stroke();
      }
      const g = gameRef.current;
      if (!g) return;
      ctx.fillStyle = "#00ffff";
      g.snake.forEach((s) => {
        ctx.fillRect(s.x * CELL + 1, s.y * CELL + 1, CELL - 2, CELL - 2);
      });
      ctx.fillStyle = "#ff2d78";
      ctx.fillRect(g.food.x * CELL + 1, g.food.y * CELL + 1, CELL - 2, CELL - 2);
    };
    const iv = setInterval(draw, 50);
    return () => clearInterval(iv);
  }, [status]);

  const handleClose = () => {
    if ((status === "playing" || status === "countdown") && onClose) {
      setConfirmClose(true);
      return;
    }
    onClose?.();
  };

  return (
    <div ref={panelRef} className="snake-panel flex min-h-0 w-full flex-col">
      <div className="panel-title-row w-full shrink-0 overflow-hidden">
        <div className="flex w-full items-center gap-1.5">
          <h3 className="font-pixel glitch-text inline-block shrink-0 text-sm" data-text="SNAKE" style={{ color: "#00ffff" }}>
            SNAKE
          </h3>
          <FeatureInfoIcon
            ariaLabel="How Snake works"
            content={
              <>
                Arrow keys / WASD. Eat food, avoid walls and body. PITS = round(score ÷ 10), max 20 per game. No stake; you don’t lose PITS.
              </>
            }
            className="shrink-0 text-[var(--glitch-teal)]"
            constrainToRef={panelRef}
          />
          {onClose && (
            <button type="button" onClick={handleClose} className="ml-auto font-mono shrink-0 text-[9px] text-gray-400 hover:text-white" aria-label="Close">
              CLOSE
            </button>
          )}
        </div>
        <div className="mt-1 w-full border-b-2 border-[var(--glitch-teal)]/50 pb-1.5 mb-2" aria-hidden />
      </div>
      <div className="panel-content min-h-0 flex-1 flex flex-col gap-0 pt-1.5 pb-3">
        {confirmClose && (
          <div className="mb-1.5 rounded border border-[var(--glitch-pink)]/50 bg-black/50 px-2 py-1.5 text-center font-mono text-[9px]">
            <p className="text-gray-300">Quit? Score will be lost.</p>
            <div className="mt-1.5 flex justify-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  const g = gameRef.current;
                  if (g?.loop) clearInterval(g.loop);
                  if (gameRef.current) gameRef.current.loop = null;
                  setStatus("idle");
                  setCountdown(3);
                  setConfirmClose(false);
                  onClose?.();
                }}
                className="rounded border border-red-500/70 px-1.5 py-0.5 text-red-400"
              >
                QUIT
              </button>
              <button
                type="button"
                onClick={() => setConfirmClose(false)}
                className="rounded border border-[var(--glitch-teal)]/70 px-1.5 py-0.5 text-[var(--glitch-teal)]"
              >
                CANCEL
              </button>
            </div>
          </div>
        )}
        <div className="flex min-h-0 flex-1 items-center justify-center shrink-0 overflow-hidden">
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            className="h-auto max-h-full w-full max-w-full shrink-0 rounded border border-[var(--glitch-pink)]/20"
            style={{ aspectRatio: `${CANVAS_W} / ${CANVAS_H}`, imageRendering: "pixelated" }}
          />
        </div>
        <div className="mt-2 flex shrink-0 flex-col gap-1.5">
          <p className="text-center font-mono text-[9px] leading-tight text-gray-400 sm:text-[10px]">
            {status === "playing" && `Score: ${score} · Arrow keys / WASD`}
            {status === "idle" && "Arrow keys / WASD"}
            {status === "gameover" && `Score: ${score}`}
          </p>
          {status === "countdown" && (
            <p className="text-center font-pixel text-[10px] leading-tight text-[var(--glitch-teal)] animate-pulse sm:text-[11px]">
              Get ready — {countdown}
            </p>
          )}
          {status === "idle" && (
            <button
              type="button"
              onClick={startGame}
              className="w-full rounded border-2 border-[var(--glitch-teal)] bg-[var(--glitch-teal)]/20 py-2 font-pixel text-[9px] text-[var(--glitch-teal)] sm:text-[10px]"
            >
              [ START ]
            </button>
          )}
          {status === "gameover" && (
            <div className="flex flex-col gap-1.5">
              <p className="text-center font-pixel text-[9px] leading-tight text-[var(--glitch-pink)] sm:text-[10px]">GAME OVER — {earned} PITS</p>
              <button
                type="button"
                onClick={startGame}
                className="w-full rounded border-2 border-[var(--glitch-teal)] bg-[var(--glitch-teal)]/20 py-2 font-pixel text-[9px] sm:text-[10px]"
              >
                PLAY AGAIN
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
