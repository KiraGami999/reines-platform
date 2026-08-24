import { useEffect, useState } from "react";
import { Alert, StyleSheet, Switch, Text, View } from "react-native";
import { Bell } from "lucide-react-native";
import {
  getPushPreference,
  setPushPreference,
  getPushToken,
} from "@/lib/storage";
import {
  registerForPushNotifications,
  unregisterPushToken,
} from "@/services/notifications.service";
import { COLORS } from "@/constants";
import { FONTS } from "@/constants/theme";

/**
 * Native push opt-in/out for portal Settings tabs (above Sign out).
 * Web Settings cannot control device push tokens.
 */
export function PushNotificationsBar() {
  const [enabled, setEnabled] = useState(true);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const preference = await getPushPreference();
      if (cancelled) return;
      if (preference !== null) {
        setEnabled(preference);
      } else {
        const token = await getPushToken();
        if (!cancelled) setEnabled(!!token);
      }
      if (!cancelled) setReady(true);
    })().catch(console.warn);
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleToggle(next: boolean) {
    setBusy(true);
    setEnabled(next);
    try {
      if (next) {
        const token = await registerForPushNotifications();
        if (!token) {
          setEnabled(false);
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
      setEnabled(!next);
      Alert.alert("Error", "Could not update notification settings. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.bar}>
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <Bell size={16} color={COLORS.primary} strokeWidth={2.2} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.title}>Push notifications</Text>
          <Text style={styles.hint}>
            Messages, payments, and project updates on this device.
          </Text>
        </View>
        <Switch
          value={enabled}
          onValueChange={handleToggle}
          disabled={!ready || busy}
          trackColor={{ false: COLORS.zinc200, true: COLORS.accent }}
          thumbColor={COLORS.white}
        />
      </View>
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
    paddingBottom: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingBottom: 8,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.zinc100,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: { flex: 1 },
  title: {
    fontSize: 14,
    fontFamily: FONTS.semibold,
    color: COLORS.zinc900,
  },
  hint: {
    marginTop: 2,
    fontSize: 11,
    fontFamily: FONTS.regular,
    color: COLORS.zinc500,
    lineHeight: 15,
  },
});
