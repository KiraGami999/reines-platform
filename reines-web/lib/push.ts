/**
 * lib/push.ts
 *
 * Server-side Expo Push Notification sender.
 *
 * Uses the Expo Push API (https://exp.host/--/api/v2/push/send) directly
 * via fetch — no extra dependencies required.
 *
 * ─── Usage ──────────────────────────────────────────────────────────────────
 *
 *   import { sendPushToUser } from "@/lib/push";
 *
 *   // Notify a user that a new message arrived:
 *   await sendPushToUser(clientId, {
 *     type:      "message",
 *     projectId: project.id,
 *     title:     "New message",
 *     body:      "Your manager sent you a message on Project X.",
 *     channel:   "messages",
 *   });
 *
 * All sends are fire-and-forget; failures are logged but never throw.
 * The recipient's device tokens are looked up from the PushDevice table.
 *
 * ─── Notification channels (Android) ────────────────────────────────────────
 *   messages  → New chat messages
 *   projects  → Project status changes / milestones
 *   gallery   → Progress photo uploads
 *   payments  → Payment approvals / rejections
 */

import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PushChannel = "messages" | "projects" | "gallery" | "payments";

export type PushType = "message" | "project" | "gallery" | "payment";

export interface PushPayload {
  type:       PushType;
  title:      string;
  body:       string;
  channel:    PushChannel;
  projectId?: string;
  paymentId?: string;
  updateId?:  string;
}

interface ExpoMessage {
  to:         string;
  title:      string;
  body:       string;
  data:       Record<string, unknown>;
  sound:      "default";
  badge:      number;
  channelId:  string;
  priority:   "high" | "normal";
}

// ---------------------------------------------------------------------------
// Core sender
// ---------------------------------------------------------------------------

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const CHUNK_SIZE    = 100; // Expo allows up to 100 messages per request

/**
 * Looks up all Expo push tokens registered for `userId` and sends them
 * the given notification payload.
 *
 * Returns the number of tokens that were targeted.
 */
export async function sendPushToUser(
  userId:  string,
  payload: PushPayload
): Promise<number> {
  let tokens: string[] = [];

  try {
    const devices = await prisma.pushDevice.findMany({
      where:  { userId },
      select: { token: true },
    });
    tokens = devices.map((d) => d.token);
  } catch (err) {
    console.error("[push] Failed to look up push tokens:", err);
    return 0;
  }

  if (tokens.length === 0) return 0;

  const messages: ExpoMessage[] = tokens.map((to) => ({
    to,
    title:     payload.title,
    body:      payload.body,
    sound:     "default",
    badge:     1,
    channelId: payload.channel,
    priority:  payload.channel === "messages" ? "high" : "normal",
    data: {
      type:      payload.type,
      projectId: payload.projectId,
      paymentId: payload.paymentId,
      updateId:  payload.updateId,
      title:     payload.title,
      body:      payload.body,
    },
  }));

  await sendInChunks(messages);
  return tokens.length;
}

/**
 * Sends notifications to multiple users at once (e.g., notify all project
 * participants). Deduplicates tokens across users.
 */
export async function sendPushToUsers(
  userIds:  string[],
  payload:  PushPayload
): Promise<void> {
  if (userIds.length === 0) return;

  let tokens: string[] = [];

  try {
    const devices = await prisma.pushDevice.findMany({
      where:  { userId: { in: userIds } },
      select: { token: true },
    });
    tokens = [...new Set(devices.map((d) => d.token))];
  } catch (err) {
    console.error("[push] Failed to look up push tokens:", err);
    return;
  }

  if (tokens.length === 0) return;

  const messages: ExpoMessage[] = tokens.map((to) => ({
    to,
    title:     payload.title,
    body:      payload.body,
    sound:     "default",
    badge:     1,
    channelId: payload.channel,
    priority:  payload.channel === "messages" ? "high" : "normal",
    data: {
      type:      payload.type,
      projectId: payload.projectId,
      paymentId: payload.paymentId,
      updateId:  payload.updateId,
      title:     payload.title,
      body:      payload.body,
    },
  }));

  await sendInChunks(messages);
}

