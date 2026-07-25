import type { ElementType } from "react";
import {
  Activity,
  BarChart3,
  Building2,
  CircleDollarSign,
  Coins,
  Factory,
  Landmark,
  LineChart,
  PieChart,
  Percent,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";

export const MARKET_INSIGHT_ICON_MAP = {
  Percent,
  LineChart,
  TrendingUp,
  TrendingDown,
  Building2,
  BarChart3,
  CircleDollarSign,
  Activity,
  PieChart,
  Coins,
  Wallet,
  Landmark,
  Factory,
} as const satisfies Record<string, ElementType>;

export type MarketInsightIconKey = keyof typeof MARKET_INSIGHT_ICON_MAP;

export const MARKET_INSIGHT_ICON_OPTIONS: { value: MarketInsightIconKey; label: string }[] = [
  { value: "Percent", label: "Interest Rates" },
  { value: "LineChart", label: "Inflation / Trends" },
  { value: "TrendingUp", label: "Growth / Demand Up" },
  { value: "TrendingDown", label: "Decline / Demand Down" },
  { value: "Building2", label: "Building / Construction" },
  { value: "BarChart3", label: "Price Index" },
  { value: "CircleDollarSign", label: "General Costs" },
  { value: "Activity", label: "Market Activity" },
  { value: "PieChart", label: "Market Share" },
  { value: "Coins", label: "Currency / Cash" },
  { value: "Wallet", label: "Financing" },
  { value: "Landmark", label: "Policy / Regulation" },
  { value: "Factory", label: "Manufacturing" },
];

export function getMarketInsightIcon(iconKey: string): ElementType {
  return MARKET_INSIGHT_ICON_MAP[iconKey as MarketInsightIconKey] ?? Percent;
}
