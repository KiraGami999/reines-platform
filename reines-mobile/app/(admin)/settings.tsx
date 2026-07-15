import { SettingsScreen } from "@/components/layout/SettingsScreen";

/**
 * ADMIN Settings screen (native).
 *
 * Kept native so signing out also clears the native JWT + push token (a web
 * logout inside the WebView alone would leave the app "signed in").
 */
export default function AdminSettings() {
  return <SettingsScreen />;
}
