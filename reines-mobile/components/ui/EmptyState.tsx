import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "@/constants";

interface Props {
  title:    string;
  message?: string;
  action?:  React.ReactNode;
}

export function EmptyState({ title, message, action }: Props) {
  return (
    <View style={styles.root}>
      <View style={styles.icon}>
        <Text style={styles.iconText}>○</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      {message && <Text style={styles.message}>{message}</Text>}
      {action && <View style={styles.action}>{action}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  root:     { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  icon:     { marginBottom: 16 },
  iconText: { fontSize: 40, color: COLORS.zinc200 },
  title:    { fontSize: 16, fontWeight: "700", color: COLORS.zinc700, textAlign: "center" },
  message:  { fontSize: 13, color: COLORS.zinc400, textAlign: "center", marginTop: 8, lineHeight: 19 },
  action:   { marginTop: 20 },
});
