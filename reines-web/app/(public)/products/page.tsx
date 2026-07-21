import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Blocks, PackageCheck } from "lucide-react";
import { ProductCatalog } from "@/components/public/ProductCatalog";
import { getProductCatalog } from "@/lib/product-catalog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Products — Reines Property Development",
  description:
    "Browse Reines concrete products, stone products, adhesives, binding materials, and project supply options.",
};

export default async function ProductsPage() {
  const products = await getProductCatalog();

  return (
    <>
      <section className="relative overflow-hidden bg-[#2d4a6b] py-14 sm:py-24">
        <div className="pointer-events-none absolute -right-32 top-10 h-96 w-96 rounded-full bg-[#8fb9e8]/10 blur-3xl" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#8fb9e8]/30 bg-[#8fb9e8]/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[#8fb9e8]">
              <Blocks size={13} />
              Product Catalogue
            </span>
            <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Building products ready for your next project.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-300">
              Browse Reines products by subsidiary — ProCrete, ProBuild, ProSteel, and Workshop — then request a quote for project or bulk supply.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="#catalog" className="inline-flex items-center gap-1.5 rounded-xl bg-[#8fb9e8] px-5 py-3 text-sm font-semibold text-[#2d4a6b] hover:bg-[#b8d4f2]">
                Browse catalogue <ArrowRight size={16} />
              </Link>
              <Link href="/contact" className="inline-flex items-center rounded-xl border border-white/15 px-5 py-3 text-sm font-medium text-zinc-200 hover:bg-white/10">
                Talk to sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="catalog">
        <ProductCatalog products={products} />
      </section>

      <section className="bg-white py-12 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#8fb9e8]/10 text-[#8fb9e8]">
            <PackageCheck size={26} strokeWidth={1.8} />
          </div>
          <h2 className="mt-5 text-3xl font-bold tracking-tight text-[#2d4a6b]">
            Need help choosing the right product?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-zinc-500">
            Send us your walling, paving, stone cladding, adhesive, or binding material requirement and we can advise on product fit, quantities, availability, and delivery planning.
          </p>
          <Link href="/quote" className="mt-8 inline-flex items-center gap-1.5 rounded-xl bg-[#2d4a6b] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1a2f4a]">
            Request assistance <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </>
  );
}
