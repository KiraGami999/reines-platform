import { View, StyleSheet, type ViewProps, type StyleProp, type ViewStyle } from "react-native";
import { COLORS } from "@/constants";
import { RADII, SHADOW } from "@/constants/theme";

interface Props extends ViewProps {
  children:  React.ReactNode;
  style?:    StyleProp<ViewStyle>;
  padded?:   boolean;
}

export function Card({ children, style, padded = true, ...props }: Props) {
  return (
    <View
      {...props}
      style={[
        styles.card,
        padded && styles.padded,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor:  COLORS.white,
    borderRadius:     RADII.md,
    borderWidth:      1,
    borderColor:      COLORS.zinc200,
    ...SHADOW.card,
  },
  padded: { padding: 16 },
});
