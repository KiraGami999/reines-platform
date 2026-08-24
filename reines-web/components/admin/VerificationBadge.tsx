import { ShieldAlert, ShieldCheck, ShieldQuestion, ShieldX } from "lucide-react";

export default function VerificationBadge({ status }: { status: "UNVERIFIED" | "PENDING" | "APPROVED" | "REJECTED" | null }) {
  if (!status || status === "UNVERIFIED") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
        <ShieldAlert size={12} />
        Unverified
      </span>
    );
  }
  if (status === "PENDING") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
        <ShieldQuestion size={12} />
        Pending Review
      </span>
    );
  }
  if (status === "APPROVED") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
        <ShieldCheck size={12} />
        Verified
      </span>
    );
  }
  if (status === "REJECTED") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
        <ShieldX size={12} />
        Rejected
      </span>
    );
  }
  return null;
}
