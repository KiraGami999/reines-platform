import { useRouter } from "expo-router";
import { Star, CreditCard } from "lucide-react-native";
import { SettingsScreen } from "@/components/layout/SettingsScreen";
import { COLORS } from "@/constants";

/**
 * CLIENT Settings screen.
 * Extends the shared SettingsScreen with client-specific rows.
 */
export default function ClientSettings() {
  const router = useRouter();

  return (
    <SettingsScreen
      extraRows={[
        {
          icon:    <Star size={16} color={COLORS.primary} />,
          label:   "My Rewards",
          onPress: () => router.push("/(client)/loyalty"),
        },
        {
          icon:    <CreditCard size={16} color={COLORS.primary} />,
          label:   "Payment History",
          onPress: () => router.push("/(client)/payments"),
        },
      ]}
    />
  );
}
