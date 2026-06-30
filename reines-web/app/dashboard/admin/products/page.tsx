import { PackageCheck, Store } from "lucide-react";
import ProductCatalogForm from "@/components/admin/ProductCatalogForm";
import { getAdminProductCatalog, getProductImageLibrary } from "@/lib/product-catalog";

export const metadata = { title: "Product Catalogue - Reines Admin" };
export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const [{ products }, libraryImages] = await Promise.all([
    getAdminProductCatalog(),
    getProductImageLibrary(),
  ]);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex items-start justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#2d4a6b]">
            <PackageCheck className="h-5 w-5 text-[#8fb9e8]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#2d4a6b]">Product Catalogue</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Manage products by Reines subsidiary, including images, pricing labels, promotions, and catalogue copy shown on the public Products page.
            </p>
          </div>
        </div>

        <div className="hidden rounded-xl border border-zinc-200 bg-white px-4 py-3 text-xs text-zinc-500 md:flex md:items-center md:gap-2">
          <Store size={15} className="text-[#8fb9e8]" />
          Public product catalogue
        </div>
      </div>

      <ProductCatalogForm
        initialProducts={products}
        initialLibraryImages={libraryImages}
      />
    </div>
  );
}
