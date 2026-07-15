import { WEB_BASE_URL } from "@/constants";

/**
 * Maps each native bottom-tab to the matching web portal route. The mobile app
 * keeps its native login + tab bar, but every tab renders the existing web
 * portal page inside a WebView so the UI stays identical to the website.
 *
 * Routes are relative to WEB_BASE_URL and must begin with "/".
 */
export const WEB_ROUTES = {
  client: {
    dashboard: "/dashboard",
    projects:  "/dashboard/projects",
    messages:  "/dashboard/messages",
    payments:  "/dashboard/payments",
    loyalty:   "/dashboard/loyalty",
    settings:  "/dashboard/settings",
  },
  manager: {
    dashboard: "/dashboard",
    projects:  "/dashboard/projects",
    messages:  "/dashboard/messages",
    gallery:   "/dashboard/gallery",
    settings:  "/dashboard/settings",
  },
  admin: {
    dashboard: "/dashboard",
    projects:  "/dashboard/admin/projects",
    clients:   "/dashboard/admin/clients",
    payments:  "/dashboard/admin/payments",
    settings:  "/dashboard/settings",
  },
} as const;

export type PortalRole = keyof typeof WEB_ROUTES;

/** Resolves a relative web route to a full URL against the web portal origin. */
export function toWebUrl(route: string): string {
  const path = route.startsWith("/") ? route : `/${route}`;
  return `${WEB_BASE_URL}${path}`;
}

/**
 * Builds the /mobile-bridge URL that establishes a web session and then lands
 * on `callbackRoute`. The bridge token travels as a query param so the server
 * page can read it and set the NextAuth cookie on the redirect response.
 * (URL fragments are never sent to the server, so they cannot drive a
 * server-side handoff.)
 */
export function buildBridgeUrl(bridgeToken: string, callbackRoute: string): string {
  const callbackUrl = callbackRoute.startsWith("/") ? callbackRoute : `/${callbackRoute}`;
  const qs = new URLSearchParams({
    token: bridgeToken,
    callbackUrl,
  }).toString();
  return `${WEB_BASE_URL}/mobile-bridge?${qs}`;
}

/** True when a WebView URL indicates the web session is missing/expired. */
export function isLoginUrl(url: string): boolean {
  try {
    return new URL(url).pathname.startsWith("/login");
  } catch {
    return /\/login(\?|$)/.test(url);
  }
}
