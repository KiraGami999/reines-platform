"use client";

import { useMemo, useState } from "react";
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
  HardHat,
  Package,
  Plus,
  Trash2,
} from "lucide-react";
import {
  FALLBACK_PRODUCTS,
  PRODUCT_SUBSIDIARY_OPTIONS,
  type ProductCatalogItem,
} from "@/lib/product-catalog-data";

const PROJECT_TYPES = [
  "Property Development",
  "Building Contracting",
  "Civil Contracting",
  "Other / Not Sure Yet",
];

const PRODUCT_CATEGORY_OPTIONS = [
  ...PRODUCT_SUBSIDIARY_OPTIONS.map((s) => ({ value: s.value as string, label: s.label })),
  { value: "multiple", label: "Multiple / Not sure — let us help" },
];

type ProductLineItem = { name: string; quantity: string; unit: string };

const BLANK_PRODUCT_ITEM: ProductLineItem = { name: "", quantity: "", unit: "" };

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
  name?:            string[];
  email?:           string[];
  phone?:           string[];
  projectType?:     string[];
  description?:     string[];
  location?:        string[];
  productCategory?: string[];
  products?:        string[];
}

const FIELD =
  "block w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-[#8fb9e8] focus:outline-none focus:ring-2 focus:ring-[#8fb9e8]/30 transition-colors dark:border-[var(--border)] dark:bg-[var(--surface)] dark:text-[var(--foreground)] dark:placeholder:text-[var(--text-muted)]";
const LABEL = "block text-sm font-medium text-zinc-700 mb-1.5 dark:text-[var(--text-secondary)]";
const ERR   = "mt-1 text-xs text-red-500";

function SectionHeading({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex items-start gap-3 border-b border-zinc-100 pb-3 dark:border-[var(--border)]">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#35475D]/10 text-[#35475D] dark:bg-[#8fb9e8]/15 dark:text-[#8fb9e8]">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-zinc-900 dark:text-[var(--foreground)]">{title}</p>
        {subtitle && <p className="text-xs text-zinc-400 dark:text-[var(--text-muted)]">{subtitle}</p>}
      </div>
    </div>
  );
}

type Props = {
  /** Real product catalogue, used to populate the "Products Only" line-item pickers. */
  products?: ProductCatalogItem[];
};

const BLANK_FORM = {
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
};

