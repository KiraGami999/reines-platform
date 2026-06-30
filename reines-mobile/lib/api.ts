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
 *   2. Calls POST /api/mobile/refresh with the existing token.
 *   3. On success: saves the new token, retries all queued requests.
 *   4. On failure: deletes the token, emits SESSION_EXPIRED so
 *      AuthProvider can clear React state and redirect to login.
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

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Only intercept 401 errors that haven't been retried yet
    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    // A failing refresh call must not trigger another refresh (infinite loop guard)
    if (original.url?.includes("/api/mobile/refresh")) {
      await deleteToken();
      emitAuthEvent("SESSION_EXPIRED");
      return Promise.reject(error);
    }

    // Queue this request while a refresh is already in progress
    if (isRefreshing) {
      return new Promise<unknown>((resolve, reject) => {
        pendingQueue.push({
          resolve: (token) => {
            original.headers.Authorization = `Bearer ${token}`;
            resolve(api(original));
          },
          reject,
        });
      });
    }

    original._retry = true;
    isRefreshing    = true;

    try {
      const currentToken = await getToken();
      const res = await axios.post<RefreshResponse>(
        `${API_BASE_URL}/api/mobile/refresh`,
        {},
        { headers: { Authorization: `Bearer ${currentToken}` } }
      );
      const newToken = res.data.token;
      await saveToken(newToken);

      drainQueue(null, newToken);
      original.headers.Authorization = `Bearer ${newToken}`;
      return api(original);
    } catch (refreshError) {
      drainQueue(refreshError, null);
      await deleteToken();
      // Signal AuthProvider to clear React state and redirect to login
      emitAuthEvent("SESSION_EXPIRED");
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
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
