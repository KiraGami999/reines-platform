import { NextRequest, NextResponse } from "next/server";
import { auth }   from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string; updateId: string }> };

/**
 * DELETE /api/projects/:id/gallery/:updateId
 *
 * Deletes a single ProjectUpdate.
 * Only ADMIN or the PROJECT_MANAGER who manages this project may delete.
 * Clients cannot delete gallery entries.
 */
export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const { id: userId, role } = session.user;

  if (role === "CLIENT")
    return NextResponse.json({ error: "Clients may not delete updates" }, { status: 403 });

  const { id: projectId, updateId } = await params;

  try {
    // Verify the project exists and the requester has rights to it
    const project = await prisma.project.findUnique({ where: { id: projectId } });

    if (!project)
      return NextResponse.json({ error: "Project not found" }, { status: 404 });

    if (role === "PROJECT_MANAGER" && project.managerId !== userId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Verify the update belongs to this project
    const update = await prisma.projectUpdate.findFirst({
      where: { id: updateId, projectId },
    });

    if (!update)
      return NextResponse.json({ error: "Update not found" }, { status: 404 });

    if (update.batchId) {
      await prisma.projectUpdate.deleteMany({
        where: { projectId, batchId: update.batchId },
      });
    } else {
      await prisma.projectUpdate.delete({ where: { id: updateId } });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete update" }, { status: 500 });
  }
}
