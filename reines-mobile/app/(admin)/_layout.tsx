import { Tabs } from "expo-router";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  CreditCard,
  Settings,
} from "lucide-react-native";

import { useRoleGuard }    from "@/hooks/useRoleGuard";
import { portalTabScreenOptions } from "@/constants/theme";
import { LoadingScreen }    from "@/components/ui/LoadingScreen";
import { TabBarIcon }       from "@/components/layout/TabBarIcon";
import { HeaderRight }      from "@/components/layout/HeaderRight";

/**
 * ADMIN portal layout.
 *
 * Tab order: Dashboard · Projects · Clients · Payments · Settings
 *
 * Each visible tab (except Settings) renders the matching web admin page inside
 * a WebView so admins get the full website toolset on mobile. Settings stays
 * native so logout also clears the native JWT + push token.
 *
 * Role enforcement (via useRoleGuard):
 *   - Not signed in   → /(auth)/login
 *   - CLIENT          → /(client)
 *   - PROJECT_MANAGER → /(manager)
 */
export default function AdminLayout() {
  const { ready } = useRoleGuard({ allowedRole: "ADMIN" });

  if (!ready) return <LoadingScreen />;

  return (
    <Tabs
      screenOptions={{
        ...portalTabScreenOptions(),
        headerRight: () => <HeaderRight />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title:       "Dashboard",
          tabBarLabel: "Dashboard",
          headerShown: false,
          tabBarIcon:  ({ color, focused }) => (
            <TabBarIcon icon={LayoutDashboard} color={color} focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="projects"
        options={{
          title:       "Projects",
          tabBarLabel: "Projects",
          headerShown: false,
          tabBarIcon:  ({ color, focused }) => (
            <TabBarIcon icon={FolderKanban} color={color} focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="clients"
        options={{
          title:       "Clients",
          tabBarLabel: "Clients",
          headerShown: false,
          tabBarIcon:  ({ color, focused }) => (
            <TabBarIcon icon={Users} color={color} focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="payments"
        options={{
          title:       "Payments",
          tabBarLabel: "Payments",
          headerShown: false,
          tabBarIcon:  ({ color, focused }) => (
            <TabBarIcon icon={CreditCard} color={color} focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title:       "Settings",
          tabBarLabel: "Settings",
          tabBarIcon:  ({ color, focused }) => (
            <TabBarIcon icon={Settings} color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
