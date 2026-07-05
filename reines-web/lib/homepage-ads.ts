import "server-only";

import { prisma } from "@/lib/prisma";
import { resolveStorageUrl } from "@/lib/storage";
import {
  FALLBACK_HOMEPAGE_ADS,
  type HomepageAd,
} from "@/lib/homepage-ads-shared";

export {
  AVAILABLE_HOMEPAGE_IMAGES,
  FALLBACK_HOMEPAGE_ADS,
  MAX_HOMEPAGE_ADS,
  type AvailableHomepageImage,
  type HomepageAd,
} from "@/lib/homepage-ads-shared";

export { getHomepageImageLibrary } from "@/lib/homepage-image-library";

/** Normalize legacy homepage CTA labels to the standard copy. */
function normalizeHomepageCtaLabel(label: string | null | undefined): string {
  const trimmed = (label ?? "").trim();
  if (!trimmed) return "View Projects";
  if (/^view our (projects|products)$/i.test(trimmed)) return "View Projects";
  if (/^view our$/i.test(trimmed)) return "View Projects";
  return trimmed;
}

export async function getHomepageAds(): Promise<HomepageAd[]> {
  try {
    const ads = await prisma.homepageAd.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    if (ads.length === 0) return FALLBACK_HOMEPAGE_ADS;

    return ads.map((ad) => ({
      id: ad.id,
      imageUrl: resolveStorageUrl(ad.imageUrl) ?? ad.imageUrl,
      title: ad.title,
      subtitle: ad.subtitle ?? "",
      ctaLabel: normalizeHomepageCtaLabel(ad.ctaLabel),
      ctaHref: ad.ctaHref ?? "/projects",
      sortOrder: ad.sortOrder,
      active: ad.active,
    }));
  } catch {
    return FALLBACK_HOMEPAGE_ADS;
  }
}
