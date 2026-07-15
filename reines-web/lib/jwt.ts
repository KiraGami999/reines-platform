import { SignJWT, jwtVerify, type JWTPayload } from "jose";

const rawSecret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

// In production, an unset secret would let anyone forge valid JWTs using the
// well-known fallback value. Crash at startup instead of silently accepting it.
if (!rawSecret && process.env.NODE_ENV === "production") {
  throw new Error(
    "[FATAL] AUTH_SECRET (or NEXTAUTH_SECRET) is not set. " +
    "Generate a strong random secret and add it to your environment before deploying."
  );
}

const SECRET = new TextEncoder().encode(
  rawSecret ?? "fallback-secret-change-in-development-only"
);

const ALGORITHM = "HS256";
const ACCESS_EXPIRES = "7d";

export interface TokenPayload extends JWTPayload {
  id: string;
  email: string;
  role: string;
  name: string;
  /** Present only on short-lived bridge tokens (mobile → web session handoff). */
  purpose?: "web-bridge";
}

export async function signToken(payload: Omit<TokenPayload, keyof JWTPayload>): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(ACCESS_EXPIRES)
    .sign(SECRET);
}

/**
 * Mints a short-lived, single-purpose token used to hand a native (JWT) mobile
 * session over to a NextAuth web session inside an in-app WebView.
 *
 * The token is deliberately short-lived (2 minutes) and carries a
 * `purpose: "web-bridge"` claim so it can never be confused with a normal
 * access token. It is consumed once by the "mobile-bridge" credentials
 * provider, which establishes the NextAuth session cookie.
 */
export async function signBridgeToken(
  payload: Omit<TokenPayload, keyof JWTPayload>
): Promise<string> {
  return new SignJWT({ ...payload, purpose: "web-bridge" })
    .setProtectedHeader({ alg: ALGORITHM })
    .setIssuedAt()
    .setExpirationTime("2m")
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as TokenPayload;
  } catch {
    return null;
  }
}

export function extractBearer(authHeader: string | null): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
}
