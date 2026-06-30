import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendMessageSchema } from "@/lib/validations";
import { getMockMessages } from "@/lib/mock-messages";

type RouteContext = { params: Promise<{ id: string }> };

// ─── GET /api/projects/:id/messages ──────────────────────────────────────────

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const { id } = await params;
  const { id: userId, role } = session.user;

  try {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Scope check — clients only see their own project threads
    if (role === "CLIENT"          && project.clientId  !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (role === "PROJECT_MANAGER" && project.managerId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const messages = await prisma.message.findMany({
      where: { projectId: id },
      include: { sender: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ messages });
  } catch {
    // Fallback to mock while DB is offline
    const messages = getMockMessages(id);
    return NextResponse.json({ messages, _source: "mock" });
  }
}

// ─── POST /api/projects/:id/messages ─────────────────────────────────────────

export async function POST(req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const { id: userId, role, name } = session.user;
  const { id } = await params;

  const body   = await req.json().catch(() => null);
  const parsed = sendMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  try {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (role === "CLIENT"          && project.clientId  !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (role === "PROJECT_MANAGER" && project.managerId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const message = await prisma.message.create({
      data: { projectId: id, senderId: userId, message: parsed.data.message },
      include: { sender: { select: { id: true, name: true, role: true } } },
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch {
    // Mock response when DB is offline
    const optimistic = {
      id:        `mock_${Date.now()}`,
      projectId: id,
      senderId:  userId,
      sender:    { id: userId, name, role },
      message:   parsed.data.message,
      createdAt: new Date().toISOString(),
    };
    return NextResponse.json({ message: optimistic, _source: "mock" }, { status: 201 });
  }
}
