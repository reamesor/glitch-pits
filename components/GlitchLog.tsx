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
        return {
          borderColor: "var(--glitch-pink)",
          backgroundColor: "rgba(255, 105, 180, 0.08)",
          accentColor: "var(--glitch-pink)",
        };
      case "forge":
        return {
          borderColor: "var(--glitch-teal)",
          backgroundColor: "rgba(0, 212, 170, 0.08)",
          accentColor: "var(--glitch-teal)",
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
        return "DE-REZZED";
      case "forge":
        return "ENTERED";
      case "disconnect":
        return "DISCONNECT";
      default:
        return "EVENT";
    }
  };

  return (
    <div className="flex h-full flex-col">
      <h3
        className="font-pixel glitch-text mb-3 border-b-4 border-[#4a4a4a] pb-2 text-xs"
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
            <p className="font-mono text-[10px] text-gray-600">
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
                  className="flex h-10 w-10 shrink-0 items-center justify-center border-2 font-pixel text-[8px]"
                  style={{
                    borderColor: style.accentColor,
                    color: style.accentColor,
                    backgroundColor: "rgba(0,0,0,0.3)",
                  }}
                >
                  {entry.type === "kill" ? "💀" : entry.type === "forge" ? "⚡" : "•"}
                </div>
                <div className="min-w-0 flex-1">
                  <span
                    className="font-pixel text-[8px] uppercase"
                    style={{ color: style.accentColor }}
                  >
                    {getTypeLabel(entry.type)}
                  </span>
                  <p className="mt-1 font-mono text-[10px] leading-tight text-gray-300">
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
