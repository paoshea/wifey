const { OfflineManager } = require('../../lib/offline');
const { OfflineDB } = require('../../lib/offline/storage/db');

describe('Offline System Integration', () => {
    let manager: any;
    let db: any;

    beforeAll(() => {
        console.log('beforeAll: Setting up test environment');
        jest.setTimeout(30000); // 30 second timeout
    });

    beforeEach(async () => {
        console.log('beforeEach: Initializing test instances');
        // Reset mock storage error flag
        process.env.MOCK_STORAGE_ERROR = 'false';

        try {
            // Reset instances
            OfflineDB.resetInstance();
            db = OfflineDB.getInstance();

            // Initialize DB first
            console.log('Initializing DB...');
            await db.initialize().catch((error: Error) => {
                console.error('DB initialization failed:', error);
                throw error;
            });
            console.log('DB initialized successfully');

            // Initialize manager with minimal config
            console.log('Creating manager instance...');
            manager = OfflineManager.getInstance();
            console.log('Initializing manager...');
            await manager.initialize({
                location: { trackingInterval: 100 },
                sync: { autoSyncInterval: 100, maxRetries: 3, retryDelay: 100 },
                map: { maxZoom: 18, minZoom: 10 }
            }).catch((error: Error) => {
                console.error('Manager initialization failed:', error);
                throw error;
            });
            console.log('Manager initialized successfully');
        } catch (error: unknown) {
            console.error('Setup failed:', error);
            throw error;
        }
    }, 30000); // 30 second timeout

    afterEach(async () => {
        console.log('afterEach: Starting cleanup');
        if (!db) {
            console.log('No DB instance to clean up');
            return;
        }

        try {
            // Only try to clear/delete if DB is initialized
            const isInitialized = await db.isInitialized();
            if (!isInitialized) {
                console.log('DB not initialized, skipping cleanup');
                return;
            }

            // Clear data first
            console.log('Clearing DB data...');
            await Promise.race([
                db.clearAllData(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Clear timeout')), 15000))
            ]).catch(error => {
                console.error('Failed to clear data:', error);
            });

            // Then delete database
            console.log('Deleting database...');
            await Promise.race([
                db.deleteDatabase(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Delete timeout')), 15000))
            ]).catch(error => {
                console.error('Failed to delete database:', error);
            });

            console.log('Cleanup completed');
        } catch (error: unknown) {
            console.error('Cleanup failed:', error);
        } finally {
            // Reset instances regardless of cleanup success
            OfflineDB.resetInstance();
            db = null;
            manager = null;
        }
    }, 30000); // 30 second timeout

    describe('Basic Operations', () => {
        it('should initialize the offline system', async () => {
            console.log('Running initialization test');
            expect(db).toBeTruthy();
            expect(manager).toBeTruthy();

            // Verify DB is initialized
            const isDBInitialized = await db.isInitialized();
            expect(isDBInitialized).toBe(true);

            // Verify manager has required methods
            expect(typeof manager.initialize).toBe('function');
            expect(typeof manager.storeCoveragePoint).toBe('function');
            expect(typeof manager.getCoveragePoint).toBe('function');

            console.log('Initialization test completed');
        }, 30000);

        it('should store and retrieve coverage points', async () => {
            console.log('Running data operations test');

            const testPoint = {
                id: 'test-point-1',
                latitude: 37.7749,
                longitude: -122.4194,
                timestamp: Date.now(),
                signalStrength: -70,
                reliability: 0.95,
                type: 'wifi'
            };

            // Store the point
            console.log('Storing coverage point...');
            await manager.storeCoveragePoint(testPoint);
            console.log('Point stored successfully');

            // Retrieve the point
            console.log('Retrieving coverage point...');
            const retrievedPoint = await manager.getCoveragePoint(testPoint.id);
            console.log('Point retrieved:', retrievedPoint);

            // Verify the point was stored correctly
            expect(retrievedPoint).toBeTruthy();
            expect(retrievedPoint.id).toBe(testPoint.id);
            expect(retrievedPoint.latitude).toBe(testPoint.latitude);
            expect(retrievedPoint.longitude).toBe(testPoint.longitude);
            expect(retrievedPoint.signalStrength).toBe(testPoint.signalStrength);
            expect(retrievedPoint.reliability).toBe(testPoint.reliability);
            expect(retrievedPoint.type).toBe(testPoint.type);

            console.log('Data operations test completed');
        }, 30000);
    });

    describe('Offline/Online Workflows', () => {
        it('should queue items when offline and sync when online', async () => {
            console.log('Testing offline queuing and online sync');

            // Set system to offline mode
            await manager.setOnlineStatus(false);

            const point = {
                id: 'offline-point-1',
                latitude: 37.7749,
                longitude: -122.4194,
                timestamp: Date.now(),
                signalStrength: -70,
                reliability: 0.95,
                type: 'wifi'
            };

            // Store point while offline
            await manager.storeCoveragePoint(point);

            // Verify point is in pending sync queue
            const pendingCount = await manager.getPendingSyncCount();
            expect(pendingCount).toBe(1);

            // Switch to online and sync
            await manager.setOnlineStatus(true);
            await manager.syncPendingItems();

            // Wait for sync to complete
            await new Promise(resolve => setTimeout(resolve, 100));

            // Verify sync queue is empty
            const afterSyncCount = await manager.getPendingSyncCount();
            expect(afterSyncCount).toBe(0);
        }, 30000);

        it('should handle multiple offline operations and batch sync', async () => {
            console.log('Testing batch sync operations');

            await manager.setOnlineStatus(false);

            // Create multiple points
            const points = Array.from({ length: 5 }, (_, i) => ({
                id: `batch-point-${i}`,
                latitude: 37.7749 + (i * 0.001),
                longitude: -122.4194 + (i * 0.001),
                timestamp: Date.now() + i,
                signalStrength: -70 - i,
                reliability: 0.95,
                type: 'wifi'
            }));

            // Store all points while offline
            await Promise.all(points.map(point => manager.storeCoveragePoint(point)));

            // Verify all points are queued
            const pendingCount = await manager.getPendingSyncCount();
            expect(pendingCount).toBe(points.length);

            // Switch online and sync
            await manager.setOnlineStatus(true);
            await manager.syncPendingItems();

            // Wait for sync to complete
            await new Promise(resolve => setTimeout(resolve, 500));

            // Verify all points were synced
            const afterSyncCount = await manager.getPendingSyncCount();
            expect(afterSyncCount).toBe(0);
        }, 30000);
    });

    describe('Storage Limits and Data Management', () => {
        it('should handle storage limits by removing oldest points', async () => {
            console.log('Testing storage limit handling');

            // Create points up to storage limit plus one
            const points = Array.from(
                { length: OfflineManager.MAX_STORAGE_POINTS + 1 },
                (_, i) => ({
                    id: `limit-point-${i}`,
                    latitude: 37.7749 + (i * 0.001),
                    longitude: -122.4194 + (i * 0.001),
                    timestamp: Date.now() + i * 1000, // Increasing timestamps
                    signalStrength: -70,
                    reliability: 0.95,
                    type: 'wifi'
                })
            );

            // Store all points
            for (const point of points) {
                await manager.storeCoveragePoint(point);
            }

            // Verify total points equals max limit
            const totalPoints = await manager.getCoveragePointCount();
            expect(totalPoints).toBe(OfflineManager.MAX_STORAGE_POINTS);

            // Verify oldest point was removed
            const oldestPoint = await manager.getCoveragePoint(points[0].id);
            expect(oldestPoint).toBeNull();

            // Verify newest point exists
            const newestPoint = await manager.getCoveragePoint(points[points.length - 1].id);
            expect(newestPoint).toBeTruthy();
        }, 30000);
    });

    describe('Error Handling and Resilience', () => {
        it('should handle storage errors gracefully', async () => {
            console.log('Testing error handling');

            // Set mock storage error flag
            process.env.MOCK_STORAGE_ERROR = 'true';

            const point = {
                id: 'error-test-point',
                latitude: 37.7749,
                longitude: -122.4194,
                timestamp: Date.now(),
                signalStrength: -70,
                reliability: 0.95,
                type: 'wifi'
            };

            // Attempt to store point
            await expect(manager.storeCoveragePoint(point)).rejects.toThrow('Storage error');

            // Verify point was not stored
            const retrievedPoint = await manager.getCoveragePoint(point.id);
            expect(retrievedPoint).toBeNull();
        }, 30000);

        it('should retry failed sync operations', async () => {
            console.log('Testing sync retry mechanism');

            // Set up sync failure then success
            global.fetch = jest.fn()
                .mockRejectedValueOnce(new Error('Network error'))
                .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({}) });

            await manager.setOnlineStatus(false);

            const point = {
                id: 'retry-test-point',
                latitude: 37.7749,
                longitude: -122.4194,
                timestamp: Date.now(),
                signalStrength: -70,
                reliability: 0.95,
                type: 'wifi'
            };

            // Store point and attempt sync
            await manager.storeCoveragePoint(point);
            await manager.setOnlineStatus(true);

            // First sync attempt (will fail)
            await manager.syncPendingItems();

            // Verify point is still in queue with retry count
            const pendingItems = await db.getPendingSyncItems();
            expect(pendingItems.length).toBe(1);
            expect(pendingItems[0].retryCount).toBe(1);

            // Second sync attempt (will succeed)
            await manager.syncPendingItems();

            // Wait for sync to complete
            await new Promise(resolve => setTimeout(resolve, 100));

            // Verify sync queue is empty
            const remainingItems = await db.getPendingSyncItems();
            expect(remainingItems.length).toBe(0);
        }, 30000);
    });

    describe('Map Integration', () => {
        it('should find coverage points within a region', async () => {
            console.log('Testing regional point search');

            const centerLat = 37.7749;
            const centerLon = -122.4194;
            const region = {
                latitude: centerLat,
                longitude: centerLon,
                latitudeDelta: 0.1,
                longitudeDelta: 0.1
            };

            // Create points inside and outside region
            const points = [
                {
                    id: 'in-region-1',
                    latitude: centerLat + 0.01,
                    longitude: centerLon + 0.01,
                    timestamp: Date.now(),
                    signalStrength: -70,
                    reliability: 0.95,
                    type: 'wifi'
                },
                {
                    id: 'in-region-2',
                    latitude: centerLat - 0.01,
                    longitude: centerLon - 0.01,
                    timestamp: Date.now(),
                    signalStrength: -72,
                    reliability: 0.93,
                    type: 'wifi'
                },
                {
                    id: 'out-of-region',
                    latitude: centerLat + 1.0,
                    longitude: centerLon + 1.0,
                    timestamp: Date.now(),
                    signalStrength: -75,
                    reliability: 0.90,
                    type: 'wifi'
                }
            ];

            // Store all points
            await Promise.all(points.map(point => manager.storeCoveragePoint(point)));

            // Search for points in region
            const foundPoints = await manager.findCoveragePointsInRegion(region);

            // Verify only in-region points were found
            expect(foundPoints.length).toBe(2);
            expect(foundPoints.map((p: { id: any; }) => p.id)).toContain('in-region-1');
            expect(foundPoints.map((p: { id: any; }) => p.id)).toContain('in-region-2');
            expect(foundPoints.map((p: { id: any; }) => p.id)).not.toContain('out-of-region');
        }, 30000);

        it('should cluster nearby points', async () => {
            console.log('Testing point clustering');

            const centerLat = 37.7749;
            const centerLon = -122.4194;

            // Create two distinct clusters and one distant point
            const points = [
                // First cluster
                {
                    id: 'cluster-1a',
                    latitude: centerLat + 0.0001,
                    longitude: centerLon + 0.0001,
                    timestamp: Date.now(),
                    signalStrength: -70,
                    reliability: 0.95,
                    type: 'wifi'
                },
                {
                    id: 'cluster-1b',
                    latitude: centerLat + 0.0002,
                    longitude: centerLon + 0.0002,
                    timestamp: Date.now(),
                    signalStrength: -72,
                    reliability: 0.93,
                    type: 'wifi'
                },
                // Second cluster (further away)
                {
                    id: 'cluster-2a',
                    latitude: centerLat + 0.01,
                    longitude: centerLon + 0.01,
                    timestamp: Date.now(),
                    signalStrength: -73,
                    reliability: 0.92,
                    type: 'wifi'
                },
                {
                    id: 'cluster-2b',
                    latitude: centerLat + 0.0101,
                    longitude: centerLon + 0.0101,
                    timestamp: Date.now(),
                    signalStrength: -74,
                    reliability: 0.91,
                    type: 'wifi'
                },
                // Distant point
                {
                    id: 'distant-point',
                    latitude: centerLat + 0.1,
                    longitude: centerLon + 0.1,
                    timestamp: Date.now(),
                    signalStrength: -75,
                    reliability: 0.90,
                    type: 'wifi'
                }
            ];

            // Store all points
            await Promise.all(points.map(point => manager.storeCoveragePoint(point)));

            // Get clusters
            const region = {
                latitude: centerLat,
                longitude: centerLon,
                latitudeDelta: 0.2,
                longitudeDelta: 0.2
            };

            const clusters = await manager.findClusteredPoints(region);

            // Verify clustering
            expect(clusters.length).toBe(3); // Two clusters and one single point

            // Verify clusters have correct point counts
            const clusterCounts = clusters.map((c: { pointCount: any; }) => c.pointCount).sort();
            expect(clusterCounts).toEqual([1, 2, 2]); // One single point and two clusters of 2 points each
        }, 30000);
    });
});
