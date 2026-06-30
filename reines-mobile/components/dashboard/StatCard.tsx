import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { COLORS } from "@/constants";

interface StatCardProps {
  label:       string;
  value:       string | number;
  subtitle?:   string;
  accent?:     string;
  icon?:       React.ReactNode;
  style?:      ViewStyle;
}

export function StatCard({ label, value, subtitle, accent = COLORS.primary, icon, style }: StatCardProps) {
  return (
    <View style={[styles.card, style]}>
      <View style={[styles.indicator, { backgroundColor: accent }]} />
      <View style={styles.body}>
        {icon && <View style={styles.iconWrap}>{icon}</View>}
        <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
          {value}
        </Text>
        <Text style={styles.label}>{label}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
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
    borderRadius:    14,
    overflow:        "hidden",
    shadowColor:     "#000",
    shadowOffset:    { width: 0, height: 1 },
    shadowOpacity:   0.06,
    shadowRadius:    4,
    elevation:       2,
    flex:            1,
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
  value: {
    fontSize:   22,
    fontWeight: "800",
    color:      COLORS.zinc900,
    letterSpacing: -0.5,
  },
  label: {
    fontSize:   11,
    color:      COLORS.zinc500,
    marginTop:  3,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  subtitle: {
    fontSize:  11,
    color:     COLORS.zinc400,
    marginTop: 2,
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
