"use client";

import { useEffect, useRef } from "react";
import { useGameStore } from "@/lib/useGameStore";

export function GlitchLog() {
  const glitchLog = useGameStore((s) => s.glitchLog);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [glitchLog]);

  const getCardStyle = (type: string) => {
    switch (type) {
      case "kill":
      case "event":
        return {
          borderColor: "var(--glitch-pink)",
          backgroundColor: "rgba(255, 105, 180, 0.08)",
          accentColor: "var(--glitch-pink)",
        };
      case "arena":
        return {
          borderColor: "var(--glitch-orange, #ff8c42)",
          backgroundColor: "rgba(255, 140, 66, 0.08)",
          accentColor: "var(--glitch-orange, #ff8c42)",
        };
      case "critical":
        return {
          borderColor: "#dc2626",
          backgroundColor: "rgba(220, 38, 38, 0.1)",
          accentColor: "#dc2626",
        };
      case "forge":
        return {
          borderColor: "var(--glitch-teal)",
          backgroundColor: "rgba(0, 212, 170, 0.08)",
          accentColor: "var(--glitch-teal)",
        };
      case "winner":
      case "payout":
        return {
          borderColor: "var(--glitch-gold, #ffd700)",
          backgroundColor: "rgba(255, 215, 0, 0.1)",
          accentColor: "#ffd700",
        };
      case "rumble":
        return {
          borderColor: "var(--glitch-purple)",
          backgroundColor: "rgba(107, 75, 154, 0.15)",
          accentColor: "var(--glitch-purple)",
        };
      default:
        return {
          borderColor: "#4a4a4a",
          backgroundColor: "rgba(107, 75, 154, 0.1)",
          accentColor: "#9ca3af",
        };
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "kill":
      case "event":
        return "PIT";
      case "arena":
        return "ARENA";
      case "critical":
        return "CRITICAL";
      case "forge":
        return "ENTERED";
      case "winner":
        return "WINNER";
      case "payout":
        return "PAYOUT";
      case "rumble":
        return "RUMBLE";
      case "disconnect":
        return "DISCONNECT";
      default:
        return "EVENT";
    }
  };

  return (
    <div className="flex h-full flex-col">
      <h3
        className="font-pixel glitch-text mb-3 border-b-2 border-[var(--glitch-teal)]/40 pb-2 text-sm"
        data-text="GLITCH LOG"
        style={{ color: "var(--glitch-teal)" }}
      >
        GLITCH LOG
      </h3>
      <div
        ref={scrollRef}
        className="flex flex-1 flex-col gap-2 overflow-y-auto"
      >
        {glitchLog.length === 0 ? (
          <div
            className="border-4 border-dashed border-[#4a4a4a] p-4 text-center"
            style={{ imageRendering: "pixelated" }}
          >
            <p className="font-mono text-xs text-gray-500">
              Awaiting transmissions...
            </p>
          </div>
        ) : (
          glitchLog.map((entry) => {
            const style = getCardStyle(entry.type);
            return (
              <div
                key={entry.id}
                className="flex gap-3 border-4 p-3 transition hover:opacity-90"
                style={{
                  borderColor: style.borderColor,
                  backgroundColor: style.backgroundColor,
                  imageRendering: "pixelated",
                  boxShadow: "3px 3px 0 rgba(0,0,0,0.2)",
                }}
              >
                {/* Avatar/icon placeholder */}
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded border-2 font-pixel text-[9px]"
                  style={{
                    borderColor: style.accentColor,
                    color: style.accentColor,
                    backgroundColor: "rgba(0,0,0,0.3)",
                  }}
                >
                  {entry.type === "kill" ? "💀" : entry.type === "arena" ? "⚠" : entry.type === "critical" ? "✕" : entry.type === "forge" ? "⚡" : "•"}
                </div>
                <div className="min-w-0 flex-1">
                  <span
                    className="font-pixel text-[9px] uppercase"
                    style={{ color: style.accentColor }}
                  >
                    {getTypeLabel(entry.type)}
                  </span>
                  <p className="mt-1 font-mono text-xs leading-snug text-gray-300">
                    {entry.message}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
