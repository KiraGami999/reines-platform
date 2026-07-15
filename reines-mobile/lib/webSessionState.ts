/**
 * Tracks whether the in-app WebView has an established web session for the
 * CURRENT native user during this app run.
 *
 * Why this matters: react-native-webview persists session cookies on disk. If
 * user A logs out and user B logs in, the stale cookie could otherwise show
 * A's portal. Forcing a bridge on the first portal view per session overwrites
 * the cookie for the current user. resetWebSession() is called on sign-out.
 *
 * This is module-level (not React state) so it is shared across all tab
 * WebView instances and reset only on logout or app restart.
 */

let established = false;

/** Dedupes concurrent bridge-token fetches across multiple tab WebViews. */
let bridgeInFlight: Promise<string> | null = null;

export function isWebSessionEstablished(): boolean {
  return established;
}

export function markWebSessionEstablished(): void {
  established = true;
}

export function resetWebSession(): void {
  established = false;
  bridgeInFlight = null;
}

/** Marks the cookie as invalid so the next open will re-run the bridge handoff. */
export function clearWebSessionEstablished(): void {
  established = false;
}

/**
 * Ensures only one POST /api/mobile/web-bridge runs at a time. Multiple tabs
 * mounting together used to each burn bridge attempts against the same race.
 */
export function withSharedBridgeToken(
  fetchToken: () => Promise<string>
): Promise<string> {
  if (!bridgeInFlight) {
    bridgeInFlight = fetchToken().finally(() => {
      bridgeInFlight = null;
    });
  }
  return bridgeInFlight;
}
