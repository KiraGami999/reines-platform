import { View, StyleSheet } from "react-native";
import { PortalWebView } from "@/components/web/PortalWebView";
import { PushNotificationsBar } from "@/components/layout/PushNotificationsBar";
import { SignOutBar } from "@/components/layout/SignOutBar";
import { WEB_ROUTES } from "@/lib/webPortal";

/** CLIENT · Settings — web prefs + native push toggle + sign out. */
export default function ClientSettings() {
  return (
    <View style={styles.root}>
      <View style={styles.web}>
        <PortalWebView route={WEB_ROUTES.client.settings} padTop={false} />
      </View>
      <PushNotificationsBar />
      <SignOutBar />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  web:  { flex: 1 },
});
