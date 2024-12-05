const CACHE_NAME = 'wifey-cache-v1';
const OFFLINE_URL = '/offline';

// Resources to pre-cache
const PRECACHE_RESOURCES = [
  '/',
  '/offline',
  '/manifest.json',
  '/app-icon.svg',
  '/favicon.ico',
  '/styles.css'
];

// Install event - pre-cache critical resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_RESOURCES))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
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
    }).then(() => self.clients.claim())
  );
});

// Fetch event - handle offline functionality
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Handle API requests
  if (event.request.url.includes('/api/')) {
    return handleApiRequest(event);
  }

  // Handle map tile requests
  if (event.request.url.includes('/tiles/')) {
    return handleMapTileRequest(event);
  }

  // Handle navigation requests
  if (event.request.mode === 'navigate') {
    return handleNavigationRequest(event);
  }

  // Default fetch strategy - Cache First, Network Fallback
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request)
          .then((response) => {
            // Cache successful responses
            if (response.ok && response.type === 'basic') {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
            }
            return response;
          });
      })
  );
});

// Handle API requests - Network First, Cache Fallback
function handleApiRequest(event) {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful GET responses
        if (response.ok && event.request.method === 'GET') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
}

// Handle map tile requests - Cache First, Network Update
function handleMapTileRequest(event) {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, networkResponse.clone());
              });
            return networkResponse;
          });
        return response || fetchPromise;
      })
  );
}

// Handle navigation requests
function handleNavigationRequest(event) {
  event.respondWith(
    fetch(event.request)
      .catch(() => {
        return caches.match(OFFLINE_URL);
      })
  );
}

// Background sync for offline data
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-coverage-reports') {
    event.waitUntil(syncCoverageReports());
  }
});

// Push notifications for important updates
self.addEventListener('push', (event) => {
  const options = {
    body: event.data.text(),
    icon: '/app-icon.svg',
    badge: '/favicon.ico',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };

  event.waitUntil(
    self.registration.showNotification('Wifey Update', options)
  );
});
