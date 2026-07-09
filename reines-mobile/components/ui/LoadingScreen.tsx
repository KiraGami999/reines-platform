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
      <View style={styles.logoWrap}>
        <Image
          source={require("@/assets/logo-loader.png")}
          style={styles.logoIcon}
          contentFit="contain"
        />
      </View>
      <ActivityIndicator size="large" color={COLORS.accent} style={styles.spinner} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  root:     { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.hero },
  logoWrap: { width: 112, height: 112, alignItems: "center", justifyContent: "center" },
  logoIcon: { width: 112, height: 112 },
  spinner:  { marginTop: 24 },
  message:  { marginTop: 16, fontSize: 13, fontFamily: FONTS.medium, color: COLORS.zinc400, letterSpacing: 1 },
});
