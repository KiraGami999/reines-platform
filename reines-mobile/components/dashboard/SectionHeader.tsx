import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { COLORS } from "@/constants";
import { FONTS } from "@/constants/theme";

interface SectionHeaderProps {
  title:      string;
  actionLabel?: string;
  onAction?:  () => void;
}

export function SectionHeader({ title, actionLabel, onAction }: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {actionLabel && onAction && (
        <TouchableOpacity onPress={onAction} hitSlop={8}>
          <Text style={styles.action}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection:  "row",
    justifyContent: "space-between",
    alignItems:     "center",
    marginBottom:   12,
    marginTop:      4,
  },
  title: {
    fontSize:   15,
    fontFamily: FONTS.semibold,
    color:      COLORS.zinc900,
  },
  action: {
    fontSize:   13,
    fontFamily: FONTS.semibold,
    color:      COLORS.accent,
  },
});
