import Link from "next/link";
import { FolderSearch, LayoutDashboard } from "lucide-react";

export default function DashboardNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 mb-5">
        <FolderSearch className="h-7 w-7 text-zinc-400" />
      </div>
      <h2 className="text-lg font-bold text-zinc-900">Page not found</h2>
      <p className="mt-2 text-sm text-zinc-500 max-w-sm">
        This dashboard page doesn&apos;t exist. It may have been moved or the link is incorrect.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 [#2d4a6b] px-4 py-2 text-sm font-medium text-white hover:bg-[#1a2f4a] transition-colors"
      >
        <LayoutDashboard size={13} /> Back to Dashboard
      </Link>
    </div>
  );
}
