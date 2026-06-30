import { View, ActivityIndicator, StyleSheet, Text } from "react-native";
import { COLORS } from "@/constants";

interface Props {
  message?: string;
}

export function LoadingScreen({ message }: Props) {
  return (
    <View style={styles.root}>
      <View style={styles.logoCircle}>
        <Text style={styles.logoText}>R</Text>
      </View>
      <ActivityIndicator size="large" color={COLORS.accent} style={styles.spinner} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  root:       { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.primary },
  logoCircle: { width: 72, height: 72, borderRadius: 20, backgroundColor: COLORS.accent, alignItems: "center", justifyContent: "center" },
  logoText:   { fontSize: 36, fontWeight: "800", color: COLORS.primary },
  spinner:    { marginTop: 32 },
  message:    { marginTop: 16, fontSize: 13, color: COLORS.accent },
});
