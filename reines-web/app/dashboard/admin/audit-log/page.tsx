import Link from "next/link";
import { ClipboardList, Search } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Change Log | Reines Admin" };

const PAGE_SIZE = 50;

const ACTION_FILTERS: { value: string; label: string }[] = [
  { value: "", label: "All changes" },
  { value: "user.", label: "Users" },
  { value: "project.", label: "Projects" },
  { value: "payment.", label: "Payments" },
  { value: "verification.", label: "KYC / verification" },
  { value: "content.", label: "Public content" },
  { value: "enquiry.", label: "Enquiries" },
];

function formatWhen(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Blantyre",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function actionBadge(action: string): string {
  if (action.startsWith("user.")) return "bg-blue-50 text-blue-700 border-blue-200";
  if (action.startsWith("project.")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (action.startsWith("payment.")) return "bg-amber-50 text-amber-800 border-amber-200";
  if (action.startsWith("verification.")) return "bg-violet-50 text-violet-700 border-violet-200";
  if (action.startsWith("content.")) return "bg-sky-50 text-sky-700 border-sky-200";
  if (action.startsWith("enquiry.")) return "bg-zinc-100 text-zinc-600 border-zinc-200";
  return "bg-zinc-100 text-zinc-600 border-zinc-200";
}

interface PageProps {
  searchParams: Promise<{ q?: string; action?: string; page?: string }>;
}

export default async function AuditLogPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const actionPrefix = params.action ?? "";
  const page = Math.max(1, Number(params.page ?? "1") || 1);

  const where = {
    AND: [
      actionPrefix ? { action: { startsWith: actionPrefix } } : {},
      q
        ? {
            OR: [
              { summary: { contains: q, mode: "insensitive" as const } },
              { actorName: { contains: q, mode: "insensitive" as const } },
              { actorEmail: { contains: q, mode: "insensitive" as const } },
              { entityId: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {},
    ],
  };

  let logs: Awaited<ReturnType<typeof prisma.auditLog.findMany>> = [];
  let total = 0;
  let loadError: string | null = null;

  try {
    const [rows, count] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: PAGE_SIZE,
        skip: (page - 1) * PAGE_SIZE,
      }),
      prisma.auditLog.count({ where }),
    ]);
    logs = rows;
    total = count;
  } catch (err) {
    console.error("[AuditLogPage]", err);
    loadError = err instanceof Error ? err.message : "Failed to load the change log.";
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function pageHref(nextPage: number) {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (actionPrefix) sp.set("action", actionPrefix);
    if (nextPage > 1) sp.set("page", String(nextPage));
    const qs = sp.toString();
    return qs ? `/dashboard/admin/audit-log?${qs}` : "/dashboard/admin/audit-log";
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 sm:mb-8">
        <div className="flex items-start gap-3">
          <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 sm:flex">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-[#35475D] sm:text-2xl">Change Log</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Who changed what in the admin portal — name, email, and time — so the next admin can
              pick up the work. Times are Africa/Blantyre.
            </p>
          </div>
        </div>
      </div>

      <form className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center" method="get">
        <div className="relative w-full sm:max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search by admin, email, or change…"
            className="w-full rounded-xl border border-zinc-200 bg-white py-2 pl-9 pr-3 text-sm placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-100"
          />
        </div>
        <select
          name="action"
          defaultValue={actionPrefix}
          className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-100"
        >
          {ACTION_FILTERS.map((f) => (
            <option key={f.value || "all"} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-xl bg-[#35475D] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#283546]"
        >
          Filter
        </button>
      </form>

      {loadError ? (
        <div className="rounded-xl border border-orange-200 bg-orange-50 px-5 py-4 text-sm text-orange-800">
          <p className="font-semibold">Could not load the change log</p>
          <p className="mt-1 text-xs text-orange-700">{loadError}</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-white px-6 py-14 text-center">
          <ClipboardList className="mx-auto mb-3 h-8 w-8 text-zinc-300" />
          <p className="text-sm font-medium text-zinc-700">No changes recorded yet</p>
          <p className="mt-1 text-sm text-zinc-500">
            Creating users, approving payments, editing projects, and saving public content will
            appear here automatically.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-3 text-xs text-zinc-500">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
          </div>

          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-zinc-100 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">When</th>
                    <th className="px-4 py-3 font-medium">Admin</th>
                    <th className="px-4 py-3 font-medium">Action</th>
                    <th className="px-4 py-3 font-medium">What changed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {logs.map((log) => (
                    <tr key={log.id} className="align-top hover:bg-zinc-50/80">
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-zinc-500 tabular-nums">
                        {formatWhen(log.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-[#35475D]">
                          {log.actorName ?? "Unknown admin"}
                        </p>
                        <p className="text-xs text-zinc-500">{log.actorEmail ?? "—"}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${actionBadge(log.action)}`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-700">
                        <p>{log.summary}</p>
                        {log.entityId && (
                          <p className="mt-0.5 font-mono text-[11px] text-zinc-400">
                            {log.entityType} · {log.entityId}
                          </p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between gap-3">
              {page > 1 ? (
                <Link
                  href={pageHref(page - 1)}
                  className="rounded-xl border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50"
                >
                  Previous
                </Link>
              ) : (
                <span />
              )}
              <span className="text-xs text-zinc-500">
                Page {page} of {totalPages}
              </span>
              {page < totalPages ? (
                <Link
                  href={pageHref(page + 1)}
                  className="rounded-xl border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50"
                >
                  Next
                </Link>
              ) : (
                <span />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
