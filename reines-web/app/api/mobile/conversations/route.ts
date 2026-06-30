import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, extractBearer } from "@/lib/jwt";

/**
 * GET /api/mobile/conversations
 *
 * Returns all projects the client is involved in, each with:
 *   - Basic project info (id, title, status)
 *   - Assigned manager info
 *   - The most recent message (null if no messages yet)
 *   - Total message count
 *
 * Ordered by the most recently updated project (with messages first).
 * This powers both the Conversation List screen and the unread-count badge
 * in the tab bar.
 *
 * Auth: Bearer token (mobile JWT).
 */
export async function GET(req: NextRequest) {
  const token   = extractBearer(req.headers.get("authorization"));
  if (!token) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Token invalid or expired." }, { status: 401 });

  const { id: userId, role } = payload;

  const where =
    role === "CLIENT"          ? { clientId:  userId } :
    role === "PROJECT_MANAGER" ? { managerId: userId } :
    {};

  try {
    const projects = await prisma.project.findMany({
      where,
      include: {
        manager: { select: { id: true, name: true, email: true, image: true } },
        client:  { select: { id: true, name: true, email: true, image: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take:    1,
          include: { sender: { select: { id: true, name: true, role: true } } },
        },
        _count: { select: { messages: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    const conversations = projects.map((p) => ({
      projectId:    p.id,
      projectTitle: p.title,
      projectStatus: p.status,
      manager:      p.manager,
      client:       p.client,
      lastMessage:  p.messages[0] ?? null,
      messageCount: p._count.messages,
    }));

    return NextResponse.json({ conversations });
  } catch (err) {
    console.error("[GET /api/mobile/conversations]", err);
    return NextResponse.json({ error: "Failed to load conversations." }, { status: 500 });
  }
}
