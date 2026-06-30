"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type KeyboardEvent,
} from "react";
import { Send, RefreshCw, AlertCircle, CheckCheck, Loader2, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { groupByDate } from "@/lib/mock-messages";
import type { ChatMessage } from "@/models/message";

// ─── Config ───────────────────────────────────────────────────────────────────

const POLL_MS   = 5_000;
const MSG_MAX   = 2_000;

// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({
  msg,
  isOwn,
  showSender,
  isPending,
}: {
  msg:        ChatMessage;
  isOwn:      boolean;
  showSender: boolean;
  isPending?: boolean;
}) {
  const time = new Date(msg.createdAt).toLocaleTimeString("en-GB", {
    hour:   "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={cn("flex flex-col", isOwn ? "items-end" : "items-start")}>
      {showSender && !isOwn && (
        <p className="mb-1 ml-1 text-[11px] font-semibold text-zinc-400">
          {msg.sender.name}
        </p>
      )}

      <div
        className={cn(
          "max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm transition-opacity",
          isOwn
            ? "rounded-br-sm bg-[#2d4a6b] text-white"
            : "rounded-bl-sm border border-zinc-100 bg-white text-zinc-800",
          isPending && "opacity-60"
        )}
      >
        {/* Preserve line breaks */}
        {msg.message.split("\n").map((line, i) => (
          <span key={i}>
            {line}
            {i < msg.message.split("\n").length - 1 && <br />}
          </span>
        ))}
      </div>

      {/* Meta row: time + delivery status */}
      <div
        className={cn(
          "mt-0.5 flex items-center gap-1 text-[10px] text-zinc-400",
          isOwn ? "mr-0.5 flex-row-reverse" : "ml-0.5"
        )}
      >
        <time>{time}</time>
        {isOwn && (
          isPending
            ? <Loader2 size={10} className="animate-spin" />
            : <CheckCheck size={10} className="text-zinc-400" />
        )}
      </div>
    </div>
  );
}

// ─── Date divider ─────────────────────────────────────────────────────────────

function DateDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="flex-1 border-t border-zinc-100" />
      <span className="rounded-full bg-zinc-100 px-3 py-0.5 text-[10px] font-semibold text-zinc-400">
        {label}
      </span>
      <div className="flex-1 border-t border-zinc-100" />
    </div>
  );
}

// ─── Chat input ───────────────────────────────────────────────────────────────

interface ChatInputProps {
  onSend:   (text: string) => Promise<void>;
  disabled: boolean;
  sending:  boolean;
}

function ChatInput({ onSend, disabled, sending }: ChatInputProps) {
  const [text, setText]     = useState("");
  const textareaRef         = useRef<HTMLTextAreaElement>(null);
  const charsLeft           = MSG_MAX - text.length;
  const nearLimit           = charsLeft < 200;

  function autoResize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }

  async function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || disabled || sending || trimmed.length > MSG_MAX) return;
    setText("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    await onSend(trimmed);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="shrink-0 border-t border-zinc-100 bg-white">
      {/* Character counter — only shown near limit */}
      {nearLimit && text.length > 0 && (
        <div className="flex justify-end px-4 pt-2">
          <span className={cn("text-[10px] font-medium", charsLeft < 0 ? "text-blue-500" : "text-blue-500")}>
            {charsLeft < 0 ? `${Math.abs(charsLeft)} over limit` : `${charsLeft} remaining`}
          </span>
        </div>
      )}

      <div className="flex items-end gap-2 p-3">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => { setText(e.target.value); autoResize(); }}
          onKeyDown={onKeyDown}
          disabled={disabled || sending}
          placeholder="Type a message… (Enter to send · Shift+Enter for new line)"
          rows={1}
          maxLength={MSG_MAX + 50}
          className="flex-1 resize-none rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 caret-[#2d4a6b] placeholder:text-zinc-400 focus:border-zinc-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-100 disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || disabled || sending || charsLeft < 0}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2d4a6b] text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Send message"
        >
          {sending
            ? <RefreshCw size={15} className="animate-spin" />
            : <Send size={15} />}
        </button>
      </div>
    </div>
  );
}

