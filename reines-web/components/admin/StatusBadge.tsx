import { STATUS_META } from "@/lib/mock-admin";

export default function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? { label: status, classes: "bg-zinc-100 text-zinc-600 border-zinc-200" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${meta.classes}`}>
      {meta.label}
    </span>
  );
}
