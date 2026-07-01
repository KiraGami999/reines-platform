import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createProjectSchema } from "@/lib/validations";
import { ok, created, forbidden, validationError } from "@/lib/api-response";

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
  } catch (err) {
    console.error("[GET /api/admin/projects]", err);
    return NextResponse.json(
      { error: "Failed to load projects. Please try again." },
      { status: 500 }
    );
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
  } catch (err) {
    console.error("[POST /api/admin/projects]", err);
    const msg = err instanceof Error && err.message.includes("Foreign key constraint")
      ? "Invalid client or manager ID — make sure both users exist."
      : "Failed to create project. Please try again.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
