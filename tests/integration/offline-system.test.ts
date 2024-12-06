import { OfflineManager } from '../../lib/offline';
import { OfflineDB } from '../../lib/offline/storage/db';

// Mock event interfaces
interface IDBEvent {
    target: {
        result: any;
        error?: Error | null;
    };
}

interface IDBRequest {
    result: any;
    error: Error | null;
    source: any;
    transaction: any;
    readyState: 'pending' | 'done';
    onerror: ((this: IDBRequest, ev: IDBEvent) => any) | null;
    onsuccess: ((this: IDBRequest, ev: IDBEvent) => any) | null;
    onupgradeneeded: ((this: IDBRequest, ev: IDBEvent) => any) | null;
}

// Create mock database
const createMockDB = () => {
    const stores = new Map<string, Map<string, any>>();

    const db = {
        stores,
        objectStoreNames: {
            contains: (name: string) => stores.has(name)
        },
        createObjectStore(name: string, options: { keyPath: string }) {
            const store = new Map();
            stores.set(name, store);
            return {
                createIndex: () => ({})
            };
        },
        transaction(storeNames: string[], mode: IDBTransactionMode) {
            const transaction = {
                objectStore: (name: string) => {
                    const store = stores.get(name);
                    if (!store) throw new Error(`Store ${name} not found`);
                    return {
                        put: (value: any) => {
                            store.set(value.id, value);
                            const request = createRequest(undefined);
                            setTimeout(() => {
                                if (request.onsuccess) {
                                    request.onsuccess({
                                        target: { result: undefined }
                                    } as IDBEvent);
                                }
                                transaction.oncomplete?.();
                            }, 0);
                            return request;
                        },
                        get: (key: string) => {
                            const value = store.get(key);
                            const request = createRequest(value);
                            setTimeout(() => {
                                if (request.onsuccess) {
                                    request.onsuccess({
                                        target: { result: value }
                                    } as IDBEvent);
                                }
                            }, 0);
                            return request;
                        },
                        getAll: () => {
                            const values = Array.from(store.values());
                            const request = createRequest(values);
                            setTimeout(() => {
                                if (request.onsuccess) {
                                    request.onsuccess({
                                        target: { result: values }
                                    } as IDBEvent);
                                }
                            }, 0);
                            return request;
                        },
                        delete: (key: string) => {
                            store.delete(key);
                            const request = createRequest(undefined);
                            setTimeout(() => {
                                if (request.onsuccess) {
                                    request.onsuccess({
                                        target: { result: undefined }
                                    } as IDBEvent);
                                }
                                transaction.oncomplete?.();
                            }, 0);
                            return request;
                        },
                        clear: () => {
                            store.clear();
                            const request = createRequest(undefined);
                            setTimeout(() => {
                                if (request.onsuccess) {
                                    request.onsuccess({
                                        target: { result: undefined }
                                    } as IDBEvent);
                                }
                                transaction.oncomplete?.();
                            }, 0);
                            return request;
                        }
                    };
                },
                oncomplete: null as (() => void) | null
            };
            return transaction;
        },
        close() {
            stores.clear();
        }
    };
    return db;
};

// Create a proper IDBRequest-like object
const createRequest = <T>(result: T): IDBRequest => ({
    result,
    error: null,
    source: null,
    transaction: null,
    readyState: 'pending',
    onerror: null,
    onsuccess: null,
    onupgradeneeded: null
});

// Mock IndexedDB
const mockIndexedDB = {
    open: (name: string, version: number): IDBRequest => {
        const db = createMockDB();
        const request = createRequest(db);

        setTimeout(() => {
            if (request.onupgradeneeded) {
                request.onupgradeneeded({
                    target: { result: db }
                } as IDBEvent);
            }
            if (request.onsuccess) {
                request.onsuccess({
                    target: { result: db }
                } as IDBEvent);
            }
        }, 0);

        return request;
    },
    deleteDatabase: (name: string): IDBRequest => {
        const request = createRequest(undefined);
        setTimeout(() => {
            if (request.onsuccess) {
                request.onsuccess({
                    target: { result: undefined }
                } as IDBEvent);
            }
        }, 0);
        return request;
    }
};

