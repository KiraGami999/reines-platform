import type { BottomTabNavigationOptions } from "@react-navigation/bottom-tabs";
import { COLORS } from "@/constants";

/** Montserrat — matches reines-web `app/layout.tsx` */
export const FONTS = {
  regular:   "Montserrat_400Regular",
  medium:    "Montserrat_500Medium",
  semibold:  "Montserrat_600SemiBold",
  bold:      "Montserrat_700Bold",
  extrabold: "Montserrat_800ExtraBold",
} as const;

export const RADII = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  full: 9999,
} as const;

export const SHADOW = {
  card: {
    shadowColor:   "#000",
    shadowOffset:  { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius:  4,
    elevation:     2,
  },
  raised: {
    shadowColor:   "#000",
    shadowOffset:  { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius:  8,
    elevation:     3,
  },
} as const;

/** Shared tab navigator options — navy bar like web sidebar */
export function portalTabScreenOptions(): BottomTabNavigationOptions {
  return {
    tabBarActiveTintColor:   COLORS.accent,
    tabBarInactiveTintColor: COLORS.zinc400,
    tabBarStyle: {
      backgroundColor: COLORS.primary,
      borderTopWidth:  0,
      paddingTop:      6,
      paddingBottom:   6,
      height:          64,
    },
    tabBarLabelStyle: {
      fontSize:     10,
      fontWeight:   "600",
      marginTop:    2,
      fontFamily:   FONTS.semibold,
    },

    // White header bar like web DashboardHeader
    headerStyle: {
      backgroundColor: COLORS.white,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.zinc200,
    },
    headerTintColor:     COLORS.primary,
    headerTitleStyle:    {
      fontWeight:   "700",
      fontSize:     17,
      color:        COLORS.zinc800,
      fontFamily:   FONTS.bold,
    },
    headerShadowVisible: false,
  };
}
