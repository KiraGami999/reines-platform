import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendClientVerificationSubmittedEmail, sendAdminVerificationSubmittedEmail } from "@/lib/email";
import { z } from "zod";

const schema = z.object({
  fullName:    z.string().min(3, "Please enter your full name as shown on your ID"),
  phone:       z.string().min(5, "Please enter a valid phone number"),
  address:     z.string().min(5, "Please enter your physical address"),
  idType:      z.enum(["ID_CARD", "PASSPORT", "DRIVING_LICENSE"] as const),
  idNumber:    z.string().min(3, "Please enter your ID/Document number"),
  documentUrl: z.string().url("Please upload your identity document"),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { id: userId, role, email } = session.user;
  if (role !== "CLIENT") {
    return NextResponse.json({ error: "Only clients can submit verification" }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const { fullName, phone, address, idType, idNumber, documentUrl } = parsed.data;

    // Save to user DB and update status to PENDING
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        verificationStatus:      "PENDING",
        verificationFullName:    fullName,
        verificationPhone:       phone,
        verificationAddress:     address,
        verificationIdType:      idType,
        verificationIdNumber:    idNumber,
        verificationDocumentUrl: documentUrl,
        verificationSubmittedAt: new Date(),
        verificationReviewedAt:  null,
        verificationAdminNotes:  null,
      },
    });

    // Send SMTP emails (fire-and-forget but logged)
    sendClientVerificationSubmittedEmail(email, user.name || fullName)
      .catch((err) => console.error("[verification-mail] Failed to notify client:", err));

    sendAdminVerificationSubmittedEmail(user.name || fullName, email, {
      phone,
      address,
      idType,
      idNumber,
      documentUrl,
    }).catch((err) => console.error("[verification-mail] Failed to notify admins:", err));

    return NextResponse.json({
      success: true,
      status:  user.verificationStatus,
    });
  } catch (err) {
    console.error("[api/client/verification] Error submitting:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
