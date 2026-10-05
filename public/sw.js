const CACHE_NAME = 'deltastore-v1.0.0';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/crm.html',
  '/css/store.css',
  '/css/crm.css',
  '/js/store.js',
  '/js/crm.js',
  '/assets/logo_deltastore.svg',
  '/assets/logo_deltastore_animated.svg',
  '/manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('⚡ DeltaStore ServiceWorker: Precaching shell estático');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Evitar cachear llamadas API para siempre tener stock y pedidos en vivo
  if (e.request.url.includes('/api/')) {
    e.respondWith(fetch(e.request).catch(() => new Response(JSON.stringify({ error: 'Modo offline' }), { headers: { 'Content-Type': 'application/json' } })));
    return;
  }

  e.respondWith(
    caches.match(e.request).then((res) => {
      return res || fetch(e.request).then((fetchRes) => {
        return caches.open(CACHE_NAME).then((cache) => {
          if (e.request.method === 'GET') {
            cache.put(e.request.url, fetchRes.clone());
          }
          return fetchRes;
        });
      });
    }).catch(() => caches.match('/index.html'))
  );
});
