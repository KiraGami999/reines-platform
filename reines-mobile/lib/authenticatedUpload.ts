import { getToken } from "@/lib/storage";
import { refreshAccessToken } from "@/lib/api";

export interface AuthenticatedUploadOptions {
  /** Absolute URL to POST to */
  url: string;
  formData: FormData;
  /** Optional upload progress 0–100 */
  onProgress?: (pct: number) => void;
  /** Request timeout in ms (default 60s) */
  timeoutMs?: number;
}

export interface AuthenticatedUploadResult {
  status: number;
  json:   Record<string, unknown>;
}

/**
 * POSTs multipart FormData with a Bearer token.
 * On 401: refreshes the access token once and retries.
 * Shares refreshAccessToken() with the Axios interceptor so concurrent
 * refreshes are queued and AuthProvider stays in sync.
 */
export async function authenticatedUpload(
  options: AuthenticatedUploadOptions
): Promise<AuthenticatedUploadResult> {
  const result = await runUpload(options, await requireToken());

  if (result.status !== 401) {
    return result;
  }

  // Token expired mid-upload — refresh and retry once
  const newToken = await refreshAccessToken();
  return runUpload(options, newToken);
}

async function requireToken(): Promise<string> {
  const token = await getToken();
  if (!token) throw new Error("Not authenticated.");
  return token;
}

function runUpload(
  options: AuthenticatedUploadOptions,
  token: string
): Promise<AuthenticatedUploadResult> {
  const { url, formData, onProgress, timeoutMs = 60_000 } = options;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.timeout = timeoutMs;

    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      };
    }

    xhr.onload = () => {
      let json: Record<string, unknown> = {};
      try {
        json = JSON.parse(xhr.responseText) as Record<string, unknown>;
      } catch {
        // Non-JSON body — leave json empty; caller handles status
      }
      resolve({ status: xhr.status, json });
    };

    xhr.onerror  = () => reject(new Error("Network error during upload."));
    xhr.ontimeout = () => reject(new Error("Upload timed out."));
    xhr.send(formData);
  });
}
