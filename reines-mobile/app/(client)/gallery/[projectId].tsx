import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  ImageIcon,
  FileText,
  AlertCircle,
  RefreshCw,
  TrendingUp,
} from "lucide-react-native";
import * as WebBrowser        from "expo-web-browser";
import { useGallery }         from "@/hooks/useProjects";
import { useAuth }            from "@/hooks/useAuth";
import { buildDocumentUrl }   from "@/lib/media";
import { COLORS }             from "@/constants";
import { timeAgo }            from "@/lib/format";
import { GalleryItem, GalleryItemPlaceholder, GAP, COLUMNS } from "@/components/gallery/GalleryItem";
import { GalleryLightbox }    from "@/components/gallery/GalleryLightbox";
import type { GalleryImage, ProjectUpdate } from "@/types";

const SCREEN_W = Dimensions.get("window").width;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type TabId = "photos" | "updates";

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function GallerySkeleton() {
  const itemSize = (SCREEN_W - GAP * (COLUMNS + 1)) / COLUMNS;
  return (
    <View style={styles.root}>
      <View style={styles.grid}>
        {[1, 2, 3, 4].map((k) => (
          <View
            key={k}
            style={[{ width: itemSize, height: itemSize, borderRadius: 4 }, styles.sk]}
          />
        ))}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Empty photo grid state
// ---------------------------------------------------------------------------

function EmptyPhotos() {
  return (
    <View style={styles.empty}>
      <ImageIcon size={48} color="#d4d4d8" />
      <Text style={styles.emptyTitle}>No photos yet</Text>
      <Text style={styles.emptySub}>
        Your project manager will upload progress photos here as work continues.
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Empty text-updates state
// ---------------------------------------------------------------------------

function EmptyUpdates() {
  return (
    <View style={styles.empty}>
      <FileText size={48} color="#d4d4d8" />
      <Text style={styles.emptyTitle}>No text updates yet</Text>
      <Text style={styles.emptySub}>
        Progress notes posted by your manager will appear here.
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
      <Text style={styles.emptyTitle}>Could not load gallery</Text>
      <Text style={styles.emptySub}>Check your connection and try again.</Text>
      <TouchableOpacity style={styles.retryBtn} onPress={onRetry} activeOpacity={0.8}>
        <RefreshCw size={14} color={COLORS.white} />
        <Text style={styles.retryText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Text update row
// ---------------------------------------------------------------------------

function UpdateRow({ update }: { update: ProjectUpdate }) {
  const { token } = useAuth();

  const openDocument = async () => {
    const url = buildDocumentUrl(update.documentUrl, token);
    if (url) await WebBrowser.openBrowserAsync(url);
  };

  return (
    <View style={styles.updateRow}>
      <View style={styles.updateSpine}>
        <View style={styles.updateDot} />
        <View style={styles.updateConnector} />
      </View>
      <View style={styles.updateBody}>
        {update.progressPercent !== null && (
          <View style={styles.progressChip}>
            <TrendingUp size={10} color={COLORS.primary} />
            <Text style={styles.progressChipText}>{update.progressPercent}% complete</Text>
          </View>
        )}
        <Text style={styles.updateNote}>{update.note}</Text>
        {update.documentUrl && (
          <TouchableOpacity style={styles.docRow} onPress={openDocument} activeOpacity={0.8}>
            <FileText size={14} color={COLORS.primary} />
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
// Tab bar
// ---------------------------------------------------------------------------

interface TabBarProps {
  selected:  TabId;
  onChange:  (id: TabId) => void;
  photoCount: number;
  updateCount: number;
}

function TabBar({ selected, onChange, photoCount, updateCount }: TabBarProps) {
  return (
    <View style={styles.tabBar}>
      {(["photos", "updates"] as TabId[]).map((id) => {
        const active = selected === id;
        const label  = id === "photos"
          ? `Photos${photoCount > 0 ? ` (${photoCount})` : ""}`
          : `Updates${updateCount > 0 ? ` (${updateCount})` : ""}`;
        return (
          <TouchableOpacity
            key={id}
            style={[styles.tab, active && styles.tabActive]}
            onPress={() => onChange(id)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function ClientGallery() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const router        = useRouter();
  const { data, isLoading, isError, refetch, isFetching } = useGallery(projectId);

  const [tab,          setTab]          = useState<TabId>("photos");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIdx,  setLightboxIdx]  = useState(0);

  const onRefresh = useCallback(() => { refetch(); }, [refetch]);

  const openLightbox = useCallback((item: GalleryImage) => {
    if (!data) return;
    const idx = data.withImages.findIndex((i) => i.id === item.id);
    setLightboxIdx(Math.max(0, idx));
    setLightboxOpen(true);
  }, [data]);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) return <GallerySkeleton />;

  // ── Error ────────────────────────────────────────────────────────────────
  if (isError || !data) {
    return (
      <View style={styles.root}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={18} color={COLORS.zinc700} />
        </TouchableOpacity>
        <ErrorState onRetry={() => refetch()} />
      </View>
    );
  }

  const { withImages, textOnly, projectTitle } = data;

  // Pad the grid to an even number of items
  const gridItems: (GalleryImage | null)[] =
    withImages.length % COLUMNS === 0
      ? withImages
      : [...withImages, null];

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      {/* ── Header ─────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={18} color={COLORS.zinc700} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>{projectTitle}</Text>
          <Text style={styles.headerSub}>
            {withImages.length} photo{withImages.length !== 1 ? "s" : ""} · {textOnly.length} update{textOnly.length !== 1 ? "s" : ""}
          </Text>
        </View>
      </View>

      {/* ── Tabs ───────────────────────────────────────────────────── */}
      <TabBar
        selected={tab}
        onChange={setTab}
        photoCount={withImages.length}
        updateCount={textOnly.length}
      />

      {/* ── Content ────────────────────────────────────────────────── */}
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {tab === "photos" ? (
          withImages.length === 0 ? (
            <EmptyPhotos />
          ) : (
            <View style={styles.grid}>
              {gridItems.map((item, i) =>
                item ? (
                  <GalleryItem key={item.id} item={item} onPress={openLightbox} />
                ) : (
                  <GalleryItemPlaceholder key={`placeholder-${i}`} />
                )
              )}
            </View>
          )
        ) : (
          /* Text-only updates feed */
          textOnly.length === 0 ? (
            <EmptyUpdates />
          ) : (
            <View style={styles.updateList}>
              {textOnly.map((u) => (
                <UpdateRow key={u.id} update={u} />
              ))}
            </View>
          )
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* ── Lightbox ───────────────────────────────────────────────── */}
      {lightboxOpen && withImages.length > 0 && (
        <GalleryLightbox
          items={withImages}
          initialIndex={lightboxIdx}
          visible={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: COLORS.zinc50,
  },

  // Header
  header: {
    flexDirection:  "row",
    alignItems:     "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.zinc100,
  },
  backBtn: {
    width:          36,
    height:         36,
    alignItems:     "center",
    justifyContent: "center",
    borderRadius:   18,
    backgroundColor: COLORS.zinc100,
  },
  headerTitle: {
    fontSize:   16,
    fontWeight: "700",
    color:      COLORS.zinc900,
  },
  headerSub: {
    fontSize:  12,
    color:     COLORS.zinc400,
    marginTop: 1,
  },

  // Tabs
  tabBar: {
    flexDirection:   "row",
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.zinc100,
    paddingHorizontal: 16,
  },
  tab: {
    paddingVertical:  12,
    marginRight:      24,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: COLORS.primary,
  },
  tabLabel: {
    fontSize:   14,
    fontWeight: "600",
    color:      COLORS.zinc400,
  },
  tabLabelActive: {
    color: COLORS.primary,
  },

  // Photo grid
  grid: {
    flexDirection:   "row",
    flexWrap:        "wrap",
    gap:             GAP,
    padding:         GAP,
  },

  // Update feed
  updateList: {
    padding:    16,
    paddingTop: 8,
  },
  updateRow: {
    flexDirection: "row",
    gap:           12,
    marginBottom:  8,
  },
  updateSpine: {
    alignItems:  "center",
    width:       18,
    paddingTop:  4,
  },
  updateDot: {
    width:           10,
    height:          10,
    borderRadius:    5,
    backgroundColor: COLORS.primary,
    zIndex:          1,
  },
  updateConnector: {
    flex:            1,
    width:           2,
    backgroundColor: COLORS.zinc200,
    marginTop:       2,
    minHeight:       20,
  },
  updateBody: {
    flex:          1,
    backgroundColor: COLORS.white,
    borderRadius:  12,
    padding:       12,
    marginBottom:  8,
    gap:           6,
    shadowColor:   "#000",
    shadowOffset:  { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius:  3,
    elevation:     1,
  },
  progressChip: {
    flexDirection:     "row",
    alignItems:        "center",
    gap:               4,
    alignSelf:         "flex-start",
    backgroundColor:   COLORS.primary + "12",
    borderRadius:      8,
    paddingHorizontal: 7,
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
  updateTime: {
    fontSize: 11,
    color:    COLORS.zinc400,
  },
  docRow: {
    flexDirection:     "row",
    alignItems:        "center",
    gap:               6,
    backgroundColor:   COLORS.primary + "10",
    borderRadius:      8,
    paddingHorizontal: 10,
    paddingVertical:   8,
    alignSelf:         "flex-start",
  },
  docName: { fontSize: 12, color: COLORS.primary, fontWeight: "600", flex: 1 },

  // Empty states
  empty: {
    flex:           1,
    alignItems:     "center",
    justifyContent: "center",
    padding:        40,
    marginTop:      24,
  },
  emptyTitle: {
    fontSize:   16,
    fontWeight: "700",
    color:      COLORS.zinc700,
    marginTop:  16,
  },
  emptySub: {
    fontSize:  13,
    color:     COLORS.zinc400,
    textAlign: "center",
    lineHeight: 19,
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

  // Skeleton
  sk: {
    backgroundColor: COLORS.zinc100,
  },
});
