"use client";

import { useState, useRef, useEffect } from "react";

interface FeatureInfoIconProps {
  /** Short explanation shown in the popover */
  content: React.ReactNode;
  /** Accessible label for the icon button */
  ariaLabel?: string;
  /** Optional class for the wrapper (e.g. to align with panel title color) */
  className?: string;
}

export function FeatureInfoIcon({ content, ariaLabel = "How this feature works", className = "" }: FeatureInfoIconProps) {
  const [open, setOpen] = useState(false);
  const popRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div className={`relative inline-flex ${className}`} ref={popRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-current opacity-80 transition hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-[var(--glitch-teal)]/50"
        aria-label={ariaLabel}
        aria-expanded={open}
      >
        <span className="font-mono text-[9px] font-bold leading-none">i</span>
      </button>
      {open && (
        <div
          className="absolute left-1/2 top-full z-50 mt-1 w-48 -translate-x-1/2 rounded border border-[var(--glitch-pink)]/40 bg-[var(--bg-darker)] p-2 shadow-lg sm:w-56"
          role="tooltip"
        >
          <div className="font-mono text-[9px] leading-relaxed text-gray-200 sm:text-[10px]">
            {content}
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-1.5 w-full rounded border border-[var(--glitch-teal)]/50 py-0.5 font-pixel text-[8px] text-[var(--glitch-teal)] hover:bg-[var(--glitch-teal)]/10"
          >
            GOT IT
          </button>
        </div>
      )}
    </div>
  );
}
