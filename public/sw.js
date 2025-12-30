const CACHE_VERSION = "v1";
const APP_SHELL_CACHE = `app-shell-${CACHE_VERSION}`;
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`;
const API_CACHE = `api-${CACHE_VERSION}`;

const APP_SHELL_ASSETS = [
  "/",
  "/index.html",
  "/favicon.ico",
  "/favicon-16x16.png",
  "/favicon-32x32.png",
  "/apple-touch-icon.png",
  "/site.webmanifest",
  "/logo-64.png",
  "/logo-128.png",
  "/fonts/space-grotesk-latin.woff2",
];

const cacheResponse = async (cacheName, request, response) => {
  if (!response || response.status !== 200) return;
  const cache = await caches.open(cacheName);
  await cache.put(request, response.clone());
};

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches
      .open(APP_SHELL_CACHE)
      .then((cache) => cache.addAll(APP_SHELL_ASSETS))
      .catch(() => undefined)
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                ![APP_SHELL_CACHE, RUNTIME_CACHE, API_CACHE].includes(key)
            )
            .map((key) => caches.delete(key))
        )
      ),
    ])
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isNavigation = request.mode === "navigate";
  const isApiRequest = isSameOrigin && url.pathname.startsWith("/api/");
  const isStaticAsset =
    isSameOrigin &&
    ["style", "script", "image", "font", "manifest"].includes(
      request.destination
    );

  if (isNavigation) {
    event.respondWith(
      caches.match("/index.html").then((cached) => {
        const fetchPromise = fetch(request)
          .then((response) => {
            cacheResponse(APP_SHELL_CACHE, "/index.html", response);
            return response;
          })
          .catch(() => cached);
        return cached || fetchPromise;
      })
    );
    return;
  }

  if (isApiRequest) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          cacheResponse(API_CACHE, request, response);
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          cacheResponse(RUNTIME_CACHE, request, response);
          return response;
        });
      })
    );
  }
});
