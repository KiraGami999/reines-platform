import { useEffect } from "react";
import { Stack } from "expo-router";
import { useRouter } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { COLORS } from "@/constants";

/**
 * Auth group layout.
 * If the user is already signed in, redirect them to their portal
 * so they never land on the login screen unnecessarily.
 */
export default function AuthLayout() {
  const { isSignedIn, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!isSignedIn) return;

    router.replace(user?.role === "PROJECT_MANAGER" ? "/(manager)" : "/(client)");
  }, [isSignedIn, isLoading, user?.role, router]);

  return (
    <Stack
      screenOptions={{
        headerShown:   false,
        contentStyle:  { backgroundColor: COLORS.primary },
        animation:     "fade",
      }}
    >
      <Stack.Screen name="login" />
    </Stack>
  );
}
