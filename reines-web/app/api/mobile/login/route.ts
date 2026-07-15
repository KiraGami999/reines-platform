import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { signToken } from "@/lib/jwt";
import { z } from "zod";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const schema = z.object({
  email:    z.string().email("Invalid email address."),
  password: z.string().min(1, "Password is required."),
});

/**
 * POST /api/mobile/login
 *
 * Authenticates a CLIENT, PROJECT_MANAGER or ADMIN and returns a JWT.
 * Uses the same User table and bcrypt passwords as the web portal.
 * The mobile app renders each role's existing web portal inside a WebView,
 * so all roles (including ADMIN) can sign in here.
 */
export async function POST(req: NextRequest) {
  // 10 login attempts per IP per 15 minutes.
  const ip = getClientIp(req);
  const rl = checkRateLimit(`mobile-login:${ip}`, 10, 15 * 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    );
  }

  const body   = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({
    where:  { email: email.toLowerCase().trim() },
    select: { id: true, name: true, email: true, password: true, role: true, image: true },
  });

  if (!user || !user.password) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const valid = await verifyPassword(password, user.password);
  if (!valid) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const token = await signToken({
    id:    user.id,
    email: user.email,
    role:  user.role,
    name:  user.name,
  });

  return NextResponse.json({
    token,
    user: {
      id:    user.id,
      name:  user.name,
      email: user.email,
      role:  user.role,
      image: user.image,
    },
  });
}
