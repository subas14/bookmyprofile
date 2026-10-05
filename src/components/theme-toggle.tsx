"use client";

import { useEffect, useState } from "react";

/**
 * Light / dark theme switch.
 *
 * The theme lives on `<html data-theme>` so every CSS token swaps at once. The
 * initial value is applied by an inline script in the root layout (before
 * paint) to avoid a flash of the wrong theme; this component only mirrors and
 * mutates that value.
 */

export const THEME_STORAGE_KEY = "bmp-theme";

type Theme = "light" | "dark";

/**
 * Inline script string injected before hydration. Kept in sync with
 * THEME_STORAGE_KEY. Light is the default: dark only applies once a visitor
 * has chosen it with the toggle (stored in localStorage), never from the OS
 * preference alone.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var s=localStorage.getItem("${THEME_STORAGE_KEY}");document.documentElement.setAttribute("data-theme",s==="dark"?"dark":"light");}catch(e){document.documentElement.setAttribute("data-theme","light");}})();`;

function readTheme(): Theme {
  const attr = document.documentElement.getAttribute("data-theme");
  return attr === "dark" ? "dark" : "light";
}

export function ThemeToggle({ className }: { className?: string }) {
  // Start undefined so the icon is not rendered until we know the real theme.
  const [theme, setTheme] = useState<Theme | undefined>(undefined);

  useEffect(() => {
    setTheme(readTheme());
  }, []);

  function toggle() {
    const next: Theme = readTheme() === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Storage can be unavailable (private mode); the theme still applies for
      // this page view.
    }
    setTheme(next);
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={
        theme === undefined
          ? "Toggle colour theme"
          : `Switch to ${isDark ? "light" : "dark"} theme`
      }
      title="Toggle theme"
      className={[
        "inline-flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted",
        "transition-colors hover:border-line-strong hover:text-foreground",
        className ?? "",
      ].join(" ")}
    >
      {/* Moon (shown in light mode: click to go dark) */}
      <svg
        aria-hidden
        width="16"
        height="16"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={isDark ? "hidden" : "block"}
      >
        <path d="M16.5 12.4A7 7 0 0 1 7.6 3.5a7 7 0 1 0 8.9 8.9Z" />
      </svg>
      {/* Sun (shown in dark mode: click to go light) */}
      <svg
        aria-hidden
        width="16"
        height="16"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        className={isDark ? "block" : "hidden"}
      >
        <circle cx="10" cy="10" r="3.6" />
        <path d="M10 1.8v1.6M10 16.6v1.6M1.8 10h1.6M16.6 10h1.6M4.2 4.2l1.1 1.1M14.7 14.7l1.1 1.1M15.8 4.2l-1.1 1.1M5.3 14.7l-1.1 1.1" />
      </svg>
    </button>
  );
}
