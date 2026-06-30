import { useEffect } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import type { UserRole } from "@/types";

interface Options {
  /**
   * The role this portal is intended for.
   * Any signed-in user with a different role will be redirected
   * to their correct portal instead.
   */
  allowedRole: Exclude<UserRole, "ADMIN">;
}

/**
 * useRoleGuard
 *
 * Centralises the navigation guard logic that was previously duplicated
 * in every portal layout. Call once at the top of each group _layout.tsx.
 *
 * Guards enforced:
 *  - Not signed in            → /(auth)/login
 *  - Wrong role (CLIENT visiting manager portal) → correct portal
 *  - Wrong role (MANAGER visiting client portal) → correct portal
 *
 * Returns:
 *  - `ready: false` while auth is loading or the redirect is pending
 *  - `ready: true`  once the user is verified and in the right portal
 */
export function useRoleGuard({ allowedRole }: Options): { ready: boolean } {
  const { isLoading, isSignedIn, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!isSignedIn) {
      router.replace("/(auth)/login");
      return;
    }

    if (user?.role !== allowedRole) {
      // Redirect to the correct portal for this role
      if (user?.role === "PROJECT_MANAGER") {
        router.replace("/(manager)");
      } else {
        router.replace("/(client)");
      }
    }
  }, [isLoading, isSignedIn, user?.role, allowedRole, router]);

  const ready = !isLoading && isSignedIn && user?.role === allowedRole;
  return { ready };
}
