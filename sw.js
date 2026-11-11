const CACHE_NAME = 'flex-v2';
const NETWORK_FIRST_ASSETS = [
  'index.html',
  'diagnostics.html',
  'inject.js',
  'cosmetic.css',
  'adblock-rules.txt',
  'source.js',
  'mock-shell.js'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const isSameOrigin = url.origin === location.origin;
  const isImage = req.destination === 'image' || /\.(svg|png|jpg|jpeg|webp|gif|ico)(\?.*)?$/i.test(url.pathname);

  // Never cache requests to other origins except images
  if (!isSameOrigin && !isImage) return;

  // Stale-while-revalidate for images
  if (isImage) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(req).then((cached) => {
          const fetchPromise = fetch(req).then((networkRes) => {
            if (networkRes && (networkRes.status === 200 || networkRes.type === 'opaque')) {
              cache.put(req, networkRes.clone());
            }
            return networkRes;
          }).catch(() => null);
          return cached || fetchPromise;
        })
      )
    );
    return;
  }

  // Network-first for key assets
  const path = url.pathname.split('/').pop() || 'index.html';
  const isNetworkFirst = NETWORK_FIRST_ASSETS.includes(path);

  if (isNetworkFirst) {
    event.respondWith(
      fetch(req)
        .then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const copy = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return networkRes;
        })
        .catch(() => caches.match(req))
    );
  }
});
