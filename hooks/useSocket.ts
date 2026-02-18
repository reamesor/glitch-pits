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
  const setVictoryData = useGameStore((s) => s.setVictoryData);
  const setLastBetResult = useGameStore((s) => s.setLastBetResult);

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

    s.on("youWon", (data: { name: string; amount: number }) => {
      setVictoryData(data);
    });

    s.on("betResult", (data: { won: boolean; payout: number }) => {
      setLastBetResult(data);
    });

    setSocket(s);
    return () => {
      s.disconnect();
      setSocket(null);
    };
  }, [addGlitchLog, setBalance, setPlayerId, setCharacterCount, setVictoryData, setLastBetResult]);

  return { socket, connected };
}
