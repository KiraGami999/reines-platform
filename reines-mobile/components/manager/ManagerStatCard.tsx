import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { COLORS } from "@/constants";

interface ManagerStatCardProps {
  value:     string | number;
  label:     string;
  accent?:   string;
  icon?:     React.ReactNode;
  badge?:    string;         // small warning badge (e.g. "2 need attention")
  onPress?:  () => void;
}

export function ManagerStatCard({
  value, label, accent = COLORS.primary, icon, badge, onPress,
}: ManagerStatCardProps) {
  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Wrapper
      style={[styles.card, { borderTopColor: accent }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {icon && (
        <View style={[styles.iconWrap, { backgroundColor: accent + "18" }]}>
          {icon}
        </View>
      )}
      <Text style={[styles.value, { color: accent }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      {badge ? (
        <View style={[styles.badge, { backgroundColor: accent + "18" }]}>
          <Text style={[styles.badgeText, { color: accent }]}>{badge}</Text>
        </View>
      ) : null}
    </Wrapper>
  );
}

export function ManagerStatCardSkeleton() {
  return (
    <View style={[styles.card, { borderTopColor: COLORS.zinc200 }]}>
      <View style={[styles.sk, { width: 36, height: 36, borderRadius: 18, marginBottom: 8 }]} />
      <View style={[styles.sk, { width: 44, height: 22, marginBottom: 6 }]} />
      <View style={[styles.sk, { width: 70, height: 11 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex:            1,
    backgroundColor: COLORS.white,
    borderRadius:    14,
    padding:         14,
    borderTopWidth:  3,
    alignItems:      "center",
    gap:             5,
    shadowColor:     "#000",
    shadowOffset:    { width: 0, height: 1 },
    shadowOpacity:   0.07,
    shadowRadius:    5,
    elevation:       2,
  },
  iconWrap: { borderRadius: 18, padding: 8, marginBottom: 2 },
  value:    { fontSize: 26, fontWeight: "900", letterSpacing: -0.5 },
  label:    { fontSize: 11, fontWeight: "600", color: COLORS.zinc500, textAlign: "center" },
  badge: {
    borderRadius:      8,
    paddingHorizontal: 6,
    paddingVertical:   2,
    marginTop:         2,
  },
  badgeText: { fontSize: 9, fontWeight: "700" },
  sk:        { backgroundColor: COLORS.zinc100, borderRadius: 6 },
});
