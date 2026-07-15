import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  User,
  CalendarDays,
  DollarSign,
  Clock,
  CheckCircle2,
  Circle,
  ImageIcon,
  FileText,
  MessageCircle,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  Flag,
} from "lucide-react-native";
import { useProject }           from "@/hooks/useProjects";
import { useMilestones }        from "@/hooks/useMilestones";
import { useAuth }              from "@/hooks/useAuth";
import { buildDocumentUrl } from "@/lib/media";
import { AuthenticatedImage } from "@/components/media/AuthenticatedImage";
import { COLORS, PROJECT_STATUS_CONFIG, PAYMENT_STATUS_CONFIG } from "@/constants";
import { formatMWK, shortDate, timeAgo, truncate } from "@/lib/format";
import { MilestoneProgressBar } from "@/components/milestones/MilestoneProgressBar";
import { MilestoneCard }        from "@/components/milestones/MilestoneCard";
import type { ProjectUpdate }   from "@/types";

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function DetailSkeleton() {
  return (
    <ScrollView style={styles.root} scrollEnabled={false}>
      <View style={styles.heroSkeleton}>
        <View style={[styles.sk, { width: 160, height: 22, marginBottom: 8 }]} />
        <View style={[styles.sk, { width: 80, height: 10 }]} />
      </View>
      <View style={styles.sectionWrap}>
        {[1,2,3].map((k) => (
          <View key={k} style={styles.card}>
            <View style={[styles.sk, { width: 100, height: 12, marginBottom: 12 }]} />
            <View style={[styles.sk, { width: "100%", height: 10, marginBottom: 6 }]} />
            <View style={[styles.sk, { width: "70%", height: 10 }]} />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Error state
// ---------------------------------------------------------------------------

function DetailError({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={styles.centred}>
      <AlertCircle size={40} color={COLORS.red} />
      <Text style={styles.errTitle}>Could not load project</Text>
      <Text style={styles.errSub}>Check your connection and try again.</Text>
      <TouchableOpacity style={styles.retryBtn} onPress={onRetry} activeOpacity={0.8}>
        <RefreshCw size={14} color={COLORS.white} />
        <Text style={styles.retryText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Section wrapper
// ---------------------------------------------------------------------------

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <View style={styles.sectionHeader}>
        {icon}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Info row helper
// ---------------------------------------------------------------------------

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Budget ring / bar
// ---------------------------------------------------------------------------

function BudgetBar({
  budget,
  paid,
  pending,
}: {
  budget: string | null;
  paid: string;
  pending: string;
}) {
  const total   = parseFloat(budget ?? "0");
  const paidNum = parseFloat(paid ?? "0");
  const pct     = total > 0 ? Math.min((paidNum / total) * 100, 100) : 0;

  return (
    <View>
      <View style={styles.budgetRow}>
        <View>
          <Text style={styles.budgetPaidLabel}>Paid</Text>
          <Text style={styles.budgetPaidValue}>{formatMWK(paidNum)}</Text>
        </View>
        {total > 0 && (
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.budgetPaidLabel}>Budget</Text>
            <Text style={styles.budgetPaidValue}>{formatMWK(total)}</Text>
          </View>
        )}
      </View>
      {total > 0 && (
        <>
          <View style={styles.budgetTrack}>
            <View style={[styles.budgetFill, { width: `${pct}%` }]} />
          </View>
          <Text style={styles.budgetPct}>{pct.toFixed(0)}% of budget paid</Text>
        </>
      )}
      {parseFloat(pending) > 0 && (
        <View style={styles.pendingChip}>
          <Text style={styles.pendingText}>
            {formatMWK(parseFloat(pending))} pending
          </Text>
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Timeline / update feed
// ---------------------------------------------------------------------------

function UpdateEntry({ update, isLast }: { update: ProjectUpdate; isLast: boolean }) {
  const { token } = useAuth();
  const hasImage = !!update.imageUrl;
  const hasDoc   = !!update.documentUrl;

  const openDocument = async () => {
    const url = buildDocumentUrl(update.documentUrl, token);
    if (url) await WebBrowser.openBrowserAsync(url);
  };

  return (
    <View style={styles.timelineEntry}>
      {/* Spine */}
      <View style={styles.spineLine}>
        <View style={styles.spineNode}>
          {update.progressPercent !== null ? (
            <CheckCircle2 size={16} color={COLORS.green} />
          ) : (
            <Circle size={16} color={COLORS.zinc300} />
          )}
        </View>
        {!isLast && <View style={styles.spineConnector} />}
      </View>

      {/* Content */}
      <View style={styles.timelineContent}>
        {update.progressPercent !== null && (
          <View style={styles.progressChip}>
            <TrendingUp size={10} color={COLORS.primary} />
            <Text style={styles.progressChipText}>{update.progressPercent}% complete</Text>
          </View>
        )}
        <Text style={styles.updateNote}>{update.note}</Text>

        {/* Thumbnail */}
        {hasImage && (
          <AuthenticatedImage
            url={update.imageUrl}
            style={styles.updateImage}
            resizeMode="cover"
          />
        )}

        {/* Document link */}
        {hasDoc && (
          <TouchableOpacity
            style={styles.docRow}
            onPress={openDocument}
          >
            <FileText size={13} color={COLORS.primary} />
            <Text style={styles.docName} numberOfLines={1}>
              {update.documentName ?? "Attached document"}
            </Text>
          </TouchableOpacity>
        )}

        <Text style={styles.updateTime}>{timeAgo(update.createdAt)}</Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function ClientProjectDetail() {
  const { id }    = useLocalSearchParams<{ id: string }>();
  const router    = useRouter();
  const { data: project, isLoading, isError, refetch, isFetching } = useProject(id);
  const { data: milestoneData } = useMilestones(id ?? "");

  const onRefresh = useCallback(() => { refetch(); }, [refetch]);

  if (isLoading) return <DetailSkeleton />;
  if (isError || !project) {
    return (
      <View style={styles.root}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={COLORS.zinc700} />
        </TouchableOpacity>
        <DetailError onRetry={() => refetch()} />
      </View>
    );
  }

  const statusConfig = PROJECT_STATUS_CONFIG[project.status] ?? { label: project.status, color: COLORS.zinc400 };
  const ps           = project.paymentSummary;

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
      {/* ── Hero ───────────────────────────────────────────────────── */}
      <View style={[styles.hero, { borderLeftColor: statusConfig.color }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={18} color={COLORS.zinc600} />
          <Text style={styles.backLabel}>Projects</Text>
        </TouchableOpacity>

        <Text style={styles.heroTitle}>{project.title}</Text>

        <View style={[styles.heroBadge, { backgroundColor: statusConfig.color + "20" }]}>
          <View style={[styles.heroDot, { backgroundColor: statusConfig.color }]} />
          <Text style={[styles.heroBadgeLabel, { color: statusConfig.color }]}>
            {statusConfig.label}
          </Text>
        </View>

        {project.description ? (
          <Text style={styles.heroDesc}>{project.description}</Text>
        ) : null}

        {/* Overall progress */}
        {project.latestProgress !== null && (
          <View style={styles.heroProgress}>
            <View style={styles.heroProgressTrack}>
              <View
                style={[
                  styles.heroProgressFill,
                  { width: `${project.latestProgress}%`, backgroundColor: statusConfig.color },
                ]}
              />
            </View>
            <Text style={styles.heroProgressLabel}>{project.latestProgress}%</Text>
          </View>
        )}
      </View>

      <View style={styles.sectionWrap}>

        {/* ── Project details ─────────────────────────────────────── */}
        <Section title="Project Details" icon={<FileText size={15} color={COLORS.primary} />}>
          <InfoRow label="Status"   value={statusConfig.label} />
          {project.startDate && <InfoRow label="Start date" value={shortDate(project.startDate)} />}
          {project.endDate   && <InfoRow label="End date"   value={shortDate(project.endDate)} />}
          <InfoRow label="Created"  value={shortDate(project.createdAt)} />
          <InfoRow label="Updates"  value={`${project.updates.length} progress update${project.updates.length !== 1 ? "s" : ""}`} />
        </Section>

        {/* ── Assigned manager ─────────────────────────────────────── */}
        <Section title="Project Manager" icon={<User size={15} color={COLORS.primary} />}>
          <View style={styles.managerCard}>
            <View style={styles.managerAvatar}>
              <Text style={styles.managerInitials}>
                {project.manager.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
              </Text>
            </View>
            <View style={styles.managerInfo}>
              <Text style={styles.managerName}>{project.manager.name}</Text>
              <Text style={styles.managerEmail}>{project.manager.email}</Text>
            </View>
            <TouchableOpacity
              style={styles.msgBtn}
              activeOpacity={0.8}
              onPress={() => router.push(`/(client)/messages/${project.id}` as never)}
            >
              <MessageCircle size={14} color={COLORS.primary} />
              <Text style={styles.msgBtnText}>Message</Text>
            </TouchableOpacity>
          </View>
        </Section>

        {/* ── Budget & payments ─────────────────────────────────────── */}
        {(project.budget || parseFloat(ps.paidTotal) > 0) && (
          <Section title="Budget & Payments" icon={<DollarSign size={15} color={COLORS.primary} />}>
            <BudgetBar
              budget={project.budget}
              paid={ps.paidTotal}
              pending={ps.pendingTotal}
            />
            {ps.paymentCount > 0 && (
              <TouchableOpacity
                style={styles.viewPaymentsBtn}
                activeOpacity={0.8}
                onPress={() => router.push("/(client)/payments" as never)}
              >
                <Text style={styles.viewPaymentsText}>View all payments →</Text>
              </TouchableOpacity>
            )}
          </Section>
        )}

        {/* ── Milestones ───────────────────────────────────────────── */}
        {milestoneData && milestoneData.summary.total > 0 && (
          <Section
            title="Milestones"
            icon={<Flag size={15} color={COLORS.primary} />}
          >
            <MilestoneProgressBar summary={milestoneData.summary} />
            {milestoneData.milestones.map((m, idx) => (
              <MilestoneCard
                key={m.id}
                milestone={m}
                showConnector={idx < milestoneData.milestones.length - 1}
              />
            ))}
          </Section>
        )}

        {/* ── Timeline / progress updates ───────────────────────────── */}
        <Section
          title="Progress Timeline"
          icon={<Clock size={15} color={COLORS.primary} />}
        >
          {project.updates.length === 0 ? (
            <View style={styles.noUpdates}>
              <Text style={styles.noUpdatesText}>
                No updates posted yet. Your manager will post progress updates here.
              </Text>
            </View>
          ) : (
            project.updates.map((u, idx) => (
              <UpdateEntry
                key={u.id}
                update={u}
                isLast={idx === project.updates.length - 1}
              />
            ))
          )}
        </Section>

      </View>

      <View style={{ height: 32 }} />
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
  shadowRadius:  5,
  elevation:     2,
} as const;

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: COLORS.zinc50 },
  content: { paddingBottom: 40 },

  // Hero
  hero: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingTop:        16,
    paddingBottom:     20,
    borderLeftWidth:   0,
    marginBottom:      16,
    gap:               8,
    ...CARD_SHADOW,
  },
  backBtn: {
    flexDirection: "row",
    alignItems:    "center",
    gap:           4,
    marginBottom:  8,
  },
  backLabel: {
    fontSize:   13,
    color:      COLORS.zinc500,
    fontWeight: "500",
  },
  heroTitle: {
    fontSize:      24,
    fontWeight:    "800",
    color:         COLORS.zinc900,
    letterSpacing: -0.5,
    lineHeight:    30,
  },
  heroBadge: {
    flexDirection:     "row",
    alignItems:        "center",
    alignSelf:         "flex-start",
    borderRadius:      20,
    paddingHorizontal: 10,
    paddingVertical:   4,
    gap:               5,
  },
  heroDot: {
    width:        6,
    height:       6,
    borderRadius: 3,
  },
  heroBadgeLabel: {
    fontSize:   12,
    fontWeight: "700",
  },
  heroDesc: {
    fontSize:   14,
    color:      COLORS.zinc500,
    lineHeight: 20,
  },
  heroProgress: {
    flexDirection: "row",
    alignItems:    "center",
    gap:           10,
    marginTop:     4,
  },
  heroProgressTrack: {
    flex:            1,
    height:          6,
    backgroundColor: COLORS.zinc100,
    borderRadius:    3,
    overflow:        "hidden",
  },
  heroProgressFill: {
    height:       "100%",
    borderRadius: 3,
  },
  heroProgressLabel: {
    fontSize:   13,
    fontWeight: "700",
    color:      COLORS.zinc700,
    width:      36,
    textAlign:  "right",
  },

  // Section wrappers
  sectionWrap: {
    paddingHorizontal: 16,
    gap:               12,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius:    16,
    padding:         16,
    ...CARD_SHADOW,
  },
  sectionHeader: {
    flexDirection:  "row",
    alignItems:     "center",
    gap:            8,
    marginBottom:   14,
    paddingBottom:  10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.zinc100,
  },
  sectionTitle: {
    fontSize:   14,
    fontWeight: "700",
    color:      COLORS.zinc900,
  },

  // Info rows
  infoRow: {
    flexDirection:  "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.zinc50,
  },
  infoLabel: {
    fontSize:   13,
    color:      COLORS.zinc500,
    fontWeight: "500",
  },
  infoValue: {
    fontSize:   13,
    color:      COLORS.zinc900,
    fontWeight: "600",
    textAlign:  "right",
    flex:       1,
    marginLeft: 16,
  },

  // Manager card
  managerCard: {
    flexDirection: "row",
    alignItems:    "center",
    gap:           12,
  },
  managerAvatar: {
    width:           44,
    height:          44,
    borderRadius:    22,
    backgroundColor: COLORS.primary,
    alignItems:      "center",
    justifyContent:  "center",
  },
  managerInitials: {
    fontSize:   15,
    fontWeight: "700",
    color:      COLORS.white,
  },
  managerInfo: {
    flex: 1,
  },
  managerName: {
    fontSize:   15,
    fontWeight: "700",
    color:      COLORS.zinc900,
  },
  managerEmail: {
    fontSize: 12,
    color:    COLORS.zinc400,
    marginTop: 2,
  },
  msgBtn: {
    flexDirection:     "row",
    alignItems:        "center",
    gap:               5,
    borderWidth:       1.5,
    borderColor:       COLORS.primary,
    borderRadius:      10,
    paddingHorizontal: 10,
    paddingVertical:   6,
  },
  msgBtnText: {
    fontSize:   12,
    fontWeight: "700",
    color:      COLORS.primary,
  },

  // Budget
  budgetRow: {
    flexDirection:  "row",
    justifyContent: "space-between",
    marginBottom:   10,
  },
  budgetPaidLabel: {
    fontSize: 11,
    color:    COLORS.zinc400,
    fontWeight: "500",
    marginBottom: 2,
  },
  budgetPaidValue: {
    fontSize:   16,
    fontWeight: "800",
    color:      COLORS.zinc900,
  },
  budgetTrack: {
    height:          8,
    backgroundColor: COLORS.zinc100,
    borderRadius:    4,
    overflow:        "hidden",
  },
  budgetFill: {
    height:          "100%",
    backgroundColor: COLORS.green,
    borderRadius:    4,
  },
  budgetPct: {
    fontSize:  11,
    color:     COLORS.zinc400,
    marginTop: 6,
  },
  pendingChip: {
    marginTop:         10,
    alignSelf:         "flex-start",
    backgroundColor:   COLORS.yellow + "20",
    borderRadius:      8,
    paddingHorizontal: 10,
    paddingVertical:   5,
    borderLeftWidth:   3,
    borderLeftColor:   COLORS.yellow,
  },
  pendingText: {
    fontSize:   12,
    fontWeight: "700",
    color:      COLORS.yellow,
  },
  viewPaymentsBtn: {
    marginTop:  12,
    alignSelf:  "flex-end",
  },
  viewPaymentsText: {
    fontSize:   13,
    fontWeight: "600",
    color:      COLORS.primary,
  },

  // Timeline
  noUpdates: {
    paddingVertical: 12,
  },
  noUpdatesText: {
    fontSize:  13,
    color:     COLORS.zinc400,
    lineHeight: 18,
  },
  timelineEntry: {
    flexDirection: "row",
    gap:           12,
    marginBottom:  4,
  },
  spineLine: {
    alignItems: "center",
    width:      20,
  },
  spineNode: {
    zIndex: 1,
  },
  spineConnector: {
    flex:            1,
    width:           2,
    backgroundColor: COLORS.zinc200,
    marginVertical:  2,
    minHeight:       20,
  },
  timelineContent: {
    flex:          1,
    paddingBottom: 16,
    gap:           6,
  },
  progressChip: {
    flexDirection:     "row",
    alignItems:        "center",
    gap:               4,
    alignSelf:         "flex-start",
    backgroundColor:   COLORS.primary + "12",
    borderRadius:      10,
    paddingHorizontal: 8,
    paddingVertical:   3,
  },
  progressChipText: {
    fontSize:   11,
    fontWeight: "700",
    color:      COLORS.primary,
  },
  updateNote: {
    fontSize:   13,
    color:      COLORS.zinc700,
    lineHeight: 19,
  },
  updateImage: {
    width:        "100%",
    height:       160,
    borderRadius: 10,
    marginTop:    4,
  },
  docRow: {
    flexDirection: "row",
    alignItems:    "center",
    gap:           6,
    backgroundColor: COLORS.primary + "10",
    borderRadius:  8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf:     "flex-start",
  },
  docName: {
    fontSize:   12,
    color:      COLORS.primary,
    fontWeight: "600",
    flex:       1,
  },
  updateTime: {
    fontSize: 11,
    color:    COLORS.zinc400,
  },

  // Skeleton
  heroSkeleton: {
    backgroundColor: COLORS.white,
    padding:         20,
    marginBottom:    16,
    ...CARD_SHADOW,
  },
  sk: {
    backgroundColor: COLORS.zinc100,
    borderRadius:    6,
  },

  // Error / centered
  centred: {
    flex:           1,
    alignItems:     "center",
    justifyContent: "center",
    padding:        32,
  },
  errTitle: {
    fontSize:   16,
    fontWeight: "700",
    color:      COLORS.zinc900,
    marginTop:  16,
  },
  errSub: {
    fontSize:  13,
    color:     COLORS.zinc500,
    marginTop: 6,
    textAlign: "center",
  },
  retryBtn: {
    flexDirection:     "row",
    alignItems:        "center",
    backgroundColor:   COLORS.primary,
    borderRadius:      10,
    paddingVertical:   10,
    paddingHorizontal: 18,
    gap:               8,
    marginTop:         20,
  },
  retryText: {
    color:      COLORS.white,
    fontWeight: "700",
    fontSize:   14,
  },

  zinc600: { color: "#52525b" },
  zinc300: { color: "#d4d4d8" },
});
