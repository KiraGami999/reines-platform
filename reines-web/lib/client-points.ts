import { prisma } from "@/lib/prisma";

export type ClientPointEntryView = {
  id: string;
  points: number;
  reason: string;
  rewardType: string;
  createdAt: string;
  projectTitle: string | null;
  awardedByName: string | null;
};

export type ClientPointSummary = {
  clientId: string;
  totalPoints: number;
  entries: ClientPointEntryView[];
};

export type ClientPointTotal = {
  clientId: string;
  totalPoints: number;
};

function serializeEntry(entry: {
  id: string;
  points: number;
  reason: string;
  rewardType: string;
  createdAt: Date;
  project: { title: string } | null;
  awardedBy: { name: string } | null;
}): ClientPointEntryView {
  return {
    id: entry.id,
    points: entry.points,
    reason: entry.reason,
    rewardType: entry.rewardType,
    createdAt: entry.createdAt.toISOString(),
    projectTitle: entry.project?.title ?? null,
    awardedByName: entry.awardedBy?.name ?? null,
  };
}

export async function getClientPointSummary(clientId: string): Promise<ClientPointSummary> {
  try {
    const [aggregate, entries] = await Promise.all([
      prisma.clientPointEntry.aggregate({
        where: { clientId },
        _sum: { points: true },
      }),
      prisma.clientPointEntry.findMany({
        where: { clientId },
        include: {
          project: { select: { title: true } },
          awardedBy: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
    ]);

    return {
      clientId,
      totalPoints: aggregate._sum.points ?? 0,
      entries: entries.map(serializeEntry),
    };
  } catch {
    return { clientId, totalPoints: 0, entries: [] };
  }
}

export async function getClientPointTotals(clientIds: string[]): Promise<ClientPointTotal[]> {
  if (clientIds.length === 0) return [];

  try {
    const grouped = await prisma.clientPointEntry.groupBy({
      by: ["clientId"],
      where: { clientId: { in: clientIds } },
      _sum: { points: true },
    });

    const totals = new Map(grouped.map((row) => [row.clientId, row._sum.points ?? 0]));
    return clientIds.map((clientId) => ({
      clientId,
      totalPoints: totals.get(clientId) ?? 0,
    }));
  } catch {
    return clientIds.map((clientId) => ({ clientId, totalPoints: 0 }));
  }
}
