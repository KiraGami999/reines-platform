import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { forbidden, ok, serverError, validationError } from "@/lib/api-response";

const updateMeSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(80, "Name is too long"),
});

/** GET /api/auth/me — returns the current session user + whether a password is set. */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password: true, name: true, email: true, role: true, image: true },
    });
    if (!dbUser) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        ...session.user,
        name: dbUser.name,
        email: dbUser.email,
        role: dbUser.role,
        image: dbUser.image,
        hasPassword: !!dbUser.password,
      },
    });
  } catch (err) {
    console.error("[api/auth/me GET]", err);
    return NextResponse.json({ error: "Could not load profile." }, { status: 500 });
  }
}

/** PATCH /api/auth/me — update display name. */
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return forbidden();

  const body = await req.json().catch(() => null);
  const parsed = updateMeSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  try {
    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: { name: parsed.data.name },
      select: { id: true, name: true, email: true, role: true, image: true },
    });

    return ok({ user: updated });
  } catch (err) {
    console.error("[api/auth/me PATCH]", err);
    return serverError("Could not update profile.");
  }
}
