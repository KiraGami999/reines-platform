import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { TrendingUp, TrendingDown, Star, Award } from "lucide-react-native";
import { COLORS } from "@/constants";
import { timeAgo } from "@/lib/format";
import type { PointEntry } from "@/types";

interface PointHistoryRowProps {
  entry: PointEntry;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TYPE_CONFIG: Record<string, { label: string; color: string; Icon: React.ComponentType<any> }> = {
  PAYMENT:    { label: "Payment",    color: COLORS.green,   Icon: TrendingUp   },
  REDEMPTION: { label: "Redemption", color: COLORS.red,     Icon: TrendingDown },
  PROJECT:    { label: "Project",    color: COLORS.primary, Icon: Award        },
  PROMO:      { label: "Promo",      color: "#7c3aed",      Icon: Star         },
};

export function PointHistoryRow({ entry }: PointHistoryRowProps) {
  const isPositive = entry.points > 0;
  const cfg        = TYPE_CONFIG[entry.rewardType] ?? TYPE_CONFIG.PROJECT;
  const Icon       = cfg.Icon;

  return (
    <View style={styles.row}>
      <View style={[styles.iconWrap, { backgroundColor: cfg.color + "15" }]}>
        <Icon size={16} color={cfg.color} />
      </View>
      <View style={styles.body}>
        <Text style={styles.reason} numberOfLines={2}>{entry.reason}</Text>
        {entry.projectTitle && (
          <Text style={styles.project} numberOfLines={1}>{entry.projectTitle}</Text>
        )}
        <Text style={styles.time}>{timeAgo(entry.createdAt)}</Text>
      </View>
      <Text style={[styles.points, isPositive ? styles.positive : styles.negative]}>
        {isPositive ? "+" : ""}{entry.points.toLocaleString()} pts
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems:    "center",
    gap:           12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.zinc100,
  },
  iconWrap: {
    width:          34,
    height:         34,
    borderRadius:   17,
    alignItems:     "center",
    justifyContent: "center",
    flexShrink:     0,
  },
  body:    { flex: 1, gap: 2 },
  reason:  { fontSize: 12, fontWeight: "600", color: COLORS.zinc800, lineHeight: 16 },
  project: { fontSize: 11, color: COLORS.zinc400 },
  time:    { fontSize: 10, color: COLORS.zinc400 },
  points:  { fontSize: 13, fontWeight: "800", flexShrink: 0 },
  positive: { color: COLORS.green },
  negative: { color: COLORS.red   },
});
