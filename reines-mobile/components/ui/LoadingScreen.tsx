import { View, ActivityIndicator, StyleSheet, Text } from "react-native";
import { StatusBar } from "expo-status-bar";
import { COLORS } from "@/constants";
import { FONTS } from "@/constants/theme";
import { ReinesLogo, type PortalLogoMark } from "@/components/brand/ReinesLogo";

interface Props {
  message?: string;
  /**
   * `project-mate` = client + project manager portals (app default).
   * `corporate` = admin portal, which keeps the Reines Property Development brand.
   */
  mark?: PortalLogoMark;
}

export function LoadingScreen({ message, mark = "project-mate" }: Props) {
  return (
    <View style={styles.root}>
      {/* Navy background needs light icons — overrides the app-wide dark default. */}
      <StatusBar style="light" />
      <ReinesLogo mode="wordmark" mark={mark} variant="on-dark" height={34} style={styles.logo} />
      <ActivityIndicator size="large" color={COLORS.accent} style={styles.spinner} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.primary },
  logo:    { marginBottom: 8 },
  spinner: { marginTop: 28 },
  message: { marginTop: 16, fontSize: 13, fontFamily: FONTS.medium, color: COLORS.zinc400, letterSpacing: 1 },
});
