"use client";

import { useGameStore } from "@/lib/useGameStore";

interface DashboardModalProps {
  onClose: () => void;
}

export function DashboardModal({ onClose }: DashboardModalProps) {
  const walletAddress = useGameStore((s) => s.walletAddress);
  const dashboardStats = useGameStore((s) => s.dashboardStats);
  const mockBalance = useGameStore((s) => s.mockBalance);
  const totalBurnedAllPits = useGameStore((s) => s.totalBurnedAllPits);
  const setWalletAddress = useGameStore((s) => s.setWalletAddress);

  const net = dashboardStats.totalWon - dashboardStats.totalLost;

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
            <span className="font-pixel text-[10px] text-white">DASHBOARD</span>
            <button
              type="button"
              onClick={onClose}
              className="flex h-5 w-6 items-center justify-center border-2 border-[#2d4a72] bg-[#c44]"
            >
              ×
            </button>
          </div>
          <div className="p-6">
            {walletAddress ? (
              <>
                <p className="mb-2 font-mono text-[8px] text-gray-500 break-all">
                  {walletAddress.slice(0, 10)}…{walletAddress.slice(-8)}
                </p>
                <button
                  type="button"
                  onClick={() => setWalletAddress(null)}
                  className="mb-4 text-[8px] text-gray-500 underline hover:text-gray-400"
                >
                  Disconnect
                </button>

                <div className="mb-4 border-2 border-[var(--glitch-gold)]/50 bg-[#252025] p-4">
                  <p className="font-pixel text-[8px] text-gray-500">CURRENT TOKENS (IN-GAME)</p>
                  <p className="font-pixel text-sm" style={{ color: "var(--glitch-gold, #ffd700)" }}>
                    {mockBalance.toLocaleString()} PITS
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="border-2 border-[#4a4a4a] bg-[#252025] p-4">
                    <p className="font-pixel text-[8px] text-gray-500">TOTAL WAGERED (PITS)</p>
                    <p className="font-pixel text-sm" style={{ color: "var(--glitch-teal)" }}>
                      {dashboardStats.totalWagered.toLocaleString()}
                    </p>
                  </div>
                  <div className="border-2 border-[var(--glitch-teal)]/50 bg-[#252025] p-4">
                    <p className="font-pixel text-[8px] text-gray-500">TOTAL WON (PITS)</p>
                    <p className="font-pixel text-sm" style={{ color: "var(--glitch-teal)" }}>
                      +{dashboardStats.totalWon.toLocaleString()}
                    </p>
                  </div>
                  <div className="border-2 border-red-500/50 bg-[#252025] p-4">
                    <p className="font-pixel text-[8px] text-gray-500">TOTAL LOST (PITS)</p>
                    <p className="font-pixel text-sm text-red-400">
                      −{dashboardStats.totalLost.toLocaleString()}
                    </p>
                  </div>
                  <div className="border-2 border-[#4a4a4a] bg-[#252025] p-4">
                    <p className="font-pixel text-[8px] text-gray-500">NET (WON − LOST)</p>
                    <p
                      className="font-pixel text-sm"
                      style={{
                        color: net >= 0 ? "var(--glitch-teal)" : "#f87171",
                      }}
                    >
                      {net >= 0 ? "+" : ""}
                      {net.toLocaleString()} PITS
                    </p>
                  </div>
                  <div className="border-2 border-[var(--glitch-pink)]/50 bg-[#252025] p-4">
                    <p className="font-pixel text-[8px] text-gray-500">UPGRADES (BLACK MARKET)</p>
                    <p className="font-pixel text-sm" style={{ color: "var(--glitch-pink)" }}>
                      {dashboardStats.upgradeCount}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-center text-[10px] text-gray-500">
                Connect a wallet to see your dashboard.
              </p>
            )}

            <div className="mt-6 border-2 border-red-500/30 bg-[#252025] p-4">
              <p className="font-pixel text-[8px] text-gray-500">TOTAL BURNED (ALL GLITCH PITS)</p>
              <p className="font-pixel text-sm text-red-400">
                {totalBurnedAllPits.toLocaleString()} PITS
              </p>
              <p className="mt-1 text-[8px] text-gray-500">
                House wins across all players (live from server)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
