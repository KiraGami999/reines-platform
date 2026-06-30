import * as SecureStore from "expo-secure-store";
import { TOKEN_KEY, PUSH_TOKEN_KEY } from "@/constants";

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
