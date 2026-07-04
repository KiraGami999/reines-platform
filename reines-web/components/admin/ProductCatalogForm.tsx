"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Copy,
  Loader2,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import {
  FALLBACK_PRODUCTS,
  PRODUCT_SUBSIDIARY_OPTIONS,
  getSubsidiaryMeta,
  type AvailableProductImage,
  type ProductCatalogItem,
  type ProductSubsidiary,
} from "@/lib/product-catalog-data";

type Props = {
  initialProducts: ProductCatalogItem[];
  initialLibraryImages: AvailableProductImage[];
};

const DEFAULT_PRODUCT_IMAGE = "/product-images/rectangular-paver.png";

const FIELD = "block w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-100";
const LABEL = "mb-1.5 block text-xs font-semibold uppercase tracking-widest text-zinc-400";

const subsidiaryOptions = PRODUCT_SUBSIDIARY_OPTIONS;

function splitList(value: string): string[] {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinList(value: string[]): string {
  return value.join("\n");
}

function buildBlankProduct(sortOrder: number, libraryImages: AvailableProductImage[]): ProductCatalogItem {
  const image = libraryImages[0];

  return {
    id: `draft-${Date.now()}`,
    name: "New Product",
    subsidiary: "procrete",
    description: "Add a short description for this product before saving.",
    sizes: ["Standard size"],
    applications: ["General construction"],
    imageUrl: image?.imageUrl ?? DEFAULT_PRODUCT_IMAGE,
    badge: "Available",
    priceLabel: "Request quote",
    promoLabel: "",
    active: true,
    sortOrder,
  };
}

export default function ProductCatalogForm({ initialProducts, initialLibraryImages }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [products, setProducts] = useState<ProductCatalogItem[]>(
    initialProducts.map((product, sortOrder) => ({ ...product, sortOrder }))
  );
  const [selectedId, setSelectedId] = useState(initialProducts[0]?.id ?? "");
  const [libraryImages, setLibraryImages] = useState<AvailableProductImage[]>(initialLibraryImages);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [deletingImageUrl, setDeletingImageUrl] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedId) ?? products[0],
    [products, selectedId]
  );

  const imageOptions = libraryImages;

  function clearStatus() {
    setMessage("");
    setError("");
  }

  function updateProduct(id: string, patch: Partial<ProductCatalogItem>) {
    clearStatus();
    setProducts((current) =>
      current.map((product) => (product.id === id ? { ...product, ...patch } : product))
    );
  }

  function addProduct() {
    clearStatus();
    const product = buildBlankProduct(products.length, libraryImages);
    setProducts((current) => [...current, product]);
    setSelectedId(product.id);
  }

  function duplicateProduct(product: ProductCatalogItem) {
    clearStatus();
    const copy = {
      ...product,
      id: `draft-copy-${Date.now()}`,
      name: `${product.name} Copy`,
      sortOrder: products.length,
    };
    setProducts((current) => [...current, copy]);
    setSelectedId(copy.id);
  }

  function removeProduct(id: string) {
    clearStatus();
    setProducts((current) => {
      const next = current.filter((product) => product.id !== id).map((product, sortOrder) => ({ ...product, sortOrder }));
      if (selectedId === id) setSelectedId(next[0]?.id ?? "");
      return next;
    });
  }

  function moveProduct(id: string, direction: -1 | 1) {
    clearStatus();
    setProducts((current) => {
      const index = current.findIndex((product) => product.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.length) return current;

      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((product, sortOrder) => ({ ...product, sortOrder }));
    });
  }

  async function uploadProductImage(file: File) {
    if (!selectedProduct) return;

    clearStatus();
    setUploadingImage(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/products/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Could not upload image.");
        return;
      }

      const uploaded: AvailableProductImage = {
        imageUrl: data.url,
        alt: selectedProduct.name,
        defaultTitle: file.name.replace(/\.[^.]+$/, ""),
      };

      setLibraryImages((current) => {
        if (current.some((image) => image.imageUrl === uploaded.imageUrl)) return current;
        return [uploaded, ...current];
      });
      updateProduct(selectedProduct.id, { imageUrl: data.url });
      setMessage("Product image uploaded. Save the catalogue to keep it.");
    } catch {
      setError("Could not upload image. Check your connection and try again.");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function importSampleCatalogue() {
    clearStatus();
    const sampleProducts = FALLBACK_PRODUCTS.map((product, sortOrder) => ({
      ...product,
      id: `draft-sample-${sortOrder}-${Date.now()}`,
      sortOrder,
    }));
    setProducts(sampleProducts);
    setSelectedId(sampleProducts[0]?.id ?? "");
    setMessage("Sample catalogue loaded into the editor. Click Save Catalogue to publish it.");
  }

  function formatSaveError(data: { error?: string; issues?: Record<string, string[] | string[][] | undefined> }) {
    if (data.issues) {
      const messages = Object.values(data.issues)
        .flatMap((value) => (Array.isArray(value) ? value.flat() : []))
        .filter((value): value is string => typeof value === "string" && value.length > 0);

      if (messages.length > 0) return messages.join(" ");
    }

    return data.error ?? "Could not save products.";
  }

  async function deleteLibraryImage(imageUrl: string) {
    const usedBy = products.filter((product) => product.imageUrl === imageUrl).map((product) => product.name);
    if (usedBy.length > 0) {
      setError(`This image is used by: ${usedBy.join(", ")}. Change those products first.`);
      return;
    }

    const confirmed = window.confirm("Remove this image from the library? This cannot be undone.");
    if (!confirmed) return;

    clearStatus();
    setDeletingImageUrl(imageUrl);

    try {
      const res = await fetch("/api/admin/products/images", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Could not remove image.");
        return;
      }

      setLibraryImages(data.images ?? libraryImages.filter((image) => image.imageUrl !== imageUrl));
      setMessage("Image removed from the library.");
      router.refresh();
    } catch {
      setError("Could not remove image. Check your connection and try again.");
    } finally {
      setDeletingImageUrl(null);
    }
  }

  async function save() {
    clearStatus();

    if (products.length === 0) {
      const confirmed = window.confirm(
        "Save an empty catalogue? The public Products page will show no products until you add and save new ones."
      );
      if (!confirmed) return;
    }

    setSaving(true);
    setMessage("");
    setError("");

    const payload = {
      products: products.map((product, sortOrder) => ({
        name: product.name.trim(),
        subsidiary: product.subsidiary,
        description: product.description.trim(),
        sizes: product.sizes.map((item) => item.trim()).filter(Boolean),
        applications: product.applications.map((item) => item.trim()).filter(Boolean),
        imageUrl: product.imageUrl,
        badge: product.badge.trim() || "Available",
        priceLabel: product.priceLabel.trim() || "Request quote",
        promoLabel: product.promoLabel.trim(),
        active: product.active,
        sortOrder,
      })),
    };

    try {
      const res = await fetch("/api/admin/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(formatSaveError(data));
        return;
      }

      const saved = data.products ?? [];
      setProducts(saved);
      setLibraryImages((current) => {
        const fromSaved = saved
          .filter((product: ProductCatalogItem) =>
            product.imageUrl.startsWith("/uploads/product-images/") ||
            product.imageUrl.startsWith("/product-images/")
          )
          .map((product: ProductCatalogItem) => ({
            imageUrl: product.imageUrl,
            alt: product.name,
            defaultTitle: product.name,
          }));

        const merged = [...fromSaved, ...current];
        return merged.filter(
          (image, index, list) => list.findIndex((item) => item.imageUrl === image.imageUrl) === index
        );
      });
      setSelectedId(saved[0]?.id ?? "");
      setMessage(
        saved.length === 0
          ? "Catalogue cleared. The public Products page will stay empty until you add products."
          : "Product catalogue saved successfully."
      );
      router.refresh();
    } catch {
      setError("Could not save products. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {products.length === 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          No products are saved yet. Add products below, or import the sample catalogue, then click{" "}
          <strong>Save Catalogue</strong> to update the public Products page.
        </div>
      )}

      {message && (
        <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          <CheckCircle2 size={16} />
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <section className="rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">Catalogue Products</h2>
              <p className="mt-1 text-xs text-zinc-400">Add, reorder, hide, or edit public products.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={addProduct}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#2d4a6b] px-3 py-2 text-xs font-semibold text-white hover:bg-[#1a2f4a]"
              >
                <Plus size={14} /> Add
              </button>
              <button
                type="button"
                onClick={importSampleCatalogue}
                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
              >
                <Sparkles size={14} /> Import sample
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {products.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 py-8 text-center text-sm text-zinc-400">
                No products in the editor yet.
              </div>
            ) : (
              products.map((product, index) => (
              <button
                key={product.id}
                type="button"
                onClick={() => setSelectedId(product.id)}
                className={`w-full rounded-xl border p-3 text-left transition ${
                  product.id === selectedProduct?.id
                    ? "border-[#8fb9e8] bg-[#8fb9e8]/10"
                    : "border-zinc-200 hover:bg-zinc-50"
                }`}
              >
                <div className="flex gap-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
                    <Image src={product.imageUrl} alt={product.name} fill sizes="56px" className="object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-zinc-900">{product.name}</p>
                    <p className="mt-0.5 text-xs text-zinc-400">Position {index + 1} · {product.active ? "Visible" : "Hidden"}</p>
                    <p className="mt-1 truncate text-xs text-zinc-500">
                      {getSubsidiaryMeta(product.subsidiary)?.label ?? product.subsidiary}
                    </p>
                  </div>
                </div>
              </button>
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">Product Details</h2>
              <p className="mt-1 text-xs text-zinc-400">Edit the selected product information shown publicly.</p>
            </div>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-[#2d4a6b] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a2f4a] disabled:opacity-60"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              Save Catalogue
            </button>
          </div>

          {!selectedProduct ? (
            <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 py-12 text-center text-sm text-zinc-400">
              Add a product to start editing.
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => moveProduct(selectedProduct.id, -1)} className="rounded-lg border border-zinc-200 p-2 text-zinc-500">
                  <ArrowUp size={14} />
                </button>
                <button type="button" onClick={() => moveProduct(selectedProduct.id, 1)} className="rounded-lg border border-zinc-200 p-2 text-zinc-500">
                  <ArrowDown size={14} />
                </button>
                <button type="button" onClick={() => duplicateProduct(selectedProduct)} className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-600">
                  <Copy size={14} /> Duplicate
                </button>
                <button type="button" onClick={() => removeProduct(selectedProduct.id)} className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 px-3 py-2 text-xs font-medium text-blue-700">
                  <Trash2 size={14} /> Remove
                </button>
                <label className="ml-auto inline-flex items-center gap-2 text-sm font-medium text-zinc-600">
                  <input
                    type="checkbox"
                    checked={selectedProduct.active}
                    onChange={(event) => updateProduct(selectedProduct.id, { active: event.target.checked })}
                    className="h-4 w-4 rounded border-zinc-300"
                  />
                  Show publicly
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className={LABEL}>Product Name</label>
                  <input className={FIELD} value={selectedProduct.name} onChange={(event) => updateProduct(selectedProduct.id, { name: event.target.value })} />
                </div>
                <div>
                  <label className={LABEL}>Subsidiary</label>
                  <select
                    className={FIELD}
                    value={selectedProduct.subsidiary}
                    onChange={(event) =>
                      updateProduct(selectedProduct.id, {
                        subsidiary: event.target.value as ProductSubsidiary,
                      })
                    }
                  >
                    {subsidiaryOptions.map((subsidiary) => (
                      <option key={subsidiary.value} value={subsidiary.value}>
                        {subsidiary.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-zinc-400">
                    {getSubsidiaryMeta(selectedProduct.subsidiary)?.description}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className={LABEL}>Badge</label>
                  <input className={FIELD} value={selectedProduct.badge} onChange={(event) => updateProduct(selectedProduct.id, { badge: event.target.value })} />
                </div>
                <div>
                  <label className={LABEL}>Price Label</label>
                  <input className={FIELD} value={selectedProduct.priceLabel} onChange={(event) => updateProduct(selectedProduct.id, { priceLabel: event.target.value })} />
                </div>
                <div>
                  <label className={LABEL}>Promo Label</label>
                  <input className={FIELD} value={selectedProduct.promoLabel} onChange={(event) => updateProduct(selectedProduct.id, { promoLabel: event.target.value })} />
                </div>
              </div>

              <div>
                <label className={LABEL}>Description</label>
                <textarea className={`${FIELD} min-h-24 resize-y`} value={selectedProduct.description} onChange={(event) => updateProduct(selectedProduct.id, { description: event.target.value })} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className={LABEL}>Sizes / Package Options</label>
                  <textarea
                    className={`${FIELD} min-h-28 resize-y`}
                    value={joinList(selectedProduct.sizes)}
                    onChange={(event) => updateProduct(selectedProduct.id, { sizes: splitList(event.target.value) })}
                  />
                  <p className="mt-1 text-xs text-zinc-400">One item per line.</p>
                </div>
                <div>
                  <label className={LABEL}>Applications</label>
                  <textarea
                    className={`${FIELD} min-h-28 resize-y`}
                    value={joinList(selectedProduct.applications)}
                    onChange={(event) => updateProduct(selectedProduct.id, { applications: splitList(event.target.value) })}
                  />
                  <p className="mt-1 text-xs text-zinc-400">One item per line.</p>
                </div>
              </div>

              <div>
                <label className={LABEL}>Product Image</label>

                <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <div className="relative h-40 w-full overflow-hidden rounded-xl bg-zinc-100 sm:h-36 sm:w-36 sm:shrink-0">
                      <Image
                        src={selectedProduct.imageUrl}
                        alt={selectedProduct.name}
                        fill
                        sizes="160px"
                        className="object-cover"
                      />
                    </div>

                    <div className="flex-1 space-y-3">
                      <p className="text-sm text-zinc-600">
                        Upload a product photo (JPEG, PNG, WebP, or GIF, up to 15 MB), or choose from the library below.
                      </p>
                      <div className="flex flex-wrap items-center gap-3">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          className="hidden"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) void uploadProductImage(file);
                          }}
                        />
                        <button
                          type="button"
                          disabled={uploadingImage}
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 disabled:opacity-60"
                        >
                          {uploadingImage ? (
                            <Loader2 size={15} className="animate-spin" />
                          ) : (
                            <Upload size={15} />
                          )}
                          {uploadingImage ? "Uploading..." : "Upload Image"}
                        </button>
                        <p className="text-xs text-zinc-400">Current: {selectedProduct.imageUrl}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="mb-3 mt-4 text-xs font-semibold uppercase tracking-widest text-zinc-400">
                  Image Library
                </p>
                {imageOptions.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 py-8 text-center text-sm text-zinc-400">
                    No images in the library. Upload a product photo to get started.
                  </div>
                ) : (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {imageOptions.map((image) => {
                    const selected = image.imageUrl === selectedProduct.imageUrl;
                    const deleting = deletingImageUrl === image.imageUrl;
                    return (
                      <div
                        key={image.imageUrl}
                        className={`overflow-hidden rounded-xl border transition ${
                          selected ? "border-[#8fb9e8] ring-2 ring-[#8fb9e8]/20" : "border-zinc-200"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => updateProduct(selectedProduct.id, { imageUrl: image.imageUrl })}
                          className="block w-full text-left"
                        >
                          <div className="relative h-32 bg-zinc-100">
                            <Image src={image.imageUrl} alt={image.alt} fill sizes="240px" className="object-cover" />
                          </div>
                          <p className="p-3 text-xs font-semibold text-zinc-700">{image.defaultTitle}</p>
                        </button>
                        <div className="border-t border-zinc-100 px-3 py-2">
                          <button
                            type="button"
                            disabled={deleting}
                            onClick={() => void deleteLibraryImage(image.imageUrl)}
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 transition hover:text-red-700 disabled:opacity-50"
                          >
                            {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                            Remove from library
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
