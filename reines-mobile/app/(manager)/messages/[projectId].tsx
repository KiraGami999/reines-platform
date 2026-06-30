import { View, Text, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { COLORS } from "@/constants";

/**
 * Manager — Message Thread screen.
 * Accessible by navigating: router.push("/(manager)/messages/PROJECT_ID")
 * Full chat implementation in Phase 2.
 */
export default function ManagerMessageThread() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();

  return (
    <View style={styles.root}>
      <Text style={styles.text}>Message Thread</Text>
      <Text style={styles.sub}>Project: {projectId}</Text>
      <Text style={styles.note}>Phase 2 implementation</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.white, padding: 24 },
  text: { fontSize: 18, fontWeight: "700", color: COLORS.primary },
  sub:  { fontSize: 13, color: COLORS.zinc500, marginTop: 6 },
  note: { fontSize: 11, color: COLORS.zinc400, marginTop: 16 },
});
