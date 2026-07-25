import { Globe2, LineChart } from "lucide-react";
import MarketInsightsForm from "@/components/admin/MarketInsightsForm";
import { getAdminMarketInsights } from "@/lib/market-insights";

export const metadata = { title: "Market Insights - Reines Admin" };

export default async function AdminMarketInsightsPage() {
  const { settings, highlights, cards, usingFallback } = await getAdminMarketInsights();

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex items-start justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-100">
            <LineChart className="h-5 w-5 text-zinc-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#2d4a6b]">Market Insights</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Update the rates, indices, and copy shown on the public Market Insights page, or hide the whole page
              while figures are out of date.
            </p>
          </div>
        </div>

        <div className="hidden rounded-xl border border-zinc-200 bg-white px-4 py-3 text-xs text-zinc-500 md:flex md:items-center md:gap-2">
          <Globe2 size={15} className="text-zinc-500" />
          Public website content
        </div>
      </div>

      <MarketInsightsForm
        initialSettings={settings}
        initialHighlights={highlights}
        initialCards={cards}
        usingFallback={usingFallback}
      />
    </div>
  );
}
