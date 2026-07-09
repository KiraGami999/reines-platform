import { Image, type ImageStyle, type StyleProp } from "react-native";
import { COLORS } from "@/constants";

type ReinesLogoProps = {
  variant?: "on-dark" | "on-light";
  height?: number;
  style?: StyleProp<ImageStyle>;
};

export function ReinesLogo({
  variant = "on-dark",
  height = 36,
  style,
}: ReinesLogoProps) {
  return (
    <Image
      source={require("@/assets/logo.png")}
      accessibilityLabel="Reines Property Development Limited"
      style={[
        {
          height,
          width: height * (687 / 136),
          tintColor: variant === "on-light" ? COLORS.primary : undefined,
        },
        style,
      ]}
      resizeMode="contain"
    />
  );
}
