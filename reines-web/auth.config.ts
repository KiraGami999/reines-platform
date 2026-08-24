/**
 * Edge-safe NextAuth configuration — no Prisma, no Node.js-only imports.
 * Used by proxy.ts (Edge runtime).
 * lib/auth.ts extends this with the Prisma adapter + providers.
 */
import type { NextAuthConfig } from "next-auth";

/** Session lifetime: 7 days (aligns with mobile JWT). */
export const SESSION_MAX_AGE = 7 * 24 * 60 * 60;

/** Refresh role / verification from DB at most once per day. */
export const SESSION_UPDATE_AGE = 24 * 60 * 60;

export const authConfig: NextAuthConfig = {
  session: {
    strategy:  "jwt",
    maxAge:    SESSION_MAX_AGE,
    updateAge: SESSION_UPDATE_AGE,
  },

  pages: {
    signIn: "/login",
    error:  "/login",
  },

  callbacks: {
    /**
     * Edge-safe session mapping (no DB). Full refresh lives in lib/auth.ts.
     * Ensures proxy can detect signed-in users via user.id.
     */
    async session({ session, token }) {
      if (session.user) {
        const id = (token.id as string | undefined) ?? (token.sub as string | undefined) ?? "";
        (session.user as { id?: string }).id = id;
      }
      return session;
    },

    /**
     * Called on every request matched by middleware.
     * Return true  → allow the request.
     * Return false → redirect to signIn page.
     */
    authorized({ auth, request: { nextUrl } }) {
      const user = auth?.user as { id?: string; email?: string | null } | undefined;
      const isLoggedIn   = !!(user?.id || user?.email);
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
      const isOnAdminApi  = nextUrl.pathname.startsWith("/api/admin");

      if (isOnDashboard || isOnAdminApi) {
        return isLoggedIn;
      }

      return true;
    },
  },

  providers: [],
};
