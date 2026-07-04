import Link from "next/link";
import type { ElementType } from "react";
import { Building2, Factory, Hammer, House, Landmark, Layers3 } from "lucide-react";
import { FeaturedAdCarousel } from "@/components/public/FeaturedAdCarousel";
import { getHomepageAds, type HomepageAd } from "@/lib/homepage-ads";

export const dynamic = "force-dynamic";

// ─── Data ────────────────────────────────────────────────────────────────────

const stats = [
  { value: "2023", label: "Founded in Blantyre" },
  { value: "50",   label: "Full-time & part-time staff" },
  { value: "5",    label: "Core business interests" },
  { value: "MW",   label: "Projects & sites in Malawi" },
];

const services: { icon: ElementType; title: string; description: string }[] = [
  {
    icon: Building2,
    title: "Property Development",
    description:
      "Identifying investment opportunities, planning, designing, financing, and executing property development projects.",
  },
  {
    icon: House,
    title: "Building Contracting",
    description:
      "Construction of buildings for occupancy, delivered with strong workmanship, clear planning, and client confidence.",
  },
  {
    icon: Landmark,
    title: "Civil Contracting",
    description:
      "Construction of infrastructure and public works across Malawi with practical project management and dependable execution.",
  },
  {
    icon: Factory,
    title: "Concrete Products",
    description:
      "Manufacturing concrete products including blocks and a variety of pavers for building and construction needs.",
  },
  {
    icon: Hammer,
    title: "Binding Materials",
    description:
      "Manufacturing adhesives and binding materials, including industrial adhesives for construction applications.",
  },
  {
    icon: Layers3,
    title: "Stone Products",
    description:
      "Supplying stone products including a wide range of stone cladding for durable, refined finishes.",
  },
];

const features = [
  {
    title: "Integrity & Ethics",
    body: "Integrity, ethical conduct, and responsible decision-making sit at the core of how Reines approaches development.",
  },
  {
    title: "Workmanship & People",
    body: "Strong workmanship and skilled people enable the company to deliver consistent value across projects and sites.",
  },
  {
    title: "Environment & Value Chain",
    body: "The business builds strong foundations through in-house materials, responsible planning, and sustainable manufacturing focus.",
  },
];

// ─── Sections ────────────────────────────────────────────────────────────────

function Hero({ ads }: { ads: HomepageAd[] }) {
  return (
    <section className="relative overflow-hidden bg-[#243040] lg:flex lg:min-h-[92vh] lg:items-center">
      <div className="relative mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-24">
        <div className="grid grid-cols-1 gap-8 sm:gap-10 lg:grid-cols-2 lg:items-stretch lg:gap-12 xl:gap-16">
          {/* Left — ad carousel + compact featured strip (aligned with CTAs) */}
          <div className="mx-auto flex w-full max-w-md flex-col gap-4 lg:mx-0 lg:max-w-none">
            <FeaturedAdCarousel ads={ads} variant="panel" />
          </div>

          {/* Right — hero copy; buttons pinned to bottom to align with Featured Now */}
          <div className="flex w-full min-w-0 flex-col justify-between lg:pl-2 xl:pl-6">
            <div>
              <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-[11px] font-medium leading-snug text-zinc-300 sm:text-xs">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#8fb9e8]" />
                Blantyre, Malawi · Founded March 2023
              </span>

              <h1 className="mt-5 font-extrabold leading-[1.12] tracking-tight sm:mt-6">
                <span className="block text-[clamp(1.75rem,4.5vw,3rem)] text-white">
                  Precision in every detail,
                </span>
                <span className="mt-1 block text-[clamp(1.75rem,4.5vw,3rem)] text-[#9eb3c9]">
                  Passion in every project
                </span>
              </h1>

              <p className="mt-5 max-w-xl text-sm leading-relaxed text-zinc-300 sm:mt-6 sm:text-base lg:text-[1.05rem] lg:leading-7">
                Reines Property Development Limited is a company founded and headquartered in Blantyre, Malawi. Operating for over three years now, we have interests in property, construction, and manufacturing, with ambitions to expand into mining and steel. We offer an expansive range of products and services to support our clients&apos; infrastructure developments.
              </p>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4 lg:mt-0">
              <Link
                href="/projects"
                className="inline-flex items-center justify-center rounded-full bg-[#4a6278] px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#5a738c] sm:px-8"
              >
                View Our Projects
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-full border border-white/25 px-7 py-3 text-sm font-medium text-white transition-colors hover:border-white/45 hover:bg-white/5 sm:px-8"
              >
                Get a Quote
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent sm:h-24" />
    </section>
  );
}

