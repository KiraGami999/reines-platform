import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateProjectSchema } from "@/lib/validations";
import { ok, forbidden, notFound, validationError } from "@/lib/api-response";
import { notifyProjectUpdate } from "@/lib/push";

async function requireAdminOrManager() {
  const session = await auth();
  if (!session?.user) return null;
  if (!["ADMIN", "PROJECT_MANAGER"].includes(session.user.role!)) return null;
  return session;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminOrManager();
  if (!session) return forbidden();

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = updateProjectSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const { startDate, endDate, budget, status, ...rest } = parsed.data;

  try {
    const existing = await prisma.project.findUnique({
      where:  { id },
      select: { id: true, status: true, title: true, clientId: true, managerId: true, managerAccepted: true },
    });
    if (!existing) return notFound("Project");

    if (session.user.role === "PROJECT_MANAGER") {
      if (existing.managerId !== session.user.id || !existing.managerAccepted) {
        return forbidden("Accept this project before making updates.");
      }
    }

    const project = await prisma.project.update({
      where: { id },
      data: {
        ...rest,
        ...(session.user.role === "PROJECT_MANAGER" ? { managerId: session.user.id } : {}),
        ...(status    !== undefined ? { status:    status as "PLANNING" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED" | "CANCELLED" } : {}),
        ...(budget    !== undefined ? { budget:    budget ?? null } : {}),
        ...(startDate !== undefined ? { startDate: startDate ? new Date(startDate) : null } : {}),
        ...(endDate   !== undefined ? { endDate:   endDate   ? new Date(endDate)   : null } : {}),
      },
      include: {
        client:  { select: { id: true, name: true, email: true } },
        manager: { select: { id: true, name: true, email: true } },
      },
    });

    // Notify the client when project status actually changes
    if (
      status !== undefined &&
      status !== existing.status &&
      existing.clientId
    ) {
      notifyProjectUpdate({
        clientId:     existing.clientId,
        projectTitle: project.title,
        projectId:    project.id,
        newStatus:    status,
      }).catch(console.warn);
    }

    return ok(project);
  } catch {
    return notFound("Project");
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminOrManager();
  if (!session) return forbidden();

  if (session.user.role !== "ADMIN") {
    return forbidden("Only administrators can delete projects.");
  }

  const { id } = await params;
  try {
    await prisma.project.delete({ where: { id } });
    return ok({ success: true });
  } catch {
    return notFound("Project");
  }
}
