/**
 * messageTransport.ts
 *
 * A lightweight publish-subscribe bus that decouples message delivery from
 * the transport mechanism (polling vs WebSocket).
 *
 * ─── Current implementation: Polling ────────────────────────────────────────
 * React Query's `refetchInterval` polls the REST endpoint every 5 seconds.
 * After each successful fetch the hook compares the latest timestamp with
 * the previous one; any new messages are dispatched through this bus so
 * other subscribers (e.g. the unread-count badge) react immediately.
 *
 * ─── Future: WebSocket ──────────────────────────────────────────────────────
 * To upgrade to real-time:
 * 1. Disable `refetchInterval` in `useMessages`.
 * 2. Open a WebSocket connection (e.g. via `connectWebSocket` below).
 * 3. On each incoming WS frame, call `dispatchMessage(projectId, msg)`.
 * 4. Nothing else in the app needs to change.
 *
 * The interface is intentionally minimal so it maps 1-to-1 to a WS frame.
 */

import type { Message } from "@/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MessageListener = (msg: Message) => void;

// ---------------------------------------------------------------------------
// Internal registry
// ---------------------------------------------------------------------------

/** projectId → Set<listener> */
const registry = new Map<string, Set<MessageListener>>();

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Subscribe to new messages for a specific project thread.
 * Returns an unsubscribe function — call it in `useEffect` cleanup.
 */
export function subscribeToThread(
  projectId: string,
  fn: MessageListener
): () => void {
  if (!registry.has(projectId)) registry.set(projectId, new Set());
  registry.get(projectId)!.add(fn);
  return () => registry.get(projectId)?.delete(fn);
}

/**
 * Dispatch a message to all subscribers of a thread.
 * Called by:
 *   - `useMessages` after polling detects a new message
 *   - `useSendMessage` after a successful POST (replaces optimistic record)
 *   - WebSocket handler (future)
 */
export function dispatchMessage(projectId: string, msg: Message): void {
  registry.get(projectId)?.forEach((fn) => fn(msg));
}

/**
 * Dispatch multiple messages at once (used after the first load or a poll
 * that returns several new messages).
 */
export function dispatchMessages(projectId: string, msgs: Message[]): void {
  msgs.forEach((m) => dispatchMessage(projectId, m));
}

// ---------------------------------------------------------------------------
// WebSocket stub (ready to implement — currently unused)
// ---------------------------------------------------------------------------

/**
 * Future entrypoint for opening a WebSocket connection.
 * Implement this when you're ready to drop polling:
 *
 * ```ts
 * export function connectWebSocket(projectId: string, token: string) {
 *   const ws = new WebSocket(`wss://your-api/ws/projects/${projectId}`);
 *   ws.onopen  = () => ws.send(JSON.stringify({ type: "auth", token }));
 *   ws.onmessage = (e) => {
 *     const msg: Message = JSON.parse(e.data);
 *     dispatchMessage(projectId, msg);
 *   };
 *   return () => ws.close();
 * }
 * ```
 */
export function connectWebSocket(
  _projectId: string,
  _token: string
): () => void {
  // Not yet implemented — polling is active
  return () => {};
}
