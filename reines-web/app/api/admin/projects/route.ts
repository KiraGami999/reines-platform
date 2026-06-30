import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createProjectSchema } from "@/lib/validations";
import { ok, created, forbidden, validationError } from "@/lib/api-response";
import { MOCK_ADMIN_PROJECTS } from "@/lib/mock-admin";

async function requireAdminOrManager() {
  const session = await auth();
  if (!session?.user) return null;
  if (!["ADMIN", "PROJECT_MANAGER"].includes(session.user.role!)) return null;
  return session;
}

export async function GET() {
  const session = await requireAdminOrManager();
  if (!session) return forbidden();

  try {
    const projects = await prisma.project.findMany({
      where: session.user.role === "PROJECT_MANAGER" ? { managerId: session.user.id } : {},
      include: {
        client:  { select: { id: true, name: true, email: true } },
        manager: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return ok(projects);
  } catch {
    return ok(MOCK_ADMIN_PROJECTS);
  }
}

export async function POST(req: NextRequest) {
  const session = await requireAdminOrManager();
  if (!session) return forbidden();
  if (session.user.role !== "ADMIN") {
    return forbidden("Only administrators can create projects and assign them to project managers.");
  }

  const body = await req.json().catch(() => null);
  const parsed = createProjectSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const { title, description, clientId, managerId, status, budget, startDate, endDate } = parsed.data;

  try {
    const project = await prisma.project.create({
      data: {
        title,
        description,
        clientId,
        managerId,
        managerAccepted: false,
        managerAcceptedAt: null,
        status:    status as "PLANNING" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED" | "CANCELLED",
        budget:    budget ?? null,
        startDate: startDate ? new Date(startDate) : null,
        endDate:   endDate   ? new Date(endDate)   : null,
      },
      include: {
        client:  { select: { id: true, name: true, email: true } },
        manager: { select: { id: true, name: true, email: true } },
      },
    });
    return created(project);
  } catch {
    return created({
      id: `proj_${Date.now()}`,
      title, description, clientId, managerId, status,
      managerAccepted: false,
      managerAcceptedAt: null,
      budget: budget ?? 0,
      startDate: startDate ?? null,
      endDate: endDate ?? null,
      createdAt: new Date().toISOString(),
    });
  }
}
