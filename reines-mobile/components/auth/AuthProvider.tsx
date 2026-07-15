import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSegments } from "expo-router";
import axios from "axios";

import { AuthContext, type AuthContextValue } from "@/hooks/useAuth";
import { queryClient } from "@/lib/queryClient";
import { getToken, saveToken, deleteToken, deletePushToken } from "@/lib/storage";
import { onAuthEvent } from "@/lib/authEvents";
import { resetWebSession } from "@/lib/webSessionState";
import { fetchCurrentUser, logout as authLogout } from "@/services/auth.service";
import { unregisterPushToken } from "@/services/notifications.service";
import type { AuthUser } from "@/types";

interface Props {
  children: React.ReactNode;
}

/**
 * AuthProvider
 *
 * Responsibilities:
 *  1. Bootstrap: on app launch, read the stored token and validate it
 *     by calling /api/mobile/me. If valid, hydrate user state.
 *     If invalid/expired, clear storage silently.
 *
 *  2. signIn: called after a successful login or registration.
 *     Saves the token, sets user state, and the router guard in each
 *     group layout takes care of navigation.
 *
 *  3. signOut: unregisters push token on the server, clears JWT + push
 *     from SecureStore, resets React Query cache, redirects to /login.
 *
 *  4. SESSION_EXPIRED event: when the API interceptor fails to refresh
 *     the token, it emits this event. AuthProvider catches it and calls
 *     signOut so the user is cleanly redirected to login without seeing
 *     a broken screen.
 *
 *  5. TOKEN_REFRESHED event: when the API interceptor (or XHR upload)
 *     silently refreshes the JWT, AuthProvider syncs context.token and
 *     context.user with SecureStore / server payload.
 *
 *  6. refreshUser: re-fetches the user profile from the server.
 */
export function AuthProvider({ children }: Props) {
  const [user,      setUser]      = useState<AuthUser | null>(null);
  const [token,     setToken]     = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const router   = useRouter();
  const segments = useSegments();

  // Track segments in a ref so the SESSION_EXPIRED handler always sees
  // the latest value without being recreated on every render.
  const segmentsRef = useRef(segments);
  useEffect(() => { segmentsRef.current = segments; }, [segments]);

  // ── Bootstrap ───────────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const stored = await getToken();
        if (!stored) return;

        // Validate the token against the server
        const me = await fetchCurrentUser();
        if (!cancelled) {
          setToken(stored);
          setUser(me);
        }
      } catch (err) {
        // Only wipe the token on auth errors (invalid/expired token).
        // Network errors mean the device is offline at startup — keep the
        // token so the user doesn't get logged out just because they had
        // no connectivity when they opened the app.
        const isNetworkError = axios.isAxiosError(err) && !err.response;
        if (!isNetworkError) {
          await deleteToken();
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    bootstrap();
    return () => { cancelled = true; };
  }, []);

  // ── Silent refresh → keep React context in sync with SecureStore ────────────

  useEffect(() => {
    const unsub = onAuthEvent("TOKEN_REFRESHED", ({ token: newToken, user: newUser }) => {
      setToken(newToken);
      setUser(newUser);
    });
    return unsub;
  }, []);

  // ── Session-expired event from the API interceptor ──────────────────────────

  useEffect(() => {
    const unsub = onAuthEvent("SESSION_EXPIRED", () => {
      // JWT was already deleted by refreshAccessToken before this fired.
      // Cannot reliably unregister on the server without a valid token —
      // clear local push storage only. signOut() handles server unregister.
      deletePushToken().catch(console.warn);
      resetWebSession();
      setToken(null);
      setUser(null);
      queryClient.clear();
      router.replace("/(auth)/login");
    });
    return unsub;
  }, [router]);

  // ── Auth actions ────────────────────────────────────────────────────────────

  const signIn = useCallback((newToken: string, newUser: AuthUser) => {
    saveToken(newToken).catch(console.warn);
    setToken(newToken);
    setUser(newUser);
  }, []);

  const signOut = useCallback(async () => {
    // Unregister while the JWT is still valid so the backend can remove
    // this device from the push roster immediately.
    try {
      await unregisterPushToken();
    } catch {
      // Non-fatal — authLogout still clears local state
    }
    await authLogout();
    resetWebSession();
    setToken(null);
    setUser(null);
    queryClient.clear();
    router.replace("/(auth)/login");
  }, [router]);

  const refreshUser = useCallback(async () => {
    try {
      const me = await fetchCurrentUser();
      setUser(me);
    } catch {
      // Non-fatal — the API interceptor will handle token expiry
    }
  }, []);

  /**
   * Called when the API silently refreshes the JWT so context.token stays
   * current. Prefer TOKEN_REFRESHED events from the interceptor; this remains
   * for explicit callers.
   */
  const updateToken = useCallback((newToken: string) => {
    setToken(newToken);
  }, []);

  // ── Context value ───────────────────────────────────────────────────────────

  const value: AuthContextValue = {
    user,
    token,
    isLoading,
    isSignedIn: !!user && !!token,
    signIn,
    signOut,
    refreshUser,
    updateToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
