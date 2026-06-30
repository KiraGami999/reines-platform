/**
 * Minimal synchronous event bus for auth lifecycle events.
 *
 * The API client runs outside React, so it cannot call hooks or
 * dispatch context actions directly. This bus bridges that gap:
 *
 *   API interceptor → emits "SESSION_EXPIRED"
 *   AuthProvider    → listens and calls signOut() + redirects to login
 *
 * Pattern: singleton module-level listeners list (zero dependencies).
 */

type AuthEvent = "SESSION_EXPIRED";

type Listener = () => void;

const listeners: Record<AuthEvent, Listener[]> = {
  SESSION_EXPIRED: [],
};

/** Register a listener for an auth event. Returns an unsubscribe function. */
export function onAuthEvent(event: AuthEvent, fn: Listener): () => void {
  listeners[event].push(fn);
  return () => {
    listeners[event] = listeners[event].filter((l) => l !== fn);
  };
}

/** Emit an auth event to all registered listeners. */
export function emitAuthEvent(event: AuthEvent): void {
  listeners[event].forEach((fn) => fn());
}
