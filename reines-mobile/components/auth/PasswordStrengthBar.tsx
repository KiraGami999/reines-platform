import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "@/constants";
import { FONTS } from "@/constants/theme";

interface Props {
  password: string;
}

export function PasswordStrengthBar({ password }: Props) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const label = ["", "Weak", "Fair", "Strong"][score] ?? "";
  const barColor = score === 3 ? COLORS.blue : COLORS.blueLight;

  if (!password) return null;

  return (
    <View style={styles.root}>
      <View style={styles.bars}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={[
              styles.bar,
              i < score ? { backgroundColor: barColor } : styles.barEmpty,
            ]}
          />
        ))}
      </View>
      <View style={styles.meta}>
        <View style={styles.checks}>
          <Text style={[styles.check, checks[0] && styles.checkMet]}>8+ chars</Text>
          <Text style={[styles.check, checks[1] && styles.checkMet]}>Uppercase</Text>
          <Text style={[styles.check, checks[2] && styles.checkMet]}>Number</Text>
        </View>
        {label ? (
          <Text style={[styles.label, score === 3 && styles.labelStrong]}>{label}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 6, marginTop: -8, marginBottom: 8 },
  bars:  { flexDirection: "row", gap: 4 },
  bar:   { flex: 1, height: 4, borderRadius: 2 },
  barEmpty: { backgroundColor: COLORS.zinc100 },
  meta: {
    flexDirection:  "row",
    alignItems:     "center",
    justifyContent: "space-between",
  },
  checks: { flexDirection: "row", gap: 10 },
  check:  { fontSize: 11, fontFamily: FONTS.regular, color: COLORS.zinc400 },
  checkMet: { color: COLORS.blue },
  label:  { fontSize: 11, fontFamily: FONTS.medium, color: COLORS.zinc400 },
  labelStrong: { color: COLORS.blue },
});
