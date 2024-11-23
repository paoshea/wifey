const CACHE_NAME = 'wifey-cache-v1';
const API_CACHE_NAME = 'wifey-api-cache-v1';
const MEASUREMENT_SYNC_TAG = 'measurement-sync';

// Files to cache for offline support
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  // Add other static assets here
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME && name !== API_CACHE_NAME)
            .map((name) => caches.delete(name))
        );
      }),
      // Claim clients
      self.clients.claim(),
    ])
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static assets
  event.respondWith(
    caches.match(request).then((response) => {
      return response || fetch(request).then((response) => {
        // Cache successful responses
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      });
    })
  );
});

async function handleApiRequest(request) {
  // Try to fetch from network first
  try {
    const response = await fetch(request);
    // Clone the response before caching
    const responseToCache = response.clone();
    
    // Cache successful GET responses
    if (request.method === 'GET' && response.ok) {
      const cache = await caches.open(API_CACHE_NAME);
      await cache.put(request, responseToCache);
    }
    
    return response;
  } catch (error) {
    // If offline, try to return cached response for GET requests
    if (request.method === 'GET') {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
    }
    
    // For POST requests (measurements), store in IndexedDB for later sync
    if (request.method === 'POST' && request.url.includes('/api/measurements')) {
      const measurement = await request.json();
      await storeMeasurementForSync(measurement);
      
      // Register for background sync
      try {
        await self.registration.sync.register(MEASUREMENT_SYNC_TAG);
      } catch (err) {
        console.error('Background Sync registration failed:', err);
      }
      
      return new Response(JSON.stringify({ 
        status: 'queued',
        message: 'Measurement stored for sync'
      }));
    }
    
    throw error;
  }
}

self.addEventListener('sync', (event) => {
  if (event.tag === MEASUREMENT_SYNC_TAG) {
    event.waitUntil(syncMeasurements());
  }
});

async function syncMeasurements() {
  const measurements = await getPendingMeasurements();
  
  for (const measurement of measurements) {
    try {
      const response = await fetch('/api/measurements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(measurement),
      });
      
      if (response.ok) {
        await markMeasurementSynced(measurement.id);
      }
    } catch (error) {
      console.error('Failed to sync measurement:', error);
      // Will retry on next sync event
    }
  }
}

// Helper functions for IndexedDB operations
async function storeMeasurementForSync(measurement) {
  const db = await openDB();
  const tx = db.transaction('pending_measurements', 'readwrite');
  await tx.store.add({
    ...measurement,
    timestamp: new Date().toISOString(),
    syncAttempts: 0,
  });
  await tx.done;
}

async function getPendingMeasurements() {
  const db = await openDB();
  return db.getAll('pending_measurements');
}

async function markMeasurementSynced(id) {
  const db = await openDB();
  const tx = db.transaction('pending_measurements', 'readwrite');
  await tx.store.delete(id);
  await tx.done;
}

async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('wifey-sync-db', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pending_measurements')) {
        db.createObjectStore('pending_measurements', { 
          keyPath: 'id',
          autoIncrement: true 
        });
      }
    };
  });
}

// Periodic sync for regular background updates
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'measurements-periodic-sync') {
    event.waitUntil(syncMeasurements());
  }
});
