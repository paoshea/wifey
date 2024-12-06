/// <reference path="./types.d.ts" />
/// <reference lib="webworker" />

const sw = self as unknown as ServiceWorkerGlobalScope;

const CACHE_NAME = 'offline-system-v1';
const TILE_CACHE_NAME = 'map-tiles-v1';
const API_CACHE_NAME = 'api-cache-v1';

// Resources that should be pre-cached
const PRECACHE_URLS = [
    '/',
    '/index.html',
    '/offline.html',
    '/manifest.json',
    '/static/css/main.css',
    '/static/js/main.js'
];

sw.addEventListener('install', ((event: ExtendableEvent) => {
    event.waitUntil(
        Promise.all([
            caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS)),
            sw.skipWaiting()
        ])
    );
}) as EventListener);

sw.addEventListener('activate', ((event: ExtendableEvent) => {
    const promises: Promise<any>[] = [];

    // Claim clients
    promises.push(sw.clients.claim());

    // Clean up old caches
    promises.push(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(cacheName =>
                        cacheName !== CACHE_NAME &&
                        cacheName !== TILE_CACHE_NAME &&
                        cacheName !== API_CACHE_NAME
                    )
                    .map(cacheName => caches.delete(cacheName))
            );
        })
    );

    event.waitUntil(Promise.all(promises));
}) as EventListener);

sw.addEventListener('fetch', ((event: FetchEvent) => {
    const url = new URL(event.request.url);

    // Handle map tile requests
    if (url.pathname.includes('/tile/')) {
        event.respondWith(handleTileRequest(event.request));
        return;
    }

    // Handle API requests
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(handleApiRequest(event.request));
        return;
    }

    // Handle static assets
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request).then(response => {
                // Cache successful responses
                if (response.ok) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            });
        })
    );
}) as EventListener);

sw.addEventListener('sync', ((event: SyncEvent) => {
    if (event.tag === 'sync-coverage-points') {
        event.waitUntil(syncCoveragePoints());
    }
}) as EventListener);

sw.addEventListener('periodicsync', ((event: PeriodicSyncEvent) => {
    if (event.tag === 'update-map-tiles') {
        event.waitUntil(updateMapTiles());
    }
}) as EventListener);

async function handleTileRequest(request: Request): Promise<Response> {
    // Try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }

    try {
        // Fetch from network
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(TILE_CACHE_NAME);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        // Return offline tile if available
        const offlineTile = await caches.match('/static/images/offline-tile.png');
        if (offlineTile) return offlineTile;

        // If offline tile not available, return error response
        return new Response('Tile not available offline', {
            status: 404,
            statusText: 'Not Found'
        });
    }
}

async function handleApiRequest(request: Request): Promise<Response> {
    // For POST requests, add to sync queue if offline
    if (request.method === 'POST') {
        try {
            const response = await fetch(request);
            return response;
        } catch (error) {
            // If offline, store in IndexedDB for later sync
            const data = await request.clone().json();
            await storeForSync(request.url, data);
            return new Response(JSON.stringify({ queued: true }), {
                status: 202,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }

    // For GET requests, try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
        // Fetch updated data in background
        fetch(request).then(async response => {
            if (response.ok) {
                const cache = await caches.open(API_CACHE_NAME);
                cache.put(request, response);
            }
        }).catch(() => {
            // Ignore background fetch errors
        });
        return cachedResponse;
    }

    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(API_CACHE_NAME);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Network error' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

async function syncCoveragePoints(): Promise<void> {
    const db = await openDB();
    const pendingItems = await db.getPendingSyncItems();

    for (const item of pendingItems) {
        try {
            const response = await fetch('/api/coverage-points', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item.data)
            });

            if (response.ok) {
                await db.removePendingSyncItem(item.id);
            } else if (item.retryCount >= 5) {
                // Give up after 5 retries
                await db.removePendingSyncItem(item.id);
            } else {
                // Update retry count
                await db.addPendingSync({
                    ...item,
                    retryCount: item.retryCount + 1
                });
            }
        } catch (error) {
            console.error('Sync failed:', error);
        }
    }
}

async function updateMapTiles(): Promise<void> {
    const db = await openDB();
    const viewport = await getCurrentViewport();

    // Clear old tiles
    await db.clearOldMapTiles(7 * 24 * 60 * 60 * 1000); // 7 days

    // Download new tiles for current viewport
    for (const tile of generateTileList(viewport)) {
        try {
            const response = await fetch(tile.url);
            if (response.ok) {
                const blob = await response.blob();
                await db.storeMapTile({
                    id: tile.id,
                    x: tile.x,
                    y: tile.y,
                    zoom: tile.zoom,
                    data: blob,
                    timestamp: Date.now()
                });
            }
        } catch (error) {
            console.error('Failed to update tile:', error);
        }
    }
}

async function storeForSync(url: string, data: any): Promise<void> {
    const db = await openDB();
    await db.addPendingSync({
        id: crypto.randomUUID(),
        type: 'coverage_point',
        data,
        timestamp: Date.now(),
        retryCount: 0
    });
}

// Helper function to open IndexedDB
async function openDB() {
    const db = (await import('../storage/db')).OfflineDB.getInstance();
    await db.initialize();
    return db;
}

// Helper function to get current viewport from clients
async function getCurrentViewport(): Promise<{
    center: { lat: number; lng: number };
    zoom: number;
}> {
    const clients = await sw.clients.matchAll();
    const client = clients[0];
    if (client) {
        // Get viewport data from client
        const response = await new Promise(resolve => {
            const channel = new MessageChannel();
            channel.port1.onmessage = event => resolve(event.data);
            client.postMessage({ type: 'GET_VIEWPORT' }, [channel.port2]);
        });
        return (response as any).viewport;
    }
    return { center: { lat: 0, lng: 0 }, zoom: 0 };
}

// Helper function to generate tile list for viewport
function generateTileList(viewport: { center: { lat: number; lng: number }; zoom: number }) {
    const tiles = [];
    // Calculate tile coordinates based on viewport
    const x = long2tile(viewport.center.lng, viewport.zoom);
    const y = lat2tile(viewport.center.lat, viewport.zoom);

    // Get tiles in a 3x3 grid around center
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            tiles.push({
                id: `${viewport.zoom}/${x + i}/${y + j}`,
                x: x + i,
                y: y + j,
                zoom: viewport.zoom,
                url: `https://tile.openstreetmap.org/${viewport.zoom}/${x + i}/${y + j}.png`
            });
        }
    }
    return tiles;
}

// Convert longitude to tile number
function long2tile(lon: number, zoom: number): number {
    return Math.floor((lon + 180) / 360 * Math.pow(2, zoom));
}

// Convert latitude to tile number
function lat2tile(lat: number, zoom: number): number {
    return Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
}
