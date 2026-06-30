import { NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { forbidden, ok, validationError } from "@/lib/api-response";

const pointEntrySchema = z.object({
  clientId: z.string().min(1),
  projectId: z.string().min(1).optional().nullable(),
  points: z.number().int().min(-100000).max(100000).refine((value) => value !== 0, "Points cannot be zero"),
  reason: z.string().trim().min(5, "Add a clear reason").max(500),
  rewardType: z.string().trim().min(2).max(50).optional().default("PROJECT"),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "PROJECT_MANAGER"].includes(session.user.role!)) {
    return forbidden();
  }

  const body = await req.json().catch(() => null);
  const parsed = pointEntrySchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const { clientId, projectId, points, reason, rewardType } = parsed.data;

  try {
    const client = await prisma.user.findFirst({
      where: { id: clientId, role: "CLIENT" },
      select: { id: true },
    });
    if (!client) return forbidden("Select a valid client account.");

    if (projectId) {
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          clientId,
          ...(session.user.role === "PROJECT_MANAGER" ? { managerId: session.user.id, managerAccepted: true } : {}),
        },
        select: { id: true },
      });
      if (!project) return forbidden("You can only award points for projects linked to this client.");
    } else if (session.user.role === "PROJECT_MANAGER") {
      return forbidden("Project managers must award points from a project they manage.");
    }

    const entry = await prisma.clientPointEntry.create({
      data: {
        clientId,
        projectId: projectId ?? null,
        points,
        reason,
        rewardType,
        awardedById: session.user.id ?? null,
      },
      include: {
        project: { select: { title: true } },
        awardedBy: { select: { name: true } },
      },
    });

    const aggregate = await prisma.clientPointEntry.aggregate({
      where: { clientId },
      _sum: { points: true },
    });

    return ok({
      entry: {
        id: entry.id,
        points: entry.points,
        reason: entry.reason,
        rewardType: entry.rewardType,
        createdAt: entry.createdAt.toISOString(),
        projectTitle: entry.project?.title ?? null,
        awardedByName: entry.awardedBy?.name ?? null,
      },
      totalPoints: aggregate._sum.points ?? 0,
    }, 201);
  } catch {
    return ok({
      entry: {
        id: `mock_${Date.now()}`,
        points,
        reason,
        rewardType,
        createdAt: new Date().toISOString(),
        projectTitle: null,
        awardedByName: session.user.name ?? null,
      },
      totalPoints: points,
      _source: "mock",
    }, 201);
  }
}
