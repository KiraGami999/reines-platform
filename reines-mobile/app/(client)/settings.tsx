import { View, StyleSheet } from "react-native";
import { PortalWebView } from "@/components/web/PortalWebView";
import { SignOutBar } from "@/components/layout/SignOutBar";
import { WEB_ROUTES } from "@/lib/webPortal";

/**
 * CLIENT · Settings tab.
 *
 * Web Appearance settings + a native Sign out bar (clears JWT so you can
 * log in as another user — web-only sign-out would auto re-bridge).
 */
export default function ClientSettings() {
  return (
    <View style={styles.root}>
      <View style={styles.web}>
        <PortalWebView route={WEB_ROUTES.client.settings} padTop={false} />
      </View>
      <SignOutBar />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  web:  { flex: 1 },
});
