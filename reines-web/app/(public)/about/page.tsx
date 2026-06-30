import type { Metadata } from "next";
import Link from "next/link";
import type { ElementType } from "react";
import { Binoculars, Building2, CheckCircle2, Factory, Leaf, Medal, Scale, ShieldCheck, Target, Users } from "lucide-react";
import { AboutStoryHero } from "@/components/public/AboutStoryHero";

export const metadata: Metadata = {
  title: "About Us — Reines Property Development",
  description: "Learn about our story, mission, and the team behind Reines Property Development.",
};

const values = [
  { icon: ShieldCheck, title: "Integrity", body: "We approach every project and client relationship with honesty, accountability, and responsible decision-making." },
  { icon: Medal, title: "Standards", body: "We uphold strong construction and manufacturing standards across our work, products, and service delivery." },
  { icon: Building2, title: "Workmanship", body: "We value skilled work, durable finishes, and consistent execution from planning through handover." },
  { icon: Scale, title: "Ethics", body: "We conduct business with professionalism, fairness, and respect for the people and communities we serve." },
  { icon: Users, title: "People", body: "We invest in capable teams, practical collaboration, and client-focused communication." },
  { icon: Leaf, title: "Environment", body: "We aim to support sustainable building practices and responsible construction manufacturing." },
] satisfies { icon: ElementType; title: string; body: string }[];

const companyInfo = [
  { label: "Registered Office", value: "Joe & Max Chambers Office Complex, P.O. Box 3494, Blantyre, Malawi" },
  { label: "Telephone", value: "+(265) 883 15 72 09" },
  { label: "Email", value: "contact@reines.co.mw" },
];

const productClasses = [
  "Concrete Products",
  "Stone Products",
  "Binding Materials",
];

const serviceClasses = [
  "Property Development",
  "Building Contracting",
  "Civil Contracting",
];

export default function AboutPage() {
  return (
    <>
      <AboutStoryHero />

      {/* Mission & Vision */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 md:grid-cols-2">
            <div className="rounded-2xl border border-zinc-100 p-8">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#8fb9e8]/10 text-[#8fb9e8]">
                <Target size={22} strokeWidth={1.8} />
              </div>
              <h2 className="mt-4 text-2xl font-bold text-[#2d4a6b]">Our Mission</h2>
              <p className="mt-3 leading-relaxed text-zinc-500">
                To drive Malawi&apos;s development through high-quality property, construction and manufacturing excellence with consistency and value.
              </p>
            </div>
            <div className="rounded-2xl bg-[#2d4a6b] p-8">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-[#8fb9e8]">
                <Binoculars size={22} strokeWidth={1.8} />
              </div>
              <h2 className="mt-4 text-2xl font-bold text-white">Our Vision</h2>
              <p className="mt-3 leading-relaxed text-zinc-400">
                To be Malawi and Southern Africa&apos;s most trusted infrastructure development and construction manufacturers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="bg-zinc-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#8fb9e8]">What We Stand For</span>
            <h2 className="mt-2 text-3xl font-bold text-[#2d4a6b]">Our Core Values</h2>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {values.map((v) => {
              const Icon = v.icon;
              return (
                <div key={v.title} className="rounded-xl border border-zinc-200 bg-white p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#8fb9e8]/10 text-[#8fb9e8]">
                    <Icon size={20} strokeWidth={1.8} />
                  </div>
                <h3 className="mt-3 font-semibold text-[#2d4a6b]">{v.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">{v.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Products & Services */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#8fb9e8]">Products & Services</span>
            <h2 className="mt-2 text-3xl font-bold text-[#2d4a6b]">What Reines Provides</h2>
            <p className="mx-auto mt-3 max-w-3xl text-sm leading-7 text-zinc-500">
              Reines operates within the construction field, offering building and civil contracting services as well as manufacturing concrete products, industrial adhesives, and other building materials.
            </p>
          </div>
          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
              <div className="mb-5 flex items-center gap-3">
                <Factory className="text-[#8fb9e8]" size={22} />
                <h3 className="text-lg font-bold text-[#2d4a6b]">Products</h3>
              </div>
              <ul className="space-y-3 rounded-xl border border-zinc-200 bg-white p-5">
                {productClasses.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-3 border-b border-zinc-100 pb-3 text-sm font-semibold text-[#2d4a6b] last:border-b-0 last:pb-0"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#8fb9e8]/15 text-[#2d4a6b]">
                      <CheckCircle2 size={14} strokeWidth={2.2} />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
              <div className="mb-5 flex items-center gap-3">
                <Building2 className="text-[#8fb9e8]" size={22} />
                <h3 className="text-lg font-bold text-[#2d4a6b]">Services</h3>
              </div>
              <ul className="space-y-3 rounded-xl border border-zinc-200 bg-white p-5">
                {serviceClasses.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-3 border-b border-zinc-100 pb-3 text-sm font-semibold text-[#2d4a6b] last:border-b-0 last:pb-0"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#8fb9e8]/15 text-[#2d4a6b]">
                      <CheckCircle2 size={14} strokeWidth={2.2} />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Company Information */}
      <section className="bg-zinc-50 py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#8fb9e8]">Company Information</span>
            <h2 className="mt-2 text-3xl font-bold text-[#2d4a6b]">Registered Details</h2>
          </div>
          <div className="mt-10 divide-y divide-zinc-200 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
            <div className="p-6">
              <p className="leading-relaxed text-zinc-600">
                Reines Property Development Limited was registered and incorporated in Blantyre, Malawi on March 29, 2023 with registration number <span className="font-semibold text-[#2d4a6b]">COY-REFW2A</span> as a private limited company under the Companies Act, 2013.
              </p>
            </div>
            {companyInfo.map((item) => (
              <div key={item.label} className="grid gap-2 p-5 sm:grid-cols-[220px_1fr]">
                <p className="font-semibold text-[#2d4a6b]">{item.label}</p>
                <p className="text-sm leading-relaxed text-zinc-500">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#2d4a6b] py-16">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-bold text-white">Work with a team you can trust.</h2>
          <Link href="/contact" className="mt-6 inline-block rounded-lg bg-[#8fb9e8] px-8 py-3 text-sm font-semibold text-[#2d4a6b] hover:bg-[#b8d4f2]">
            Contact Us
          </Link>
        </div>
      </section>
    </>
  );
}
