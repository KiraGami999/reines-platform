import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchLoyaltySummary,
  fetchRewards,
  fetchRedemptions,
  redeemReward,
} from "@/services/loyalty.service";
import type { LoyaltySummary, LoyaltyReward, RewardRedemption, RedeemResponse } from "@/types";

export const LOYALTY_KEYS = {
  summary:     ["loyalty", "summary"]     as const,
  rewards:     ["loyalty", "rewards"]     as const,
  redemptions: ["loyalty", "redemptions"] as const,
};

/** Fetches the full loyalty snapshot (balance, tier, earn rate, recent entries). */
export function useLoyaltySummary() {
  return useQuery<LoyaltySummary>({
    queryKey:  LOYALTY_KEYS.summary,
    queryFn:   fetchLoyaltySummary,
    staleTime: 60_000,
  });
}

/** Fetches active rewards available to redeem. */
export function useRewards() {
  return useQuery<LoyaltyReward[]>({
    queryKey:  LOYALTY_KEYS.rewards,
    queryFn:   fetchRewards,
    staleTime: 120_000,
  });
}

/** Fetches the client's redemption history. */
export function useRedemptions() {
  return useQuery<RewardRedemption[]>({
    queryKey:  LOYALTY_KEYS.redemptions,
    queryFn:   fetchRedemptions,
    staleTime: 60_000,
  });
}

/**
 * Mutation to redeem a reward.
 * Invalidates summary + redemptions on success so UI reflects the new balance.
 */
export function useRedeemReward() {
  const qc = useQueryClient();

  return useMutation<RedeemResponse, Error, { rewardId: string; notes?: string }>({
    mutationFn: ({ rewardId, notes }) => redeemReward(rewardId, notes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LOYALTY_KEYS.summary });
      qc.invalidateQueries({ queryKey: LOYALTY_KEYS.redemptions });
    },
  });
}
