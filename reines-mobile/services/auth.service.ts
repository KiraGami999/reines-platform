import api from "@/lib/api";
import { saveToken, deleteToken, getToken, deletePushToken } from "@/lib/storage";
import type { LoginCredentials, LoginResponse, RefreshResponse, AuthUser } from "@/types";

/**
 * Calls POST /api/mobile/login.
 * Saves the returned JWT to SecureStore on success.
 */
export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>("/api/mobile/login", credentials);
  await saveToken(data.token);
  return data;
}

/**
 * Calls POST /api/mobile/refresh using the stored token.
 * Updates the stored token with the refreshed one.
 */
export async function refresh(): Promise<RefreshResponse> {
  const { data } = await api.post<RefreshResponse>("/api/mobile/refresh");
  await saveToken(data.token);
  return data;
}

/**
 * Calls POST /api/mobile/logout, then wipes local storage.
 * Safe to call even if the server is unreachable.
 */
export async function logout(): Promise<void> {
  const pushToken = await import("@/lib/storage").then((m) => m.getPushToken());
  try {
    await api.post("/api/mobile/logout", { pushToken });
  } catch {
    // Ignore network errors — always clear local state
  }
  await deleteToken();
  await deletePushToken();
}

/**
 * Fetches the current user from GET /api/mobile/me.
 * Used to hydrate the auth context on app launch.
 */
export async function fetchCurrentUser(): Promise<AuthUser> {
  const { data } = await api.get<{ user: AuthUser }>("/api/mobile/me");
  return data.user;
}

/** Returns true if a valid token exists in SecureStore. */
export async function hasStoredToken(): Promise<boolean> {
  const token = await getToken();
  return !!token;
}
