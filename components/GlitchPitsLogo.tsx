"use client";

interface GlitchPitsLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClass = {
  sm: "text-xs",
  md: "text-base sm:text-lg",
  lg: "text-xl sm:text-2xl md:text-3xl",
};

export function GlitchPitsLogo({ className = "", size = "md" }: GlitchPitsLogoProps) {
  return (
    <span
      className={`font-pixel glitch-text glitch-pits-logo uppercase ${sizeClass[size]} ${className}`}
      data-text="GLITCH PITS"
      style={{ color: "var(--glitch-pink)" }}
      aria-hidden
    >
      GLITCH PITS
    </span>
  );
}
