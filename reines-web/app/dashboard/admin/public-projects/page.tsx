import { FolderKanban, Globe2 } from "lucide-react";
import PublicProjectsForm from "@/components/admin/PublicProjectsForm";
import {
  AVAILABLE_PUBLIC_PROJECT_IMAGES,
  getAdminPublicProjects,
} from "@/lib/public-projects";

export const metadata = { title: "Public Projects - Reines Admin" };
export const dynamic = "force-dynamic";

export default async function AdminPublicProjectsPage() {
  const { projects, usingFallback } = await getAdminPublicProjects();

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl">
      <div className="mb-6 flex items-start justify-between gap-4 sm:mb-8 sm:gap-6">
        <div className="flex min-w-0 items-start gap-3">
          <div className="hidden h-11 w-11 shrink-0 items-center justify-center sm:flex">
            <FolderKanban className="h-5 w-5 text-zinc-500" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-[#35475D] sm:text-2xl">Public Projects</h1>
            <p className="mt-1 text-sm leading-relaxed text-zinc-500">
              Manage the project pictures, descriptions, status labels, and ordering shown on the public Projects page.
            </p>
          </div>
        </div>

        <div className="hidden shrink-0 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-xs text-zinc-500 md:flex md:items-center md:gap-2">
          <Globe2 size={15} className="text-zinc-500" />
          Public website content
        </div>
      </div>

      <PublicProjectsForm
        initialProjects={projects}
        availableImages={AVAILABLE_PUBLIC_PROJECT_IMAGES}
        usingFallback={usingFallback}
      />
    </div>
  );
}
