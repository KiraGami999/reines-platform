import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMockProjectById } from "@/lib/mock-data";

/**
 * GET /api/projects/:id
 * Returns a single project.
 * Clients may only access their own projects — enforced server-side.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { id: userId, role } = session.user;
  const { id } = await params;

  try {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        manager: { select: { id: true, name: true, email: true } },
        updates: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Clients can only see their own projects
    if (role === "CLIENT" && project.clientId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Project managers can only see their own managed projects
    if (role === "PROJECT_MANAGER" && project.managerId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ project });
  } catch {
    // Database not yet connected — return mock data
    const mock = getMockProjectById(id, "client_001");
    if (!mock) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    return NextResponse.json({ project: mock, _source: "mock" });
  }
}
