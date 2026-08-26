"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import {
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  ImageIcon,
  Loader2,
  Calendar,
} from "lucide-react";

interface ProjectOption {
  id:         string;
  title:      string;
  clientName: string;
}

interface ClientOption {
  id:   string;
  name: string;
}

interface RecordPaymentFormProps {
  projects:  ProjectOption[];
  clients:   ClientOption[];
  onCancel:  () => void;
}

const FIELD = "block w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 transition focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-100";
const LABEL = "mb-1.5 block text-sm font-medium text-zinc-700";

export default function RecordPaymentForm({ projects, clients, onCancel }: RecordPaymentFormProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const getLocalDateTimeString = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().slice(0, 16);
  };

  const [form, setForm] = useState({
    receiptType:  "PROJECT" as "PROJECT" | "PRODUCT",
    productBuyer: "WALK_IN" as "WALK_IN" | "ACCOUNT",
    projectId:    "",
    clientId:     "",
    guestName:    "",
    guestEmail:   "",
    amount:       "",
    currency:     "MWK" as "MWK" | "USD",
    description:  "",
    paidAt:       getLocalDateTimeString(),
    notes:        "",
  });

  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [preview,    setPreview]    = useState<string | null>(null);

  const [uploading,  setUploading]  = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState("");

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setError("");
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setUploading(true);

    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    try {
      const blob = await upload(`uploads/receipts/${file.name}`, file, {
        access:          "private",
        handleUploadUrl: "/api/upload/client",
      });
      setReceiptUrl(blob.url);
    } catch (err) {
      console.error("[manualPaymentUpload]", err);
      const msg = err instanceof Error ? err.message : "Upload failed. Please try again.";
      setError(msg);
      setPreview(null);
    } finally {
      setUploading(false);
    }
  }

  function removeReceipt() {
    setReceiptUrl(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (form.receiptType === "PROJECT" && !form.projectId) {
      setError("Please select a project.");
      return;
    }

    if (form.receiptType === "PRODUCT") {
      if (form.productBuyer === "ACCOUNT" && !form.clientId) {
        setError("Please select an existing client account.");
        return;
      }
      if (form.productBuyer === "WALK_IN") {
        if (!form.guestName.trim()) {
          setError("Please enter the customer’s name.");
          return;
        }
        if (!form.guestEmail.trim()) {
          setError("Please enter the customer’s email address.");
          return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.guestEmail.trim())) {
          setError("Please enter a valid email address.");
          return;
        }
      }
    }

    const numAmount = Number(form.amount);
    if (!numAmount || numAmount <= 0) {
      setError("Please enter a valid amount greater than 0.");
      return;
    }

    if (!form.description.trim()) {
      setError("Please describe what this payment covers.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const isProduct = form.receiptType === "PRODUCT";
      const res = await fetch("/api/admin/payments", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId:   form.receiptType === "PROJECT" ? form.projectId : undefined,
          clientId:    isProduct && form.productBuyer === "ACCOUNT" ? form.clientId : undefined,
          guestName:   isProduct && form.productBuyer === "WALK_IN" ? form.guestName.trim() : undefined,
          guestEmail:  isProduct && form.productBuyer === "WALK_IN" ? form.guestEmail.trim() : undefined,
          amount:      numAmount,
          currency:    form.currency,
          description: form.description.trim(),
          receiptUrl,
          paidAt:      form.paidAt
            ? (() => {
                const raw = form.paidAt.length === 16 ? `${form.paidAt}:00` : form.paidAt;
                const d = new Date(raw);
                return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
              })()
            : undefined,
          notes: form.notes.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to issue receipt. Please check your inputs.");
        setSubmitting(false);
        return;
      }

      router.push(`/dashboard/payments/${data.txRef}`);
      router.refresh();
    } catch (err) {
      console.error("[RecordPaymentForm]", err);
      setError("A network error occurred. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-600" />
          <div>{error}</div>
        </div>
      )}

      <div>
        <label className={LABEL}>Receipt For</label>
        <div className="grid grid-cols-2 gap-2">
          {([["PROJECT", "Service / Project"], ["PRODUCT", "Product Sale"]] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setForm((current) => ({
                  ...current,
                  receiptType: value,
                  projectId: "",
                  clientId: "",
                  guestName: "",
                  guestEmail: "",
                  productBuyer: value === "PRODUCT" ? "WALK_IN" : current.productBuyer,
                }));
                setError("");
              }}
              disabled={submitting}
              className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${form.receiptType === value ? "border-[#35475D] bg-[#35475D] text-white" : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {form.receiptType === "PROJECT" ? (
        <div>
          <label className={LABEL}>Select Project</label>
          <select
            className={FIELD}
            value={form.projectId}
            onChange={(e) => set("projectId", e.target.value)}
            disabled={submitting}
          >
            <option value="">-- Choose Project --</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.title} (Client: {p.clientName})</option>
            ))}
          </select>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className={LABEL}>Customer</label>
            <div className="grid grid-cols-2 gap-2">
              {([["WALK_IN", "Walk-in (no account)"], ["ACCOUNT", "Existing account"]] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setForm((current) => ({
                      ...current,
                      productBuyer: value,
                      clientId: "",
                      guestName: "",
                      guestEmail: "",
                    }));
                    setError("");
                  }}
                  disabled={submitting}
                  className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${form.productBuyer === value ? "border-[#35475D] bg-[#35475D] text-white" : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-zinc-500">
              Most product buyers won’t have a portal account — enter their name and email.
              Link an existing client only if they already have one.
            </p>
          </div>

          {form.productBuyer === "WALK_IN" ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2 sm:col-start-1">
                <label className={LABEL}>Customer name</label>
                <input
                  type="text"
                  className={FIELD}
                  placeholder="e.g. Mahala Jimu"
                  value={form.guestName}
                  onChange={(e) => set("guestName", e.target.value)}
                  disabled={submitting}
                  autoComplete="name"
                />
              </div>
              <div className="sm:col-span-2">
                <label className={LABEL}>Email address</label>
                <input
                  type="email"
                  className={FIELD}
                  placeholder="customer@email.com"
                  value={form.guestEmail}
                  onChange={(e) => set("guestEmail", e.target.value)}
                  disabled={submitting}
                  autoComplete="email"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className={LABEL}>Select Client</label>
              <select
                className={FIELD}
                value={form.clientId}
                onChange={(e) => set("clientId", e.target.value)}
                disabled={submitting}
              >
                <option value="">-- Choose Client --</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <label className={LABEL}>Amount Paid</label>
          <input
            type="number"
            min="1"
            step="any"
            className={FIELD}
            placeholder="e.g. 500000"
            value={form.amount}
            onChange={(e) => set("amount", e.target.value)}
            disabled={submitting}
          />
        </div>
        <div>
          <label className={LABEL}>Currency</label>
          <select
            className={FIELD}
            value={form.currency}
            onChange={(e) => set("currency", e.target.value as "MWK" | "USD")}
            disabled={submitting}
          >
            <option value="MWK">MWK (MK)</option>
            <option value="USD">USD ($)</option>
          </select>
        </div>
      </div>

      <div>
        <label className={LABEL}>
          <span className="flex items-center gap-1.5">
            <Calendar size={14} className="text-zinc-500" /> Date & Time Paid
          </span>
        </label>
        <input
          type="datetime-local"
          className={FIELD}
          value={form.paidAt}
          onChange={(e) => set("paidAt", e.target.value)}
          disabled={submitting}
        />
      </div>

      <div>
        <label className={LABEL}>{form.receiptType === "PROJECT" ? "Description / Purpose" : "Product Details"}</label>
        <textarea
          rows={2}
          className={FIELD}
          placeholder={form.receiptType === "PROJECT" ? "e.g. Office cash deposit for Milestone 2" : "e.g. 50 concrete blocks, 2 bags of cement"}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          disabled={submitting}
        />
      </div>

      <div>
        <label className={LABEL}>Upload Cash Receipt / Proof (optional)</label>
        {preview ? (
          <div className="relative mt-1 w-full overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Receipt preview" className="h-40 w-full object-contain p-2" />
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                <Loader2 size={20} className="animate-spin text-zinc-500" />
              </div>
            )}
            {!uploading && (
              <button
                type="button"
                onClick={removeReceipt}
                className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800/70 text-white hover:bg-zinc-800 transition-colors"
                title="Remove receipt"
              >
                <X size={12} />
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading || submitting}
            className="mt-1 flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-zinc-200 px-4 py-5 text-sm text-zinc-400 transition-colors hover:border-[#35475D] hover:text-[#35475D] disabled:opacity-50"
          >
            <ImageIcon size={20} className="text-zinc-400" />
            <span className="font-medium">Click to upload receipt image</span>
            <span className="text-xs text-zinc-400">JPEG, PNG, WEBP · Max 5 MB</span>
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleFileChange}
          disabled={submitting}
        />
        {uploading && !preview && (
          <p className="mt-1 flex items-center gap-1.5 text-xs text-zinc-500">
            <Loader2 size={12} className="animate-spin" /> Uploading proof…
          </p>
        )}
        {receiptUrl && !uploading && (
          <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-blue-600">
            <CheckCircle2 size={12} /> Proof image successfully uploaded
          </p>
        )}
      </div>

      <div>
        <label className={LABEL}>Admin Internal Notes (optional)</label>
        <input
          type="text"
          className={FIELD}
          placeholder="e.g. Received by Blantyre office cashier"
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          disabled={submitting}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting || uploading}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#35475D] py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#283546] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <><Loader2 size={14} className="animate-spin" /> Recording…</>
          ) : (
            <><Upload size={14} /> Record & Issue Receipt</>
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="flex-1 rounded-xl border border-zinc-200 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