export function QuotationForm({ products = [] }: Props) {
  const catalog = products.length > 0 ? products : FALLBACK_PRODUCTS;

  const [form, setForm] = useState(BLANK_FORM);
  const [requestType, setRequestTypeState] = useState<"PROJECT" | "PRODUCTS">("PROJECT");
  const [productCategory, setProductCategory] = useState("");
  const [productItems, setProductItems] = useState<ProductLineItem[]>([{ ...BLANK_PRODUCT_ITEM }]);

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [state,       setState]       = useState<"idle" | "loading" | "success" | "error">("idle");
  const [serverError, setServerError] = useState("");

  const groupedProducts = useMemo(() => {
    const filtered =
      productCategory && productCategory !== "multiple"
        ? catalog.filter((p) => p.subsidiary === productCategory)
        : catalog;

    const groups = new Map<string, ProductCatalogItem[]>();
    for (const item of filtered) {
      const meta = PRODUCT_SUBSIDIARY_OPTIONS.find((s) => s.value === item.subsidiary);
      const groupLabel = meta?.label ?? item.subsidiary;
      groups.set(groupLabel, [...(groups.get(groupLabel) ?? []), item]);
    }
    return Array.from(groups.entries());
  }, [catalog, productCategory]);

  function set(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm((f) => ({ ...f, [key]: e.target.value }));
      setFieldErrors((f) => ({ ...f, [key]: undefined }));
    };
  }

  function selectRequestType(type: "PROJECT" | "PRODUCTS") {
    setRequestTypeState(type);
    setFieldErrors({});
    // Each mode drives its own "type" concept — clear the other so a stale
    // value from a previous mode can't slip through on submit.
    if (type === "PRODUCTS") {
      setForm((f) => ({ ...f, projectType: "" }));
    } else {
      setProductCategory("");
      setProductItems([{ ...BLANK_PRODUCT_ITEM }]);
    }
  }

  function updateProductItem(index: number, patch: Partial<ProductLineItem>) {
    setFieldErrors((f) => ({ ...f, products: undefined }));
    setProductItems((items) => items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function addProductItem() {
    setProductItems((items) => [...items, { ...BLANK_PRODUCT_ITEM }]);
  }

  function removeProductItem(index: number) {
    setProductItems((items) => (items.length <= 1 ? items : items.filter((_, i) => i !== index)));
  }

  function resetAll() {
    setState("idle");
    setForm(BLANK_FORM);
    setRequestTypeState("PROJECT");
    setProductCategory("");
    setProductItems([{ ...BLANK_PRODUCT_ITEM }]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    setFieldErrors({});
    setServerError("");

    const payload = {
      ...form,
      requestType,
      productCategory: requestType === "PRODUCTS" ? productCategory : "",
      products:
        requestType === "PRODUCTS"
          ? productItems.filter((item) => item.name.trim() && item.quantity.trim())
          : [],
    };

    const res  = await fetch("/api/quotations", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
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
      <div className="rounded-2xl border border-green-100 bg-green-50 p-10 text-center dark:border-green-500/30 dark:bg-green-500/10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-500/20">
          <CheckCircle2 size={32} strokeWidth={1.8} className="text-green-600 dark:text-green-400" />
        </div>
        <h3 className="mt-5 text-xl font-bold text-green-800 dark:text-green-300">Quotation Request Received!</h3>
        <p className="mt-3 max-w-md mx-auto text-sm text-green-700 leading-relaxed dark:text-green-200/90">
          Thank you, <strong>{form.name}</strong>. We&apos;ve received your {requestType === "PRODUCTS" ? "product order" : "project brief"} and
          will prepare a detailed quotation within <strong>3–5 business days</strong>. We&apos;ll reach you at <strong>{form.email}</strong>.
        </p>
        <div className="mt-6 rounded-xl border border-green-200 bg-white px-6 py-4 text-sm text-zinc-700 space-y-1 text-left max-w-sm mx-auto dark:border-[var(--border)] dark:bg-[var(--surface)] dark:text-[var(--text-secondary)]">
          {requestType === "PRODUCTS" ? (
            <>
              <p><span className="font-medium text-zinc-500 dark:text-[var(--text-muted)]">Products:</span> {productItems.filter((p) => p.name).length} item(s)</p>
              <p><span className="font-medium text-zinc-500 dark:text-[var(--text-muted)]">Delivery location:</span> {form.location}</p>
            </>
          ) : (
            <>
              <p><span className="font-medium text-zinc-500 dark:text-[var(--text-muted)]">Project type:</span> {form.projectType}</p>
              <p><span className="font-medium text-zinc-500 dark:text-[var(--text-muted)]">Location:</span> {form.location}</p>
            </>
          )}
          {form.budgetRange && <p><span className="font-medium text-zinc-500 dark:text-[var(--text-muted)]">Budget:</span> {form.budgetRange}</p>}
        </div>
        <button
          onClick={resetAll}
          className="mt-6 text-sm font-medium text-green-600 hover:underline dark:text-green-400"
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

      {/* ── Section 2: What is this quote for? ── */}
      <div className="space-y-5">
        <SectionHeading
          icon={requestType === "PRODUCTS" ? <Package size={15} /> : <FileText size={15} />}
          title={requestType === "PRODUCTS" ? "Products Order" : "Project Overview"}
          subtitle={
            requestType === "PRODUCTS"
              ? "Tell us which products you need and how much."
              : "Tell us what you're looking to build or develop."
          }
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => selectRequestType("PROJECT")}
            className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-colors ${
              requestType === "PROJECT"
                ? "border-[#8fb9e8] bg-[#8fb9e8]/10"
                : "border-zinc-200 hover:bg-zinc-50 dark:border-[var(--border)] dark:hover:bg-[var(--surface-hover)]"
            }`}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#35475D]/10 text-[#35475D] dark:bg-[#8fb9e8]/15 dark:text-[#8fb9e8]">
              <HardHat size={16} strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-[var(--foreground)]">A Project or Service</p>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-[var(--text-muted)]">Development, construction, or civil work.</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => selectRequestType("PRODUCTS")}
            className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-colors ${
              requestType === "PRODUCTS"
                ? "border-[#8fb9e8] bg-[#8fb9e8]/10"
                : "border-zinc-200 hover:bg-zinc-50 dark:border-[var(--border)] dark:hover:bg-[var(--surface-hover)]"
            }`}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#35475D]/10 text-[#35475D] dark:bg-[#8fb9e8]/15 dark:text-[#8fb9e8]">
              <Package size={16} strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-[var(--foreground)]">Products Only</p>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-[var(--text-muted)]">Concrete blocks, pavers, adhesives, and more — no project attached.</p>
            </div>
          </button>
        </div>

        {requestType === "PROJECT" ? (
          <>
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
          </>
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="productCategory" className={LABEL}>
                  Product Category <span className="text-red-400">*</span>
                </label>
                <select
                  id="productCategory"
                  value={productCategory}
                  onChange={(e) => {
                    setProductCategory(e.target.value);
                    setFieldErrors((f) => ({ ...f, productCategory: undefined }));
                  }}
                  className={FIELD}
                  required
                >
                  <option value="">Select a category…</option>
                  {PRODUCT_CATEGORY_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
                {fieldErrors.productCategory?.[0] && <p className={ERR}>{fieldErrors.productCategory[0]}</p>}
              </div>

              <div>
                <label htmlFor="location" className={LABEL}>
                  Delivery Location <span className="text-red-400">*</span>
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

            <div className="space-y-3">
              <label className={LABEL}>
                Products Needed <span className="text-red-400">*</span>
              </label>

              {productItems.map((item, index) => (
                <div key={index} className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-3 sm:flex-row sm:items-start dark:border-[var(--border)] dark:bg-[var(--surface)]">
                  <select
                    value={item.name}
                    onChange={(e) => updateProductItem(index, { name: e.target.value })}
                    className={`${FIELD} sm:flex-[2]`}
                  >
                    <option value="">Select a product…</option>
                    {groupedProducts.map(([groupLabel, items]) => (
                      <optgroup key={groupLabel} label={groupLabel}>
                        {items.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
                      </optgroup>
                    ))}
                    <option value="Other / not listed">Other / not listed</option>
                  </select>

                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Quantity"
                    value={item.quantity}
                    onChange={(e) => updateProductItem(index, { quantity: e.target.value })}
                    className={`${FIELD} sm:w-28`}
                  />

                  <input
                    type="text"
                    placeholder="Unit (bags, pcs, m³…)"
                    value={item.unit}
                    onChange={(e) => updateProductItem(index, { unit: e.target.value })}
                    className={`${FIELD} sm:w-36`}
                  />

                  <button
                    type="button"
                    onClick={() => removeProductItem(index)}
                    disabled={productItems.length <= 1}
                    aria-label="Remove product"
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center self-start rounded-xl border border-zinc-200 text-zinc-400 transition-colors hover:border-red-200 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}

              {fieldErrors.products?.[0] && <p className={ERR}>{fieldErrors.products[0]}</p>}

              <button
                type="button"
                onClick={addProductItem}
                className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-zinc-300 px-3 py-2 text-xs font-medium text-zinc-600 hover:border-[#8fb9e8] hover:text-[#35475D]"
              >
                <Plus size={13} /> Add another product
              </button>
            </div>

            <div>
              <label htmlFor="description" className={LABEL}>Additional Notes (optional)</label>
              <textarea
                id="description"
                rows={3}
                placeholder="Anything else about this order — delivery timing, packaging, site access, etc."
                value={form.description}
                onChange={set("description")}
                className={FIELD}
              />
            </div>
          </>
        )}
      </div>

      {/* ── Section 3: Scope & Budget ── */}
      <div className="space-y-5">
        <SectionHeading
          icon={<Banknote size={15} />}
          title="Scope &amp; Budget"
          subtitle="Help us tailor the quotation to your expectations."
        />

        <div className={`grid gap-5 ${requestType === "PROJECT" ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
          {requestType === "PROJECT" && (
            <div>
              <label htmlFor="projectSize" className={LABEL}>
                <span className="flex items-center gap-1"><Layers size={12} /> Project Size</span>
              </label>
              <select id="projectSize" value={form.projectSize} onChange={set("projectSize")} className={FIELD}>
                <option value="">Select size…</option>
                {PROJECT_SIZES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          )}

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
      <div className="flex items-start gap-3 rounded-xl border border-[#8fb9e8]/30 bg-[#8fb9e8]/5 px-4 py-3 dark:border-[#8fb9e8]/25 dark:bg-[#8fb9e8]/10">
        <Info size={15} className="mt-0.5 shrink-0 text-[#8fb9e8]" />
        <p className="text-xs text-zinc-500 leading-relaxed dark:text-[var(--text-muted)]">
          Your information is stored securely and used solely to prepare your quotation. We will contact you within
          <strong className="text-zinc-700 dark:text-[var(--foreground)]"> 3–5 business days</strong>. Submitting this form does not constitute
          a contract or financial commitment.
        </p>
      </div>

      {/* ── Error banner ── */}
      {state === "error" && serverError && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          {serverError}
        </div>
      )}

      {/* ── Submit ── */}
      <button
        type="submit"
        disabled={state === "loading"}
        className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#35475D] px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-[#35475D]/20 hover:bg-[#283546] transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
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
