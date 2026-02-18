"use client";

import { getCharacterPreset } from "@/lib/characterPresets";

interface PixelCharacterProps {
  characterId?: string;
  className?: string;
  animated?: boolean;
  size?: "sm" | "md" | "lg";
}

const SIZE_MAP = { sm: "h-1.5 w-1.5", md: "h-2 w-2", lg: "h-2.5 w-2.5" };

export function PixelCharacter({
  characterId = "0",
  className = "",
  animated = true,
  size = "md",
}: PixelCharacterProps) {
  const preset = getCharacterPreset(characterId);
  const cellClass = SIZE_MAP[size];

  return (
    <div
      className={`inline-flex flex-col ${animated ? "animate-pixel-idle" : ""} ${className}`}
      style={{ imageRendering: "pixelated" }}
      aria-hidden
    >
      {preset.map.map((row, y) => (
        <div key={y} className="flex">
          {row.map((cell, x) => (
            <div
              key={`${y}-${x}`}
              className={`${cellClass} flex-shrink-0`}
              style={{
                backgroundColor: preset.colors[cell] ?? "transparent",
                boxShadow:
                  cell && preset.colors[cell] !== "transparent"
                    ? `0 0 ${size === "lg" ? 8 : 6}px ${preset.colors[cell]}50`
                    : "none",
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
