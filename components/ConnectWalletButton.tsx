"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

/** Inline connect-wallet button with visible, readable styling. */
export function ConnectWalletButton() {
  return (
    <div
      className="
        [&_.wallet-adapter-button]:!min-h-[40px]
        [&_.wallet-adapter-button]:!rounded-none
        [&_.wallet-adapter-button]:!border-2
        [&_.wallet-adapter-button]:!border-[var(--glitch-pink)]
        [&_.wallet-adapter-button]:!bg-[var(--glitch-pink)]
        [&_.wallet-adapter-button]:!px-4
        [&_.wallet-adapter-button]:!py-2
        [&_.wallet-adapter-button]:!font-pixel
        [&_.wallet-adapter-button]:!text-xs
        [&_.wallet-adapter-button]:!text-white
        [&_.wallet-adapter-button]:!font-semibold
        [&_.wallet-adapter-button]:transition
        [&_.wallet-adapter-button:hover]:!bg-[var(--glitch-pink)]
        [&_.wallet-adapter-button:hover]:!opacity-90
        [&_.wallet-adapter-button:hover]:!shadow-[0_0_16px_rgba(255,105,180,0.5)]
      "
    >
      <WalletMultiButton />
    </div>
  );
}
