/**
 * Role-scoped messaging data access layer.
 *
 * - ADMIN           → sees all project conversations
 * - PROJECT_MANAGER → sees only projects they manage
 * - CLIENT          → sees only projects assigned to them
 *
 * Falls back to mock data when the database is not yet connected.
 */

import { prisma } from "@/lib/prisma";
import { getMockProjects } from "@/lib/mock-data";
import { getMockMessages, getMockConversations } from "@/lib/mock-messages";
import type { ChatMessage, Conversation } from "@/models/message";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProjectForChat {
  id:      string;
  title:   string;
  status:  string;
  manager: { id: string; name: string; email: string };
  client:  { id: string; name: string; email: string };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapMessage(m: {
  id:        string;
  projectId: string;
  senderId:  string;
  message:   string;
  createdAt: Date;
  sender:    { id: string; name: string; role: string };
}): ChatMessage {
  return {
    id:        m.id,
    projectId: m.projectId,
    senderId:  m.senderId,
    sender:    { id: m.sender.id, name: m.sender.name, role: m.sender.role },
    message:   m.message,
    createdAt: m.createdAt.toISOString(),
  };
}

const SENDER_SELECT = { id: true, name: true, role: true } as const;

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns conversations (projects + last message) visible to the user.
 * Used by the messages overview sidebar.
 */
export async function getConversations(
  userId: string,
  role:   string
): Promise<Conversation[]> {
  try {
    const where =
      role === "ADMIN"           ? {}                    :
      role === "PROJECT_MANAGER" ? { managerId: userId, managerAccepted: true } :
                                   { clientId:  userId, managerAccepted: true };

    const projects = await prisma.project.findMany({
      where,
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take:    1,
          include: { sender: { select: SENDER_SELECT } },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return projects.map((p) => {
      const last = p.messages[0];
      return {
        projectId:    p.id,
        projectTitle: p.title,
        lastMessage:  last ? mapMessage(last) : null,
        unreadCount:  0, // Requires per-user read tracking; set to 0 until schema extended
      };
    });
  } catch {
    // Fallback: mock conversations scoped to client
    const mockProjects = getMockProjects("client_001").map((p) => ({
      id:    p.id,
      title: p.title,
    }));
    return getMockConversations(mockProjects);
  }
}

/**
 * Returns a single project record for the chat page header.
 * Enforces ownership — returns null if the viewer has no access.
 */
export async function getProjectForChat(
  projectId: string,
  userId:    string,
  role:      string
): Promise<ProjectForChat | null> {
  try {
    const where =
      role === "ADMIN"           ? { id: projectId }                            :
      role === "PROJECT_MANAGER" ? { id: projectId, managerId: userId, managerAccepted: true } :
                                   { id: projectId, clientId:  userId, managerAccepted: true };

    const project = await prisma.project.findFirst({
      where,
      include: {
        manager: { select: { id: true, name: true, email: true } },
        client:  { select: { id: true, name: true, email: true } },
      },
    });

    if (!project) return null;

    return {
      id:      project.id,
      title:   project.title,
      status:  project.status,
      manager: project.manager,
      client:  project.client,
    };
  } catch {
    // Fallback: find in mock data
    const mock = getMockProjects("client_001").find((p) => p.id === projectId);
    if (!mock) return null;
    return {
      id:      mock.id,
      title:   mock.title,
      status:  mock.status,
      manager: mock.manager,
      client:  { id: "client_001", name: "Client", email: "client@example.com" },
    };
  }
}

/**
 * Returns all messages for a project, ordered oldest-first.
 * Used as the initial payload for the chat window (server-side).
 */
export async function getProjectMessages(
  projectId: string
): Promise<ChatMessage[]> {
  try {
    const messages = await prisma.message.findMany({
      where:   { projectId },
      include: { sender: { select: SENDER_SELECT } },
      orderBy: { createdAt: "asc" },
    });
    return messages.map(mapMessage);
  } catch {
    return getMockMessages(projectId);
  }
}
