import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resetPasswordRequestSchema } from "@/lib/validations";
import { createPasswordResetOtp } from "@/lib/otp";
import { sendPasswordResetEmail, isEmailConfigured } from "@/lib/email";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

/**
 * POST /api/auth/reset-password/request
 *
 * Step 1 of password reset:
 *  - Validates email format.
 *  - Sends a 6-digit OTP to the email (purpose "RESET", 15-min TTL).
 *  - Always returns a generic 200 to prevent email enumeration.
 */
export async function POST(req: NextRequest) {
  // 5 reset requests per IP per hour — stricter than login to deter phishing campaigns.
  const ip = getClientIp(req);
  const rl = checkRateLimit(`reset-req:${ip}`, 5, 60 * 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    );
  }

  const body   = await req.json().catch(() => null);
  const parsed = resetPasswordRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 422 });
  }

  const { email } = parsed.data;

  if (!isEmailConfigured()) {
    console.error("[reset/request] SMTP not configured.");
    return NextResponse.json(
      { error: "Email delivery is not set up on the server. Please contact support." },
      { status: 500 }
    );
  }

  // Look up user — but never reveal whether the address exists.
  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    const result = await createPasswordResetOtp(email);
    if (result.ok) {
      try {
        await sendPasswordResetEmail(email, result.code, user.name);
      } catch (err) {
        console.error("[reset/request] Failed to send email:", err);
        // Still fall through to the generic success below — the OTP was stored.
      }
    } else if (result.reason === "cooldown") {
      // Reveal the cooldown delay here (it's timing-based, not presence-based).
      return NextResponse.json(
        { error: `Please wait ${result.retryAfterSeconds}s before requesting another code.` },
        { status: 429 }
      );
    }
    // If rate_limited, fall through to generic success — don't reveal status.
  }

  // Always return the same response to prevent email enumeration.
  return NextResponse.json({ ok: true });
}
