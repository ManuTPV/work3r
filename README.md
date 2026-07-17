# HotelCast — Service Worker POC

A minimal, framework-free simulation of an in-room hotel TV dashboard, built to demonstrate
core [Service Worker](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers)
concepts: offline-first app-shell caching (cache-first fetch strategy) and a cache
versioning / update flow.

Four pages: **TV & Radio Channels** (home), **Apps**, **Hotel Information**, **Travel Information**.
A status bar at the bottom of every page shows Service Worker state, cache version, and
online/offline status — that bar is the actual point of the demo.

## Run it locally

Service Workers require a secure context, but `localhost` counts as one, so plain HTTP is fine:

```sh
cd "work3r"
python3 -m http.server 8080
# or: npx serve -l 8080
```

Open `http://localhost:8080/`.

## Test: offline caching

1. Open DevTools → Application → Service Workers. Confirm the worker is "activated and running."
2. Open DevTools → Application → Cache Storage. Confirm a `hotel-tv-shell-v1` cache exists.
3. Visit all 4 pages once while online.
4. In DevTools → Network, check "Offline" (or toggle it under Service Workers).
5. Reload and navigate between all 4 pages — everything should still render, including the
   channel/app tiles (which come from `data/*.json`, fetched through the same cache-first path).
   The status bar should flip to "Offline" while the Service Worker stays "active."

## Test: cache versioning / update flow

1. Go back online.
2. Edit `service-worker.js`: bump `CACHE_VERSION` from `"v1"` to `"v2"`. Optionally tweak a
   line of content somewhere (e.g. a channel name in `data/channels.json`) so the update is
   visible.
3. Reload the page. The browser detects the byte-diff in `service-worker.js`, installs a new
   worker in the background, and the status bar shows an **"Update available"** button.
4. Check Cache Storage — you'll briefly see both `hotel-tv-shell-v1` and `hotel-tv-shell-v2`
   (the new cache is populated on install, before the old one is purged).
5. Click **Update**. This posts `SKIP_WAITING` to the new worker, which activates, deletes the
   old `v1` cache, claims the open page, and triggers one automatic reload.
6. Confirm: Cache Storage now shows only `hotel-tv-shell-v2`, the status bar reads `Cache: v2`,
   and any content tweak from step 2 is visible.

## Notes on scope

This is a proof of concept, not a production dashboard:
- No responsive/mobile layout — it assumes a fixed 1920×1080 landscape TV display.
- Navigation is plain full-page `<a>` links (not client-side routing), so every page load is a
  real fetch that exercises the Service Worker cache.
- No backend — all content is static JSON/HTML served from disk.
