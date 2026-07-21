import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getConversations, getProjectForChat, getProjectMessages } from "@/lib/messages";
import { ConversationList } from "@/components/dashboard/ConversationList";
import { ChatWindow } from "@/components/dashboard/ChatWindow";
import {
  ArrowLeft,
  ExternalLink,
  FolderKanban,
  User2,
} from "lucide-react";

export const metadata = { title: "Chat – Reines Portal" };

interface PageProps {
  params: Promise<{ projectId: string }>;
}

export default async function ProjectChatPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { projectId }    = await params;
  const { id: userId, role, name } = session.user;

  // Fetch project, conversations, and initial messages in parallel
  const [project, conversations, initialMessages] = await Promise.all([
    getProjectForChat(projectId, userId, role),
    getConversations(userId, role),
    getProjectMessages(projectId),
  ]);

  // Ownership enforced — 404 if project doesn't exist or user has no access
  if (!project) notFound();

  // Determine the "other party" name for the chat header
  const otherParty =
    role === "CLIENT"
      ? project.manager
      : project.client;

  const otherPartyRole =
    role === "CLIENT" ? "Project Manager" : "Client";

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Mobile back link */}
      <div className="shrink-0 px-1 pb-4 sm:hidden">
        <Link
          href="/dashboard/messages"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-700"
        >
          <ArrowLeft size={14} /> All conversations
        </Link>
      </div>

      {/* Main panel */}
      <div className="flex flex-1 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">

        {/* Conversation sidebar — hidden on mobile */}
        <div className="hidden w-72 shrink-0 flex-col overflow-hidden border-r border-zinc-100 sm:flex xl:w-80">
          <div className="sticky top-0 border-b border-zinc-100 bg-white px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
              Conversations
            </p>
          </div>
          <div className="flex-1 overflow-y-auto">
            <ConversationList
              conversations={conversations}
              activeProjectId={projectId}
            />
          </div>
        </div>

        {/* Chat area */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">

          {/* Chat header */}
          <div className="flex shrink-0 items-center justify-between border-b border-zinc-100 bg-white px-5 py-3">
            <div className="flex min-w-0 items-center gap-3">
              {/* Avatar */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2d4a6b] text-sm font-bold text-[#8fb9e8]">
                {project.title.charAt(0)}
              </div>
              {/* Project + other party */}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-zinc-900 leading-tight">
                  {project.title}
                </p>
                <p className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                  <User2 size={10} />
                  <span className="truncate">{otherParty.name}</span>
                  <span className="text-zinc-200">·</span>
                  {otherPartyRole}
                  {project.status === "IN_PROGRESS" && (
                    <>
                      <span className="text-zinc-200">·</span>
                      <span className="flex items-center gap-0.5 text-blue-500">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                        Active
                      </span>
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex shrink-0 items-center gap-2">
              <Link
                href={`/dashboard/projects/${projectId}`}
                className="hidden sm:flex items-center gap-1.5 rounded-xl border border-transparent px-3 py-1.5 text-sm text-zinc-500 transition-colors hover:border-zinc-200 hover:bg-zinc-50 hover:text-zinc-800"
              >
                <FolderKanban size={12} /> Project
              </Link>
              <Link
                href={`/dashboard/projects/${projectId}`}
                className="sm:hidden flex items-center justify-center h-8 w-8 rounded-lg border border-zinc-100 text-zinc-500 hover:bg-zinc-50"
                aria-label="View project"
              >
                <ExternalLink size={14} />
              </Link>
            </div>
          </div>

          {/* Chat window */}
          <div className="flex-1 overflow-hidden">
            <ChatWindow
              projectId={projectId}
              currentUser={{ id: userId, name, role }}
              initialMessages={initialMessages}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
