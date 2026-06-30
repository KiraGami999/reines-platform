import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "@/constants";
import { formatMWK } from "@/lib/format";
import { TIER_CONFIG } from "@/types/loyalty";
import type { LoyaltySummary } from "@/types";

interface LoyaltyHeroCardProps {
  summary: LoyaltySummary;
}

export function LoyaltyHeroCard({ summary }: LoyaltyHeroCardProps) {
  const { balance, tier, lifetimeSpend, earnRate } = summary;
  const tierCfg  = TIER_CONFIG.find((t) => t.name === tier.name) ?? TIER_CONFIG[0];
  const tierColor = tier.color;

  return (
    <View style={[styles.card, { borderTopColor: tierColor }]}>
      {/* Tier badge */}
      <View style={[styles.tierBadge, { backgroundColor: tierColor + "22", borderColor: tierColor + "55" }]}>
        <Text style={styles.tierIcon}>{tierCfg.icon}</Text>
        <Text style={[styles.tierLabel, { color: tierColor }]}>{tier.label} Member</Text>
      </View>

      {/* Points balance */}
      <View style={styles.balanceRow}>
        <Text style={styles.balanceValue}>{balance.toLocaleString()}</Text>
        <Text style={styles.balanceUnit}>pts</Text>
      </View>
      <Text style={styles.balanceSubtitle}>Available reward points</Text>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatMWK(lifetimeSpend)}</Text>
          <Text style={styles.statLabel}>Lifetime Spend</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {earnRate.pointsPerUnit} pt
          </Text>
          <Text style={styles.statLabel}>per {formatMWK(earnRate.unitAmount)}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatMWK(earnRate.minSpendToEarn)}</Text>
          <Text style={styles.statLabel}>To earn points</Text>
        </View>
      </View>

      {/* Perks preview */}
      <View style={[styles.perksBox, { borderColor: tierColor + "30", backgroundColor: tierColor + "08" }]}>
        <Text style={[styles.perksTitle, { color: tierColor }]}>{tierCfg.label} Perks</Text>
        {tierCfg.perks.slice(0, 2).map((perk) => (
          <View key={perk} style={styles.perkRow}>
            <Text style={[styles.perkDot, { color: tierColor }]}>•</Text>
            <Text style={styles.perkText}>{perk}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export function LoyaltyHeroCardSkeleton() {
  return (
    <View style={[styles.card, { borderTopColor: COLORS.zinc200 }]}>
      <View style={[styles.sk, { width: 110, height: 30, borderRadius: 20, alignSelf: "center" }]} />
      <View style={[styles.sk, { width: 160, height: 40, alignSelf: "center", marginVertical: 12 }]} />
      <View style={[styles.sk, { width: 120, height: 14, alignSelf: "center" }]} />
      <View style={styles.divider} />
      <View style={styles.statsRow}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={[styles.statItem, { flex: 1 }]}>
            <View style={[styles.sk, { width: 60, height: 16, marginBottom: 6, alignSelf: "center" }]} />
            <View style={[styles.sk, { width: 50, height: 11, alignSelf: "center" }]} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius:    18,
    padding:         20,
    borderTopWidth:  4,
    shadowColor:     "#000",
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.08,
    shadowRadius:    8,
    elevation:       3,
    gap:             12,
  },
  tierBadge: {
    flexDirection:     "row",
    alignItems:        "center",
    alignSelf:         "center",
    borderRadius:      20,
    borderWidth:       1,
    paddingHorizontal: 14,
    paddingVertical:   6,
    gap:               6,
  },
  tierIcon:  { fontSize: 18 },
  tierLabel: { fontSize: 14, fontWeight: "700" },

  balanceRow: {
    flexDirection:  "row",
    alignItems:     "flex-end",
    justifyContent: "center",
    gap:            4,
    marginTop:      4,
  },
  balanceValue:    { fontSize: 44, fontWeight: "900", color: COLORS.zinc900, letterSpacing: -1 },
  balanceUnit:     { fontSize: 18, fontWeight: "700", color: COLORS.zinc400, marginBottom: 8 },
  balanceSubtitle: { fontSize: 13, color: COLORS.zinc400, textAlign: "center", marginTop: -6 },

  divider:     { height: 1, backgroundColor: COLORS.zinc100, marginVertical: 2 },
  statsRow:    { flexDirection: "row", alignItems: "center" },
  statItem:    { flex: 1, alignItems: "center", gap: 2 },
  statValue:   { fontSize: 13, fontWeight: "700", color: COLORS.zinc900 },
  statLabel:   { fontSize: 10, color: COLORS.zinc400, textAlign: "center" },
  statDivider: { width: 1, height: 28, backgroundColor: COLORS.zinc100 },

  perksBox: {
    borderRadius:  12,
    borderWidth:   1,
    padding:       12,
    gap:           4,
    marginTop:     2,
  },
  perksTitle: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  perkRow:    { flexDirection: "row", gap: 6 },
  perkDot:    { fontSize: 12, lineHeight: 17 },
  perkText:   { fontSize: 12, color: COLORS.zinc600, flex: 1, lineHeight: 17 },

  sk: { backgroundColor: COLORS.zinc100, borderRadius: 6 },
});
