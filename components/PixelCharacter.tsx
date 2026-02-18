"use client";

interface PixelCharacterProps {
  className?: string;
  animated?: boolean;
}

/** 6x8 pixel grid: 0=transparent, 1=teal, 2=pink, 3=dark */
const PIXEL_MAP = [
  [0, 0, 1, 1, 1, 0],
  [0, 1, 1, 1, 1, 1],
  [0, 2, 2, 3, 2, 2],
  [1, 2, 3, 3, 3, 2],
  [1, 1, 3, 3, 3, 1],
  [1, 1, 1, 3, 1, 1],
  [0, 1, 1, 1, 1, 0],
  [0, 0, 1, 1, 1, 0],
];

const PIXEL_COLORS: Record<number, string> = {
  0: "transparent",
  1: "var(--glitch-teal)",
  2: "var(--glitch-pink)",
  3: "#2a2a2a",
};

export function PixelCharacter({ className = "", animated = true }: PixelCharacterProps) {
  return (
    <div
      className={`inline-flex flex-col ${animated ? "animate-pixel-float" : ""} ${className}`}
      style={{ imageRendering: "pixelated" }}
      aria-hidden
    >
      {PIXEL_MAP.map((row, y) => (
        <div key={y} className="flex">
          {row.map((cell, x) => (
            <div
              key={`${y}-${x}`}
              className="h-2 w-2 flex-shrink-0"
              style={{
                backgroundColor: PIXEL_COLORS[cell],
                boxShadow: cell ? `0 0 6px ${PIXEL_COLORS[cell]}50` : "none",
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
