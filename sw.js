const CACHE_NAME = 'flux-cache-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json'
];

// Install: Cache core application shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate: Clean up older cache versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Stale-while-revalidate for local assets, pass-through for streaming media
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Bypass cache for video streaming (.m3u8, .ts, .mp4) and range requests
  if (
    event.request.headers.get('range') ||
    requestUrl.pathname.endsWith('.m3u8') ||
    requestUrl.pathname.endsWith('.ts') ||
    requestUrl.pathname.endsWith('.mp4')
  ) {
    return;
  }

  // Network-first strategy with cache fallback for app shell
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return networkResponse;
      })
      .catch(() => caches.match(event.request))
  );
});
