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
  const setTotalBurnedAllPits = useGameStore((s) => s.setTotalBurnedAllPits);

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

    s.on("youWon", (_data: { name: string; amount: number }) => {
      // Post-game is handled by in-canvas result + single START REVENGE only
      // setVictoryData(data);
    });

    s.on("betResult", (data: { won: boolean; payout: number }) => {
      setLastBetResult(data);
    });

    s.on("totalBurned", (amount: number) => {
      setTotalBurnedAllPits(amount);
    });

    setSocket(s);
    return () => {
      s.disconnect();
      setSocket(null);
    };
  }, [addGlitchLog, setBalance, setPlayerId, setCharacterCount, setVictoryData, setLastBetResult, setTotalBurnedAllPits]);

  return { socket, connected };
}
