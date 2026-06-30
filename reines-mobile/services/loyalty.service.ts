import api from "@/lib/api";
import type {
  LoyaltySummary,
  LoyaltyReward,
  RewardRedemption,
  RewardsResponse,
  RedemptionsResponse,
  RedeemResponse,
} from "@/types";

/** Fetches the authenticated client's full loyalty snapshot. */
export async function fetchLoyaltySummary(): Promise<LoyaltySummary> {
  const { data } = await api.get<LoyaltySummary>("/api/mobile/loyalty/summary");
  return data;
}

/** Fetches active rewards available for redemption. */
export async function fetchRewards(): Promise<LoyaltyReward[]> {
  const { data } = await api.get<RewardsResponse>("/api/mobile/loyalty/rewards");
  return data.rewards;
}

/** Fetches the client's full redemption history. */
export async function fetchRedemptions(): Promise<RewardRedemption[]> {
  const { data } = await api.get<RedemptionsResponse>("/api/mobile/loyalty/redemptions");
  return data.redemptions;
}

/** Redeems a reward using points. Returns the updated balance. */
export async function redeemReward(rewardId: string, notes?: string): Promise<RedeemResponse> {
  const { data } = await api.post<RedeemResponse>("/api/mobile/loyalty/redeem", { rewardId, notes });
  return data;
}
