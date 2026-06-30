import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { AlertCircle, MessageCircle, RefreshCw } from "lucide-react-native";
import { useAuth }             from "@/hooks/useAuth";
import { useConversations } from "@/hooks/useMessages";
import { getLastRead }         from "@/lib/readState";
import { COLORS }              from "@/constants";
import { ConversationCard, ConversationCardSkeleton } from "@/components/messages/ConversationCard";
import type { Conversation }   from "@/types";

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <View style={styles.empty}>
      <MessageCircle size={56} color="#d4d4d8" />
      <Text style={styles.emptyTitle}>No conversations yet</Text>
      <Text style={styles.emptySub}>
        Once a project is assigned, you can message your project manager here.
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
      <Text style={styles.emptyTitle}>Could not load messages</Text>
      <Text style={styles.emptySub}>Check your connection and try again.</Text>
      <TouchableOpacity style={styles.retryBtn} onPress={onRetry} activeOpacity={0.8}>
        <RefreshCw size={14} color={COLORS.white} />
        <Text style={styles.retryText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Skeleton list
// ---------------------------------------------------------------------------

function SkeletonList() {
  return (
    <View>
      {[1, 2, 3, 4].map((k) => <ConversationCardSkeleton key={k} />)}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function ClientMessages() {
  const { user }          = useAuth();
  const currentUserId     = user?.id ?? "";
  const { data, isLoading, isError, refetch, isFetching } = useConversations();

  const onRefresh = useCallback(() => { refetch(); }, [refetch]);

  const getUnread = useCallback(
    (conv: Conversation): number => {
      if (!conv.lastMessage) return 0;
      const lastRead = getLastRead(conv.projectId);
      if (
        conv.lastMessage.senderId !== currentUserId &&
        (lastRead === null || conv.lastMessage.createdAt > lastRead)
      ) {
        return 1;
      }
      return 0;
    },
    [currentUserId]
  );

  if (isLoading) {
    return (
      <View style={styles.root}>
        <SkeletonList />
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View style={styles.root}>
        <ErrorState onRetry={() => refetch()} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <FlatList
        data={data}
        keyExtractor={(item) => item.projectId}
        renderItem={({ item }) => (
          <ConversationCard
            conversation={item}
            currentUserId={currentUserId}
            unreadCount={getUnread(item)}
          />
        )}
        ListEmptyComponent={<EmptyState />}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        ListHeaderComponent={
          data.length > 0 ? (
            <Text style={styles.subtitle}>
              {data.length} conversation{data.length !== 1 ? "s" : ""}
            </Text>
          ) : null
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: COLORS.zinc50,
  },
  subtitle: {
    fontSize:          12,
    color:             COLORS.zinc400,
    fontWeight:        "500",
    paddingHorizontal: 16,
    paddingVertical:   10,
  },
  empty: {
    flex:           1,
    alignItems:     "center",
    justifyContent: "center",
    padding:        40,
  },
  emptyTitle: {
    fontSize:   17,
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
});
