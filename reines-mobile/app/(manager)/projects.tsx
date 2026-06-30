import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "@/constants";

export default function ManagerProjects() {
  return (
    <View style={styles.root}>
      <Text style={styles.text}>My Projects — Phase 2</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.white },
  text: { color: COLORS.zinc400, fontSize: 13 },
});
