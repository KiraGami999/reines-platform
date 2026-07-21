import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CircleDollarSign,
  Lightbulb,
  LineChart,
  Percent,
  TrendingUp,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Market Insights — Reines Property Development",
  description:
    "Construction, property, inflation, and market indicators to help clients plan confidently.",
};

const highlights = [
  {
    label: "Policy Rate",
    value: "26.00%",
    note: "Reserve Bank benchmark rate",
  },
  {
    label: "Reference Rate",
    value: "25.30%",
    note: "Commercial lending benchmark",
  },
  {
    label: "Headline Inflation",
    value: "28.20%",
    note: "General price movement indicator",
  },
  {
    label: "Non-Food Inflation",
    value: "19.50%",
    note: "Useful for construction cost tracking",
  },
];

const insightCards = [
  {
    icon: Percent,
    title: "Interest Rates",
    body: "Higher interest rates can affect mortgage affordability, construction financing, and staged payment planning.",
    metrics: [
      { label: "Policy Rate", value: "26.00%" },
      { label: "Reference Rate", value: "25.30%" },
    ],
  },
  {
    icon: LineChart,
    title: "Inflation Rates",
    body: "Inflation influences material prices, labour rates, and how long quotations can remain valid.",
    metrics: [
      { label: "Headline Inflation", value: "28.20%" },
      { label: "Non-Food Inflation", value: "19.50%" },
    ],
  },
  {
    icon: TrendingUp,
    title: "Market Demand",
    body: "Property demand remains active, with increased interest in secure residential builds and practical commercial spaces.",
    metrics: [
      { label: "Demand movement", value: "+15%" },
      { label: "Compared with", value: "2024" },
    ],
  },
  {
    icon: Building2,
    title: "Building Construction",
    subtitle: "Input Price Index",
    body: "Tracks the cost pressure on common construction inputs such as cement, steel, aggregates, timber, and finishing materials.",
  },
  {
    icon: BarChart3,
    title: "Building Construction",
    subtitle: "Trade Price Index",
    body: "Helps clients understand market-level pricing shifts across contractors, suppliers, and construction trades.",
  },
  {
    icon: CircleDollarSign,
    title: "General Construction",
    subtitle: "Input Price Index",
    body: "A broader view of construction cost movement, useful when planning budgets for mixed-use or phased developments.",
  },
];

const planningNotes = [
  "Request updated quotations before committing to major procurement decisions.",
  "Use milestone-based payments to keep cash flow aligned with visible progress.",
  "Build a contingency allowance into construction budgets where prices are moving quickly.",
  "Start planning approvals and material sourcing early to reduce schedule risk.",
];

export default function MarketInsightsPage() {
  return (
    <>
      <section className="bg-[#2d4a6b] py-14 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#8fb9e8]">
            Market Intelligence
          </span>
          <h1 className="mt-3 max-w-3xl text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Market insights for confident property decisions.
          </h1>
          <p className="mt-4 max-w-2xl text-zinc-400">
            A simple snapshot of the economic and construction indicators that can affect budgets,
            timelines, material procurement, and project planning in Malawi.
          </p>
        </div>
      </section>

      <section className="bg-zinc-50 py-12 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#8fb9e8]/10 text-[#8fb9e8]">
              <Lightbulb size={24} strokeWidth={1.8} />
            </div>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-[#2d4a6b] sm:text-3xl lg:text-4xl">
              Current Market Snapshot
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-zinc-500">
              These figures are provided as planning context. We recommend confirming current rates
              before finalising project budgets or financing decisions.
            </p>
          </div>

          <div className="grid gap-4 rounded-3xl bg-[#2d4a6b] p-4 shadow-xl sm:grid-cols-2 lg:grid-cols-4">
            {highlights.map((item) => (
              <div key={item.label} className="rounded-2xl bg-white/95 p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">{item.label}</p>
                <p className="mt-2 text-3xl font-extrabold text-[#2d4a6b]">{item.value}</p>
                <p className="mt-1 text-xs leading-relaxed text-zinc-500">{item.note}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {insightCards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={`${card.title}-${card.subtitle ?? "main"}`} className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                  <div className="flex h-11 w-11 items-center justify-center /10 text-[#8fb9e8]">
                    <Icon size={22} strokeWidth={1.8} />
                  </div>
                  <p className="mt-5 text-xs font-semibold uppercase tracking-widest text-[#8fb9e8]">
                    {card.subtitle ?? "Market Indicator"}
                  </p>
                  <h3 className="mt-1 text-lg font-bold text-[#2d4a6b]">{card.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-500">{card.body}</p>

                  {card.metrics && (
                    <div className="mt-5 space-y-2 rounded-xl bg-zinc-50 p-4">
                      {card.metrics.map((metric) => (
                        <div key={metric.label} className="flex items-center justify-between gap-3 text-sm">
                          <span className="text-zinc-500">{metric.label}</span>
                          <span className="font-bold text-[#2d4a6b]">{metric.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-white py-12 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-[#8fb9e8]">
              Client Planning Notes
            </span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#2d4a6b]">
              How these indicators affect your project.
            </h2>
            <p className="mt-4 text-sm leading-7 text-zinc-500">
              Construction costs are influenced by interest rates, inflation, material availability,
              transport, and labour demand. Reines uses structured quotations and milestone reporting
              to help clients make decisions with clarity.
            </p>
            <Link href="/contact" className="mt-8 [#2d4a6b] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1a2f4a]">
              Discuss Your Project
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
            <h3 className="text-sm font-semibold text-zinc-900">Recommended planning approach</h3>
            <div className="mt-5 space-y-4">
              {planningNotes.map((note, index) => (
                <div key={note} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#2d4a6b] text-xs font-bold text-[#8fb9e8]">
                    {index + 1}
                  </span>
                  <p className="text-sm leading-6 text-zinc-600">{note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
