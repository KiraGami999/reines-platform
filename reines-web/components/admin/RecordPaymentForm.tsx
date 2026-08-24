"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import {
  Banknote,
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  ImageIcon,
  Loader2,
  FileText,
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

  // Format local date-time string: YYYY-MM-DDTHH:mm
  const getLocalDateTimeString = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().slice(0, 16);
  };

  const [form, setForm] = useState({
    receiptType: "PROJECT" as "PROJECT" | "PRODUCT",
    projectId:   "",
    clientId:    "",
    amount:      "",
    currency:    "MWK" as "MWK" | "USD",
    description: "",
    paidAt:      getLocalDateTimeString(),
    notes:       "",
  });

  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [preview,    setPreview]    = useState<string | null>(null);

  const [uploading,  setUploading]  = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState("");
  const [success,    setSuccess]    = useState(false);

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setError("");
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setUploading(true);

    // Show local preview
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

    if (form.receiptType === "PRODUCT" && !form.clientId) {
      setError("Please select the client.");
      return;
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
      const res = await fetch("/api/admin/payments", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId:   form.receiptType === "PROJECT" ? form.projectId : undefined,
          clientId:    form.receiptType === "PRODUCT" ? form.clientId : undefined,
          amount:      numAmount,
          currency:    form.currency,
          description: form.description.trim(),
          receiptUrl,
          paidAt:      form.paidAt
            ? (() => {
                // datetime-local is YYYY-MM-DDTHH:mm — append seconds so all browsers parse reliably
                const raw = form.paidAt.length === 16 ? `${form.paidAt}:00` : form.paidAt;
                const d = new Date(raw);
                return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
              })()
            : undefined,
          notes:       form.notes.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to issue receipt. Please check your inputs.");
        setSubmitting(false);
        return;
      }

      setSuccess(true);
      // Redirect to the generated receipt view page
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
      {/* Error alert */}
      {error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-600" />
          <div>{error}</div>
        </div>
      )}

      {/* Receipt type and customer */}
      <div>
        <label className={LABEL}>Receipt For</label>
        <div className="grid grid-cols-2 gap-2">
          {([["PROJECT", "Service / Project"], ["PRODUCT", "Product Sale"]] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                set("receiptType", value);
                setForm((current) => ({ ...current, projectId: "", clientId: "" }));
              }}
              disabled={submitting}
              className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${form.receiptType === value ? "border-[#2d4a6b] bg-[#2d4a6b] text-white" : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className={LABEL}>{form.receiptType === "PROJECT" ? "Select Project" : "Select Client"}</label>
        <select
          className={FIELD}
          value={form.receiptType === "PROJECT" ? form.projectId : form.clientId}
          onChange={(e) => set(form.receiptType === "PROJECT" ? "projectId" : "clientId", e.target.value)}
          disabled={submitting}
        >
          <option value="">-- Choose {form.receiptType === "PROJECT" ? "Project" : "Client"} --</option>
          {form.receiptType === "PROJECT"
            ? projects.map((p) => <option key={p.id} value={p.id}>{p.title} (Client: {p.clientName})</option>)
            : clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
        </select>
      </div>

      {/* Amount and Currency */}
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

      {/* Date & Time Paid */}
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

      {/* Description */}
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

      {/* Receipt File Upload */}
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
            className="mt-1 flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-zinc-200 px-4 py-5 text-sm text-zinc-400 transition-colors hover:border-[#2d4a6b] hover:text-[#2d4a6b] disabled:opacity-50"
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

      {/* Admin Notes */}
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

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting || uploading}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#2d4a6b] py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1a2f4a] disabled:opacity-60 disabled:cursor-not-allowed"
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
