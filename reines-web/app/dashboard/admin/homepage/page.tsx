import { ImageIcon, MonitorSmartphone } from "lucide-react";
import HomepageAdsForm from "@/components/admin/HomepageAdsForm";
import { prisma } from "@/lib/prisma";
import {
  FALLBACK_HOMEPAGE_ADS,
  getHomepageImageLibrary,
  MAX_HOMEPAGE_ADS,
  type HomepageAd,
} from "@/lib/homepage-ads";

export const metadata = { title: "Homepage Ads - Reines Admin" };
export const dynamic = "force-dynamic";

async function getHomepageAdData(): Promise<{ ads: HomepageAd[]; usingFallback: boolean }> {
  try {
    const ads = await prisma.homepageAd.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    if (ads.length === 0) return { ads: FALLBACK_HOMEPAGE_ADS, usingFallback: true };

    return {
      ads: ads.map((ad) => ({
        id: ad.id,
        imageUrl: ad.imageUrl,
        title: ad.title,
        subtitle: ad.subtitle ?? "",
        ctaLabel: ad.ctaLabel ?? "View Projects",
        ctaHref: ad.ctaHref ?? "/projects",
        sortOrder: ad.sortOrder,
        active: ad.active,
      })),
      usingFallback: false,
    };
  } catch {
    return { ads: FALLBACK_HOMEPAGE_ADS, usingFallback: true };
  }
}

export default async function HomepageAdsPage() {
  const [{ ads, usingFallback }, libraryImages] = await Promise.all([
    getHomepageAdData(),
    getHomepageImageLibrary(),
  ]);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 flex items-start justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#2d4a6b]">
            <ImageIcon className="h-5 w-5 text-[#8fb9e8]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#2d4a6b]">Homepage Ads</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Choose which promotional images and copy appear on the public homepage (up to {MAX_HOMEPAGE_ADS} ads).
            </p>
          </div>
        </div>

        <div className="hidden rounded-xl border border-zinc-200 bg-white px-4 py-3 text-xs text-zinc-500 md:flex md:items-center md:gap-2">
          <MonitorSmartphone size={15} className="text-[#8fb9e8]" />
          Public homepage content
        </div>
      </div>

      <HomepageAdsForm
        initialLibraryImages={libraryImages}
        initialAds={ads}
        usingFallback={usingFallback}
      />
    </div>
  );
}