// Setup mock IndexedDB
Object.defineProperty(global, 'indexedDB', {
    value: mockIndexedDB,
    writable: true
});

describe('Offline System Integration', () => {
    let manager: OfflineManager;
    let db: OfflineDB;
    let originalFetch: typeof global.fetch;

    beforeAll(() => {
        originalFetch = global.fetch;
        jest.setTimeout(10000); // Shorter timeout for faster failures
    });

    beforeEach(async () => {
        // Reset instances
        OfflineDB.resetInstance();
        db = OfflineDB.getInstance();

        // Initialize DB first
        await db.initialize();

        // Initialize manager
        manager = OfflineManager.getInstance();
        await manager.initialize({
            location: {
                trackingInterval: 1000,
                minDistance: 10,
                maxAge: 5000,
                timeout: 5000,
                enableHighAccuracy: true
            },
            sync: {
                autoSyncInterval: 5000,
                maxRetries: 3,
                retryDelay: 100,
            },
            map: {
                maxZoom: 18,
                minZoom: 10,
                tileExpiration: 24 * 60 * 60 * 1000,
                preloadRadius: 1
            }
        });

        // Reset fetch mock
        global.fetch = jest.fn().mockImplementation(() =>
            Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve({})
            })
        );

        // Clear any existing data
        await db.clearAllData();
    });

    afterEach(async () => {
        if (db) {
            await db.clearAllData();
            await db.deleteDatabase();
        }
        jest.clearAllMocks();
    });

    afterAll(() => {
        global.fetch = originalFetch;
    });

    describe('Data Persistence', () => {
        it('should persist coverage points across sessions', async () => {
            const point = {
                id: 'test-1',
                latitude: 37.7749,
                longitude: -122.4194,
                timestamp: Date.now(),
                signalStrength: -70,
                reliability: 0.95,
                type: 'wifi' as const
            };

            await manager.storeCoveragePoint(point);

            const memoryPoint = await manager.getCoveragePoint(point.id);
            expect(memoryPoint).toEqual(point);

            const dbPoint = await db.getCoveragePoint(point.id);
            expect(dbPoint).toEqual(point);
        });

        it('should handle storage limits with persistence', async () => {
            const points = Array.from(
                { length: OfflineManager.MAX_STORAGE_POINTS + 1 },
                (_, i) => ({
                    id: `test-${i}`,
                    latitude: 37.7749,
                    longitude: -122.4194,
                    timestamp: Date.now() - i * 1000,
                    signalStrength: -70,
                    reliability: 0.95,
                    type: 'wifi' as const
                })
            );

            await Promise.all(points.map(point => manager.storeCoveragePoint(point)));

            const memoryCount = await manager.getCoveragePointCount();
            expect(memoryCount).toBe(OfflineManager.MAX_STORAGE_POINTS);

            const dbPoints = await db.getCoveragePoints();
            expect(dbPoints.length).toBe(OfflineManager.MAX_STORAGE_POINTS);

            const oldestPoint = await db.getCoveragePoint(points[0].id);
            expect(oldestPoint).toBeNull();
        });
    });

    describe('Offline/Online Sync', () => {
        it('should queue items when offline and sync when online', async () => {
            await manager.setOnlineStatus(false);

            const point = {
                id: 'sync-test',
                latitude: 37.7749,
                longitude: -122.4194,
                timestamp: Date.now(),
                signalStrength: -70,
                reliability: 0.95,
                type: 'wifi' as const
            };

            await manager.storeCoveragePoint(point);

            const pendingCount = await manager.getPendingSyncCount();
            expect(pendingCount).toBe(1);

            await manager.setOnlineStatus(true);
            await manager.syncPendingItems();

            const afterSyncCount = await manager.getPendingSyncCount();
            expect(afterSyncCount).toBe(0);
        });
    });

    describe('Error Handling', () => {
        it('should handle storage errors gracefully', async () => {
            jest.spyOn(db, 'storeCoveragePoint').mockRejectedValueOnce(new Error('Storage error'));

            const point = {
                id: 'error-test',
                latitude: 37.7749,
                longitude: -122.4194,
                timestamp: Date.now(),
                signalStrength: -70,
                reliability: 0.95,
                type: 'wifi' as const
            };

            await expect(manager.storeCoveragePoint(point)).rejects.toThrow('Storage error');

            const memoryPoint = await manager.getCoveragePoint(point.id);
            expect(memoryPoint).toBeNull();
        });

        it('should handle sync errors with retry mechanism', async () => {
            await manager.setOnlineStatus(false);

            const point = {
                id: 'retry-test',
                latitude: 37.7749,
                longitude: -122.4194,
                timestamp: Date.now(),
                signalStrength: -70,
                reliability: 0.95,
                type: 'wifi' as const
            };

            await manager.storeCoveragePoint(point);
            await manager.setOnlineStatus(true);

            // Mock fetch to simulate network error then success
            global.fetch = jest.fn()
                .mockRejectedValueOnce(new Error('Network error'))
                .mockImplementationOnce(() => Promise.resolve({
                    ok: true,
                    status: 200,
                    json: () => Promise.resolve({})
                }));

            await manager.syncPendingItems();

            const pendingItems = await db.getPendingSyncItems();
            expect(pendingItems.length).toBe(1);
            expect(pendingItems[0].retryCount).toBe(1);

            // Second sync attempt should succeed
            await manager.syncPendingItems();
            const remainingItems = await db.getPendingSyncItems();
            expect(remainingItems.length).toBe(0);
        });
    });

    describe('Map Integration', () => {
        it('should find coverage points in region', async () => {
            const points = [
                {
                    id: 'in-bounds',
                    latitude: 37.7749,
                    longitude: -122.4194,
                    timestamp: Date.now(),
                    signalStrength: -70,
                    reliability: 0.95,
                    type: 'wifi' as const
                },
                {
                    id: 'out-bounds',
                    latitude: 38.7749,
                    longitude: -123.4194,
                    timestamp: Date.now(),
                    signalStrength: -70,
                    reliability: 0.95,
                    type: 'wifi' as const
                }
            ];

            await Promise.all(points.map(point => manager.storeCoveragePoint(point)));

            const region = {
                latitude: 37.7749,
                longitude: -122.4194,
                latitudeDelta: 0.1,
                longitudeDelta: 0.1
            };

            const foundPoints = await manager.findCoveragePointsInRegion(region);
            expect(foundPoints.length).toBe(1);
            expect(foundPoints[0].id).toBe('in-bounds');
        });

        it('should cluster nearby points', async () => {
            const points = [
                {
                    id: 'cluster-1a',
                    latitude: 37.7749,
                    longitude: -122.4194,
                    timestamp: Date.now(),
                    signalStrength: -70,
                    reliability: 0.95,
                    type: 'wifi' as const
                },
                {
                    id: 'cluster-1b',
                    latitude: 37.7750,
                    longitude: -122.4195,
                    timestamp: Date.now(),
                    signalStrength: -72,
                    reliability: 0.93,
                    type: 'wifi' as const
                },
                {
                    id: 'cluster-2',
                    latitude: 37.7849,
                    longitude: -122.4294,
                    timestamp: Date.now(),
                    signalStrength: -75,
                    reliability: 0.90,
                    type: 'wifi' as const
                }
            ];

            await Promise.all(points.map(point => manager.storeCoveragePoint(point)));

            const region = {
                latitude: 37.7749,
                longitude: -122.4194,
                latitudeDelta: 0.1,
                longitudeDelta: 0.1
            };

            const clusters = await manager.findClusteredPoints(region);
            expect(clusters.length).toBe(2);

            const nearbyCluster = clusters.find(c => c.pointCount === 2);
            expect(nearbyCluster).toBeTruthy();
        });
    });
});
