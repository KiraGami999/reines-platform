import { View } from "react-native";
import { Tabs } from "expo-router";
import {
  LayoutDashboard,
  FolderKanban,
  MessageSquare,
  ImageIcon,
  Settings,
} from "lucide-react-native";

import { useRoleGuard }   from "@/hooks/useRoleGuard";
import { useAuth }         from "@/hooks/useAuth";
import { useUnreadCount }  from "@/hooks/useMessages";
import { COLORS }          from "@/constants";
import { portalTabScreenOptions } from "@/constants/theme";
import { LoadingScreen }   from "@/components/ui/LoadingScreen";
import { TabBarIcon }      from "@/components/layout/TabBarIcon";
import { TabBadge }        from "@/components/layout/TabBadge";
import { HeaderRight }     from "@/components/layout/HeaderRight";

/**
 * PROJECT_MANAGER portal layout.
 *
 * Tab order: Dashboard · Projects · Messages · Gallery · Settings
 *
 * Role enforcement (via useRoleGuard):
 *   - Not signed in → /(auth)/login
 *   - CLIENT        → /(client)
 *
 * Hidden sub-screens (Expo Router group members, not tab bar items):
 *   - projects/[id]          → project detail + status controls
 *   - messages/[projectId]   → message thread with a client
 *   - milestones/[projectId] → milestone list for a project (accessible
 *                              from project detail, not a top-level tab)
 */
export default function ManagerLayout() {
  const { ready }      = useRoleGuard({ allowedRole: "PROJECT_MANAGER" });
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
        name="gallery"
        options={{
          title:       "Gallery",
          tabBarLabel: "Gallery",
          headerShown: false,
          tabBarIcon:  ({ color, focused }) => (
            <TabBarIcon icon={ImageIcon} color={color} focused={focused} />
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

      {/* ── Hidden sub-screens ───────────────────────────────────────── */}

      <Tabs.Screen
        name="projects/[id]"
        options={{
          href:          null,
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
        name="milestones/[projectId]"
        options={{
          href:          null,
          headerShown:   true,
          title:         "Milestones",
          headerRight:   () => <HeaderRight />,
        }}
      />
    </Tabs>
  );
}
