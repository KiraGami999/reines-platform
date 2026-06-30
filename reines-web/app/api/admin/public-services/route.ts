import { NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  FALLBACK_PUBLIC_SERVICES,
  type PublicServiceItem,
} from "@/lib/public-services";
import { SERVICE_ICON_OPTIONS } from "@/lib/service-icons";
import { forbidden, ok, serverError, validationError } from "@/lib/api-response";

const iconValues = SERVICE_ICON_OPTIONS.map((icon) => icon.value) as [
  PublicServiceItem["iconKey"],
  ...PublicServiceItem["iconKey"][],
];

const publicServiceSchema = z.object({
  title: z.string().trim().min(3, "Service title must be at least 3 characters").max(100),
  tagline: z.string().trim().min(3, "Add a short tagline").max(120),
  description: z.string().trim().min(10, "Description must be at least 10 characters").max(900),
  features: z.array(z.string().trim().min(1).max(80)).min(1, "Add at least one feature").max(10),
  iconKey: z.enum(iconValues),
  active: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(100),
});

const updateSchema = z.object({
  services: z
    .array(publicServiceSchema)
    .min(1, "Add at least one service")
    .max(30, "Keep the public services page focused"),
});

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return null;
  return session;
}

function serializeService(service: {
  id: string;
  title: string;
  tagline: string;
  description: string;
  features: string[];
  iconKey: string;
  active: boolean;
  sortOrder: number;
}) {
  return {
    id: service.id,
    title: service.title,
    tagline: service.tagline,
    description: service.description,
    features: service.features,
    iconKey: service.iconKey,
    active: service.active,
    sortOrder: service.sortOrder,
  };
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return forbidden();

  try {
    const services = await prisma.publicService.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    return ok({
      services: services.length > 0 ? services.map(serializeService) : FALLBACK_PUBLIC_SERVICES,
      usingFallback: services.length === 0,
    });
  } catch {
    return ok({
      services: FALLBACK_PUBLIC_SERVICES,
      usingFallback: true,
    });
  }
}

export async function PUT(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return forbidden();

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  try {
    const services = parsed.data.services.map((service, sortOrder) => ({
      title: service.title,
      tagline: service.tagline,
      description: service.description,
      features: service.features,
      iconKey: service.iconKey,
      active: service.active,
      sortOrder,
    }));

    await prisma.$transaction([
      prisma.publicService.deleteMany(),
      prisma.publicService.createMany({ data: services }),
    ]);

    const savedServices = await prisma.publicService.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    return ok({ services: savedServices.map(serializeService), usingFallback: false });
  } catch {
    return serverError("Could not save public services. Run the Prisma schema update first, then try again.");
  }
}
