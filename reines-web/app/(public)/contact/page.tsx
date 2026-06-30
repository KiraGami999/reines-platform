import type { Metadata } from "next";
import type { ElementType } from "react";
import Link from "next/link";
import { Clock, Mail, Map, MapPin, Phone, ArrowRight } from "lucide-react";
import { ContactForm } from "@/components/public/ContactForm";

export const metadata: Metadata = {
  title: "Contact Us — Reines Property Development",
  description: "Get in touch with Reines Property Development. Request a quote, ask a question, or discuss your project.",
};

const contactDetails = [
  {
    icon: MapPin,
    title: "Visit Us",
    lines: ["Old Highway, Chichiri", "P.O. Box 3494", "Blantyre, Malawi"],
  },
  {
    icon: Phone,
    title: "Call Us",
    lines: ["+(265) 883 15 72 09"],
    href: "tel:+265883157209",
  },
  {
    icon: Mail,
    title: "Email Us",
    lines: ["contact@reines.co.mw"],
    href: "mailto:contact@reines.co.mw",
  },
  {
    icon: Clock,
    title: "Office Hours",
    lines: ["Mon – Fri: 8:00 AM – 5:00 PM", "Saturday: 9:00 AM – 1:00 PM"],
  },
] satisfies {
  icon: ElementType;
  title: string;
  lines: string[];
  href?: string;
}[];

export default function ContactPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-[#2d4a6b] py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#8fb9e8]">Get In Touch</span>
          <h1 className="mt-3 max-w-2xl text-5xl font-extrabold tracking-tight text-white">
            Let&apos;s talk about your project.
          </h1>
          <p className="mt-4 max-w-xl text-zinc-400">
            Whether you have a fully formed brief or just an idea, we&apos;d love to hear from you. Fill in the form and we&apos;ll get back to you within 24 hours.
          </p>
        </div>
      </section>

      {/* Main content */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-3">

            {/* Contact details */}
            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-bold text-[#2d4a6b]">Contact Information</h2>
                <p className="mt-2 text-sm text-zinc-500">Multiple ways to reach us — choose what works best for you.</p>
              </div>

              {contactDetails.map((c) => {
                const Icon = c.icon;
                return (
                  <div key={c.title} className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#8fb9e8]/10 text-lg">
                    <Icon size={19} strokeWidth={1.8} className="text-[#8fb9e8]" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">{c.title}</p>
                    {c.href ? (
                      <a href={c.href} className="mt-1 block text-sm font-medium text-[#2d4a6b] hover:text-[#8fb9e8]">
                        {c.lines[0]}
                      </a>
                    ) : (
                      c.lines.map((line) => (
                        <p key={line} className="mt-0.5 text-sm text-zinc-600">{line}</p>
                      ))
                    )}
                    </div>
                  </div>
                );
              })}

              {/* Temporary Blantyre map until the client confirms the exact pin. */}
              <div className="overflow-hidden rounded-xl border border-zinc-100 bg-zinc-50">
                <iframe
                  title="Google Map focused on Blantyre, Malawi"
                  src="https://www.google.com/maps?q=Blantyre%2C%20Malawi&z=13&output=embed"
                  className="h-56 w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
                <div className="flex items-start gap-2 border-t border-zinc-100 bg-white px-4 py-3">
                  <Map size={16} strokeWidth={1.8} className="mt-0.5 shrink-0 text-[#8fb9e8]" />
                  <div>
                    <p className="text-xs font-semibold text-[#2d4a6b]">Blantyre, Malawi</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-zinc-400">
                      Map is currently centered on Blantyre. The exact Old Highway, Chichiri business pin can be added once confirmed by the client.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="lg:col-span-2 space-y-5">

              {/* Quote callout */}
              <div className="flex items-start gap-4 rounded-xl border border-[#8fb9e8]/30 bg-[#8fb9e8]/5 px-5 py-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#2d4a6b]/10">
                  <ArrowRight size={16} className="text-[#2d4a6b]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#2d4a6b]">Starting a new project?</p>
                  <p className="mt-0.5 text-xs text-zinc-500 leading-relaxed">
                    If you&apos;d like a detailed quotation for a project, use our dedicated{" "}
                    <Link href="/quote" className="font-medium text-[#2d4a6b] underline underline-offset-2 hover:text-[#8fb9e8]">
                      Get a Quote
                    </Link>{" "}
                    page. It allows you to provide a full project brief so we can prepare an accurate estimate.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-8">
                <h2 className="text-xl font-bold text-[#2d4a6b]">Send us a message</h2>
                <p className="mt-1 text-sm text-zinc-500">For general enquiries, questions, or feedback. All messages are responded to within 24 hours.</p>
                <div className="mt-6">
                  <ContactForm />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ strip */}
      <section className="bg-zinc-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-xl font-bold text-[#2d4a6b]">Common Questions</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {[
              { q: "How long does a quote take?", a: "We provide detailed quotations within 3–5 business days of an initial consultation." },
              { q: "Do you work outside Blantyre?", a: "Yes. We operate across Malawi including Lilongwe, Zomba, and Mzuzu." },
              { q: "What payment terms do you offer?", a: "We use a 30/40/30 milestone payment structure. No upfront full payment." },
            ].map((faq) => (
              <div key={faq.q} className="rounded-xl border border-zinc-200 bg-white p-6">
                <h3 className="font-semibold text-[#2d4a6b]">{faq.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
