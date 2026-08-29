/**
 * Shared password check for the two-step sign-in routes.
 *
 * Both /api/auth/login/challenge and /api/auth/2fa/verify need to confirm the
 * password before doing anything else — the first so it never emails a code to
 * someone who doesn't know the password, the second so a leaked code can't be
 * redeemed on its own.
 */

import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";

/** Deliberately identical for "no such user" and "wrong password". */
export const INVALID_CREDENTIALS = "Invalid email or password. Please try again.";

export interface LoginCandidate {
  id: string;
  name: string;
  email: string;
}

export async function verifyLoginCredentials(
  email: string,
  password: string
): Promise<LoginCandidate | null> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, password: true },
  });

  if (!user?.password || !user.email) return null;

  const valid = await verifyPassword(password, user.password);
  if (!valid) return null;

  return { id: user.id, name: user.name, email: user.email };
}
