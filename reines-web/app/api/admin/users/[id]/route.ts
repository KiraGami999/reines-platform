import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { updateUserSchema } from "@/lib/validations";
import { ADMIN_CAP_MESSAGE, wouldExceedAdminCap } from "@/lib/admin-users";
import { recordAdminAction } from "@/lib/audit-log";
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
      select: { id: true, name: true, email: true, role: true },
    });
    if (!currentUser) return notFound("User");

    if (currentUser.role === "ADMIN" && parsed.data.role && parsed.data.role !== "ADMIN") {
      const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
      if (adminCount <= 1) {
        return badRequest("You cannot remove the last admin account.");
      }
    }

    if (
      await wouldExceedAdminCap({
        nextRole: parsed.data.role,
        currentRole: currentUser.role,
      })
    ) {
      return badRequest(ADMIN_CAP_MESSAGE);
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

    const changed = Object.keys(rest);
    if (password) changed.push("password");
    recordAdminAction({
      actor: session.user,
      action: "user.update",
      entityType: "User",
      entityId: user.id,
      summary: `Updated user ${user.name} (${user.email})${parsed.data.role && parsed.data.role !== currentUser.role ? ` — role ${currentUser.role} → ${parsed.data.role}` : ""}`,
      metadata: {
        fields: changed,
        previousRole: currentUser.role,
        role: user.role,
      },
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
      select: { role: true, name: true, email: true },
    });
    if (!target) return notFound("User");

    if (target.role === "ADMIN") {
      const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
      if (adminCount <= 1) {
        return badRequest("You cannot delete the last admin account.");
      }
    }

    await prisma.user.delete({ where: { id } });

    recordAdminAction({
      actor: session.user,
      action: "user.delete",
      entityType: "User",
      entityId: id,
      summary: `Deleted user ${target.name} (${target.email}) — was ${target.role}`,
      metadata: { role: target.role, email: target.email },
    });

    return ok({ success: true });
  } catch {
    return notFound("User");
  }
}
