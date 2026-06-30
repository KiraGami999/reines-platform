import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, SafeAreaView, FlatList, Alert,
} from "react-native";
import { Trophy, Gift, History, AlertCircle } from "lucide-react-native";
import { COLORS } from "@/constants";
import {
  useLoyaltySummary,
  useRewards,
  useRedemptions,
  useRedeemReward,
} from "@/hooks/useLoyalty";
import { LoyaltyHeroCard, LoyaltyHeroCardSkeleton }   from "@/components/loyalty/LoyaltyHeroCard";
import { TierProgressBar, TierProgressBarSkeleton }   from "@/components/loyalty/TierProgressBar";
import { RewardCard, RewardCardSkeleton }              from "@/components/loyalty/RewardCard";
import { RedemptionRow, RedemptionRowSkeleton }        from "@/components/loyalty/RedemptionRow";
import { PointHistoryRow }                             from "@/components/loyalty/PointHistoryRow";
import type { LoyaltyReward }                          from "@/types";

type Tab = "overview" | "rewards" | "history";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TABS: { key: Tab; label: string; Icon: React.ComponentType<any> }[] = [
  { key: "overview", label: "Overview", Icon: Trophy  },
  { key: "rewards",  label: "Rewards",  Icon: Gift    },
  { key: "history",  label: "History",  Icon: History },
];

