import { OfflineManager } from '../../lib/offline';
import { OfflineDB } from '../../lib/offline/storage/db';

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
            // Create points with decreasing timestamps
            const baseTime = Date.now();
            const points = Array.from(
                { length: OfflineManager.MAX_STORAGE_POINTS + 1 },
                (_, i) => ({
                    id: `test-${i}`,
                    latitude: 37.7749,
                    longitude: -122.4194,
                    timestamp: baseTime - (OfflineManager.MAX_STORAGE_POINTS - i) * 1000, // Oldest first
                    signalStrength: -70,
                    reliability: 0.95,
                    type: 'wifi' as const
                })
            );

            // Store points sequentially to ensure proper order
            for (const point of points) {
                await manager.storeCoveragePoint(point);
                // Add small delay to ensure timestamps are unique
                await new Promise(resolve => setTimeout(resolve, 10));
            }

            const memoryCount = await manager.getCoveragePointCount();
            expect(memoryCount).toBe(OfflineManager.MAX_STORAGE_POINTS);

            const dbPoints = await db.getCoveragePoints();
            expect(dbPoints.length).toBe(OfflineManager.MAX_STORAGE_POINTS);

            // Oldest point should be removed
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
            // Mock the storage operation to fail
            const mockError = new Error('Storage error');
            jest.spyOn(db, 'storeCoveragePoint').mockImplementation(() => {
                return Promise.reject(mockError);
            });

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
                    latitude: 38.7749, // 1 degree outside region
                    longitude: -123.4194, // 1 degree outside region
                    timestamp: Date.now(),
                    signalStrength: -70,
                    reliability: 0.95,
                    type: 'wifi' as const
                }
            ];

            // Store points sequentially
            for (const point of points) {
                await manager.storeCoveragePoint(point);
                // Add small delay to ensure timestamps are unique
                await new Promise(resolve => setTimeout(resolve, 10));
            }

            const region = {
                latitude: 37.7749,
                longitude: -122.4194,
                latitudeDelta: 0.1, // 0.1 degree radius
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
                    latitude: 37.7750, // Very close to cluster-1a
                    longitude: -122.4195,
                    timestamp: Date.now(),
                    signalStrength: -72,
                    reliability: 0.93,
                    type: 'wifi' as const
                },
                {
                    id: 'cluster-2',
                    latitude: 37.7849, // Further away
                    longitude: -122.4294,
                    timestamp: Date.now(),
                    signalStrength: -75,
                    reliability: 0.90,
                    type: 'wifi' as const
                }
            ];

            // Store points sequentially
            for (const point of points) {
                await manager.storeCoveragePoint(point);
                // Add small delay to ensure timestamps are unique
                await new Promise(resolve => setTimeout(resolve, 10));
            }

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
