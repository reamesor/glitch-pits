"use client";

interface ConnectToEnterModalProps {
  onConnect: () => void;
  onClose: () => void;
}

export function ConnectToEnterModal({ onConnect, onClose }: ConnectToEnterModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-md">
        <div
          className="overflow-hidden border-4 border-[var(--glitch-pink)]/50 bg-[var(--bg-darker)] shadow-[0_0_32px_rgba(255,105,180,0.15)]"
          style={{ imageRendering: "pixelated" }}
        >
          <div
            className="flex items-center justify-between px-3 py-2"
            style={{
              backgroundColor: "var(--window-blue)",
              borderBottom: "3px solid var(--window-blue-dark)",
            }}
          >
            <span className="font-pixel text-[10px] text-white">ENTER THE PITS</span>
            <button
              type="button"
              onClick={onClose}
              className="flex h-5 w-6 items-center justify-center border-2 border-[#2d4a72] bg-[#c44] text-white hover:bg-[#a33]"
            >
              ×
            </button>
          </div>
          <div className="space-y-4 p-6">
            <p className="text-center font-pixel text-sm text-white">
              You need to connect a wallet to enter the Pits.
            </p>
            <div className="rounded border-2 border-[var(--glitch-teal)]/40 bg-black/40 p-4">
              <p className="text-center font-mono text-[11px] leading-relaxed text-gray-300">
                Don&apos;t worry — this is a glitch test. All assets are safe. We recommend using a test
                wallet address.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={onConnect}
                className="pixel-btn pixel-btn-accent w-full font-pixel text-[10px]"
              >
                CONNECT WALLET
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full border-2 border-[#4a4a4a] bg-[#2a2a2a] px-4 py-2 font-pixel text-[10px] text-gray-400 hover:bg-[#3a3a3a]"
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
