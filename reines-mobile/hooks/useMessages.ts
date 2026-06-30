import { useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchMessages, sendMessage, fetchConversations } from "@/services";
import { MESSAGE_POLL_INTERVAL_MS } from "@/constants";
import { subscribeToThread, dispatchMessage } from "@/lib/messageTransport";
import { markThreadRead, countUnread } from "@/lib/readState";
import type { Message, MessagesResponse, Conversation } from "@/types";

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const MESSAGE_KEYS = {
  thread:        (projectId: string) => ["messages", projectId] as const,
  conversations: ["conversations"] as const,
};

// ---------------------------------------------------------------------------
// useMessages — polls a thread + dispatches new messages through the bus
// ---------------------------------------------------------------------------

/**
 * Fetches and polls messages for a single project thread.
 *
 * After each successful fetch the hook compares message IDs against the
 * previous snapshot; any genuinely new messages are dispatched through
 * `messageTransport` so the unread badge reacts immediately.
 *
 * To upgrade to WebSocket:
 *   1. Set `refetchInterval: false`.
 *   2. Call `connectWebSocket(projectId, token)` in a separate effect.
 *   3. The WS handler dispatches via `dispatchMessage(projectId, msg)`.
 *   → Nothing else changes.
 */
export function useMessages(projectId: string) {
  const qc        = useQueryClient();
  const prevIds   = useRef(new Set<string>());

  const query = useQuery<MessagesResponse>({
    queryKey:       MESSAGE_KEYS.thread(projectId),
    queryFn:        () => fetchMessages(projectId),
    enabled:        !!projectId,
    refetchInterval: MESSAGE_POLL_INTERVAL_MS,   // 5 s polling
    staleTime:      0,
  });

  // Detect truly new messages after each successful fetch and publish them
  useEffect(() => {
    if (!query.data?.messages) return;
    const newMsgs = query.data.messages.filter((m) => !prevIds.current.has(m.id));
    if (newMsgs.length > 0) {
      newMsgs.forEach((m) => {
        prevIds.current.add(m.id);
        dispatchMessage(projectId, m);
      });
      // Also invalidate conversations so the last-message preview refreshes
      qc.invalidateQueries({ queryKey: MESSAGE_KEYS.conversations });
    } else if (prevIds.current.size === 0 && query.data.messages.length > 0) {
      // First load — seed the set without dispatching (old messages aren't "new")
      query.data.messages.forEach((m) => prevIds.current.add(m.id));
    }
  }, [query.data, projectId, qc]);

  return query;
}

// ---------------------------------------------------------------------------
// useSendMessage — optimistic mutation, dispatches on success
// ---------------------------------------------------------------------------

export function useSendMessage(
  projectId:   string,
  senderId:    string,
  senderName:  string,
  senderRole:  string
) {
  const qc  = useQueryClient();
  const key = MESSAGE_KEYS.thread(projectId);

  return useMutation<Message, Error, string>({
    mutationFn: (text: string) => sendMessage(projectId, text),

    onMutate: async (text) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<MessagesResponse>(key);

      const optimistic: Message = {
        id:        `optimistic_${Date.now()}`,
        message:   text,
        projectId,
        senderId,
        sender:    { id: senderId, name: senderName, role: senderRole },
        createdAt: new Date().toISOString(),
      };

      qc.setQueryData<MessagesResponse>(key, (old) =>
        old ? { ...old, messages: [...old.messages, optimistic] } : old
      );

      return { previous };
    },

    onError: (_err, _vars, context) => {
      const ctx = context as { previous?: MessagesResponse } | undefined;
      if (ctx?.previous) qc.setQueryData<MessagesResponse>(key, ctx.previous);
    },

    onSuccess: (confirmed) => {
      // Replace the optimistic placeholder with the confirmed message
      qc.setQueryData<MessagesResponse>(key, (old) => {
        if (!old) return old;
        const replaced = old.messages.map((m) =>
          m.id.startsWith("optimistic_") ? confirmed : m
        );
        return { ...old, messages: replaced };
      });

      // Publish so unread badge and other subscribers react
      dispatchMessage(projectId, confirmed);
      qc.invalidateQueries({ queryKey: MESSAGE_KEYS.conversations });
    },
  });
}

// ---------------------------------------------------------------------------
// useConversations — all projects with last-message preview, polled
// ---------------------------------------------------------------------------

export function useConversations() {
  return useQuery<Conversation[]>({
    queryKey:        MESSAGE_KEYS.conversations,
    queryFn:         fetchConversations,
    refetchInterval: MESSAGE_POLL_INTERVAL_MS,
    staleTime:       0,
  });
}

// ---------------------------------------------------------------------------
// useMarkRead — marks a thread as read when the screen mounts/unmounts
// ---------------------------------------------------------------------------

export function useMarkRead(projectId: string) {
  useEffect(() => {
    markThreadRead(projectId);
    return () => {
      markThreadRead(projectId);
    };
  }, [projectId]);
}

// ---------------------------------------------------------------------------
// useUnreadCount — total badge count across all conversations
// ---------------------------------------------------------------------------

export function useUnreadCount(currentUserId: string): number {
  const { data: conversations } = useConversations();
  const qc = useQueryClient();

  if (!conversations || !currentUserId) return 0;

  let total = 0;
  for (const conv of conversations) {
    // Try to use cached thread messages for accurate count; fall back to
    // last-message heuristic if the thread hasn't been opened yet.
    const cached = qc.getQueryData<MessagesResponse>(
      MESSAGE_KEYS.thread(conv.projectId)
    );

    if (cached?.messages) {
      total += countUnread(conv.projectId, currentUserId, cached.messages);
    } else if (
      conv.lastMessage &&
      conv.lastMessage.senderId !== currentUserId
    ) {
      // Thread not opened yet — count 1 if the last message is from someone else
      const lastRead = null; // thread never opened
      const unread = countUnread(conv.projectId, currentUserId, [conv.lastMessage]);
      total += unread;
    }
  }

  return total;
}
