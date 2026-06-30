import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { enquirySchema } from "@/lib/validations";

/** POST /api/enquiries — submit a public contact form enquiry. */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const parsed = enquirySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const enquiry = await prisma.enquiry.create({
      data: parsed.data,
      select: { id: true, name: true, subject: true, createdAt: true },
    });

    return NextResponse.json({ enquiry }, { status: 201 });
  } catch (error) {
    console.error("[ENQUIRY]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** GET /api/enquiries — returns all enquiries (admin only). */
export async function GET() {
  const session = await auth();
  if (!session?.user)                      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  if (session.user.role !== "ADMIN")       return NextResponse.json({ error: "Forbidden"       }, { status: 403 });

  try {
    const enquiries = await prisma.enquiry.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true, subject: true, read: true, createdAt: true },
    });
    return NextResponse.json({ enquiries });
  } catch {
    return NextResponse.json({ error: "Failed to fetch enquiries" }, { status: 500 });
  }
}
