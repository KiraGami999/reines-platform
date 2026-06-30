import { useRouter } from "expo-router";
import { FolderKanban, ImageIcon } from "lucide-react-native";
import { SettingsScreen } from "@/components/layout/SettingsScreen";
import { COLORS } from "@/constants";

/**
 * PROJECT_MANAGER Settings screen.
 * Extends the shared SettingsScreen with manager-specific rows.
 */
export default function ManagerSettings() {
  const router = useRouter();

  return (
    <SettingsScreen
      extraRows={[
        {
          icon:    <FolderKanban size={16} color="#7c3aed" />,
          label:   "My Projects",
          onPress: () => router.push("/(manager)/projects"),
        },
        {
          icon:    <ImageIcon size={16} color="#7c3aed" />,
          label:   "Progress Gallery",
          onPress: () => router.push("/(manager)/gallery"),
        },
      ]}
    />
  );
}
