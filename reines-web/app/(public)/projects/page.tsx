import type { Metadata } from "next";
import Link from "next/link";
import { CurrentProjectsBanner } from "@/components/public/CurrentProjectsBanner";
import { PublicProjectsGallery } from "@/components/public/PublicProjectsGallery";
import { getPublicProjects } from "@/lib/public-projects";

export const metadata: Metadata = {
  title: "Projects — Reines Property Development",
  description: "Browse our portfolio of completed and ongoing property development projects.",
};

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const projects = await getPublicProjects();

  return (
    <>
      {/* Hero */}
      <section className="bg-[#2d4a6b] py-14 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#8fb9e8]">Our Portfolio</span>
          <h1 className="mt-3 max-w-2xl text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Projects we&apos;re proud to stand behind.
          </h1>
          <p className="mt-4 max-w-xl text-zinc-400">
            From single-family homes to large-scale developments — every project is delivered with the same commitment to quality, transparency, and on-time execution.
          </p>
        </div>
      </section>

      {/* Current Projects animated banner */}
      <CurrentProjectsBanner projects={projects} />

      {/* Projects grid */}
      <section className="bg-zinc-50 py-12 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <PublicProjectsGallery projects={projects} />
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#2d4a6b] py-16">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-bold text-white">Your project could be next.</h2>
          <p className="mt-3 text-zinc-400">Reach out and let&apos;s discuss what you&apos;re building.</p>
          <Link href="/contact" className="mt-6 inline-block  px-8 py-3 text-sm font-semibold text-[#2d4a6b] hover:bg-[#b8d4f2]">
            Start a Conversation
          </Link>
        </div>
      </section>
    </>
  );
}
