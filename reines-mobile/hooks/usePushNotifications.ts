import { useEffect, useRef, useCallback } from "react";
import { AppState, type AppStateStatus } from "react-native";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { registerForPushNotifications, clearBadge } from "@/services/notifications.service";
import { useAuth } from "@/hooks/useAuth";
import type { PushNotificationData } from "@/types";

// ---------------------------------------------------------------------------
// Deep-link router
// ---------------------------------------------------------------------------

/**
 * Resolves a notification payload to the correct Expo Router path,
 * accounting for the user's role (CLIENT routes vs manager routes).
 */
function resolveRoute(
  data:  PushNotificationData,
  role?: string
): string | null {
  const isManager = role === "PROJECT_MANAGER";

  switch (data.type) {
    case "message":
      if (!data.projectId) return null;
      return isManager
        ? `/(manager)/messages/${data.projectId}`
        : `/(client)/messages/${data.projectId}`;

    case "project":
      if (!data.projectId) return null;
      return isManager
        ? `/(manager)/projects/${data.projectId}`
        : `/(client)/projects/${data.projectId}`;

    case "gallery":
      if (!data.projectId) return null;
      // Managers see the gallery tab; clients also have the gallery deep-link
      return isManager
        ? `/(manager)/gallery`
        : `/(client)/gallery/${data.projectId}`;

    case "payment":
      // Payments are client-only
      return `/(client)/payments`;

    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * usePushNotifications
 *
 * Wires up the full push notification lifecycle:
 *   1. Registers the device when the user signs in.
 *   2. Handles cold-start deep links (app was killed when notification tapped).
 *   3. Handles foreground notification receipts (badge management).
 *   4. Handles notification tap → role-aware deep link navigation.
 *
 * Call this once from a component that is always mounted while the user
 * is signed in (e.g., NotificationsProvider inside AuthProvider).
 */
export function usePushNotifications() {
  const router   = useRouter();
  const { user, isSignedIn } = useAuth();

  const notifListener    = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);
  const coldStartHandled = useRef(false);

  // Stable navigate helper (re-created only when role changes)
  const navigate = useCallback(
    (data: PushNotificationData) => {
      const path = resolveRoute(data, user?.role);
      if (path) router.push(path as never);
    },
    [router, user?.role]
  );

  // ── Register device token when user signs in ─────────────────────────────
  useEffect(() => {
    if (!isSignedIn) return;
    registerForPushNotifications().catch(console.warn);
  }, [isSignedIn]);

  // ── Cold-start: app was killed, user tapped a notification ───────────────
  useEffect(() => {
    if (!isSignedIn || coldStartHandled.current) return;
    coldStartHandled.current = true;

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;
      clearBadge().catch(console.warn);
      const data = response.notification.request.content.data as unknown as PushNotificationData;
      if (data?.type) navigate(data);
    }).catch(console.warn);
  }, [isSignedIn, navigate]);

  // ── Clear badge when the app returns to foreground ───────────────────────
  // The OS accumulates a badge count even while the user is actively using
  // the app (because notifications arrive via push while it's foregrounded).
  // Clearing it whenever the app becomes active keeps the badge accurate.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state: AppStateStatus) => {
      if (state === "active") {
        clearBadge().catch(console.warn);
      }
    });
    return () => sub.remove();
  }, []);

  // ── Notification tapped (app was backgrounded or foreground) ─────────────
  useEffect(() => {
    if (!isSignedIn) return;

    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        clearBadge().catch(console.warn);
        const data = response.notification.request.content.data as unknown as PushNotificationData;
        if (data?.type) navigate(data);
      }
    );

    return () => { responseListener.current?.remove(); };
  }, [isSignedIn, navigate]);
}
