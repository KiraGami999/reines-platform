import { NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import { badRequest, forbidden, ok, serverError, validationError } from "@/lib/api-response";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters")
    .max(128, "Password is too long"),
});

/**
 * POST /api/auth/change-password
 * Authenticated users with a password can change it (not Google-only accounts).
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return forbidden();

  const body = await req.json().catch(() => null);
  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password: true },
    });
    if (!user) return forbidden();
    if (!user.password) {
      return badRequest(
        "This account uses Google sign-in. Set a password via Forgot password, or keep using Google."
      );
    }

    const valid = await verifyPassword(parsed.data.currentPassword, user.password);
    if (!valid) return badRequest("Current password is incorrect.");

    const hashed = await hashPassword(parsed.data.newPassword);
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashed },
    });

    return ok({ changed: true });
  } catch (err) {
    console.error("[api/auth/change-password]", err);
    return serverError("Could not change password.");
  }
}
