"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

/** Inline connect-wallet button with pixel styling. */
export function ConnectWalletButton() {
  return (
    <div className="[&_.wallet-adapter-button]:!rounded-none [&_.wallet-adapter-button]:!border-2 [&_.wallet-adapter-button]:!border-[var(--glitch-pink)] [&_.wallet-adapter-button]:!bg-[var(--bg-darker)] [&_.wallet-adapter-button]:!font-pixel [&_.wallet-adapter-button]:!text-[9px] [&_.wallet-adapter-button]:!py-1 [&_.wallet-adapter-button]:!px-2">
      <WalletMultiButton />
    </div>
  );
}
