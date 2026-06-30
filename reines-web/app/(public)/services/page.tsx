import type { Metadata } from "next";
import Link from "next/link";
import { getPublicServices } from "@/lib/public-services";
import { getServiceIcon } from "@/lib/service-icons";

export const metadata: Metadata = {
  title: "Services — Reines Property Development",
  description: "Property development, building contracting, civil contracting, concrete products, stone products, adhesives, and binding materials.",
};

const process = [
  { step: "01", title: "Initial Consultation", body: "We meet to understand your vision, site, and budget. No commitment required." },
  { step: "02", title: "Detailed Quotation", body: "Receive a transparent, itemised quote with timeline and payment milestones." },
  { step: "03", title: "Agreement & Kickoff", body: "Sign the contract, pay the 30% commencement deposit, and work begins." },
  { step: "04", title: "Live Progress Updates", body: "Track every milestone through your personal client portal — photos included." },
  { step: "05", title: "Handover", body: "Project completion, final review, and practical support after handover." },
];

export default async function ServicesPage() {
  const services = await getPublicServices();

  return (
    <>
      {/* Hero */}
      <section className="bg-[#2d4a6b] py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#8fb9e8]">What We Offer</span>
          <h1 className="mt-3 max-w-2xl text-5xl font-extrabold tracking-tight text-white">
            Services designed around your confidence.
          </h1>
          <p className="mt-4 max-w-xl text-zinc-400">
            Reines offers property development, building contracting, civil contracting, concrete products, stone products, adhesives, and binding materials for Malawi&apos;s construction market.
          </p>
        </div>
      </section>

      {/* Services grid */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-12">
            {services.map((service, index) => {
              const Icon = getServiceIcon(service.iconKey);
              return (
                <div
                  key={service.id}
                  className={`flex flex-col gap-8 rounded-2xl border border-zinc-100 p-8 lg:flex-row ${index % 2 === 1 ? "lg:flex-row-reverse" : ""}`}
                >
                  <div className="flex-1">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#8fb9e8]/10 text-[#8fb9e8]">
                      <Icon size={24} strokeWidth={1.8} />
                    </div>
                    <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-[#8fb9e8]">
                      {service.tagline}
                    </p>
                    <h2 className="mt-1 text-2xl font-bold text-[#2d4a6b]">{service.title}</h2>
                    <p className="mt-3 leading-relaxed text-zinc-500">{service.description}</p>
                  </div>
                  <div className="w-full rounded-xl bg-zinc-50 p-6 lg:w-72">
                    <h4 className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-400">Included</h4>
                    <ul className="space-y-2">
                      {service.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-sm text-zinc-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#8fb9e8]" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Our process */}
      <section className="bg-zinc-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#8fb9e8]">How It Works</span>
            <h2 className="mt-2 text-3xl font-bold text-[#2d4a6b]">Our Process</h2>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {process.map((step) => (
              <div key={step.step} className="rounded-xl border border-zinc-200 bg-white p-6">
                <span className="text-3xl font-extrabold text-[#8fb9e8]/40">{step.step}</span>
                <h3 className="mt-3 font-semibold text-[#2d4a6b]">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#2d4a6b] py-16">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-bold text-white">Let&apos;s build something together.</h2>
          <p className="mt-3 text-zinc-400">Request a quote or ask a question — our team responds within 24 hours.</p>
          <Link
            href="/contact"
            className="mt-6 inline-block rounded-lg bg-[#8fb9e8] px-8 py-3 text-sm font-semibold text-[#2d4a6b] hover:bg-[#b8d4f2]"
          >
            Request a Quote
          </Link>
        </div>
      </section>
    </>
  );
}
