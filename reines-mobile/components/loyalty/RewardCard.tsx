import React, { useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert,
} from "react-native";
import { Tag, Gift, Wrench, Package } from "lucide-react-native";
import { COLORS } from "@/constants";
import type { LoyaltyReward } from "@/types";

const CATEGORY_CONFIG: Record<string, { label: string; color: string; Icon: React.ComponentType<any> }> = {
  DISCOUNT: { label: "Discount",   color: "#16a34a", Icon: Tag     },
  PRODUCT:  { label: "Product",    color: "#2563eb", Icon: Package  },
  SERVICE:  { label: "Service",    color: "#7c3aed", Icon: Wrench   },
  OTHER:    { label: "Other",      color: "#ca8a04", Icon: Gift     },
};

interface RewardCardProps {
  reward:         LoyaltyReward;
  balance:        number;
  onRedeem:       (reward: LoyaltyReward) => Promise<void>;
  isRedeeming?:   boolean;
}

export function RewardCard({ reward, balance, onRedeem, isRedeeming }: RewardCardProps) {
  const cfg         = CATEGORY_CONFIG[reward.category] ?? CATEGORY_CONFIG.OTHER;
  const { Icon }    = cfg;
  const canAfford   = balance >= reward.pointsCost;
  const [loading, setLoading] = useState(false);

  async function handleRedeem() {
    if (!canAfford) {
      Alert.alert(
        "Insufficient Points",
        `You need ${(reward.pointsCost - balance).toLocaleString()} more points to redeem this reward.`
      );
      return;
    }
    Alert.alert(
      "Confirm Redemption",
      `Redeem "${reward.name}" for ${reward.pointsCost.toLocaleString()} points?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Redeem",
          style: "default",
          onPress: async () => {
            setLoading(true);
            try {
              await onRedeem(reward);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  }

  return (
    <View style={[styles.card, !canAfford && styles.cardDimmed]}>
      {/* Category icon */}
      <View style={[styles.iconWrap, { backgroundColor: cfg.color + "18" }]}>
        <Icon size={22} color={cfg.color} />
      </View>

      {/* Content */}
      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={[styles.name, !canAfford && styles.dimmedText]} numberOfLines={1}>
            {reward.name}
          </Text>
          <View style={[styles.categoryBadge, { backgroundColor: cfg.color + "15" }]}>
            <Text style={[styles.categoryLabel, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        </View>
        <Text style={[styles.description, !canAfford && styles.dimmedText]} numberOfLines={2}>
          {reward.description}
        </Text>
        <View style={styles.footer}>
          <View style={styles.costRow}>
            <Text style={[styles.costValue, canAfford ? styles.canAffordCost : styles.cantAffordCost]}>
              {reward.pointsCost.toLocaleString()}
            </Text>
            <Text style={styles.costUnit}> pts</Text>
          </View>
          <TouchableOpacity
            style={[
              styles.redeemBtn,
              canAfford ? styles.redeemBtnActive : styles.redeemBtnDisabled,
            ]}
            onPress={handleRedeem}
            disabled={loading || isRedeeming}
            activeOpacity={0.8}
          >
            {loading
              ? <ActivityIndicator size="small" color={COLORS.white} />
              : <Text style={[styles.redeemBtnLabel, !canAfford && styles.redeemBtnLabelDisabled]}>
                  {canAfford ? "Redeem" : `Need ${(reward.pointsCost - balance).toLocaleString()} more`}
                </Text>}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export function RewardCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={[styles.sk, { width: 46, height: 46, borderRadius: 23 }]} />
      <View style={[styles.body, { gap: 8 }]}>
        <View style={[styles.sk, { width: 140, height: 14 }]} />
        <View style={[styles.sk, { width: "90%", height: 11 }]} />
        <View style={[styles.sk, { width: "70%", height: 11 }]} />
        <View style={[styles.sk, { width: 80, height: 32, borderRadius: 16, marginTop: 4 }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection:   "row",
    backgroundColor: COLORS.white,
    borderRadius:    16,
    padding:         16,
    gap:             14,
    shadowColor:     "#000",
    shadowOffset:    { width: 0, height: 1 },
    shadowOpacity:   0.06,
    shadowRadius:    5,
    elevation:       2,
  },
  cardDimmed: { opacity: 0.65 },
  iconWrap: {
    width:          46,
    height:         46,
    borderRadius:   23,
    alignItems:     "center",
    justifyContent: "center",
    flexShrink:     0,
  },
  body:    { flex: 1, gap: 5 },
  topRow:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  name:    { fontSize: 14, fontWeight: "700", color: COLORS.zinc900, flex: 1 },
  dimmedText: { color: COLORS.zinc400 },
  categoryBadge: {
    borderRadius:      10,
    paddingHorizontal: 8,
    paddingVertical:   2,
  },
  categoryLabel: { fontSize: 10, fontWeight: "700" },
  description:   { fontSize: 12, color: COLORS.zinc500, lineHeight: 17 },
  footer:     { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  costRow:    { flexDirection: "row", alignItems: "baseline" },
  costValue:  { fontSize: 17, fontWeight: "900" },
  costUnit:   { fontSize: 12, color: COLORS.zinc400 },
  canAffordCost:  { color: COLORS.primary },
  cantAffordCost: { color: COLORS.zinc400 },
  redeemBtn: {
    borderRadius:      20,
    paddingHorizontal: 14,
    paddingVertical:   7,
    minWidth:          80,
    alignItems:        "center",
  },
  redeemBtnActive:   { backgroundColor: COLORS.primary },
  redeemBtnDisabled: { backgroundColor: COLORS.zinc100, borderWidth: 1, borderColor: COLORS.zinc200 },
  redeemBtnLabel:         { fontSize: 12, fontWeight: "700", color: COLORS.white },
  redeemBtnLabelDisabled: { color: COLORS.zinc500 },
  sk: { backgroundColor: COLORS.zinc100, borderRadius: 6 },
});
