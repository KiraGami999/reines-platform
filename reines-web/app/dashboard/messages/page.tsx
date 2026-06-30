import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getConversations } from "@/lib/messages";
import { ConversationList } from "@/components/dashboard/ConversationList";
import { MessageSquare, PenSquare } from "lucide-react";

export const metadata = { title: "Messages – Reines Portal" };

export default async function MessagesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id: userId, role } = session.user;

  const conversations = await getConversations(userId, role);
  const totalUnread   = conversations.reduce((s, c) => s + c.unreadCount, 0);

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Page header */}
      <div className="shrink-0 px-1 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Messages</h1>
            {totalUnread > 0 && (
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[#8fb9e8] px-1.5 text-xs font-bold text-[#2d4a6b]">
                {totalUnread}
              </span>
            )}
          </div>
        </div>
        <p className="mt-0.5 text-sm text-zinc-500">
          {conversations.length} project conversation{conversations.length !== 1 ? "s" : ""}
          {role === "ADMIN" && " · All projects"}
          {role === "PROJECT_MANAGER" && " · Your managed projects"}
        </p>
      </div>

      {/* Two-column panel */}
      <div className="flex flex-1 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">

        {/* Conversation sidebar */}
        <div className="w-full overflow-y-auto border-r border-zinc-100 sm:w-80 lg:w-72 xl:w-80">
          <div className="sticky top-0 border-b border-zinc-100 bg-white px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
              Conversations
            </p>
          </div>
          <ConversationList conversations={conversations} />
        </div>

        {/* Empty right pane — desktop only */}
        <div className="hidden flex-1 items-center justify-center sm:flex">
          <div className="max-w-xs text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100">
              {conversations.length === 0
                ? <MessageSquare size={28} className="text-zinc-300" />
                : <PenSquare    size={26} className="text-zinc-300" />}
            </div>
            <h2 className="mt-4 text-base font-semibold text-zinc-600">
              {conversations.length === 0 ? "No conversations yet" : "Select a conversation"}
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              {conversations.length === 0
                ? "Conversations are created automatically for each project."
                : "Choose a project from the list on the left to view messages."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
