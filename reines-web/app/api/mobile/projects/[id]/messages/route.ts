import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyNewMessage } from "@/lib/push";
import { z } from "zod";
import { sendProjectMessageEmail } from "@/lib/email";
import { checkMobileVerification } from "@/lib/api-guards";

type RouteContext = { params: Promise<{ id: string }> };

const sendSchema = z.object({
  message: z.string().min(1).max(2000),
});

// ─── GET /api/mobile/projects/:id/messages ─────────────────────────────────

/**
 * Returns all messages for a project thread, ordered oldest-first
 * so the client can render them top-to-bottom without reversing.
 *
 * Includes `projectTitle` so the chat header doesn't need an extra fetch.
 *
 * Auth: Bearer token (mobile JWT).
 */
export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { errorResponse, payload } = await checkMobileVerification(_req);
  if (errorResponse) return errorResponse;

  const { id: userId, role } = payload!;
  const { id: projectId }    = await params;

  try {
    const project = await prisma.project.findUnique({
      where:  { id: projectId },
      select: { id: true, title: true, clientId: true, managerId: true },
    });
    if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 });

    if (role === "CLIENT"          && project.clientId  !== userId) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    if (role === "PROJECT_MANAGER" && project.managerId !== userId) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

    const messages = await prisma.message.findMany({
      where:   { projectId },
      include: { sender: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ messages, projectTitle: project.title });
  } catch (err) {
    console.error("[GET /api/mobile/projects/:id/messages]", err);
    return NextResponse.json({ error: "Failed to load messages." }, { status: 500 });
  }
}

// ─── POST /api/mobile/projects/:id/messages ────────────────────────────────

/**
 * Posts a new message to a project thread.
 * Returns the saved message (including sender info) so the client can
 * replace the optimistic record immediately.
 *
 * Auth: Bearer token (mobile JWT).
 */
export async function POST(req: NextRequest, { params }: RouteContext) {
  const { errorResponse, payload } = await checkMobileVerification(req);
  if (errorResponse) return errorResponse;

  const { id: userId, role } = payload!;
  const { id: projectId }    = await params;

  const body   = await req.json().catch(() => null);
  const parsed = sendSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Message cannot be empty.", issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  try {
    const project = await prisma.project.findUnique({
      where:  { id: projectId },
      include: {
        client: { select: { name: true, email: true } },
        manager: { select: { name: true } },
      },
    });
    if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 });

    if (role === "CLIENT"          && project.clientId  !== userId) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    if (role === "PROJECT_MANAGER" && project.managerId !== userId) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

    const message = await prisma.message.create({
      data: {
        projectId,
        senderId: userId,
        message:  parsed.data.message,
      },
      include: { sender: { select: { id: true, name: true, role: true } } },
    });

    // Notify the OTHER participant (fire-and-forget — don't block the response)
    const recipientId = role === "CLIENT" ? project.managerId : project.clientId;
    notifyNewMessage({
      recipientId,
      senderName:    message.sender.name,
      projectTitle:  project.title,
      projectId,
      messagePreview: parsed.data.message,
    }).catch(console.warn);

    // If PM/Admin sent it, also notify client via email
    if (role === "PROJECT_MANAGER" || role === "ADMIN") {
      sendProjectMessageEmail({
        to: project.client.email,
        clientName: project.client.name,
        senderName: message.sender.name || "Your Project Manager",
        projectTitle: project.title,
        messagePreview: parsed.data.message,
        projectId: project.id,
      }).catch((err) => console.error("[mobile-chat] Email notification error:", err));
    }

    return NextResponse.json({ message }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/mobile/projects/:id/messages]", err);
    return NextResponse.json({ error: "Failed to send message." }, { status: 500 });
  }
}
