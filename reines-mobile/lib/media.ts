import { API_BASE_URL } from "@/constants";

/**
 * Media URL helpers for private Vercel Blob files served via /api/media.
 *
 * Stored URLs may be:
 *   1. Private blob URLs (https://….private.blob.vercel-storage.com/…)
 *   2. Already-proxied paths (/api/media?url=…)
 *   3. Legacy local paths (/uploads/…)
 *
 * Native image loaders (Android / Expo Go) often fail to attach Authorization
 * headers, so we authenticate proxied media with `?token=<jwt>` — the same
 * mechanism documents already use successfully.
 */

function isPrivateBlobUrl(url: string): boolean {
  try {
    const { protocol, hostname } = new URL(url);
    return (
      protocol === "https:" &&
      (hostname.endsWith(".private.blob.vercel-storage.com") ||
        hostname.endsWith(".public.blob.vercel-storage.com"))
    );
  } catch {
    return false;
  }
}

/** Convert any stored media URL into a path/absolute URI the phone can request. */
export function toProxiedMediaPath(url: string): string {
  if (url.includes("/api/media")) return url;
  if (isPrivateBlobUrl(url)) {
    return `/api/media?url=${encodeURIComponent(url)}`;
  }
  return url;
}

/** Prefix relative paths with the API base URL. Absolute http(s) URLs pass through. */
export function resolveMediaUri(url: string | null | undefined): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url) && !isPrivateBlobUrl(url)) return url;
  const path = toProxiedMediaPath(url);
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

function needsAuthToken(url: string): boolean {
  return url.includes("/api/media") || isPrivateBlobUrl(url);
}

/** Stamp the JWT onto a proxied media URL. */
function withAuthToken(uri: string, originalUrl: string, token?: string | null): string {
  if (!token || !needsAuthToken(originalUrl)) return uri;
  if (/[?&]token=/.test(uri)) return uri;
  const sep = uri.includes("?") ? "&" : "?";
  return `${uri}${sep}token=${encodeURIComponent(token)}`;
}

export type MediaImageSource = { uri: string };

/**
 * Build an expo-image / RN Image `source` object.
 * Private blobs are always routed through /api/media with `?token=`.
 */
export function buildImageSource(
  url: string | null | undefined,
  token?: string | null
): MediaImageSource | undefined {
  if (!url) return undefined;
  const uri = resolveMediaUri(url);
  if (!uri) return undefined;
  return { uri: withAuthToken(uri, url, token) };
}

/**
 * Build a fully-qualified URL for opening a document in a browser tab.
 */
export function buildDocumentUrl(
  url: string | null | undefined,
  token?: string | null
): string | null {
  if (!url) return null;
  const uri = resolveMediaUri(url);
  if (!uri) return null;
  return withAuthToken(uri, url, token);
}
