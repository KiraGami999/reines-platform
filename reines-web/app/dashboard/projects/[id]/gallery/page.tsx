import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getProjectForGallery } from "@/lib/gallery";
import { GalleryGrid } from "@/components/dashboard/GalleryGrid";
import { UploadForm } from "@/components/dashboard/UploadForm";
import { ArrowLeft, Images, Upload, Camera, FileText, Info } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Project Gallery – Reines Portal" };

interface PageProps {
  params:       Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function ProjectGalleryPage({ params, searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id }   = await params;
  const sp       = await searchParams;
  const tab      = sp.tab === "upload" ? "upload" : "gallery";

  const { id: userId, role } = session.user;
  const canUpload = role === "ADMIN" || role === "PROJECT_MANAGER";

  // Ownership-scoped — returns null if viewer has no access
  const project = await getProjectForGallery(id, userId, role);
  if (!project) notFound();

  const photoCount  = project.updates.filter((u) => u.imageUrl).length;
  const totalCount  = project.updates.length;

  // Clients are redirected away from the upload tab
  const activeTab = !canUpload && tab === "upload" ? "gallery" : tab;

  return (
    <div className="mx-auto max-w-5xl space-y-5">

      {/* Back */}
      <Link
        href={`/dashboard/projects/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-zinc-700"
      >
        <ArrowLeft size={14} /> Back to {project.title}
      </Link>

      {/* ── Hero ── */}
      <div className="overflow-hidden rounded-2xl bg-[#2d4a6b]">
        <div className="h-1 bg-[#8fb9e8]" />
        <div className="p-4 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#8fb9e8]">
            Progress Gallery
          </p>
          <h1 className="mt-1 text-xl font-extrabold text-white">{project.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-400">
            <span className="flex items-center gap-1.5">
              <Camera size={13} /> {photoCount} photo{photoCount !== 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-1.5">
              <FileText size={13} /> {totalCount} update{totalCount !== 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-1.5">
              By {project.manager.name}
            </span>
          </div>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div className="flex gap-1 rounded-xl border border-zinc-200 bg-white p-1">
        <Link
          href={`/dashboard/projects/${id}/gallery`}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-colors ${
            activeTab === "gallery"
              ? "bg-[#2d4a6b] text-white"
              : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800"
          }`}
        >
          <Images size={15} />
          Gallery
          {photoCount > 0 && (
            <span
              className={`rounded-full px-1.5 text-[10px] font-bold ${
                activeTab === "gallery" ? "bg-white/20 text-white" : "bg-zinc-100 text-zinc-500"
              }`}
            >
              {photoCount}
            </span>
          )}
        </Link>

        {canUpload && (
          <Link
            href={`/dashboard/projects/${id}/gallery?tab=upload`}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-colors ${
              activeTab === "upload"
                ? "bg-[#2d4a6b] text-white"
                : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800"
            }`}
          >
            <Upload size={15} />
            Post Update
          </Link>
        )}
      </div>

      {/* ── Gallery tab ── */}
      {activeTab === "gallery" && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6">
          <GalleryGrid
            updates={project.updates}
            projectTitle={project.title}
            projectId={id}
            canDelete={canUpload}
          />
        </div>
      )}

      {/* ── Upload tab ── */}
      {activeTab === "upload" && canUpload && (
        <div className="rounded-2xl border border-zinc-200 bg-white">
          {/* Upload header */}
          <div className="border-b border-zinc-100 px-6 py-4">
            <h2 className="text-sm font-semibold text-zinc-900">Post a Progress Update</h2>
            <p className="mt-0.5 text-xs text-zinc-400">
              Add a photo and note to keep your client informed of site progress.
            </p>
          </div>

          {/* Tips banner */}
          <div className="mx-6 mt-5 flex items-start gap-2.5 rounded-xl border border-blue-100 bg-blue-50 p-4">
            <Info size={14} className="mt-0.5 shrink-0 text-blue-500" />
            <p className="text-xs leading-relaxed text-blue-700">
              <span className="font-semibold">Tips for great updates:</span> Include clear photos showing progress,
              and write notes that explain what was completed — clients value detail. Each update is
              timestamped automatically.
            </p>
          </div>

          <div className="p-6">
            <UploadForm
              projectId={id}
              projectTitle={project.title}
              galleryHref={`/dashboard/projects/${id}/gallery`}
            />
          </div>
        </div>
      )}

      {/* ── Client read-only notice ── */}
      {!canUpload && (
        <p className="text-center text-xs text-zinc-400">
          Only your project manager can post updates. Contact them via{" "}
          <Link href="/dashboard/messages" className="text-[#8fb9e8] hover:underline">
            Messages
          </Link>{" "}
          if you have questions.
        </p>
      )}
    </div>
  );
}
