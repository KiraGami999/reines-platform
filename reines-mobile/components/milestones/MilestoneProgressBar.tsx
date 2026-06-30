import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { CheckCircle2, Clock, Circle, XCircle } from "lucide-react-native";
import { COLORS } from "@/constants";
import type { MilestoneSummary } from "@/types";

interface Props {
  summary: MilestoneSummary;
}

export function MilestoneProgressBar({ summary }: Props) {
  const { total, completed, inProgress, progressPct } = summary;
  const pending = total - completed - inProgress - 0; // "CANCELLED" not counted in visible pending

  const animWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animWidth, {
      toValue:         progressPct,
      duration:        600,
      useNativeDriver: false,
    }).start();
  }, [progressPct, animWidth]);

  const widthInterp = animWidth.interpolate({
    inputRange:  [0, 100],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Project Progress</Text>
        <Text style={styles.pct}>{progressPct}%</Text>
      </View>

      {/* Track */}
      <View style={styles.track}>
        <Animated.View
          style={[
            styles.fill,
            {
              width: widthInterp,
              backgroundColor:
                progressPct === 100 ? COLORS.green :
                progressPct  > 0   ? COLORS.primary :
                COLORS.zinc200,
            },
          ]}
        />
      </View>

      {/* Stats row */}
      <View style={styles.stats}>
        <StatChip
          Icon={CheckCircle2}
          color={COLORS.green}
          label={`${completed} Done`}
        />
        <StatChip
          Icon={Clock}
          color={COLORS.primary}
          label={`${inProgress} Active`}
        />
        <StatChip
          Icon={Circle}
          color={COLORS.zinc400}
          label={`${pending} Pending`}
        />
        <Text style={styles.total}>{total} total</Text>
      </View>
    </View>
  );
}

function StatChip({
  Icon,
  color,
  label,
}: {
  Icon: React.ComponentType<any>;
  color: string;
  label: string;
}) {
  return (
    <View style={styles.chip}>
      <Icon size={12} color={color} />
      <Text style={[styles.chipText, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius:    12,
    padding:         16,
    marginBottom:    12,
    shadowColor:     "#000",
    shadowOffset:    { width: 0, height: 1 },
    shadowOpacity:   0.05,
    shadowRadius:    4,
    elevation:       2,
  },
  header: {
    flexDirection:  "row",
    justifyContent: "space-between",
    alignItems:     "center",
    marginBottom:   10,
  },
  title: { fontSize: 13, fontWeight: "600", color: COLORS.zinc700 },
  pct:   { fontSize: 18, fontWeight: "700", color: COLORS.primary },

  track: {
    height:          8,
    backgroundColor: COLORS.zinc100,
    borderRadius:    8,
    overflow:        "hidden",
    marginBottom:    12,
  },
  fill: { height: "100%", borderRadius: 8 },

  stats: { flexDirection: "row", alignItems: "center", gap: 12 },
  chip:  { flexDirection: "row", alignItems: "center", gap: 4 },
  chipText: { fontSize: 11, fontWeight: "600" },
  total: { marginLeft: "auto", fontSize: 11, color: COLORS.zinc400 },
});
