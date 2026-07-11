import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { COLORS } from "@/constants";
import { FONTS } from "@/constants/theme";

/**
 * Persistent top banner shown when the device has no network connectivity.
 * Mount once at the root layout so every screen inherits it.
 */
export function OfflineBanner() {
  const insets = useSafeAreaInsets();
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      // isInternetReachable can be null while NetInfo is still probing —
      // only treat as offline when connectivity is explicitly false.
      const offline =
        state.isConnected === false || state.isInternetReachable === false;
      setIsOffline(offline);
    });
    return unsubscribe;
  }, []);

  if (!isOffline) return null;

  return (
    <View
      style={[styles.banner, { paddingTop: Math.max(insets.top, 8) }]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Text style={styles.text}>
        You're offline. Some features may be unavailable.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: COLORS.zinc800,
    paddingBottom:   10,
    paddingHorizontal: 16,
    alignItems:      "center",
    justifyContent:  "center",
  },
  text: {
    color:      COLORS.white,
    fontSize:   13,
    fontFamily: FONTS.medium,
    textAlign:  "center",
  },
});
