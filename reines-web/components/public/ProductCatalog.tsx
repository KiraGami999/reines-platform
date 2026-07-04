"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Blocks,
  CheckCircle2,
  Hammer,
  Layers3,
  PackageCheck,
  Truck,
} from "lucide-react";
import {
  PRODUCT_SUBSIDIARIES,
  getSubsidiaryMeta,
  type ProductCatalogItem,
  type ProductSubsidiary,
  type ProductSubsidiaryFilter,
} from "@/lib/product-catalog-data";

const subsidiaryIcons: Record<ProductSubsidiary, typeof Blocks> = {
  procrete: Blocks,
  probuild: PackageCheck,
  prosteel: Layers3,
  workshop: Hammer,
};

const AUTO_PREVIEW_MS = 5000;

export function ProductCatalog({ products }: { products: ProductCatalogItem[] }) {
  const [subsidiary, setSubsidiary] = useState<ProductSubsidiaryFilter>("all");
  const [activeProductId, setActiveProductId] = useState(products[0]?.id ?? "");

  const visibleProducts = useMemo(
    () => products.filter((product) => subsidiary === "all" || product.subsidiary === subsidiary),
    [subsidiary, products]
  );

  const selectedSubsidiary = PRODUCT_SUBSIDIARIES.find((item) => item.value === subsidiary);

  useEffect(() => {
    if (visibleProducts.length <= 1) return;

    const timer = window.setInterval(() => {
      setActiveProductId((currentId) => {
        const currentIndex = visibleProducts.findIndex((product) => product.id === currentId);
        const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % visibleProducts.length : 0;
        return visibleProducts[nextIndex].id;
      });
    }, AUTO_PREVIEW_MS);

    return () => window.clearInterval(timer);
  }, [visibleProducts]);

  useEffect(() => {
    if (!visibleProducts.some((product) => product.id === activeProductId)) {
      setActiveProductId(visibleProducts[0]?.id ?? "");
    }
  }, [visibleProducts, activeProductId]);

  const activeProduct = visibleProducts.find((product) => product.id === activeProductId) ?? visibleProducts[0];
  const ActiveIcon = activeProduct ? subsidiaryIcons[activeProduct.subsidiary] : Blocks;
  const activeSubsidiary = activeProduct ? getSubsidiaryMeta(activeProduct.subsidiary) : null;

  if (products.length === 0) {
    return (
      <section className="bg-zinc-50 py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#8fb9e8]/10 text-[#8fb9e8]">
            <PackageCheck size={26} strokeWidth={1.8} />
          </div>
          <h2 className="mt-5 text-2xl font-bold tracking-tight text-[#2d4a6b]">
            Products are being updated
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-zinc-500">
            The catalogue has not been published yet. Please check back soon or contact Reines for product availability and quotes.
          </p>
          <Link
            href="/contact"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-[#2d4a6b] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1a2f4a]"
          >
            Request a quote <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-zinc-50 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.35fr]">
          <div className="rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-sm">
            <label htmlFor="product-subsidiary" className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
              Browse subsidiary
            </label>
            <select
              id="product-subsidiary"
              value={subsidiary}
              onChange={(event) => setSubsidiary(event.target.value as ProductSubsidiaryFilter)}
              className="mt-3 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-800 outline-none transition focus:border-[#8fb9e8] focus:ring-4 focus:ring-[#8fb9e8]/15"
            >
              {PRODUCT_SUBSIDIARIES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            {selectedSubsidiary && selectedSubsidiary.value !== "all" && (
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">{selectedSubsidiary.description}</p>
            )}

            <div className="mt-6 space-y-3">
              {visibleProducts.map((product) => {
                const Icon = subsidiaryIcons[product.subsidiary];
                const subsidiaryMeta = getSubsidiaryMeta(product.subsidiary);
                const active = product.id === activeProduct?.id;

                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => setActiveProductId(product.id)}
                    className={`w-full rounded-2xl border p-4 text-left transition-all ${
                      active
                        ? "border-[#8fb9e8] bg-[#8fb9e8]/10 shadow-sm"
                        : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${active ? "bg-[#2d4a6b] text-[#8fb9e8]" : "bg-zinc-100 text-zinc-500"}`}>
                        <Icon size={18} strokeWidth={1.8} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8fb9e8]">
                          {subsidiaryMeta?.label}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-zinc-900">{product.name}</h3>
                          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-blue-700">
                            {product.badge}
                          </span>
                          {product.promoLabel && (
                            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                              {product.promoLabel}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-zinc-500">
                          {product.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {activeProduct && (
            <div className="overflow-hidden rounded-[2rem] border border-zinc-200 bg-[#2d4a6b] shadow-xl">
              <div className="grid min-h-[520px] md:grid-cols-[0.8fr_1.2fr]">
                <div className="relative flex flex-col justify-center p-8 text-white sm:p-10">
                  <div className="pointer-events-none absolute -left-24 top-12 h-56 w-56 rounded-full bg-[#8fb9e8]/20 blur-3xl" />
                  <div className="relative">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#8fb9e8]/15 text-[#8fb9e8]">
                      <ActiveIcon size={24} strokeWidth={1.8} />
                    </div>
                    <p className="mt-6 text-xs font-semibold uppercase tracking-[0.25em] text-[#8fb9e8]">
                      {activeSubsidiary?.label ?? "Product Preview"}
                    </p>
                    <h2 className="mt-3 text-4xl font-extrabold leading-tight tracking-tight">
                      {activeProduct.name}
                    </h2>
                    <p className="mt-2 text-sm text-zinc-400">{activeSubsidiary?.description}</p>
                    <p className="mt-5 text-sm leading-7 text-zinc-300">
                      {activeProduct.description}
                    </p>
                    <p className="mt-4 inline-flex rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-white">
                      {activeProduct.priceLabel}
                    </p>

                    <div className="mt-6 grid gap-4 text-sm">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Available sizes</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {activeProduct.sizes.map((size) => (
                            <span key={size} className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-zinc-200">
                              {size}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Best for</p>
                        <ul className="mt-2 space-y-1.5">
                          {activeProduct.applications.map((item) => (
                            <li key={item} className="flex items-center gap-2 text-zinc-300">
                              <CheckCircle2 size={14} className="text-[#8fb9e8]" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <Link
                      href={`/contact?subject=${encodeURIComponent(activeProduct.name)}`}
                      className="mt-8 inline-flex items-center gap-2 rounded-lg bg-[#8fb9e8] px-5 py-3 text-sm font-semibold text-[#2d4a6b] transition-colors hover:bg-[#b8d4f2]"
                    >
                      Request product quote
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>

                <div className="relative min-h-[320px] overflow-hidden bg-zinc-900">
                  {visibleProducts.map((product) => (
                    <Image
                      key={product.id}
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      unoptimized={product.imageUrl.startsWith("/api/media")}
                      priority={product.id === activeProduct.id}
                      sizes="(max-width: 768px) 100vw, 45vw"
                      className={`object-cover object-center transition-opacity duration-700 ease-out ${
                        product.id === activeProduct.id ? "opacity-100" : "opacity-0"
                      }`}
                    />
                  ))}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#2d4a6b] via-[#2d4a6b]/10 to-transparent md:from-[#2d4a6b]/45" />

                  <div className="absolute bottom-5 left-5 right-5 grid grid-cols-3 gap-3">
                    {visibleProducts.slice(0, 3).map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => setActiveProductId(product.id)}
                        className={`group relative h-20 overflow-hidden rounded-xl border bg-white/10 shadow-lg backdrop-blur transition-all ${
                          product.id === activeProduct.id
                            ? "border-[#8fb9e8] ring-2 ring-[#8fb9e8]/40"
                            : "border-white/25 hover:border-white/60"
                        }`}
                      >
                        <Image
                          src={product.imageUrl}
                          alt={product.name}
                          fill
                          unoptimized={product.imageUrl.startsWith("/api/media")}
                          sizes="180px"
                          className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                        />
                        <span className="absolute inset-0 bg-black/10" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-10 grid gap-4 rounded-2xl border border-zinc-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-4">
          {PRODUCT_SUBSIDIARIES.filter((item) => item.value !== "all").map((item) => {
            const Icon = subsidiaryIcons[item.value as ProductSubsidiary];
            return (
              <div key={item.value} className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#8fb9e8]/10 text-[#8fb9e8]">
                  <Icon size={18} strokeWidth={1.8} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#2d4a6b]">{item.label}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-zinc-500">{item.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 grid gap-4 rounded-2xl border border-zinc-200 bg-white p-5 sm:grid-cols-3">
          {[
            { icon: PackageCheck, title: "Quality checked", body: "Products are produced for durability and consistent site performance." },
            { icon: Truck, title: "Delivery coordination", body: "Request site delivery support when placing bulk or project orders." },
            { icon: Blocks, title: "Project quantities", body: "Ask for guidance on estimated quantities for your construction scope." },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#8fb9e8]/10 text-[#8fb9e8]">
                  <Icon size={18} strokeWidth={1.8} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#2d4a6b]">{item.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-zinc-500">{item.body}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
