import api from "@/lib/api";
import type { Message, MessagesResponse, Conversation, ConversationsResponse } from "@/types";

/**
 * Fetches all messages for a project thread (ordered oldest-first).
 * Also returns the project title so the chat header is self-contained.
 */
export async function fetchMessages(projectId: string): Promise<MessagesResponse> {
  const { data } = await api.get<MessagesResponse>(
    `/api/mobile/projects/${projectId}/messages`
  );
  return data;
}

/**
 * Sends a message to a project thread.
 * Returns the persisted message (replaces the optimistic record).
 */
export async function sendMessage(projectId: string, message: string): Promise<Message> {
  const { data } = await api.post<{ message: Message }>(
    `/api/mobile/projects/${projectId}/messages`,
    { message }
  );
  return data.message;
}

/**
 * Fetches all conversations (projects + last message) for the current user.
 * Used by the Conversation List screen and the tab-bar unread badge.
 */
export async function fetchConversations(): Promise<Conversation[]> {
  const { data } = await api.get<ConversationsResponse>("/api/mobile/conversations");
  return data.conversations;
}
