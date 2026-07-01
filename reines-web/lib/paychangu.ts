/**
 * Paychangu API Client
 * Docs: https://developer.paychangu.com
 *
 * Environment variables required:
 *   PAYCHANGU_SECRET_KEY     — from https://in.paychangu.com/user/api
 *                              Prefix with "test-" for test keys, "live-" for live keys.
 *   PAYCHANGU_WEBHOOK_SECRET — from the same dashboard page (set after going live)
 *   NEXTAUTH_URL             — public base URL of this app (e.g. https://yourapp.com)
 */

import crypto from "crypto";

const PAYCHANGU_API = "https://api.paychangu.com";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InitiatePaymentParams {
  txRef:       string;
  amount:      number;
  currency?:   "MWK" | "USD";
  email:       string;
  firstName:   string;
  lastName:    string;
  description: string;
  title:       string;
  meta?:       Record<string, string>;
}

export interface PaychanguCheckoutResponse {
  message: string;
  status:  "success" | "error";
  data: {
    event:        string;
    checkout_url: string;
    data: {
      tx_ref:   string;
      currency: string;
      amount:   number;
      mode:     "live" | "test";
      status:   string;
    };
  };
}

export interface PaychanguWebhookPayload {
  event_type:  string;
  currency:    string;
  amount:      number;
  charge:      string;
  mode:        "live" | "test";
  type:        string;
  status:      "success" | "failed" | "pending";
  charge_id:   string;
  reference:   string;
  authorization?: {
    channel:      string;
    completed_at: string;
  };
  created_at: string;
  updated_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function secretKey(): string {
  const key = process.env.PAYCHANGU_SECRET_KEY;
  if (!key || key === "your-paychangu-secret-key-here") {
    throw new Error("PAYCHANGU_SECRET_KEY is not configured. Add it to your .env file.");
  }
  return key;
}

function appBaseUrl(): string {
  return (process.env.NEXTAUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

/** Returns true when running with a test key (safe to log more info). */
export function isTestMode(): boolean {
  const key = process.env.PAYCHANGU_SECRET_KEY ?? "";
  return key.startsWith("test-") || key === "your-paychangu-secret-key-here";
}

// ─── Initiate a payment session ───────────────────────────────────────────────

export async function initiatePayment(
  params: InitiatePaymentParams
): Promise<PaychanguCheckoutResponse> {
  const baseUrl = appBaseUrl();

  const body = {
    secret_key:   secretKey(),
    tx_ref:       params.txRef,
    amount:       String(params.amount),
    currency:     params.currency ?? "MWK",
    email:        params.email,
    first_name:   params.firstName,
    last_name:    params.lastName,
    // Both successful payments and cancellations are routed through /api/payments/callback.
    // PayChangu appends ?tx_ref=xxx&status=... so the handler can update the DB correctly.
    callback_url: `${baseUrl}/api/payments/callback`,
    return_url:   `${baseUrl}/api/payments/callback`,
    customization: {
      title:       params.title,
      description: params.description,
    },
    meta: params.meta ?? {},
  };

  const res = await fetch(`${PAYCHANGU_API}/payment`, {
    method:  "POST",
    headers: {
      "Accept":        "application/json",
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${secretKey()}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new Error(`Paychangu API error ${res.status}: ${text}`);
  }

  return res.json() as Promise<PaychanguCheckoutResponse>;
}

// ─── Verify webhook signature ──────────────────────────────────────────────

export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null
): boolean {
  const webhookSecret = process.env.PAYCHANGU_WEBHOOK_SECRET;
  if (!webhookSecret || webhookSecret === "your-paychangu-webhook-secret-here") {
    // In development without the secret configured, skip verification
    console.warn("[Paychangu] PAYCHANGU_WEBHOOK_SECRET not configured — skipping signature check.");
    return true;
  }
  if (!signatureHeader) return false;

  const computed = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(computed, "hex"),
    Buffer.from(signatureHeader, "hex")
  );
}

// ─── Generate a unique transaction reference ───────────────────────────────

export function generateTxRef(prefix = "REI"): string {
  const ts  = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `${prefix}-${ts}-${rnd}`;
}

// ─── Format payment amounts ────────────────────────────────────────────────

export function fmtPaymentAmount(amount: number, currency = "MWK"): string {
  if (currency === "MWK") {
    return `MK ${amount.toLocaleString("en-MW")}`;
  }
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}

// ─── Payment status meta ────────────────────────────────────────────────────

export const PAYMENT_STATUS_META: Record<string, { label: string; classes: string; dot: string }> = {
  PENDING:   { label: "Pending",   classes: "bg-blue-50  border-blue-200  text-blue-700",   dot: "bg-blue-400"   },
  SUCCESS:   { label: "Paid",      classes: "bg-blue-50 border-blue-200 text-blue-700", dot: "bg-blue-500" },
  FAILED:    { label: "Failed",    classes: "bg-blue-50    border-blue-200    text-blue-700",     dot: "bg-blue-500"     },
  CANCELLED: { label: "Cancelled", classes: "bg-zinc-100  border-zinc-200   text-zinc-500",    dot: "bg-zinc-400"    },
};
