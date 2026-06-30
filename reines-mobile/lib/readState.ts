/**
 * readState.ts
 *
 * Client-side "last read" tracking for the unread-message badge.
 *
 * Because the database schema has no per-user read receipts, we track
 * which messages have been seen entirely on-device, in memory.
 *
 * ─── How it works ───────────────────────────────────────────────────────────
 * Each time the user opens a message thread we record the current timestamp
 * as `lastReadAt[projectId]`.
 *
 * A message is "unread" when:
 *   - It was sent by someone other than the current user, AND
 *   - Its `createdAt` is after `lastReadAt[projectId]` (or the thread has
 *     never been opened this session).
 *
 * The count resets when the app relaunches (acceptable UX trade-off;
 * a persistent store like SecureStore can be added later if needed).
 *
 * ─── Upgrading to persistent storage ────────────────────────────────────────
 * Replace the `timestamps` Map with Expo SecureStore reads/writes and the
 * API stays identical to the rest of the app.
 */

// projectId → ISO timestamp of last read
const timestamps = new Map<string, string>();

/**
 * Mark all messages in a thread as read (called when the thread is opened
 * or when the user scrolls to the bottom).
 */
export function markThreadRead(projectId: string): void {
  timestamps.set(projectId, new Date().toISOString());
}

/**
 * Returns the ISO timestamp of when the user last viewed this thread,
 * or `null` if the thread has never been opened this session.
 */
export function getLastRead(projectId: string): string | null {
  return timestamps.get(projectId) ?? null;
}

/**
 * Counts how many messages in `msgs` are "unread" for `currentUserId`.
 * A message is unread if:
 *   - sender is not the current user, AND
 *   - createdAt > lastRead timestamp (or thread was never opened)
 */
export function countUnread(
  projectId: string,
  currentUserId: string,
  msgs: { senderId: string; createdAt: string }[]
): number {
  const lastRead = getLastRead(projectId);
  return msgs.filter(
    (m) =>
      m.senderId !== currentUserId &&
      (lastRead === null || m.createdAt > lastRead)
  ).length;
}
