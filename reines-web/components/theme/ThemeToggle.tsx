"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";
import { cn } from "@/lib/utils";
import type { ThemePreference } from "@/lib/theme";

const OPTIONS: {
  value: ThemePreference;
  label: string;
  icon:  typeof Sun;
}[] = [
  { value: "light",  label: "Light",  icon: Sun },
  { value: "dark",   label: "Dark",   icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

/**
 * Appearance control — Light / Dark / System.
 * Dark mode uses Reines navy (not pure black) so brand blues stay visible.
 */
export function ThemeToggle() {
  const { preference, setPreference } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Appearance"
      className="grid grid-cols-3 gap-1 rounded-xl border border-zinc-200 bg-zinc-50 p-1 dark:border-[var(--border)] dark:bg-[var(--surface-muted)]"
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = preference === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setPreference(value)}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold transition-colors",
              active
                ? "bg-[#2d4a6b] text-white shadow-sm dark:bg-[#2d4a6b] dark:text-[#8fb9e8]"
                : "text-zinc-500 hover:bg-white hover:text-zinc-800 dark:text-[var(--text-muted)] dark:hover:bg-[var(--surface)] dark:hover:text-[var(--foreground)]"
            )}
          >
            <Icon size={13} className="shrink-0" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
