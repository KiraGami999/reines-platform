import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LogOut } from "lucide-react-native";
import { useAuth } from "@/hooks/useAuth";
import { COLORS } from "@/constants";
import { FONTS } from "@/constants/theme";

/**
 * Always-visible native Sign out control for portal Settings tabs.
 * Clears JWT + push + web-session state (web-only sign-out would re-bridge).
 */
export function SignOutBar() {
  const { signOut } = useAuth();
  const insets = useSafeAreaInsets();

  function handlePress() {
    Alert.alert("Sign out", "You will be returned to the login screen.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: () => {
          void signOut();
        },
      },
    ]);
  }

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <TouchableOpacity
        style={styles.btn}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel="Sign out"
        activeOpacity={0.85}
      >
        <LogOut size={16} color={COLORS.white} strokeWidth={2.2} />
        <Text style={styles.label}>Sign out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.zinc200,
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
  },
  label: {
    fontSize: 15,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },
});
