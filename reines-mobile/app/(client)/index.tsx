import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import {
  FolderOpen,
  CreditCard,
  Star,
  MessageCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react-native";
import { useAuth }           from "@/hooks/useAuth";
import { useClientDashboard } from "@/hooks/useDashboard";
import { COLORS, PAYMENT_STATUS_CONFIG } from "@/constants";
import { formatMWK }         from "@/lib/format";
import { StatCard, StatCardSkeleton }         from "@/components/dashboard/StatCard";
import { ProjectCard, ProjectCardSkeleton }   from "@/components/dashboard/ProjectCard";
import { UpdateCard, UpdateCardSkeleton }     from "@/components/dashboard/UpdateCard";
import { ConversationRow, ConversationRowSkeleton } from "@/components/dashboard/ConversationRow";
import { SectionHeader }                      from "@/components/dashboard/SectionHeader";

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function DashboardSkeleton() {
  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} scrollEnabled={false}>
      {/* Greeting skeleton */}
      <View style={styles.hero}>
        <View style={[styles.skeleton, { width: 100, height: 13, marginBottom: 6 }]} />
        <View style={[styles.skeleton, { width: 180, height: 28 }]} />
      </View>

      {/* Stat row */}
      <View style={styles.statsRow}>
        <StatCardSkeleton style={{ flex: 1 }} />
        <StatCardSkeleton style={{ flex: 1 }} />
        <StatCardSkeleton style={{ flex: 1 }} />
        <StatCardSkeleton style={{ flex: 1 }} />
      </View>

      {/* Projects section */}
      <View style={styles.section}>
        <View style={[styles.skeleton, { width: 120, height: 14, marginBottom: 14 }]} />
        <ProjectCardSkeleton />
        <ProjectCardSkeleton />
      </View>

      {/* Updates section */}
      <View style={styles.section}>
        <View style={[styles.skeleton, { width: 110, height: 14, marginBottom: 14 }]} />
        <UpdateCardSkeleton />
        <UpdateCardSkeleton />
      </View>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Error state
// ---------------------------------------------------------------------------

function DashboardError({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={styles.centred}>
      <AlertCircle size={40} color={COLORS.red} />
      <Text style={styles.errorTitle}>Unable to load dashboard</Text>
      <Text style={styles.errorSub}>Check your connection and try again.</Text>
      <TouchableOpacity style={styles.retryBtn} onPress={onRetry} activeOpacity={0.8}>
        <RefreshCw size={14} color={COLORS.white} />
        <Text style={styles.retryText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function ClientDashboard() {
  const { user }  = useAuth();
  const router    = useRouter();
  const { data, isLoading, isError, refetch, isFetching } = useClientDashboard();

  const onRefresh = useCallback(() => { refetch(); }, [refetch]);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) return <DashboardSkeleton />;

  // ── Error ────────────────────────────────────────────────────────────────
  if (isError || !data) {
    return (
      <View style={styles.root}>
        <DashboardError onRetry={() => refetch()} />
      </View>
    );
  }

  // ── Helpers ──────────────────────────────────────────────────────────────
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  const pendingMWK  = parseFloat(data.payments.pendingAmount || "0");
  const loyaltyBal  = data.loyalty.balance;
  const msgCount    = data.messages.recentCount;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isFetching && !isLoading}
          onRefresh={onRefresh}
          tintColor={COLORS.primary}
          colors={[COLORS.primary]}
        />
      }
    >
      {/* ── Greeting ─────────────────────────────────────────────────── */}
      <View style={styles.hero}>
        <Text style={styles.greeting}>{greeting},</Text>
        <Text style={styles.name}>{user?.name?.split(" ")[0] ?? "Client"}</Text>
        <Text style={styles.heroCopy}>Here's an overview of your work with us.</Text>
      </View>

      {/* ── Stat cards ───────────────────────────────────────────────── */}
      <View style={styles.statsRow}>
        <StatCard
          label="Projects"
          value={data.projects.totalCount}
          subtitle={`${data.projects.active.length} active`}
          accent={COLORS.primary}
          icon={<FolderOpen size={14} color={COLORS.primary} />}
          style={{ flex: 1 }}
        />
        <StatCard
          label="Pending"
          value={data.payments.pendingCount > 0 ? formatMWK(pendingMWK) : "Clear"}
          subtitle={data.payments.pendingCount > 0 ? `${data.payments.pendingCount} payment${data.payments.pendingCount > 1 ? "s" : ""}` : "All paid"}
          accent={data.payments.pendingCount > 0 ? COLORS.yellow : COLORS.green}
          icon={<CreditCard size={14} color={data.payments.pendingCount > 0 ? COLORS.yellow : COLORS.green} />}
          style={{ flex: 1 }}
        />
        <StatCard
          label="Points"
          value={loyaltyBal.toLocaleString()}
          subtitle={data.loyalty.tier}
          accent={loyaltyBal > 0 ? "#f59e0b" : COLORS.zinc400}
          icon={<Star size={14} color={loyaltyBal > 0 ? "#f59e0b" : COLORS.zinc400} />}
          style={{ flex: 1 }}
        />
        <StatCard
          label="Messages"
          value={msgCount}
          subtitle={msgCount === 1 ? "new this week" : "this week"}
          accent={msgCount > 0 ? COLORS.primary : COLORS.zinc400}
          icon={<MessageCircle size={14} color={msgCount > 0 ? COLORS.primary : COLORS.zinc400} />}
          style={{ flex: 1 }}
        />
      </View>

      {/* ── Active projects ──────────────────────────────────────────── */}
      <View style={styles.section}>
        <SectionHeader
          title="Active Projects"
          actionLabel={data.projects.totalCount > 4 ? "See all" : undefined}
          onAction={() => router.push("/(client)/projects" as never)}
        />

        {data.projects.active.length === 0 ? (
          <View style={styles.emptyCard}>
            <FolderOpen size={28} color="#d4d4d8" />
            <Text style={styles.emptyTitle}>No active projects</Text>
            <Text style={styles.emptySub}>Your projects will appear here once started.</Text>
          </View>
        ) : (
          data.projects.active.map((p) => <ProjectCard key={p.id} project={p} />)
        )}
      </View>

      {/* ── Recent updates ───────────────────────────────────────────── */}
      <View style={styles.section}>
        <SectionHeader
          title="Recent Updates"
          actionLabel={data.updates.length > 0 ? "All projects" : undefined}
          onAction={() => router.push("/(client)/projects" as never)}
        />

        {data.updates.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No updates yet</Text>
            <Text style={styles.emptySub}>Progress updates will show here when your manager posts them.</Text>
          </View>
        ) : (
          data.updates.map((u) => <UpdateCard key={u.id} update={u} />)
        )}
      </View>

      {/* ── Recent messages ──────────────────────────────────────────── */}
      <View style={styles.section}>
        <SectionHeader
          title="Messages"
          actionLabel={data.messages.conversations.length > 0 ? "Open inbox" : undefined}
          onAction={() => router.push("/(client)/messages" as never)}
        />

        {data.messages.conversations.length === 0 ? (
          <View style={styles.emptyCard}>
            <MessageCircle size={28} color="#d4d4d8" />
            <Text style={styles.emptyTitle}>No conversations yet</Text>
            <Text style={styles.emptySub}>Messages from your project manager will appear here.</Text>
          </View>
        ) : (
          <View style={styles.conversationsCard}>
            {data.messages.conversations.map((conv, idx) => (
              <React.Fragment key={conv.projectId}>
                <ConversationRow conversation={conv} currentUserId={user?.id ?? ""} />
                {idx < data.messages.conversations.length - 1 && (
                  <View style={styles.divider} />
                )}
              </React.Fragment>
            ))}
          </View>
        )}
      </View>

      {/* ── Pending payments quick-list ──────────────────────────────── */}
      {data.payments.pendingCount > 0 && (
        <View style={styles.section}>
          <SectionHeader
            title="Payments Due"
            actionLabel="Pay now"
            onAction={() => router.push("/(client)/payments" as never)}
          />
          <View style={styles.paymentAlert}>
            <CreditCard size={18} color={COLORS.yellow} />
            <Text style={styles.paymentAlertText}>
              You have {data.payments.pendingCount} pending payment
              {data.payments.pendingCount > 1 ? "s" : ""} totalling{" "}
              <Text style={styles.paymentAlertAmount}>{formatMWK(pendingMWK)}</Text>.
            </Text>
          </View>
        </View>
      )}

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const CARD_SHADOW = {
  shadowColor:   "#000",
  shadowOffset:  { width: 0, height: 1 },
  shadowOpacity: 0.06,
  shadowRadius:  4,
  elevation:     2,
} as const;

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: COLORS.zinc50 },
  content: { padding: 20, paddingBottom: 40 },

  // Greeting hero
  hero: {
    marginBottom: 20,
  },
  greeting: {
    fontSize: 13,
    color:    COLORS.zinc500,
    fontWeight: "500",
  },
  name: {
    fontSize:      28,
    fontWeight:    "800",
    color:         COLORS.primary,
    marginTop:     2,
    letterSpacing: -0.5,
  },
  heroCopy: {
    fontSize:  13,
    color:     COLORS.zinc400,
    marginTop: 4,
  },

  // Stats row
  statsRow: {
    flexDirection: "row",
    gap:           8,
    marginBottom:  24,
  },

  // Sections
  section: {
    marginBottom: 24,
  },

  // Conversations card wrapper
  conversationsCard: {
    backgroundColor: COLORS.white,
    borderRadius:    14,
    paddingHorizontal: 14,
    ...CARD_SHADOW,
  },
  divider: {
    height:           1,
    backgroundColor:  COLORS.zinc100,
  },

  // Payment alert banner
  paymentAlert: {
    flexDirection:    "row",
    alignItems:       "center",
    backgroundColor:  COLORS.yellow + "15",
    borderRadius:     12,
    padding:          14,
    gap:              10,
    borderLeftWidth:  3,
    borderLeftColor:  COLORS.yellow,
  },
  paymentAlertText: {
    flex:       1,
    fontSize:   13,
    color:      COLORS.zinc700,
    lineHeight: 18,
  },
  paymentAlertAmount: {
    fontWeight: "700",
    color:      COLORS.yellow,
  },

  // Empty states
  emptyCard: {
    backgroundColor: COLORS.white,
    borderRadius:    14,
    padding:         28,
    alignItems:      "center",
    ...CARD_SHADOW,
  },
  emptyTitle: {
    fontSize:   14,
    fontWeight: "700",
    color:      COLORS.zinc700,
    marginTop:  12,
    marginBottom: 4,
  },
  emptySub: {
    fontSize:  12,
    color:     COLORS.zinc400,
    textAlign: "center",
    lineHeight: 17,
    maxWidth:  220,
  },

  // Error state
  centred: {
    flex:           1,
    alignItems:     "center",
    justifyContent: "center",
    padding:        32,
  },
  errorTitle: {
    fontSize:   16,
    fontWeight: "700",
    color:      COLORS.zinc900,
    marginTop:  16,
  },
  errorSub: {
    fontSize:  13,
    color:     COLORS.zinc500,
    marginTop: 6,
    textAlign: "center",
  },
  retryBtn: {
    flexDirection:    "row",
    alignItems:       "center",
    backgroundColor:  COLORS.primary,
    borderRadius:     10,
    paddingVertical:  10,
    paddingHorizontal: 18,
    gap:              8,
    marginTop:        20,
  },
  retryText: {
    color:      COLORS.white,
    fontWeight: "700",
    fontSize:   14,
  },

  // Skeleton helper
  skeleton: {
    backgroundColor: COLORS.zinc100,
    borderRadius:    6,
  },

});
