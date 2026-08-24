"use client";

import { useEffect, useState } from "react";
import { FileText, Loader2, ShieldCheck, ShieldX } from "lucide-react";
import SlidePanel from "./SlidePanel";

export type ClientVerificationData = {
  id: string;
  name: string;
  email: string;
  verificationStatus: "UNVERIFIED" | "PENDING" | "APPROVED" | "REJECTED" | null;
  verificationFullName: string | null;
  verificationPhone: string | null;
  verificationAddress: string | null;
  verificationOccupation: string | null;
  verificationIdType: string | null;
  verificationIdNumber: string | null;
  verificationDocumentUrl: string | null;
  verificationAdminNotes: string | null;
  verificationSubmittedAt: string | null;
};

interface Props {
  open: boolean;
  onClose: () => void;
  client: ClientVerificationData | null;
  onSuccess: () => void;
}

export default function ClientVerificationPanel({ open, onClose, client, onSuccess }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && client) {
      setAdminNotes(client.verificationAdminNotes || "");
      setError("");
    }
  }, [open, client]);

  if (!client) return null;

  async function handleAction(status: "APPROVED" | "REJECTED") {
    if (!client) return;
    const clientId = client.id;
    setIsSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: status === "APPROVED" ? "APPROVE" : "REJECT",
          notes: adminNotes.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update verification status.");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const isPending = client.verificationStatus === "PENDING";

  return (
    <SlidePanel
      open={open}
      onClose={onClose}
      title="Review Identity Verification"
      subtitle={`Application for ${client.name} (${client.email})`}
      width="lg"
    >
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
          
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-zinc-900 border-b pb-2">Client Submitted Details</h3>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-zinc-500 font-medium">Full Name on ID</p>
                <p className="text-zinc-900">{client.verificationFullName || "Not provided"}</p>
              </div>
              <div>
                <p className="text-zinc-500 font-medium">Phone Number</p>
                <p className="text-zinc-900">{client.verificationPhone || "Not provided"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-zinc-500 font-medium">Physical Address</p>
                <p className="text-zinc-900">{client.verificationAddress || "Not provided"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-zinc-500 font-medium">Occupation</p>
                <p className="text-zinc-900">{client.verificationOccupation || "Not provided"}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-zinc-900 border-b pb-2">Document Information</h3>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-zinc-500 font-medium">Document Type</p>
                <p className="text-zinc-900 capitalize">
                  {client.verificationIdType?.replace("_", " ").toLowerCase() || "Not provided"}
                </p>
              </div>
              <div>
                <p className="text-zinc-500 font-medium">Document Number</p>
                <p className="text-zinc-900">{client.verificationIdNumber || "Not provided"}</p>
              </div>
            </div>

            {client.verificationDocumentUrl ? (
              <div className="mt-4">
                <p className="text-zinc-500 font-medium text-sm mb-2">Uploaded Document</p>
                <a
                  href={`/api/media?url=${encodeURIComponent(client.verificationDocumentUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 transition-colors"
                >
                  <div className="h-10 w-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                    <FileText size={20} />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-medium text-zinc-900 truncate">View ID Document</p>
                    <p className="text-xs text-zinc-500">Opens in a new tab</p>
                  </div>
                </a>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-center text-sm text-zinc-500">
                No document uploaded
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-zinc-900 border-b pb-2">Admin Resolution</h3>
            <div className="space-y-2">
              <label htmlFor="adminNotes" className="block text-sm font-medium text-zinc-700">
                Admin Notes (Optional, sent to client on rejection)
              </label>
              <textarea
                id="adminNotes"
                rows={3}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add any internal notes or reasons for rejection..."
                className="w-full rounded-xl border-zinc-200 bg-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
          </div>

        </div>

        <div className="border-t border-zinc-200 bg-zinc-50 px-6 py-4">
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleAction("REJECTED")}
              disabled={isSubmitting || !isPending}
              className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <ShieldX size={16} />}
              Reject Client
            </button>
            <button
              type="button"
              onClick={() => handleAction("APPROVED")}
              disabled={isSubmitting || !isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
              Approve Client
            </button>
          </div>
        </div>
      </div>
    </SlidePanel>
  );
}
