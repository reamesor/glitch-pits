"use client";

import { useEffect, useRef, useState } from "react";

const SIZE = 12;
const GLOW_SIZE = 24;

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const isCoarse = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
    if (isCoarse) return;

    document.body.style.cursor = "none";
    setVisible(true);

    const onMove = (e: MouseEvent) => {
      const el = dotRef.current;
      if (el) {
        el.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
      }
    };

    window.addEventListener("mousemove", onMove, { passive: true });

    return () => {
      window.removeEventListener("mousemove", onMove);
      document.body.style.cursor = "";
    };
  }, []);

  if (!visible) return null;

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
        borderRadius: "50%",
        backgroundColor: "var(--glitch-pink)",
        boxShadow: `
          0 0 ${GLOW_SIZE}px var(--glitch-pink),
          0 0 ${GLOW_SIZE * 1.5}px var(--glitch-pink),
          0 0 ${GLOW_SIZE * 2}px rgba(255, 105, 180, 0.5)
        `,
        pointerEvents: "none",
        zIndex: 99999,
        willChange: "transform",
      }}
    />
  );
}
