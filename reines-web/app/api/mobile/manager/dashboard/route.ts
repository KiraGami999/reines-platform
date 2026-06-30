import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, extractBearer } from "@/lib/jwt";

/**
 * GET /api/mobile/manager/dashboard
 *
 * Single aggregated endpoint for the PROJECT_MANAGER mobile dashboard.
 * Runs all queries in parallel (Promise.all) to keep latency low.
 *
 * Returns:
 *  stats          — project counts by status + tasks due this week
 *  projects       — all managed projects with client, progress, last update
 *  needsAttention — projects with no progress update in the last 7 days
 *  upcomingDeadlines — projects whose end date falls within 30 days
 *  recentMessages — 5 latest client messages across all managed projects
 *  recentActivity — 8 latest project-update posts across all managed projects
 *
 * Auth: Bearer token (mobile JWT — NOT NextAuth cookie session).
 */
export async function GET(req: NextRequest) {
  const token   = extractBearer(req.headers.get("authorization"));
  if (!token) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Token invalid or expired." }, { status: 401 });

  if (payload.role !== "PROJECT_MANAGER") {
    return NextResponse.json({ error: "This endpoint is for PROJECT_MANAGER accounts only." }, { status: 403 });
  }

  const managerId = payload.id;

  const now           = new Date();
  const sevenDaysAgo  = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000);
  const thirtyDaysOut = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const startOfMonth  = new Date(now.getFullYear(), now.getMonth(), 1);

  try {
    const [
      allProjects,
      completedThisMonth,
      recentMessages,
      recentActivity,
    ] = await Promise.all([

      // All managed projects with full relations
      prisma.project.findMany({
        where:   { managerId },
        include: {
          client: { select: { id: true, name: true, email: true, image: true } },
          updates: {
            orderBy: { createdAt: "desc" },
            take:    1,
            select:  { id: true, note: true, progressPercent: true, createdAt: true, imageUrl: true },
          },
          _count: { select: { messages: true, updates: true } },
        },
        orderBy: { updatedAt: "desc" },
      }),

      // Completed projects this calendar month
      prisma.project.count({
        where: {
          managerId,
          status:    "COMPLETED",
          updatedAt: { gte: startOfMonth },
        },
      }),

      // 5 most recent client messages across all managed projects
      prisma.message.findMany({
        where: {
          project:  { managerId },
          senderId: { not: managerId },     // from clients only
        },
        include: {
          sender:  { select: { id: true, name: true, role: true } },
          project: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: "desc" },
        take:    5,
      }),

      // 8 most recent project updates posted across all managed projects
      prisma.projectUpdate.findMany({
        where:   { project: { managerId } },
        include: { project: { select: { id: true, title: true } } },
        orderBy: { createdAt: "desc" },
        take:    8,
      }),
    ]);

    // ── Derived data ────────────────────────────────────────────────────────

    const activeProjects = allProjects.filter((p) =>
      ["PLANNING", "IN_PROGRESS", "ON_HOLD"].includes(p.status)
    );

    // Projects that haven't had a progress update in 7+ days (or ever)
    const needsAttention = allProjects
      .filter((p) => {
        if (p.status === "COMPLETED" || p.status === "CANCELLED") return false;
        const lastUpdate = p.updates[0];
        if (!lastUpdate) return true;
        return new Date(lastUpdate.createdAt) < sevenDaysAgo;
      })
      .slice(0, 5);

    // Projects with an upcoming deadline within 30 days
    const upcomingDeadlines = allProjects
      .filter((p) => {
        if (!p.endDate) return false;
        if (p.status === "COMPLETED" || p.status === "CANCELLED") return false;
        const end = new Date(p.endDate);
        return end >= now && end <= thirtyDaysOut;
      })
      .sort((a, b) => new Date(a.endDate!).getTime() - new Date(b.endDate!).getTime())
      .slice(0, 5);

    const stats = {
      total:              allProjects.length,
      active:             activeProjects.length,
      onHold:             allProjects.filter((p) => p.status === "ON_HOLD").length,
      completedThisMonth,
      needsAttentionCount: needsAttention.length,
      upcomingDeadlineCount: upcomingDeadlines.length,
    };

    // Serialise Decimal fields
    const serialise = (p: typeof allProjects[number]) => ({
      ...p,
      budget: p.budget?.toString() ?? null,
      endDate:   p.endDate   ? p.endDate.toISOString()   : null,
      startDate: p.startDate ? p.startDate.toISOString() : null,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    });

    return NextResponse.json({
      stats,
      projects:         allProjects.map(serialise),
      needsAttention:   needsAttention.map(serialise),
      upcomingDeadlines: upcomingDeadlines.map(serialise),
      recentMessages:   recentMessages.map((m) => ({
        id:           m.id,
        message:      m.message,
        createdAt:    m.createdAt.toISOString(),
        sender:       m.sender,
        projectId:    m.projectId,
        projectTitle: m.project.title,
      })),
      recentActivity: recentActivity.map((u) => ({
        id:              u.id,
        note:            u.note,
        imageUrl:        u.imageUrl,
        progressPercent: u.progressPercent,
        createdAt:       u.createdAt.toISOString(),
        projectId:       u.projectId,
        projectTitle:    u.project.title,
      })),
    });
  } catch (err) {
    console.error("[GET /api/mobile/manager/dashboard]", err);
    return NextResponse.json({ error: "Failed to load dashboard." }, { status: 500 });
  }
}
