"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useGameStore } from "@/lib/useGameStore";
import { soundManager } from "@/lib/soundManager";

const W = 14;
const H = 20;
const CELL = 10;
const CANVAS_W = W * CELL;
const CANVAS_H = H * CELL;
const PITS_CAP = 20;

type Dir = "up" | "down" | "left" | "right";

interface SnakePanelProps {
  onClose?: () => void;
}

export function SnakePanel({ onClose }: SnakePanelProps) {
  const addToBalance = useGameStore((s) => s.addToBalance);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<"idle" | "playing" | "gameover">("idle");
  const [score, setScore] = useState(0);
  const [earned, setEarned] = useState(0);
  const [confirmClose, setConfirmClose] = useState(false);
  const targetRef = useRef<{ x: number; y: number } | null>(null);
  const gameRef = useRef<{ snake: { x: number; y: number }[]; dir: Dir; food: { x: number; y: number }; loop: ReturnType<typeof setInterval> | null }>({
    snake: [],
    dir: "right",
    food: { x: 0, y: 0 },
    loop: null,
  });

  const startGame = useCallback(() => {
    setStatus("playing");
    setScore(0);
    setEarned(0);
    const cx = Math.floor(W / 2);
    const cy = Math.floor(H / 2);
    const snake = [{ x: cx - 2, y: cy }, { x: cx - 1, y: cy }, { x: cx, y: cy }];
    let food = { x: cx + 3, y: cy };
    const set = new Set(snake.map((s) => `${s.x},${s.y}`));
    if (set.has(`${food.x},${food.y}`)) {
      food = { x: cx + 4, y: cy };
    }
    gameRef.current = { snake, dir: "right", food, loop: null };
  }, []);

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
    const target = targetRef.current;
    if (target !== null) {
      const dx = target.x - head.x;
      const dy = target.y - head.y;
      if (Math.abs(dx) >= Math.abs(dy)) {
        g.dir = dx > 0 ? "right" : dx < 0 ? "left" : g.dir;
      } else {
        g.dir = dy > 0 ? "down" : dy < 0 ? "up" : g.dir;
      }
    }
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
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const px = (e.clientX - rect.left) * scaleX;
      const py = (e.clientY - rect.top) * scaleY;
      const cx = Math.floor(px / CELL);
      const cy = Math.floor(py / CELL);
      if (cx >= 0 && cx < W && cy >= 0 && cy < H) targetRef.current = { x: cx, y: cy };
    };
    canvas.addEventListener("mousemove", onMove);
    return () => canvas.removeEventListener("mousemove", onMove);
  }, [status]);

  useEffect(() => {
    if (status !== "playing") return;
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
    if (status === "playing" && onClose) {
      setConfirmClose(true);
      return;
    }
    onClose?.();
  };

  return (
    <div className="snake-panel rounded border border-[var(--glitch-teal)]/40 bg-[var(--bg-card)] p-2">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="font-pixel text-[7px] text-[var(--glitch-teal)]">SNAKE</span>
        {onClose && (
          <button type="button" onClick={handleClose} className="font-mono text-[7px] text-gray-500 hover:text-white" aria-label="Close">
            CLOSE
          </button>
        )}
      </div>
      {confirmClose && (
        <div className="mb-1.5 rounded border border-[var(--glitch-pink)]/50 bg-black/50 p-1.5 text-center font-mono text-[7px]">
          <p className="text-gray-300">Quit? Score will be lost.</p>
          <div className="mt-1.5 flex justify-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                const g = gameRef.current;
                if (g?.loop) clearInterval(g.loop);
                if (gameRef.current) gameRef.current.loop = null;
                setStatus("idle");
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
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        className="mx-auto block rounded border border-[var(--glitch-teal)]/30 cursor-crosshair"
        style={{ width: CANVAS_W, height: CANVAS_H, imageRendering: "pixelated" }}
      />
      <p className="mt-1 text-center font-mono text-[7px] text-gray-500">Score: {score} · Move cursor to steer</p>
      {status === "idle" && (
        <button
          type="button"
          onClick={startGame}
          className="mt-1.5 w-full rounded border border-[var(--glitch-teal)] bg-[var(--glitch-teal)]/20 py-1 font-pixel text-[7px] text-[var(--glitch-teal)]"
        >
          [ START ]
        </button>
      )}
      {status === "gameover" && (
        <div className="mt-1.5 text-center">
          <p className="font-pixel text-[8px] text-[var(--glitch-pink)]">GAME OVER — {earned} PITS</p>
          <button
            type="button"
            onClick={startGame}
            className="mt-1 w-full rounded border border-[var(--glitch-teal)] bg-[var(--glitch-teal)]/20 py-1 font-pixel text-[7px]"
          >
            PLAY AGAIN
          </button>
        </div>
      )}
    </div>
  );
}
