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
    <div className="flex flex-col gap-3">
      <p className="text-center font-pixel text-[9px] text-gray-500">PICK YOUR AVATAR</p>
      <div
        className="grid grid-cols-4 gap-3 sm:grid-cols-5 sm:gap-4"
        style={{ imageRendering: "pixelated" }}
      >
        {CHARACTER_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => onSelect(preset.id)}
            className={`flex flex-col items-center justify-center gap-0.5 rounded border-2 p-2.5 transition min-w-0 sm:p-3 ${
              selectedId === preset.id
                ? "border-[var(--glitch-teal)] bg-[var(--glitch-teal)]/20 shadow-[0_0_12px_rgba(0,212,170,0.4)]"
                : "border-[#4a4a4a] bg-[#2a2a2a]/80 hover:border-[var(--glitch-pink)]/50 hover:bg-[var(--glitch-pink)]/10"
            }`}
          >
            <PixelCharacter
              characterId={preset.id}
              animated={selectedId === preset.id}
              size="md"
            />
            {!compact && (
              <span className="truncate w-full text-center font-mono text-[8px] text-gray-500">{preset.name}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
