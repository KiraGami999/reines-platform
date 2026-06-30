import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, extractBearer } from "@/lib/jwt";

/**
 * GET /api/mobile/dashboard
 *
 * Single endpoint for the CLIENT mobile dashboard.
 * Returns all widgets in one request to minimise round-trips:
 *
 *  projects   — active projects (PLANNING | IN_PROGRESS | ON_HOLD)
 *  payments   — pending count, total pending amount, 3 most recent payments
 *  loyalty    — current points balance, lifetime spend, tier label
 *  updates    — 5 most recent project updates across all client projects
 *  messages   — count of messages sent by others in the last 7 days,
 *               up to 4 recent conversations with last message preview
 *
 * Auth: Bearer token (mobile JWT — NOT NextAuth cookie session).
 */
export async function GET(req: NextRequest) {
  const token   = extractBearer(req.headers.get("authorization"));
  if (!token) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Token invalid or expired." }, { status: 401 });

  if (payload.role !== "CLIENT") {
    return NextResponse.json({ error: "This endpoint is for CLIENT accounts only." }, { status: 403 });
  }

  const userId = payload.id;

  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      activeProjects,
      allProjectIds,
      pendingPayments,
      recentPayments,
      pointBalance,
      lifetimeSpend,
      recentUpdates,
      recentMessageCount,
      conversations,
    ] = await Promise.all([

      // Active projects (max 4 on dashboard)
      prisma.project.findMany({
        where: {
          clientId: userId,
          status:   { in: ["PLANNING", "IN_PROGRESS", "ON_HOLD"] },
        },
        include: {
          manager: { select: { id: true, name: true, email: true, image: true } },
          updates: { orderBy: { createdAt: "desc" }, take: 1 },
        },
        orderBy: { updatedAt: "desc" },
        take: 4,
      }),

      // All project IDs for this client (needed for updates + message queries)
      prisma.project.findMany({
        where:  { clientId: userId },
        select: { id: true },
      }),

      // Pending payments aggregate
      prisma.payment.aggregate({
        where:  { userId, status: "PENDING" },
        _count: { id: true },
        _sum:   { amount: true },
      }),

      // 3 most recent payments for the preview list
      prisma.payment.findMany({
        where:   { userId },
        orderBy: { createdAt: "desc" },
        take:    3,
        select: {
          id: true, txRef: true, amount: true, currency: true,
          status: true, method: true, description: true,
          paidAt: true, createdAt: true,
          project: { select: { id: true, title: true } },
        },
      }),

      // Loyalty points balance (sum of all entries)
      prisma.clientPointEntry.aggregate({
        where: { clientId: userId },
        _sum:  { points: true },
      }),

      // Lifetime spend (sum of all successful payments)
      prisma.payment.aggregate({
        where: { userId, status: "SUCCESS" },
        _sum:  { amount: true },
      }),

      // 5 most recent project updates across all client projects
      prisma.projectUpdate.findMany({
        where:   { project: { clientId: userId } },
        include: { project: { select: { id: true, title: true } } },
        orderBy: { createdAt: "desc" },
        take:    5,
      }),

      // Messages from others in the last 7 days (proxy for "unread")
      prisma.message.count({
        where: {
          project:   { clientId: userId },
          senderId:  { not: userId },
          createdAt: { gte: sevenDaysAgo },
        },
      }),

      // Recent conversations: projects with at least one message, sorted by latest
      prisma.project.findMany({
        where: { clientId: userId },
        include: {
          messages: {
            orderBy: { createdAt: "desc" },
            take:    1,
            include: { sender: { select: { id: true, name: true, role: true } } },
          },
          manager: { select: { id: true, name: true, image: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 10,
      }),
    ]);

    // Only include conversations that have messages
    const activeConversations = conversations
      .filter((p) => p.messages.length > 0)
      .slice(0, 4)
      .map((p) => ({
        projectId:   p.id,
        projectTitle: p.title,
        manager:     p.manager,
        lastMessage: p.messages[0],
      }));

    // Loyalty tier logic
    const balance = pointBalance._sum.points ?? 0;
    const spend   = Number(lifetimeSpend._sum.amount ?? 0);
    const tier    = spend >= 50_000_000 ? "Gold" : spend >= 10_000_000 ? "Silver" : "Bronze";

    return NextResponse.json({
      projects: {
        active:     activeProjects,
        totalCount: allProjectIds.length,
      },
      payments: {
        pendingCount:  pendingPayments._count.id,
        pendingAmount: pendingPayments._sum.amount?.toString() ?? "0",
        recent:        recentPayments,
      },
      loyalty: {
        balance,
        lifetimeSpend: spend.toString(),
        tier,
      },
      updates: recentUpdates,
      messages: {
        recentCount:   recentMessageCount,
        conversations: activeConversations,
      },
    });
  } catch (err) {
    console.error("[GET /api/mobile/dashboard]", err);
    return NextResponse.json({ error: "Failed to load dashboard." }, { status: 500 });
  }
}
