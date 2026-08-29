import { NextRequest, NextResponse } from "next/server";
import { twoFactorVerifySchema } from "@/lib/validations";
import { verifyLoginOtp } from "@/lib/otp";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { INVALID_CREDENTIALS, verifyLoginCredentials } from "@/lib/login-credentials";
import { issuePassToken, trustCurrentDevice } from "@/lib/two-factor";

/**
 * POST /api/auth/2fa/verify
 *
 * Step 2 of two-factor sign-in. Re-checks the password, validates the emailed
 * code, then trusts this browser and returns a short-lived pass token the client
 * hands to signIn("credentials").
 */

const OTP_ERRORS: Record<string, string> = {
  no_code: "No sign-in code was found. Please request a new one.",
  expired: "That code has expired. Please request a new one.",
  too_many_attempts: "Too many incorrect attempts. Please request a new code.",
  invalid: "That code isn't right. Please check and try again.",
};

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const ipLimit = checkRateLimit(`2fa-verify:ip:${ip}`, 15, 15 * 60_000);
  if (!ipLimit.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.max(1, Math.ceil((ipLimit.resetAt - Date.now()) / 1000))) },
      }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = twoFactorVerifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter the 6-digit code from your email." }, { status: 422 });
  }

  const { email, password, code } = parsed.data;

  const user = await verifyLoginCredentials(email, password);
  if (!user) {
    return NextResponse.json({ error: INVALID_CREDENTIALS }, { status: 401 });
  }

  // lib/otp.ts caps attempts per code and consumes it on success.
  const result = await verifyLoginOtp(email, code);
  if (!result.ok) {
    return NextResponse.json(
      { error: OTP_ERRORS[result.reason] ?? "That code isn't right." },
      { status: 400 }
    );
  }

  await trustCurrentDevice(user.id);

  return NextResponse.json({ passToken: await issuePassToken(user.id) });
}
