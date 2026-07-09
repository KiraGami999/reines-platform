import { View, ActivityIndicator, StyleSheet, Text } from "react-native";
import { Image } from "expo-image";
import { COLORS } from "@/constants";
import { FONTS } from "@/constants/theme";

interface Props {
  message?: string;
}

export function LoadingScreen({ message }: Props) {
  return (
    <View style={styles.root}>
      <Image
        source={require("@/assets/logo-icon-white.png")}
        style={styles.logoIcon}
        contentFit="contain"
      />
      <ActivityIndicator size="large" color={COLORS.accent} style={styles.spinner} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  root:     { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.primary },
  logoIcon: { width: 88, height: 88 },
  spinner:  { marginTop: 28 },
  message:  { marginTop: 16, fontSize: 13, fontFamily: FONTS.medium, color: COLORS.zinc400, letterSpacing: 1 },
});
