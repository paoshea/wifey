const CACHE_NAME = 'wifey-cache-v1';
const OFFLINE_URL = '/offline';
const ASSETS_TO_CACHE = [
  '/',
  '/offline',
  '/manifest.json',
  '/favicon.ico',
  '/logo.svg',
  '/logo-dark.svg',
  // Add other static assets here
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, then network
self.addEventListener('fetch', (event) => {
  // Handle API requests
  if (event.request.url.includes('/api/')) {
    return handleApiRequest(event);
  }

  // Handle static assets and pages
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((fetchResponse) => {
        // Cache successful responses
        if (fetchResponse && fetchResponse.status === 200) {
          const responseToCache = fetchResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return fetchResponse;
      }).catch(() => {
        // Return offline page for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match(OFFLINE_URL);
        }
        return null;
      });
    })
  );
});

// Handle API requests with offline support
async function handleApiRequest(event) {
  // Try network first
  try {
    const response = await fetch(event.request);
    // Clone the response to store in cache
    const responseToCache = response.clone();
    const cache = await caches.open(CACHE_NAME);
    cache.put(event.request, responseToCache);
    return response;
  } catch (error) {
    // If offline, try to return cached response
    const cachedResponse = await caches.match(event.request);
    if (cachedResponse) {
      return cachedResponse;
    }
    // If no cached response, return offline data
    return new Response(
      JSON.stringify({
        error: 'You are offline',
        offline: true,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Push notification event
self.addEventListener('push', (event) => {
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/logo.svg',
    badge: '/logo.svg',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1',
      url: data.url || '/',
    },
    actions: [
      {
        action: 'explore',
        title: 'View Details',
      },
      {
        action: 'close',
        title: 'Close',
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-coverage-marks') {
    event.waitUntil(syncCoverageMarks());
  }
});

// Sync coverage marks when back online
async function syncCoverageMarks() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const requests = await cache.keys();
    const pendingMarks = requests.filter(request => 
      request.url.includes('/api/coverage/contribute')
    );

    await Promise.all(pendingMarks.map(async (request) => {
      try {
        const response = await fetch(request);
        if (response.ok) {
          await cache.delete(request);
        }
      } catch (error) {
        console.error('Failed to sync coverage mark:', error);
      }
    }));
  } catch (error) {
    console.error('Failed to sync coverage marks:', error);
  }
}

// Periodic background sync for coverage updates
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-coverage') {
    event.waitUntil(updateCoverage());
  }
});

// Update coverage data periodically
async function updateCoverage() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const coverageResponse = await fetch('/api/coverage/cellular/area');
    if (coverageResponse.ok) {
      await cache.put('/api/coverage/cellular/area', coverageResponse);
    }
  } catch (error) {
    console.error('Failed to update coverage:', error);
  }
}
