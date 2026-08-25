"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";
import { cn } from "@/lib/utils";
import { BUTTON_RADIUS } from "@/lib/ui-classes";

interface ThemeIconButtonProps {
  /** Visual style for the navy public navbar vs light portal chrome. */
  variant?: "on-dark" | "on-light";
  className?: string;
}

/**
 * Compact sun / moon control.
 * On the navy header, chrome stays identical in both modes — only the icon swaps.
 * Explicit transparent background avoids the black system button fill from color-scheme: dark.
 */
export function ThemeIconButton({ variant = "on-dark", className }: ThemeIconButtonProps) {
  const { resolved, setPreference } = useTheme();
  const isDark = resolved === "dark";

  return (
    <button
      type="button"
      onClick={() => setPreference(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Dark mode" : "Light mode"}
      className={cn(
        BUTTON_RADIUS,
        "flex h-10 w-10 items-center justify-center bg-transparent transition-colors",
        variant === "on-dark"
          ? "border border-white/20 text-white hover:bg-white/10 hover:text-white"
          : isDark
            ? "border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--surface-hover)]"
            : "border border-zinc-200 text-zinc-800 hover:bg-zinc-50 hover:text-zinc-900",
        className
      )}
    >
      {isDark ? (
        <Moon size={18} strokeWidth={1.9} />
      ) : (
        <Sun size={18} strokeWidth={1.9} />
      )}
    </button>
  );
}
