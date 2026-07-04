import type { ProjectUpdate } from "@/models/project";

export interface GalleryBatch {
  batchId:         string;
  createdAt:       string;
  progressPercent: number | null;
  items:           ProjectUpdate[];
}

/** Group flat update rows into one card per batch upload (or singleton). */
export function groupGalleryUpdates(updates: ProjectUpdate[]): GalleryBatch[] {
  const map = new Map<string, ProjectUpdate[]>();

  for (const update of updates) {
    const key = update.batchId ?? update.id;
    const list = map.get(key) ?? [];
    list.push(update);
    map.set(key, list);
  }

  return Array.from(map.entries())
    .map(([batchId, items]) => {
      const sorted = [...items].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      const progress = sorted.find((i) => i.progressPercent != null)?.progressPercent ?? null;
      return {
        batchId,
        createdAt: sorted[0].createdAt,
        progressPercent: progress,
        items: sorted,
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function batchItemIds(batch: GalleryBatch): string[] {
  return batch.items.map((i) => i.id);
}
