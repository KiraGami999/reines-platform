import React from "react";
import { ScrollView, Text, StyleSheet, TouchableOpacity, View } from "react-native";
import { COLORS, PROJECT_STATUS_CONFIG } from "@/constants";
import type { ProjectStatus } from "@/types";

type FilterOption = "ALL" | ProjectStatus;

interface StatusFilterProps {
  selected:  FilterOption;
  onChange:  (value: FilterOption) => void;
  counts:    Partial<Record<FilterOption, number>>;
}

const TABS: { value: FilterOption; label: string }[] = [
  { value: "ALL",         label: "All" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "PLANNING",    label: "Planning" },
  { value: "ON_HOLD",     label: "On Hold" },
  { value: "COMPLETED",   label: "Completed" },
  { value: "CANCELLED",   label: "Cancelled" },
];

export function StatusFilter({ selected, onChange, counts }: StatusFilterProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.row}
    >
      {TABS.map((tab) => {
        const isActive  = tab.value === selected;
        const tabColor  = tab.value === "ALL"
          ? COLORS.primary
          : (PROJECT_STATUS_CONFIG[tab.value]?.color ?? COLORS.primary);
        const count     = counts[tab.value];

        return (
          <TouchableOpacity
            key={tab.value}
            style={[
              styles.chip,
              isActive && { backgroundColor: tabColor, borderColor: tabColor },
              !isActive && { borderColor: COLORS.zinc200 },
            ]}
            onPress={() => onChange(tab.value)}
            activeOpacity={0.75}
          >
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {tab.label}
            </Text>
            {count !== undefined && count > 0 && (
              <View style={[styles.badge, isActive ? styles.badgeActive : styles.badgeInactive]}>
                <Text style={[styles.badgeText, isActive && styles.badgeTextActive]}>
                  {count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
  },
  row: {
    flexDirection: "row",
    gap:           8,
    paddingHorizontal: 20,
    paddingVertical:   12,
  },
  chip: {
    flexDirection:     "row",
    alignItems:        "center",
    borderRadius:      20,
    borderWidth:       1.5,
    paddingHorizontal: 12,
    paddingVertical:   6,
    gap:               5,
    backgroundColor:   COLORS.white,
  },
  label: {
    fontSize:   13,
    fontWeight: "600",
    color:      COLORS.zinc500,
  },
  labelActive: {
    color: COLORS.white,
  },
  badge: {
    borderRadius:      10,
    paddingHorizontal: 5,
    paddingVertical:   1,
    minWidth:          18,
    alignItems:        "center",
  },
  badgeActive: {
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  badgeInactive: {
    backgroundColor: COLORS.zinc100,
  },
  badgeText: {
    fontSize:   10,
    fontWeight: "700",
    color:      COLORS.zinc500,
  },
  badgeTextActive: {
    color: COLORS.white,
  },
});
