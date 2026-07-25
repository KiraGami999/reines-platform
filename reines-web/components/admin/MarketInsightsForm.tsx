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
  Save,
  Trash2,
} from "lucide-react";
import {
  formatMetricLine,
  parseMetricLine,
  type MarketInsightCardItem,
  type MarketInsightHighlightItem,
  type MarketInsightMetric,
  type MarketInsightsSettings,
} from "@/lib/market-insights-data";
import {
  MARKET_INSIGHT_ICON_OPTIONS,
  getMarketInsightIcon,
  type MarketInsightIconKey,
} from "@/lib/market-insight-icons";

type Props = {
  initialSettings: MarketInsightsSettings;
  initialHighlights: MarketInsightHighlightItem[];
  initialCards: MarketInsightCardItem[];
  usingFallback: boolean;
};

const FIELD =
  "block w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-100";
const LABEL = "mb-1.5 block text-xs font-semibold uppercase tracking-widest text-zinc-400";

function joinLines(items: string[]) {
  return items.join("\n");
}

function splitLines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function metricsToText(metrics: MarketInsightMetric[]) {
  return joinLines(metrics.map(formatMetricLine));
}

function textToMetrics(value: string): MarketInsightMetric[] {
  return splitLines(value)
    .map(parseMetricLine)
    .filter((m): m is MarketInsightMetric => m !== null);
}

function buildBlankHighlight(sortOrder: number): MarketInsightHighlightItem {
  return {
    id: `draft-highlight-${Date.now()}`,
    label: "New Indicator",
    value: "0.00%",
    note: "Short note about this figure",
    sortOrder,
  };
}

function buildBlankCard(sortOrder: number): MarketInsightCardItem {
  return {
    id: `draft-card-${Date.now()}`,
    iconKey: "Percent",
    title: "New Insight",
    subtitle: "",
    body: "Describe how this indicator affects clients and their projects.",
    metrics: [],
    sortOrder,
  };
}

