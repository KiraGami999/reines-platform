import React, { useRef, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
  SafeAreaView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, AlertCircle, RefreshCw } from "lucide-react-native";
import { useAuth } from "@/hooks/useAuth";
import { useMessages, useSendMessage, useMarkRead } from "@/hooks/useMessages";
import { COLORS } from "@/constants";
import { shortDate } from "@/lib/format";
import { MessageBubble, MessageBubbleSkeleton } from "@/components/messages/MessageBubble";
import { ComposerBar } from "@/components/messages/ComposerBar";
import type { Message } from "@/types";

function DateSeparator({ date }: { date: string }) {
  return (
    <View style={styles.dateSep}>
      <View style={styles.dateLine} />
      <Text style={styles.dateLabel}>{shortDate(date)}</Text>
      <View style={styles.dateLine} />
    </View>
  );
}

function ThreadSkeleton() {
  return (
    <View style={[styles.root, { paddingHorizontal: 16, justifyContent: "flex-end", paddingBottom: 16 }]}>
      {[false, true, false, true, false].map((mine, i) => (
        <MessageBubbleSkeleton key={i} mine={mine} />
      ))}
    </View>
  );
}

function ThreadError({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={styles.centred}>
      <AlertCircle size={36} color={COLORS.red} />
      <Text style={styles.errTitle}>Could not load messages</Text>
      <TouchableOpacity style={styles.retryBtn} onPress={onRetry} activeOpacity={0.8}>
        <RefreshCw size={14} color={COLORS.white} />
        <Text style={styles.retryText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
}

function isNewRun(prev: Message | undefined, curr: Message): boolean {
  if (!prev) return true;
  if (prev.senderId !== curr.senderId) return true;
  return (
    new Date(curr.createdAt).getTime() -
    new Date(prev.createdAt).getTime() >
    5 * 60 * 1000
  );
}

export default function ManagerMessageThread() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const router        = useRouter();
  const { user }      = useAuth();
  const listRef       = useRef<FlatList<any>>(null);

  useMarkRead(projectId);

  const { data, isLoading, isError, refetch } = useMessages(projectId);

  const { mutate: doSend, isPending: isSending } = useSendMessage(
    projectId,
    user?.id   ?? "",
    user?.name ?? "",
    user?.role ?? "PROJECT_MANAGER"
  );

  const handleSend = useCallback((text: string) => {
    doSend(text);
  }, [doSend]);

  useEffect(() => {
    if (data?.messages?.length) {
      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true });
      }, 80);
    }
  }, [data?.messages?.length]);

  const listItems = useMemo(() => {
    if (!data?.messages) return [];
    const result: ({ type: "msg"; msg: Message } | { type: "date"; date: string })[] = [];
    let lastDate = "";
    for (const msg of data.messages) {
      const msgDate = new Date(msg.createdAt).toDateString();
      if (msgDate !== lastDate) {
        result.push({ type: "date", date: msg.createdAt });
        lastDate = msgDate;
      }
      result.push({ type: "msg", msg });
    }
    return result;
  }, [data?.messages]);

  if (isLoading) {
    return (
      <View style={styles.root}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={18} color={COLORS.white} />
          </TouchableOpacity>
          <View style={[styles.sk, { width: 140, height: 14 }]} />
        </View>
        <ThreadSkeleton />
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View style={styles.root}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={18} color={COLORS.white} />
          </TouchableOpacity>
        </View>
        <ThreadError onRetry={() => refetch()} />
      </View>
    );
  }

  const messages = data.messages;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} hitSlop={8}>
            <ArrowLeft size={18} color={COLORS.white} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {data.projectTitle}
            </Text>
            <Text style={styles.headerSub}>
              {messages.length} message{messages.length !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>

        {listItems.length === 0 ? (
          <View style={styles.centred}>
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptySub}>Send the first message to your client below.</Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={listItems}
            keyExtractor={(item, index) =>
              item.type === "date" ? `date-${index}` : item.msg.id
            }
            renderItem={({ item, index }) => {
              if (item.type === "date") {
                return <DateSeparator date={item.date} />;
              }

              const { msg } = item;
              const isMine = msg.senderId === user?.id;
              const prevMsg = listItems.slice(0, index).reverse().find((x) => x.type === "msg");
              const prevMessage = prevMsg?.type === "msg" ? prevMsg.msg : undefined;
              const nextMsg = listItems.slice(index + 1).find((x) => x.type === "msg");
              const nextMessage = nextMsg?.type === "msg" ? nextMsg.msg : undefined;

              const showSender = !isMine && isNewRun(prevMessage, msg);
              const showTime =
                !nextMessage ||
                nextMessage.senderId !== msg.senderId ||
                isNewRun(msg, nextMessage);

              return (
                <View style={styles.bubbleWrap}>
                  <MessageBubble
                    message={msg}
                    isMine={isMine}
                    showSender={showSender}
                    showTime={showTime}
                  />
                </View>
              );
            }}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() =>
              listRef.current?.scrollToEnd({ animated: false })
            }
            maintainVisibleContentPosition={{
              minIndexForVisible: 0,
              autoscrollToTopThreshold: 10,
            }}
          />
        )}

        <ComposerBar onSend={handleSend} isSending={isSending} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex:            1,
    backgroundColor: COLORS.primary,
  },
  root: {
    flex:            1,
    backgroundColor: COLORS.zinc50,
  },
  header: {
    flexDirection:     "row",
    alignItems:        "center",
    backgroundColor:   COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical:   12,
    gap:               10,
  },
  backBtn: {
    width:           36,
    height:          36,
    alignItems:      "center",
    justifyContent:  "center",
    borderRadius:    18,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  headerCenter: { flex: 1 },
  headerTitle: {
    fontSize:   16,
    fontWeight: "700",
    color:      COLORS.white,
  },
  headerSub: {
    fontSize:  11,
    color:     "rgba(255,255,255,0.65)",
    marginTop: 1,
  },
  listContent: {
    flexGrow:          1,
    paddingHorizontal: 12,
    paddingTop:        12,
    paddingBottom:     8,
  },
  bubbleWrap: { marginBottom: 2 },
  dateSep: {
    flexDirection:  "row",
    alignItems:     "center",
    marginVertical: 16,
    gap:            8,
  },
  dateLine: {
    flex:            1,
    height:          1,
    backgroundColor: COLORS.zinc200,
  },
  dateLabel: {
    fontSize:   11,
    color:      COLORS.zinc400,
    fontWeight: "500",
  },
  centred: {
    flex:           1,
    alignItems:     "center",
    justifyContent: "center",
    padding:        32,
  },
  emptyTitle: {
    fontSize:   15,
    fontWeight: "700",
    color:      COLORS.zinc700,
  },
  emptySub: {
    fontSize:  13,
    color:     COLORS.zinc400,
    marginTop: 6,
  },
  errTitle: {
    fontSize:   15,
    fontWeight: "700",
    color:      COLORS.zinc900,
    marginTop:  12,
  },
  retryBtn: {
    flexDirection:     "row",
    alignItems:        "center",
    backgroundColor:   COLORS.primary,
    borderRadius:      10,
    paddingVertical:   10,
    paddingHorizontal: 18,
    gap:               8,
    marginTop:         16,
  },
  retryText: {
    color:      COLORS.white,
    fontWeight: "700",
    fontSize:   14,
  },
  sk: {
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius:    6,
  },
});
