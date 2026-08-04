import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAdminTestimonials } from "@/lib/testimonials";
import { TESTIMONIAL_ACCENT_OPTIONS } from "@/lib/testimonials-data";
import { forbidden, ok, serverError, validationError } from "@/lib/api-response";

const accentValues = TESTIMONIAL_ACCENT_OPTIONS.map((c) => c.value) as [string, ...string[]];

const testimonialSchema = z.object({
  clientName: z.string().trim().min(2, "Add a client name").max(80),
  clientTitle: z.string().trim().min(2, "Add a role or company").max(100),
  quote: z.string().trim().min(10, "Quote must be at least 10 characters").max(600),
  accentColor: z.enum(accentValues).default("#8fb9e8"),
  sortOrder: z.number().int().min(0).max(200),
});

const settingsSchema = z.object({
  visible: z.boolean().default(true),
});

const updateSchema = z.object({
  settings: settingsSchema,
  testimonials: z.array(testimonialSchema).max(24).default([]),
});

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return null;
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return forbidden();

  try {
    const data = await getAdminTestimonials();
    return ok(data);
  } catch {
    return serverError("Could not load testimonials.");
  }
}

export async function PUT(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return forbidden();

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const { settings, testimonials } = parsed.data;

  try {
    await prisma.$transaction([
      prisma.testimonialsSetting.upsert({
        where: { id: "global" },
        create: { id: "global", ...settings },
        update: { ...settings },
      }),
      prisma.testimonial.deleteMany(),
      prisma.testimonial.createMany({
        data: testimonials.map((t, sortOrder) => ({ ...t, sortOrder })),
      }),
    ]);

    revalidatePath("/");
    revalidatePath("/dashboard/admin/testimonials");

    const saved = await getAdminTestimonials();
    return ok(saved);
  } catch {
    return serverError("Could not save testimonials. Run the Prisma schema update first, then try again.");
  }
}