export default function ClientLoyaltyScreen() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const summaryQuery    = useLoyaltySummary();
  const rewardsQuery    = useRewards();
  const redemptionsQuery = useRedemptions();
  const redeemMutation  = useRedeemReward();

  const isRefetching =
    summaryQuery.isRefetching ||
    rewardsQuery.isRefetching ||
    redemptionsQuery.isRefetching;

  function onRefresh() {
    summaryQuery.refetch();
    if (activeTab === "rewards")  rewardsQuery.refetch();
    if (activeTab === "history") redemptionsQuery.refetch();
  }

  async function handleRedeem(reward: LoyaltyReward) {
    try {
      const res = await redeemMutation.mutateAsync({ rewardId: reward.id });
      Alert.alert(
        "Reward Redeemed! 🎉",
        `You've redeemed "${res.rewardName}" for ${res.pointsUsed.toLocaleString()} points.\nNew balance: ${res.newBalance.toLocaleString()} pts`,
        [{ text: "OK" }]
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Redemption failed. Please try again.";
      Alert.alert("Error", msg);
    }
  }

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Rewards & Loyalty</Text>
          <Text style={styles.headerSubtitle}>Your points and benefits</Text>
        </View>
        {summaryQuery.data && (
          <View style={[styles.balancePill, { borderColor: summaryQuery.data.tier.color + "60" }]}>
            <Text style={[styles.balancePillValue, { color: summaryQuery.data.tier.color }]}>
              {summaryQuery.data.balance.toLocaleString()}
            </Text>
            <Text style={styles.balancePillUnit}>pts</Text>
          </View>
        )}
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {TABS.map(({ key, label, Icon }) => {
          const active = activeTab === key;
          return (
            <TouchableOpacity
              key={key}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => setActiveTab(key)}
              activeOpacity={0.75}
            >
              <Icon size={15} color={active ? COLORS.primary : COLORS.zinc400} />
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Overview Tab ─────────────────────────────────────────────────── */}
      {activeTab === "overview" && (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        >
          {summaryQuery.isLoading ? (
            <>
              <LoyaltyHeroCardSkeleton />
              <TierProgressBarSkeleton />
            </>
          ) : summaryQuery.isError ? (
            <ErrorBlock onRetry={() => summaryQuery.refetch()} />
          ) : summaryQuery.data ? (
            <>
              <LoyaltyHeroCard    summary={summaryQuery.data} />
              <TierProgressBar    summary={summaryQuery.data} />

              {/* Recent point activity */}
              {summaryQuery.data.recentEntries.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Recent Activity</Text>
                  <View style={styles.historyList}>
                    {summaryQuery.data.recentEntries.map((entry) => (
                      <PointHistoryRow key={entry.id} entry={entry} />
                    ))}
                  </View>
                  <TouchableOpacity
                    style={styles.seeAllBtn}
                    onPress={() => setActiveTab("history")}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.seeAllLabel}>View full history →</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* How points work */}
              <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>How Points Work</Text>
                <InfoRow
                  icon="💰"
                  text={`Earn ${summaryQuery.data.earnRate.pointsPerUnit} point for every MWK ${summaryQuery.data.earnRate.unitAmount.toLocaleString()} paid`}
                />
                <InfoRow
                  icon="🏁"
                  text={`Points unlock once you reach MWK ${summaryQuery.data.earnRate.minSpendToEarn.toLocaleString()} in lifetime spend`}
                />
                <InfoRow
                  icon="🎁"
                  text="Redeem points for discounts, products, and exclusive services"
                />
                <InfoRow
                  icon="⬆️"
                  text="Higher tiers earn more points and unlock extra perks"
                />
              </View>
            </>
          ) : null}
        </ScrollView>
      )}

      {/* ── Rewards Tab ──────────────────────────────────────────────────── */}
      {activeTab === "rewards" && (
        <FlatList
          data={rewardsQuery.isLoading ? Array(3).fill(null) : (rewardsQuery.data ?? [])}
          keyExtractor={(item, idx) => item?.id ?? `sk-${idx}`}
          contentContainerStyle={[
            styles.scroll,
            !rewardsQuery.isLoading && (rewardsQuery.data?.length ?? 0) === 0 && styles.flexGrow,
          ]}
          refreshControl={<RefreshControl refreshing={rewardsQuery.isRefetching} onRefresh={() => rewardsQuery.refetch()} tintColor={COLORS.primary} />}
          ListHeaderComponent={
            summaryQuery.data && (
              <View style={styles.rewardsBalanceBanner}>
                <Text style={styles.rewardsBalanceText}>
                  You have{" "}
                  <Text style={[styles.rewardsBalanceBold, { color: summaryQuery.data.tier.color }]}>
                    {summaryQuery.data.balance.toLocaleString()} pts
                  </Text>
                  {" "}to spend
                </Text>
              </View>
            )
          }
          ListEmptyComponent={
            rewardsQuery.isError ? (
              <ErrorBlock onRetry={() => rewardsQuery.refetch()} />
            ) : !rewardsQuery.isLoading ? (
              <EmptyBlock
                icon="🎁"
                title="No rewards yet"
                subtitle="The admin hasn't added any rewards to the catalogue yet. Check back soon."
              />
            ) : null
          }
          renderItem={({ item }) =>
            !item ? (
              <RewardCardSkeleton />
            ) : (
              <RewardCard
                reward={item}
                balance={summaryQuery.data?.balance ?? 0}
                onRedeem={handleRedeem}
                isRedeeming={redeemMutation.isPending}
              />
            )
          }
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
      )}

      {/* ── History Tab ──────────────────────────────────────────────────── */}
      {activeTab === "history" && (
        <FlatList
          data={redemptionsQuery.isLoading ? Array(4).fill(null) : (redemptionsQuery.data ?? [])}
          keyExtractor={(item, idx) => item?.id ?? `sk-${idx}`}
          contentContainerStyle={[
            styles.scroll,
            !redemptionsQuery.isLoading && (redemptionsQuery.data?.length ?? 0) === 0 && styles.flexGrow,
          ]}
          refreshControl={<RefreshControl refreshing={redemptionsQuery.isRefetching} onRefresh={() => redemptionsQuery.refetch()} tintColor={COLORS.primary} />}
          ListEmptyComponent={
            redemptionsQuery.isError ? (
              <ErrorBlock onRetry={() => redemptionsQuery.refetch()} />
            ) : !redemptionsQuery.isLoading ? (
              <EmptyBlock
                icon="📜"
                title="No redemptions yet"
                subtitle="When you redeem rewards, they will appear here."
              />
            ) : null
          }
          renderItem={({ item }) =>
            !item ? (
              <RedemptionRowSkeleton />
            ) : (
              <RedemptionRow redemption={item} />
            )
          }
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
      )}
    </SafeAreaView>
  );
}

