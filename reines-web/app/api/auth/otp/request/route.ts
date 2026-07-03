import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { loginSchema } from "@/lib/validations";
import { createLoginOtp } from "@/lib/otp";
import { sendLoginOtpEmail, isEmailConfigured } from "@/lib/email";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const isDev = process.env.NODE_ENV === "development";

/**
 * POST /api/auth/otp/request
 *
 * Step 1 of two-factor login:
 *  - Validates email + password.
 *  - If valid, generates a 6-digit OTP and either emails it (production) or
 *    prints it to the server console (development / SMTP not configured).
 *  - Does NOT create a session — that happens in step 2 via NextAuth.
 *
 * Always return generic responses to avoid leaking whether an email exists.
 */
export async function POST(req: NextRequest) {
  // 10 OTP requests per IP per 15 minutes.
  const ip = getClientIp(req);
  const rl = checkRateLimit(`otp:${ip}`, 10, 15 * 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please enter a valid email and password." },
      { status: 422 }
    );
  }

  const { email, password } = parsed.data;

  // Verify the password before issuing any code.
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.password || !(await verifyPassword(password, user.password))) {
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 }
    );
  }

  // Generate and store the OTP first (so rate limiting is always applied).
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

  // ── Email delivery ────────────────────────────────────────────────────────
  // In development (or when SMTP isn't set up), print the code to the server
  // terminal instead of requiring email configuration. This lets you test
  // login with existing accounts without any SMTP setup.
  const smtpReady = isEmailConfigured();

  if (!smtpReady) {
    if (!isDev) {
      // Production with no SMTP — block login (we cannot deliver codes securely).
      console.error("[otp/request] SMTP not configured in production — login blocked.");
      return NextResponse.json(
        { error: "Email delivery is not set up on the server. Please contact support." },
        { status: 500 }
      );
    }

    // Development fallback: print the OTP to the Next.js server terminal.
    // Copy the code from the terminal and paste it into the login form.
    printDevOtp(email, result.code);
    return NextResponse.json({ ok: true });
  }

  // SMTP is configured — send the code by email.
  try {
    await sendLoginOtpEmail(email, result.code, user.name);
  } catch (err) {
    console.error("[otp/request] Failed to send OTP email:", err);

    // If email sending fails in development, fall back to the console so
    // a misconfigured SMTP doesn't lock you out completely.
    if (isDev) {
      console.warn("[otp/request] Email send failed — falling back to console OTP.");
      printDevOtp(email, result.code);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json(
      { error: "We couldn't send the verification email. Please try again." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}

function printDevOtp(email: string, code: string) {
  const line = "═".repeat(42);
  console.log(`\n\x1b[33m╔${line}╗\x1b[0m`);
  console.log(`\x1b[33m║   🔐 DEV MODE — LOGIN OTP                    ║\x1b[0m`);
  console.log(`\x1b[33m║   Email : \x1b[97m${email.padEnd(30)}\x1b[33m║\x1b[0m`);
  console.log(`\x1b[33m║   Code  : \x1b[97m\x1b[1m${code}                          \x1b[0m\x1b[33m║\x1b[0m`);
  console.log(`\x1b[33m║   Expires in 10 minutes                      ║\x1b[0m`);
  console.log(`\x1b[33m╚${line}╝\x1b[0m\n`);
}
