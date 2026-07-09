import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { LogOut } from "lucide-react-native";
import { useAuth } from "@/hooks/useAuth";
import { COLORS } from "@/constants";
import { FONTS } from "@/constants/theme";

export function HeaderRight() {
  const { user, signOut } = useAuth();

  function handleLogout() {
    Alert.alert(
      "Sign out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text:    "Sign out",
          style:   "destructive",
          onPress: () => { signOut(); },
        },
      ]
    );
  }

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  return (
    <View style={styles.root}>
      <View style={styles.avatar}>
        <Text style={styles.initials}>{initials}</Text>
      </View>

      <TouchableOpacity
        onPress={handleLogout}
        hitSlop={10}
        style={styles.logoutBtn}
        accessibilityLabel="Sign out"
      >
        <LogOut size={18} color={COLORS.zinc500} strokeWidth={2} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root:      { flexDirection: "row", alignItems: "center", gap: 10, marginRight: 16 },
  avatar:    {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: "center", justifyContent: "center",
  },
  initials:  { fontSize: 10, fontFamily: FONTS.bold, color: COLORS.accent },
  logoutBtn: {
    padding: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.zinc200,
    backgroundColor: COLORS.white,
  },
});
