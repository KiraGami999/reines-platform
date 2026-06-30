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

/** Token storage key in Expo SecureStore */
export const TOKEN_KEY = "reines_auth_token";

/** Push token storage key */
export const PUSH_TOKEN_KEY = "reines_push_token";

/** Message polling interval in milliseconds */
export const MESSAGE_POLL_INTERVAL_MS = 5_000;

/** React Query stale time for non-realtime data */
export const QUERY_STALE_TIME_MS = 30_000;

/** Brand colours — matches web portal */
export const COLORS = {
  primary:   "#2d4a6b",
  accent:    "#8fb9e8",
  white:     "#ffffff",
  zinc50:    "#fafafa",
  zinc100:   "#f4f4f5",
  zinc200:   "#e4e4e7",
  zinc300:   "#d4d4d8",
  zinc400:   "#a1a1aa",
  zinc500:   "#71717a",
  zinc600:   "#52525b",
  zinc700:   "#3f3f46",
  zinc800:   "#27272a",
  zinc900:   "#18181b",
  green:     "#16a34a",
  red:       "#dc2626",
  yellow:    "#ca8a04",
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
