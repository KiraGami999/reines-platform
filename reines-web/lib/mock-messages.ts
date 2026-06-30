import type { ChatMessage, Conversation } from "@/models/message";

// ─── Seed data ────────────────────────────────────────────────────────────────

export const MOCK_MESSAGES: ChatMessage[] = [
  // ── proj_001: Chichiri Residential Complex ────────────────────────────────
  {
    id: "msg_001", projectId: "proj_001",
    senderId: "mgr_001",
    sender: { id: "mgr_001", name: "Samuel Phiri", role: "PROJECT_MANAGER" },
    message: "Good morning! Just wanted to confirm that the foundation pour is scheduled for Monday morning. Please ensure site access is available from 6 AM.",
    createdAt: "2026-03-10T08:00:00Z",
  },
  {
    id: "msg_002", projectId: "proj_001",
    senderId: "client_001",
    sender: { id: "client_001", name: "You", role: "CLIENT" },
    message: "Confirmed, access will be available. Will there be a supervisor on site the whole day?",
    createdAt: "2026-03-10T08:45:00Z",
  },
  {
    id: "msg_003", projectId: "proj_001",
    senderId: "mgr_001",
    sender: { id: "mgr_001", name: "Samuel Phiri", role: "PROJECT_MANAGER" },
    message: "Yes, I'll be on site from 6 AM until the pour is complete and tested. Estimated finish time is around 3 PM.",
    createdAt: "2026-03-10T09:00:00Z",
  },
  {
    id: "msg_004", projectId: "proj_001",
    senderId: "mgr_001",
    sender: { id: "mgr_001", name: "Samuel Phiri", role: "PROJECT_MANAGER" },
    message: "Foundation poured successfully! Curing will take 7 days. I've posted a photo update in the gallery. No issues to report — excellent progress.",
    createdAt: "2026-03-17T16:30:00Z",
  },
  {
    id: "msg_005", projectId: "proj_001",
    senderId: "client_001",
    sender: { id: "client_001", name: "You", role: "CLIENT" },
    message: "Excellent news! Saw the gallery photos — it looks really solid. What's the next milestone?",
    createdAt: "2026-03-17T17:15:00Z",
  },
  {
    id: "msg_006", projectId: "proj_001",
    senderId: "mgr_001",
    sender: { id: "mgr_001", name: "Samuel Phiri", role: "PROJECT_MANAGER" },
    message: "Next up is brickwork to DPC (damp-proof course), starting next Monday. After that we move into the superstructure phase — walling to wall plate. You'll receive a gallery update at each stage.",
    createdAt: "2026-03-17T17:45:00Z",
  },
  {
    id: "msg_007", projectId: "proj_001",
    senderId: "client_001",
    sender: { id: "client_001", name: "You", role: "CLIENT" },
    message: "Perfect, looking forward to seeing the progress. Will the mid-phase payment be triggered after the superstructure is up?",
    createdAt: "2026-04-10T09:00:00Z",
  },
  {
    id: "msg_008", projectId: "proj_001",
    senderId: "mgr_001",
    sender: { id: "mgr_001", name: "Samuel Phiri", role: "PROJECT_MANAGER" },
    message: "Correct — the 40% milestone payment becomes due once the core portal and structural works are demonstrable. I'll send you a formal notification with photos when we reach that point.",
    createdAt: "2026-04-10T09:30:00Z",
  },
  {
    id: "msg_009", projectId: "proj_001",
    senderId: "mgr_001",
    sender: { id: "mgr_001", name: "Samuel Phiri", role: "PROJECT_MANAGER" },
    message: "Update: Ring beam is poured and curing well. Scaffolding is up for the second-floor block-work. We are on schedule.",
    createdAt: "2026-04-28T10:15:00Z",
  },

  // ── proj_002: Naperi Office Extension ────────────────────────────────────
  {
    id: "msg_010", projectId: "proj_002",
    senderId: "mgr_002",
    sender: { id: "mgr_002", name: "Grace Banda", role: "PROJECT_MANAGER" },
    message: "Hello! I'm Grace, your assigned project manager for the Naperi Office Extension. Looking forward to working with you. I'll be in touch once the design drawings are finalised next week.",
    createdAt: "2026-04-11T08:00:00Z",
  },
  {
    id: "msg_011", projectId: "proj_002",
    senderId: "client_001",
    sender: { id: "client_001", name: "You", role: "CLIENT" },
    message: "Hi Grace! Happy to be working with you. Can you confirm the expected start date for construction?",
    createdAt: "2026-04-11T09:00:00Z",
  },
  {
    id: "msg_012", projectId: "proj_002",
    senderId: "mgr_002",
    sender: { id: "mgr_002", name: "Grace Banda", role: "PROJECT_MANAGER" },
    message: "We're targeting 1 June 2026 for construction start, subject to planning approval. The design phase runs through May. I'll keep you updated.",
    createdAt: "2026-04-11T09:30:00Z",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getMockMessages(projectId: string): ChatMessage[] {
  return MOCK_MESSAGES.filter((m) => m.projectId === projectId).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

export function getMockConversations(
  projects: { id: string; title: string }[]
): Conversation[] {
  return projects.map((p) => {
    const msgs = getMockMessages(p.id);
    return {
      projectId:    p.id,
      projectTitle: p.title,
      lastMessage:  msgs[msgs.length - 1] ?? null,
      unreadCount:  msgs.filter((m) => m.sender.role !== "CLIENT").length > 0 ? 1 : 0,
    };
  });
}

/** Format ISO timestamp relative to now. */
export function fmtMessageTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86_400_000);

  if (diffDays === 0)
    return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7)
    return d.toLocaleDateString("en-GB", { weekday: "short" });
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/** Group messages by calendar date for section headers. */
export function groupByDate(
  messages: ChatMessage[]
): { date: string; messages: ChatMessage[] }[] {
  const map = new Map<string, ChatMessage[]>();
  for (const m of messages) {
    const key = new Date(m.createdAt).toLocaleDateString("en-GB", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(m);
  }
  return Array.from(map.entries()).map(([date, messages]) => ({ date, messages }));
}
