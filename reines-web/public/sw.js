/* Minimal service worker — required for Chrome's install prompt / beforeinstallprompt.
 * Network-only fetch: keeps the portal fresh and avoids stale-cache surprises.
 * Bump CACHE_VERSION if you later add offline caching.
 */
const CACHE_VERSION = "reines-pwa-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith("reines-pwa-") && key !== CACHE_VERSION)
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  // Pass through to the network. A fetch handler must be present for installability.
  if (event.request.method !== "GET") return;
  event.respondWith(fetch(event.request));
});
