"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { ArrowDown, ArrowUp, CheckCircle2, Loader2, Save, Trash2, Upload as UploadIcon } from "lucide-react";
import type { AvailableHomepageImage, HomepageAd } from "@/lib/homepage-ads";
import { resolveStorageUrl } from "@/lib/storage";

function mediaSrc(url: string) {
  return resolveStorageUrl(url) ?? url;
}

type Props = {
  initialLibraryImages: AvailableHomepageImage[];
  initialAds: HomepageAd[];
  usingFallback: boolean;
};

const FIELD = "block w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-100";
const LABEL = "mb-1.5 block text-xs font-semibold uppercase tracking-widest text-zinc-400";

function buildDefaultAd(image: AvailableHomepageImage, sortOrder: number): HomepageAd {
  return {
    id: `draft-${image.imageUrl}`,
    imageUrl: image.imageUrl,
    title: image.defaultTitle,
    subtitle: image.defaultSubtitle,
    ctaLabel: "View Projects",
    ctaHref: "/projects",
    sortOrder,
    active: true,
  };
}

function titleFromFilename(name: string): string {
  return name
    .replace(/\.[^.]+$/, "")
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function HomepageAdsForm({ initialLibraryImages, initialAds, usingFallback }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialSelected = initialAds
    .filter((ad) => ad.active)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .slice(0, 3);

  const [ads, setAds] = useState<HomepageAd[]>(initialSelected);
  const [libraryImages, setLibraryImages] = useState<AvailableHomepageImage[]>(initialLibraryImages);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [deletingImageUrl, setDeletingImageUrl] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedUrls = useMemo(() => new Set(ads.map((ad) => ad.imageUrl)), [ads]);

  function clearStatus() {
    setMessage("");
    setError("");
  }

  function toggleImage(image: AvailableHomepageImage) {
    clearStatus();

    if (selectedUrls.has(image.imageUrl)) {
      setAds((current) => current.filter((ad) => ad.imageUrl !== image.imageUrl));
      return;
    }

    if (ads.length >= 3) {
      setError("Select up to three homepage images.");
      return;
    }

    setAds((current) => [...current, buildDefaultAd(image, current.length)]);
  }

  function updateAd(imageUrl: string, key: keyof HomepageAd, value: string) {
    clearStatus();
    setAds((current) =>
      current.map((ad) => (ad.imageUrl === imageUrl ? { ...ad, [key]: value } : ad))
    );
  }

  function moveAd(imageUrl: string, direction: -1 | 1) {
    setAds((current) => {
      const index = current.findIndex((ad) => ad.imageUrl === imageUrl);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.length) return current;

      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((ad, sortOrder) => ({ ...ad, sortOrder }));
    });
  }

  async function uploadHomepageImage(file: File) {
    clearStatus();
    setUploadingImage(true);

    try {
      const blob = await upload(
        `uploads/homepage-ads/${file.name}`,
        file,
        { access: "private", handleUploadUrl: "/api/upload/client" },
      );

      const uploaded: AvailableHomepageImage = {
        imageUrl: blob.url,
        alt: titleFromFilename(file.name),
        defaultTitle: titleFromFilename(file.name),
        defaultSubtitle: "Add a subtitle for this homepage ad after selecting it.",
      };

      setLibraryImages((current) => {
        if (current.some((image) => image.imageUrl === uploaded.imageUrl)) return current;
        return [uploaded, ...current];
      });
      setMessage("Homepage image uploaded. Select it below, then save your selection.");
    } catch {
      setError("Could not upload image. Check your connection and try again.");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function deleteLibraryImage(imageUrl: string) {
    const selectedLocally = ads.some((ad) => ad.imageUrl === imageUrl);
    if (selectedLocally) {
      setError("Deselect this image from your homepage ads before removing it from the library.");
      return;
    }

    const confirmed = window.confirm("Remove this image from the library? This cannot be undone.");
    if (!confirmed) return;

    clearStatus();
    setDeletingImageUrl(imageUrl);

    try {
      const res = await fetch("/api/admin/homepage-ads/images", {
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
    if (ads.length === 0) {
      setError("Select at least one homepage image.");
      return;
    }

    setSaving(true);
    clearStatus();

    const payload = {
      ads: ads.map((ad, sortOrder) => ({
        imageUrl: ad.imageUrl,
        title: ad.title.trim(),
        subtitle: ad.subtitle.trim(),
        ctaLabel: ad.ctaLabel.trim() || "View Projects",
        ctaHref: ad.ctaHref.trim() || "/projects",
        active: true,
        sortOrder,
      })),
    };

    try {
      const res = await fetch("/api/admin/homepage-ads", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Could not save homepage ads.");
        return;
      }

      setAds(data.selectedAds ?? ads);
      setMessage("Homepage ads saved successfully.");
      router.refresh();
    } catch {
      setError("Could not save homepage ads. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {usingFallback && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          Showing default homepage images until the saved admin selection is available.
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

      <section className="rounded-2xl border border-zinc-200 bg-white p-5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">Homepage Image Library</h2>
            <p className="mt-1 text-xs text-zinc-400">
              Upload images, select up to three for the homepage carousel, or remove images you no longer need.
            </p>
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void uploadHomepageImage(file);
              }}
            />
            <button
              type="button"
              disabled={uploadingImage}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 disabled:opacity-60"
            >
              {uploadingImage ? <Loader2 size={15} className="animate-spin" /> : <UploadIcon size={15} />}
              {uploadingImage ? "Uploading..." : "Upload Image"}
            </button>
          </div>
        </div>

        {libraryImages.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 py-10 text-center text-sm text-zinc-400">
            No images in the library. Upload a homepage ad image to get started.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {libraryImages.map((image) => {
              const selected = selectedUrls.has(image.imageUrl);
              const deleting = deletingImageUrl === image.imageUrl;
              return (
                <div
                  key={image.imageUrl}
                  className={`overflow-hidden rounded-2xl border transition ${
                    selected ? "border-[#8fb9e8] ring-2 ring-[#8fb9e8]/20" : "border-zinc-200"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleImage(image)}
                    className="group block w-full text-left"
                  >
                    <div className="relative h-44 bg-zinc-100">
                      <Image
                        src={mediaSrc(image.imageUrl)}
                        alt={image.alt}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                      <span
                        className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          selected ? "bg-[#8fb9e8] text-[#2d4a6b]" : "bg-black/50 text-white"
                        }`}
                      >
                        {selected ? "Selected" : "Select"}
                      </span>
                    </div>
                    <div className="p-4">
                      <p className="text-sm font-semibold text-[#2d4a6b]">{image.defaultTitle}</p>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-500">
                        {image.defaultSubtitle}
                      </p>
                    </div>
                  </button>
                  <div className="border-t border-zinc-100 px-4 py-2.5">
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
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">Selected Ad Copy</h2>
            <p className="mt-1 text-xs text-zinc-400">Edit the copy and order shown on the homepage.</p>
          </div>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-[#2d4a6b] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a2f4a] disabled:opacity-60"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            Save Selection
          </button>
        </div>

        {ads.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 py-10 text-center text-sm text-zinc-400">
            No images selected yet.
          </div>
        ) : (
          <div className="space-y-4">
            {ads.map((ad, index) => (
              <div key={ad.imageUrl} className="grid gap-4 rounded-xl border border-zinc-100 bg-zinc-50/60 p-4 lg:grid-cols-[180px_1fr]">
                <div className="relative h-36 overflow-hidden rounded-xl bg-zinc-100">
                  <Image src={mediaSrc(ad.imageUrl)} alt={ad.title} fill sizes="180px" className="object-cover" />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full bg-[#8fb9e8]/10 px-3 py-1 text-xs font-semibold text-[#8fb9e8]">
                      Position {index + 1}
                    </span>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => moveAd(ad.imageUrl, -1)} disabled={index === 0} className="rounded-lg border border-zinc-200 p-2 text-zinc-500 disabled:opacity-30">
                        <ArrowUp size={14} />
                      </button>
                      <button type="button" onClick={() => moveAd(ad.imageUrl, 1)} disabled={index === ads.length - 1} className="rounded-lg border border-zinc-200 p-2 text-zinc-500 disabled:opacity-30">
                        <ArrowDown size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <label className={LABEL}>Title</label>
                      <input className={FIELD} value={ad.title} onChange={(e) => updateAd(ad.imageUrl, "title", e.target.value)} />
                    </div>
                    <div>
                      <label className={LABEL}>CTA Link</label>
                      <input className={FIELD} value={ad.ctaHref} onChange={(e) => updateAd(ad.imageUrl, "ctaHref", e.target.value)} />
                    </div>
                  </div>

                  <div>
                    <label className={LABEL}>Subtitle</label>
                    <textarea className={`${FIELD} min-h-20 resize-y`} value={ad.subtitle} onChange={(e) => updateAd(ad.imageUrl, "subtitle", e.target.value)} />
                  </div>

                  <div>
                    <label className={LABEL}>CTA Label</label>
                    <input className={FIELD} value={ad.ctaLabel} onChange={(e) => updateAd(ad.imageUrl, "ctaLabel", e.target.value)} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
