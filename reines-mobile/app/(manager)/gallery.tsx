import React, { useState, useMemo } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  SafeAreaView, RefreshControl, ScrollView, Pressable,
} from "react-native";
import { Image }     from "expo-image";
import { Plus, ImageIcon, FileText, ChevronDown, AlertCircle } from "lucide-react-native";
import { COLORS, PROJECT_STATUS_CONFIG }  from "@/constants";
import { useProjects }                    from "@/hooks/useProjects";
import { useGallery }                     from "@/hooks/useProjects";
import { GalleryUploadSheet }             from "@/components/manager/GalleryUploadSheet";
import { GalleryLightbox }                from "@/components/gallery/GalleryLightbox";
import { timeAgo, shortDate }             from "@/lib/format";
import type { MobileProject, GalleryImage } from "@/types";

// ─── Column config ────────────────────────────────────────────────────────────
const NUM_COLS  = 2;
const CELL_GAP  = 2;

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ManagerGalleryScreen() {
  const [selectedProject, setSelectedProject] = useState<MobileProject | null>(null);
  const [pickerOpen,      setPickerOpen]       = useState(false);
  const [uploadOpen,      setUploadOpen]       = useState(false);
  const [lightboxIdx,     setLightboxIdx]      = useState<number | null>(null);
  const [tab,             setTab]              = useState<"photos" | "updates">("photos");

  const { data: projects, isLoading: loadingProjects } = useProjects();

  // Auto-select the first project once loaded
  React.useEffect(() => {
    if (!selectedProject && projects && projects.length > 0) {
      setSelectedProject(projects[0]);
    }
  }, [projects, selectedProject]);

  const projectId = selectedProject?.id ?? "";

  const {
    data: gallery,
    isLoading: loadingGallery,
    isError:   galleryError,
    refetch:   refetchGallery,
    isRefetching,
  } = useGallery(projectId);

  const cfg = selectedProject
    ? PROJECT_STATUS_CONFIG[selectedProject.status] ?? { label: selectedProject.status, color: COLORS.zinc400 }
    : null;

  // ── Lightbox items ────────────────────────────────────────────────────────

  const lightboxItems = useMemo<GalleryImage[]>(
    () => gallery?.withImages ?? [],
    [gallery]
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.root}>
      {/* ── Project selector bar ─────────────────────────────────────────── */}
      <Pressable
        style={styles.projectBar}
        onPress={() => setPickerOpen((o) => !o)}
      >
        {selectedProject ? (
          <View style={styles.projectBarContent}>
            <View style={[styles.statusDot, { backgroundColor: cfg?.color ?? COLORS.zinc400 }]} />
            <Text style={styles.projectBarTitle} numberOfLines={1}>
              {selectedProject.title}
            </Text>
            <Text style={styles.projectBarClient} numberOfLines={1}>
              · {selectedProject.client.name}
            </Text>
          </View>
        ) : (
          <Text style={styles.projectBarPlaceholder}>Select a project</Text>
        )}
        <ChevronDown
          size={16}
          color={COLORS.zinc500}
          style={{ transform: [{ rotate: pickerOpen ? "180deg" : "0deg" }] }}
        />
      </Pressable>

      {/* ── Project picker dropdown ───────────────────────────────────────── */}
      {pickerOpen && (
        <View style={styles.picker}>
          <ScrollView style={{ maxHeight: 260 }} keyboardShouldPersistTaps="handled">
            {loadingProjects ? (
              <Text style={styles.pickerLoading}>Loading projects…</Text>
            ) : (
              (projects ?? []).map((p) => {
                const pcfg = PROJECT_STATUS_CONFIG[p.status] ?? { color: COLORS.zinc400 };
                return (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.pickerItem, selectedProject?.id === p.id && styles.pickerItemActive]}
                    onPress={() => { setSelectedProject(p); setPickerOpen(false); }}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.statusDot, { backgroundColor: pcfg.color }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.pickerItemTitle} numberOfLines={1}>{p.title}</Text>
                      <Text style={styles.pickerItemSub}>{p.client.name}</Text>
                    </View>
                    <Text style={styles.pickerItemCount}>{p._count.updates} updates</Text>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
      )}

      {/* ── Tab bar ──────────────────────────────────────────────────────── */}
      <View style={styles.tabBar}>
        <TabBtn
          icon={<ImageIcon size={14} color={tab === "photos" ? COLORS.primary : COLORS.zinc400} />}
          label={`Photos${gallery ? ` (${gallery.withImages.length})` : ""}`}
          active={tab === "photos"}
          onPress={() => setTab("photos")}
        />
        <TabBtn
          icon={<FileText size={14} color={tab === "updates" ? COLORS.primary : COLORS.zinc400} />}
          label={`Updates${gallery ? ` (${gallery.textOnly.length})` : ""}`}
          active={tab === "updates"}
          onPress={() => setTab("updates")}
        />
      </View>

      {/* ── Content area ─────────────────────────────────────────────────── */}
      {!selectedProject ? (
        <View style={styles.centred}>
          <Text style={styles.emptyIcon}>🏗️</Text>
          <Text style={styles.emptyTitle}>No project selected</Text>
          <Text style={styles.emptySub}>Tap the bar above to choose a project.</Text>
        </View>
      ) : loadingGallery ? (
        <SkeletonGrid />
      ) : galleryError ? (
        <View style={styles.centred}>
          <AlertCircle size={32} color={COLORS.red} />
          <Text style={styles.errorText}>Failed to load gallery.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetchGallery()} activeOpacity={0.8}>
            <Text style={styles.retryLabel}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : tab === "photos" ? (
        // ── Photo grid ─────────────────────────────────────────────────────
        <FlatList
          data={gallery!.withImages}
          numColumns={NUM_COLS}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.grid}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetchGallery} tintColor={COLORS.primary} />
          }
          ListEmptyComponent={
            <View style={styles.centred}>
              <Text style={styles.emptyIcon}>📷</Text>
              <Text style={styles.emptyTitle}>No photos yet</Text>
              <Text style={styles.emptySub}>Tap "+" to upload the first progress photo.</Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={styles.gridCell}
              onPress={() => setLightboxIdx(index)}
              activeOpacity={0.9}
            >
              <Image
                source={{ uri: item.imageUrl.startsWith("http")
                  ? item.imageUrl
                  : `${process.env.EXPO_PUBLIC_API_URL ?? ""}${item.imageUrl}`
                }}
                style={styles.gridImage}
                contentFit="cover"
                transition={200}
                placeholder={{ blurhash: "LEHV6nWB2yk8pyo0adR*.7kCMdnj" }}
              />
              {/* Overlay: progress chip */}
              {item.progressPercent !== null && (
                <View style={styles.progressChip}>
                  <Text style={styles.progressChipText}>{item.progressPercent}%</Text>
                </View>
              )}
              {/* Overlay: date */}
              <View style={styles.dateChip}>
                <Text style={styles.dateChipText}>{timeAgo(item.createdAt)}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      ) : (
        // ── Text updates feed ───────────────────────────────────────────────
        <FlatList
          data={gallery!.textOnly}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.updateFeed, gallery!.textOnly.length === 0 && styles.listEmpty]}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetchGallery} tintColor={COLORS.primary} />
          }
          ListEmptyComponent={
            <View style={styles.centred}>
              <Text style={styles.emptyIcon}>📝</Text>
              <Text style={styles.emptyTitle}>No text updates yet</Text>
              <Text style={styles.emptySub}>Post update notes without photos here.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.updateCard}>
              <View style={styles.updateHeader}>
                {item.progressPercent !== null && (
                  <View style={styles.updateProgress}>
                    <View style={styles.updateProgressTrack}>
                      <View style={[styles.updateProgressFill, { width: `${item.progressPercent}%` as `${number}%` }]} />
                    </View>
                    <Text style={styles.updateProgressPct}>{item.progressPercent}%</Text>
                  </View>
                )}
                <Text style={styles.updateDate}>{shortDate(item.createdAt)}</Text>
              </View>
              <Text style={styles.updateNote}>{item.note}</Text>
            </View>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
      )}

      {/* ── FAB ──────────────────────────────────────────────────────────── */}
      {selectedProject && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setUploadOpen(true)}
          activeOpacity={0.85}
        >
          <Plus size={22} color={COLORS.white} />
        </TouchableOpacity>
      )}

      {/* ── Lightbox ─────────────────────────────────────────────────────── */}
      <GalleryLightbox
        items={lightboxItems}
        initialIndex={lightboxIdx ?? 0}
        visible={lightboxIdx !== null}
        onClose={() => setLightboxIdx(null)}
      />

      {/* ── Upload sheet ─────────────────────────────────────────────────── */}
      <GalleryUploadSheet
        visible={uploadOpen}
        project={selectedProject}
        onClose={() => setUploadOpen(false)}
        onSuccess={() => refetchGallery()}
      />
    </SafeAreaView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TabBtn({ icon, label, active, onPress }: {
  icon: React.ReactNode; label: string; active: boolean; onPress: () => void;
}) {
  return (
    <TouchableOpacity style={[styles.tab, active && styles.tabActive]} onPress={onPress} activeOpacity={0.75}>
      {icon}
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function SkeletonGrid() {
  return (
    <View style={styles.grid}>
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={[styles.gridCell, styles.skeletonCell]} />
      ))}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.zinc50 },

  // Project selector
  projectBar: {
    flexDirection:     "row",
    alignItems:        "center",
    justifyContent:    "space-between",
    backgroundColor:   COLORS.white,
    paddingHorizontal: 16,
    paddingVertical:   12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.zinc100,
  },
  projectBarContent: {
    flexDirection: "row",
    alignItems:    "center",
    flex:          1,
    gap:           8,
  },
  projectBarTitle:       { fontSize: 15, fontWeight: "700", color: COLORS.zinc900 },
  projectBarClient:      { fontSize: 12, color: COLORS.zinc400, flex: 1 },
  projectBarPlaceholder: { fontSize: 14, color: COLORS.zinc400, flex: 1 },
  statusDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },

  // Dropdown picker
  picker: {
    backgroundColor:  COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.zinc100,
    shadowColor:      "#000",
    shadowOffset:     { width: 0, height: 4 },
    shadowOpacity:    0.08,
    shadowRadius:     8,
    elevation:        4,
    zIndex:           10,
  },
  pickerLoading:    { padding: 16, color: COLORS.zinc400, textAlign: "center" },
  pickerItem: {
    flexDirection:     "row",
    alignItems:        "center",
    gap:               10,
    paddingHorizontal: 16,
    paddingVertical:   12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.zinc50,
  },
  pickerItemActive: { backgroundColor: COLORS.primary + "08" },
  pickerItemTitle:  { fontSize: 14, fontWeight: "600", color: COLORS.zinc900 },
  pickerItemSub:    { fontSize: 11, color: COLORS.zinc400 },
  pickerItemCount:  { fontSize: 11, color: COLORS.zinc400 },

  // Tabs
  tabBar: {
    flexDirection:     "row",
    backgroundColor:   COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.zinc100,
    paddingHorizontal: 12,
  },
  tab: {
    flex:              1,
    flexDirection:     "row",
    alignItems:        "center",
    justifyContent:    "center",
    paddingVertical:   11,
    gap:               5,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive:      { borderBottomColor: COLORS.primary },
  tabLabel:       { fontSize: 13, fontWeight: "600", color: COLORS.zinc400 },
  tabLabelActive: { color: COLORS.primary },

  // Photo grid
  grid:        { flexDirection: "row", flexWrap: "wrap", gap: CELL_GAP, padding: CELL_GAP },
  gridCell: {
    flex:         1,
    aspectRatio:  1,
    minWidth:     "48%",
    maxWidth:     "50%",
    borderRadius: 4,
    overflow:     "hidden",
    position:     "relative",
  },
  gridImage:    { width: "100%", height: "100%" },
  progressChip: {
    position:          "absolute",
    top:               6,
    left:              6,
    backgroundColor:   "rgba(0,0,0,0.6)",
    borderRadius:      8,
    paddingHorizontal: 6,
    paddingVertical:   2,
  },
  progressChipText: { fontSize: 10, color: COLORS.white, fontWeight: "700" },
  dateChip: {
    position:          "absolute",
    bottom:            6,
    right:             6,
    backgroundColor:   "rgba(0,0,0,0.5)",
    borderRadius:      6,
    paddingHorizontal: 5,
    paddingVertical:   2,
  },
  dateChipText: { fontSize: 9, color: COLORS.white },
  skeletonCell: { backgroundColor: COLORS.zinc100 },

  // Updates feed
  updateFeed: { padding: 12, paddingBottom: 32 },
  listEmpty:  { flexGrow: 1 },
  updateCard: {
    backgroundColor: COLORS.white,
    borderRadius:    14,
    padding:         16,
    gap:             10,
    shadowColor:     "#000",
    shadowOffset:    { width: 0, height: 1 },
    shadowOpacity:   0.06,
    shadowRadius:    4,
    elevation:       2,
  },
  updateHeader:       { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  updateDate:         { fontSize: 11, color: COLORS.zinc400 },
  updateProgress:     { flexDirection: "row", alignItems: "center", gap: 8, flex: 1, marginRight: 12 },
  updateProgressTrack:{ flex: 1, height: 6, borderRadius: 3, backgroundColor: COLORS.zinc100, overflow: "hidden" },
  updateProgressFill: { height: "100%", borderRadius: 3, backgroundColor: COLORS.green },
  updateProgressPct:  { fontSize: 11, fontWeight: "700", color: COLORS.green, width: 30 },
  updateNote:         { fontSize: 14, color: COLORS.zinc700, lineHeight: 20 },

  // FAB
  fab: {
    position:        "absolute",
    right:           20,
    bottom:          24,
    width:           56,
    height:          56,
    borderRadius:    28,
    backgroundColor: COLORS.primary,
    alignItems:      "center",
    justifyContent:  "center",
    shadowColor:     COLORS.primary,
    shadowOffset:    { width: 0, height: 4 },
    shadowOpacity:   0.4,
    shadowRadius:    8,
    elevation:       6,
  },

  // States
  centred:    { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, padding: 40 },
  emptyIcon:  { fontSize: 44 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: COLORS.zinc700, textAlign: "center" },
  emptySub:   { fontSize: 13, color: COLORS.zinc400, textAlign: "center", lineHeight: 18 },
  errorText:  { fontSize: 14, color: COLORS.red,     textAlign: "center" },
  retryBtn:   { backgroundColor: COLORS.primary, borderRadius: 20, paddingHorizontal: 20, paddingVertical: 8 },
  retryLabel: { color: COLORS.white, fontWeight: "700", fontSize: 13 },
});
