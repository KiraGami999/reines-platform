import { Stack } from "expo-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";

import { AuthProvider }              from "@/components/auth/AuthProvider";
import { FontProvider }              from "@/components/providers/FontProvider";
import { NotificationsProvider }     from "@/components/notifications/NotificationsProvider";
import { queryClient }               from "@/lib/queryClient";
import { COLORS }                    from "@/constants";

/**
 * Root layout.
 *
 * Tree:
 *   QueryClientProvider        — React Query cache shared across the whole app
 *   └─ AuthProvider            — JWT state, signIn / signOut / refreshUser
 *      └─ NotificationsProvider — Push registration, deep-link routing,
 *         │                       foreground in-app banner host
 *         └─ Stack             — Expo Router group navigator
 *              ├─ (auth)       — Login screen (redirects away if signed in)
 *              ├─ (client)     — Client portal tabs
 *              └─ (manager)    — Project Manager portal tabs
 *
 * NotificationsProvider must be:
 *   - Inside AuthProvider   → so it can read isSignedIn / user.role
 *   - Inside the Stack      → so usePushNotifications has router access
 *
 * Navigation guards live in each group's _layout.tsx so the redirect
 * logic is colocated with the screens it protects.
 */
export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <FontProvider>
        <AuthProvider>
          <StatusBar style="auto" />
          <NotificationsProvider>
            <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
              <Stack.Screen name="(auth)"     />
              <Stack.Screen name="(client)"   />
              <Stack.Screen name="(manager)"  />
              <Stack.Screen name="+not-found" />
            </Stack>
          </NotificationsProvider>
        </AuthProvider>
      </FontProvider>
    </QueryClientProvider>
  );
}
