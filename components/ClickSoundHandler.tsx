"use client";

import { useEffect } from "react";
import { playClickSound } from "@/lib/clickSound";

const CLICKABLE_SELECTOR =
  "button:not(:disabled), a[href], [role='button']:not([aria-disabled='true']), [data-click-sound]";

/**
 * Listens for clicks on buttons/links and plays a retro click sound.
 * Mount once in layout to cover the whole app.
 */
export function ClickSoundHandler() {
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      const clickable = target.closest(CLICKABLE_SELECTOR);
      if (!clickable) return;
      // Skip if it's a link that's just a hash or javascript (optional)
      if (clickable.tagName === "A" && (clickable as HTMLAnchorElement).href?.endsWith("#")) return;
      playClickSound();
    }
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);
  return null;
}
