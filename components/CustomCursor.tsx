"use client";

import { useEffect, useRef, useState } from "react";

const SMOOTH = 8; // higher = slower, smoother follow (byld-style)
const SIZE = 12;
const GLOW_SIZE = 24;

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const pos = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });
  const raf = useRef<number>(0);

  useEffect(() => {
    const isCoarse = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
    if (isCoarse) return;

    document.body.style.cursor = "none";
    setVisible(true);

    const onMove = (e: MouseEvent) => {
      target.current = { x: e.clientX, y: e.clientY };
      if (!pos.current.x && !pos.current.y) pos.current = { ...target.current };
    };

    const tick = () => {
      const { x: tx, y: ty } = target.current;
      const { x: px, y: py } = pos.current;
      pos.current = {
        x: px + (tx - px) / SMOOTH,
        y: py + (ty - py) / SMOOTH,
      };
      const el = dotRef.current;
      if (el) {
        el.style.transform = `translate(${pos.current.x}px, ${pos.current.y}px) translate(-50%, -50%)`;
      }
      raf.current = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    raf.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      if (raf.current) cancelAnimationFrame(raf.current);
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
