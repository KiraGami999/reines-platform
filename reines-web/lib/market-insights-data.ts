import type { MarketInsightIconKey } from "@/lib/market-insight-icons";

export type MarketInsightMetric = { label: string; value: string };

export type MarketInsightHighlightItem = {
  id: string;
  label: string;
  value: string;
  note: string;
  sortOrder: number;
};

export type MarketInsightCardItem = {
  id: string;
  iconKey: MarketInsightIconKey;
  title: string;
  /** Empty string falls back to "Market Indicator" on the public page. */
  subtitle: string;
  body: string;
  metrics: MarketInsightMetric[];
  sortOrder: number;
};

export type MarketInsightsSettings = {
  visible: boolean;
  heroTag: string;
  heroTitle: string;
  heroDescription: string;
  snapshotTitle: string;
  snapshotDescription: string;
  planningTag: string;
  planningTitle: string;
  planningDescription: string;
  planningNotes: string[];
  ctaLabel: string;
  ctaHref: string;
};

/** DB stores each metric as a single "Label: Value" line, mirroring PublicService.features. */
export function formatMetricLine(metric: MarketInsightMetric): string {
  return `${metric.label.trim()}: ${metric.value.trim()}`;
}

export function parseMetricLine(line: string): MarketInsightMetric | null {
  const separatorIndex = line.indexOf(":");
  if (separatorIndex === -1) {
    const value = line.trim();
    return value ? { label: value, value: "" } : null;
  }
  const label = line.slice(0, separatorIndex).trim();
  const value = line.slice(separatorIndex + 1).trim();
  if (!label && !value) return null;
  return { label, value };
}

export const FALLBACK_MARKET_INSIGHTS_SETTINGS: MarketInsightsSettings = {
  visible: true,
  heroTag: "Market Intelligence",
  heroTitle: "Market insights for confident property decisions.",
  heroDescription:
    "A simple snapshot of the economic and construction indicators that can affect budgets, timelines, material procurement, and project planning in Malawi.",
  snapshotTitle: "Current Market Snapshot",
  snapshotDescription:
    "These figures are provided as planning context. We recommend confirming current rates before finalising project budgets or financing decisions.",
  planningTag: "Client Planning Notes",
  planningTitle: "How these indicators affect your project.",
  planningDescription:
    "Construction costs are influenced by interest rates, inflation, material availability, transport, and labour demand. Reines uses structured quotations and milestone reporting to help clients make decisions with clarity.",
  planningNotes: [
    "Request updated quotations before committing to major procurement decisions.",
    "Use milestone-based payments to keep cash flow aligned with visible progress.",
    "Build a contingency allowance into construction budgets where prices are moving quickly.",
    "Start planning approvals and material sourcing early to reduce schedule risk.",
  ],
  ctaLabel: "Discuss Your Project",
  ctaHref: "/contact",
};

export const FALLBACK_MARKET_INSIGHT_HIGHLIGHTS: MarketInsightHighlightItem[] = [
  { id: "fallback-policy-rate", label: "Policy Rate", value: "26.00%", note: "Reserve Bank benchmark rate", sortOrder: 0 },
  { id: "fallback-reference-rate", label: "Reference Rate", value: "25.30%", note: "Commercial lending benchmark", sortOrder: 1 },
  { id: "fallback-headline-inflation", label: "Headline Inflation", value: "28.20%", note: "General price movement indicator", sortOrder: 2 },
  { id: "fallback-non-food-inflation", label: "Non-Food Inflation", value: "19.50%", note: "Useful for construction cost tracking", sortOrder: 3 },
];

export const FALLBACK_MARKET_INSIGHT_CARDS: MarketInsightCardItem[] = [
  {
    id: "fallback-interest-rates",
    iconKey: "Percent",
    title: "Interest Rates",
    subtitle: "",
    body: "Higher interest rates can affect mortgage affordability, construction financing, and staged payment planning.",
    metrics: [
      { label: "Policy Rate", value: "26.00%" },
      { label: "Reference Rate", value: "25.30%" },
    ],
    sortOrder: 0,
  },
  {
    id: "fallback-inflation-rates",
    iconKey: "LineChart",
    title: "Inflation Rates",
    subtitle: "",
    body: "Inflation influences material prices, labour rates, and how long quotations can remain valid.",
    metrics: [
      { label: "Headline Inflation", value: "28.20%" },
      { label: "Non-Food Inflation", value: "19.50%" },
    ],
    sortOrder: 1,
  },
  {
    id: "fallback-market-demand",
    iconKey: "TrendingUp",
    title: "Market Demand",
    subtitle: "",
    body: "Property demand remains active, with increased interest in secure residential builds and practical commercial spaces.",
    metrics: [
      { label: "Demand movement", value: "+15%" },
      { label: "Compared with", value: "2024" },
    ],
    sortOrder: 2,
  },
  {
    id: "fallback-building-construction-input",
    iconKey: "Building2",
    title: "Building Construction",
    subtitle: "Input Price Index",
    body: "Tracks the cost pressure on common construction inputs such as cement, steel, aggregates, timber, and finishing materials.",
    metrics: [],
    sortOrder: 3,
  },
  {
    id: "fallback-building-construction-trade",
    iconKey: "BarChart3",
    title: "Building Construction",
    subtitle: "Trade Price Index",
    body: "Helps clients understand market-level pricing shifts across contractors, suppliers, and construction trades.",
    metrics: [],
    sortOrder: 4,
  },
  {
    id: "fallback-general-construction-input",
    iconKey: "CircleDollarSign",
    title: "General Construction",
    subtitle: "Input Price Index",
    body: "A broader view of construction cost movement, useful when planning budgets for mixed-use or phased developments.",
    metrics: [],
    sortOrder: 5,
  },
];