function Stats() {
  return (
    <section className="border-y border-zinc-100 bg-white py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 sm:gap-8 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-2xl font-extrabold text-[#2d4a6b] sm:text-3xl md:text-4xl">{s.value}</p>
              <p className="mt-1 text-xs font-medium text-zinc-500 sm:text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Services() {
  return (
    <section className="bg-zinc-50 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#8fb9e8]">What We Do</span>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#2d4a6b] sm:text-4xl">Our Core Services</h2>
          <p className="mx-auto mt-4 max-w-2xl text-zinc-500">
            From development planning to construction manufacturing, Reines builds an integrated value chain for Malawi&apos;s growth.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.title} className="group rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#8fb9e8]/10 text-[#8fb9e8]">
                  <Icon size={22} strokeWidth={1.8} />
                </div>
              <h3 className="mt-4 text-base font-semibold text-[#2d4a6b]">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">{s.description}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <Link href="/services" className="text-sm font-medium text-[#8fb9e8] hover:underline">
            Explore all services →
          </Link>
        </div>
      </div>
    </section>
  );
}

function WhyReines() {
  return (
    <section className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-10 sm:gap-16 lg:grid-cols-2">
          {/* Text */}
          <div className="min-w-0">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#8fb9e8]">Why Choose Us</span>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#2d4a6b] sm:text-4xl">
              Built on values.<br />Strengthened by execution.
            </h2>
            <p className="mt-4 text-zinc-500">
              Our mission is to drive Malawi&apos;s development through high-quality property, construction, concrete products, building, and binding material manufacturing excellence with efficiency and value.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#8fb9e8]">Mission</p>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                  Drive Malawi&apos;s development through property, construction, concrete products, building, and binding material manufacturing excellence.
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#8fb9e8]">Vision</p>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                  Become Malawi and Southern Africa&apos;s most trusted and innovative property development, construction, and sustainable building manufacturer.
                </p>
              </div>
            </div>

            <div className="mt-10 space-y-6">
              {features.map((f) => (
                <div key={f.title} className="flex gap-4">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#8fb9e8]/15">
                    <span className="h-2 w-2 rounded-full bg-[#8fb9e8]" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#2d4a6b]">{f.title}</h4>
                    <p className="mt-1 text-sm text-zinc-500">{f.body}</p>
                  </div>
                </div>
              ))}
            </div>

            <Link
              href="/about"
              className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-[#8fb9e8] hover:underline"
            >
              Learn about our story →
            </Link>
          </div>

          {/* Visual block */}
          <div className="relative">
            <div className="overflow-hidden rounded-2xl bg-[#2d4a6b] p-8 shadow-xl">
              <div className="space-y-4">
                {["Investment Opportunity Identified", "Planning & Design Complete", "Financing & Procurement Active", "Execution Across Sites", "In-house Materials Support"].map((step, i) => (
                  <div key={i} className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm ${i < 2 ? "bg-[#8fb9e8]/15 text-[#8fb9e8]" : i === 2 ? "bg-white/10 text-white" : "bg-white/5 text-zinc-500"}`}>
                    <span className={`h-2 w-2 rounded-full ${i < 2 ? "bg-[#8fb9e8]" : i === 2 ? "bg-blue-400" : "bg-zinc-600"}`} />
                    {step}
                  </div>
                ))}
              </div>
              <p className="mt-6 text-center text-xs text-zinc-500">Integrated development value chain</p>
            </div>
            <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-2xl bg-[#8fb9e8]/20 blur-2xl" />
          </div>
        </div>
      </div>
    </section>
  );
}

function CtaBanner() {
  return (
    <section className="bg-[#2d4a6b] py-14 sm:py-20">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
        <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Ready to build with Reines?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm text-zinc-400 sm:text-base">
          Partner with a development, construction, and sustainable construction manufacturing company focused on strong foundations and long-term value.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-4">
          <Link href="/contact" className="inline-flex items-center justify-center rounded-lg bg-[#8fb9e8] px-8 py-3 text-sm font-semibold text-[#2d4a6b] hover:bg-[#b8d4f2]">
            Get a Free Quote
          </Link>
          <Link href="/projects" className="inline-flex items-center justify-center rounded-lg border border-zinc-600 px-8 py-3 text-sm font-medium text-zinc-300 hover:border-zinc-400 hover:text-white">
            View Projects
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const homepageAds = await getHomepageAds();

  return (
    <>
      <Hero ads={homepageAds} />
      <Stats />
      <Services />
      <WhyReines />
      <CtaBanner />
    </>
  );
}
