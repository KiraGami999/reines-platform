"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Loader2,
  AlertCircle,
  User,
  Mail,
  Phone,
  Building2,
  MapPin,
  FileText,
  Banknote,
  Calendar,
  Layers,
  MessageSquare,
  Info,
} from "lucide-react";

const PROJECT_TYPES = [
  "Property Development",
  "Building Contracting",
  "Civil Contracting",
  "Concrete Products",
  "Adhesives & Binding Materials",
  "Stone Products",
  "Other / Not Sure Yet",
];

const BUDGET_RANGES = [
  "Under MK 1 million",
  "MK 1M – 5M",
  "MK 5M – 10M",
  "MK 10M – 25M",
  "MK 25M – 50M",
  "MK 50M+",
  "Prefer not to say",
];

const TIMELINES = [
  "As soon as possible",
  "Within 1 month",
  "Within 3 months",
  "Within 6 months",
  "Within 12 months",
  "Just exploring for now",
];

const PROJECT_SIZES = [
  "Small (< 100 m²)",
  "Medium (100 – 500 m²)",
  "Large (500 m² – 2,000 m²)",
  "Very large (2,000 m²+)",
  "Not applicable",
];

const HOW_HEARD = [
  "Word of mouth / Referral",
  "Social media",
  "Google / Internet search",
  "Newspaper / Radio",
  "Existing client",
  "Other",
];

interface FieldErrors {
  name?:        string[];
  email?:       string[];
  phone?:       string[];
  projectType?: string[];
  description?: string[];
  location?:    string[];
}

const FIELD =
  "block w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-[#8fb9e8] focus:outline-none focus:ring-2 focus:ring-[#8fb9e8]/30 transition-colors";
const LABEL = "block text-sm font-medium text-zinc-700 mb-1.5";
const ERR   = "mt-1 text-xs text-red-500";

