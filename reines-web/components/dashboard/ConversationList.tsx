import Link from "next/link";
import { cn } from "@/lib/utils";
import { fmtMessageTime } from "@/lib/mock-messages";
import type { Conversation } from "@/models/message";
import { MessageSquare, FolderKanban } from "lucide-react";

interface ConversationListProps {
  conversations:    Conversation[];
  activeProjectId?: string;
}

export function ConversationList({ conversations, activeProjectId }: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100">
          <MessageSquare size={22} className="text-zinc-300" />
        </div>
        <div>
          <p className="text-sm font-medium text-zinc-500">No conversations yet</p>
          <p className="mt-0.5 text-xs text-zinc-400">
            Conversations appear here once projects are assigned.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ul>
      {conversations.map((conv) => {
        const isActive = conv.projectId === activeProjectId;
        const last     = conv.lastMessage;
        const isUnread = conv.unreadCount > 0 && !isActive;

        // Determine last message preview text
        let preview = "No messages yet — start the conversation";
        if (last) {
          const prefix = last.sender.role === "CLIENT" ? "You: " : `${last.sender.name}: `;
          preview = prefix + last.message;
        }

        return (
          <li key={conv.projectId}>
            <Link
              href={`/dashboard/messages/${conv.projectId}`}
              className={cn(
                "flex items-start gap-3 border-b border-zinc-50 px-4 py-3.5 transition-colors hover:bg-zinc-50",
                isActive && "bg-zinc-50 hover:bg-zinc-100"
              )}
            >
              {/* Project avatar */}
              <div className="relative mt-0.5 shrink-0">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold",
                    isActive
                      ? "bg-[#2d4a6b] text-zinc-300"
                      : isUnread
                      ? "bg-zinc-200 text-zinc-600"
                      : "bg-zinc-100 text-zinc-500"
                  )}
                >
                  {conv.projectTitle.charAt(0)}
                </div>
                {/* Unread dot */}
                {isUnread && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-[#8fb9e8] ring-2 ring-white" />
                )}
              </div>

              {/* Text block */}
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p
                    className={cn(
                      "truncate text-sm",
                      isUnread
                        ? "font-bold text-zinc-900"
                        : isActive
                        ? "font-semibold text-zinc-900"
                        : "font-medium text-zinc-700"
                    )}
                  >
                    {conv.projectTitle}
                  </p>
                  {last && (
                    <time className="shrink-0 text-[10px] text-zinc-400">
                      {fmtMessageTime(last.createdAt)}
                    </time>
                  )}
                </div>

                <p
                  className={cn(
                    "mt-0.5 truncate text-xs leading-relaxed",
                    isUnread
                      ? "font-medium text-zinc-600"
                      : last
                      ? "text-zinc-400"
                      : "italic text-zinc-300"
                  )}
                >
                  {preview}
                </p>
              </div>

              {/* Unread count badge */}
              {isUnread && conv.unreadCount > 0 && (
                <span className="ml-1 flex h-5 min-w-[1.25rem] shrink-0 items-center justify-center rounded-full bg-[#8fb9e8] px-1 text-[10px] font-bold text-[#2d4a6b]">
                  {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                </span>
              )}
            </Link>
          </li>
        );
      })}

      {/* Footer hint */}
      <li className="px-4 py-3">
        <div className="flex items-center gap-1.5 text-[10px] text-zinc-300">
          <FolderKanban size={10} />
          One conversation per project
        </div>
      </li>
    </ul>
  );
}
