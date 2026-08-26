import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock, Lightbulb } from "lucide-react";
import { getMarketInsightsPageData } from "@/lib/market-insights";
import { getMarketInsightIcon } from "@/lib/market-insight-icons";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Market Insights — Reines Property Development",
  description:
    "Construction, property, inflation, and market indicators to help clients plan confidently.",
};

export default async function MarketInsightsPage() {
  const { settings, highlights, cards } = await getMarketInsightsPageData();

  if (!settings.visible) {
    return (
      <section className="flex min-h-[70vh] items-center bg-zinc-50 py-20 dark:bg-[var(--surface-muted)]">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#8fb9e8]/10 text-[#8fb9e8]">
            <Clock size={26} strokeWidth={1.8} />
          </div>
          <h1 className="mt-5 text-2xl font-bold tracking-tight text-[#35475D] dark:text-[#8fb9e8] sm:text-3xl">
            Market insights are being updated.
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-zinc-500 dark:text-[var(--text-muted)]">
            We&apos;re refreshing our rates and indicators to make sure they&apos;re accurate. Please check back
            soon, or get in touch if you&apos;d like to discuss your project in the meantime.
          </p>
          <Link
            href="/contact"
            className="mt-8 inline-flex items-center gap-1.5 rounded-xl bg-[#35475D] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#283546]"
          >
            Discuss Your Project
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="bg-[#35475D] py-14 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#8fb9e8]">
            {settings.heroTag}
          </span>
          <h1 className="mt-3 max-w-3xl text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
            {settings.heroTitle}
          </h1>
          <p className="mt-4 max-w-2xl text-zinc-400">{settings.heroDescription}</p>
        </div>
      </section>

      <section className="bg-zinc-50 py-12 dark:bg-[var(--surface-muted)] sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#8fb9e8]/10 text-[#8fb9e8]">
              <Lightbulb size={24} strokeWidth={1.8} />
            </div>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-[#35475D] dark:text-[#8fb9e8] sm:text-3xl lg:text-4xl">
              {settings.snapshotTitle}
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-zinc-500 dark:text-[var(--text-muted)]">
              {settings.snapshotDescription}
            </p>
          </div>

          <div className="grid gap-4 rounded-3xl bg-[#35475D] p-4 shadow-xl sm:grid-cols-2 lg:grid-cols-4">
            {highlights.map((item) => (
              <div key={item.id} className="rounded-2xl bg-white/95 p-5 shadow-sm dark:bg-[var(--surface)]">
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">{item.label}</p>
                <p className="mt-2 text-3xl font-extrabold text-[#35475D] dark:text-[#8fb9e8]">{item.value}</p>
                <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-[var(--text-muted)]">{item.note}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => {
              const Icon = getMarketInsightIcon(card.iconKey);
              return (
                <div key={card.id} className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-[var(--border)] dark:bg-[var(--surface)]">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#8fb9e8]/10 text-[#8fb9e8]">
                    <Icon size={22} strokeWidth={1.8} />
                  </div>
                  <p className="mt-5 text-xs font-semibold uppercase tracking-widest text-[#8fb9e8]">
                    {card.subtitle || "Market Indicator"}
                  </p>
                  <h3 className="mt-1 text-lg font-bold text-[#35475D] dark:text-[#8fb9e8]">{card.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-500 dark:text-[var(--text-muted)]">{card.body}</p>

                  {card.metrics.length > 0 && (
                    <div className="mt-5 space-y-2 rounded-xl bg-zinc-50 p-4 dark:bg-[var(--surface-muted)]">
                      {card.metrics.map((metric) => (
                        <div key={metric.label} className="flex items-center justify-between gap-3 text-sm">
                          <span className="text-zinc-500 dark:text-[var(--text-muted)]">{metric.label}</span>
                          <span className="font-bold text-[#35475D] dark:text-[#8fb9e8]">{metric.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-white py-12 dark:bg-[var(--background)] sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-[#8fb9e8]">
              {settings.planningTag}
            </span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#35475D] dark:text-[#8fb9e8]">{settings.planningTitle}</h2>
            <p className="mt-4 text-sm leading-7 text-zinc-500 dark:text-[var(--text-muted)]">{settings.planningDescription}</p>
            <Link
              href={settings.ctaHref}
              className="mt-8 inline-flex items-center gap-1.5 rounded-xl bg-[#35475D] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#283546]"
            >
              {settings.ctaLabel}
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 dark:border-[var(--border)] dark:bg-[var(--surface-muted)]">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-[var(--foreground)]">Recommended planning approach</h3>
            <div className="mt-5 space-y-4">
              {settings.planningNotes.map((note, index) => (
                <div key={note} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#35475D] text-xs font-bold text-[#8fb9e8]">
                    {index + 1}
                  </span>
                  <p className="text-sm leading-6 text-zinc-600 dark:text-[var(--text-secondary)]">{note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
