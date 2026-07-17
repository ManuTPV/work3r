// Bump CACHE_VERSION to simulate shipping a new "deploy" of the dashboard.
// Everything else (install/activate/fetch/message) is generic.
const CACHE_VERSION = "v6";
const CACHE_NAME = "hotel-tv-shell-" + CACHE_VERSION;

const APP_SHELL = [
  "./",
  "./index.html",
  "./apps.html",
  "./hotel-info.html",
  "./travel-info.html",
  "./manifest.webmanifest",
  "./css/style.css",
  "./js/nav.js",
  "./js/remote-nav.js",
  "./js/render-grid.js",
  "./js/register-sw.js",
  "./js/sw-status.js",
  "./data/channels.json",
  "./data/apps.json",
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(APP_SHELL);
    }),
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches
      .keys()
      .then(function (keys) {
        return Promise.all(
          keys
            .filter(function (key) {
              return key.startsWith("hotel-tv-shell-") && key !== CACHE_NAME;
            })
            .map(function (key) {
              return caches.delete(key);
            }),
        );
      })
      .then(function () {
        return self.clients.claim();
      }),
  );
});

self.addEventListener("fetch", function (event) {
  const request = event.request;
  if (
    request.method !== "GET" ||
    new URL(request.url).origin !== self.location.origin
  ) {
    return;
  }

  event.respondWith(
    caches.match(request).then(function (cached) {
      const network = fetch(request)
        .then(function (response) {
          return response;
        })
        .catch(function () {
          return cached;
        });
      return cached || network;
    }),
  );
});

self.addEventListener("message", function (event) {
  if (!event.data) return;
  if (event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  } else if (event.data.type === "GET_VERSION") {
    event.source.postMessage({ type: "VERSION", version: CACHE_VERSION });
  }
});
