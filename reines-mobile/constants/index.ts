/**
 * Point this at your deployed domain in production.
 * During development, use your machine's LAN IP (not localhost —
 * the mobile device/emulator cannot reach localhost on the host machine).
 *
 * Windows:   ipconfig  → IPv4 Address
 * macOS:     ifconfig  → en0 inet
 *
 * Example:   http://192.168.1.42:3000
 */
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://192.168.1.100:3000";

/**
 * Base URL of the web portal shown inside the in-app WebView.
 *
 * The same Next.js server serves both the REST API and the web portal, so this
 * defaults to API_BASE_URL. Override with EXPO_PUBLIC_WEB_URL only if the web
 * portal is ever hosted on a different origin than the API.
 */
export const WEB_BASE_URL = process.env.EXPO_PUBLIC_WEB_URL ?? API_BASE_URL;

/** Token storage key in Expo SecureStore */
export const TOKEN_KEY = "reines_auth_token";

/** Push token storage key */
export const PUSH_TOKEN_KEY = "reines_push_token";

/** User preference: push notifications enabled (SecureStore) */
export const PUSH_ENABLED_KEY = "reines_push_enabled";

/** Message polling interval in milliseconds */
export const MESSAGE_POLL_INTERVAL_MS = 5_000;

/** React Query stale time for non-realtime data */
export const QUERY_STALE_TIME_MS = 30_000;

/** Brand colours — matches reines-web portal */
export const APP_NAME = "Reines Project Mate";

export const COLORS = {
  primary:      "#2d4a6b",
  primaryDark:  "#1a2f4a",
  primaryHover: "#243d5a",
  accent:       "#8fb9e8",
  accentHover:  "#b8d4f2",
  accentMuted:  "rgba(143, 185, 232, 0.15)",
  hero:         "#243040",
  white:        "#ffffff",
  zinc50:       "#fafafa",
  zinc100:      "#f4f4f5",
  zinc200:      "#e4e4e7",
  zinc300:      "#d4d4d8",
  zinc400:      "#a1a1aa",
  zinc500:      "#71717a",
  zinc600:      "#52525b",
  zinc700:      "#3f3f46",
  zinc800:      "#27272a",
  zinc900:      "#18181b",
  green:        "#16a34a",
  greenBg:      "#f0fdf4",
  greenBorder:  "#bbf7d0",
  greenText:    "#15803d",
  red:          "#dc2626",
  redBg:        "#fef2f2",
  redBorder:    "#fecaca",
  redText:      "#b91c1c",
  yellow:       "#ca8a04",
  yellowBg:     "#fef9c3",
  yellowBorder: "#fde68a",
  yellowText:   "#713f12",
  blue:         "#2563eb",
  blueLight:    "#60a5fa",
  blueBg:       "#eff6ff",
  blueBorder:   "#bfdbfe",
  blueText:     "#1d4ed8",
  infoBg:       "#eff6ff",
  infoText:     "#1d4ed8",
} as const;

/**
 * Dark "portal" palette — mirrors the website's dark-mode CSS variables
 * (see reines-web/app/globals.css `.dark { ... }`). The Login/Register
 * screens use this permanently so they match the web portal's dark look,
 * independent of the rest of the (currently light-only) native app.
 */
export const PORTAL_DARK = {
  background:    "#0a0c10",
  surfaceMuted:  "#0f1319",
  surface:       "#141820",
  surfaceHover:  "#1c2430",
  border:        "#2a3344",
  borderSubtle:  "#1e2633",
  foreground:    "#f0f4f8",
  textMuted:     "#9aa8b8",
  textSecondary: "#c5cfdc",
  heading:       "#a8c9eb",
  greenBg:       "rgba(34, 197, 94, 0.1)",
  greenBorder:   "rgba(34, 197, 94, 0.3)",
  greenText:     "#4ade80",
  redBg:         "rgba(239, 68, 68, 0.1)",
  redBorder:     "rgba(239, 68, 68, 0.3)",
  redText:       "#f87171",
  blueBg:        "rgba(143, 185, 232, 0.08)",
  blueBorder:    "rgba(143, 185, 232, 0.25)",
  blueText:      "#8fb9e8",
} as const;

/** Role display labels */
export const ROLE_LABELS: Record<string, string> = {
  CLIENT:          "Client",
  PROJECT_MANAGER: "Project Manager",
  ADMIN:           "Admin",
};

/** Project status display config */
export const PROJECT_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PLANNING:    { label: "Planning",     color: "#8fb9e8" },
  IN_PROGRESS: { label: "In Progress",  color: "#16a34a" },
  ON_HOLD:     { label: "On Hold",      color: "#ca8a04" },
  COMPLETED:   { label: "Completed",    color: "#2d4a6b" },
  CANCELLED:   { label: "Cancelled",    color: "#dc2626" },
};

/** Payment status display config */
export const PAYMENT_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING:   { label: "Pending",   color: "#ca8a04" },
  SUCCESS:   { label: "Paid",      color: "#16a34a" },
  FAILED:    { label: "Failed",    color: "#dc2626" },
  CANCELLED: { label: "Cancelled", color: "#71717a" },
};
