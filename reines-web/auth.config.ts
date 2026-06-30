/**
 * Edge-safe NextAuth configuration — no Prisma, no Node.js-only imports.
 * Used by middleware.ts (runs in Edge runtime).
 * lib/auth.ts extends this config with the Prisma adapter + Credentials provider.
 */
import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },

  pages: {
    signIn: "/login",
    error:  "/login",
  },

  callbacks: {
    /**
     * Called on every request matched by middleware.
     * Return true  → allow the request.
     * Return false → redirect to signIn page.
     */
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn      = !!auth?.user;
      const isOnDashboard   = nextUrl.pathname.startsWith("/dashboard");
      const isOnAdminApi    = nextUrl.pathname.startsWith("/api/admin");

      if (isOnDashboard || isOnAdminApi) {
        return isLoggedIn;
      }

      return true;
    },
  },

  providers: [],
};
