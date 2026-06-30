import { View, Text, StyleSheet } from "react-native";
import { PROJECT_STATUS_CONFIG, PAYMENT_STATUS_CONFIG, COLORS } from "@/constants";

interface Props {
  status: string;
  type?:  "project" | "payment";
}

export function StatusBadge({ status, type = "project" }: Props) {
  const config = type === "payment"
    ? PAYMENT_STATUS_CONFIG[status]
    : PROJECT_STATUS_CONFIG[status];

  const label = config?.label ?? status;
  const color = config?.color ?? COLORS.zinc400;

  return (
    <View style={[styles.badge, { backgroundColor: color + "20", borderColor: color + "40" }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 100, borderWidth: 1,
  },
  dot:   { width: 6, height: 6, borderRadius: 3 },
  label: { fontSize: 11, fontWeight: "600" },
});
