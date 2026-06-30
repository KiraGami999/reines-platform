import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Plus,
  Flag,
  AlertCircle,
  RefreshCw,
  Filter,
} from "lucide-react-native";
import { COLORS }                  from "@/constants";
import {
  useMilestones,
  useCreateMilestone,
  useUpdateMilestone,
  useDeleteMilestone,
  useToggleMilestone,
}                                  from "@/hooks/useMilestones";
import { MilestoneCard }           from "@/components/milestones/MilestoneCard";
import { MilestoneProgressBar }    from "@/components/milestones/MilestoneProgressBar";
import { MilestoneFormSheet }      from "@/components/milestones/MilestoneFormSheet";
import type { Milestone, MilestoneStatus } from "@/types";

type FilterTab = "ALL" | "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

const FILTERS: { key: FilterTab; label: string }[] = [
  { key: "ALL",         label: "All"        },
  { key: "IN_PROGRESS", label: "Active"     },
  { key: "PENDING",     label: "Pending"    },
  { key: "COMPLETED",   label: "Completed"  },
  { key: "CANCELLED",   label: "Cancelled"  },
];

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function Skeleton() {
  return (
    <View style={{ padding: 16, gap: 12 }}>
      {[1, 2, 3].map((k) => (
        <View key={k} style={styles.skCard}>
          <View style={[styles.sk, { width: 150, height: 14, marginBottom: 8 }]} />
          <View style={[styles.sk, { width: "90%", height: 10, marginBottom: 4 }]} />
          <View style={[styles.sk, { width: "60%", height: 10 }]} />
        </View>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function ManagerMilestonesScreen() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const router        = useRouter();

  const [filter,      setFilter]      = useState<FilterTab>("ALL");
  const [sheetOpen,   setSheetOpen]   = useState(false);
  const [editTarget,  setEditTarget]  = useState<Milestone | null>(null);
  const [togglingId,  setTogglingId]  = useState<string | null>(null);
  const [deletingId,  setDeletingId]  = useState<string | null>(null);

  const { data, isLoading, isError, refetch, isRefetching } =
    useMilestones(projectId);

  const createMut = useCreateMilestone(projectId);
  const updateMut = useUpdateMilestone(projectId);
  const deleteMut = useDeleteMilestone(projectId);
  const { toggle } = useToggleMilestone(projectId);

  // ---------- handlers ------------------------------------------------------

  async function handleCreate(values: {
    title: string;
    description: string;
    dueDate: string;
  }) {
    try {
      await createMut.mutateAsync(values);
      setSheetOpen(false);
    } catch {
      Alert.alert("Error", "Failed to create milestone. Please try again.");
    }
  }

  async function handleEdit(values: {
    title: string;
    description: string;
    dueDate: string;
  }) {
    if (!editTarget) return;
    try {
      await updateMut.mutateAsync({
        milestoneId: editTarget.id,
        values: {
          title:       values.title,
          description: values.description || null,
          dueDate:     values.dueDate || null,
        },
      });
      setEditTarget(null);
    } catch {
      Alert.alert("Error", "Failed to save changes. Please try again.");
    }
  }

  async function handleToggle(milestoneId: string, status: MilestoneStatus) {
    setTogglingId(milestoneId);
    try {
      await toggle(milestoneId, status);
    } catch {
      Alert.alert("Error", "Failed to update status. Please try again.");
    } finally {
      setTogglingId(null);
    }
  }

  function confirmDelete(milestoneId: string) {
    Alert.alert(
      "Delete Milestone",
      "This action cannot be undone. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text:  "Delete",
          style: "destructive",
          onPress: async () => {
            setDeletingId(milestoneId);
            try {
              await deleteMut.mutateAsync(milestoneId);
            } catch {
              Alert.alert("Error", "Failed to delete milestone. Please try again.");
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  }

  // ---------- derived data --------------------------------------------------

  const allMilestones = data?.milestones ?? [];
  const filtered = filter === "ALL"
    ? allMilestones
    : allMilestones.filter((m) => m.status === filter);

  // ---------- render --------------------------------------------------------

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color={COLORS.zinc700} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {data?.projectTitle ?? "Milestones"}
          </Text>
          <Text style={styles.headerSub}>Milestone Management</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => { setEditTarget(null); setSheetOpen(true); }}
        >
          <Plus size={18} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {isLoading ? (
        <Skeleton />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Progress bar */}
          {data?.summary && data.summary.total > 0 ? (
            <MilestoneProgressBar summary={data.summary} />
          ) : null}

          {/* Filter tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterRow}
            contentContainerStyle={{ gap: 8, paddingHorizontal: 2 }}
          >
            {FILTERS.map((f) => {
              const count =
                f.key === "ALL"
                  ? allMilestones.length
                  : allMilestones.filter((m) => m.status === f.key).length;
              const active = filter === f.key;
              return (
                <TouchableOpacity
                  key={f.key}
                  style={[styles.filterTab, active && styles.filterTabActive]}
                  onPress={() => setFilter(f.key)}
                >
                  <Text
                    style={[styles.filterText, active && styles.filterTextActive]}
                  >
                    {f.label}
                    {count > 0 ? ` (${count})` : ""}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Empty state */}
          {filtered.length === 0 ? (
            <EmptyState
              isAll={filter === "ALL"}
              onAdd={() => { setEditTarget(null); setSheetOpen(true); }}
            />
          ) : (
            <View style={styles.list}>
              {filtered.map((m, idx) => (
                <MilestoneCard
                  key={m.id}
                  milestone={m}
                  onToggle={handleToggle}
                  onEdit={(milestone) => {
                    setEditTarget(milestone);
                    setSheetOpen(true);
                  }}
                  onDelete={confirmDelete}
                  isToggling={togglingId === m.id}
                  isDeleting={deletingId === m.id}
                  showConnector={idx < filtered.length - 1}
                />
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* Create / Edit sheet */}
      <MilestoneFormSheet
        visible={sheetOpen}
        onClose={() => { setSheetOpen(false); setEditTarget(null); }}
        onSubmit={editTarget ? handleEdit : handleCreate}
        isLoading={createMut.isPending || updateMut.isPending}
        editTarget={editTarget}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function EmptyState({
  isAll,
  onAdd,
}: {
  isAll: boolean;
  onAdd: () => void;
}) {
  return (
    <View style={styles.empty}>
      <Flag size={36} color={COLORS.zinc300} />
      <Text style={styles.emptyTitle}>
        {isAll ? "No milestones yet" : "None in this category"}
      </Text>
      <Text style={styles.emptySub}>
        {isAll
          ? "Create your first milestone to track project progress."
          : "Try a different filter above."}
      </Text>
      {isAll ? (
        <TouchableOpacity style={styles.emptyBtn} onPress={onAdd}>
          <Plus size={14} color={COLORS.white} />
          <Text style={styles.emptyBtnText}>Add Milestone</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={styles.empty}>
      <AlertCircle size={36} color={COLORS.red} />
      <Text style={styles.emptyTitle}>Couldn't load milestones</Text>
      <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>
        <RefreshCw size={14} color={COLORS.primary} />
        <Text style={styles.retryText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.zinc50 },

  header: {
    flexDirection:    "row",
    alignItems:       "center",
    paddingHorizontal: 16,
    paddingTop:       56,
    paddingBottom:    16,
    backgroundColor:  COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.zinc100,
    gap:              12,
  },
  backBtn:    { padding: 4 },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 16, fontWeight: "700", color: COLORS.zinc800 },
  headerSub:  { fontSize: 12, color: COLORS.zinc500 },
  addBtn: {
    width:           36,
    height:          36,
    borderRadius:    18,
    backgroundColor: COLORS.primary,
    alignItems:      "center",
    justifyContent:  "center",
  },

  scroll: { padding: 16, paddingBottom: 40 },

  filterRow:   { marginBottom: 16 },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical:    7,
    borderRadius:       20,
    backgroundColor:    COLORS.zinc100,
  },
  filterTabActive:  { backgroundColor: COLORS.primary },
  filterText:      { fontSize: 13, fontWeight: "500", color: COLORS.zinc500 },
  filterTextActive: { color: COLORS.white, fontWeight: "700" },

  list: { gap: 0 },

  empty: {
    alignItems:  "center",
    paddingTop:  60,
    gap:         10,
  },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: COLORS.zinc700 },
  emptySub:   { fontSize: 13, color: COLORS.zinc400, textAlign: "center", maxWidth: 260 },
  emptyBtn: {
    flexDirection:    "row",
    alignItems:       "center",
    gap:              6,
    marginTop:        8,
    backgroundColor:  COLORS.primary,
    paddingHorizontal: 18,
    paddingVertical:   10,
    borderRadius:     24,
  },
  emptyBtnText: { fontSize: 14, fontWeight: "600", color: COLORS.white },

  retryBtn: {
    flexDirection: "row",
    alignItems:    "center",
    gap:           6,
    marginTop:     8,
  },
  retryText: { fontSize: 14, color: COLORS.primary, fontWeight: "600" },

  // skeleton
  skCard: {
    backgroundColor: COLORS.white,
    borderRadius:    12,
    padding:         14,
    marginBottom:    8,
  },
  sk: {
    backgroundColor: COLORS.zinc100,
    borderRadius:    6,
  },
});
