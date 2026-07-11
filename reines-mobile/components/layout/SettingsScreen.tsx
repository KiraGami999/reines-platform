import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
} from "react-native";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import {
  User,
  Mail,
  Shield,
  Bell,
  LogOut,
  ChevronRight,
  Moon,
  Info,
} from "lucide-react-native";

import { useAuth } from "@/hooks/useAuth";
import {
  getPushPreference,
  setPushPreference,
  getPushToken,
} from "@/lib/storage";
import {
  registerForPushNotifications,
  unregisterPushToken,
} from "@/services/notifications.service";
import { COLORS, ROLE_LABELS, APP_NAME } from "@/constants";
import { FONTS } from "@/constants/theme";
import { Card } from "@/components/ui/Card";

interface SettingsRow {
  icon:    React.ReactNode;
  label:   string;
  value?:  string;
  onPress?: () => void;
  danger?:  boolean;
  right?:   React.ReactNode;
}

function Row({ icon, label, value, onPress, danger, right }: SettingsRow) {
  const content = (
    <View style={styles.row}>
      <View style={[styles.rowIcon, danger && styles.rowIconDanger]}>
        {icon}
      </View>
      <View style={styles.rowBody}>
        <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>{label}</Text>
        {value && <Text style={styles.rowValue}>{value}</Text>}
      </View>
      {right ?? (
        onPress ? <ChevronRight size={16} color={COLORS.zinc400} /> : null
      )}
    </View>
  );

  if (!onPress) return <View style={styles.rowWrapper}>{content}</View>;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.rowWrapper}>
      {content}
    </TouchableOpacity>
  );
}

interface Props {
  /** Extra rows specific to a portal role, rendered after account section */
  extraRows?: SettingsRow[];
}

/**
 * Shared Settings screen base.
 * Used by both (client)/settings.tsx and (manager)/settings.tsx.
 */
