"use client";

import { useEffect, useRef, useCallback } from "react";
import { useGameStore } from "@/lib/useGameStore";
import { useSocket } from "@/hooks/useSocket";

const ARENA_WIDTH = 800;
const ARENA_HEIGHT = 600;
const PLAYER_SIZE = 16;

interface Player {
  id: string;
  name: string;
  x: number;
  y: number;
  balance: number;
  isAlive?: boolean;
}

export function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playersRef = useRef<Map<string, Player>>(new Map());
  const localKeysRef = useRef({ up: false, down: false, left: false, right: false });
  const { socket } = useSocket();
  const playerId = useGameStore((s) => s.playerId);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#050508";
    ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

    ctx.strokeStyle = "#ff69b4";
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

    const players = Array.from(playersRef.current.values()).filter(
      (p) => p.isAlive !== false
    );

    for (const player of players) {
      ctx.fillStyle = player.id === playerId ? "#00d4aa" : "#ff69b4";
      ctx.fillRect(player.x, player.y, PLAYER_SIZE, PLAYER_SIZE);

      ctx.strokeStyle = player.id === playerId ? "#00d4aa" : "#ff69b4";
      ctx.lineWidth = 1;
      ctx.strokeRect(player.x, player.y, PLAYER_SIZE, PLAYER_SIZE);
    }

    requestAnimationFrame(render);
  }, [playerId]);

  useEffect(() => {
    if (!socket) return;

    const handlePlayerJoined = (data: Player) => {
      playersRef.current.set(data.id, { ...data, isAlive: true });
    };

    const handlePlayerMoved = (data: { id: string; x: number; y: number }) => {
      const p = playersRef.current.get(data.id);
      if (p) {
        p.x = data.x;
        p.y = data.y;
      }
    };

    const handleKilled = () => {
      if (playerId) {
        playersRef.current.delete(playerId);
      }
    };

    socket.on("playerJoined", handlePlayerJoined);
    socket.on("playerMoved", handlePlayerMoved);
    socket.on("killed", handleKilled);

    socket.on("players", (list: Player[]) => {
      playersRef.current.clear();
      list.forEach((p) => playersRef.current.set(p.id, { ...p, isAlive: true }));
    });

    return () => {
      socket.off("playerJoined", handlePlayerJoined);
      socket.off("playerMoved", handlePlayerMoved);
      socket.off("killed", handleKilled);
      socket.off("players");
    };
  }, [socket, playerId]);

  useEffect(() => {
    if (!socket || !playerId) return;

    const sendMove = () => {
      const k = localKeysRef.current;
      if (k.up || k.down || k.left || k.right) {
        socket.emit("move", {
          up: k.up,
          down: k.down,
          left: k.left,
          right: k.right,
        });
      }
    };

    const interval = setInterval(sendMove, 1000 / 30);
    return () => clearInterval(interval);
  }, [socket, playerId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!playerId) return;
      switch (e.key.toLowerCase()) {
        case "w":
          e.preventDefault();
          localKeysRef.current.up = true;
          break;
        case "s":
          e.preventDefault();
          localKeysRef.current.down = true;
          break;
        case "a":
          e.preventDefault();
          localKeysRef.current.left = true;
          break;
        case "d":
          e.preventDefault();
          localKeysRef.current.right = true;
          break;
        case " ":
          e.preventDefault();
          socket?.emit("attack");
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case "w":
          localKeysRef.current.up = false;
          break;
        case "s":
          localKeysRef.current.down = false;
          break;
        case "a":
          localKeysRef.current.left = false;
          break;
        case "d":
          localKeysRef.current.right = false;
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [socket, playerId]);

  useEffect(() => {
    const raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [render]);

  return (
    <div
      className="relative overflow-hidden rounded-lg border-2 bg-black"
      style={{ borderColor: "rgba(255, 105, 180, 0.4)" }}
    >
      <canvas
        ref={canvasRef}
        width={ARENA_WIDTH}
        height={ARENA_HEIGHT}
        className="block"
        style={{ imageRendering: "pixelated" }}
      />
      <div className="absolute bottom-2 left-2 font-pixel text-[8px] text-gray-500">
        WASD move | SPACE attack
      </div>
    </div>
  );
}
