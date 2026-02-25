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
    <div className="flex min-w-0 flex-col gap-1 sm:gap-2">
      <p className="truncate text-center font-pixel text-[9px] text-gray-400 sm:text-[10px]">PICK YOUR AVATAR</p>
      <div
        className="grid min-w-0 grid-cols-4 gap-1 sm:grid-cols-5 sm:gap-2"
        style={{ imageRendering: "pixelated" }}
      >
        {CHARACTER_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => onSelect(preset.id)}
            className={`flex flex-col items-center justify-center gap-0 rounded p-1.5 transition min-w-0 sm:p-2 ${
              selectedId === preset.id
                ? "bg-[var(--glitch-teal)]/20 shadow-[0_0_8px_rgba(0,212,170,0.35)]"
                : "bg-[#2a2a2a]/80 hover:bg-[var(--glitch-pink)]/10"
            }`}
          >
            <PixelCharacter
              characterId={preset.id}
              animated={selectedId === preset.id}
              size="sm"
            />
            {!compact && (
              <span className="truncate w-full text-center font-mono text-[8px] text-gray-400 sm:text-[9px]">{preset.name}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
