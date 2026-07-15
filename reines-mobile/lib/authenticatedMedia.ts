import api from "@/lib/api";
import { toProxiedMediaPath } from "@/lib/media";

/** In-memory data-URI cache so gallery grids don't re-fetch every remount. */
const mediaCache = new Map<string, string>();

function toArrayBuffer(data: unknown): ArrayBuffer {
  if (data instanceof ArrayBuffer) return data;
  if (ArrayBuffer.isView(data)) {
    return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
  }
  if (typeof data === "string") {
    // Rare Axios fallback: binary string
    const bytes = new Uint8Array(data.length);
    for (let i = 0; i < data.length; i++) bytes[i] = data.charCodeAt(i) & 0xff;
    return bytes.buffer;
  }
  throw new Error("Unexpected media response payload");
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    binary += String.fromCharCode.apply(null, Array.from(chunk) as number[]);
  }
  return btoa(binary);
}

/**
 * Download a private gallery/receipt image through the authenticated Axios
 * client and return a data: URI the native Image component can render.
 *
 * Why: Android / Expo Go image loaders often fail on /api/media URLs
 * (headers, Content-Disposition, chunked streams). Axios already sends the
 * Bearer token correctly for every other mobile request.
 */
export async function fetchAuthenticatedMediaUri(
  url: string | null | undefined
): Promise<string | null> {
  if (!url) return null;

  const path = toProxiedMediaPath(url);
  const cached = mediaCache.get(path);
  if (cached) return cached;

  const requestUrl =
    path.startsWith("http://") || path.startsWith("https://")
      ? path
      : path.startsWith("/")
        ? path
        : `/${path}`;

  const { data, headers } = await api.get(requestUrl, {
    responseType: "arraybuffer",
    headers: { Accept: "image/*,application/octet-stream,*/*" },
  });

  const buffer = toArrayBuffer(data);
  if (buffer.byteLength < 24) {
    throw new Error("Media response too small to be an image");
  }

  const mime =
    (typeof headers["content-type"] === "string"
      ? headers["content-type"].split(";")[0].trim()
      : null) || "image/jpeg";

  const dataUri = `data:${mime};base64,${arrayBufferToBase64(buffer)}`;
  mediaCache.set(path, dataUri);
  return dataUri;
}

export function clearMediaCache(): void {
  mediaCache.clear();
}
