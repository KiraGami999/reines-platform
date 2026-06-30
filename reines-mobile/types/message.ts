import type { ProjectStatus } from "./project";

export interface MessageSender {
  id:   string;
  name: string;
  role: string;
}

export interface Message {
  id:        string;
  message:   string;
  projectId: string;
  senderId:  string;
  sender:    MessageSender;
  createdAt: string;
}

export interface MessagesResponse {
  messages:     Message[];
  projectTitle: string;
}

export interface ConversationParticipant {
  id:    string;
  name:  string;
  email: string;
  image: string | null;
}

/**
 * A project-scoped conversation summary as returned by
 * GET /api/mobile/conversations.
 */
export interface Conversation {
  projectId:     string;
  projectTitle:  string;
  projectStatus: ProjectStatus;
  manager:       ConversationParticipant;
  client:        ConversationParticipant;
  lastMessage:   Message | null;
  messageCount:  number;
}

export interface ConversationsResponse {
  conversations: Conversation[];
}
