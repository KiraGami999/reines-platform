import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordAdminAction } from "@/lib/audit-log";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return null;
  return session;
}

export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  try {
    const enquiry = await prisma.enquiry.update({
      where: { id },
      data:  { read: true },
    });

    recordAdminAction({
      actor: session.user,
      action: "enquiry.read",
      entityType: "Enquiry",
      entityId: enquiry.id,
      summary: `Marked enquiry from ${enquiry.name} (${enquiry.email}) as read`,
      metadata: { subject: enquiry.subject },
    });

    return NextResponse.json(enquiry);
  } catch {
    return NextResponse.json({ error: "Enquiry not found or DB unavailable" }, { status: 404 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  try {
    const enquiry = await prisma.enquiry.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, subject: true },
    });
    if (!enquiry) {
      return NextResponse.json({ error: "Enquiry not found or DB unavailable" }, { status: 404 });
    }

    await prisma.enquiry.delete({ where: { id } });

    recordAdminAction({
      actor: session.user,
      action: "enquiry.delete",
      entityType: "Enquiry",
      entityId: id,
      summary: `Deleted enquiry from ${enquiry.name} (${enquiry.email})`,
      metadata: { subject: enquiry.subject },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Enquiry not found or DB unavailable" }, { status: 404 });
  }
}
