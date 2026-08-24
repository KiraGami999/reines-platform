import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { verifyToken } from "@/lib/jwt";
import { loginSchema } from "@/lib/validations";
import {
  authConfig,
  SESSION_UPDATE_AGE,
} from "@/auth.config";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      image?: string | null;
      verificationStatus: string;
      /** Stable per login — used to rotate portal greetings each sign-in. */
      greetingSeed?: number;
    };
  }
  interface User {
    role?: string;
    verificationStatus?: string;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    verificationStatus?: string;
    refreshedAt?: number;
    greetingSeed?: number;
  }
}

const googleConfigured =
  Boolean(process.env.AUTH_GOOGLE_ID) && Boolean(process.env.AUTH_GOOGLE_SECRET);

const fullAuthConfig = {
  // Required when the portal is opened via LAN IP / tunnel (WebView), not only
  // the NEXTAUTH_URL host — otherwise CSRF/host checks break the mobile bridge.
  trustHost: true,

  pages:   authConfig.pages,
  session: authConfig.session,

  adapter: PrismaAdapter(prisma),

  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email:    { label: "Email",    type: "email"    },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const parsed = loginSchema.safeParse(credentials);
          if (!parsed.success) return null;

          const email = parsed.data.email.trim().toLowerCase();
          const { password } = parsed.data;

          // Select only auth fields so schema drift can't break login.
          const user = await prisma.user.findUnique({
            where: { email },
            select: {
              id: true,
              name: true,
              email: true,
              password: true,
              role: true,
              image: true,
              verificationStatus: true,
            },
          });
          if (!user || !user.password) return null;

          const passwordValid = await verifyPassword(password, user.password);
          if (!passwordValid) return null;

          return {
            id: user.id,
            name: user.name,
            email: user.email!,
            role: user.role,
            image: user.image,
            verificationStatus: user.verificationStatus,
          };
        } catch (err) {
          console.error("[auth/credentials] authorize failed:", err);
          return null;
        }
      },
    }),

    /**
     * Mobile → Web session handoff.
     *
     * The native app already authenticated the user (mobile JWT) and exchanged
     * it for a short-lived bridge token via POST /api/mobile/web-bridge. The
     * in-app WebView opens /mobile-bridge, which signs in with this provider so
     * the embedded web portal shares a real NextAuth session — no second login.
     */
    Credentials({
      id:   "mobile-bridge",
      name: "Mobile Bridge",
      credentials: {
        token: { label: "Bridge token", type: "text" },
      },
      async authorize(credentials) {
        const token = credentials?.token;
        if (typeof token !== "string" || !token) return null;

        const payload = await verifyToken(token);
        if (!payload || payload.purpose !== "web-bridge" || !payload.id) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where:  { id: payload.id as string },
          select: { id: true, name: true, email: true, role: true, image: true, verificationStatus: true },
        });
        if (!user || !user.email) return null;

        return {
          id:    user.id,
          name:  user.name,
          email: user.email,
          role:  user.role,
          image: user.image,
          verificationStatus: user.verificationStatus,
        };
      },
    }),

    ...(googleConfigured
      ? [
          Google({
            clientId:     process.env.AUTH_GOOGLE_ID!,
            clientSecret: process.env.AUTH_GOOGLE_SECRET!,
            // Same email as an existing password account → link (clients can use either).
            allowDangerousEmailAccountLinking: true,
            profile(profile) {
              const email = (profile.email ?? "").trim().toLowerCase();
              const name =
                profile.name?.trim() ||
                email.split("@")[0] ||
                "Google User";
              return {
                id:            profile.sub,
                name,
                email,
                image:         profile.picture,
                emailVerified: profile.email_verified ? new Date() : null,
              };
            },
          }),
        ]
      : []),
  ],

  callbacks: {
    /**
     * Allow Google for any user (new clients get CLIENT via schema defaults;
     * existing admin/PM accounts keep their role after email linking).
     */
    async signIn({ account, profile }) {
      if (account?.provider !== "google") return true;
      const email = profile?.email?.trim().toLowerCase();
      if (!email) return false;
      return true;
    },

    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id                 = user.id;
        token.role               = user.role ?? "CLIENT";
        token.verificationStatus =
          (user as { verificationStatus?: string }).verificationStatus ?? "UNVERIFIED";
        token.refreshedAt        = Date.now();
        // New seed on every sign-in so dashboard greetings rotate per login.
        token.greetingSeed       = Date.now() ^ Math.floor(Math.random() * 1_000_000);
        return token;
      }

      if (!token.id) return token;

      // Client-side session.update({ name }) after profile edit.
      if (trigger === "update" && session && typeof session === "object") {
        const patch = session as { name?: string };
        if (typeof patch.name === "string" && patch.name.trim()) {
          token.name = patch.name.trim();
        }
      }

      // Backfill for sessions created before greetingSeed existed.
      if (typeof token.greetingSeed !== "number") {
        token.greetingSeed = Date.now() ^ Math.floor(Math.random() * 1_000_000);
      }

      const refreshedAt = token.refreshedAt ?? 0;
      const stale =
        Date.now() - refreshedAt >= SESSION_UPDATE_AGE * 1000;

      if (!stale) return token;

      try {
        const dbUser = await prisma.user.findUnique({
          where:  { id: token.id as string },
          select: {
            role:               true,
            name:               true,
            email:              true,
            image:              true,
            verificationStatus: true,
          },
        });

        if (!dbUser) {
          // Invalidate JWT for deleted users (Auth.js treats null as signed-out).
          return null as unknown as typeof token;
        }

        token.role               = dbUser.role;
        token.name               = dbUser.name;
        token.email              = dbUser.email;
        token.picture            = dbUser.image;
        token.verificationStatus = dbUser.verificationStatus;
        token.refreshedAt        = Date.now();
      } catch (err) {
        console.error("[auth/jwt] failed to refresh user from DB:", err);
      }

      return token;
    },

    async session({ session, token }) {
      if (!token?.id) {
        // Deleted / invalidated token — treat as signed out for authorized checks.
        return {
          ...session,
          user: {
            ...session.user,
            id:                 "",
            name:               "",
            email:              "",
            role:               "",
            verificationStatus: "UNVERIFIED",
          },
        };
      }

      if (session.user) {
        session.user.id                 = token.id as string;
        session.user.role               = (token.role as string) ?? "CLIENT";
        session.user.verificationStatus =
          (token.verificationStatus as string) ?? "UNVERIFIED";
        session.user.greetingSeed =
          typeof token.greetingSeed === "number" ? token.greetingSeed : undefined;
        if (token.name)  session.user.name  = token.name as string;
        if (token.email) session.user.email = token.email as string;
        if (token.picture !== undefined) {
          session.user.image = token.picture as string | null;
        }
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(fullAuthConfig);
