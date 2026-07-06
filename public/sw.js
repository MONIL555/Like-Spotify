const CACHE_NAME = 'spottunes-cache-v1';

// Install event - caches initial basic assets if needed
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // We can cache critical UI shell assets here
      return cache.addAll(['/']);
    })
  );
  self.skipWaiting();
});

// Activate event - cleans up old caches
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

// Fetch event - cache-first strategy for basic offline support
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Ignore API calls, let them pass through
  if (event.request.url.includes('/api/')) return;

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached response if found
      if (response) {
        return response;
      }
      
      // Otherwise fetch from network
      return fetch(event.request).then((networkResponse) => {
        // Optionally cache new successful responses here if you want aggressive caching
        return networkResponse;
      }).catch((err) => {
        // Here we could return a custom offline page if the network fails
        console.warn('Network request failed and no cache available', err);
      });
    })
  );
});
