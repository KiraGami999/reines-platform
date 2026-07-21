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
  type PublicServiceItem,
} from "@/lib/public-services-data";
import {
  SERVICE_ICON_OPTIONS,
  getServiceIcon,
  type ServiceIconKey,
} from "@/lib/service-icons";

type Props = {
  initialServices: PublicServiceItem[];
  usingFallback: boolean;
};

const FIELD =
  "block w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-100";
const LABEL = "mb-1.5 block text-xs font-semibold uppercase tracking-widest text-zinc-400";

function joinList(items: string[]) {
  return items.join("\n");
}

function splitList(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildBlankService(sortOrder: number): PublicServiceItem {
  return {
    id: `draft-${Date.now()}`,
    title: "New Service",
    tagline: "Add a short service tagline",
    description: "Add a public-facing service description before saving.",
    features: ["Included feature one", "Included feature two"],
    iconKey: "Building2",
    active: true,
    sortOrder,
  };
}

export default function PublicServicesForm({ initialServices, usingFallback }: Props) {
  const [services, setServices] = useState<PublicServiceItem[]>(
    initialServices.map((service, sortOrder) => ({ ...service, sortOrder }))
  );
  const [selectedId, setSelectedId] = useState(initialServices[0]?.id ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedService = useMemo(
    () => services.find((service) => service.id === selectedId) ?? services[0],
    [services, selectedId]
  );

  function clearStatus() {
    setMessage("");
    setError("");
  }

  function updateService(id: string, patch: Partial<PublicServiceItem>) {
    clearStatus();
    setServices((current) =>
      current.map((service) => (service.id === id ? { ...service, ...patch } : service))
    );
  }

  function addService() {
    clearStatus();
    const service = buildBlankService(services.length);
    setServices((current) => [...current, service]);
    setSelectedId(service.id);
  }

  function duplicateService(service: PublicServiceItem) {
    clearStatus();
    const copy = {
      ...service,
      id: `draft-copy-${Date.now()}`,
      title: `${service.title} Copy`,
      sortOrder: services.length,
    };
    setServices((current) => [...current, copy]);
    setSelectedId(copy.id);
  }

  function removeService(id: string) {
    clearStatus();
    setServices((current) => {
      const next = current
        .filter((service) => service.id !== id)
        .map((service, sortOrder) => ({ ...service, sortOrder }));
      if (selectedId === id) setSelectedId(next[0]?.id ?? "");
      return next;
    });
  }

  function moveService(id: string, direction: -1 | 1) {
    clearStatus();
    setServices((current) => {
      const index = current.findIndex((service) => service.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.length) return current;

      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((service, sortOrder) => ({ ...service, sortOrder }));
    });
  }

  async function save() {
    if (services.length === 0) {
      setError("Add at least one service before saving.");
      return;
    }

    setSaving(true);
    setMessage("");
    setError("");

    const payload = {
      services: services.map((service, sortOrder) => ({
        title: service.title.trim(),
        tagline: service.tagline.trim(),
        description: service.description.trim(),
        features: service.features.map((item) => item.trim()).filter(Boolean),
        iconKey: service.iconKey,
        active: service.active,
        sortOrder,
      })),
    };

    try {
      const res = await fetch("/api/admin/public-services", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Could not save services.");
        return;
      }

      const saved = data.services ?? services;
      setServices(saved);
      setSelectedId(saved[0]?.id ?? "");
      setMessage("Public services saved successfully.");
    } catch {
      setError("Could not save services. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {usingFallback && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          Showing default services until the saved admin catalogue is available.
        </div>
      )}

      {message && (
        <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          <CheckCircle2 size={16} />
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <section className="rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">Public Services</h2>
              <p className="mt-1 text-xs text-zinc-400">Add, reorder, hide, or edit services.</p>
            </div>
            <button
              type="button"
              onClick={addService}
              className="inline-flex items-center gap-1.5  px-3 py-2 text-xs font-semibold text-white hover:bg-[#1a2f4a]"
            >
              <Plus size={14} /> Add
            </button>
          </div>

          <div className="space-y-2">
            {services.map((service, index) => {
              const Icon = getServiceIcon(service.iconKey);
              return (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => setSelectedId(service.id)}
                  className={`w-full rounded-xl border p-3 text-left transition ${
                    service.id === selectedService?.id
                      ? "border-[#8fb9e8] bg-[#8fb9e8]/10"
                      : "border-zinc-200 hover:bg-zinc-50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center /10 text-[#2d4a6b]">
                      <Icon size={18} strokeWidth={1.8} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-zinc-900">{service.title}</p>
                      <p className="mt-0.5 text-xs text-zinc-400">
                        Position {index + 1} · {service.active ? "Visible" : "Hidden"}
                      </p>
                      <p className="mt-1 truncate text-xs text-zinc-500">{service.tagline}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">Service Details</h2>
              <p className="mt-1 text-xs text-zinc-400">Edit the selected service shown on the public Services page.</p>
            </div>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="[#2d4a6b] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a2f4a] disabled:opacity-60"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              Save Services
            </button>
          </div>

          {!selectedService ? (
            <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 py-12 text-center text-sm text-zinc-400">
              Add a service to start editing.
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => moveService(selectedService.id, -1)}
                  className="rounded-lg border border-zinc-200 p-2 text-zinc-500"
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => moveService(selectedService.id, 1)}
                  className="rounded-lg border border-zinc-200 p-2 text-zinc-500"
                >
                  <ArrowDown size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => duplicateService(selectedService)}
                  className="inline- border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-600"
                >
                  <Copy size={14} /> Duplicate
                </button>
                <button
                  type="button"
                  onClick={() => removeService(selectedService.id)}
                  className="inline- border-blue-200 px-3 py-2 text-xs font-medium text-blue-700"
                >
                  <Trash2 size={14} /> Remove
                </button>
                <label className="ml-auto inline-flex items-center gap-2 text-sm font-medium text-zinc-600">
                  <input
                    type="checkbox"
                    checked={selectedService.active}
                    onChange={(event) =>
                      updateService(selectedService.id, { active: event.target.checked })
                    }
                    className="h-4 w-4 rounded border-zinc-300"
                  />
                  {selectedService.active ? (
                    <>
                      <Eye size={14} /> Show publicly
                    </>
                  ) : (
                    <>
                      <EyeOff size={14} /> Hidden
                    </>
                  )}
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className={LABEL}>Service Title</label>
                  <input
                    className={FIELD}
                    value={selectedService.title}
                    onChange={(event) =>
                      updateService(selectedService.id, { title: event.target.value })
                    }
                  />
                </div>
                <div>
                  <label className={LABEL}>Icon</label>
                  <select
                    className={FIELD}
                    value={selectedService.iconKey}
                    onChange={(event) =>
                      updateService(selectedService.id, {
                        iconKey: event.target.value as ServiceIconKey,
                      })
                    }
                  >
                    {SERVICE_ICON_OPTIONS.map((icon) => (
                      <option key={icon.value} value={icon.value}>
                        {icon.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className={LABEL}>Tagline</label>
                <input
                  className={FIELD}
                  value={selectedService.tagline}
                  onChange={(event) =>
                    updateService(selectedService.id, { tagline: event.target.value })
                  }
                />
              </div>

              <div>
                <label className={LABEL}>Description</label>
                <textarea
                  className={`${FIELD} min-h-28 resize-y`}
                  value={selectedService.description}
                  onChange={(event) =>
                    updateService(selectedService.id, { description: event.target.value })
                  }
                />
              </div>

              <div>
                <label className={LABEL}>Included Features</label>
                <textarea
                  className={`${FIELD} min-h-32 resize-y`}
                  value={joinList(selectedService.features)}
                  onChange={(event) =>
                    updateService(selectedService.id, { features: splitList(event.target.value) })
                  }
                />
                <p className="mt-1 text-xs text-zinc-400">One feature per line.</p>
              </div>

              <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Preview</p>
                <div className="mt-3 flex items-start gap-3">
                  {(() => {
                    const Icon = getServiceIcon(selectedService.iconKey);
                    return (
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500">
                        <Icon size={22} strokeWidth={1.8} />
                      </div>
                    );
                  })()}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-[#8fb9e8]">
                      {selectedService.tagline}
                    </p>
                    <p className="mt-1 text-lg font-bold text-[#2d4a6b]">{selectedService.title}</p>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                      {selectedService.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
