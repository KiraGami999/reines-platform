import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { uploadGalleryImage, postGalleryUpdate } from "@/services/gallery.service";
import { PROJECT_KEYS } from "@/hooks/useProjects";
import { toProxiedMediaPath } from "@/lib/media";
import type { GalleryResponse, GalleryImage, ProjectUpdate } from "@/types";

// ─── Upload state machine ──────────────────────────────────────────────────────

export type UploadStage =
  | "idle"
  | "uploading"   // image bytes being transferred (0-100%)
  | "saving"      // POST to gallery endpoint
  | "success"
  | "error";

export interface UploadState {
  stage:        UploadStage;
  uploadPct:    number;        // 0-100 during "uploading" stage
  errorMessage: string | null;
}

export interface GalleryUploadOptions {
  projectId:       string;
  note:            string;
  localImageUri:   string | null;
  progressPercent: number | null;
}

const INITIAL_STATE: UploadState = {
  stage:        "idle",
  uploadPct:    0,
  errorMessage: null,
};

// ─── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Manages the full gallery upload flow:
 *  1. Upload image → XHR with progress tracking (phase 0-100%)
 *  2. POST gallery update → creates the DB record
 *
 * Optimistic UI:
 *  When a text-only update (no image) is posted, it is inserted into the
 *  cached GalleryResponse immediately so the UI updates without waiting.
 *  Image uploads show a preview in the GalleryUploadSheet itself; the cache
 *  stores a *proxied* /api/media URL (never the raw private blob URL).
 */
export function useGalleryUpload() {
  const qc                          = useQueryClient();
  const [state, setState]           = useState<UploadState>(INITIAL_STATE);

  const reset = useCallback(() => setState(INITIAL_STATE), []);

  const upload = useCallback(async (opts: GalleryUploadOptions): Promise<boolean> => {
    const { projectId, note, localImageUri, progressPercent } = opts;

    setState({ stage: "uploading", uploadPct: 0, errorMessage: null });

    try {
      let imageUrl: string | null = null;

      if (localImageUri) {
        // ── Phase 1: upload image bytes (progress 0-100) ──────────────────
        const result = await uploadGalleryImage(localImageUri, (pct) => {
          setState((s) => ({ ...s, uploadPct: pct }));
        });
        imageUrl = result.url;
      }

      // ── Phase 2: persist the gallery update ──────────────────────────────
      setState({ stage: "saving", uploadPct: 100, errorMessage: null });

      const { update } = await postGalleryUpdate(projectId, {
        note,
        imageUrl,
        progressPercent,
      });

      // Blob store URLs must be viewed via /api/media — never feed the raw
      // private URL into the gallery cache (native Image can't read it).
      const viewableImageUrl = imageUrl ? toProxiedMediaPath(imageUrl) : null;

      // ── Optimistic insert into gallery cache ──────────────────────────────
      const key = PROJECT_KEYS.gallery(projectId);
      qc.setQueryData<GalleryResponse>(key, (old) => {
        if (!old) return old;
        if (viewableImageUrl) {
          const newItem: GalleryImage = {
            id:              update.id,
            imageUrl:        viewableImageUrl,
            note:            update.note,
            progressPercent: update.progressPercent,
            documentUrl:     null,
            documentName:    null,
            documentType:    null,
            projectId:       update.projectId,
            createdAt:       update.createdAt,
          };
          return {
            ...old,
            withImages: [newItem, ...old.withImages],
            totalCount: old.totalCount + 1,
          };
        }

        const newItem: ProjectUpdate = {
          id:              update.id,
          note:            update.note,
          imageUrl:        null,
          documentUrl:     null,
          documentName:    null,
          documentType:    null,
          progressPercent: update.progressPercent,
          createdAt:       update.createdAt,
          projectId:       update.projectId,
        };
        return {
          ...old,
          textOnly:   [newItem, ...old.textOnly],
          totalCount: old.totalCount + 1,
        };
      });

      // Also invalidate manager dashboard so recent-activity feed refreshes
      qc.invalidateQueries({ queryKey: ["manager-dashboard"] });

      setState({ stage: "success", uploadPct: 100, errorMessage: null });
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed. Please try again.";
      setState({ stage: "error", uploadPct: 0, errorMessage: msg });
      return false;
    }
  }, [qc]);

  return { state, upload, reset };
}
