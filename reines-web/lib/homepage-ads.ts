import { prisma } from "@/lib/prisma";
import { resolveStorageUrl } from "@/lib/storage";

/** Maximum homepage carousel ads an admin can publish at once. */
export const MAX_HOMEPAGE_ADS = 10;

export type HomepageAd = {
  id: string;
  imageUrl: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  sortOrder: number;
  active: boolean;
};

export type AvailableHomepageImage = {
  imageUrl: string;
  alt: string;
  defaultTitle: string;
  defaultSubtitle: string;
};

export const AVAILABLE_HOMEPAGE_IMAGES: AvailableHomepageImage[] = [
  {
    imageUrl: "/homepage-ads/procrete-chileka-front.png",
    alt: "Completed Reines ProCrete Chileka project exterior",
    defaultTitle: "Reines ProCrete Chileka",
    defaultSubtitle:
      "A completed project showcasing our concrete product capability, careful site finishing, and commitment to strong foundations.",
  },
  {
    imageUrl: "/homepage-ads/procrete-chileka-yard.png",
    alt: "Completed Reines ProCrete Chileka yard",
    defaultTitle: "Project Complete: ProCrete Chileka",
    defaultSubtitle:
      "Purpose-built spaces, clean site work, and practical infrastructure delivered for the concrete products division.",
  },
  {
    imageUrl: "/homepage-ads/procrete-chileka-showcase.png",
    alt: "Reines ProCrete Chileka completed project showcase",
    defaultTitle: "Concrete Products Division",
    defaultSubtitle:
      "Reines ProCrete supports durable construction with concrete blocks, pavers, kerbs, and related products.",
  },
];

export const FALLBACK_HOMEPAGE_ADS: HomepageAd[] = AVAILABLE_HOMEPAGE_IMAGES.map((image, index) => ({
  id: `fallback-${index}`,
  imageUrl: image.imageUrl,
  title: image.defaultTitle,
  subtitle: image.defaultSubtitle,
  ctaLabel: "View Projects",
  ctaHref: "/projects",
  sortOrder: index,
  active: true,
}));

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
