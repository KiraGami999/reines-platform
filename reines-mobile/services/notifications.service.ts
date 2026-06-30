import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import api from "@/lib/api";
import { savePushToken, getPushToken, deletePushToken } from "@/lib/storage";

// ---------------------------------------------------------------------------
// Foreground handler
// ---------------------------------------------------------------------------

/**
 * Configures how notifications appear while the app is in the foreground.
 * Must be called before the app renders (top of this file is fine).
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert:  true,  // kept for SDK <50 compatibility
    shouldShowBanner: true,  // SDK 50+ banner in notification shade
    shouldShowList:   true,  // SDK 50+ show in notification list
    shouldPlaySound:  true,
    shouldSetBadge:   true,
  }),
});

// ---------------------------------------------------------------------------
// Android notification channels
// One channel per notification type so users can customise each category
// independently in Android Settings → App Notifications.
// ---------------------------------------------------------------------------

export const NOTIFICATION_CHANNELS = {
  messages: {
    id:               "messages",
    name:             "Messages",
    description:      "New chat messages from your project manager",
    importance:       Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250] as number[],
    lightColor:       "#8fb9e8",
    sound:            "default",
  },
  projects: {
    id:               "projects",
    name:             "Project Updates",
    description:      "Project status changes and milestones",
    importance:       Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 200] as number[],
    lightColor:       "#2d4a6b",
    sound:            "default",
  },
  gallery: {
    id:               "gallery",
    name:             "Progress Gallery",
    description:      "New progress photos and updates",
    importance:       Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 200] as number[],
    lightColor:       "#2d4a6b",
    sound:            "default",
  },
  payments: {
    id:               "payments",
    name:             "Payments",
    description:      "Payment confirmations and alerts",
    importance:       Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 300, 100, 300] as number[],
    lightColor:       "#16a34a",
    sound:            "default",
  },
} as const;

async function ensureAndroidChannels(): Promise<void> {
  if (Platform.OS !== "android") return;
  await Promise.all(
    Object.values(NOTIFICATION_CHANNELS).map((ch) =>
      Notifications.setNotificationChannelAsync(ch.id, {
        name:             ch.name,
        description:      ch.description,
        importance:       ch.importance,
        vibrationPattern: ch.vibrationPattern,
        lightColor:       ch.lightColor,
        sound:            ch.sound,
      })
    )
  );
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

/**
 * Requests permission and registers the device for push notifications.
 * Saves the Expo push token locally and registers it with the backend.
 * Returns the push token string, or null if permission was denied or the
 * device is a simulator.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn("[push] Push notifications require a physical device.");
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.warn("[push] Permission not granted.");
    return null;
  }

  // Create all Android channels before getting the token
  await ensureAndroidChannels();

  const tokenData = await Notifications.getExpoPushTokenAsync();
  const token     = tokenData.data;

  await savePushToken(token);
  await registerTokenWithBackend(token);

  return token;
}

async function registerTokenWithBackend(token: string): Promise<void> {
  try {
    await api.post("/api/mobile/push", {
      token,
      platform: Platform.OS === "ios" ? "ios" : "android",
    });
  } catch {
    // Non-fatal — push registration is best-effort
  }
}

// ---------------------------------------------------------------------------
// Unregistration
// ---------------------------------------------------------------------------

/**
 * Removes the push token from the backend and local storage.
 * Call on logout so the user stops receiving notifications on this device.
 */
export async function unregisterPushToken(): Promise<void> {
  const token = await getPushToken();
  if (!token) return;
  try {
    await api.delete("/api/mobile/push", { data: { token } });
  } catch {
    // Non-fatal
  } finally {
    await deletePushToken();
  }
}

// ---------------------------------------------------------------------------
// Badge management
// ---------------------------------------------------------------------------

/** Clears the app badge count to 0. */
export async function clearBadge(): Promise<void> {
  await Notifications.setBadgeCountAsync(0);
}

/** Increments the badge count by `amount` (default 1). */
export async function incrementBadge(amount = 1): Promise<void> {
  const current = await Notifications.getBadgeCountAsync();
  await Notifications.setBadgeCountAsync(current + amount);
}
