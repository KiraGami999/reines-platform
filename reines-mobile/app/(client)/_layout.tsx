import { View } from "react-native";
import { Tabs } from "expo-router";
import {
  LayoutDashboard,
  FolderKanban,
  MessageSquare,
  CreditCard,
  Star,
  Settings,
} from "lucide-react-native";

import { useRoleGuard }    from "@/hooks/useRoleGuard";
import { useAuth }          from "@/hooks/useAuth";
import { useUnreadCount }   from "@/hooks/useMessages";
import { COLORS }           from "@/constants";
import { portalTabScreenOptions } from "@/constants/theme";
import { LoadingScreen }    from "@/components/ui/LoadingScreen";
import { TabBarIcon }       from "@/components/layout/TabBarIcon";
import { TabBadge }         from "@/components/layout/TabBadge";
import { HeaderRight }      from "@/components/layout/HeaderRight";

/**
 * CLIENT portal layout.
 *
 * Tab order: Dashboard · Projects · Messages · Payments · Rewards · Settings
 *
 * Role enforcement (via useRoleGuard):
 *   - Not signed in   → /(auth)/login
 *   - PROJECT_MANAGER → /(manager)
 *
 * Hidden sub-screens (declared here so Expo Router knows they belong to
 * this group, but excluded from the tab bar):
 *   - projects/[id]        → project detail
 *   - messages/[projectId] → message thread
 *   - gallery/[projectId]  → progress gallery for a project
 */
export default function ClientLayout() {
  const { ready }      = useRoleGuard({ allowedRole: "CLIENT" });
  const { user }       = useAuth();
  const unreadMessages = useUnreadCount(user?.id ?? "");

  if (!ready) return <LoadingScreen />;

  return (
    <Tabs
      screenOptions={{
        ...portalTabScreenOptions(),
        headerRight: () => <HeaderRight />,
      }}
    >
      {/* ── Visible tabs ─────────────────────────────────────────────── */}

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
        name="messages"
        options={{
          title:       "Messages",
          tabBarLabel: "Messages",
          headerShown: false,
          tabBarIcon:  ({ color, focused }) => (
            <View>
              <TabBarIcon icon={MessageSquare} color={color} focused={focused} />
              <TabBadge count={unreadMessages} />
            </View>
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
        name="loyalty"
        options={{
          title:       "Rewards",
          tabBarLabel: "Rewards",
          headerShown: false,
          tabBarIcon:  ({ color, focused }) => (
            <TabBarIcon icon={Star} color={color} focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title:       "Settings",
          tabBarLabel: "Settings",
          headerShown: true,
          headerRight: () => <HeaderRight />,
          tabBarIcon:  ({ color, focused }) => (
            <TabBarIcon icon={Settings} color={color} focused={focused} />
          ),
        }}
      />

      {/* ── Hidden sub-screens (not tabs, deep-linked) ───────────────── */}

      <Tabs.Screen
        name="projects/[id]"
        options={{
          href:          null,  // hidden from tab bar
          headerShown:   true,
          title:         "Project",
          headerRight:   () => <HeaderRight />,
        }}
      />

      <Tabs.Screen
        name="messages/[projectId]"
        options={{
          href:          null,
          headerShown:   true,
          title:         "Messages",
          headerRight:   () => <HeaderRight />,
        }}
      />

      <Tabs.Screen
        name="gallery/[projectId]"
        options={{
          href:          null,
          headerShown:   true,
          title:         "Progress Gallery",
          headerRight:   () => <HeaderRight />,
        }}
      />

      <Tabs.Screen
        name="payments/[id]"
        options={{
          href:        null,
          headerShown: false,
          title:       "Payment Detail",
        }}
      />

      <Tabs.Screen
        name="payments/new"
        options={{
          href:        null,
          headerShown: false,
          title:       "New Payment",
        }}
      />
    </Tabs>
  );
}
