"use client";

import { useEffect, useRef, useState } from "react";

const SIZE = 12;
const GLOW_SIZE = 24;
const GLOW_SIZE_HOVER = 36;

function isClickable(el: Element | null): boolean {
  if (!el || el === document.body) return false;
  const tag = el.tagName.toLowerCase();
  const role = el.getAttribute("role");
  const hasClick = "onclick" in el || el.getAttribute("tabIndex") === "0";
  if (tag === "button" || tag === "a" || tag === "input" || tag === "select" || tag === "textarea") return true;
  if (role === "button" || role === "link" || role === "menuitem") return true;
  if (hasClick) return true;
  try {
    const style = window.getComputedStyle(el);
    if (style.cursor === "pointer") return true;
  } catch {
    // ignore
  }
  return isClickable(el.parentElement);
}

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [overClickable, setOverClickable] = useState(false);

  useEffect(() => {
    const isCoarse = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
    if (isCoarse) return;

    document.body.style.cursor = "none";
    document.body.classList.add("custom-cursor-active");
    setVisible(true);

    const onMove = (e: MouseEvent) => {
      const el = dotRef.current;
      if (el) {
        el.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
      }
      const target = document.elementFromPoint(e.clientX, e.clientY);
      setOverClickable(isClickable(target));
    };

    window.addEventListener("mousemove", onMove, { passive: true });

    return () => {
      window.removeEventListener("mousemove", onMove);
      document.body.style.cursor = "";
      document.body.classList.remove("custom-cursor-active");
    };
  }, []);

  if (!visible) return null;

  const glow = overClickable ? GLOW_SIZE_HOVER : GLOW_SIZE;

  return (
    <div
      ref={dotRef}
      className="custom-cursor-dot"
      aria-hidden
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        width: SIZE,
        height: SIZE,
        pointerEvents: "none",
        zIndex: 99999,
        willChange: "transform",
      }}
    >
      <div
        className={`custom-cursor-dot-inner ${overClickable ? "custom-cursor-dot--clickable" : ""}`}
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "50%",
          backgroundColor: "var(--glitch-pink)",
          boxShadow: `
            0 0 ${glow}px var(--glitch-pink),
            0 0 ${glow * 1.5}px var(--glitch-pink),
            0 0 ${glow * 2}px rgba(255, 105, 180, ${overClickable ? "0.8" : "0.5"})
          `,
        }}
      />
    </div>
  );
}