function SectionHeading({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex items-start gap-3 border-b border-zinc-100 pb-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center /10 text-[#2d4a6b]">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-zinc-900">{title}</p>
        {subtitle && <p className="text-xs text-zinc-400">{subtitle}</p>}
      </div>
    </div>
  );
}

export function QuotationForm() {
  const [form, setForm] = useState({
    name:                "",
    email:               "",
    phone:               "",
    company:             "",
    projectType:         "",
    description:         "",
    location:            "",
    budgetRange:         "",
    timeline:            "",
    projectSize:         "",
    specialRequirements: "",
    howHeardAboutUs:     "",
  });

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [state,       setState]       = useState<"idle" | "loading" | "success" | "error">("idle");
  const [serverError, setServerError] = useState("");

  function set(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm((f) => ({ ...f, [key]: e.target.value }));
      setFieldErrors((f) => ({ ...f, [key]: undefined }));
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    setFieldErrors({});
    setServerError("");

    const res  = await fetch("/api/quotations", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(form),
    });
    const data = await res.json();

    if (res.status === 422) {
      setFieldErrors(data.issues ?? {});
      setState("idle");
      return;
    }
    if (!res.ok) {
      setServerError(data.error ?? "Something went wrong. Please try again.");
      setState("error");
      return;
    }

    setState("success");
  }

  if (state === "success") {
    return (
      <div className="rounded-2xl border border-green-100 bg-green-50 p-10 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 size={32} strokeWidth={1.8} className="text-green-600" />
        </div>
        <h3 className="mt-5 text-xl font-bold text-green-800">Quotation Request Received!</h3>
        <p className="mt-3 max-w-md mx-auto text-sm text-green-700 leading-relaxed">
          Thank you, <strong>{form.name}</strong>. We&apos;ve received your project brief and will prepare a detailed quotation
          within <strong>3–5 business days</strong>. We&apos;ll reach you at <strong>{form.email}</strong>.
        </p>
        <div className="mt-6 rounded-xl border border-green-200 bg-white px-6 py-4 text-sm text-zinc-700 space-y-1 text-left max-w-sm mx-auto">
          <p><span className="font-medium text-zinc-500">Project type:</span> {form.projectType}</p>
          <p><span className="font-medium text-zinc-500">Location:</span> {form.location}</p>
          {form.budgetRange && <p><span className="font-medium text-zinc-500">Budget:</span> {form.budgetRange}</p>}
        </div>
        <button
          onClick={() => { setState("idle"); setForm({ name: "", email: "", phone: "", company: "", projectType: "", description: "", location: "", budgetRange: "", timeline: "", projectSize: "", specialRequirements: "", howHeardAboutUs: "" }); }}
          className="mt-6 text-sm font-medium text-green-600 hover:underline"
        >
          Submit another request
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-8">

      {/* ── Section 1: Contact Information ── */}
      <div className="space-y-5">
        <SectionHeading
          icon={<User size={15} />}
          title="Your Contact Information"
          subtitle="We'll use this to send you the quotation and follow up."
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className={LABEL}>
              Full Name <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <User size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                id="name"
                type="text"
                placeholder="Jane Smith"
                value={form.name}
                onChange={set("name")}
                className={`${FIELD} pl-9`}
                required
              />
            </div>
            {fieldErrors.name?.[0] && <p className={ERR}>{fieldErrors.name[0]}</p>}
          </div>

          <div>
            <label htmlFor="email" className={LABEL}>
              Email Address <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Mail size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                id="email"
                type="email"
                placeholder="jane@example.com"
                value={form.email}
                onChange={set("email")}
                className={`${FIELD} pl-9`}
                required
              />
            </div>
            {fieldErrors.email?.[0] && <p className={ERR}>{fieldErrors.email[0]}</p>}
          </div>

          <div>
            <label htmlFor="phone" className={LABEL}>Phone Number</label>
            <div className="relative">
              <Phone size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                id="phone"
                type="tel"
                placeholder="+(265) 999 000 000"
                value={form.phone}
                onChange={set("phone")}
                className={`${FIELD} pl-9`}
              />
            </div>
          </div>

          <div>
            <label htmlFor="company" className={LABEL}>Company / Organisation</label>
            <div className="relative">
              <Building2 size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                id="company"
                type="text"
                placeholder="Optional"
                value={form.company}
                onChange={set("company")}
                className={`${FIELD} pl-9`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 2: Project Overview ── */}
      <div className="space-y-5">
        <SectionHeading
          icon={<FileText size={15} />}
          title="Project Overview"
          subtitle="Tell us what you're looking to build or develop."
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="projectType" className={LABEL}>
              Project Type <span className="text-red-400">*</span>
            </label>
            <select
              id="projectType"
              value={form.projectType}
              onChange={set("projectType")}
              className={FIELD}
              required
            >
              <option value="">Select project type…</option>
              {PROJECT_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
            {fieldErrors.projectType?.[0] && <p className={ERR}>{fieldErrors.projectType[0]}</p>}
          </div>

          <div>
            <label htmlFor="location" className={LABEL}>
              Project Location / Site <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <MapPin size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                id="location"
                type="text"
                placeholder="e.g. Blantyre, Lilongwe, Zomba…"
                value={form.location}
                onChange={set("location")}
                className={`${FIELD} pl-9`}
                required
              />
            </div>
            {fieldErrors.location?.[0] && <p className={ERR}>{fieldErrors.location[0]}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="description" className={LABEL}>
            Project Description <span className="text-red-400">*</span>
          </label>
          <textarea
            id="description"
            rows={5}
            placeholder="Describe your project in detail — what you want to build, the purpose of the development, any specific requirements or ideas you have in mind…"
            value={form.description}
            onChange={set("description")}
            className={FIELD}
            required
          />
          {fieldErrors.description?.[0] && <p className={ERR}>{fieldErrors.description[0]}</p>}
        </div>
      </div>

      {/* ── Section 3: Scope & Budget ── */}
      <div className="space-y-5">
        <SectionHeading
          icon={<Banknote size={15} />}
          title="Scope &amp; Budget"
          subtitle="Help us tailor the quotation to your expectations."
        />

        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <label htmlFor="projectSize" className={LABEL}>
              <span className="flex items-center gap-1"><Layers size={12} /> Project Size</span>
            </label>
            <select id="projectSize" value={form.projectSize} onChange={set("projectSize")} className={FIELD}>
              <option value="">Select size…</option>
              {PROJECT_SIZES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="budgetRange" className={LABEL}>
              <span className="flex items-center gap-1"><Banknote size={12} /> Estimated Budget</span>
            </label>
            <select id="budgetRange" value={form.budgetRange} onChange={set("budgetRange")} className={FIELD}>
              <option value="">Select budget range…</option>
              {BUDGET_RANGES.map((b) => <option key={b}>{b}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="timeline" className={LABEL}>
              <span className="flex items-center gap-1"><Calendar size={12} /> Preferred Timeline</span>
            </label>
            <select id="timeline" value={form.timeline} onChange={set("timeline")} className={FIELD}>
              <option value="">Select timeline…</option>
              {TIMELINES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* ── Section 4: Additional Details ── */}
      <div className="space-y-5">
        <SectionHeading
          icon={<MessageSquare size={15} />}
          title="Additional Details"
          subtitle="Anything else that will help us prepare an accurate quotation."
        />

        <div>
          <label htmlFor="specialRequirements" className={LABEL}>Special Requirements or Notes</label>
          <textarea
            id="specialRequirements"
            rows={3}
            placeholder="Any specific materials, finishes, accessibility needs, phased delivery, or other requirements…"
            value={form.specialRequirements}
            onChange={set("specialRequirements")}
            className={FIELD}
          />
        </div>

        <div>
          <label htmlFor="howHeardAboutUs" className={LABEL}>How did you hear about Reines?</label>
          <select id="howHeardAboutUs" value={form.howHeardAboutUs} onChange={set("howHeardAboutUs")} className={FIELD}>
            <option value="">Select…</option>
            {HOW_HEARD.map((h) => <option key={h}>{h}</option>)}
          </select>
        </div>
      </div>

      {/* ── Disclaimer ── */}
      <div className="flex items-start gap-3 rounded-xl border border-[#8fb9e8]/30 bg-[#8fb9e8]/5 px-4 py-3">
        <Info size={15} className="mt-0.5 shrink-0 text-[#8fb9e8]" />
        <p className="text-xs text-zinc-500 leading-relaxed">
          Your information is stored securely and used solely to prepare your quotation. We will contact you within
          <strong className="text-zinc-700"> 3–5 business days</strong>. Submitting this form does not constitute
          a contract or financial commitment.
        </p>
      </div>

      {/* ── Error banner ── */}
      {state === "error" && serverError && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          {serverError}
        </div>
      )}

      {/* ── Submit ── */}
      <button
        type="submit"
        disabled={state === "loading"}
        className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#2d4a6b] px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-[#2d4a6b]/20 hover:bg-[#1a2f4a] transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
      >
        {state === "loading" ? (
          <><Loader2 size={16} className="animate-spin" /> Submitting…</>
        ) : (
          <>Submit Quotation Request</>
        )}
      </button>
    </form>
  );
}
