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
            {/*
              Most screens (native tab headers, PortalWebView's white inset strip)
              have a light/white top edge, so dark icons are the sane default.
              "auto" instead followed the OS theme setting rather than each
              screen's actual background, which made time/battery/signal icons
              invisible whenever the device's system theme didn't match — e.g.
              dark system theme + our white header = white-on-white icons.
              Screens with a navy top (Welcome, Login/Register, LoadingScreen)
              render their own <StatusBar style="light" /> to override this.
            */}
            <StatusBar style="dark" />
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
