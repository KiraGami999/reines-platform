import { Navbar } from "@/components/public/Navbar";
import { Footer } from "@/components/public/Footer";
import { ReinesChatbot } from "@/components/public/ReinesChatbot";
import { StructuredData } from "@/components/public/StructuredData";
import { isMarketInsightsVisible } from "@/lib/market-insights";

/**
 * Public marketing layout.
 *
 * Always renders the light marketing look — the homepage and content pages
 * were designed for a light canvas with a dark hero band. Site-wide dark mode
 * (used in the authenticated portal) is not applied here.
 *
 * Forced dynamic so the Market Insights nav link (and any other admin-toggled
 * content here) reflects immediately on every public page — static pages like
 * About/Services/Contact would otherwise keep a stale prerendered layout until
 * an unrelated on-demand revalidation happened to touch them.
 */
export const dynamic = "force-dynamic";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const showMarketInsights = await isMarketInsightsVisible();

  return (
    <div
      data-public
      className="flex min-h-screen flex-col overflow-x-clip bg-white text-zinc-900 [color-scheme:light]"
    >
      <StructuredData includeMarketInsights={showMarketInsights} />
      <Navbar showMarketInsights={showMarketInsights} />
      <main className="flex-1">{children}</main>
      <Footer />
      <ReinesChatbot />
    </div>
  );
}
