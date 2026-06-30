import React, { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { InAppBannerHost, showInAppBanner } from "./InAppBanner";
import { useAuth } from "@/hooks/useAuth";
import type { PushNotificationData } from "@/types";

interface Props {
  children: React.ReactNode;
}

/**
 * NotificationsProvider
 *
 * Mounts inside AuthProvider (so it can read isSignedIn) and inside the
 * Expo Router Stack (so usePushNotifications has access to useRouter).
 *
 * Responsibilities:
 *   1. Calls usePushNotifications() to handle registration, cold-start,
 *      backgrounded tap, and role-aware deep linking.
 *   2. Listens for foreground notifications and shows an InAppBanner
 *      instead of — or in addition to — the system alert.
 *   3. Renders the InAppBannerHost so banners can be shown anywhere
 *      without prop drilling.
 */
export function NotificationsProvider({ children }: Props) {
  const { isSignedIn } = useAuth();
  const foregroundRef  = useRef<Notifications.EventSubscription | null>(null);

  // Core push lifecycle (registration, deep links, cold-start)
  usePushNotifications();

  // Show an in-app banner when a notification arrives while foregrounded
  useEffect(() => {
    if (!isSignedIn) return;

    foregroundRef.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        const data = notification.request.content.data as unknown as PushNotificationData;
        if (data?.type && data.title) {
          showInAppBanner(data);
        }
      }
    );

    return () => { foregroundRef.current?.remove(); };
  }, [isSignedIn]);

  return (
    <>
      {children}
      <InAppBannerHost />
    </>
  );
}
