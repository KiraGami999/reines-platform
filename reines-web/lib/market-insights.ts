import { prisma } from "@/lib/prisma";
import {
  FALLBACK_MARKET_INSIGHTS_SETTINGS,
  FALLBACK_MARKET_INSIGHT_HIGHLIGHTS,
  FALLBACK_MARKET_INSIGHT_CARDS,
  formatMetricLine,
  parseMetricLine,
  type MarketInsightCardItem,
  type MarketInsightHighlightItem,
  type MarketInsightMetric,
  type MarketInsightsSettings,
} from "@/lib/market-insights-data";
import type { MarketInsightIconKey } from "@/lib/market-insight-icons";

export {
  FALLBACK_MARKET_INSIGHTS_SETTINGS,
  FALLBACK_MARKET_INSIGHT_HIGHLIGHTS,
  FALLBACK_MARKET_INSIGHT_CARDS,
  formatMetricLine,
  parseMetricLine,
  type MarketInsightCardItem,
  type MarketInsightHighlightItem,
  type MarketInsightMetric,
  type MarketInsightsSettings,
} from "@/lib/market-insights-data";

const SETTINGS_ID = "global";

function serializeHighlight(row: {
  id: string;
  label: string;
  value: string;
  note: string;
  sortOrder: number;
}): MarketInsightHighlightItem {
  return {
    id: row.id,
    label: row.label,
    value: row.value,
    note: row.note,
    sortOrder: row.sortOrder,
  };
}

function serializeCard(row: {
  id: string;
  iconKey: string;
  title: string;
  subtitle: string | null;
  body: string;
  metrics: string[];
  sortOrder: number;
}): MarketInsightCardItem {
  return {
    id: row.id,
    iconKey: row.iconKey as MarketInsightIconKey,
    title: row.title,
    subtitle: row.subtitle ?? "",
    body: row.body,
    metrics: row.metrics.map(parseMetricLine).filter((m): m is MarketInsightMetric => m !== null),
    sortOrder: row.sortOrder,
  };
}

function serializeSettings(row: {
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
}): MarketInsightsSettings {
  return {
    visible: row.visible,
    heroTag: row.heroTag,
    heroTitle: row.heroTitle,
    heroDescription: row.heroDescription,
    snapshotTitle: row.snapshotTitle,
    snapshotDescription: row.snapshotDescription,
    planningTag: row.planningTag,
    planningTitle: row.planningTitle,
    planningDescription: row.planningDescription,
    planningNotes: row.planningNotes,
    ctaLabel: row.ctaLabel,
    ctaHref: row.ctaHref,
  };
}

export type MarketInsightsPageData = {
  settings: MarketInsightsSettings;
  highlights: MarketInsightHighlightItem[];
  cards: MarketInsightCardItem[];
};

/** Public read — used by the /market-insights page and the Navbar link visibility check. */
export async function getMarketInsightsPageData(): Promise<MarketInsightsPageData> {
  try {
    const [settingsRow, highlightRows, cardRows] = await Promise.all([
      prisma.marketInsightsSetting.findUnique({ where: { id: SETTINGS_ID } }),
      prisma.marketInsightHighlight.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
      prisma.marketInsightCard.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
    ]);

    return {
      settings: settingsRow ? serializeSettings(settingsRow) : FALLBACK_MARKET_INSIGHTS_SETTINGS,
      highlights: highlightRows.length > 0 ? highlightRows.map(serializeHighlight) : FALLBACK_MARKET_INSIGHT_HIGHLIGHTS,
      cards: cardRows.length > 0 ? cardRows.map(serializeCard) : FALLBACK_MARKET_INSIGHT_CARDS,
    };
  } catch {
    return {
      settings: FALLBACK_MARKET_INSIGHTS_SETTINGS,
      highlights: FALLBACK_MARKET_INSIGHT_HIGHLIGHTS,
      cards: FALLBACK_MARKET_INSIGHT_CARDS,
    };
  }
}

/** Lightweight visibility check for the public Navbar — avoids fetching highlights/cards on every page. */
export async function isMarketInsightsVisible(): Promise<boolean> {
  try {
    const settingsRow = await prisma.marketInsightsSetting.findUnique({ where: { id: SETTINGS_ID } });
    return settingsRow ? settingsRow.visible : FALLBACK_MARKET_INSIGHTS_SETTINGS.visible;
  } catch {
    return FALLBACK_MARKET_INSIGHTS_SETTINGS.visible;
  }
}

export type AdminMarketInsightsData = MarketInsightsPageData & { usingFallback: boolean };

/** Admin read — always resolves, and reports whether it's showing seeded fallback content. */
export async function getAdminMarketInsights(): Promise<AdminMarketInsightsData> {
  try {
    const [settingsRow, highlightRows, cardRows] = await Promise.all([
      prisma.marketInsightsSetting.findUnique({ where: { id: SETTINGS_ID } }),
      prisma.marketInsightHighlight.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
      prisma.marketInsightCard.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
    ]);

    return {
      settings: settingsRow ? serializeSettings(settingsRow) : FALLBACK_MARKET_INSIGHTS_SETTINGS,
      highlights: highlightRows.length > 0 ? highlightRows.map(serializeHighlight) : FALLBACK_MARKET_INSIGHT_HIGHLIGHTS,
      cards: cardRows.length > 0 ? cardRows.map(serializeCard) : FALLBACK_MARKET_INSIGHT_CARDS,
      usingFallback: !settingsRow && highlightRows.length === 0 && cardRows.length === 0,
    };
  } catch {
    return {
      settings: FALLBACK_MARKET_INSIGHTS_SETTINGS,
      highlights: FALLBACK_MARKET_INSIGHT_HIGHLIGHTS,
      cards: FALLBACK_MARKET_INSIGHT_CARDS,
      usingFallback: true,
    };
  }
}
