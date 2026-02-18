"use client";

import { useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useGameStore } from "@/lib/useGameStore";

/** Syncs wallet adapter (Phantom, etc.) to the game store so the app knows the connected address. */
export function WalletSync() {
  const { publicKey, connected } = useWallet();
  const setWalletAddress = useGameStore((s) => s.setWalletAddress);

  useEffect(() => {
    if (connected && publicKey) {
      setWalletAddress(publicKey.toBase58());
    } else if (!connected) {
      setWalletAddress(null);
    }
  }, [connected, publicKey, setWalletAddress]);

  return null;
}
