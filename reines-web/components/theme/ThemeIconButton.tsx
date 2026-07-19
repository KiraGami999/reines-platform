"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";
import { cn } from "@/lib/utils";

interface ThemeIconButtonProps {
  /** Visual style for the navy public navbar vs light portal chrome. */
  variant?: "on-dark" | "on-light";
  className?: string;
}

/**
 * Compact sun / moon control for the public site header.
 * Shows a moon in light mode (switch to dark) and a sun in dark mode (switch to light).
 * Preference is stored the same way as portal Settings, so it applies site-wide.
 */
export function ThemeIconButton({ variant = "on-dark", className }: ThemeIconButtonProps) {
  const { resolved, setPreference } = useTheme();
  const isDark = resolved === "dark";

  return (
    <button
      type="button"
      onClick={() => setPreference(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
        variant === "on-dark"
          ? "border border-white/15 text-[#8fb9e8] hover:bg-white/10 hover:text-white"
          : "border border-zinc-200 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800 dark:border-[var(--border)] dark:text-[var(--text-muted)] dark:hover:bg-[var(--surface-hover)] dark:hover:text-[var(--foreground)]",
        className
      )}
    >
      {isDark ? <Sun size={18} strokeWidth={1.9} /> : <Moon size={18} strokeWidth={1.9} />}
    </button>
  );
}
