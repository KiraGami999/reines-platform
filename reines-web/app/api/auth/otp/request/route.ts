import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { loginSchema } from "@/lib/validations";
import { createLoginOtp } from "@/lib/otp";
import { sendLoginOtpEmail, isEmailConfigured } from "@/lib/email";

/**
 * POST /api/auth/otp/request
 *
 * Step 1 of two-factor login:
 *  - Validates email + password.
 *  - If valid, generates a 6-digit OTP and emails it to the user.
 *  - Does NOT create a session. The session is only created in step 2 when the
 *    user submits the OTP back through NextAuth's credentials provider.
 *
 * Always keep responses generic to avoid leaking whether an email exists,
 * beyond the pre-existing "invalid email or password" behaviour.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please enter a valid email and password." },
      { status: 422 }
    );
  }

  const { email, password } = parsed.data;

  // Verify the password before sending any code (so we never email codes to
  // addresses whose password wasn't supplied correctly).
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.password || !(await verifyPassword(password, user.password))) {
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 }
    );
  }

  // Fail fast if the server can't actually send email.
  if (!isEmailConfigured()) {
    console.error("[otp/request] SMTP not configured — cannot send OTP.");
    return NextResponse.json(
      { error: "Email delivery is not set up on the server. Please contact support." },
      { status: 500 }
    );
  }

  const result = await createLoginOtp(email);
  if (!result.ok) {
    if (result.reason === "cooldown") {
      return NextResponse.json(
        { error: `Please wait ${result.retryAfterSeconds}s before requesting another code.` },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: "Too many code requests. Please try again in a few minutes." },
      { status: 429 }
    );
  }

  try {
    await sendLoginOtpEmail(email, result.code, user.name);
  } catch (err) {
    console.error("[otp/request] Failed to send OTP email:", err);
    return NextResponse.json(
      { error: "We couldn't send the verification email. Please try again." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
