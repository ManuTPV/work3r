// Bump CACHE_VERSION to simulate shipping a new "deploy" of the dashboard.
// Everything else (install/activate/fetch/message) is generic.
const CACHE_VERSION = "v11";
const CACHE_NAME = "hotel-tv-shell-" + CACHE_VERSION;

// Some embedded/kiosk TV browsers restrict or wipe persistent storage
// between guests, which makes Cache Storage calls reject. Track that so a
// caching failure degrades to "online only" instead of silently stopping
// install/activate from ever completing (which would leave clients.claim()
// never called, so the page never gets a controller).
let cacheAvailable = true;

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
  "./data/apps.json"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(function (cache) {
        return cache.addAll(APP_SHELL);
      })
      .catch(function (err) {
        cacheAvailable = false;
        console.error("Service worker: cache unavailable during install", err);
      })
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
            })
        );
      })
      .catch(function (err) {
        cacheAvailable = false;
        console.error("Service worker: cache cleanup failed", err);
      })
      .then(function () {
        // Always claim clients, even if caching is broken on this device —
        // without this the page never gets a controller and the status bar
        // hangs at "Cache: —" forever with no way to tell why.
        return self.clients.claim();
      })
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
    caches
      .match(request)
      .catch(function () {
        return undefined;
      })
      .then(function (cached) {
        const network = fetch(request)
          .then(function (response) {
            return response;
          })
          .catch(function () {
            return cached;
          });
        return cached || network;
      })
  );
});

self.addEventListener("message", function (event) {
  if (!event.data) return;
  if (event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  } else if (event.data.type === "GET_VERSION") {
    // Broadcast via clients.matchAll() rather than event.source.postMessage().
    // event.source (ExtendableMessageEvent.source) is a rougher edge of the
    // spec that some embedded/OEM browsers implement inconsistently — if
    // it's ever undefined there, event.source.postMessage() throws inside
    // the worker (silently, invisible from the page) and the reply is lost.
    // clients.matchAll() is a foundational Clients API call with much wider
    // support and doesn't depend on that property.
    self.clients.matchAll().then(function (clients) {
      clients.forEach(function (client) {
        client.postMessage({
          type: "VERSION",
          version: CACHE_VERSION,
          cacheAvailable: cacheAvailable
        });
      });
    });
  }
});
