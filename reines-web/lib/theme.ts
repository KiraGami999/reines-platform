export const THEME_STORAGE_KEY = "reines-theme";
export const THEME_COOKIE_KEY  = "reines-theme";

/** Brand navy — mobile browser chrome (`theme-color`) + status bar tint. */
export const BRAND_THEME_COLOR = "#35475D";

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

/** Keep `<meta name="theme-color">` in sync for Safari / Chrome UI tint. */
export function applyThemeColor(color: string = BRAND_THEME_COLOR) {
  if (typeof document === "undefined") return;
  const metas = document.querySelectorAll('meta[name="theme-color"]');
  if (metas.length === 0) {
    const meta = document.createElement("meta");
    meta.name = "theme-color";
    meta.content = color;
    document.head.appendChild(meta);
    return;
  }
  metas.forEach((meta) => {
    meta.setAttribute("content", color);
  });
}

/** Inline script — runs before paint to avoid a light↔dark flash. */
export const THEME_BOOTSTRAP_SCRIPT = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var t=localStorage.getItem(k)||'system';var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);document.documentElement.style.colorScheme=d?'dark':'light';var c=${JSON.stringify(BRAND_THEME_COLOR)};var ms=document.querySelectorAll('meta[name="theme-color"]');if(ms.length){ms.forEach(function(m){m.setAttribute('content',c);});}else{var m=document.createElement('meta');m.name='theme-color';m.content=c;document.head.appendChild(m);}}catch(e){}})();`;
