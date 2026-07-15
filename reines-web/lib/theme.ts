export const THEME_STORAGE_KEY = "reines-theme";
export const THEME_COOKIE_KEY  = "reines-theme";

export type ThemePreference = "system" | "light" | "dark";
export type ResolvedTheme   = "light" | "dark";

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === "system" || value === "light" || value === "dark";
}

export function resolveTheme(
  preference: ThemePreference,
  systemDark: boolean
): ResolvedTheme {
  if (preference === "light") return "light";
  if (preference === "dark")  return "dark";
  return systemDark ? "dark" : "light";
}

/** Inline script — runs before paint to avoid a light↔dark flash. */
export const THEME_BOOTSTRAP_SCRIPT = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var t=localStorage.getItem(k)||'system';var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);document.documentElement.style.colorScheme=d?'dark':'light';}catch(e){}})();`;
