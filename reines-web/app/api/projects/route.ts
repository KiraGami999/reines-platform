import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMockProjects } from "@/lib/mock-data";

/**
 * GET /api/projects
 * Returns projects scoped to the authenticated user's role:
 *  - CLIENT        → own projects only
 *  - PROJECT_MANAGER / ADMIN → all projects (or managed ones)
 */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { id: userId, role } = session.user;

  try {
    if (role === "CLIENT") {
      const projects = await prisma.project.findMany({
        where: { clientId: userId },
        include: { manager: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ projects });
    }

    if (role === "PROJECT_MANAGER") {
      const projects = await prisma.project.findMany({
        where: { managerId: userId },
        include: { manager: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ projects });
    }

    // ADMIN — all projects
    const projects = await prisma.project.findMany({
      include: { manager: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ projects });
  } catch {
    // Database not yet connected — return mock data so the UI remains functional
    const mockProjects = getMockProjects("client_001");
    return NextResponse.json({ projects: mockProjects, _source: "mock" });
  }
}
