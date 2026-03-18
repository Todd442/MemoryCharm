/**
 * Memory Charm – minimal PWA service worker.
 *
 * Purpose: satisfies Chrome's requirement for a SW with a fetch handler,
 * which is necessary for `beforeinstallprompt` to fire.
 *
 * Strategy: cache-first for same-origin static assets; network-only for
 * everything else (API calls, cross-origin CDN assets).
 */

const CACHE = 'mc-static-v2';

// Take control immediately on install / activate.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(
  // Delete all old cache versions, then claim clients.
  caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => clients.claim())
));

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only cache GET requests to the same origin that are NOT API calls.
  if (
    request.method !== 'GET' ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith('/api/')
  ) {
    return; // let browser handle normally
  }

  // Stale-while-revalidate: serve from cache instantly, refresh in background.
  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(request);
      const fetchPromise = fetch(request)
        .then((res) => {
          if (res.ok) {
            // Never cache an HTML response for a non-navigation request.
            // SPA servers return index.html (200 OK) for unknown paths — if a
            // JS bundle request hits that fallback, caching HTML as JS poisons
            // the cache and causes a permanent MIME-type blank screen.
            const ct = res.headers.get('Content-Type') ?? '';
            const isNavigation = request.mode === 'navigate';
            if (!isNavigation && ct.includes('text/html')) {
              return res; // serve but don't cache
            }
            cache.put(request, res.clone());
          }
          return res;
        })
        .catch(() => cached); // offline fallback to cache

      return cached ?? fetchPromise;
    })
  );
});
