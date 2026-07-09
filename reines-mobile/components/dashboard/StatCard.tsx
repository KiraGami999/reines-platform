import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { COLORS } from "@/constants";
import { FONTS, RADII, SHADOW } from "@/constants/theme";

interface StatCardProps {
  label:       string;
  value:       string | number;
  subtitle?:   string;
  accent?:     string;
  variant?:    "default" | "accent";
  icon?:       React.ReactNode;
  style?:      ViewStyle;
}

export function StatCard({
  label,
  value,
  subtitle,
  accent = COLORS.primary,
  variant = "default",
  icon,
  style,
}: StatCardProps) {
  const isAccent = variant === "accent";

  return (
    <View
      style={[
        styles.card,
        isAccent && styles.cardAccent,
        style,
      ]}
    >
      {!isAccent && <View style={[styles.indicator, { backgroundColor: accent }]} />}
      <View style={styles.body}>
        {icon && (
          <View style={[styles.iconWrap, isAccent && styles.iconWrapAccent]}>
            {icon}
          </View>
        )}
        <Text
          style={[styles.value, isAccent && styles.valueAccent]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
        >
          {value}
        </Text>
        <Text style={[styles.label, isAccent && styles.labelAccent]}>{label}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, isAccent && styles.subtitleAccent]}>{subtitle}</Text>
        ) : null}
      </View>
    </View>
  );
}

export function StatCardSkeleton({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.card, style]}>
      <View style={[styles.indicator, { backgroundColor: COLORS.zinc200 }]} />
      <View style={styles.body}>
        <View style={[styles.skeletonValue, { backgroundColor: COLORS.zinc200 }]} />
        <View style={[styles.skeletonLabel, { backgroundColor: COLORS.zinc100 }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius:    RADII.md,
    overflow:        "hidden",
    borderWidth:     1,
    borderColor:     COLORS.zinc200,
    ...SHADOW.card,
    flex:            1,
  },
  cardAccent: {
    backgroundColor: COLORS.primary,
    borderColor:     "rgba(143, 185, 232, 0.3)",
  },
  indicator: {
    height: 4,
    width:  "100%",
  },
  body: {
    padding: 14,
  },
  iconWrap: {
    marginBottom: 6,
  },
  iconWrapAccent: {
    alignSelf:       "flex-start",
    backgroundColor: COLORS.accentMuted,
    borderRadius:    8,
    padding:         6,
  },
  value: {
    fontSize:      22,
    fontFamily:    FONTS.extrabold,
    color:         COLORS.zinc900,
    letterSpacing: -0.5,
  },
  valueAccent: {
    color: COLORS.white,
  },
  label: {
    fontSize:      11,
    fontFamily:    FONTS.medium,
    color:         COLORS.zinc500,
    marginTop:     3,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  labelAccent: {
    color: COLORS.zinc300,
  },
  subtitle: {
    fontSize:   11,
    fontFamily: FONTS.regular,
    color:      COLORS.zinc400,
    marginTop:  2,
  },
  subtitleAccent: {
    color: COLORS.zinc400,
  },
  skeletonValue: {
    height:       26,
    width:        80,
    borderRadius: 6,
    marginBottom: 8,
  },
  skeletonLabel: {
    height:       10,
    width:        55,
    borderRadius: 4,
  },
});
