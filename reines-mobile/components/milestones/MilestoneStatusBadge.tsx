import React from "react";
import { View, Text, StyleSheet } from "react-native";
import type { MilestoneStatus } from "@/types";
import { MILESTONE_STATUS_CONFIG } from "@/types/milestone";

interface Props {
  status: MilestoneStatus;
  size?:  "sm" | "md";
}

export function MilestoneStatusBadge({ status, size = "md" }: Props) {
  const cfg = MILESTONE_STATUS_CONFIG[status];
  const isSmall = size === "sm";
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: cfg.bg },
        isSmall && styles.badgeSm,
      ]}
    >
      <Text
        style={[
          styles.label,
          { color: cfg.color },
          isSmall && styles.labelSm,
        ]}
      >
        {cfg.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical:   3,
    borderRadius:      20,
    alignSelf:         "flex-start",
  },
  badgeSm: {
    paddingHorizontal: 6,
    paddingVertical:   2,
  },
  label: {
    fontSize:   12,
    fontWeight: "600",
  },
  labelSm: {
    fontSize: 10,
  },
});
