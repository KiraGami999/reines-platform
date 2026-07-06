import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { Search, AlertCircle, FolderOpen, RefreshCw, Clock } from "lucide-react-native";
import { useProjects } from "@/hooks/useProjects";
import { COLORS, PROJECT_STATUS_CONFIG } from "@/constants";
import { ProjectCard, ProjectCardSkeleton } from "@/components/projects/ProjectCard";
import { StatusFilter } from "@/components/projects/StatusFilter";
import { AcceptProjectButton } from "@/components/projects/AcceptProjectButton";
import type { MobileProject, ProjectStatus } from "@/types";

type FilterOption = "ALL" | ProjectStatus;

function ListSkeleton() {
  return (
    <View style={{ padding: 20 }}>
      {[1, 2, 3].map((k) => <ProjectCardSkeleton key={k} />)}
    </View>
  );
}

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <View style={styles.empty}>
      <FolderOpen size={48} color="#d4d4d8" />
      <Text style={styles.emptyTitle}>
        {filtered ? "No matching projects" : "No projects assigned yet"}
      </Text>
      <Text style={styles.emptySub}>
        {filtered
          ? "Try a different filter or search term."
          : "Projects assigned to you by an admin will appear here."}
      </Text>
    </View>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={styles.empty}>
      <AlertCircle size={40} color={COLORS.red} />
      <Text style={styles.emptyTitle}>Unable to load projects</Text>
      <Text style={styles.emptySub}>Check your connection and try again.</Text>
      <TouchableOpacity style={styles.retryBtn} onPress={onRetry} activeOpacity={0.8}>
        <RefreshCw size={14} color={COLORS.white} />
        <Text style={styles.retryText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
}

function PendingProjectCard({ project }: { project: MobileProject }) {
  const cfg = PROJECT_STATUS_CONFIG[project.status] ?? { label: project.status, color: COLORS.zinc400 };

  return (
    <View style={styles.pendingCard}>
      <View style={styles.pendingHeader}>
        <View style={[styles.pendingIcon, { backgroundColor: COLORS.yellow + "22" }]}>
          <Clock size={16} color={COLORS.yellow} />
        </View>
        <View style={styles.pendingBody}>
          <Text style={styles.pendingTitle} numberOfLines={1}>{project.title}</Text>
          <Text style={styles.pendingSub}>Client: {project.client.name}</Text>
          <View style={[styles.pendingBadge, { backgroundColor: cfg.color + "18" }]}>
            <Text style={[styles.pendingBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        </View>
      </View>
      <Text style={styles.pendingHint}>
        Accept this assignment to start managing progress, gallery updates, and client messages.
      </Text>
      <AcceptProjectButton projectId={project.id} compact />
    </View>
  );
}

export default function ManagerProjects() {
  const { data, isLoading, isError, refetch, isFetching } = useProjects();
  const [filter, setFilter] = useState<FilterOption>("ALL");
  const [search, setSearch] = useState("");

  const onRefresh = useCallback(() => { refetch(); }, [refetch]);

  const pending = useMemo(
    () => (data ?? []).filter((p) => !p.managerAccepted),
    [data]
  );

  const accepted = useMemo(
    () => (data ?? []).filter((p) => p.managerAccepted),
    [data]
  );

  const filtered = useMemo<MobileProject[]>(() => {
    return accepted.filter((p) => {
      const matchStatus = filter === "ALL" || p.status === filter;
      const q = search.toLowerCase();
      const matchSearch = search.length === 0 ||
        p.title.toLowerCase().includes(q) ||
        p.client.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [accepted, filter, search]);

  const counts = useMemo<Partial<Record<FilterOption, number>>>(() => {
    const result: Partial<Record<FilterOption, number>> = { ALL: accepted.length };
    for (const p of accepted) {
      result[p.status] = (result[p.status] ?? 0) + 1;
    }
    return result;
  }, [accepted]);

  return (
    <View style={styles.root}>
      <View style={styles.searchWrap}>
        <Search size={15} color={COLORS.zinc400} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search projects or clients…"
          placeholderTextColor={COLORS.zinc400}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      <StatusFilter selected={filter} onChange={setFilter} counts={counts} />

      {isLoading ? (
        <ListSkeleton />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ProjectCard project={item} routeBase="/(manager)/projects" />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            pending.length === 0 ? (
              <EmptyState filtered={filter !== "ALL" || search.length > 0} />
            ) : null
          }
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isLoading}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
          ListHeaderComponent={
            <>
              {pending.length > 0 && (
                <View style={styles.pendingSection}>
                  <Text style={styles.sectionTitle}>Pending acceptance ({pending.length})</Text>
                  {pending.map((project) => (
                    <PendingProjectCard key={project.id} project={project} />
                  ))}
                </View>
              )}
              {accepted.length > 0 && (
                <Text style={styles.resultCount}>
                  {filtered.length} of {accepted.length} accepted project{accepted.length !== 1 ? "s" : ""}
                </Text>
              )}
            </>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: COLORS.zinc50,
  },
  searchWrap: {
    flexDirection:     "row",
    alignItems:        "center",
    backgroundColor:   COLORS.white,
    marginHorizontal:  20,
    marginTop:         16,
    borderRadius:      12,
    paddingHorizontal: 12,
    borderWidth:       1,
    borderColor:       COLORS.zinc200,
    shadowColor:       "#000",
    shadowOffset:      { width: 0, height: 1 },
    shadowOpacity:     0.05,
    shadowRadius:      3,
    elevation:         1,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex:     1,
    height:   42,
    fontSize: 14,
    color:    COLORS.zinc900,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom:     32,
  },
  pendingSection: {
    marginBottom: 16,
    gap:          10,
  },
  sectionTitle: {
    fontSize:     13,
    fontWeight:   "700",
    color:        COLORS.zinc700,
    marginBottom: 4,
  },
  pendingCard: {
    backgroundColor: COLORS.white,
    borderRadius:    14,
    padding:         14,
    borderWidth:     1,
    borderColor:     "#fde68a",
    gap:             12,
    marginBottom:    4,
  },
  pendingHeader: {
    flexDirection: "row",
    gap:           10,
  },
  pendingIcon: {
    width:          36,
    height:         36,
    borderRadius:   18,
    alignItems:     "center",
    justifyContent: "center",
  },
  pendingBody: { flex: 1, gap: 4 },
  pendingTitle: {
    fontSize:   15,
    fontWeight: "700",
    color:      COLORS.zinc900,
  },
  pendingSub: {
    fontSize: 12,
    color:    COLORS.zinc500,
  },
  pendingBadge: {
    alignSelf:         "flex-start",
    borderRadius:      8,
    paddingHorizontal: 7,
    paddingVertical:   2,
    marginTop:         2,
  },
  pendingBadgeText: {
    fontSize:   10,
    fontWeight: "700",
  },
  pendingHint: {
    fontSize:   12,
    color:      COLORS.zinc500,
    lineHeight: 17,
  },
  resultCount: {
    fontSize:     12,
    color:        COLORS.zinc400,
    fontWeight:   "500",
    marginBottom: 12,
    marginTop:    4,
  },
  empty: {
    flex:           1,
    alignItems:     "center",
    justifyContent: "center",
    padding:        32,
    marginTop:      40,
  },
  emptyTitle: {
    fontSize:   16,
    fontWeight: "700",
    color:      COLORS.zinc700,
    marginTop:  16,
  },
  emptySub: {
    fontSize:   13,
    color:      COLORS.zinc400,
    textAlign:  "center",
    lineHeight: 18,
    marginTop:  6,
    maxWidth:   260,
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
});
