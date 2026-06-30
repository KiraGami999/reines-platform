import api from "@/lib/api";
import { getToken } from "@/lib/storage";
import { API_BASE_URL } from "@/constants";
import type { GalleryResponse, GalleryImage, ProjectUpdate } from "@/types";

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
 * Uses XMLHttpRequest directly so we can track upload progress via
 * the `onProgress` callback (0 → 100).
 *
 * The returned URL will pass isSafeUploadUrl() and can be sent directly
 * to postGalleryUpdate().
 */
export function uploadGalleryImage(
  localUri: string,
  onProgress: (pct: number) => void
): Promise<UploadResult> {
  return new Promise(async (resolve, reject) => {
    const token = await getToken();
    if (!token) { reject(new Error("Not authenticated.")); return; }

    const filename = localUri.split("/").pop() ?? "photo.jpg";
    const match    = /\.(\w+)$/.exec(filename);
    const mimeType = match ? `image/${match[1].toLowerCase().replace("jpg", "jpeg")}` : "image/jpeg";

    const formData = new FormData();
    // React Native FormData accepts { uri, name, type } as a file blob substitute
    formData.append("file", {
      uri:  localUri,
      name: filename,
      type: mimeType,
    } as unknown as Blob);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE_URL}/api/mobile/upload`);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      try {
        const json = JSON.parse(xhr.responseText) as Record<string, unknown>;
        if (xhr.status >= 200 && xhr.status < 300) {
          onProgress(100);
          resolve(json as unknown as UploadResult);
        } else {
          reject(new Error((json.error as string) ?? `Upload failed (${xhr.status})`));
        }
      } catch {
        reject(new Error("Invalid response from server."));
      }
    };

    xhr.onerror  = () => reject(new Error("Network error during upload."));
    xhr.ontimeout= () => reject(new Error("Upload timed out."));
    xhr.timeout  = 60_000;

    xhr.send(formData);
  });
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
