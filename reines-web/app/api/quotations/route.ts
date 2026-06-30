import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  name:                z.string().min(2,  "Please enter your full name."),
  email:               z.string().email("Please enter a valid email address."),
  phone:               z.string().optional(),
  company:             z.string().optional(),
  projectType:         z.string().min(1,  "Please select a project type."),
  description:         z.string().min(20, "Please describe your project in at least 20 characters."),
  location:            z.string().min(2,  "Please enter the project location."),
  budgetRange:         z.string().optional(),
  timeline:            z.string().optional(),
  projectSize:         z.string().optional(),
  specialRequirements: z.string().optional(),
  howHeardAboutUs:     z.string().optional(),
});

/**
 * POST /api/quotations  — Public: submit a quote request
 */
export async function POST(req: NextRequest) {
  try {
    const body   = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed.", issues: parsed.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const record = await prisma.quotationRequest.create({ data: parsed.data });
    return NextResponse.json({ id: record.id }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/quotations]", err);
    return NextResponse.json({ error: "Failed to submit quotation. Please try again." }, { status: 500 });
  }
}

/**
 * GET /api/quotations  — Admin only: list all quote requests
 */
export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const rows = await prisma.quotationRequest.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
