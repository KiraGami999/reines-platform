import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { registerSchema } from "@/lib/validations";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { createEmailVerifyOtp } from "@/lib/otp";
import { sendVerifyEmail, isEmailConfigured } from "@/lib/email";

export async function POST(req: NextRequest) {
  // 5 registrations per IP per hour.
  const ip = getClientIp(req);
  const rl = checkRateLimit(`register:${ip}`, 5, 60 * 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    );
  }

  try {
    const body = await req.json();

    // Validate input
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const { name, email, password } = parsed.data;

    // Self-registration always creates CLIENT accounts.
    // Other roles must be assigned by an admin via /api/admin/users.
    const role = "CLIENT" as const;

    // Check for duplicate email
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password and create user
    const hashed = await hashPassword(password);
    const user = await prisma.user.create({
      data: { name, email, password: hashed, role },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    // Send email-verification code in the background (best-effort).
    if (isEmailConfigured()) {
      createEmailVerifyOtp(email)
        .then((result) => {
          if (result.ok) {
            return sendVerifyEmail(email, result.code, name);
          }
        })
        .catch((err) =>
          console.error("[REGISTER] Failed to send verification email:", err)
        );
    }

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error("[REGISTER]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
