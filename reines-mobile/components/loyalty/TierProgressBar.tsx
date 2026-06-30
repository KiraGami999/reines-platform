import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "@/constants";
import { formatMWK } from "@/lib/format";
import { TIER_CONFIG } from "@/types/loyalty";
import type { LoyaltySummary } from "@/types";

interface TierProgressBarProps {
  summary: LoyaltySummary;
}

/**
 * Horizontal multi-tier progress indicator.
 * Shows the client's current position across all 4 spend tiers.
 */
export function TierProgressBar({ summary }: TierProgressBarProps) {
  const { tier, lifetimeSpend } = summary;
  const currentTierCfg          = TIER_CONFIG.find((t) => t.name === tier.name) ?? TIER_CONFIG[0];
  const isMaxTier               = tier.nextTierSpend === null;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Tier Progress</Text>

      {/* Segment bar */}
      <View style={styles.barRow}>
        {TIER_CONFIG.map((t, idx) => {
          const isCurrent = t.name === tier.name;
          const isPast    = TIER_CONFIG.indexOf(t) < TIER_CONFIG.indexOf(currentTierCfg);
          const isLast    = idx === TIER_CONFIG.length - 1;

          return (
            <React.Fragment key={t.name}>
              <View style={[
                styles.segment,
                { backgroundColor: isPast || isCurrent ? t.color : COLORS.zinc100 },
                isCurrent && styles.segmentActive,
              ]}>
                <Text style={[styles.segmentLabel, { color: isPast || isCurrent ? "#fff" : COLORS.zinc400 }]}>
                  {t.icon}
                </Text>
                <Text style={[styles.segmentName, { color: isPast || isCurrent ? "#fff" : COLORS.zinc400 }]}>
                  {t.label}
                </Text>
              </View>
              {!isLast && (
                <View style={[
                  styles.connector,
                  { backgroundColor: isPast ? t.color : COLORS.zinc100 },
                ]} />
              )}
            </React.Fragment>
          );
        })}
      </View>

      {/* Progress within current tier */}
      {!isMaxTier && (
        <View style={styles.progressSection}>
          <View style={styles.progressLabelRow}>
            <Text style={styles.progressLabel}>
              Progress to {TIER_CONFIG.find((t) => t.minSpend === tier.nextTierSpend)?.label ?? "next tier"}
            </Text>
            <Text style={[styles.progressPct, { color: tier.color }]}>{tier.progressPct}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[
              styles.progressFill,
              { width: `${tier.progressPct}%` as `${number}%`, backgroundColor: tier.color },
            ]} />
          </View>
          <View style={styles.progressAnnotation}>
            <Text style={styles.progressAnnotationText}>{formatMWK(lifetimeSpend)}</Text>
            <Text style={styles.progressAnnotationText}>{formatMWK(tier.nextTierSpend!)}</Text>
          </View>
          <Text style={styles.remainHint}>
            {formatMWK(tier.nextTierSpend! - lifetimeSpend)} more to reach {TIER_CONFIG.find((t) => t.minSpend === tier.nextTierSpend)?.label ?? "next tier"}
          </Text>
        </View>
      )}

      {isMaxTier && (
        <View style={[styles.maxBadge, { backgroundColor: tier.color + "15" }]}>
          <Text style={styles.maxBadgeIcon}>{currentTierCfg.icon}</Text>
          <Text style={[styles.maxBadgeText, { color: tier.color }]}>
            You've reached the highest tier — {tier.label}!
          </Text>
        </View>
      )}
    </View>
  );
}

export function TierProgressBarSkeleton() {
  return (
    <View style={styles.card}>
      <View style={[styles.sk, { width: 110, height: 14, marginBottom: 14 }]} />
      <View style={styles.barRow}>
        {[0, 1, 2, 3].map((i) => (
          <React.Fragment key={i}>
            <View style={[styles.segment, { backgroundColor: COLORS.zinc100 }]} />
            {i < 3 && <View style={[styles.connector, { backgroundColor: COLORS.zinc100 }]} />}
          </React.Fragment>
        ))}
      </View>
      <View style={[styles.sk, { height: 8, borderRadius: 4, marginTop: 16 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius:    16,
    padding:         18,
    shadowColor:     "#000",
    shadowOffset:    { width: 0, height: 1 },
    shadowOpacity:   0.06,
    shadowRadius:    6,
    elevation:       2,
    gap:             14,
  },
  title: { fontSize: 14, fontWeight: "700", color: COLORS.zinc700 },

  barRow:      { flexDirection: "row", alignItems: "center" },
  segment: {
    flex:           1,
    alignItems:     "center",
    justifyContent: "center",
    borderRadius:   10,
    paddingVertical: 8,
    gap:            2,
  },
  segmentActive: {
    shadowOffset:  { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius:  4,
    elevation:     3,
  },
  segmentLabel: { fontSize: 14 },
  segmentName:  { fontSize: 9,  fontWeight: "700" },
  connector:    { width: 6, height: 3, borderRadius: 2 },

  progressSection:     { gap: 6 },
  progressLabelRow:    { flexDirection: "row", justifyContent: "space-between" },
  progressLabel:       { fontSize: 12, color: COLORS.zinc500 },
  progressPct:         { fontSize: 12, fontWeight: "700" },
  progressTrack: {
    height:       8,
    borderRadius: 4,
    backgroundColor: COLORS.zinc100,
    overflow:     "hidden",
  },
  progressFill: { height: "100%", borderRadius: 4 },
  progressAnnotation: {
    flexDirection:  "row",
    justifyContent: "space-between",
    marginTop:      2,
  },
  progressAnnotationText: { fontSize: 10, color: COLORS.zinc400 },
  remainHint:             { fontSize: 11, color: COLORS.zinc500, textAlign: "center" },

  maxBadge: {
    flexDirection:  "row",
    alignItems:     "center",
    justifyContent: "center",
    borderRadius:   12,
    padding:        12,
    gap:            8,
  },
  maxBadgeIcon: { fontSize: 22 },
  maxBadgeText: { fontSize: 13, fontWeight: "700" },

  sk: { backgroundColor: COLORS.zinc100, borderRadius: 6, alignSelf: "stretch" },
});
