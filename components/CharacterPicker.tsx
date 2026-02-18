"use client";

import { PixelCharacter } from "@/components/PixelCharacter";
import { CHARACTER_PRESETS } from "@/lib/characterPresets";

interface CharacterPickerProps {
  selectedId: string;
  onSelect: (id: string) => void;
  compact?: boolean;
}

export function CharacterPicker({ selectedId, onSelect, compact = false }: CharacterPickerProps) {
  return (
    <div className="flex flex-col gap-2">
      <p className="font-pixel text-[9px] text-gray-400">PICK YOUR AVATAR</p>
      <div
        className="grid grid-cols-5 gap-2 sm:grid-cols-5"
        style={{ imageRendering: "pixelated" }}
      >
        {CHARACTER_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => onSelect(preset.id)}
            className={`flex flex-col items-center gap-0.5 rounded border-2 p-1.5 transition ${
              selectedId === preset.id
                ? "border-[var(--glitch-teal)] bg-[var(--glitch-teal)]/20 shadow-[0_0_12px_rgba(0,212,170,0.4)]"
                : "border-[#4a4a4a] bg-[#2a2a2a]/80 hover:border-[var(--glitch-pink)]/50 hover:bg-[var(--glitch-pink)]/10"
            }`}
          >
            <PixelCharacter
              characterId={preset.id}
              animated={selectedId === preset.id}
              size={compact ? "sm" : "md"}
            />
            {!compact && (
              <span className="font-mono text-[8px] text-gray-500">{preset.name}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
