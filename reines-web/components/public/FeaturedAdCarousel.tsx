"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import type { HomepageAd } from "@/lib/homepage-ads-shared";

const AUTO_SCROLL_MS = 5500;

type FeaturedAdCarouselProps = {
  ads: HomepageAd[];
  variant?: "panel";
};

export function FeaturedAdCarousel({ ads, variant = "panel" }: FeaturedAdCarouselProps) {
  const visibleAds = useMemo(() => ads.filter((ad) => ad.active), [ads]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (visibleAds.length <= 1) return;

    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % visibleAds.length);
    }, AUTO_SCROLL_MS);

    return () => window.clearInterval(timer);
  }, [visibleAds.length]);

  const safeActiveIndex = visibleAds.length > 0 ? activeIndex % visibleAds.length : 0;
  const activeAd = visibleAds[safeActiveIndex];

  if (variant !== "panel") return null;

  if (!activeAd) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex aspect-square w-full items-center justify-center rounded-3xl bg-[#344055] p-8 text-center text-sm text-zinc-400">
          Advertisement Space
        </div>
        <div className="flex min-h-[44px] items-center rounded-full bg-[#344055] px-5 py-3 sm:px-7">
          <span className="inline-flex shrink-0 rounded-full border border-white/15 px-3 py-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-400">
            Featured Now
          </span>
          <p className="ml-3 truncate text-sm text-zinc-500">Featured ads will appear here once published.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-[#344055]">
        {visibleAds.map((ad, index) => (
          <Image
            key={ad.id}
            src={ad.imageUrl}
            alt={ad.title}
            fill
            unoptimized={ad.imageUrl.startsWith("/api/media")}
            priority={index === 0}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 560px"
            className={`object-cover object-center transition-opacity duration-1000 ease-out ${
              index === safeActiveIndex ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
      </div>

      <div className="flex min-h-[44px] items-center gap-3 rounded-full bg-[#344055] px-5 py-3 sm:gap-4 sm:px-7">
        <span className="inline-flex shrink-0 rounded-full border border-white/15 px-3 py-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-400">
          Featured Now
        </span>

        <Link
          href={activeAd.ctaHref}
          className="min-w-0 flex-1 truncate text-sm font-semibold text-white transition-colors hover:text-[#b8c9dc]"
        >
          {activeAd.ctaLabel}
        </Link>

        {visibleAds.length > 1 && (
          <div className="flex max-w-[6.5rem] shrink-0 items-center gap-1.5 overflow-x-auto sm:max-w-[10rem]">
            {visibleAds.map((_, index) => (
              <button
                key={index}
                type="button"
                aria-label={`Show featured ad ${index + 1}`}
                aria-current={index === safeActiveIndex ? "true" : undefined}
                onClick={() => setActiveIndex(index)}
                className={`h-1.5 rounded-full transition-all ${
                  index === safeActiveIndex ? "w-5 bg-[#8fb9e8]" : "w-1.5 bg-white/35 hover:bg-white/55"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
