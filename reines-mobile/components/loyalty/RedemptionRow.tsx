import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { CheckCircle, Clock, XCircle } from "lucide-react-native";
import { COLORS } from "@/constants";
import { shortDate } from "@/lib/format";
import type { RewardRedemption } from "@/types";

interface RedemptionRowProps {
  redemption: RewardRedemption;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; Icon: React.ComponentType<any> }> = {
  PENDING:   { label: "Pending",   color: COLORS.yellow, Icon: Clock       },
  FULFILLED: { label: "Fulfilled", color: COLORS.green,  Icon: CheckCircle },
  CANCELLED: { label: "Cancelled", color: COLORS.red,    Icon: XCircle     },
};

export function RedemptionRow({ redemption }: RedemptionRowProps) {
  const cfg  = STATUS_CONFIG[redemption.status] ?? STATUS_CONFIG.PENDING;
  const Icon = cfg.Icon;

  return (
    <View style={styles.row}>
      {/* Status icon */}
      <View style={[styles.iconWrap, { backgroundColor: cfg.color + "18" }]}>
        <Icon size={18} color={cfg.color} />
      </View>

      {/* Middle */}
      <View style={styles.body}>
        <Text style={styles.rewardName} numberOfLines={1}>{redemption.reward.name}</Text>
        <Text style={styles.category}>{redemption.reward.category}</Text>
        {redemption.notes && (
          <Text style={styles.notes} numberOfLines={1}>{redemption.notes}</Text>
        )}
      </View>

      {/* Right: points + date */}
      <View style={styles.right}>
        <Text style={styles.points}>-{redemption.pointsUsed.toLocaleString()} pts</Text>
        <Text style={styles.date}>{shortDate(redemption.createdAt)}</Text>
        <View style={[styles.statusBadge, { backgroundColor: cfg.color + "18" }]}>
          <Text style={[styles.statusLabel, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      </View>
    </View>
  );
}

export function RedemptionRowSkeleton() {
  return (
    <View style={styles.row}>
      <View style={[styles.sk, { width: 38, height: 38, borderRadius: 19 }]} />
      <View style={[styles.body, { gap: 7 }]}>
        <View style={[styles.sk, { width: 130, height: 13 }]} />
        <View style={[styles.sk, { width: 70, height: 10 }]} />
      </View>
      <View style={styles.right}>
        <View style={[styles.sk, { width: 65, height: 13 }]} />
        <View style={[styles.sk, { width: 50, height: 10, marginTop: 4 }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection:   "row",
    alignItems:      "center",
    backgroundColor: COLORS.white,
    borderRadius:    14,
    padding:         14,
    gap:             12,
    shadowColor:     "#000",
    shadowOffset:    { width: 0, height: 1 },
    shadowOpacity:   0.05,
    shadowRadius:    4,
    elevation:       2,
  },
  iconWrap: {
    width:          38,
    height:         38,
    borderRadius:   19,
    alignItems:     "center",
    justifyContent: "center",
    flexShrink:     0,
  },
  body:       { flex: 1, gap: 3 },
  rewardName: { fontSize: 13, fontWeight: "700", color: COLORS.zinc900 },
  category:   { fontSize: 11, color: COLORS.zinc400, textTransform: "capitalize" },
  notes:      { fontSize: 11, color: COLORS.zinc500 },

  right: { alignItems: "flex-end", gap: 4 },
  points: { fontSize: 13, fontWeight: "800", color: COLORS.red },
  date:   { fontSize: 10, color: COLORS.zinc400 },
  statusBadge: {
    borderRadius:      10,
    paddingHorizontal: 6,
    paddingVertical:   2,
  },
  statusLabel: { fontSize: 9, fontWeight: "700" },

  sk: { backgroundColor: COLORS.zinc100, borderRadius: 5 },
});