// ---------------------------------------------------------------------------
// Typed notification helpers
// ---------------------------------------------------------------------------

/** Notify a user about a new chat message on a project. */
export async function notifyNewMessage(opts: {
  recipientId:   string;
  senderName:    string;
  projectTitle:  string;
  projectId:     string;
  messagePreview: string;
}): Promise<void> {
  await sendPushToUser(opts.recipientId, {
    type:      "message",
    channel:   "messages",
    projectId: opts.projectId,
    title:     `New message from ${opts.senderName}`,
    body:      `${opts.projectTitle}: ${opts.messagePreview.slice(0, 80)}`,
  });
}

/** Notify a client that their manager uploaded a progress photo/update. */
export async function notifyGalleryUpload(opts: {
  clientId:     string;
  projectTitle: string;
  projectId:    string;
  updateId:     string;
  progressPct?: number | null;
}): Promise<void> {
  const body = opts.progressPct !== null && opts.progressPct !== undefined
    ? `${opts.projectTitle} is now ${opts.progressPct}% complete.`
    : `New progress update on ${opts.projectTitle}.`;

  await sendPushToUser(opts.clientId, {
    type:      "gallery",
    channel:   "gallery",
    projectId: opts.projectId,
    updateId:  opts.updateId,
    title:     "Progress update posted",
    body,
  });
}

/** Notify a client that their payment was approved. */
export async function notifyPaymentApproved(opts: {
  clientId:     string;
  projectTitle: string;
  projectId:    string;
  paymentId:    string;
  amount:       string;
}): Promise<void> {
  await sendPushToUser(opts.clientId, {
    type:      "payment",
    channel:   "payments",
    projectId: opts.projectId,
    paymentId: opts.paymentId,
    title:     "Payment approved",
    body:      `Your payment of MK ${opts.amount} for ${opts.projectTitle} has been confirmed.`,
  });
}

/** Notify a client that their payment was rejected. */
export async function notifyPaymentRejected(opts: {
  clientId:     string;
  projectTitle: string;
  projectId:    string;
  paymentId:    string;
  reason:       string;
}): Promise<void> {
  await sendPushToUser(opts.clientId, {
    type:      "payment",
    channel:   "payments",
    projectId: opts.projectId,
    paymentId: opts.paymentId,
    title:     "Payment rejected",
    body:      `Your payment for ${opts.projectTitle} was not approved: ${opts.reason.slice(0, 60)}`,
  });
}

/** Notify a client about a project status change. */
export async function notifyProjectUpdate(opts: {
  clientId:     string;
  projectTitle: string;
  projectId:    string;
  newStatus:    string;
}): Promise<void> {
  const statusLabels: Record<string, string> = {
    IN_PROGRESS: "started",
    ON_HOLD:     "put on hold",
    COMPLETED:   "marked as complete",
    CANCELLED:   "cancelled",
  };
  const verb = statusLabels[opts.newStatus] ?? "updated";

  await sendPushToUser(opts.clientId, {
    type:      "project",
    channel:   "projects",
    projectId: opts.projectId,
    title:     "Project update",
    body:      `${opts.projectTitle} has been ${verb}.`,
  });
}

// ---------------------------------------------------------------------------
// Internal: chunked Expo API send (fire-and-forget)
// ---------------------------------------------------------------------------

async function sendInChunks(messages: ExpoMessage[]): Promise<void> {
  for (let i = 0; i < messages.length; i += CHUNK_SIZE) {
    const chunk = messages.slice(i, i + CHUNK_SIZE);
    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept":       "application/json",
        },
        body: JSON.stringify(chunk.length === 1 ? chunk[0] : chunk),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("[push] Expo API error:", res.status, text);
      }
    } catch (err) {
      console.error("[push] Failed to send chunk:", err);
    }
  }
}
