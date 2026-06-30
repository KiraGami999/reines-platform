import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "@/constants";

interface Props {
  count: number;
}

/**
 * Red dot / count badge overlaid on a tab icon.
 * Renders nothing if count is 0.
 *
 * Usage in tabBarIcon:
 *   <View>
 *     <TabBarIcon ... />
 *     <TabBadge count={unreadCount} />
 *   </View>
 */
export function TabBadge({ count }: Props) {
  if (count <= 0) return null;

  const label = count > 99 ? "99+" : String(count);

  return (
    <View style={[styles.badge, count > 9 && styles.badgeWide]}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position:        "absolute",
    top:             -4,
    right:           -8,
    minWidth:        16,
    height:          16,
    borderRadius:    8,
    backgroundColor: COLORS.red,
    alignItems:      "center",
    justifyContent:  "center",
    paddingHorizontal: 3,
    borderWidth:     1.5,
    borderColor:     COLORS.primary,
  },
  badgeWide: { minWidth: 22 },
  text:      { fontSize: 9, fontWeight: "800", color: COLORS.white },
});
