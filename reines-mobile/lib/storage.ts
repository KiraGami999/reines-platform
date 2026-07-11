import * as SecureStore from "expo-secure-store";
import { TOKEN_KEY, PUSH_TOKEN_KEY, PUSH_ENABLED_KEY } from "@/constants";

/** Saves the JWT to encrypted device storage. */
export async function saveToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

/** Retrieves the stored JWT, or null if none exists. */
export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

/** Deletes the stored JWT (called on logout). */
export async function deleteToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

/** Saves the Expo push token. */
export async function savePushToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(PUSH_TOKEN_KEY, token);
}

/** Retrieves the stored Expo push token. */
export async function getPushToken(): Promise<string | null> {
  return SecureStore.getItemAsync(PUSH_TOKEN_KEY);
}

/** Deletes the stored push token. */
export async function deletePushToken(): Promise<void> {
  await SecureStore.deleteItemAsync(PUSH_TOKEN_KEY);
}

/**
 * User preference for push notifications.
 * Returns null when the user has never set an explicit preference.
 */
export async function getPushPreference(): Promise<boolean | null> {
  const value = await SecureStore.getItemAsync(PUSH_ENABLED_KEY);
  if (value === null) return null;
  return value === "1";
}

/** Persists the user's push notification preference. */
export async function setPushPreference(enabled: boolean): Promise<void> {
  await SecureStore.setItemAsync(PUSH_ENABLED_KEY, enabled ? "1" : "0");
}
