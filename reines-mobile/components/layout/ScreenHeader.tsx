import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { COLORS } from "@/constants";

interface Props {
  title:    string;
  subtitle?: string;
  showBack?: boolean;
  right?:    React.ReactNode;
}

export function ScreenHeader({ title, subtitle, showBack, right }: Props) {
  const router = useRouter();

  return (
    <View style={styles.root}>
      <View style={styles.left}>
        {showBack && (
          <TouchableOpacity onPress={() => router.back()} style={styles.back} hitSlop={12}>
            <ArrowLeft size={20} color={COLORS.white} />
          </TouchableOpacity>
        )}
        <View>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      </View>
      {right && <View style={styles.right}>{right}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  root:     { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  left:     { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  back:     { padding: 4 },
  title:    { fontSize: 20, fontWeight: "800", color: COLORS.white },
  subtitle: { fontSize: 12, color: COLORS.accent, marginTop: 2 },
  right:    {},
});
