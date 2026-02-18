"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useGameStore } from "@/lib/useGameStore";

interface ConnectWalletModalProps {
  onClose: () => void;
}

export function ConnectWalletModal({ onClose }: ConnectWalletModalProps) {
  const setWalletAddress = useGameStore((s) => s.setWalletAddress);
  const [input, setInput] = useState("");
  const { publicKey, connected } = useWallet();

  useEffect(() => {
    if (connected && publicKey) {
      setWalletAddress(publicKey.toBase58());
    } else if (!connected) {
      setWalletAddress(null);
    }
  }, [connected, publicKey, setWalletAddress]);

  const handleConnectPaste = () => {
    const addr = input.trim();
    if (!addr) return;
    setWalletAddress(addr);
    setInput("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md">
        <div
          className="overflow-hidden border-4 border-[#4a4a4a] bg-[var(--bg-darker)]"
          style={{ imageRendering: "pixelated" }}
        >
          <div
            className="flex items-center justify-between px-3 py-2"
            style={{
              backgroundColor: "var(--window-blue)",
              borderBottom: "3px solid var(--window-blue-dark)",
            }}
          >
            <span className="font-pixel text-[10px] text-white">CONNECT WALLET</span>
            <button
              type="button"
              onClick={onClose}
              className="flex h-5 w-6 items-center justify-center border-2 border-[#2d4a72] bg-[#c44]"
            >
              ×
            </button>
          </div>
          <div className="p-6">
            <p className="mb-4 text-center text-[10px] text-gray-400">
              Connect a Solana wallet (Phantom, etc.) or paste any address to track your Glitch Pits stats.
            </p>

            <div className="mb-4 flex justify-center [&_.wallet-adapter-button]:!rounded-none [&_.wallet-adapter-button]:!border-2 [&_.wallet-adapter-button]:!border-[var(--glitch-pink)] [&_.wallet-adapter-button]:!bg-[var(--bg-darker)] [&_.wallet-adapter-button]:!font-pixel [&_.wallet-adapter-button]:!text-[10px]">
              <WalletMultiButton />
            </div>

            <p className="mb-2 text-center font-pixel text-[8px] text-gray-500">OR PASTE ADDRESS</p>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Solana or 0x..."
              className="mb-4 w-full border-2 border-[#4a4a4a] bg-[#1a1a1a] px-3 py-2 font-mono text-[10px] text-white placeholder-gray-500"
            />
            <button
              type="button"
              onClick={handleConnectPaste}
              disabled={!input.trim()}
              className="w-full pixel-btn pixel-btn-accent font-pixel text-[10px]"
            >
              USE THIS ADDRESS
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
