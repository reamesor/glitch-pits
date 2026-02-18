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
  const setPlayerCount = useGameStore((s) => s.setPlayerCount);
  const setTreasuryBalance = useGameStore((s) => s.setTreasuryBalance);

  useEffect(() => {
    const s = io(SOCKET_URL, { autoConnect: true });

    s.on("connect", () => setConnected(true));
    s.on("disconnect", () => setConnected(false));

    s.on("spawned", (data: { id: string; balance: number; x: number; y: number }) => {
      setPlayerId(data.id);
      setBalance(data.balance);
    });

    s.on("glitchLog", (data: { type: string; message: string }) => {
      addGlitchLog(data);
    });

    s.on("balanceUpdate", (data: { balance: number }) => {
      setBalance(data.balance);
    });

    s.on("balanceSplit", (data: { toTreasury: number }) => {
      setTreasuryBalance(data.toTreasury);
    });

    s.on("playerCount", (count: number) => {
      setPlayerCount(count);
    });

    setSocket(s);
    return () => {
      s.disconnect();
      setSocket(null);
    };
  }, [addGlitchLog, setBalance, setPlayerId, setPlayerCount, setTreasuryBalance]);

  return { socket, connected };
}
