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
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex items-start justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#2d4a6b]">
            <FolderKanban className="h-5 w-5 text-[#8fb9e8]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#2d4a6b]">Public Projects</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Manage the project pictures, descriptions, status labels, and ordering shown on the public Projects page.
            </p>
          </div>
        </div>

        <div className="hidden rounded-xl border border-zinc-200 bg-white px-4 py-3 text-xs text-zinc-500 md:flex md:items-center md:gap-2">
          <Globe2 size={15} className="text-[#8fb9e8]" />
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
