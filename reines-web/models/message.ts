// Message domain types — mirror the Prisma Message model.

export interface MessageSender {
  id:   string;
  name: string;
  role: string;
}

export interface ChatMessage {
  id:        string;
  projectId: string;
  senderId:  string;
  sender:    MessageSender;
  message:   string;
  createdAt: string;
}

export interface Conversation {
  projectId:    string;
  projectTitle: string;
  lastMessage:  ChatMessage | null;
  unreadCount:  number;
}
