import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/lib/validations";
import { createLoginOtp } from "@/lib/otp";
import { isEmailConfigured, sendLoginOtpEmail } from "@/lib/email";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { INVALID_CREDENTIALS, verifyLoginCredentials } from "@/lib/login-credentials";
import { isTrustedDevice, issuePassToken } from "@/lib/two-factor";

/**
 * POST /api/auth/login/challenge
 *
 * Step 1 of two-factor sign-in. Checks the password, then either:
 *  - returns a pass token immediately (this browser already cleared 2FA), or
 *  - emails a 6-digit code and tells the client to collect it.
 *
 * This is also the resend endpoint — calling it again re-sends the code, subject
 * to the OTP cooldown in lib/otp.ts.
 *
 * Unlike the password-reset routes, this does NOT hide whether the account
 * exists: the client has to know whether to show the code step, and a wrong
 * password already produces the same generic error either way.
 */

function tooMany(message: string, resetAt: number) {
  return NextResponse.json(
    { error: message },
    {
      status: 429,
      headers: { "Retry-After": String(Math.max(1, Math.ceil((resetAt - Date.now()) / 1000))) },
    }
  );
}

/**
 * Emergency valve. Sign-in now depends on outbound email, so an SMTP outage
 * would otherwise lock out every account including admins. Set
 * DISABLE_LOGIN_2FA="true" to fall back to password-only sign-in until mail is
 * healthy again. Password checks and rate limits still apply.
 */
function twoFactorDisabled(): boolean {
  return process.env.DISABLE_LOGIN_2FA === "true";
}

export async function POST(req: NextRequest) {
  // Brute-force ceiling per IP. Note lib/rate-limit.ts is in-memory, so on
  // serverless this is per-instance — move it to Redis for a hard guarantee.
  const ip = getClientIp(req);
  const ipLimit = checkRateLimit(`login-challenge:ip:${ip}`, 10, 15 * 60_000);
  if (!ipLimit.allowed) {
    return tooMany("Too many sign-in attempts. Please try again later.", ipLimit.resetAt);
  }

  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter your email address and password." }, { status: 422 });
  }

  const { email, password } = parsed.data;

  // Per-account ceiling so one targeted account can't be ground down from many IPs.
  const emailLimit = checkRateLimit(`login-challenge:email:${email}`, 8, 15 * 60_000);
  if (!emailLimit.allowed) {
    return tooMany("Too many sign-in attempts for this account. Please try again later.", emailLimit.resetAt);
  }

  const user = await verifyLoginCredentials(email, password);
  if (!user) {
    return NextResponse.json({ error: INVALID_CREDENTIALS }, { status: 401 });
  }

  if (twoFactorDisabled()) {
    console.warn("[login/challenge] DISABLE_LOGIN_2FA is set — signing in without a code.");
    return NextResponse.json({
      twoFactorRequired: false,
      passToken: await issuePassToken(user.id),
    });
  }

  // Browser already cleared 2FA in this session — skip straight to sign-in.
  if (await isTrustedDevice(user.id)) {
    return NextResponse.json({
      twoFactorRequired: false,
      passToken: await issuePassToken(user.id),
    });
  }

  const otp = await createLoginOtp(email);

  if (!otp.ok) {
    if (otp.reason === "cooldown") {
      // A code from moments ago is still valid — send the user to the code step
      // rather than erroring, and tell them when they can request another.
      return NextResponse.json({
        twoFactorRequired: true,
        emailDelivered: true,
        retryAfterSeconds: otp.retryAfterSeconds,
        notice: `We already sent a code to ${email}. You can request another in ${otp.retryAfterSeconds}s.`,
      });
    }
    return tooMany(
      "Too many codes requested for this account. Please try again in a few minutes.",
      Date.now() + 15 * 60_000
    );
  }

  // Locally, print the code instead of mailing it so the real two-step flow can
  // be exercised without SMTP credentials.
  if (!isEmailConfigured() && process.env.NODE_ENV !== "production") {
    console.warn(`[login/challenge] SMTP not configured. Code for ${email}: ${otp.code}`);
    return NextResponse.json({
      twoFactorRequired: true,
      emailDelivered: false,
      notice: "Email isn't configured here — the code was printed to the server console.",
    });
  }

  const delivered = await deliverCode(email, otp.code, user.name);

  // Mail is broken. Fall back to password-only sign-in rather than locking every
  // account out: 2FA is an upgrade on the previous behaviour, so degrading to
  // that beats a total lockout. Failures that indicate an *attack* — wrong
  // password, wrong code, rate limits — never degrade.
  if (!delivered) {
    return NextResponse.json({
      twoFactorRequired: false,
      passToken: await issuePassToken(user.id),
    });
  }

  return NextResponse.json({ twoFactorRequired: true, emailDelivered: true });
}

async function deliverCode(email: string, code: string, name: string): Promise<boolean> {
  if (!isEmailConfigured()) {
    console.error(
      "[login/challenge] SMTP is not configured — two-factor codes cannot be sent, " +
        "so sign-in is running WITHOUT 2FA. Set SMTP_HOST/SMTP_USER/SMTP_PASS."
    );
    return false;
  }

  try {
    await sendLoginOtpEmail(email, code, name);
    return true;
  } catch (err) {
    console.error(
      "[login/challenge] Failed to send a two-factor code — this sign-in proceeded WITHOUT 2FA:",
      err
    );
    return false;
  }
}
