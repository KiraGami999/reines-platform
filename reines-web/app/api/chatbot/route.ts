import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "llama-3.1-8b-instant";

const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(1200),
});

const chatRequestSchema = z.object({
  messages: z.array(chatMessageSchema).min(1).max(8),
});

const REINES_KNOWLEDGE = `
Reines Property Development Limited is a Malawian company registered and incorporated in Blantyre on March 29, 2023 with registration number COY-REFW2A.

Core services and products:
- Property development.
- Building contracting for occupancy projects.
- Civil contracting for infrastructure and public works.
- Concrete products including blocks and pavers.
- Stone products including stone cladding.
- Industrial/cement-based adhesives and binding materials.

Website/portal guidance:
- Public visitors can learn about services, products, projects, market insights, and submit enquiries through the contact page.
- Clients can log in to view assigned projects, progress updates, gallery items, messages, payment history, and loyalty points.
- Project managers can view assigned projects, accept pending assignments, post progress updates, upload photos/documents, and message clients.
- Admins manage users, projects, public content, products, homepage ads, public project showcases, and client points.

Contact details:
- Phone: +(265) 883 15 72 09.
- Email: contact@reines.co.mw.
- Registered office: Joe & Max Chambers Office Complex, P.O. Box 3494, Blantyre, Malawi.

Important safety rules:
- Do not provide exact quotes, discounts, legal commitments, contract terms, or guaranteed timelines.
- Do not claim access to private project, payment, user, or account data.
- For pricing, contracts, private account issues, or project-specific decisions, ask the user to contact Reines directly or log in to the portal.
`;

function getLatestUserMessage(messages: z.infer<typeof chatMessageSchema>[]) {
  return [...messages].reverse().find((message) => message.role === "user")?.content ?? "";
}

export async function POST(req: NextRequest) {
  const parsed = chatRequestSchema.safeParse(await req.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please send a valid question." },
      { status: 422 }
    );
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Reines AI is not configured yet. Please add GROQ_API_KEY to the environment." },
      { status: 503 }
    );
  }

  const latestUserMessage = getLatestUserMessage(parsed.data.messages);
  if (!latestUserMessage) {
    return NextResponse.json(
      { error: "Please ask a question." },
      { status: 422 }
    );
  }

  const recentMessages = parsed.data.messages.slice(-6);

  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL ?? DEFAULT_MODEL,
        temperature: 0.3,
        max_tokens: 450,
        messages: [
          {
            role: "system",
            content: `You are Reines AI, a concise and professional website assistant for Reines Property Development Limited.

Use only the company knowledge below plus the user's current question and chat context. If you are unsure, say so and direct the visitor to contact Reines.

${REINES_KNOWLEDGE}`,
          },
          ...recentMessages,
        ],
      }),
    });

    const data = await response.json().catch(() => null) as {
      choices?: { message?: { content?: string } }[];
      error?: { message?: string };
    } | null;

    if (!response.ok) {
      console.error("[REINES_CHATBOT]", data?.error?.message ?? response.statusText);
      return NextResponse.json(
        { error: "Reines AI is busy right now. Please try again shortly." },
        { status: response.status === 429 ? 429 : 502 }
      );
    }

    const reply = data?.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      return NextResponse.json(
        { error: "Reines AI could not generate a response." },
        { status: 502 }
      );
    }

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("[REINES_CHATBOT]", err);
    return NextResponse.json(
      { error: "Reines AI is unavailable right now. Please try again shortly." },
      { status: 500 }
    );
  }
}
