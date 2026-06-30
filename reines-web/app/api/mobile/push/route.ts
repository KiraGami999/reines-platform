import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, extractBearer } from "@/lib/jwt";
import { z } from "zod";

const registerSchema = z.object({
  token:    z.string().min(1, "Push token is required."),
  platform: z.enum(["ios", "android"]),
});

/**
 * POST /api/mobile/push
 *
 * Registers an Expo push token for the authenticated user.
 * Called after the user grants notification permission in the app.
 * Upserts so re-registration is safe.
 */
export async function POST(req: NextRequest) {
  const bearerToken = extractBearer(req.headers.get("authorization"));
  if (!bearerToken) {
    return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
  }

  const payload = await verifyToken(bearerToken);
  if (!payload) {
    return NextResponse.json({ error: "Token invalid or expired." }, { status: 401 });
  }

  const body   = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request.", issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  await prisma.pushDevice.upsert({
    where:  { token: parsed.data.token },
    update: { userId: payload.id, platform: parsed.data.platform, updatedAt: new Date() },
    create: { userId: payload.id, token: parsed.data.token, platform: parsed.data.platform },
  });

  return NextResponse.json({ success: true });
}

/**
 * DELETE /api/mobile/push
 *
 * Unregisters a specific push token (e.g., when the user disables
 * notifications or the token rotates).
 */
export async function DELETE(req: NextRequest) {
  const bearerToken = extractBearer(req.headers.get("authorization"));
  if (!bearerToken) {
    return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
  }

  const payload = await verifyToken(bearerToken);
  if (!payload) {
    return NextResponse.json({ error: "Token invalid or expired." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { token } = body as { token?: string };

  if (token) {
    await prisma.pushDevice.deleteMany({
      where: { userId: payload.id, token },
    });
  }

  return NextResponse.json({ success: true });
}
