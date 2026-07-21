import type { Metadata } from "next";
import Link from "next/link";
import {
  ClipboardList,
  HardHat,
  MessageCircle,
  Clock,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { QuotationForm } from "@/components/public/QuotationForm";

export const metadata: Metadata = {
  title: "Get a Quotation — Reines Property Development",
  description:
    "Request a detailed project quotation from Reines Property Development. Submit your project brief and we'll prepare a tailored estimate within 3–5 business days.",
};

const steps = [
  {
    icon: ClipboardList,
    title: "Submit Your Brief",
    body: "Fill in the form with your project details, location, and budget expectations.",
  },
  {
    icon: HardHat,
    title: "We Review & Assess",
    body: "Our team evaluates your brief and may contact you for clarifications within 1–2 business days.",
  },
  {
    icon: MessageCircle,
    title: "Receive Your Quote",
    body: "A tailored, itemised quotation is delivered to your email within 3–5 business days.",
  },
  {
    icon: CheckCircle,
    title: "Start Your Project",
    body: "Approve the quote, sign the agreement, and we kick off your project on a clear schedule.",
  },
];

export default function QuotationPage() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="bg-[#2d4a6b] py-14 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#8fb9e8]">
            Project Quotation
          </span>
          <h1 className="mt-3 max-w-2xl text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Let&apos;s build something great together.
          </h1>
          <p className="mt-4 max-w-xl text-zinc-400">
            Tell us about your project and we&apos;ll prepare a detailed, itemised quotation tailored
            to your scope, location, and budget — at no cost to you.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-zinc-400">
            <span className="flex items-center gap-1.5">
              <Clock size={14} className="text-[#8fb9e8]" /> Response within 3–5 business days
            </span>
            <span className="hidden sm:inline text-zinc-600">·</span>
            <span className="hidden sm:flex items-center gap-1.5">
              <CheckCircle size={14} className="text-[#8fb9e8]" /> No commitment required
            </span>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="bg-zinc-50 py-14 border-b border-zinc-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-base font-semibold uppercase tracking-widest text-zinc-400">
            How It Works
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="relative flex flex-col items-start gap-3 rounded-xl border border-zinc-200 bg-white p-6">
                  <div className="flex h-9 w-9 items-center justify-center /10">
                    <Icon size={17} strokeWidth={1.8} className="text-[#2d4a6b]" />
                  </div>
                  <div className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-xs font-bold text-zinc-400">
                    {i + 1}
                  </div>
                  <h3 className="text-sm font-semibold text-zinc-900">{step.title}</h3>
                  <p className="text-xs leading-relaxed text-zinc-500">{step.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Main form ── */}
      <section className="bg-white py-12 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[1fr_2fr]">

            {/* ── Left sidebar info ── */}
            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-bold text-[#2d4a6b]">Ready to get started?</h2>
                <p className="mt-2 text-sm text-zinc-500 leading-relaxed">
                  Use this form to tell us about your project. The more detail you provide, the
                  more accurate your quotation will be.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
                  Our Services
                </h3>
                {[
                  "Property Development",
                  "Building Contracting",
                  "Civil Contracting",
                  "Concrete Products",
                  "Adhesives & Binding Materials",
                  "Stone Products",
                ].map((s) => (
                  <div key={s} className="flex items-center gap-2 text-sm text-zinc-700">
                    <div className="h-1.5 w-1.5 rounded-full bg-[#8fb9e8]" />
                    {s}
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-5 space-y-3">
                <h3 className="text-sm font-semibold text-zinc-900">Have a quick question?</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  For general enquiries not related to a project quotation, use our contact page.
                </p>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#2d4a6b] hover:text-[#8fb9e8] transition-colors"
                >
                  Go to Contact <ArrowRight size={12} />
                </Link>
              </div>

              <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-5 space-y-2">
                <h3 className="text-sm font-semibold text-zinc-900">Already have an account?</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Log in to track existing projects and payments.
                </p>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#2d4a6b] hover:text-[#8fb9e8] transition-colors"
                >
                  Log In <ArrowRight size={12} />
                </Link>
              </div>
            </div>

            {/* ── Right form ── */}
            <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-8 shadow-sm">
              <h2 className="text-xl font-bold text-[#2d4a6b]">Request a Quotation</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Fields marked <span className="text-red-400 font-medium">*</span> are required.
              </p>
              <div className="mt-7">
                <QuotationForm />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── FAQ strip ── */}
      <section className="bg-zinc-50 py-16 border-t border-zinc-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-xl font-bold text-[#2d4a6b]">Quotation FAQs</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {[
              {
                q: "How long does a quotation take?",
                a: "We prepare detailed quotations within 3–5 business days of receiving your project brief.",
              },
              {
                q: "Is the quotation free?",
                a: "Yes — all project quotations are completely free and carry no obligation to proceed.",
              },
              {
                q: "What payment structure do you use?",
                a: "We use a milestone-based 30/40/30 payment plan: deposit, mid-project, and completion.",
              },
              {
                q: "Can I request changes after submitting?",
                a: "Absolutely. Once we contact you, you can adjust scope, budget, or timeline before the quote is finalised.",
              },
              {
                q: "Do you work outside Blantyre?",
                a: "Yes — we operate across Malawi including Lilongwe, Zomba, Mzuzu, and other regions.",
              },
              {
                q: "How do I track my project once started?",
                a: "All active clients receive access to the Client Portal for real-time project tracking and payments.",
              },
            ].map((faq) => (
              <div key={faq.q} className="rounded-xl border border-zinc-200 bg-white p-6">
                <h3 className="font-semibold text-[#2d4a6b] text-sm">{faq.q}</h3>
                <p className="mt-2 text-xs leading-relaxed text-zinc-500">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
