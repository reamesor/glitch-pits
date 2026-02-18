"use client";

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useGameStore } from "@/lib/useGameStore";

const SOCKET_URL =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin)
    : "";

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  const addGlitchLog = useGameStore((s) => s.addGlitchLog);
  const setBalance = useGameStore((s) => s.setBalance);
  const setPlayerId = useGameStore((s) => s.setPlayerId);
  const setCharacterCount = useGameStore((s) => s.setCharacterCount);
  const setRumbleState = useGameStore((s) => s.setRumbleState);
  const setVictoryData = useGameStore((s) => s.setVictoryData);
  const setLeaderboard = useGameStore((s) => s.setLeaderboard);

  useEffect(() => {
    const s = io(SOCKET_URL, { autoConnect: true });

    s.on("connect", () => setConnected(true));
    s.on("disconnect", () => setConnected(false));

    s.on("spawned", (data: { id: string; balance: number }) => {
      setPlayerId(data.id);
      setBalance(data.balance);
    });

    s.on("glitchLog", (data: { type: string; message: string }) => {
      addGlitchLog(data);
    });

    s.on("balanceUpdate", (data: { balance: number }) => {
      setBalance(data.balance);
    });

    s.on("characterCount", (count: number) => {
      setCharacterCount(count);
    });

    s.on("rumbleState", (state: unknown) => {
      setRumbleState(state as import("@/lib/useGameStore").RumbleState);
    });

    s.on("youWon", (data: { name: string; amount: number }) => {
      setVictoryData(data);
    });

    s.on("leaderboard", (entries: import("@/lib/useGameStore").LeaderboardEntry[]) => {
      setLeaderboard(entries);
    });

    setSocket(s);
    return () => {
      s.disconnect();
      setSocket(null);
    };
  }, [addGlitchLog, setBalance, setPlayerId, setCharacterCount, setRumbleState, setVictoryData, setLeaderboard]);

  return { socket, connected };
}
