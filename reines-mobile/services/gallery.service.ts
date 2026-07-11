import api from "@/lib/api";
import { authenticatedUpload } from "@/lib/authenticatedUpload";
import { API_BASE_URL } from "@/constants";
import type { GalleryResponse, ProjectUpdate } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UploadResult {
  url:          string;
  filename:     string;
  sizeBytes:    number;
  originalName: string;
}

export interface GalleryUpdatePayload {
  note:            string;
  imageUrl?:       string | null;
  progressPercent?: number | null;
}

export interface PostedUpdate {
  update: ProjectUpdate & { imageUrl: string | null };
}

// ─── Fetch gallery ────────────────────────────────────────────────────────────

export async function fetchGallery(projectId: string): Promise<GalleryResponse> {
  const { data } = await api.get<GalleryResponse>(
    `/api/mobile/projects/${projectId}/gallery`
  );
  return data;
}

// ─── Upload image ─────────────────────────────────────────────────────────────

/**
 * Uploads a local image file to the server and returns the public URL.
 *
 * Uses authenticatedUpload (XHR) so we can track upload progress via
 * the `onProgress` callback (0 → 100). On 401, refreshes the token and retries.
 *
 * The returned URL will pass isSafeUploadUrl() and can be sent directly
 * to postGalleryUpdate().
 */
export async function uploadGalleryImage(
  localUri: string,
  onProgress: (pct: number) => void
): Promise<UploadResult> {
  const filename = localUri.split("/").pop() ?? "photo.jpg";
  const match    = /\.(\w+)$/.exec(filename);
  const mimeType = match
    ? `image/${match[1].toLowerCase().replace("jpg", "jpeg")}`
    : "image/jpeg";

  const formData = new FormData();
  formData.append("file", {
    uri:  localUri,
    name: filename,
    type: mimeType,
  } as unknown as Blob);

  const { status, json } = await authenticatedUpload({
    url:        `${API_BASE_URL}/api/mobile/upload`,
    formData,
    onProgress,
  });

  if (status >= 200 && status < 300) {
    onProgress(100);
    return json as unknown as UploadResult;
  }

  throw new Error((json.error as string) ?? `Upload failed (${status})`);
}

// ─── Post gallery update ──────────────────────────────────────────────────────

/**
 * Creates a ProjectUpdate record on the server.
 * Call this after uploadGalleryImage() to attach the returned URL.
 */
export async function postGalleryUpdate(
  projectId: string,
  payload:   GalleryUpdatePayload
): Promise<PostedUpdate> {
  const { data } = await api.post<PostedUpdate>(
    `/api/mobile/projects/${projectId}/gallery`,
    payload
  );
  return data;
}
