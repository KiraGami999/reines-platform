import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { resetPasswordConfirmSchema } from "@/lib/validations";
import { verifyPasswordResetOtp } from "@/lib/otp";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

/**
 * POST /api/auth/reset-password/confirm
 *
 * Step 2 of password reset:
 *  - Verifies the 6-digit OTP (purpose "RESET").
 *  - If valid, hashes and saves the new password.
 *  - Invalidates the OTP so it cannot be reused.
 */
export async function POST(req: NextRequest) {
  // 10 confirm attempts per IP per 15 minutes — prevents brute-forcing the code.
  const ip = getClientIp(req);
  const rl = checkRateLimit(`reset-confirm:${ip}`, 10, 15 * 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    );
  }

  const body   = await req.json().catch(() => null);
  const parsed = resetPasswordConfirmSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { email, code, password } = parsed.data;

  const result = await verifyPasswordResetOtp(email, code);
  if (!result.ok) {
    const messages: Record<string, string> = {
      no_code:          "No reset code was found. Please request a new one.",
      expired:          "This code has expired. Please request a new one.",
      too_many_attempts:"Too many incorrect attempts. Please request a new code.",
      invalid:          "Invalid code. Please check and try again.",
    };
    return NextResponse.json(
      { error: messages[result.reason] ?? "Invalid code." },
      { status: 400 }
    );
  }

  // OTP is valid — update the password.
  const hashed = await hashPassword(password);
  await prisma.user.update({
    where: { email },
    data:  { password: hashed },
  });

  return NextResponse.json({ ok: true });
}
