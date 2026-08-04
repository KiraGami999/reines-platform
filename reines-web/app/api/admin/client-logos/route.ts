import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAdminClientLogos } from "@/lib/client-logos";
import { deleteClientLogoImageFile, isSafeClientLogoUploadUrl } from "@/lib/storage";
import { forbidden, ok, serverError, validationError } from "@/lib/api-response";

const logoSchema = z.object({
  name: z.string().trim().min(2, "Add a client name").max(80),
  lightLogoUrl: z.string().trim().min(1, "Upload a light-mode logo").refine(isSafeClientLogoUploadUrl, "Invalid image URL"),
  darkLogoUrl: z
    .string()
    .trim()
    .refine((v) => v === "" || isSafeClientLogoUploadUrl(v), "Invalid image URL")
    .default(""),
  websiteUrl: z.string().trim().max(200).default(""),
  sortOrder: z.number().int().min(0).max(200),
});

const settingsSchema = z.object({
  visible: z.boolean().default(true),
});

const updateSchema = z.object({
  settings: settingsSchema,
  logos: z.array(logoSchema).max(48).default([]),
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
    const data = await getAdminClientLogos();
    return ok(data);
  } catch {
    return serverError("Could not load client logos.");
  }
}

export async function PUT(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return forbidden();

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const { settings, logos } = parsed.data;

  try {
    const existing = await prisma.clientLogo.findMany({ select: { lightLogoUrl: true, darkLogoUrl: true } });
    const keptUrls = new Set(
      logos.flatMap((l) => [l.lightLogoUrl, l.darkLogoUrl].filter(Boolean) as string[])
    );
    const orphanedUrls = existing
      .flatMap((row) => [row.lightLogoUrl, row.darkLogoUrl].filter(Boolean) as string[])
      .filter((url) => !keptUrls.has(url));

    await prisma.$transaction([
      prisma.clientLogoSetting.upsert({
        where: { id: "global" },
        create: { id: "global", ...settings },
        update: { ...settings },
      }),
      prisma.clientLogo.deleteMany(),
      prisma.clientLogo.createMany({
        data: logos.map((logo, sortOrder) => ({
          name: logo.name,
          lightLogoUrl: logo.lightLogoUrl,
          darkLogoUrl: logo.darkLogoUrl || null,
          websiteUrl: logo.websiteUrl || null,
          sortOrder,
        })),
      }),
    ]);

    // Best-effort cleanup of images removed from the library — never blocks the save.
    await Promise.all(orphanedUrls.map((url) => deleteClientLogoImageFile(url)));

    revalidatePath("/");
    revalidatePath("/dashboard/admin/client-logos");

    const saved = await getAdminClientLogos();
    return ok(saved);
  } catch {
    return serverError("Could not save client logos. Run the Prisma schema update first, then try again.");
  }
}
