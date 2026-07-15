import { Stack } from "expo-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider }              from "@/components/auth/AuthProvider";
import { FontProvider }              from "@/components/providers/FontProvider";
import { NotificationsProvider }     from "@/components/notifications/NotificationsProvider";
import { OfflineBanner }             from "@/components/layout/OfflineBanner";
import { queryClient }               from "@/lib/queryClient";

/**
 * Root layout.
 *
 * Tree:
 *   SafeAreaProvider
 *   └─ QueryClientProvider        — React Query cache shared across the whole app
 *      └─ FontProvider
 *         └─ AuthProvider         — JWT state, signIn / signOut / refreshUser
 *            └─ OfflineBanner     — global offline connectivity indicator
 *               └─ NotificationsProvider — Push registration, deep-link routing
 *                  └─ Stack       — Expo Router group navigator
 *
 * NotificationsProvider must be:
 *   - Inside AuthProvider   → so it can read isSignedIn / user.role
 *
 * Navigation guards live in each group's _layout.tsx so the redirect
 * logic is colocated with the screens it protects.
 */
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <FontProvider>
          <AuthProvider>
            <StatusBar style="auto" />
            <OfflineBanner />
            <NotificationsProvider>
              <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
                <Stack.Screen name="(auth)"     />
                <Stack.Screen name="(client)"   />
                <Stack.Screen name="(manager)"  />
                <Stack.Screen name="(admin)"    />
                <Stack.Screen name="+not-found" />
              </Stack>
            </NotificationsProvider>
          </AuthProvider>
        </FontProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
