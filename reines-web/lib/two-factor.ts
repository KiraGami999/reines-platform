/**
 * Two-factor sign-in policy for the web portal.
 *
 * Flow:
 *  1. POST /api/auth/login/challenge — checks the password, then either emails a
 *     6-digit code or (for an already-trusted browser) returns a pass token.
 *  2. POST /api/auth/2fa/verify — checks the code, trusts the browser, returns a
 *     pass token.
 *  3. signIn("credentials", { email, password, passToken }) — the credentials
 *     provider refuses to mint a session without a valid pass token, so posting
 *     straight to the NextAuth callback cannot skip the code.
 *
 * The trust cookie is written WITHOUT Max-Age/Expires, so it is a session cookie
 * that the browser drops when it fully closes — reopening the site asks for a new
 * code. Note that "browser closed" is not perfectly detectable: Chrome's
 * "Continue where you left off" and most mobile browsers restore session cookies
 * across a restart. TRUSTED_DEVICE_TTL is the backstop that re-triggers 2FA for
 * those users regardless.
 */

import { cookies } from "next/headers";
import { signTwoFactorToken, verifyTwoFactorToken } from "@/lib/jwt";

export const TRUSTED_DEVICE_COOKIE = "reines_2fa_device";

/** Hard ceiling on browser trust, even if the session cookie survives a restart. */
export const TRUSTED_DEVICE_TTL = "12h";

/** How long the client has to exchange a cleared challenge for a session. */
const PASS_TOKEN_TTL = "5m";

export function issuePassToken(userId: string): Promise<string> {
  return signTwoFactorToken(userId, "2fa-pass", PASS_TOKEN_TTL);
}

export async function isTrustedDevice(userId: string): Promise<boolean> {
  const store = await cookies();
  const raw = store.get(TRUSTED_DEVICE_COOKIE)?.value;
  if (!raw) return false;
  const payload = await verifyTwoFactorToken(raw, "2fa-device");
  return payload?.sub === userId;
}

export async function trustCurrentDevice(userId: string): Promise<void> {
  const token = await signTwoFactorToken(userId, "2fa-device", TRUSTED_DEVICE_TTL);
  const store = await cookies();
  store.set(TRUSTED_DEVICE_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

export async function forgetCurrentDevice(): Promise<void> {
  const store = await cookies();
  store.delete(TRUSTED_DEVICE_COOKIE);
}
