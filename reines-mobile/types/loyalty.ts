// ─── Tier ─────────────────────────────────────────────────────────────────────

export type TierName = "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";

export interface Tier {
  name:          TierName;
  label:         string;
  color:         string;
  minSpend:      number;
  nextTierSpend: number | null;
  progressPct:   number; // 0-100 progress toward next tier spend threshold
}

// ─── Earn rate ────────────────────────────────────────────────────────────────

export interface EarnRate {
  pointsPerUnit:  number;
  unitAmount:     number;     // MWK per point cycle
  minSpendToEarn: number;     // lifetime MWK before earning starts
}

// ─── Recent point entry (in summary) ─────────────────────────────────────────

export interface PointEntry {
  id:           string;
  points:       number;       // positive = earned, negative = redeemed/deducted
  reason:       string;
  rewardType:   string;
  createdAt:    string;
  projectTitle: string | null;
}

// ─── Full loyalty summary ─────────────────────────────────────────────────────

export interface LoyaltySummary {
  balance:        number;
  lifetimeSpend:  number;
  tier:           Tier;
  earnRate:       EarnRate;
  recentEntries:  PointEntry[];
}

// ─── Reward catalogue ─────────────────────────────────────────────────────────

export type RewardCategory = "DISCOUNT" | "PRODUCT" | "SERVICE" | "OTHER";

export interface LoyaltyReward {
  id:          string;
  name:        string;
  description: string;
  pointsCost:  number;
  category:    RewardCategory | string;
  active:      boolean;
  sortOrder:   number;
}

// ─── Redemptions ──────────────────────────────────────────────────────────────

export type RedemptionStatus = "PENDING" | "FULFILLED" | "CANCELLED";

export interface RewardRedemption {
  id:         string;
  pointsUsed: number;
  status:     RedemptionStatus | string;
  notes:      string | null;
  createdAt:  string;
  reward:     { id: string; name: string; category: string };
}

// ─── API response shapes ──────────────────────────────────────────────────────

export interface RewardsResponse     { rewards:     LoyaltyReward[]    }
export interface RedemptionsResponse { redemptions: RewardRedemption[] }

export interface RedeemResponse {
  redemptionId: string;
  rewardName:   string;
  pointsUsed:   number;
  newBalance:   number;
  status:       string;
}

// ─── Tier config (client-side constants) ──────────────────────────────────────
// Mirrors the TIERS constant in the backend summary route.

export interface TierConfig {
  name:      TierName;
  label:     string;
  color:     string;
  icon:      string;    // emoji icon
  minSpend:  number;
  nextSpend: number | null;
  perks:     string[];
}

export const TIER_CONFIG: TierConfig[] = [
  {
    name:      "BRONZE",
    label:     "Bronze",
    color:     "#cd7f32",
    icon:      "🥉",
    minSpend:  0,
    nextSpend: 2_000_000,
    perks:     ["Access to reward catalogue", "Earn points after MWK 2M spend"],
  },
  {
    name:      "SILVER",
    label:     "Silver",
    color:     "#9ca3af",
    icon:      "🥈",
    minSpend:  2_000_000,
    nextSpend: 5_000_000,
    perks:     ["Earn points on every payment", "Priority support", "5% project discount"],
  },
  {
    name:      "GOLD",
    label:     "Gold",
    color:     "#ca8a04",
    icon:      "🥇",
    minSpend:  5_000_000,
    nextSpend: 10_000_000,
    perks:     ["Double points on payments", "Dedicated account manager", "10% project discount"],
  },
  {
    name:      "PLATINUM",
    label:     "Platinum",
    color:     "#7c3aed",
    icon:      "💎",
    minSpend:  10_000_000,
    nextSpend: null,
    perks:     ["Triple points", "VIP events", "15% project discount", "Free site visits"],
  },
];
