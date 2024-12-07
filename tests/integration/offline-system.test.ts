const { OfflineManager } = require('../../lib/offline');
const { OfflineDB } = require('../../lib/offline/storage/db');

interface CoveragePoint {
    id: string;
    latitude: number;
    longitude: number;
    timestamp: number;
    signalStrength: number;
    reliability: number;
    type: 'wifi' | 'cellular';
}

interface Region {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
}

interface PointCluster {
    latitude: number;
    longitude: number;
    pointCount: number;
}

describe('Offline System Integration', () => {
    let manager: InstanceType<typeof OfflineManager>;
    let db: InstanceType<typeof OfflineDB>;
    let originalFetch: typeof fetch;

    beforeAll(() => {
        originalFetch = global.fetch;
        jest.setTimeout(120000); // Increase timeout
    });

    beforeEach(async () => {
        try {
            // Reset instances
            OfflineDB.resetInstance();
            db = OfflineDB.getInstance();
            await (db as any).initialize();

            // Initialize manager
            manager = OfflineManager.getInstance();
            await (manager as any).initialize({
                location: { trackingInterval: 1000, minDistance: 10, maxAge: 5000, timeout: 5000, enableHighAccuracy: true },
                sync: { autoSyncInterval: 5000, maxRetries: 3, retryDelay: 100 },
                map: { maxZoom: 18, minZoom: 10, tileExpiration: 24 * 60 * 60 * 1000, preloadRadius: 1 }
            });

            // Setup fetch mock
            global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve({}) });

            // Clear any existing data
            await (db as any).clearAllData();
        } catch (error) {
            console.warn('Failed to initialize:', error);
            throw error; // Re-throw to fail the test
        }
    }, 120000); // Increase hook timeout

    afterEach(async () => {
        try {
            if (db) {
                await (db as any).initialize(); // Ensure DB is initialized before cleanup
                await (db as any).clearAllData();
                await (db as any).deleteDatabase();
            }
        } catch (error) {
            console.warn('Failed to cleanup:', error);
        }
        jest.clearAllMocks();
    }, 120000); // Increase hook timeout

    afterAll(() => {
        global.fetch = originalFetch;
    });

    describe('Data Persistence', () => {
        it('should persist coverage points across sessions', async () => {
            const point: CoveragePoint = {
                id: 'test-1',
                latitude: 37.7749,
                longitude: -122.4194,
                timestamp: Date.now(),
                signalStrength: -70,
                reliability: 0.95,
                type: 'wifi'
            };

            await (manager as any).storeCoveragePoint(point);
            const memoryPoint = await (manager as any).getCoveragePoint(point.id);
            expect(memoryPoint).toEqual(point);

            const dbPoint = await (db as any).getCoveragePoint(point.id);
            expect(dbPoint).toEqual(point);
        }, 120000); // Increase test timeout

        it('should handle storage limits with persistence', async () => {
            const points: CoveragePoint[] = Array.from({ length: 10 }, (_, i) => ({
                id: `test-${i}`,
                latitude: 37.7749,
                longitude: -122.4194,
                timestamp: Date.now() - i * 1000,
                signalStrength: -70,
                reliability: 0.95,
                type: 'wifi'
            }));

            await Promise.all(points.map(point => (manager as any).storeCoveragePoint(point)));

            const memoryCount = await (manager as any).getCoveragePointCount();
            expect(memoryCount).toBeLessThanOrEqual(OfflineManager.MAX_STORAGE_POINTS);

            const dbPoints = await (db as any).getCoveragePoints();
            expect(dbPoints.length).toBeLessThanOrEqual(OfflineManager.MAX_STORAGE_POINTS);
        }, 120000); // Increase test timeout
    });

    describe('Offline/Online Sync', () => {
        it('should queue items when offline and sync when online', async () => {
            await (manager as any).setOnlineStatus(false);
            const point: CoveragePoint = {
                id: 'sync-test',
                latitude: 37.7749,
                longitude: -122.4194,
                timestamp: Date.now(),
                signalStrength: -70,
                reliability: 0.95,
                type: 'wifi'
            };

            await (manager as any).storeCoveragePoint(point);
            const pendingCount = await (manager as any).getPendingSyncCount();
            expect(pendingCount).toBe(1);

            await (manager as any).setOnlineStatus(true);
            await (manager as any).syncPendingItems();
            const afterSyncCount = await (manager as any).getPendingSyncCount();
            expect(afterSyncCount).toBe(0);
        }, 120000); // Increase test timeout
    });

    describe('Error Handling', () => {
        it('should handle storage errors gracefully', async () => {
            jest.spyOn(db as any, 'storeCoveragePoint').mockRejectedValueOnce(new Error('Storage error'));
            const point: CoveragePoint = {
                id: 'error-test',
                latitude: 37.7749,
                longitude: -122.4194,
                timestamp: Date.now(),
                signalStrength: -70,
                reliability: 0.95,
                type: 'wifi'
            };

            await expect((manager as any).storeCoveragePoint(point)).rejects.toThrow('Storage error');
            const memoryPoint = await (manager as any).getCoveragePoint(point.id);
            expect(memoryPoint).toBeNull();
        }, 120000); // Increase test timeout

        it('should handle sync errors with retry mechanism', async () => {
            await (manager as any).setOnlineStatus(false);
            const point: CoveragePoint = {
                id: 'retry-test',
                latitude: 37.7749,
                longitude: -122.4194,
                timestamp: Date.now(),
                signalStrength: -70,
                reliability: 0.95,
                type: 'wifi'
            };

            await (manager as any).storeCoveragePoint(point);
            await (manager as any).setOnlineStatus(true);

            global.fetch = jest.fn()
                .mockRejectedValueOnce(new Error('Network error'))
                .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({}) });

            await (manager as any).syncPendingItems();
            const pendingItems = await (db as any).getPendingSyncItems();
            expect(pendingItems.length).toBe(1);
            expect(pendingItems[0].retryCount).toBe(1);

            await (manager as any).syncPendingItems();
            const remainingItems = await (db as any).getPendingSyncItems();
            expect(remainingItems.length).toBe(0);
        }, 120000); // Increase test timeout
    });

    describe('Map Integration', () => {
        it('should find coverage points in region', async () => {
            const points: CoveragePoint[] = [
                {
                    id: 'in-bounds',
                    latitude: 37.7749,
                    longitude: -122.4194,
                    timestamp: Date.now(),
                    signalStrength: -70,
                    reliability: 0.95,
                    type: 'wifi'
                },
                {
                    id: 'out-bounds',
                    latitude: 38.7749,
                    longitude: -123.4194,
                    timestamp: Date.now(),
                    signalStrength: -70,
                    reliability: 0.95,
                    type: 'wifi'
                }
            ];

            await Promise.all(points.map(point => (manager as any).storeCoveragePoint(point)));

            const region: Region = {
                latitude: 37.7749,
                longitude: -122.4194,
                latitudeDelta: 0.1,
                longitudeDelta: 0.1
            };

            const foundPoints = await (manager as any).findCoveragePointsInRegion(region);
            expect(foundPoints.length).toBe(1);
            expect(foundPoints[0].id).toBe('in-bounds');
        }, 120000); // Increase test timeout

        it('should cluster nearby points', async () => {
            const points: CoveragePoint[] = [
                {
                    id: 'cluster-1a',
                    latitude: 37.7749,
                    longitude: -122.4194,
                    timestamp: Date.now(),
                    signalStrength: -70,
                    reliability: 0.95,
                    type: 'wifi'
                },
                {
                    id: 'cluster-1b',
                    latitude: 37.7750,
                    longitude: -122.4195,
                    timestamp: Date.now(),
                    signalStrength: -72,
                    reliability: 0.93,
                    type: 'wifi'
                },
                {
                    id: 'cluster-2',
                    latitude: 37.7849,
                    longitude: -122.4294,
                    timestamp: Date.now(),
                    signalStrength: -75,
                    reliability: 0.90,
                    type: 'wifi'
                }
            ];

            await Promise.all(points.map(point => (manager as any).storeCoveragePoint(point)));

            const region: Region = {
                latitude: 37.7749,
                longitude: -122.4194,
                latitudeDelta: 0.1,
                longitudeDelta: 0.1
            };

            const clusters = await (manager as any).findClusteredPoints(region);
            expect(clusters.length).toBe(2);

            const nearbyCluster = clusters.find((c: PointCluster) => c.pointCount === 2);
            expect(nearbyCluster).toBeTruthy();
        }, 120000); // Increase test timeout
    });
});
