// Stores the app on the device so it works offline.
// Change VERSION on every release, otherwise phones keep the old files.
const VERSION = "1";

// Caches are shared across the whole github.io origin, so names include the
// scope. That way /beta/ and the live app never touch each other's files.
const CACHE_PREFIX = `lottdragning:${self.registration.scope}:`;
const CACHE_NAME = CACHE_PREFIX + VERSION;

const FILES = [
  "./",
  "index.html",
  "main.js",
  "style.css",
  "manifest.json",
  "icon.svg",
  "icon-180.png",
  "icon-512.png",
  "fonts/inter-latin.woff2",
  "fonts/oswald-latin.woff2",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      // "reload" skips the browser's HTTP cache so a release can't store stale files.
      await cache.addAll(FILES.map((file) => new Request(file, { cache: "reload" })));
      // Safe to switch right away: an open page keeps what it already loaded,
      // so the new version only shows the next time the app is opened.
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
          .map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(event.request, { ignoreSearch: true });
      return cached || fetch(event.request);
    })(),
  );
});