export default function MarketInsightsForm({
  initialSettings,
  initialHighlights,
  initialCards,
  usingFallback,
}: Props) {
  const [settings, setSettings] = useState<MarketInsightsSettings>(initialSettings);
  const [highlights, setHighlights] = useState<MarketInsightHighlightItem[]>(
    initialHighlights.map((h, sortOrder) => ({ ...h, sortOrder }))
  );
  const [cards, setCards] = useState<MarketInsightCardItem[]>(
    initialCards.map((c, sortOrder) => ({ ...c, sortOrder }))
  );
  const [selectedCardId, setSelectedCardId] = useState(initialCards[0]?.id ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedCard = useMemo(
    () => cards.find((card) => card.id === selectedCardId) ?? cards[0],
    [cards, selectedCardId]
  );

  function clearStatus() {
    setMessage("");
    setError("");
  }

  function updateSettings(patch: Partial<MarketInsightsSettings>) {
    clearStatus();
    setSettings((current) => ({ ...current, ...patch }));
  }

  function updateHighlight(id: string, patch: Partial<MarketInsightHighlightItem>) {
    clearStatus();
    setHighlights((current) => current.map((h) => (h.id === id ? { ...h, ...patch } : h)));
  }

  function addHighlight() {
    clearStatus();
    setHighlights((current) => [...current, buildBlankHighlight(current.length)]);
  }

  function removeHighlight(id: string) {
    clearStatus();
    setHighlights((current) =>
      current.filter((h) => h.id !== id).map((h, sortOrder) => ({ ...h, sortOrder }))
    );
  }

  function moveHighlight(id: string, direction: -1 | 1) {
    clearStatus();
    setHighlights((current) => {
      const index = current.findIndex((h) => h.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((h, sortOrder) => ({ ...h, sortOrder }));
    });
  }

  function updateCard(id: string, patch: Partial<MarketInsightCardItem>) {
    clearStatus();
    setCards((current) => current.map((card) => (card.id === id ? { ...card, ...patch } : card)));
  }

  function addCard() {
    clearStatus();
    const card = buildBlankCard(cards.length);
    setCards((current) => [...current, card]);
    setSelectedCardId(card.id);
  }

  function duplicateCard(card: MarketInsightCardItem) {
    clearStatus();
    const copy = { ...card, id: `draft-card-copy-${Date.now()}`, title: `${card.title} Copy`, sortOrder: cards.length };
    setCards((current) => [...current, copy]);
    setSelectedCardId(copy.id);
  }

  function removeCard(id: string) {
    clearStatus();
    setCards((current) => {
      const next = current.filter((card) => card.id !== id).map((card, sortOrder) => ({ ...card, sortOrder }));
      if (selectedCardId === id) setSelectedCardId(next[0]?.id ?? "");
      return next;
    });
  }

  function moveCard(id: string, direction: -1 | 1) {
    clearStatus();
    setCards((current) => {
      const index = current.findIndex((card) => card.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((card, sortOrder) => ({ ...card, sortOrder }));
    });
  }

  async function save() {
    if (highlights.length === 0) {
      setError("Add at least one highlight stat before saving.");
      return;
    }
    if (cards.length === 0) {
      setError("Add at least one insight card before saving.");
      return;
    }

    setSaving(true);
    setMessage("");
    setError("");

    const payload = {
      settings: {
        ...settings,
        planningNotes: settings.planningNotes.map((n) => n.trim()).filter(Boolean),
      },
      highlights: highlights.map((h, sortOrder) => ({
        label: h.label.trim(),
        value: h.value.trim(),
        note: h.note.trim(),
        sortOrder,
      })),
      cards: cards.map((card, sortOrder) => ({
        iconKey: card.iconKey,
        title: card.title.trim(),
        subtitle: card.subtitle.trim(),
        body: card.body.trim(),
        metrics: card.metrics,
        sortOrder,
      })),
    };

    try {
      const res = await fetch("/api/admin/market-insights", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Could not save market insights.");
        return;
      }

      setSettings(data.settings ?? settings);
      setHighlights(data.highlights ?? highlights);
      setCards(data.cards ?? cards);
      setSelectedCardId((data.cards ?? cards)[0]?.id ?? "");
      setMessage("Market insights saved successfully.");
    } catch {
      setError("Could not save market insights. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {usingFallback && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          Showing default market insights content until it&apos;s saved here for the first time.
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
          <h2 className="text-sm font-semibold text-zinc-900">Market Insights Content</h2>
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
          Save Market Insights
        </button>
      </div>

      {/* Visibility toggle — the "hide market insights page" control */}
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
              <h2 className="text-sm font-semibold text-zinc-900">Public Page Visibility</h2>
              <p className="mt-1 max-w-xl text-xs text-zinc-500">
                {settings.visible
                  ? "The Market Insights page is live and linked in the site navigation. Hide it while you update figures."
                  : "The Market Insights page is hidden — it's removed from the navigation and shows a temporarily unavailable message to visitors."}
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
                <EyeOff size={15} /> Hide Page
              </>
            ) : (
              <>
                <Eye size={15} /> Show Page
              </>
            )}
          </button>
        </div>
      </section>

      {/* Hero + snapshot copy */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-zinc-900">Page Copy</h2>
        <p className="mt-1 text-xs text-zinc-400">The heading text shown above the figures.</p>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className={LABEL}>Hero Eyebrow Tag</label>
            <input className={FIELD} value={settings.heroTag} onChange={(e) => updateSettings({ heroTag: e.target.value })} />
          </div>
          <div>
            <label className={LABEL}>Snapshot Section Title</label>
            <input
              className={FIELD}
              value={settings.snapshotTitle}
              onChange={(e) => updateSettings({ snapshotTitle: e.target.value })}
            />
          </div>
        </div>

        <div className="mt-4">
          <label className={LABEL}>Hero Title</label>
          <input className={FIELD} value={settings.heroTitle} onChange={(e) => updateSettings({ heroTitle: e.target.value })} />
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className={LABEL}>Hero Description</label>
            <textarea
              className={`${FIELD} min-h-24 resize-y`}
              value={settings.heroDescription}
              onChange={(e) => updateSettings({ heroDescription: e.target.value })}
            />
          </div>
          <div>
            <label className={LABEL}>Snapshot Section Description</label>
            <textarea
              className={`${FIELD} min-h-24 resize-y`}
              value={settings.snapshotDescription}
              onChange={(e) => updateSettings({ snapshotDescription: e.target.value })}
            />
          </div>
        </div>
      </section>

      {/* Highlight KPI stats */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">Snapshot Highlights</h2>
            <p className="mt-1 text-xs text-zinc-400">The four headline stat cards (e.g. Policy Rate, Inflation).</p>
          </div>
          <button
            type="button"
            onClick={addHighlight}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#2d4a6b] px-3 py-2 text-xs font-semibold text-white hover:bg-[#1a2f4a]"
          >
            <Plus size={14} /> Add
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {highlights.map((highlight, index) => (
            <div key={highlight.id} className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-widest text-zinc-400">#{index + 1}</span>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => moveHighlight(highlight.id, -1)} className="rounded-lg border border-zinc-200 bg-white p-1.5 text-zinc-500">
                    <ArrowUp size={12} />
                  </button>
                  <button type="button" onClick={() => moveHighlight(highlight.id, 1)} className="rounded-lg border border-zinc-200 bg-white p-1.5 text-zinc-500">
                    <ArrowDown size={12} />
                  </button>
                  <button type="button" onClick={() => removeHighlight(highlight.id)} className="rounded-lg border border-blue-200 bg-white p-1.5 text-blue-700">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
              <label className={LABEL}>Label</label>
              <input
                className={`${FIELD} mb-3`}
                value={highlight.label}
                onChange={(e) => updateHighlight(highlight.id, { label: e.target.value })}
              />
              <label className={LABEL}>Value</label>
              <input
                className={`${FIELD} mb-3`}
                value={highlight.value}
                onChange={(e) => updateHighlight(highlight.id, { value: e.target.value })}
              />
              <label className={LABEL}>Note</label>
              <input
                className={FIELD}
                value={highlight.note}
                onChange={(e) => updateHighlight(highlight.id, { note: e.target.value })}
              />
            </div>
          ))}

          {highlights.length === 0 && (
            <div className="col-span-full rounded-xl border border-dashed border-zinc-200 bg-zinc-50 py-10 text-center text-sm text-zinc-400">
              Add a highlight stat to get started.
            </div>
          )}
        </div>
      </section>

      {/* Insight cards — list + detail editor */}
      <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">Insight Cards</h2>
              <p className="mt-1 text-xs text-zinc-400">Detailed indicator cards below the highlights.</p>
            </div>
            <button
              type="button"
              onClick={addCard}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#2d4a6b] px-3 py-2 text-xs font-semibold text-white hover:bg-[#1a2f4a]"
            >
              <Plus size={14} /> Add
            </button>
          </div>

          <div className="space-y-2">
            {cards.map((card, index) => {
              const Icon = getMarketInsightIcon(card.iconKey);
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => setSelectedCardId(card.id)}
                  className={`w-full rounded-xl border p-3 text-left transition ${
                    card.id === selectedCard?.id ? "border-[#8fb9e8] bg-[#8fb9e8]/10" : "border-zinc-200 hover:bg-zinc-50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2d4a6b]/10 text-[#2d4a6b]">
                      <Icon size={18} strokeWidth={1.8} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-zinc-900">{card.title}</p>
                      <p className="mt-0.5 text-xs text-zinc-400">Position {index + 1}</p>
                      {card.subtitle && <p className="mt-1 truncate text-xs text-zinc-500">{card.subtitle}</p>}
                    </div>
                  </div>
                </button>
              );
            })}

            {cards.length === 0 && (
              <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 py-10 text-center text-sm text-zinc-400">
                Add an insight card.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">Card Details</h2>
              <p className="mt-1 text-xs text-zinc-400">Edit the selected insight card.</p>
            </div>
          </div>

          {!selectedCard ? (
            <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 py-12 text-center text-sm text-zinc-400">
              Add a card to start editing.
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => moveCard(selectedCard.id, -1)} className="rounded-lg border border-zinc-200 p-2 text-zinc-500">
                  <ArrowUp size={14} />
                </button>
                <button type="button" onClick={() => moveCard(selectedCard.id, 1)} className="rounded-lg border border-zinc-200 p-2 text-zinc-500">
                  <ArrowDown size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => duplicateCard(selectedCard)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-600"
                >
                  <Copy size={14} /> Duplicate
                </button>
                <button
                  type="button"
                  onClick={() => removeCard(selectedCard.id)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 px-3 py-2 text-xs font-medium text-blue-700"
                >
                  <Trash2 size={14} /> Remove
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className={LABEL}>Title</label>
                  <input
                    className={FIELD}
                    value={selectedCard.title}
                    onChange={(e) => updateCard(selectedCard.id, { title: e.target.value })}
                  />
                </div>
                <div>
                  <label className={LABEL}>Icon</label>
                  <select
                    className={FIELD}
                    value={selectedCard.iconKey}
                    onChange={(e) => updateCard(selectedCard.id, { iconKey: e.target.value as MarketInsightIconKey })}
                  >
                    {MARKET_INSIGHT_ICON_OPTIONS.map((icon) => (
                      <option key={icon.value} value={icon.value}>
                        {icon.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className={LABEL}>Subtitle (optional — shown above the title, e.g. &quot;Input Price Index&quot;)</label>
                <input
                  className={FIELD}
                  value={selectedCard.subtitle}
                  onChange={(e) => updateCard(selectedCard.id, { subtitle: e.target.value })}
                  placeholder="Market Indicator"
                />
              </div>

              <div>
                <label className={LABEL}>Description</label>
                <textarea
                  className={`${FIELD} min-h-28 resize-y`}
                  value={selectedCard.body}
                  onChange={(e) => updateCard(selectedCard.id, { body: e.target.value })}
                />
              </div>

              <div>
                <label className={LABEL}>Metrics (optional)</label>
                <textarea
                  className={`${FIELD} min-h-24 resize-y`}
                  value={metricsToText(selectedCard.metrics)}
                  onChange={(e) => updateCard(selectedCard.id, { metrics: textToMetrics(e.target.value) })}
                  placeholder="Policy Rate: 26.00%"
                />
                <p className="mt-1 text-xs text-zinc-400">One per line, formatted as &quot;Label: Value&quot;. Leave empty for no metrics box.</p>
              </div>

              <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Preview</p>
                <div className="mt-3 flex items-start gap-3">
                  {(() => {
                    const Icon = getMarketInsightIcon(selectedCard.iconKey);
                    return (
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#8fb9e8]/10 text-[#8fb9e8]">
                        <Icon size={22} strokeWidth={1.8} />
                      </div>
                    );
                  })()}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-[#8fb9e8]">
                      {selectedCard.subtitle || "Market Indicator"}
                    </p>
                    <p className="mt-1 text-lg font-bold text-[#2d4a6b]">{selectedCard.title}</p>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-500">{selectedCard.body}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Client planning section */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-zinc-900">Client Planning Section</h2>
        <p className="mt-1 text-xs text-zinc-400">The closing section with planning notes and the call to action.</p>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className={LABEL}>Eyebrow Tag</label>
            <input className={FIELD} value={settings.planningTag} onChange={(e) => updateSettings({ planningTag: e.target.value })} />
          </div>
          <div>
            <label className={LABEL}>Section Title</label>
            <input className={FIELD} value={settings.planningTitle} onChange={(e) => updateSettings({ planningTitle: e.target.value })} />
          </div>
        </div>

        <div className="mt-4">
          <label className={LABEL}>Section Description</label>
          <textarea
            className={`${FIELD} min-h-24 resize-y`}
            value={settings.planningDescription}
            onChange={(e) => updateSettings({ planningDescription: e.target.value })}
          />
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className={LABEL}>Call-to-Action Label</label>
            <input className={FIELD} value={settings.ctaLabel} onChange={(e) => updateSettings({ ctaLabel: e.target.value })} />
          </div>
          <div>
            <label className={LABEL}>Call-to-Action Link</label>
            <input className={FIELD} value={settings.ctaHref} onChange={(e) => updateSettings({ ctaHref: e.target.value })} />
          </div>
        </div>

        <div className="mt-4">
          <label className={LABEL}>Recommended Planning Notes</label>
          <textarea
            className={`${FIELD} min-h-32 resize-y`}
            value={joinLines(settings.planningNotes)}
            onChange={(e) => updateSettings({ planningNotes: splitLines(e.target.value) })}
          />
          <p className="mt-1 text-xs text-zinc-400">One note per line — shown as a numbered list.</p>
        </div>
      </section>
    </div>
  );
}
