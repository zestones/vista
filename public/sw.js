// Vista service worker — offline app shell + runtime caching.
const CACHE = "vista-v2";
const SHELL = ["/", "/index.html", "/manifest.webmanifest", "/icon.svg"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const { request } = e;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  // Never cache cross-origin (GitHub API) or API/serverless routes — always live.
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  // App navigations: network-first, fall back to cached shell when offline.
  if (request.mode === "navigate") {
    e.respondWith(
      fetch(request)
        .then((r) => {
          // Clone SYNCHRONOUSLY: caches.open() is async, so cloning inside its .then() runs after we've
          // already returned `r` and the browser consumed the body -> "Response body is already used".
          const copy = r.clone();
          caches.open(CACHE).then((c) => c.put("/index.html", copy));
          return r;
        })
        .catch(() => caches.match("/index.html"))
    );
    return;
  }

  // Static assets: stale-while-revalidate.
  e.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((r) => {
          if (r && r.ok) {
            const copy = r.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
          }
          return r;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
