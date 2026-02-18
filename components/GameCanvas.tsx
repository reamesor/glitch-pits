"use client";

import { useEffect, useRef, useCallback } from "react";
import { useGameStore } from "@/lib/useGameStore";
import { useSocket } from "@/hooks/useSocket";
import {
  CHARACTER_FRAMES,
  CLOTHES_SPRITES,
  CLOTHES_COLORS,
  WEAPON_SPRITES,
  WEAPON_COLORS,
  SPRITE_W,
  SPRITE_H,
  type Direction,
} from "@/lib/gameSprites";

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
  facing?: Direction;
  clothes?: string;
  weapon?: string;
}

function drawSprite(
  ctx: CanvasRenderingContext2D,
  sprite: number[][],
  x: number,
  y: number,
  color: string,
  scale: number,
  flipX = false
) {
  const w = sprite[0]?.length || 0;
  const h = sprite.length;
  for (let row = 0; row < h; row++) {
    for (let col = 0; col < w; col++) {
      if (sprite[row]?.[col] === 1) {
        const c = flipX ? w - 1 - col : col;
        ctx.fillStyle = color;
        ctx.fillRect(x + c * scale, y + row * scale, Math.ceil(scale) + 0.5, Math.ceil(scale) + 0.5);
      }
    }
  }
}

function drawCharacter(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  fillColor: string,
  outlineColor: string,
  isLocal: boolean,
  frameIndex: number,
  facing: Direction,
  clothes: string,
  weapon: string
) {
  const scale = PLAYER_SIZE / Math.max(SPRITE_W, SPRITE_H);
  const offsetX = x + (PLAYER_SIZE - SPRITE_W * scale) / 2;
  const offsetY = y + (PLAYER_SIZE - SPRITE_H * scale) / 2;

  const flipX = facing === "left";

  const frame = CHARACTER_FRAMES[frameIndex % CHARACTER_FRAMES.length] || CHARACTER_FRAMES[0];

  drawSprite(ctx, frame, offsetX, offsetY, fillColor, scale, flipX);

  const clothesSprite = CLOTHES_SPRITES[clothes];
  if (clothesSprite?.length) {
    const clothesColor = CLOTHES_COLORS[clothes] || "#4a4a6a";
    drawSprite(ctx, clothesSprite, offsetX, offsetY, clothesColor, scale, flipX);
  }

  const weaponSprite = WEAPON_SPRITES[weapon];
  if (weaponSprite?.length) {
    const weaponColor = WEAPON_COLORS[weapon] || "#c0c0c0";
    const wx = flipX ? offsetX - weaponSprite[0].length * scale : offsetX + SPRITE_W * scale - 2;
    const wy = offsetY + 3 * scale;
    drawSprite(ctx, weaponSprite, wx, wy, weaponColor, scale, flipX);
  }

  if (isLocal) {
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, PLAYER_SIZE, PLAYER_SIZE);
  }
}

export function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playersRef = useRef<Map<string, Player>>(new Map());
  const localKeysRef = useRef({ up: false, down: false, left: false, right: false });
  const animFrameRef = useRef(0);
  const { socket, connected } = useSocket();
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

    const frameIndex = Math.floor(animFrameRef.current / 8) % 3;

    for (const player of players) {
      const isLocal = player.id === playerId;
      const fillColor = isLocal ? "#00d4aa" : "#ff69b4";
      const outlineColor = isLocal ? "#00ffcc" : "#ff8ec4";

      drawCharacter(
        ctx,
        player.x,
        player.y,
        fillColor,
        outlineColor,
        isLocal,
        frameIndex,
        player.facing || "down",
        player.clothes || "vest",
        player.weapon || "sword"
      );

      ctx.font = "10px 'Press Start 2P', monospace";
      ctx.textAlign = "center";
      ctx.fillStyle = isLocal ? "#00d4aa" : "#ff69b4";
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 2;
      const nameText = player.name.slice(0, 8);
      const textX = player.x + PLAYER_SIZE / 2;
      const textY = player.y - 4;
      ctx.strokeText(nameText, textX, textY);
      ctx.fillText(nameText, textX, textY);
    }

    animFrameRef.current++;

    requestAnimationFrame(render);
  }, [playerId]);

  useEffect(() => {
    if (!socket) return;

    const handlePlayerJoined = (data: Player) => {
      playersRef.current.set(data.id, { ...data, isAlive: true });
    };

    const handlePlayerMoved = (data: { id: string; x: number; y: number; facing?: Direction }) => {
      const p = playersRef.current.get(data.id);
      if (p) {
        p.x = data.x;
        p.y = data.y;
        if (data.facing) p.facing = data.facing;
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
      {!connected && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-8 text-center"
          style={{ fontFamily: "'Press Start 2P', monospace" }}
        >
          <p className="mb-4 text-xs" style={{ color: "var(--glitch-pink)" }}>
            ○ OFFLINE
          </p>
          <p className="mb-6 max-w-md text-[8px] leading-relaxed text-gray-400">
            The game server is not connected. Deploy the socket-server to Railway
            and add NEXT_PUBLIC_SOCKET_URL to Vercel. See DEPLOY.md in the repo.
          </p>
          <p className="text-[8px] text-gray-500">
            Run locally: npm run dev
          </p>
        </div>
      )}
      <div className="absolute bottom-2 left-2 font-pixel text-[8px] text-gray-500">
        WASD move | SPACE attack
      </div>
    </div>
  );
}
