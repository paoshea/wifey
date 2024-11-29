const CACHE_NAME = 'wifey-map-cache-v1';
const TILE_CACHE_NAME = 'wifey-map-tiles-v1';

// Resources to cache
const CACHED_RESOURCES = [
  '/',
  '/map',
  '/coverage',
  '/wifi-finder',
  '/coverage-finder',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CACHED_RESOURCES);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('wifey-map-'))
          .filter((name) => name !== CACHE_NAME && name !== TILE_CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Handle map tile requests
  if (url.hostname.includes('tile.openstreetmap.org')) {
    event.respondWith(handleMapTile(event.request));
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/coverage')) {
    event.respondWith(handleApiRequest(event.request));
    return;
  }

  // Handle other requests
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

async function handleMapTile(request) {
  const cache = await caches.open(TILE_CACHE_NAME);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('Error fetching map tile:', error);
    return new Response('', { status: 404 });
  }
}

async function handleApiRequest(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response.clone());
      return response;
    }
  } catch (error) {
    console.error('Error fetching API data:', error);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
  }
  
  return new Response(JSON.stringify({ error: 'Failed to fetch data' }), {
    status: 503,
    headers: { 'Content-Type': 'application/json' },
  });
}
