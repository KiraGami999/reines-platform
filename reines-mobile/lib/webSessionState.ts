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

export function isWebSessionEstablished(): boolean {
  return established;
}

export function markWebSessionEstablished(): void {
  established = true;
}

export function resetWebSession(): void {
  established = false;
}
