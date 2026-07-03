/**
 * Email OTP (one-time password) helpers for two-factor login.
 *
 * Security properties:
 *  - Codes are 6 cryptographically-random digits.
 *  - Only a HMAC-SHA256 hash of the code is stored (peppered with AUTH_SECRET).
 *  - Codes expire after 10 minutes.
 *  - Max 5 verification attempts per code, then it's dead.
 *  - Resend cooldown (45s) + per-email request cap (5 / 15 min) throttle abuse.
 *  - Requesting a new code invalidates all previous unconsumed codes.
 */

import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export const OTP_TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 45;
const MAX_REQUESTS_PER_WINDOW = 5;
const WINDOW_MINUTES = 15;

function pepper(): string {
  return (
    process.env.AUTH_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    "insecure-dev-otp-pepper-change-me"
  );
}

function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function generateOtpCode(): string {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

function hashOtpCode(code: string): string {
  return crypto.createHmac("sha256", pepper()).update(code).digest("hex");
}

// ─── Create a login OTP ───────────────────────────────────────────────────────

export type CreateOtpResult =
  | { ok: true; code: string }
  | { ok: false; reason: "cooldown"; retryAfterSeconds: number }
  | { ok: false; reason: "rate_limited" };

export async function createLoginOtp(email: string): Promise<CreateOtpResult> {
  const normalized = normaliseEmail(email);
  const now = new Date();

  // Resend cooldown — block rapid re-requests of a still-fresh code.
  const latest = await prisma.emailOtp.findFirst({
    where:   { email: normalized, purpose: "LOGIN" },
    orderBy: { createdAt: "desc" },
  });
  if (latest && !latest.consumedAt) {
    const ageSeconds = (now.getTime() - latest.createdAt.getTime()) / 1000;
    if (ageSeconds < RESEND_COOLDOWN_SECONDS) {
      return {
        ok: false,
        reason: "cooldown",
        retryAfterSeconds: Math.ceil(RESEND_COOLDOWN_SECONDS - ageSeconds),
      };
    }
  }

  // Sliding-window request cap.
  const windowStart = new Date(now.getTime() - WINDOW_MINUTES * 60_000);
  const recentCount = await prisma.emailOtp.count({
    where: { email: normalized, purpose: "LOGIN", createdAt: { gte: windowStart } },
  });
  if (recentCount >= MAX_REQUESTS_PER_WINDOW) {
    return { ok: false, reason: "rate_limited" };
  }

  // Invalidate any previous unconsumed codes for this email.
  await prisma.emailOtp.updateMany({
    where: { email: normalized, purpose: "LOGIN", consumedAt: null },
    data:  { consumedAt: now },
  });

  const code = generateOtpCode();
  await prisma.emailOtp.create({
    data: {
      email:     normalized,
      codeHash:  hashOtpCode(code),
      purpose:   "LOGIN",
      expiresAt: new Date(now.getTime() + OTP_TTL_MINUTES * 60_000),
    },
  });

  return { ok: true, code };
}

// ─── Verify a login OTP ───────────────────────────────────────────────────────

export type VerifyOtpResult =
  | { ok: true }
  | { ok: false; reason: "no_code" | "expired" | "too_many_attempts" | "invalid" };

export async function verifyLoginOtp(email: string, code: string): Promise<VerifyOtpResult> {
  const normalized = normaliseEmail(email);
  const now = new Date();

  const otp = await prisma.emailOtp.findFirst({
    where:   { email: normalized, purpose: "LOGIN", consumedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!otp) return { ok: false, reason: "no_code" };
  if (otp.expiresAt < now) return { ok: false, reason: "expired" };
  if (otp.attempts >= MAX_ATTEMPTS) return { ok: false, reason: "too_many_attempts" };

  const provided = hashOtpCode(code);
  const matches = crypto.timingSafeEqual(
    Buffer.from(otp.codeHash, "hex"),
    Buffer.from(provided, "hex")
  );

  if (!matches) {
    await prisma.emailOtp.update({
      where: { id: otp.id },
      data:  { attempts: { increment: 1 } },
    });
    return { ok: false, reason: "invalid" };
  }

  await prisma.emailOtp.update({
    where: { id: otp.id },
    data:  { consumedAt: now },
  });

  return { ok: true };
}
