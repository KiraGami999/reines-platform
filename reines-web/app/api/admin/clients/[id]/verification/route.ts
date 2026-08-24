import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendVerificationApprovedEmail, sendVerificationRejectedEmail } from "@/lib/email";
import { z } from "zod";

type RouteContext = { params: Promise<{ id: string }> };

const schema = z.object({
  action: z.enum(["APPROVE", "REJECT"] as const),
  notes:  z.string().optional(),
});

export async function POST(req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id: clientId } = await params;

  try {
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const { action, notes } = parsed.data;

    // Fetch the client user first to ensure they exist and get email/name
    const client = await prisma.user.findFirst({
      where: { id: clientId, role: "CLIENT" },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const status = action === "APPROVE" ? "APPROVED" : "REJECTED";

    // Update DB
    const updatedClient = await prisma.user.update({
      where: { id: clientId },
      data: {
        verificationStatus:     status,
        verificationReviewedAt:  new Date(),
        verificationAdminNotes:  action === "REJECT" ? (notes ?? "No feedback provided.") : null,
      },
    });

    // Send SMTP emails
    if (action === "APPROVE") {
      sendVerificationApprovedEmail(client.email, client.name || undefined)
        .catch((err) => console.error("[verification-mail] Failed to send approval email:", err));
    } else {
      sendVerificationRejectedEmail(client.email, client.name || undefined, notes)
        .catch((err) => console.error("[verification-mail] Failed to send rejection email:", err));
    }

    return NextResponse.json({
      success: true,
      status:  updatedClient.verificationStatus,
    });
  } catch (err) {
    console.error("[api/admin/clients/[id]/verification] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
