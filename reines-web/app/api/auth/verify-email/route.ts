import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyEmailSchema } from "@/lib/validations";
import { verifyEmailVerifyOtp, createEmailVerifyOtp } from "@/lib/otp";
import { sendVerifyEmail, isEmailConfigured } from "@/lib/email";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

/**
 * POST /api/auth/verify-email
 *
 * Two actions controlled by the `action` body field:
 *
 * action "verify"  — validates the 6-digit OTP and marks emailVerified on the User.
 * action "resend"  — sends a fresh verification code (rate-limited).
 */
export async function POST(req: NextRequest) {
  const ip   = getClientIp(req);
  const body = await req.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const action = (body as Record<string, unknown>).action;

  // ── Resend ────────────────────────────────────────────────────────────────
  if (action === "resend") {
    const rl = checkRateLimit(`verify-resend:${ip}`, 5, 60 * 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
      );
    }

    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email) return NextResponse.json({ error: "Email is required." }, { status: 422 });

    if (!isEmailConfigured()) {
      return NextResponse.json(
        { error: "Email delivery is not set up on the server." },
        { status: 500 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (user && !user.emailVerified) {
      const result = await createEmailVerifyOtp(email);
      if (result.ok) {
        await sendVerifyEmail(email, result.code, user.name).catch((e) =>
          console.error("[verify-email/resend] Send failed:", e)
        );
      } else if (result.reason === "cooldown") {
        return NextResponse.json(
          { error: `Please wait ${result.retryAfterSeconds}s before requesting another code.` },
          { status: 429 }
        );
      }
    }

    // Generic response — don't reveal whether the email exists or is already verified.
    return NextResponse.json({ ok: true });
  }

  // ── Verify ────────────────────────────────────────────────────────────────
  const rl = checkRateLimit(`verify-confirm:${ip}`, 10, 15 * 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    );
  }

  const parsed = verifyEmailSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { email, code } = parsed.data;

  const result = await verifyEmailVerifyOtp(email, code);
  if (!result.ok) {
    const messages: Record<string, string> = {
      no_code:          "No verification code was found. Please request a new one.",
      expired:          "This code has expired. Please request a new one.",
      too_many_attempts:"Too many incorrect attempts. Please request a new code.",
      invalid:          "Invalid code. Please check and try again.",
    };
    return NextResponse.json(
      { error: messages[result.reason] ?? "Invalid code." },
      { status: 400 }
    );
  }

  // Mark the user as verified.
  await prisma.user.updateMany({
    where: { email, emailVerified: null },
    data:  { emailVerified: new Date() },
  });

  return NextResponse.json({ ok: true });
}
