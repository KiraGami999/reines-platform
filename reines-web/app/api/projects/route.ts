import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/projects
 * Returns projects scoped to the authenticated user's role:
 *  - CLIENT          → own projects where manager has accepted
 *  - PROJECT_MANAGER → all assigned projects (accepted and pending)
 *  - ADMIN           → all projects
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
        where:   { clientId: userId, managerAccepted: true },
        include: { manager: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ projects });
    }

    if (role === "PROJECT_MANAGER") {
      const projects = await prisma.project.findMany({
        where:   { managerId: userId },
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
  } catch (err) {
    console.error("[GET /api/projects]", err);
    return NextResponse.json(
      { error: "Failed to load projects. Please try again." },
      { status: 500 }
    );
  }
}
