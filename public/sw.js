const CACHE_NAME = 'pma-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://lh3.googleusercontent.com/d/1czO2SWxIMEqVMKrwJnetuR_sOVV74bDt'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((fetchResponse) => {
        // Cache new static assets on the fly if they are from our origin
        if (
          fetchResponse.status === 200 &&
          (event.request.url.includes('.js') || 
           event.request.url.includes('.css') || 
           event.request.url.includes('.png') || 
           event.request.url.includes('.woff2'))
        ) {
          const responseToCache = fetchResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return fetchResponse;
      });
    })
  );
});

self.addEventListener('push', (event) => {
  // Parse icons from URL params (passed from GlobalContext/assets.ts)
  const urlParams = new URL(self.location.search).searchParams;
  const defaultIcon = urlParams.get('icon') || 'https://lh3.googleusercontent.com/d/1czO2SWxIMEqVMKrwJnetuR_sOVV74bDt';
  const defaultBadge = urlParams.get('badge') || defaultIcon;

  let data = { title: 'Pangan Emas Abadi', body: 'Pembaruan baru tersedia!' };
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    data.body = event.data.text();
  }

  const options = {
    body: data.body,
    icon: data.icon || defaultIcon,
    badge: data.badge || defaultBadge,
    data: {
      url: data.url || '/'
    },
    vibrate: [100, 50, 100],
    actions: [
      { action: 'open', title: 'Buka Aplikasi' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Pangan Emas Abadi', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      const url = event.notification.data.url;
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