// ─── Main ChatWindow ──────────────────────────────────────────────────────────

interface CurrentUser {
  id:   string;
  name: string;
  role: string;
}

interface ChatWindowProps {
  projectId:       string;
  currentUser:     CurrentUser;
  initialMessages: ChatMessage[];
}

export function ChatWindow({
  projectId,
  currentUser,
  initialMessages,
}: ChatWindowProps) {
  const [messages,  setMessages]  = useState<ChatMessage[]>(initialMessages);
  const [sending,   setSending]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const bottomRef  = useRef<HTMLDivElement>(null);
  const isFirstLoad = useRef(true);

  // Scroll to bottom
  useEffect(() => {
    if (isFirstLoad.current) {
      // Instant scroll on mount
      bottomRef.current?.scrollIntoView({ behavior: "auto" });
      isFirstLoad.current = false;
    } else {
      // Smooth scroll when new messages arrive
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // ── Background polling every 5 s ─────────────────────────────────────────

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => {
          // Only update if there are actually new messages (avoids re-render flicker)
          const next: ChatMessage[] = data.messages ?? [];
          if (
            next.length !== prev.length ||
            next[next.length - 1]?.id !== prev[prev.length - 1]?.id
          ) {
            return next;
          }
          return prev;
        });
      }
    } catch {
      // Silent fail on network error — don't disrupt the user
    }
  }, [projectId]);

  useEffect(() => {
    const interval = setInterval(fetchMessages, POLL_MS);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  // ── Send ────────────────────────────────────────────────────────────────────

  async function handleSend(text: string) {
    setError(null);
    setSending(true);

    const optimisticId = `optimistic_${Date.now()}`;
    const optimistic: ChatMessage = {
      id:        optimisticId,
      projectId,
      senderId:  currentUser.id,
      sender:    { id: currentUser.id, name: currentUser.name, role: currentUser.role },
      message:   text,
      createdAt: new Date().toISOString(),
    };

    // Optimistic — show message immediately
    setMessages((prev) => [...prev, optimistic]);

    try {
      const res = await fetch(`/api/projects/${projectId}/messages`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ message: text }),
      });

      if (!res.ok) {
        // Roll back
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to send. Please try again.");
      } else {
        // Replace optimistic with confirmed server record
        const data = await res.json();
        setMessages((prev) =>
          prev.map((m) => (m.id === optimisticId ? data.message : m))
        );
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      setError("Network error. Please check your connection and try again.");
    } finally {
      setSending(false);
    }
  }

  const groups = groupByDate(messages);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-zinc-50">

      {/* ── Messages area ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4">

        {/* Empty state */}
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white border border-zinc-200 text-3xl shadow-sm">
              <MessageCircle size={30} strokeWidth={1.7} className="text-zinc-300" />
            </div>
            <p className="text-sm font-semibold text-zinc-600">No messages yet</p>
            <p className="max-w-xs text-xs leading-relaxed text-zinc-400">
              {currentUser.role === "CLIENT"
                ? "Send a message to start the conversation with your project manager."
                : "Send the first message to get the conversation started with your client."}
            </p>
          </div>
        )}

        {/* Message groups by date */}
        <div className="space-y-0.5">
          {groups.map((group) => (
            <div key={group.date}>
              <DateDivider label={group.date} />
              <div className="space-y-2">
                {group.messages.map((msg, i) => {
                  const isOwn      = msg.senderId === currentUser.id;
                  const prev       = group.messages[i - 1];
                  const showSender = !prev || prev.senderId !== msg.senderId;
                  const isPending  = msg.id.startsWith("optimistic_");
                  return (
                    <MessageBubble
                      key={msg.id}
                      msg={msg}
                      isOwn={isOwn}
                      showSender={showSender}
                      isPending={isPending}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div ref={bottomRef} className="h-2" />
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className="mx-3 mb-2 flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-2.5 text-xs text-blue-600 shadow-sm">
          <AlertCircle size={13} className="shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            onClick={() => setError(null)}
            className="font-semibold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── Input ── */}
      <ChatInput onSend={handleSend} disabled={false} sending={sending} />
    </div>
  );
}
