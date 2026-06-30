import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { updateUserSchema } from "@/lib/validations";
import { ok, forbidden, badRequest, notFound, validationError, conflict } from "@/lib/api-response";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return null;
  return session;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return forbidden();

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  try {
    const currentUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true },
    });
    if (!currentUser) return notFound("User");

    if (currentUser.role === "ADMIN" && parsed.data.role && parsed.data.role !== "ADMIN") {
      const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
      if (adminCount <= 1) {
        return badRequest("You cannot remove the last admin account.");
      }
    }

    const { password, ...rest } = parsed.data;
    const updateData = {
      ...rest,
      ...(password ? { password: await hashPassword(password) } : {}),
    };

    const user = await prisma.user.update({
      where:  { id },
      data:   updateData,
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    return ok(user);
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return conflict("An account with this email already exists.");
    }
    return notFound("User");
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return forbidden();

  const { id } = await params;

  if (id === session.user.id) {
    return badRequest("You cannot delete your own account.");
  }

  try {
    const target = await prisma.user.findUnique({
      where: { id },
      select: { role: true },
    });
    if (!target) return notFound("User");

    if (target.role === "ADMIN") {
      const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
      if (adminCount <= 1) {
        return badRequest("You cannot delete the last admin account.");
      }
    }

    await prisma.user.delete({ where: { id } });
    return ok({ success: true });
  } catch {
    return notFound("User");
  }
}
