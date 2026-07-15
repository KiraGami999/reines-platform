import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { verifyToken } from "@/lib/jwt";
import { loginSchema } from "@/lib/validations";
import { authConfig } from "@/auth.config";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      image?: string | null;
    };
  }
  interface User {
    role?: string;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    role?: string;
  }
}

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
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.password) return null;

        const passwordValid = await verifyPassword(password, user.password);
        if (!passwordValid) return null;

        return {
          id:    user.id,
          name:  user.name,
          email: user.email!,
          role:  user.role,
          image: user.image,
        };
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
          select: { id: true, name: true, email: true, role: true, image: true },
        });
        if (!user || !user.email) return null;

        return {
          id:    user.id,
          name:  user.name,
          email: user.email,
          role:  user.role,
          image: user.image,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id   = user.id;
        token.role = user.role ?? "CLIENT";
        return token;
      }

      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, name: true, email: true, image: true },
        });

        if (dbUser) {
          token.role = dbUser.role;
          token.name = dbUser.name;
          token.email = dbUser.email;
          token.picture = dbUser.image;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id   = token.id   as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(fullAuthConfig);
