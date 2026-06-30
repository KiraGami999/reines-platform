import { View, Text, StyleSheet } from "react-native";
import { Link } from "expo-router";
import { COLORS } from "@/constants";

export default function NotFound() {
  return (
    <View style={styles.container}>
      <Text style={styles.code}>404</Text>
      <Text style={styles.title}>Page not found</Text>
      <Link href="/" style={styles.link}>Go back home</Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.white, padding: 24 },
  code:      { fontSize: 56, fontWeight: "800", color: COLORS.primary },
  title:     { fontSize: 18, color: COLORS.zinc500, marginTop: 8 },
  link:      { marginTop: 24, fontSize: 14, color: COLORS.accent, fontWeight: "600" },
});