/* ── Sub-components ── */

function InfoRow({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoRowIcon}>{icon}</Text>
      <Text style={styles.infoRowText}>{text}</Text>
    </View>
  );
}

function ErrorBlock({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={styles.centred}>
      <AlertCircle size={32} color={COLORS.red} />
      <Text style={styles.errorText}>Something went wrong.</Text>
      <TouchableOpacity style={styles.retryBtn} onPress={onRetry} activeOpacity={0.8}>
        <Text style={styles.retryLabel}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
}

function EmptyBlock({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <View style={styles.centred}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySubtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.zinc50 },

  header: {
    flexDirection:     "row",
    alignItems:        "center",
    justifyContent:    "space-between",
    paddingHorizontal: 20,
    paddingTop:        16,
    paddingBottom:     12,
    backgroundColor:   COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.zinc100,
  },
  headerTitle:    { fontSize: 22, fontWeight: "800", color: COLORS.zinc900 },
  headerSubtitle: { fontSize: 13, color: COLORS.zinc400, marginTop: 2 },
  balancePill: {
    flexDirection:     "row",
    alignItems:        "baseline",
    borderRadius:      20,
    borderWidth:       2,
    paddingHorizontal: 12,
    paddingVertical:   6,
    gap:               2,
  },
  balancePillValue: { fontSize: 17, fontWeight: "900" },
  balancePillUnit:  { fontSize: 11, color: COLORS.zinc400 },

  tabBar: {
    flexDirection:    "row",
    backgroundColor:  COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.zinc100,
    paddingHorizontal: 12,
  },
  tab: {
    flex:            1,
    flexDirection:   "row",
    alignItems:      "center",
    justifyContent:  "center",
    paddingVertical: 12,
    gap:             5,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: { borderBottomColor: COLORS.primary },
  tabLabel:       { fontSize: 13, fontWeight: "600", color: COLORS.zinc400 },
  tabLabelActive: { color: COLORS.primary },

  scroll:  { padding: 16, gap: 14, paddingBottom: 32 },
  flexGrow:{ flexGrow: 1, justifyContent: "center" },

  section:      { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, gap: 0 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: COLORS.zinc700, marginBottom: 4 },
  historyList:  { marginTop: 4 },
  seeAllBtn:    { marginTop: 12, alignItems: "center" },
  seeAllLabel:  { fontSize: 13, color: COLORS.primary, fontWeight: "600" },

  infoCard:  { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, gap: 10 },
  infoTitle: { fontSize: 14, fontWeight: "700", color: COLORS.zinc700, marginBottom: 2 },
  infoRow:   { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  infoRowIcon:{ fontSize: 16, lineHeight: 20 },
  infoRowText:{ flex: 1, fontSize: 13, color: COLORS.zinc500, lineHeight: 18 },

  rewardsBalanceBanner: {
    backgroundColor:   COLORS.primary + "0d",
    borderRadius:      12,
    paddingHorizontal: 14,
    paddingVertical:   10,
    marginBottom:      4,
    borderLeftWidth:   3,
    borderLeftColor:   COLORS.primary,
  },
  rewardsBalanceText: { fontSize: 13, color: COLORS.zinc700 },
  rewardsBalanceBold: { fontWeight: "800" },

  centred:      { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 40 },
  errorText:    { fontSize: 14, color: COLORS.red, textAlign: "center" },
  retryBtn:     { backgroundColor: COLORS.primary, borderRadius: 20, paddingHorizontal: 20, paddingVertical: 8 },
  retryLabel:   { color: COLORS.white, fontWeight: "700", fontSize: 13 },
  emptyIcon:    { fontSize: 40 },
  emptyTitle:   { fontSize: 16, fontWeight: "700", color: COLORS.zinc700, textAlign: "center" },
  emptySubtitle:{ fontSize: 13, color: COLORS.zinc400, textAlign: "center", lineHeight: 18 },
});
