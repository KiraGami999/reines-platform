"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Bot, Loader2, MessageCircle, Send, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content: "Hi, I am Reines AI. Ask me about our services, products, projects, or how to contact the team.",
};

function createMessage(role: ChatMessage["role"], content: string): ChatMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role,
    content,
  };
}

export function ReinesChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const question = input.trim();
    if (!question || loading) return;

    const userMessage = createMessage("user", question);
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInput("");
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages
            .filter((message) => message.id !== WELCOME_MESSAGE.id)
            .slice(-8)
            .map(({ role, content }) => ({ role, content })),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error ?? "Reines AI could not respond right now.");
      }

      setMessages((current) => [
        ...current,
        createMessage("assistant", data.reply ?? "Please contact Reines for more information."),
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Reines AI is unavailable right now.";
      setError(message);
      setMessages((current) => [
        ...current,
        createMessage("assistant", "Sorry, I could not answer that right now. Please try again or contact Reines directly."),
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
      {open && (
        <section className="mb-3 flex h-[520px] w-[min(92vw,380px)] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl shadow-black/20">
          <header className="flex items-center justify-between bg-[#2d4a6b] px-4 py-3 text-white">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                <Bot size={19} />
              </div>
              <div>
                <p className="text-sm font-bold">Reines AI</p>
                <p className="text-xs text-zinc-300">Website assistant</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg p-2 text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Close Reines AI"
            >
              <X size={17} />
            </button>
          </header>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-zinc-50 p-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                  message.role === "user"
                    ? "ml-auto bg-[#2d4a6b] text-white"
                    : "mr-auto border border-zinc-200 bg-white text-zinc-700"
                )}
              >
                {message.content}
              </div>
            ))}

            {loading && (
              <div className="mr-auto inline-flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-500">
                <Loader2 size={14} className="animate-spin" />
                Thinking...
              </div>
            )}
          </div>

          {error && (
            <p className="border-t border-blue-100 bg-blue-50 px-4 py-2 text-xs text-blue-700">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="flex gap-2 border-t border-zinc-200 bg-white p-3">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about Reines..."
              maxLength={600}
              className="min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 caret-[#2d4a6b] outline-none placeholder:text-zinc-400 focus:border-[#8fb9e8] focus:ring-2 focus:ring-[#8fb9e8]/20"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#8fb9e8] text-[#2d4a6b] transition-colors hover:bg-[#b8d4f2] disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Send message"
            >
              {loading ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex items-center gap-2 rounded-full bg-[#2d4a6b] px-4 py-3 text-sm font-semibold text-white shadow-xl shadow-black/20 transition-all hover:-translate-y-0.5 hover:bg-[#1a2f4a]"
        aria-label="Open Reines AI chatbot"
      >
        <MessageCircle size={18} />
        Reines AI
      </button>
    </div>
  );
}
