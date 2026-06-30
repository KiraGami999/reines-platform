import React from "react";
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import {
  FolderKanban, MessageSquare, AlertTriangle, Calendar,
  Activity, ChevronRight, AlertCircle,
} from "lucide-react-native";
import { COLORS } from "@/constants";
import { useAuth }              from "@/hooks/useAuth";
import { useManagerDashboard }  from "@/hooks/useManagerDashboard";
import { useConversations }     from "@/hooks/useMessages";
import { useUnreadCount }       from "@/hooks/useMessages";
import { ManagerStatCard, ManagerStatCardSkeleton } from "@/components/manager/ManagerStatCard";
import { ManagedProjectCard, ManagedProjectCardSkeleton } from "@/components/manager/ManagedProjectCard";
import { AttentionCard, DeadlineCard }                    from "@/components/manager/AttentionCard";
import { MessageFeedItem, UpdateFeedItem, FeedItemSkeleton } from "@/components/manager/ActivityFeedItem";

export default function ManagerDashboard() {
  const router  = useRouter();
  const { user } = useAuth();

  const { data, isLoading, isError, refetch, isRefetching } = useManagerDashboard();
  const unreadMessages = useUnreadCount(user?.id ?? "");

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  if (isError) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.centred}>
          <AlertCircle size={40} color={COLORS.red} />
          <Text style={styles.errorText}>Failed to load dashboard.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()} activeOpacity={0.8}>
            <Text style={styles.retryLabel}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.primary} />
        }
      >
        {/* ── Header greeting ──────────────────────────────────────────── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting},</Text>
            <Text style={styles.name}>{user?.name ?? "Manager"}</Text>
            <Text style={styles.role}>Project Manager</Text>
          </View>
          {data && data.stats.needsAttentionCount > 0 && (
            <View style={styles.alertPill}>
              <AlertTriangle size={13} color={COLORS.yellow} />
              <Text style={styles.alertPillText}>{data.stats.needsAttentionCount} need attention</Text>
            </View>
          )}
        </View>

        {/* ── Summary stats grid ────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Overview</Text>
        {isLoading ? (
          <View style={styles.statsGrid}>
            {[0, 1, 2, 3].map((i) => <ManagerStatCardSkeleton key={i} />)}
          </View>
        ) : (
          <View style={styles.statsGrid}>
            <ManagerStatCard
              value={data!.stats.total}
              label="Total Projects"
              accent={COLORS.primary}
              icon={<FolderKanban size={16} color={COLORS.primary} />}
              onPress={() => router.push("/(manager)/projects" as never)}
            />
            <ManagerStatCard
              value={data!.stats.active}
              label="Active"
              accent={COLORS.green}
              icon={<Activity size={16} color={COLORS.green} />}
            />
            <ManagerStatCard
              value={unreadMessages}
              label="Unread Msgs"
              accent={unreadMessages > 0 ? COLORS.red : COLORS.zinc400}
              icon={<MessageSquare size={16} color={unreadMessages > 0 ? COLORS.red : COLORS.zinc400} />}
              onPress={() => router.push("/(manager)/messages" as never)}
            />
            <ManagerStatCard
              value={data!.stats.completedThisMonth}
              label="Done This Month"
              accent="#7c3aed"
              icon={<FolderKanban size={16} color="#7c3aed" />}
            />
          </View>
        )}

        {/* ── Needs attention ───────────────────────────────────────────── */}
        {(isLoading || (data && data.needsAttention.length > 0)) && (
          <>
            <SectionHeader
              title="Needs Attention"
              icon={<AlertTriangle size={14} color={COLORS.yellow} />}
              accent={COLORS.yellow}
            />
            {isLoading
              ? [0, 1].map((i) => <View key={i} style={[styles.sk, { height: 64, borderRadius: 12, marginBottom: 8 }]} />)
              : data!.needsAttention.map((p) => (
                  <AttentionCard key={p.id} project={p} />
                ))}
          </>
        )}

        {/* ── Upcoming deadlines ─────────────────────────────────────────── */}
        {(isLoading || (data && data.upcomingDeadlines.length > 0)) && (
          <>
            <SectionHeader
              title="Upcoming Deadlines"
              icon={<Calendar size={14} color={COLORS.primary} />}
              accent={COLORS.primary}
            />
            {isLoading
              ? [0, 1].map((i) => <View key={i} style={[styles.sk, { height: 64, borderRadius: 12, marginBottom: 8 }]} />)
              : data!.upcomingDeadlines.map((p) => (
                  <DeadlineCard key={p.id} project={p} />
                ))}
          </>
        )}

        {/* ── Assigned projects ─────────────────────────────────────────── */}
        <SectionHeader
          title="My Projects"
          icon={<FolderKanban size={14} color={COLORS.primary} />}
          accent={COLORS.primary}
          action={data && data.projects.length > 3 ? {
            label: `See all ${data.projects.length} →`,
            onPress: () => router.push("/(manager)/projects" as never),
          } : undefined}
        />
        {isLoading
          ? [0, 1, 2].map((i) => <ManagedProjectCardSkeleton key={i} />)
          : data!.projects.length === 0
          ? <EmptyInline message="No projects assigned yet." />
          : data!.projects.slice(0, 4).map((p) => (
              <ManagedProjectCard key={p.id} project={p} />
            ))}

        {/* ── Activity feed ─────────────────────────────────────────────── */}
        {(isLoading || (data && (data.recentMessages.length > 0 || data.recentActivity.length > 0))) && (
          <>
            <SectionHeader
              title="Recent Activity"
              icon={<Activity size={14} color={COLORS.primary} />}
              accent={COLORS.primary}
            />
            <View style={styles.feedCard}>
              {isLoading
                ? [0, 1, 2, 3].map((i) => <FeedItemSkeleton key={i} />)
                : buildFeed(data!).map((item) =>
                    item.type === "message"
                      ? <MessageFeedItem key={`msg-${item.data.id}`} item={item.data as never} />
                      : <UpdateFeedItem  key={`upd-${item.data.id}`} item={item.data as never} />
                  )}
            </View>
          </>
        )}

        {/* ── Empty state ───────────────────────────────────────────────── */}
        {!isLoading && data && data.projects.length === 0 && data.recentMessages.length === 0 && (
          <View style={styles.fullEmpty}>
            <Text style={styles.emptyIcon}>🏗️</Text>
            <Text style={styles.emptyTitle}>Nothing here yet</Text>
            <Text style={styles.emptySub}>Your assigned projects and client activity will appear here.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ── Helpers ── */

function buildFeed(data: NonNullable<ReturnType<typeof useManagerDashboard>["data"]>) {
  const messages = data.recentMessages.map((m) => ({ type: "message" as const, ts: m.createdAt, data: m }));
  const updates  = data.recentActivity.map((u) => ({ type: "update"  as const, ts: u.createdAt, data: u }));
  return [...messages, ...updates]
    .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
    .slice(0, 10);
}

function SectionHeader({
  title, icon, accent, action,
}: {
  title:   string;
  icon?:   React.ReactNode;
  accent?: string;
  action?: { label: string; onPress: () => void };
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderLeft}>
        {icon}
        <Text style={[styles.sectionTitle, { marginTop: 0 }]}>{title}</Text>
      </View>
      {action && (
        <TouchableOpacity onPress={action.onPress} activeOpacity={0.75}>
          <Text style={[styles.seeAll, { color: accent ?? COLORS.primary }]}>{action.label}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function EmptyInline({ message }: { message: string }) {
  return (
    <View style={styles.emptyInline}>
      <Text style={styles.emptyInlineText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: COLORS.zinc50 },
  scroll: { padding: 16, paddingBottom: 40, gap: 12 },
  centred:{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },

  header: {
    flexDirection:  "row",
    alignItems:     "flex-start",
    justifyContent: "space-between",
    marginBottom:   4,
  },
  greeting: { fontSize: 13, color: COLORS.zinc400 },
  name:     { fontSize: 24, fontWeight: "900", color: COLORS.primary, marginTop: 2 },
  role: {
    fontSize:      11,
    color:         COLORS.accent,
    fontWeight:    "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop:     3,
  },
  alertPill: {
    flexDirection:     "row",
    alignItems:        "center",
    gap:               5,
    backgroundColor:   "#fef9c3",
    borderRadius:      16,
    paddingHorizontal: 10,
    paddingVertical:   5,
    borderWidth:       1,
    borderColor:       COLORS.yellow + "60",
  },
  alertPillText: { fontSize: 11, fontWeight: "700", color: "#713f12" },

  statsGrid: {
    flexDirection: "row",
    gap:           10,
    flexWrap:      "wrap",
  },

  sectionHeader: {
    flexDirection:  "row",
    alignItems:     "center",
    justifyContent: "space-between",
    marginTop:      4,
  },
  sectionHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: COLORS.zinc700, marginTop: 4 },
  seeAll:       { fontSize: 12, fontWeight: "600" },

  feedCard: {
    backgroundColor: COLORS.white,
    borderRadius:    16,
    padding:         14,
    shadowColor:     "#000",
    shadowOffset:    { width: 0, height: 1 },
    shadowOpacity:   0.06,
    shadowRadius:    5,
    elevation:       2,
  },

  errorText:  { fontSize: 14, color: COLORS.red, textAlign: "center" },
  retryBtn:   { backgroundColor: COLORS.primary, borderRadius: 20, paddingHorizontal: 20, paddingVertical: 8 },
  retryLabel: { color: COLORS.white, fontWeight: "700", fontSize: 13 },

  fullEmpty:  { alignItems: "center", gap: 8, paddingVertical: 40 },
  emptyIcon:  { fontSize: 44 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: COLORS.zinc700, textAlign: "center" },
  emptySub:   { fontSize: 13, color: COLORS.zinc400, textAlign: "center", lineHeight: 18 },

  emptyInline: {
    backgroundColor: COLORS.zinc100,
    borderRadius:    12,
    paddingVertical: 20,
    alignItems:      "center",
  },
  emptyInlineText: { fontSize: 13, color: COLORS.zinc400 },

  sk: { backgroundColor: COLORS.zinc100 },
});
