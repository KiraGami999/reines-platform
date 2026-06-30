import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AVAILABLE_HOMEPAGE_IMAGES, FALLBACK_HOMEPAGE_ADS } from "@/lib/homepage-ads";
import { getHomepageImageLibrary } from "@/lib/homepage-image-library";
import { forbidden, ok, serverError, validationError } from "@/lib/api-response";
import { isAssignableHomepageAdImageUrl } from "@/lib/storage";

const homepageAdSchema = z.object({
  imageUrl: z.string().refine(isAssignableHomepageAdImageUrl, "Select or upload a valid homepage image"),
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(90),
  subtitle: z.string().trim().max(280).optional().default(""),
  ctaLabel: z.string().trim().max(40).optional().default("View Projects"),
  ctaHref: z.string().trim().startsWith("/", "CTA link must be an internal path").optional().default("/projects"),
  active: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(20),
});

const updateSchema = z.object({
  ads: z.array(homepageAdSchema).min(1, "Select at least one homepage image").max(3, "Select up to three homepage images"),
});

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return null;
  return session;
}

function serializeAd(ad: {
  id: string;
  imageUrl: string;
  title: string;
  subtitle: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  sortOrder: number;
  active: boolean;
}) {
  return {
    id: ad.id,
    imageUrl: ad.imageUrl,
    title: ad.title,
    subtitle: ad.subtitle ?? "",
    ctaLabel: ad.ctaLabel ?? "View Projects",
    ctaHref: ad.ctaHref ?? "/projects",
    sortOrder: ad.sortOrder,
    active: ad.active,
  };
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return forbidden();

  try {
    const ads = await prisma.homepageAd.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    return ok({
      availableImages: await getHomepageImageLibrary(),
      selectedAds: ads.length > 0 ? ads.map(serializeAd) : FALLBACK_HOMEPAGE_ADS,
      usingFallback: ads.length === 0,
    });
  } catch {
    return ok({
      availableImages: AVAILABLE_HOMEPAGE_IMAGES,
      selectedAds: FALLBACK_HOMEPAGE_ADS,
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
    const ads = parsed.data.ads.map((ad, index) => ({
      imageUrl: ad.imageUrl,
      title: ad.title,
      subtitle: ad.subtitle || null,
      ctaLabel: ad.ctaLabel || "View Projects",
      ctaHref: ad.ctaHref || "/projects",
      active: ad.active,
      sortOrder: index,
    }));

    await prisma.$transaction([
      prisma.homepageAd.deleteMany(),
      prisma.homepageAd.createMany({ data: ads }),
    ]);

    const selectedAds = await prisma.homepageAd.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    revalidatePath("/");
    revalidatePath("/dashboard/admin/homepage");

    return ok({ selectedAds: selectedAds.map(serializeAd), usingFallback: false });
  } catch {
    return serverError("Could not save homepage ads. Run the Prisma migration first, then try again.");
  }
}
