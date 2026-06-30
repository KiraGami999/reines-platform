import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { forbidden, notFound, ok } from "@/lib/api-response";

export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return forbidden();
  if (session.user.role !== "PROJECT_MANAGER") {
    return forbidden("Only the assigned project manager can accept this project.");
  }

  const { id } = await params;

  const project = await prisma.project.findFirst({
    where: { id, managerId: session.user.id },
    select: { id: true },
  });

  if (!project) return notFound("Project");

  const acceptedProject = await prisma.project.update({
    where: { id },
    data: {
      managerAccepted: true,
      managerAcceptedAt: new Date(),
    },
    select: {
      id: true,
      managerAccepted: true,
      managerAcceptedAt: true,
    },
  });

  return ok({
    id: acceptedProject.id,
    managerAccepted: acceptedProject.managerAccepted,
    managerAcceptedAt: acceptedProject.managerAcceptedAt?.toISOString() ?? null,
  });
}
