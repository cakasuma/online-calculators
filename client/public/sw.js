const CACHE = 'toolhub-v1';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  // Static assets (JS, CSS, fonts, images): cache-first, update in background
  if (/\.(js|css|woff2?|ttf|svg|png|ico|webp|webmanifest)(\?.*)?$/.test(url.pathname)) {
    e.respondWith(
      caches.open(CACHE).then((cache) =>
        cache.match(request).then((hit) => {
          const fresh = fetch(request).then((res) => {
            if (res.ok) cache.put(request, res.clone());
            return res;
          });
          return hit || fresh;
        })
      )
    );
    return;
  }

  // HTML navigation: network-first, fall back to cached shell
  e.respondWith(
    caches.open(CACHE).then((cache) =>
      fetch(request)
        .then((res) => {
          if (res.ok) cache.put(request, res.clone());
          return res;
        })
        .catch(() => cache.match(request) || cache.match('/'))
    )
  );
});
