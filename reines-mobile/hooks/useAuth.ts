import { createContext, useContext } from "react";
import type { AuthUser } from "@/types";

/**
 * AuthContextValue — the full shape of what AuthProvider exposes.
 *
 * signIn(token, user)  → called after a successful login
 * signOut()            → clears state, removes token, redirects to login
 * refreshUser()        → re-fetches user profile (e.g. after a name change)
 * updateToken(token)   → called by AuthProvider when the API silently refreshes
 *                        the JWT; keeps context state in sync with SecureStore
 */
export interface AuthContextValue {
  user:        AuthUser | null;
  token:       string | null;
  isLoading:   boolean;
  isSignedIn:  boolean;
  signIn:      (token: string, user: AuthUser) => void;
  signOut:     () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateToken: (token: string) => void;
}

export const AuthContext = createContext<AuthContextValue>({
  user:        null,
  token:       null,
  isLoading:   true,
  isSignedIn:  false,
  signIn:      () => {},
  signOut:     async () => {},
  refreshUser: async () => {},
  updateToken: () => {},
});

/** Hook to access the auth context from any screen or component. */
export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
