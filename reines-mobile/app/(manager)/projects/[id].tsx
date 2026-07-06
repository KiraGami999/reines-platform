import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  User,
  CalendarDays,
  DollarSign,
  Flag,
  MessageCircle,
  ImageIcon,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  Clock,
} from "lucide-react-native";
import { useProject }           from "@/hooks/useProjects";
import { useMilestones }        from "@/hooks/useMilestones";
import { COLORS, PROJECT_STATUS_CONFIG } from "@/constants";
import { formatMWK, shortDate } from "@/lib/format";
import { MilestoneProgressBar } from "@/components/milestones/MilestoneProgressBar";
import { MilestoneCard }        from "@/components/milestones/MilestoneCard";
import { AcceptProjectButton }  from "@/components/projects/AcceptProjectButton";

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function Skeleton() {
  return (
    <View style={{ padding: 16, gap: 12 }}>
      {[1, 2, 3].map((k) => (
        <View key={k} style={[styles.card, { padding: 14 }]}>
          <View style={[styles.sk, { width: 150, height: 14, marginBottom: 8 }]} />
          <View style={[styles.sk, { width: "80%", height: 10, marginBottom: 4 }]} />
          <View style={[styles.sk, { width: "60%", height: 10 }]} />
        </View>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function ManagerProjectDetail() {
  const { id }  = useLocalSearchParams<{ id: string }>();
  const router  = useRouter();

  const { data: project, isLoading, isError, refetch, isRefetching } =
    useProject(id);
  const { data: milestoneData } = useMilestones(id ?? "");

  const onRefresh = useCallback(() => refetch(), [refetch]);

  // ---------- states --------------------------------------------------------

  if (isLoading) return <Skeleton />;

  if (isError || !project) {
    return (
      <View style={styles.centerState}>
        <AlertCircle size={36} color={COLORS.red} />
        <Text style={styles.centerTitle}>Couldn't load project</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
          <RefreshCw size={14} color={COLORS.primary} />
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusConfig = PROJECT_STATUS_CONFIG[project.status] ?? {
    label: project.status, color: COLORS.zinc500,
  };

  // ---------- render --------------------------------------------------------

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.scroll}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={onRefresh}
          colors={[COLORS.primary]}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Back */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <ArrowLeft size={18} color={COLORS.zinc600} />
        <Text style={styles.backLabel}>Projects</Text>
      </TouchableOpacity>

      {/* Hero */}
      <View style={[styles.hero, { borderLeftColor: statusConfig.color }]}>
        <Text style={styles.heroTitle}>{project.title}</Text>
        <View style={[styles.heroBadge, { backgroundColor: statusConfig.color + "20" }]}>
          <View style={[styles.dot, { backgroundColor: statusConfig.color }]} />
          <Text style={[styles.heroBadgeLabel, { color: statusConfig.color }]}>
            {statusConfig.label}
          </Text>
        </View>
        {project.description ? (
          <Text style={styles.heroDesc}>{project.description}</Text>
        ) : null}
      </View>

      {!project.managerAccepted && (
        <View style={styles.acceptCard}>
          <View style={styles.acceptHeader}>
            <Clock size={18} color={COLORS.yellow} />
            <Text style={styles.acceptTitle}>Pending acceptance</Text>
          </View>
          <Text style={styles.acceptBody}>
            Accept this assignment to unlock gallery uploads, milestones, and client messaging.
          </Text>
          <AcceptProjectButton projectId={project.id} onAccepted={() => refetch()} />
        </View>
      )}

      {/* Quick action buttons */}
      {project.managerAccepted && (
      <View style={styles.actions}>
        <ActionBtn
          icon={<Flag size={16} color={COLORS.primary} />}
          label="Milestones"
          sub={
            milestoneData
              ? `${milestoneData.summary.completed}/${milestoneData.summary.total} done`
              : "View"
          }
          onPress={() =>
            router.push(`/(manager)/milestones/${project.id}` as never)
          }
        />
        <ActionBtn
          icon={<MessageCircle size={16} color={COLORS.primary} />}
          label="Messages"
          sub="Chat with client"
          onPress={() =>
            router.push(`/(manager)/messages/${project.id}` as never)
          }
        />
        <ActionBtn
          icon={<ImageIcon size={16} color={COLORS.primary} />}
          label="Gallery"
          sub="Upload updates"
          onPress={() => router.push("/(manager)/gallery" as never)}
        />
      </View>
      )}

      {/* Milestone progress */}
      {milestoneData && milestoneData.summary.total > 0 && (
        <>
          <MilestoneProgressBar summary={milestoneData.summary} />
          {/* Recent milestones preview (up to 3) */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Milestones</Text>
            <TouchableOpacity
              onPress={() =>
                router.push(`/(manager)/milestones/${project.id}` as never)
              }
            >
              <Text style={styles.sectionLink}>Manage all →</Text>
            </TouchableOpacity>
          </View>
          {milestoneData.milestones.slice(0, 3).map((m, idx) => (
            <MilestoneCard
              key={m.id}
              milestone={m}
              showConnector={idx < 2}
            />
          ))}
        </>
      )}

      {milestoneData && milestoneData.summary.total === 0 && (
        <TouchableOpacity
          style={styles.addMilestonesPrompt}
          onPress={() =>
            router.push(`/(manager)/milestones/${project.id}` as never)
          }
          activeOpacity={0.85}
        >
          <Flag size={16} color={COLORS.primary} />
          <Text style={styles.addMilestonesText}>
            No milestones yet — tap to add your first one
          </Text>
          <ChevronRight size={16} color={COLORS.primary} />
        </TouchableOpacity>
      )}

      {/* Project details */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <CalendarDays size={15} color={COLORS.primary} />
          <Text style={styles.cardTitle}>Project Details</Text>
        </View>
        <InfoRow label="Status"   value={statusConfig.label} />
        <InfoRow label="Client"   value={project.client?.name ?? "—"} />
        {project.startDate && <InfoRow label="Start" value={shortDate(project.startDate)} />}
        {project.endDate   && <InfoRow label="End"   value={shortDate(project.endDate)} />}
        <InfoRow label="Created"  value={shortDate(project.createdAt)} />
        <InfoRow
          label="Updates"
          value={`${project.updates.length} update${project.updates.length !== 1 ? "s" : ""}`}
        />
      </View>

      {/* Budget */}
      {project.budget ? (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <DollarSign size={15} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Budget</Text>
          </View>
          <InfoRow label="Total Budget" value={formatMWK(project.budget)} />
        </View>
      ) : null}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ActionBtn({
  icon,
  label,
  sub,
  onPress,
}: {
  icon:    React.ReactNode;
  label:   string;
  sub:     string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.actionBtn} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.actionIcon}>{icon}</View>
      <Text style={styles.actionLabel}>{label}</Text>
      <Text style={styles.actionSub}>{sub}</Text>
    </TouchableOpacity>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: COLORS.zinc50 },
  scroll: { padding: 16, paddingBottom: 40 },

  backBtn: {
    flexDirection:  "row",
    alignItems:     "center",
    gap:            4,
    marginBottom:   12,
  },
  backLabel: { fontSize: 13, color: COLORS.zinc500, fontWeight: "500" },

  hero: {
    backgroundColor: COLORS.white,
    borderRadius:    12,
    padding:         16,
    borderLeftWidth: 4,
    marginBottom:    14,
    gap:             6,
    shadowColor:     "#000",
    shadowOffset:    { width: 0, height: 1 },
    shadowOpacity:   0.06,
    shadowRadius:    5,
    elevation:       2,
  },
  heroTitle: { fontSize: 18, fontWeight: "700", color: COLORS.zinc800 },
  heroBadge: {
    flexDirection: "row",
    alignItems:    "center",
    gap:           6,
    alignSelf:     "flex-start",
    paddingHorizontal: 10,
    paddingVertical:    4,
    borderRadius:   20,
  },
  dot:           { width: 8, height: 8, borderRadius: 4 },
  heroBadgeLabel:{ fontSize: 12, fontWeight: "600" },
  heroDesc:      { fontSize: 13, color: COLORS.zinc500, lineHeight: 18 },

  acceptCard: {
    backgroundColor: "#fffbeb",
    borderRadius:    12,
    padding:         14,
    marginBottom:    14,
    borderWidth:     1,
    borderColor:     "#fde68a",
    gap:             10,
  },
  acceptHeader: {
    flexDirection: "row",
    alignItems:    "center",
    gap:           8,
  },
  acceptTitle: {
    fontSize:   14,
    fontWeight: "700",
    color:      "#92400e",
  },
  acceptBody: {
    fontSize:   12,
    color:      COLORS.zinc600,
    lineHeight: 17,
  },

  // Quick actions
  actions:   { flexDirection: "row", gap: 10, marginBottom: 14 },
  actionBtn: {
    flex:            1,
    backgroundColor: COLORS.white,
    borderRadius:    12,
    padding:         12,
    alignItems:      "center",
    gap:             4,
    shadowColor:     "#000",
    shadowOffset:    { width: 0, height: 1 },
    shadowOpacity:   0.05,
    shadowRadius:    4,
    elevation:       2,
  },
  actionIcon:  { marginBottom: 2 },
  actionLabel: { fontSize: 12, fontWeight: "700", color: COLORS.zinc700 },
  actionSub:   { fontSize: 10, color: COLORS.zinc400, textAlign: "center" },

  // Section header
  sectionHeader: {
    flexDirection:   "row",
    justifyContent:  "space-between",
    alignItems:      "center",
    marginBottom:    8,
    marginTop:       4,
  },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: COLORS.zinc700 },
  sectionLink:  { fontSize: 12, color: COLORS.primary, fontWeight: "600" },

  // Add milestones prompt
  addMilestonesPrompt: {
    flexDirection:    "row",
    alignItems:       "center",
    gap:              8,
    backgroundColor:  COLORS.white,
    borderRadius:     12,
    padding:          14,
    marginBottom:     14,
    borderWidth:      1.5,
    borderColor:      COLORS.primary + "40",
    borderStyle:      "dashed",
  },
  addMilestonesText: { flex: 1, fontSize: 13, color: COLORS.primary, fontWeight: "500" },

  // Card
  card: {
    backgroundColor: COLORS.white,
    borderRadius:    12,
    padding:         14,
    marginBottom:    12,
    shadowColor:     "#000",
    shadowOffset:    { width: 0, height: 1 },
    shadowOpacity:   0.05,
    shadowRadius:    4,
    elevation:       2,
  },
  cardHeader: {
    flexDirection:  "row",
    alignItems:     "center",
    gap:            8,
    marginBottom:   12,
    paddingBottom:  10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.zinc100,
  },
  cardTitle: { fontSize: 14, fontWeight: "700", color: COLORS.zinc700 },

  infoRow: {
    flexDirection:   "row",
    justifyContent:  "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.zinc50,
  },
  infoLabel: { fontSize: 13, color: COLORS.zinc500 },
  infoValue: { fontSize: 13, fontWeight: "600", color: COLORS.zinc700, maxWidth: "55%" },

  // Error state
  centerState: {
    flex:        1,
    alignItems:  "center",
    justifyContent: "center",
    gap:         10,
  },
  centerTitle: { fontSize: 16, fontWeight: "700", color: COLORS.zinc700 },
  retryBtn:    { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  retryText:   { fontSize: 14, color: COLORS.primary, fontWeight: "600" },

  sk: { backgroundColor: COLORS.zinc100, borderRadius: 6 },
});