export function SettingsScreen({ extraRows }: Props) {
  const { user, signOut } = useAuth();
  const router            = useRouter();
  const [notifications, setNotifications] = useState(true);
  const [togglingPush,  setTogglingPush]  = useState(false);
  const [darkMode,      setDarkMode]      = useState(false);

  const roleBadgeColor = COLORS.primary;

  // Hydrate toggle from stored preference (or existing push token)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const preference = await getPushPreference();
      if (cancelled) return;
      if (preference !== null) {
        setNotifications(preference);
        return;
      }
      const token = await getPushToken();
      if (!cancelled) setNotifications(!!token);
    })().catch(console.warn);
    return () => { cancelled = true; };
  }, []);

  async function handlePushToggle(enabled: boolean) {
    setTogglingPush(true);
    setNotifications(enabled); // optimistic
    try {
      if (enabled) {
        const token = await registerForPushNotifications();
        if (!token) {
          setNotifications(false);
          await setPushPreference(false);
          Alert.alert(
            "Permission needed",
            "Enable notifications in your device settings to receive project updates."
          );
          return;
        }
        await setPushPreference(true);
      } else {
        await unregisterPushToken();
        await setPushPreference(false);
      }
    } catch {
      setNotifications(!enabled);
      Alert.alert("Error", "Could not update notification settings. Please try again.");
    } finally {
      setTogglingPush(false);
    }
  }

  function handleLogout() {
    Alert.alert(
      "Sign out",
      "You will be returned to the login screen.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text:    "Sign out",
          style:   "destructive",
          onPress: async () => {
            await signOut();
            router.replace("/(auth)/login");
          },
        },
      ]
    );
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Card style={styles.profileCard} padded>
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarText}>
            {user?.name?.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() ?? "?"}
          </Text>
        </View>
        <Text style={styles.profileName}>{user?.name ?? "—"}</Text>
        <Text style={styles.profileEmail}>{user?.email ?? "—"}</Text>
        <View style={[styles.roleBadge, { backgroundColor: roleBadgeColor + "18", borderColor: roleBadgeColor + "40" }]}>
          <Shield size={11} color={roleBadgeColor} />
          <Text style={[styles.roleText, { color: roleBadgeColor }]}>
            {ROLE_LABELS[user?.role ?? ""] ?? user?.role}
          </Text>
        </View>
      </Card>

      <Text style={styles.sectionHeading}>Account</Text>
      <Card padded={false}>
        <Row
          icon={<User size={16} color={COLORS.primary} />}
          label="Full Name"
          value={user?.name ?? "—"}
        />
        <View style={styles.divider} />
        <Row
          icon={<Mail size={16} color={COLORS.primary} />}
          label="Email Address"
          value={user?.email ?? "—"}
        />
      </Card>

      {extraRows && extraRows.length > 0 && (
        <>
          <Text style={styles.sectionHeading}>Portal</Text>
          <Card padded={false}>
            {extraRows.map((row, i) => (
              <View key={row.label}>
                <Row {...row} />
                {i < extraRows.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </Card>
        </>
      )}

      <Text style={styles.sectionHeading}>Preferences</Text>
      <Card padded={false}>
        <Row
          icon={<Bell size={16} color={COLORS.primary} />}
          label="Push Notifications"
          right={
            <Switch
              value={notifications}
              onValueChange={handlePushToggle}
              disabled={togglingPush}
              trackColor={{ false: COLORS.zinc200, true: COLORS.accent }}
              thumbColor={COLORS.white}
            />
          }
        />
        <View style={styles.divider} />
        <Row
          icon={<Moon size={16} color={COLORS.primary} />}
          label="Dark Mode"
          value="Coming soon"
          right={
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              disabled
              trackColor={{ false: COLORS.zinc200, true: COLORS.accent }}
              thumbColor={COLORS.white}
            />
          }
        />
      </Card>

      <Text style={styles.sectionHeading}>App</Text>
      <Card padded={false}>
        <Row
          icon={<Info size={16} color={COLORS.zinc500} />}
          label="Version"
          value="1.0.0"
        />
      </Card>

      <View style={styles.logoutSection}>
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.85}
        >
          <LogOut size={16} color={COLORS.red} />
          <Text style={styles.logoutText}>Sign out</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>
        © {new Date().getFullYear()} {APP_NAME}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: COLORS.zinc50 },
  content: { padding: 20, paddingBottom: 40 },

  profileCard:  { alignItems: "center", marginBottom: 8, paddingVertical: 24 },
  avatarLarge:  {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: COLORS.primary,
    alignItems: "center", justifyContent: "center",
    marginBottom: 12,
  },
  avatarText:   { fontSize: 28, fontFamily: FONTS.extrabold, color: COLORS.accent },
  profileName:  { fontSize: 18, fontFamily: FONTS.bold, color: COLORS.zinc900 },
  profileEmail: { fontSize: 13, fontFamily: FONTS.regular, color: COLORS.zinc500, marginTop: 3 },
  roleBadge:    {
    flexDirection: "row", alignItems: "center", gap: 5,
    marginTop: 10, paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 100, borderWidth: 1,
  },
  roleText:     { fontSize: 11, fontFamily: FONTS.bold },

  sectionHeading: {
    fontSize: 11, fontFamily: FONTS.bold, letterSpacing: 0.8,
    textTransform: "uppercase", color: COLORS.zinc400,
    marginTop: 24, marginBottom: 8, marginLeft: 4,
  },

  rowWrapper: { paddingHorizontal: 16 },
  row:        { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14 },
  rowIcon:    {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: COLORS.zinc100,
    alignItems: "center", justifyContent: "center",
  },
  rowIconDanger: { backgroundColor: COLORS.redBg },
  rowBody:       { flex: 1 },
  rowLabel:      { fontSize: 14, fontFamily: FONTS.semibold, color: COLORS.zinc900 },
  rowLabelDanger:{ color: COLORS.red },
  rowValue:      { fontSize: 12, fontFamily: FONTS.regular, color: COLORS.zinc500, marginTop: 2 },
  divider:       { height: 1, backgroundColor: COLORS.zinc100, marginLeft: 62 },

  logoutSection: { marginTop: 28 },
  logoutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    borderWidth: 1, borderColor: COLORS.redBorder, borderRadius: 14,
    backgroundColor: COLORS.redBg, paddingVertical: 14,
  },
  logoutText: { fontSize: 15, fontFamily: FONTS.bold, color: COLORS.red },

  footer: { marginTop: 28, textAlign: "center", fontSize: 11, fontFamily: FONTS.regular, color: COLORS.zinc400 },
});
