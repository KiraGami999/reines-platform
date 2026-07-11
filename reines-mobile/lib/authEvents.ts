/**
 * Minimal synchronous event bus for auth lifecycle events.
 *
 * The API client runs outside React, so it cannot call hooks or
 * dispatch context actions directly. This bus bridges that gap:
 *
 *   API interceptor → emits "TOKEN_REFRESHED" | "SESSION_EXPIRED"
 *   AuthProvider    → listens and syncs React state / redirects
 *
 * Pattern: singleton module-level listeners list (zero dependencies).
 */

import type { AuthUser } from "@/types";

export type TokenRefreshedPayload = { token: string; user: AuthUser };

type SessionExpiredListener = () => void;
type TokenRefreshedListener = (payload: TokenRefreshedPayload) => void;

const sessionExpiredListeners: SessionExpiredListener[] = [];
const tokenRefreshedListeners: TokenRefreshedListener[] = [];

/** Register a listener for SESSION_EXPIRED. Returns an unsubscribe function. */
export function onAuthEvent(
  event: "SESSION_EXPIRED",
  fn: SessionExpiredListener
): () => void;
/** Register a listener for TOKEN_REFRESHED. Returns an unsubscribe function. */
export function onAuthEvent(
  event: "TOKEN_REFRESHED",
  fn: TokenRefreshedListener
): () => void;
export function onAuthEvent(
  event: "SESSION_EXPIRED" | "TOKEN_REFRESHED",
  fn: SessionExpiredListener | TokenRefreshedListener
): () => void {
  if (event === "SESSION_EXPIRED") {
    const listener = fn as SessionExpiredListener;
    sessionExpiredListeners.push(listener);
    return () => {
      const i = sessionExpiredListeners.indexOf(listener);
      if (i >= 0) sessionExpiredListeners.splice(i, 1);
    };
  }

  const listener = fn as TokenRefreshedListener;
  tokenRefreshedListeners.push(listener);
  return () => {
    const i = tokenRefreshedListeners.indexOf(listener);
    if (i >= 0) tokenRefreshedListeners.splice(i, 1);
  };
}

/** Emit SESSION_EXPIRED to all registered listeners. */
export function emitAuthEvent(event: "SESSION_EXPIRED"): void;
/** Emit TOKEN_REFRESHED with the new token and user. */
export function emitAuthEvent(
  event: "TOKEN_REFRESHED",
  payload: TokenRefreshedPayload
): void;
export function emitAuthEvent(
  event: "SESSION_EXPIRED" | "TOKEN_REFRESHED",
  payload?: TokenRefreshedPayload
): void {
  if (event === "SESSION_EXPIRED") {
    sessionExpiredListeners.forEach((fn) => fn());
    return;
  }
  if (!payload) return;
  tokenRefreshedListeners.forEach((fn) => fn(payload));
}
