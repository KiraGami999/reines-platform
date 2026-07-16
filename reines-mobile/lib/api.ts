import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from "axios";
import { API_BASE_URL } from "@/constants";
import { getToken, saveToken, deleteToken } from "@/lib/storage";
import { emitAuthEvent } from "@/lib/authEvents";
import type { RefreshResponse } from "@/types";

/**
 * Central Axios instance for all API calls.
 *
 * Request interceptor:
 *   Reads the JWT from SecureStore and attaches it as a Bearer token.
 *
 * Response interceptor — on 401:
 *   1. Queues concurrent requests while a refresh is in flight.
 *   2. Calls refreshAccessToken() (shared with XHR uploads).
 *   3. On success: retries all queued requests.
 *   4. On failure: SESSION_EXPIRED is emitted inside refreshAccessToken.
 */

let isRefreshing = false;
let pendingQueue: Array<{
  resolve: (token: string) => void;
  reject:  (err: unknown)  => void;
}> = [];

function drainQueue(error: unknown, token: string | null): void {
  pendingQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  pendingQueue = [];
}

/**
 * Silently refreshes the access token.
 * Shared by the Axios interceptor and XHR upload helpers so both paths
 * stay in sync with SecureStore and AuthProvider (via TOKEN_REFRESHED).
 *
 * Concurrent callers share a single in-flight refresh via pendingQueue.
 */
export async function refreshAccessToken(): Promise<string> {
  if (isRefreshing) {
    return new Promise<string>((resolve, reject) => {
      pendingQueue.push({ resolve, reject });
    });
  }

  isRefreshing = true;

  try {
    const currentToken = await getToken();
    const res = await axios.post<RefreshResponse>(
      `${API_BASE_URL}/api/mobile/refresh`,
      {},
      { headers: { Authorization: `Bearer ${currentToken}` } }
    );
    const newToken = res.data.token;
    await saveToken(newToken);
    emitAuthEvent("TOKEN_REFRESHED", { token: newToken, user: res.data.user });
    drainQueue(null, newToken);
    return newToken;
  } catch (refreshError) {
    drainQueue(refreshError, null);
    await deleteToken();
    emitAuthEvent("SESSION_EXPIRED");
    throw refreshError;
  } finally {
    isRefreshing = false;
  }
}

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});

// ── Request: attach Bearer token ──────────────────────────────────────────────

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response: silent token refresh on 401 ────────────────────────────────────

/**
 * Endpoints where a 401 means "bad credentials / this request itself", NOT an
 * expired session. These must never trigger the silent-refresh flow — otherwise
 * a wrong password on /login fires /refresh → SESSION_EXPIRED and the login
 * screen just reloads instead of showing "Invalid email or password".
 */
const AUTH_ENDPOINTS = [
  "/api/mobile/login",
  "/api/mobile/refresh",
  "/api/mobile/logout",
  "/api/auth/register",
];

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Only intercept 401 errors that haven't been retried yet
    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    // Auth endpoints: let the caller handle the 401 (e.g. show a login error).
    // Refresh specifically also clears the session so a stale token doesn't stick.
    if (AUTH_ENDPOINTS.some((path) => original.url?.includes(path))) {
      if (original.url?.includes("/api/mobile/refresh")) {
        await deleteToken();
        emitAuthEvent("SESSION_EXPIRED");
      }
      return Promise.reject(error);
    }

    original._retry = true;

    try {
      const newToken = await refreshAccessToken();
      original.headers.Authorization = `Bearer ${newToken}`;
      return api(original);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  }
);

/**
 * Extracts a human-readable error message from an Axios error.
 * Falls back to the HTTP status text, then a generic message.
 */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    // Request timed out (Axios sets code = ECONNABORTED for timeouts)
    if (error.code === "ECONNABORTED") {
      return "The request timed out. Please check your connection and try again.";
    }
    // No response at all — device is offline or server is unreachable
    if (!error.response) {
      return "Cannot reach the server. Please check your internet connection.";
    }
    // Server returned a structured error message — prefer it over generic copy
    const data = error.response.data as Record<string, unknown> | undefined;
    if (typeof data?.error === "string") return data.error;
    // Status-specific fallbacks
    switch (error.response.status) {
      case 401: return "Invalid email or password.";
      case 403: return "Access denied. Admin accounts must use the web portal.";
      case 409: return "An account with this email already exists.";
      case 422: return "Please check your input and try again.";
      case 429: return "Too many attempts. Please wait a moment and try again.";
      case 500:
      case 502:
      case 503: return "The server encountered an error. Please try again shortly.";
    }
  }
  return "Something went wrong. Please try again.";
}

export default api;
