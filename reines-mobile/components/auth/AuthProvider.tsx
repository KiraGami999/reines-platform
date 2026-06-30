import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSegments } from "expo-router";
import axios from "axios";

import { AuthContext, type AuthContextValue } from "@/hooks/useAuth";
import { queryClient } from "@/lib/queryClient";
import { getToken, saveToken, deleteToken, deletePushToken } from "@/lib/storage";
import { onAuthEvent } from "@/lib/authEvents";
import { fetchCurrentUser, logout as authLogout } from "@/services/auth.service";
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
 *  3. signOut: clears JWT + push token from SecureStore, resets all
 *     React Query cache, and redirects to /login.
 *
 *  4. SESSION_EXPIRED event: when the API interceptor fails to refresh
 *     the token, it emits this event. AuthProvider catches it and calls
 *     signOut so the user is cleanly redirected to login without seeing
 *     a broken screen.
 *
 *  5. updateToken: called when the API interceptor silently refreshes
 *     the JWT so that context.token stays in sync with SecureStore.
 *
 *  6. refreshUser: re-fetches the user profile from the server.
 *     Useful after the user updates their name or role changes.
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

  // ── Session-expired event from the API interceptor ──────────────────────────

  useEffect(() => {
    const unsub = onAuthEvent("SESSION_EXPIRED", () => {
      // api.ts already deleted the JWT before emitting this event.
      // Clean up the push token from local storage too so we don't leave
      // a stale reference — the server record will be orphaned but the
      // token will eventually expire and stop delivering pushes.
      deletePushToken().catch(console.warn);
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
    await authLogout();
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
   * Called by the API interceptor (via a future hook or effect) when it
   * silently refreshes the JWT, so the context token stays current.
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
