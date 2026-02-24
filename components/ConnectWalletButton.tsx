"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

/** Inline connect-wallet button with visible, readable styling. */
export function ConnectWalletButton() {
  return (
    <div
      className="
        [&_.wallet-adapter-button]:!min-h-[32px]
        [&_.wallet-adapter-button]:!h-8
        [&_.wallet-adapter-button]:!rounded
        [&_.wallet-adapter-button]:!border
        [&_.wallet-adapter-button]:!border-[var(--glitch-pink)]
        [&_.wallet-adapter-button]:!bg-[var(--glitch-pink)]/90
        [&_.wallet-adapter-button]:!px-2.5
        [&_.wallet-adapter-button]:!py-1.5
        [&_.wallet-adapter-button]:!font-pixel
        [&_.wallet-adapter-button]:!text-[8px]
        [&_.wallet-adapter-button]:!text-white
        [&_.wallet-adapter-button]:transition
        [&_.wallet-adapter-button:hover]:!bg-[var(--glitch-pink)]
        [&_.wallet-adapter-button:hover]:!shadow-[0_0_20px_rgba(255,105,180,0.4)]
        [&_.wallet-adapter-button:hover]:!-translate-y-0.5
        [&_.wallet-adapter-button:active]:!translate-y-0
      "
    >
      <WalletMultiButton />
    </div>
  );
}
