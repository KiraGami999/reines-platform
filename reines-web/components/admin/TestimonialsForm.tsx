"use client";

import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  Loader2,
  Plus,
  Quote,
  Save,
  Trash2,
} from "lucide-react";
import {
  TESTIMONIAL_ACCENT_OPTIONS,
  getTestimonialInitials,
  type TestimonialItem,
  type TestimonialsSettings,
} from "@/lib/testimonials-data";

type Props = {
  initialSettings: TestimonialsSettings;
  initialTestimonials: TestimonialItem[];
  usingFallback: boolean;
};

const FIELD =
  "block w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-100";
const LABEL = "mb-1.5 block text-xs font-semibold uppercase tracking-widest text-zinc-400";

function buildBlankTestimonial(sortOrder: number): TestimonialItem {
  return {
    id: `draft-testimonial-${Date.now()}`,
    clientName: "New Client",
    clientTitle: "Role, Company",
    quote: "Share what this client said about working with Reines.",
    accentColor: TESTIMONIAL_ACCENT_OPTIONS[sortOrder % TESTIMONIAL_ACCENT_OPTIONS.length].value,
    sortOrder,
  };
}

export default function TestimonialsForm({ initialSettings, initialTestimonials, usingFallback }: Props) {
  const [settings, setSettings] = useState<TestimonialsSettings>(initialSettings);
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>(
    initialTestimonials.map((t, sortOrder) => ({ ...t, sortOrder }))
  );
  const [selectedId, setSelectedId] = useState(initialTestimonials[0]?.id ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selected = useMemo(
    () => testimonials.find((t) => t.id === selectedId) ?? testimonials[0],
    [testimonials, selectedId]
  );

  function clearStatus() {
    setMessage("");
    setError("");
  }

  function updateSettings(patch: Partial<TestimonialsSettings>) {
    clearStatus();
    setSettings((current) => ({ ...current, ...patch }));
  }

  function updateTestimonial(id: string, patch: Partial<TestimonialItem>) {
    clearStatus();
    setTestimonials((current) => current.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }

  function addTestimonial() {
    clearStatus();
    const t = buildBlankTestimonial(testimonials.length);
    setTestimonials((current) => [...current, t]);
    setSelectedId(t.id);
  }

  function duplicateTestimonial(t: TestimonialItem) {
    clearStatus();
    const copy = { ...t, id: `draft-testimonial-copy-${Date.now()}`, clientName: `${t.clientName} Copy`, sortOrder: testimonials.length };
    setTestimonials((current) => [...current, copy]);
    setSelectedId(copy.id);
  }

  function removeTestimonial(id: string) {
    clearStatus();
    setTestimonials((current) => {
      const next = current.filter((t) => t.id !== id).map((t, sortOrder) => ({ ...t, sortOrder }));
      if (selectedId === id) setSelectedId(next[0]?.id ?? "");
      return next;
    });
  }

  function moveTestimonial(id: string, direction: -1 | 1) {
    clearStatus();
    setTestimonials((current) => {
      const index = current.findIndex((t) => t.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((t, sortOrder) => ({ ...t, sortOrder }));
    });
  }

  async function save() {
    if (testimonials.length === 0) {
      setError("Add at least one testimonial before saving.");
      return;
    }

    setSaving(true);
    setMessage("");
    setError("");

    const payload = {
      settings,
      testimonials: testimonials.map((t, sortOrder) => ({
        clientName: t.clientName.trim(),
        clientTitle: t.clientTitle.trim(),
        quote: t.quote.trim(),
        accentColor: t.accentColor,
        sortOrder,
      })),
    };

    try {
      const res = await fetch("/api/admin/testimonials", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Could not save testimonials.");
        return;
      }

      setSettings(data.settings ?? settings);
      setTestimonials(data.testimonials ?? testimonials);
      setSelectedId((data.testimonials ?? testimonials)[0]?.id ?? "");
      setMessage("Testimonials saved successfully.");
    } catch {
      setError("Could not save testimonials. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {usingFallback && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          Showing sample testimonials until real ones are saved here for the first time.
        </div>
      )}

      {message && (
        <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          <CheckCircle2 size={16} />
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">{error}</div>
      )}

      {/* Sticky-ish header with the master save action */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">Client Testimonials</h2>
          <p className="mt-1 text-xs text-zinc-400">
            All changes below save together. Nothing goes live until you press Save.
          </p>
        </div>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#2d4a6b] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a2f4a] disabled:opacity-60"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          Save Testimonials
        </button>
      </div>

      {/* Visibility toggle */}
      <section
        className={`rounded-2xl border p-5 transition-colors ${
          settings.visible ? "border-zinc-200 bg-white" : "border-amber-300 bg-amber-50"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                settings.visible ? "bg-zinc-100 text-zinc-500" : "bg-amber-100 text-amber-700"
              }`}
            >
              {settings.visible ? <Eye size={20} strokeWidth={1.8} /> : <EyeOff size={20} strokeWidth={1.8} />}
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">Homepage Section Visibility</h2>
              <p className="mt-1 max-w-xl text-xs text-zinc-500">
                {settings.visible
                  ? "The \u201cWhat Our Clients Say\u201d section is live on the homepage. Hide it while you update testimonials."
                  : "The testimonials section is hidden from the public homepage."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => updateSettings({ visible: !settings.visible })}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
              settings.visible
                ? "border border-amber-300 bg-white text-amber-700 hover:bg-amber-50"
                : "bg-[#2d4a6b] text-white hover:bg-[#1a2f4a]"
            }`}
          >
            {settings.visible ? (
              <>
                <EyeOff size={15} /> Hide Section
              </>
            ) : (
              <>
                <Eye size={15} /> Show Section
              </>
            )}
          </button>
        </div>
      </section>

      {/* Testimonials — list + detail editor */}
      <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">Testimonials</h2>
              <p className="mt-1 text-xs text-zinc-400">Shown in this order on the homepage.</p>
            </div>
            <button
              type="button"
              onClick={addTestimonial}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#2d4a6b] px-3 py-2 text-xs font-semibold text-white hover:bg-[#1a2f4a]"
            >
              <Plus size={14} /> Add
            </button>
          </div>

          <div className="space-y-2">
            {testimonials.map((t, index) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedId(t.id)}
                className={`w-full rounded-xl border p-3 text-left transition ${
                  t.id === selected?.id ? "border-[#8fb9e8] bg-[#8fb9e8]/10" : "border-zinc-200 hover:bg-zinc-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: t.accentColor }}
                  >
                    {getTestimonialInitials(t.clientName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-zinc-900">{t.clientName}</p>
                    <p className="mt-0.5 text-xs text-zinc-400">Position {index + 1}</p>
                    <p className="mt-1 truncate text-xs text-zinc-500">{t.clientTitle}</p>
                  </div>
                </div>
              </button>
            ))}

            {testimonials.length === 0 && (
              <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 py-10 text-center text-sm text-zinc-400">
                Add a testimonial to get started.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">Testimonial Details</h2>
              <p className="mt-1 text-xs text-zinc-400">Edit the selected testimonial.</p>
            </div>
          </div>

          {!selected ? (
            <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 py-12 text-center text-sm text-zinc-400">
              Add a testimonial to start editing.
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => moveTestimonial(selected.id, -1)} className="rounded-lg border border-zinc-200 p-2 text-zinc-500">
                  <ArrowUp size={14} />
                </button>
                <button type="button" onClick={() => moveTestimonial(selected.id, 1)} className="rounded-lg border border-zinc-200 p-2 text-zinc-500">
                  <ArrowDown size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => duplicateTestimonial(selected)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-600"
                >
                  <Copy size={14} /> Duplicate
                </button>
                <button
                  type="button"
                  onClick={() => removeTestimonial(selected.id)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 px-3 py-2 text-xs font-medium text-blue-700"
                >
                  <Trash2 size={14} /> Remove
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className={LABEL}>Client Name</label>
                  <input
                    className={FIELD}
                    value={selected.clientName}
                    onChange={(e) => updateTestimonial(selected.id, { clientName: e.target.value })}
                  />
                </div>
                <div>
                  <label className={LABEL}>Role / Company</label>
                  <input
                    className={FIELD}
                    value={selected.clientTitle}
                    onChange={(e) => updateTestimonial(selected.id, { clientTitle: e.target.value })}
                    placeholder="Director, Nyanja Residences"
                  />
                </div>
              </div>

              <div>
                <label className={LABEL}>Quote</label>
                <textarea
                  className={`${FIELD} min-h-28 resize-y`}
                  value={selected.quote}
                  onChange={(e) => updateTestimonial(selected.id, { quote: e.target.value })}
                />
              </div>

              <div>
                <label className={LABEL}>Avatar Color</label>
                <div className="flex flex-wrap gap-2">
                  {TESTIMONIAL_ACCENT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updateTestimonial(selected.id, { accentColor: opt.value })}
                      title={opt.label}
                      className={`flex h-9 w-9 items-center justify-center rounded-full text-[10px] font-bold text-white transition ${
                        selected.accentColor === opt.value ? "ring-2 ring-offset-2 ring-[#2d4a6b]" : ""
                      }`}
                      style={{ backgroundColor: opt.value }}
                    >
                      {selected.accentColor === opt.value ? "✓" : ""}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Preview</p>
                <div className="mt-3 rounded-xl border border-zinc-200 bg-white p-4">
                  <Quote size={16} className="text-zinc-300" />
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600">{selected.quote}</p>
                  <div className="mt-4 flex items-center gap-3">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: selected.accentColor }}
                    >
                      {getTestimonialInitials(selected.clientName)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">{selected.clientName}</p>
                      <p className="text-xs text-zinc-500">{selected.clientTitle}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
