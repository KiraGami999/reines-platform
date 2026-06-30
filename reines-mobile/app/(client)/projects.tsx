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
import { Search, AlertCircle, FolderOpen, RefreshCw } from "lucide-react-native";
import { useProjects }    from "@/hooks/useProjects";
import { COLORS, PROJECT_STATUS_CONFIG } from "@/constants";
import { ProjectCard, ProjectCardSkeleton } from "@/components/projects/ProjectCard";
import { StatusFilter }   from "@/components/projects/StatusFilter";
import type { MobileProject, ProjectStatus } from "@/types";

type FilterOption = "ALL" | ProjectStatus;

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function ListSkeleton() {
  return (
    <View style={{ padding: 20 }}>
      {[1, 2, 3].map((k) => <ProjectCardSkeleton key={k} />)}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <View style={styles.empty}>
      <FolderOpen size={48} color="#d4d4d8" />
      <Text style={styles.emptyTitle}>
        {filtered ? "No matching projects" : "No projects yet"}
      </Text>
      <Text style={styles.emptySub}>
        {filtered
          ? "Try a different filter or search term."
          : "Your projects will appear here once assigned."}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Error state
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function ClientProjects() {
  const { data, isLoading, isError, refetch, isFetching } = useProjects();
  const [filter, setFilter]   = useState<FilterOption>("ALL");
  const [search, setSearch]   = useState("");

  const onRefresh = useCallback(() => { refetch(); }, [refetch]);

  // ── Filter + search ──────────────────────────────────────────────────────
  const filtered = useMemo<MobileProject[]>(() => {
    if (!data) return [];
    return data.filter((p) => {
      const matchStatus = filter === "ALL" || p.status === filter;
      const matchSearch = search.length === 0 ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.description?.toLowerCase().includes(search.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [data, filter, search]);

  // ── Counts per status (for filter tab badges) ────────────────────────────
  const counts = useMemo<Partial<Record<FilterOption, number>>>(() => {
    if (!data) return {};
    const result: Partial<Record<FilterOption, number>> = { ALL: data.length };
    for (const p of data) {
      result[p.status] = (result[p.status] ?? 0) + 1;
    }
    return result;
  }, [data]);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      {/* ── Search bar ─────────────────────────────────────────────── */}
      <View style={styles.searchWrap}>
        <Search size={15} color={COLORS.zinc400} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search projects…"
          placeholderTextColor={COLORS.zinc400}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      {/* ── Status filter tabs ─────────────────────────────────────── */}
      <StatusFilter selected={filter} onChange={setFilter} counts={counts} />

      {/* ── List ───────────────────────────────────────────────────── */}
      {isLoading ? (
        <ListSkeleton />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ProjectCard project={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState filtered={filter !== "ALL" || search.length > 0} />}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isLoading}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
          ListHeaderComponent={
            data && data.length > 0 ? (
              <Text style={styles.resultCount}>
                {filtered.length} of {data.length} project{data.length !== 1 ? "s" : ""}
              </Text>
            ) : null
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

  // Search
  searchWrap: {
    flexDirection:   "row",
    alignItems:      "center",
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    marginTop:       16,
    borderRadius:    12,
    paddingHorizontal: 12,
    borderWidth:     1,
    borderColor:     COLORS.zinc200,
    shadowColor:     "#000",
    shadowOffset:    { width: 0, height: 1 },
    shadowOpacity:   0.05,
    shadowRadius:    3,
    elevation:       1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex:     1,
    height:   42,
    fontSize: 14,
    color:    COLORS.zinc900,
  },

  // List
  list: {
    paddingHorizontal: 20,
    paddingBottom:     32,
  },
  resultCount: {
    fontSize:    12,
    color:       COLORS.zinc400,
    fontWeight:  "500",
    marginBottom: 12,
    marginTop:    4,
  },

  // Empty / error
  empty: {
    flex:           1,
    alignItems:     "center",
    justifyContent: "center",
    padding:        32,
    marginTop:      40,
  },
  emptyTitle: {
    fontSize:    16,
    fontWeight:  "700",
    color:       COLORS.zinc700,
    marginTop:   16,
  },
  emptySub: {
    fontSize:  13,
    color:     COLORS.zinc400,
    textAlign: "center",
    lineHeight: 18,
    marginTop:  6,
    maxWidth:   240,
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
