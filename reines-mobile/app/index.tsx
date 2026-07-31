import { useEffect } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

/**
 * Entry point — redirects immediately based on auth state and role.
 *
 * Loading → shows splash/loading screen
 * Not signed in → (auth)/welcome (animated intro, shown on every cold start),
 *                 which itself hands off to (auth)/login on tap/swipe
 * CLIENT → (client)
 * PROJECT_MANAGER → (manager)
 * ADMIN → (admin)
 */
export default function Index() {
  const { isLoading, isSignedIn, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!isSignedIn) {
      router.replace("/(auth)/welcome");
      return;
    }

    if (user?.role === "ADMIN") {
      router.replace("/(admin)");
    } else if (user?.role === "PROJECT_MANAGER") {
      router.replace("/(manager)");
    } else {
      router.replace("/(client)");
    }
  }, [isLoading, isSignedIn, user?.role, router]);

  return <LoadingScreen />;
}
