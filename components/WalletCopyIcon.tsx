"use client";

import { useState } from "react";

interface WalletCopyIconProps {
  address: string;
}

export function WalletCopyIcon({ address }: WalletCopyIconProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="flex h-8 w-8 items-center justify-center border-2 border-[#4a4a4a] bg-[var(--bg-card)] font-mono text-[10px] transition hover:border-[var(--glitch-teal)]/50"
      title={copied ? "Copied!" : "Copy address"}
    >
      {copied ? "✓" : "⎘"}
    </button>
  );
}
