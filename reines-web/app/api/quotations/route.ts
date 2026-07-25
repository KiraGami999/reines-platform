import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const productItemSchema = z.object({
  name:     z.string().trim().min(1),
  quantity: z.string().trim().min(1),
  unit:     z.string().trim().optional().default(""),
});

const baseSchema = z.object({
  name:                z.string().min(2,  "Please enter your full name."),
  email:               z.string().email("Please enter a valid email address."),
  phone:               z.string().optional(),
  company:             z.string().optional(),
  requestType:         z.enum(["PROJECT", "PRODUCTS"]).default("PROJECT"),
  projectType:         z.string().optional().default(""),
  productCategory:     z.string().optional().default(""),
  products:            z.array(productItemSchema).optional().default([]),
  description:         z.string().optional().default(""),
  location:            z.string().min(2,  "Please enter the location."),
  budgetRange:         z.string().optional(),
  timeline:            z.string().optional(),
  projectSize:         z.string().optional(),
  specialRequirements: z.string().optional(),
  howHeardAboutUs:     z.string().optional(),
});

// PROJECT requests need a project type + a real description; PRODUCTS requests
// need a category + at least one line item instead — validated together here
// since which fields matter depends on `requestType`.
const schema = baseSchema.superRefine((data, ctx) => {
  if (data.requestType === "PRODUCTS") {
    if (!data.productCategory) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["productCategory"], message: "Please select a product category." });
    }
    const validItems = data.products.filter((p) => p.name && p.quantity);
    if (validItems.length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["products"], message: "Please add at least one product with a quantity." });
    }
  } else {
    if (!data.projectType) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["projectType"], message: "Please select a project type." });
    }
    if (!data.description || data.description.trim().length < 20) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["description"], message: "Please describe your project in at least 20 characters." });
    }
  }
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

    const { products, ...rest } = parsed.data;
    const record = await prisma.quotationRequest.create({
      data: {
        ...rest,
        projectType: rest.projectType || (rest.requestType === "PRODUCTS" ? "Products Order" : ""),
        products: products.filter((p) => p.name && p.quantity),
      },
    });
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
