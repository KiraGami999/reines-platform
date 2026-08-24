"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  Upload,
  Loader2,
  FileText,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

interface VerificationUser {
  verificationStatus:      "UNVERIFIED" | "PENDING" | "APPROVED" | "REJECTED";
  verificationFullName:    string | null;
  verificationPhone:       string | null;
  verificationAddress:     string | null;
  verificationIdType:      string | null;
  verificationIdNumber:    string | null;
  verificationDocumentUrl: string | null;
  verificationAdminNotes:  string | null;
}

interface VerificationPortalProps {
  initialUser: VerificationUser;
}

const FIELD = "block w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 transition focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-100";
const LABEL = "mb-1.5 block text-sm font-medium text-zinc-700";

export default function VerificationPortal({ initialUser }: VerificationPortalProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [status, setStatus] = useState(initialUser.verificationStatus);
  const [form, setForm] = useState({
    fullName: initialUser.verificationFullName ?? "",
    phone:    initialUser.verificationPhone ?? "",
    address:  initialUser.verificationAddress ?? "",
    idType:   (initialUser.verificationIdType as "ID_CARD" | "PASSPORT" | "DRIVING_LICENSE") ?? "ID_CARD",
    idNumber: initialUser.verificationIdNumber ?? "",
  });

  const [documentUrl, setDocumentUrl] = useState<string | null>(initialUser.verificationDocumentUrl);
  const [fileName,    setFileName]    = useState<string | null>(null);
  const [uploading,   setUploading]   = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState("");
  const [success,     setSuccess]     = useState(false);

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setError("");
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (15MB)
    if (file.size > 15 * 1024 * 1024) {
      setError("File is too large. Maximum size is 15MB.");
      return;
    }

    // Check file type
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowed.includes(file.type)) {
      setError("Unsupported file format. Please upload a JPEG, PNG, WEBP image, or PDF.");
      return;
    }

    setError("");
    setUploading(true);
    setFileName(file.name);

    try {
      const blob = await upload(`uploads/verifications/${file.name}`, file, {
        access:          "private",
        handleUploadUrl: "/api/upload/client",
      });
      setDocumentUrl(blob.url);
    } catch (err) {
      console.error("[verificationUpload]", err);
      const msg = err instanceof Error ? err.message : "Document upload failed. Please try again.";
      setError(msg);
      setFileName(null);
      setDocumentUrl(null);
    } finally {
      setUploading(false);
    }
  }

  function removeDocument() {
    setDocumentUrl(null);
    setFileName(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.fullName.trim()) return setError("Please enter your full name.");
    if (!form.phone.trim()) return setError("Please enter your phone number.");
    if (!form.address.trim()) return setError("Please enter your physical address.");
    if (!form.idNumber.trim()) return setError("Please enter your ID document number.");
    if (!documentUrl) return setError("Please upload a copy of your identity document.");

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/client/verification", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName:    form.fullName.trim(),
          phone:       form.phone.trim(),
          address:     form.address.trim(),
          idType:      form.idType,
          idNumber:    form.idNumber.trim(),
          documentUrl,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to submit verification. Please try again.");
        setSubmitting(false);
        return;
      }

      setSuccess(true);
      setStatus("PENDING");
      router.refresh();
    } catch (err) {
      console.error("[VerificationSubmit]", err);
      setError("A network error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ─── PENDING STATE ─────────────────────────────────────────────────────────
  if (status === "PENDING") {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-500">
            <Clock className="h-7 w-7 animate-pulse" />
          </div>
          <h2 className="mt-4 text-xl font-bold text-[#2d4a6b]">Verification Under Review</h2>
          <p className="mt-2 text-sm text-zinc-500 max-w-md">
            Thank you for submitting your identity verification documents. Our administrators are currently reviewing your details.
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            This review usually takes 24–48 business hours. We will email you once complete.
          </p>
        </div>

        <div className="mt-8 border-t border-zinc-100 pt-6">
          <h3 className="text-sm font-semibold text-zinc-950">Submitted Information</h3>
          <dl className="mt-4 grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 text-xs">
            <div>
              <dt className="font-medium text-zinc-500">Full Name</dt>
              <dd className="mt-1 font-semibold text-zinc-950">{form.fullName}</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-500">Phone</dt>
              <dd className="mt-1 font-semibold text-zinc-950">{form.phone}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="font-medium text-zinc-500">Address</dt>
              <dd className="mt-1 font-semibold text-zinc-950">{form.address}</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-500">ID Type</dt>
              <dd className="mt-1 font-semibold text-zinc-950 uppercase">
                {form.idType.replace("_", " ")}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-500">ID Number</dt>
              <dd className="mt-1 font-semibold text-zinc-950">{form.idNumber}</dd>
            </div>
          </dl>
        </div>
      </div>
    );
  }

  // ─── UNVERIFIED / REJECTED FORM ────────────────────────────────────────────
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500">
          <ShieldCheck className="h-5 w-5 text-[#2d4a6b]" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#2d4a6b]">Identity Verification</h2>
          <p className="text-xs text-zinc-500">Verify your profile to unlock all client features.</p>
        </div>
      </div>

      {status === "REJECTED" && (
        <div className="mt-6 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <ShieldAlert className="h-5 w-5 shrink-0 text-red-500" />
          <div>
            <h3 className="text-sm font-semibold text-red-800">Verification Rejected</h3>
            <p className="mt-1 text-xs text-red-700">
              Your previous request was declined. Please check the feedback below and resubmit:
            </p>
            <p className="mt-2 text-xs font-medium text-red-950 italic">
              &ldquo;{initialUser.verificationAdminNotes}&rdquo;
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label className={LABEL}>Full Name</label>
          <input
            type="text"
            className={FIELD}
            placeholder="John Doe"
            value={form.fullName}
            onChange={(e) => set("fullName", e.target.value)}
            disabled={submitting}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={LABEL}>Phone Number</label>
            <input
              type="tel"
              className={FIELD}
              placeholder="+265..."
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              disabled={submitting}
            />
          </div>

          <div>
            <label className={LABEL}>ID Document Type</label>
            <select
              className={FIELD}
              value={form.idType}
              onChange={(e) => set("idType", e.target.value)}
              disabled={submitting}
            >
              <option value="ID_CARD">National ID Card</option>
              <option value="PASSPORT">Passport</option>
              <option value="DRIVING_LICENSE">Driving License</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={LABEL}>Physical Address</label>
            <input
              type="text"
              className={FIELD}
              placeholder="House Number, Street Name, Area, City"
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="sm:col-span-2">
            <label className={LABEL}>Document ID / Serial Number</label>
            <input
              type="text"
              className={FIELD}
              placeholder="Enter ID number"
              value={form.idNumber}
              onChange={(e) => set("idNumber", e.target.value)}
              disabled={submitting}
            />
          </div>
        </div>

        {/* ── File Upload Box ───────────────────────────────────────────────── */}
        <div>
          <label className={LABEL}>Upload Scan or Photo of ID</label>
          {documentUrl ? (
            <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="h-6 w-6 shrink-0 text-[#2d4a6b]" />
                <span className="truncate text-xs font-semibold text-zinc-950">
                  {fileName ?? "Identity_Document_Uploaded.jpg"}
                </span>
              </div>
              <button
                type="button"
                onClick={removeDocument}
                disabled={submitting}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-600 transition"
              >
                Clear
              </button>
            </div>
          ) : (
            <div
              onClick={() => !uploading && fileRef.current?.click()}
              className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 px-6 py-8 text-center transition cursor-pointer hover:border-zinc-300 ${uploading ? "pointer-events-none bg-zinc-50" : "bg-white"}`}
            >
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="hidden"
                onChange={handleFileChange}
              />
              {uploading ? (
                <>
                  <Loader2 className="h-7 w-7 animate-spin text-[#2d4a6b]" />
                  <p className="mt-3 text-xs font-semibold text-zinc-900">Uploading document...</p>
                </>
              ) : (
                <>
                  <Upload className="h-7 w-7 text-zinc-400" />
                  <p className="mt-3 text-xs font-semibold text-zinc-900">
                    Click to upload ID, Passport, or Driving License
                  </p>
                  <p className="mt-1 text-[10px] text-zinc-500">
                    Supports JPEG, PNG, WEBP images or PDF up to 15MB
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="flex gap-2 rounded-xl bg-red-50 p-3.5 text-xs font-medium text-red-800">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || uploading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2d4a6b] py-3 text-sm font-semibold text-white transition hover:bg-[#1a2f4a] disabled:opacity-50"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Submitting application...
            </>
          ) : (
            "Submit Verification Details"
          )}
        </button>
      </form>
    </div>
  );
}
