import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { LogOut } from "lucide-react-native";
import { useAuth } from "@/hooks/useAuth";
import { COLORS } from "@/constants";

/**
 * HeaderRight
 *
 * Shown in the top-right corner of every tab header.
 * Displays the user's initials in an avatar circle and a logout button.
 *
 * Usage in a Tabs.Screen or Stack.Screen:
 *   headerRight: () => <HeaderRight />
 */
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
          // signOut() already calls router.replace("/(auth)/login") — no need to repeat it
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
      {/* Avatar */}
      <View style={styles.avatar}>
        <Text style={styles.initials}>{initials}</Text>
      </View>

      {/* Logout */}
      <TouchableOpacity
        onPress={handleLogout}
        hitSlop={10}
        style={styles.logoutBtn}
        accessibilityLabel="Sign out"
      >
        <LogOut size={18} color={COLORS.accent} strokeWidth={2} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root:      { flexDirection: "row", alignItems: "center", gap: 10, marginRight: 16 },
  avatar:    {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.accent,
    alignItems: "center", justifyContent: "center",
  },
  initials:  { fontSize: 12, fontWeight: "800", color: COLORS.primary },
  logoutBtn: { padding: 4 },
});
