import { View, StyleSheet, type ViewProps, type StyleProp, type ViewStyle } from "react-native";
import { COLORS } from "@/constants";

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
    borderRadius:     16,
    borderWidth:      1,
    borderColor:      COLORS.zinc100,
    shadowColor:      "#000",
    shadowOpacity:    0.05,
    shadowRadius:     8,
    shadowOffset:     { width: 0, height: 2 },
    elevation:        2,
  },
  padded: { padding: 16 },
});
