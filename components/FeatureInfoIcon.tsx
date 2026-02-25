"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

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
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || typeof document === "undefined") return;
    const close = (e: MouseEvent) => {
      const target = e.target as Node;
      if (buttonRef.current?.contains(target) || popRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  useEffect(() => {
    if (!open || !buttonRef.current || typeof document === "undefined") return;
    const rect = buttonRef.current.getBoundingClientRect();
    const gap = 6;
    const padding = 20;
    const maxW = Math.min(380, document.documentElement.clientWidth - padding * 2);
    const popoverWidth = maxW;
    const centerX = rect.left + rect.width / 2;
    const left = Math.max(padding, Math.min(centerX - popoverWidth / 2, document.documentElement.clientWidth - popoverWidth - padding));
    const top = rect.bottom + gap;
    setPopoverStyle({ left, top, width: popoverWidth, minWidth: 260 });
  }, [open]);

  return (
    <>
      <div className={`relative inline-flex ${className}`}>
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-current opacity-80 transition hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-[var(--glitch-teal)]/50"
          aria-label={ariaLabel}
          aria-expanded={open}
        >
          <span className="font-mono text-[9px] font-bold leading-none">i</span>
        </button>
      </div>
      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={popRef}
            className="fixed z-[100] rounded border border-[var(--glitch-pink)]/40 bg-[var(--bg-darker)] p-3 shadow-lg"
            style={popoverStyle}
            role="tooltip"
          >
            <div className="font-mono text-[10px] leading-relaxed text-gray-200 sm:text-[11px] break-words" style={{ overflowWrap: "break-word" }}>
              {content}
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-1.5 w-full rounded border border-[var(--glitch-teal)]/50 py-0.5 font-pixel text-[8px] text-[var(--glitch-teal)] hover:bg-[var(--glitch-teal)]/10"
            >
              GOT IT
            </button>
          </div>,
          document.body
        )}
    </>
  );
}
