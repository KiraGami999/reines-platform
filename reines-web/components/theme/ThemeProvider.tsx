"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  THEME_COOKIE_KEY,
  THEME_STORAGE_KEY,
  isThemePreference,
  resolveTheme,
  type ResolvedTheme,
  type ThemePreference,
} from "@/lib/theme";

interface ThemeContextValue {
  preference: ThemePreference;
  resolved:   ResolvedTheme;
  setPreference: (next: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredPreference(): ThemePreference {
  if (typeof window === "undefined") return "system";
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(raw) ? raw : "system";
  } catch {
    return "system";
  }
}

function persistPreference(preference: ThemePreference) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    /* ignore quota / private mode */
  }
  // Cookie mirrors localStorage so future SSR can read preference.
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${THEME_COOKIE_KEY}=${preference};path=/;max-age=${maxAge};samesite=lax`;
}

function applyResolved(resolved: ResolvedTheme) {
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = resolved;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>("system");
  const [systemDark, setSystemDark]      = useState(false);
  const [ready, setReady]                = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemDark(mq.matches);
    setPreferenceState(readStoredPreference());
    setReady(true);

    function onChange(e: MediaQueryListEvent) {
      setSystemDark(e.matches);
    }
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const resolved = useMemo(
    () => resolveTheme(preference, systemDark),
    [preference, systemDark]
  );

  useEffect(() => {
    if (!ready) return;
    applyResolved(resolved);
  }, [ready, resolved]);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    persistPreference(next);
    applyResolved(
      resolveTheme(
        next,
        window.matchMedia("(prefers-color-scheme: dark)").matches
      )
    );
  }, []);

  const value = useMemo(
    () => ({ preference, resolved, setPreference }),
    [preference, resolved, setPreference]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
