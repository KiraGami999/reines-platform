"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Building,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Moon,
  Plus,
  Save,
  Sun,
  Trash2,
  Upload as UploadIcon,
} from "lucide-react";
import type { ClientLogoItem, ClientLogosSettings } from "@/lib/client-logos-data";
import { resolveStorageUrl } from "@/lib/storage";

type Props = {
  initialSettings: ClientLogosSettings;
  initialLogos: ClientLogoItem[];
  usingFallback: boolean;
};

const FIELD =
  "block w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-100";
const LABEL = "mb-1.5 block text-xs font-semibold uppercase tracking-widest text-zinc-400";

function mediaSrc(url: string) {
  return resolveStorageUrl(url) ?? url;
}

function buildBlankLogo(sortOrder: number): ClientLogoItem {
  return {
    id: `draft-logo-${Date.now()}`,
    name: "New Client",
    lightLogoUrl: "",
    darkLogoUrl: "",
    websiteUrl: "",
    sortOrder,
  };
}

export default function ClientLogosForm({ initialSettings, initialLogos, usingFallback }: Props) {
  const [settings, setSettings] = useState<ClientLogosSettings>(initialSettings);
  const [logos, setLogos] = useState<ClientLogoItem[]>(initialLogos.map((l, sortOrder) => ({ ...l, sortOrder })));
  const [selectedId, setSelectedId] = useState(initialLogos[0]?.id ?? "");
  const [saving, setSaving] = useState(false);
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const lightInputRef = useRef<HTMLInputElement>(null);
  const darkInputRef = useRef<HTMLInputElement>(null);

  const selected = logos.find((l) => l.id === selectedId) ?? logos[0];

  function clearStatus() {
    setMessage("");
    setError("");
  }

  function updateSettings(patch: Partial<ClientLogosSettings>) {
    clearStatus();
    setSettings((current) => ({ ...current, ...patch }));
  }

  function updateLogo(id: string, patch: Partial<ClientLogoItem>) {
    clearStatus();
    setLogos((current) => current.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }

  function addLogo() {
    clearStatus();
    const l = buildBlankLogo(logos.length);
    setLogos((current) => [...current, l]);
    setSelectedId(l.id);
  }

  function removeLogo(id: string) {
    clearStatus();
    setLogos((current) => {
      const next = current.filter((l) => l.id !== id).map((l, sortOrder) => ({ ...l, sortOrder }));
      if (selectedId === id) setSelectedId(next[0]?.id ?? "");
      return next;
    });
  }

  function moveLogo(id: string, direction: -1 | 1) {
    clearStatus();
    setLogos((current) => {
      const index = current.findIndex((l) => l.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((l, sortOrder) => ({ ...l, sortOrder }));
    });
  }

  async function uploadLogoImage(id: string, slot: "lightLogoUrl" | "darkLogoUrl", file: File) {
    clearStatus();
    setUploadingSlot(`${id}:${slot}`);

    try {
      const blob = await upload(`uploads/client-logos/${file.name}`, file, {
        access: "private",
        handleUploadUrl: "/api/upload/client",
      });
      updateLogo(id, { [slot]: blob.url } as Partial<ClientLogoItem>);
      setMessage("Logo uploaded. Save to publish it.");
    } catch {
      setError("Could not upload logo. Check your connection and try again.");
    } finally {
      setUploadingSlot(null);
      if (lightInputRef.current) lightInputRef.current.value = "";
      if (darkInputRef.current) darkInputRef.current.value = "";
    }
  }

  async function save() {
    // Drafts without an uploaded light-mode logo aren't ready to publish yet —
    // skip them instead of blocking the whole save (which would also block an
    // unrelated visibility toggle change from ever reaching the database).
    const readyLogos = logos.filter((l) => l.lightLogoUrl);
    const skippedCount = logos.length - readyLogos.length;

    setSaving(true);
    setMessage("");
    setError("");

    const payload = {
      settings,
      logos: readyLogos.map((l, sortOrder) => ({
        name: l.name.trim() || "Client",
        lightLogoUrl: l.lightLogoUrl,
        darkLogoUrl: l.darkLogoUrl,
        websiteUrl: l.websiteUrl.trim(),
        sortOrder,
      })),
    };

    try {
      const res = await fetch("/api/admin/client-logos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Could not save client logos.");
        return;
      }

      // Keep any still-incomplete drafts around locally (they never round-tripped
      // to the server, so they wouldn't be in the response) alongside the
      // now-canonical saved logos.
      const incompleteDrafts = logos.filter((l) => !l.lightLogoUrl);
      const savedLogos: ClientLogoItem[] = data.logos ?? readyLogos;
      const nextLogos = [...savedLogos, ...incompleteDrafts];

      setSettings(data.settings ?? settings);
      setLogos(nextLogos);
      setSelectedId((selected && nextLogos.some((l) => l.id === selected.id)) ? selected.id : nextLogos[0]?.id ?? "");
      setMessage(
        skippedCount > 0
          ? `Saved. ${skippedCount} client${skippedCount > 1 ? "s" : ""} skipped — upload a light-mode logo for ${skippedCount > 1 ? "them" : "it"} first.`
          : "Client logos saved successfully."
      );
    } catch {
      setError("Could not save client logos. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {usingFallback && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          No client logos saved yet — the section stays hidden on the homepage until you add and save some.
        </div>
      )}

      {message && (
        <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          <CheckCircle2 size={16} />
          {message}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Sticky-ish header with the master save action */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">Clients We&apos;ve Worked With</h2>
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
          Save Client Logos
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
                  ? "The \u201cClients We\u2019ve Worked With\u201d section is live on the homepage."
                  : "The client logos section is hidden from the public homepage."}
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

      {/* Logos — list + detail editor */}
      <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">Clients</h2>
              <p className="mt-1 text-xs text-zinc-400">Shown in this order on the homepage.</p>
            </div>
            <button
              type="button"
              onClick={addLogo}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#2d4a6b] px-3 py-2 text-xs font-semibold text-white hover:bg-[#1a2f4a]"
            >
              <Plus size={14} /> Add
            </button>
          </div>

          <div className="space-y-2">
            {logos.map((l, index) => (
              <button
                key={l.id}
                type="button"
                onClick={() => setSelectedId(l.id)}
                className={`w-full rounded-xl border p-3 text-left transition ${
                  l.id === selected?.id ? "border-[#8fb9e8] bg-[#8fb9e8]/10" : "border-zinc-200 hover:bg-zinc-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100">
                    {l.lightLogoUrl ? (
                      <div className="relative h-7 w-7">
                        <Image src={mediaSrc(l.lightLogoUrl)} alt={l.name} fill unoptimized className="object-contain" />
                      </div>
                    ) : (
                      <Building size={16} className="text-zinc-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-zinc-900">{l.name}</p>
                    {l.lightLogoUrl ? (
                      <p className="mt-0.5 text-xs text-zinc-400">Position {index + 1}</p>
                    ) : (
                      <p className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-amber-600">
                        <AlertCircle size={11} /> Needs a logo — won&apos;t be saved yet
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}

            {logos.length === 0 && (
              <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 py-10 text-center text-sm text-zinc-400">
                Add a client to get started.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">Client Details</h2>
              <p className="mt-1 text-xs text-zinc-400">Edit the selected client.</p>
            </div>
          </div>

          {!selected ? (
            <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 py-12 text-center text-sm text-zinc-400">
              Add a client to start editing.
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => moveLogo(selected.id, -1)} className="rounded-lg border border-zinc-200 p-2 text-zinc-500">
                  <ArrowUp size={14} />
                </button>
                <button type="button" onClick={() => moveLogo(selected.id, 1)} className="rounded-lg border border-zinc-200 p-2 text-zinc-500">
                  <ArrowDown size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => removeLogo(selected.id)}
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
                    value={selected.name}
                    onChange={(e) => updateLogo(selected.id, { name: e.target.value })}
                    placeholder="Knight Frank Malawi"
                  />
                </div>
                <div>
                  <label className={LABEL}>Website (optional)</label>
                  <input
                    className={FIELD}
                    value={selected.websiteUrl}
                    onChange={(e) => updateLogo(selected.id, { websiteUrl: e.target.value })}
                    placeholder="https://knightfrank.co.mw"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {/* Light-mode logo */}
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                  <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-zinc-500">
                    <Sun size={13} /> Light Mode Logo
                  </div>
                  <div className="flex h-24 items-center justify-center rounded-lg bg-white">
                    {selected.lightLogoUrl ? (
                      <div className="relative h-16 w-full">
                        <Image src={mediaSrc(selected.lightLogoUrl)} alt={`${selected.name} light logo`} fill unoptimized className="object-contain" />
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-400">No logo uploaded</span>
                    )}
                  </div>
                  <input
                    ref={lightInputRef}
                    type="file"
                    accept="image/png,image/webp,image/jpeg,image/gif"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void uploadLogoImage(selected.id, "lightLogoUrl", file);
                    }}
                  />
                  <button
                    type="button"
                    disabled={uploadingSlot === `${selected.id}:lightLogoUrl`}
                    onClick={() => lightInputRef.current?.click()}
                    className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 transition hover:border-zinc-300 disabled:opacity-60"
                  >
                    {uploadingSlot === `${selected.id}:lightLogoUrl` ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <UploadIcon size={13} />
                    )}
                    {selected.lightLogoUrl ? "Replace" : "Upload"}
                  </button>
                  <p className="mt-2 text-xs text-zinc-400">Shown on the white/light homepage background.</p>
                </div>

                {/* Dark-mode logo */}
                <div className="rounded-xl border border-zinc-200 bg-zinc-800 p-4">
                  <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-zinc-400">
                    <Moon size={13} /> Dark Mode Logo
                  </div>
                  <div className="flex h-24 items-center justify-center rounded-lg bg-zinc-900">
                    {selected.darkLogoUrl ? (
                      <div className="relative h-16 w-full">
                        <Image src={mediaSrc(selected.darkLogoUrl)} alt={`${selected.name} dark logo`} fill unoptimized className="object-contain" />
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-500">Falls back to light logo</span>
                    )}
                  </div>
                  <input
                    ref={darkInputRef}
                    type="file"
                    accept="image/png,image/webp,image/jpeg,image/gif"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void uploadLogoImage(selected.id, "darkLogoUrl", file);
                    }}
                  />
                  <button
                    type="button"
                    disabled={uploadingSlot === `${selected.id}:darkLogoUrl`}
                    onClick={() => darkInputRef.current?.click()}
                    className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-200 transition hover:border-zinc-600 disabled:opacity-60"
                  >
                    {uploadingSlot === `${selected.id}:darkLogoUrl` ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <UploadIcon size={13} />
                    )}
                    {selected.darkLogoUrl ? "Replace" : "Upload"}
                  </button>
                  <p className="mt-2 text-xs text-zinc-400">Optional — for the dark theme. Use a white/light-colored version of the logo.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
