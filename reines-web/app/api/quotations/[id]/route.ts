import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  status:     z.enum(["NEW", "REVIEWED", "QUOTED", "CLOSED"]).optional(),
  read:       z.boolean().optional(),
  adminNotes: z.string().optional(),
});

/** PATCH /api/quotations/[id] — Admin updates status / notes */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body   = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data." }, { status: 422 });
  }

  try {
    const updated = await prisma.quotationRequest.update({
      where: { id },
      data:  parsed.data,
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
}
