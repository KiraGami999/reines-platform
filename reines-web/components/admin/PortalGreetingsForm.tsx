"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  MessageSquareText,
  Save,
  Sun,
  Sunset,
  Moon,
} from "lucide-react";
import {
  MAX_GREETING_VARIANTS,
  type GreetingPeriod,
  type PortalGreetingSettings,
} from "@/lib/greetings-data";

type Props = {
  initialSettings: PortalGreetingSettings;
};

const FIELD =
  "block w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-100";
const LABEL = "mb-1.5 block text-sm font-medium text-zinc-700";

const PERIODS: {
  id: GreetingPeriod;
  label: string;
  hint: string;
  icon: typeof Sun;
}[] = [
  { id: "morning", label: "Morning", hint: "Before 12:00 (Malawi time)", icon: Sun },
  { id: "afternoon", label: "Afternoon", hint: "12:00 – 17:00 (Malawi time)", icon: Sunset },
  { id: "evening", label: "Evening", hint: "After 17:00 (Malawi time)", icon: Moon },
];

const OPTION_LABELS = [
  "Option 1 (e.g. English)",
  "Option 2 (e.g. Chichewa)",
  "Option 3 (optional)",
  "Option 4 (optional)",
  "Option 5 (optional)",
];

type VariantTuple = [string, string, string, string, string];

function padVariants(values: string[]): VariantTuple {
  return [
    values[0] ?? "",
    values[1] ?? "",
    values[2] ?? "",
    values[3] ?? "",
    values[4] ?? "",
  ];
}

export default function PortalGreetingsForm({ initialSettings }: Props) {
  const [enabled, setEnabled] = useState(initialSettings.enabled);
  const [period, setPeriod] = useState<GreetingPeriod>("morning");
  const [morning, setMorning] = useState(padVariants(initialSettings.morning));
  const [afternoon, setAfternoon] = useState(padVariants(initialSettings.afternoon));
  const [evening, setEvening] = useState(padVariants(initialSettings.evening));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const activeVariants = useMemo(() => {
    if (period === "morning") return morning;
    if (period === "afternoon") return afternoon;
    return evening;
  }, [period, morning, afternoon, evening]);

  function setActiveVariants(next: VariantTuple) {
    setMessage("");
    setError("");
    if (period === "morning") setMorning(next);
    else if (period === "afternoon") setAfternoon(next);
    else setEvening(next);
  }

  function updateVariant(index: number, value: string) {
    const next = [...activeVariants] as VariantTuple;
    next[index] = value;
    setActiveVariants(next);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/admin/greetings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled,
          morning: morning.filter((v) => v.trim()).slice(0, MAX_GREETING_VARIANTS),
          afternoon: afternoon.filter((v) => v.trim()).slice(0, MAX_GREETING_VARIANTS),
          evening: evening.filter((v) => v.trim()).slice(0, MAX_GREETING_VARIANTS),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Could not save greetings.");
        return;
      }
      setMessage("Portal greetings saved. A different option is shown each time someone opens Overview.");
    } catch {
      setError("A network error occurred. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const periodMeta = PERIODS.find((p) => p.id === period)!;
  const PeriodIcon = periodMeta.icon;
  const previewPhrase = activeVariants.find((v) => v.trim());

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-[#2d4a6b]">
              <MessageSquareText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-900">Greeting display</h2>
              <p className="mt-1 text-sm text-zinc-500">
                When enabled, the portal picks one option for the current time of day and appends
                the user&apos;s first name (with a space — put commas, !, or ? in the greeting
                text yourself). The option changes every time they open Overview.
              </p>
            </div>
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 self-start rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-700">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => {
                setEnabled(e.target.checked);
                setMessage("");
                setError("");
              }}
              className="h-4 w-4 rounded border-zinc-300 text-[#2d4a6b] focus:ring-[#2d4a6b]"
            />
            {enabled ? "Enabled" : "Disabled (use Welcome)"}
          </label>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 space-y-5">
        <div>
          <label htmlFor="greeting-period" className={LABEL}>
            Time of day
          </label>
          <select
            id="greeting-period"
            className={FIELD}
            value={period}
            onChange={(e) => setPeriod(e.target.value as GreetingPeriod)}
            disabled={saving}
          >
            {PERIODS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-zinc-500">
            <PeriodIcon className="h-3.5 w-3.5" />
            Editing {periodMeta.label.toLowerCase()} greetings — {periodMeta.hint}
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">Greeting options</h3>
              <p className="mt-1 text-xs text-zinc-500">
                Add up to {MAX_GREETING_VARIANTS} greetings for this time of day (different languages
                or phrasings). Include any punctuation you want (! ? .). The first name is appended
                after a space — one option is chosen each time they open Overview.
              </p>
          </div>

          {OPTION_LABELS.map((label, index) => (
            <div key={label}>
              <label className={LABEL} htmlFor={`greeting-${period}-${index}`}>
                {label}
              </label>
              <input
                id={`greeting-${period}-${index}`}
                type="text"
                className={FIELD}
                maxLength={80}
                placeholder={
                  index === 0
                    ? period === "morning"
                      ? "Good morning"
                      : period === "afternoon"
                        ? "Good afternoon"
                        : "Good evening"
                    : "Optional greeting"
                }
                value={activeVariants[index]}
                onChange={(e) => updateVariant(index, e.target.value)}
                disabled={saving || !enabled}
              />
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3 text-xs text-zinc-600">
          <span className="font-semibold text-zinc-800">Preview: </span>
          {previewPhrase ? `${previewPhrase} Ronnie` : "Welcome Ronnie"}
        </div>
      </div>

      {(message || error) && (
        <div
          className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${
            error
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-green-200 bg-green-50 text-green-700"
          }`}
        >
          {error ? (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <span>{error || message}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-[#2d4a6b] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1a2f4a] disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving…" : "Save greetings"}
        </button>
        <p className="text-xs text-zinc-500">
          Changes apply to Admin, Manager, and Client portal dashboards (including Project Mate
          web views).
        </p>
      </div>
    </form>
  );
}
