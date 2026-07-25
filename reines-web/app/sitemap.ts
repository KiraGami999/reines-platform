import type { MetadataRoute } from "next";
import { SITE_URL, getPublicNavPages } from "@/lib/site";
import { isMarketInsightsVisible } from "@/lib/market-insights";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const includeMarketInsights = await isMarketInsightsVisible();

  return getPublicNavPages({ includeMarketInsights }).map((page) => ({
    url: `${SITE_URL}${page.path}`,
    lastModified: new Date(),
    changeFrequency: page.path === "/" ? "daily" : "weekly",
    priority: page.priority,
  }));
}
