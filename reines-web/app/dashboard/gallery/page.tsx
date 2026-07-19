import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getGalleryProjects, type GalleryProject } from "@/lib/gallery";
import { GalleryGrid } from "@/components/dashboard/GalleryGrid";
import type { ProjectUpdate } from "@/models/project";
import { ImageIcon, FolderKanban, Plus, Camera, FileText } from "lucide-react";

export const metadata = { title: "Progress Gallery – Reines Portal" };

// ─── Per-project section ──────────────────────────────────────────────────────

function ProjectSection({
  project,
  canUpload,
}: {
  project:   GalleryProject;
  canUpload: boolean;
}) {
  const photoCount  = project.updates.filter((u: ProjectUpdate) => u.imageUrl).length;
  const totalCount  = project.updates.length;

  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
      {/* Section header */}
      <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-zinc-900">{project.title}</h2>
          <p className="mt-0.5 text-xs text-zinc-400">
            <span className="inline-flex items-center gap-1">
              <Camera size={10} /> {photoCount} photo{photoCount !== 1 ? "s" : ""}
            </span>
            <span className="mx-1.5 text-zinc-200">·</span>
            <span className="inline-flex items-center gap-1">
              <FileText size={10} /> {totalCount} update{totalCount !== 1 ? "s" : ""}
            </span>
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {canUpload && (
            <Link
              href={`/dashboard/projects/${project.id}/gallery?tab=upload`}
              className="flex items-center gap-1.5 rounded-lg bg-[#2d4a6b] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-zinc-800"
            >
              <Plus size={12} /> Add Update
            </Link>
          )}
          <Link
            href={`/dashboard/projects/${project.id}/gallery`}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50"
          >
            <FolderKanban size={12} /> View Project
          </Link>
        </div>
      </div>

      {/* Gallery grid */}
      <div className="p-5">
        <GalleryGrid updates={project.updates} projectTitle={project.title} />
      </div>
    </section>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyGallery({ canUpload }: { canUpload: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-white py-20 text-center">
      <ImageIcon size={40} className="text-zinc-200" />
      <h3 className="mt-4 text-base font-semibold text-zinc-700">No gallery content yet</h3>
      <p className="mt-2 max-w-xs text-sm text-zinc-400">
        {canUpload
          ? "Open a project and post your first progress update with photos."
          : "Your project manager will post progress photos and updates here."}
      </p>
      {canUpload && (
        <Link
          href="/dashboard/manage/projects"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#2d4a6b] px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          <FolderKanban size={14} /> Go to Projects
        </Link>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function GalleryPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id: userId, role } = session.user;
  const canUpload = role === "ADMIN" || role === "PROJECT_MANAGER";

  const projects = await getGalleryProjects(userId, role);

  const totalProjects = projects.length;
  const totalPhotos   = projects.reduce(
    (s, p) => s + p.updates.filter((u) => u.imageUrl).length,
    0
  );
  const totalUpdates  = projects.reduce((s, p) => s + p.updates.length, 0);
  const textOnly      = totalUpdates - totalPhotos;

  return (
    <div className="mx-auto max-w-7xl space-y-6">

      {/* ── Page header ── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Progress Gallery</h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            {totalPhotos} photo{totalPhotos !== 1 ? "s" : ""} across {totalProjects} project{totalProjects !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* ── Stats strip ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Projects",      value: totalProjects, icon: FolderKanban, accent: true },
          { label: "Total Updates", value: totalUpdates,  icon: FileText      },
          { label: "With Photos",   value: totalPhotos,   icon: Camera        },
          { label: "Text Only",     value: textOnly,      icon: FileText      },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className={`flex items-center gap-3 rounded-xl border p-4 ${
                s.accent
                  ? "border-[#8fb9e8]/30 bg-[#2d4a6b]"
                  : "border-zinc-200 bg-white"
              }`}
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                  s.accent ? "bg-white/10" : "bg-zinc-100"
                }`}
              >
                <Icon size={16} className="text-zinc-500" />
              </div>
              <div>
                <p className={`text-xl font-extrabold ${s.accent ? "text-white" : "text-[#2d4a6b]"}`}>
                  {s.value}
                </p>
                <p className={`text-xs ${s.accent ? "text-zinc-400" : "text-zinc-400"}`}>
                  {s.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Projects or empty ── */}
      {projects.length === 0 ? (
        <EmptyGallery canUpload={canUpload} />
      ) : (
        <div className="space-y-6">
          {projects.map((project) => (
            <ProjectSection
              key={project.id}
              project={project}
              canUpload={canUpload}
            />
          ))}
        </div>
      )}
    </div>
  );
}
