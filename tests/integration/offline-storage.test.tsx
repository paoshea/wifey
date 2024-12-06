import { OfflineManager } from '../../lib/offline';

describe('Offline Storage', () => {
    let manager: OfflineManager;

    beforeEach(async () => {
        manager = OfflineManager.getInstance();
        await manager.clearAllData();
    });

    it('should store and retrieve coverage points', async () => {
        const testPoint = {
            id: 'test-1',
            latitude: 37.7749,
            longitude: -122.4194,
            timestamp: Date.now(),
            signalStrength: -70,
            reliability: 0.95,
            type: 'wifi' as const
        };

        await manager.storeCoveragePoint(testPoint);
        const retrieved = await manager.getCoveragePoint(testPoint.id);

        expect(retrieved).toEqual(testPoint);
    });

    it('should handle offline/online transitions', async () => {
        // Start in online mode
        await manager.setOnlineStatus(true);
        expect(await manager.isOnline()).toBe(true);

        // Switch to offline
        await manager.setOnlineStatus(false);
        expect(await manager.isOnline()).toBe(false);

        // Verify data can still be stored offline
        const testPoint = {
            id: 'test-2',
            latitude: 37.7749,
            longitude: -122.4194,
            timestamp: Date.now(),
            signalStrength: -75,
            reliability: 0.9,
            type: 'cellular' as const
        };

        await manager.storeCoveragePoint(testPoint);
        const retrieved = await manager.getCoveragePoint(testPoint.id);
        expect(retrieved).toEqual(testPoint);
    });

    it('should handle storage limits', async () => {
        // Create MAX_STORAGE_POINTS + 1 points to ensure we exceed the limit
        const points = Array.from({ length: OfflineManager.MAX_STORAGE_POINTS + 1 }, (_, i) => ({
            id: `test-${i}`,
            latitude: 37.7749,
            longitude: -122.4194,
            timestamp: Date.now() - (OfflineManager.MAX_STORAGE_POINTS - i) * 1000, // Newer points have higher timestamps
            signalStrength: -70 - (i % 20),
            reliability: 0.95 - (i % 10) * 0.01,
            type: i % 2 === 0 ? 'wifi' : 'cellular'
        } as const));

        // Store points one by one to ensure proper ordering
        for (const point of points) {
            await manager.storeCoveragePoint(point);
        }

        // Verify storage limit handling
        const storedCount = await manager.getCoveragePointCount();
        expect(storedCount).toBe(OfflineManager.MAX_STORAGE_POINTS);

        // Verify oldest point was removed (first point in array)
        const oldestPoint = await manager.getCoveragePoint(points[0].id);
        expect(oldestPoint).toBeNull();

        // Verify newest point was kept (last point in array)
        const newestPoint = await manager.getCoveragePoint(points[points.length - 1].id);
        expect(newestPoint).toEqual(points[points.length - 1]);
    });

    it('should batch process pending sync items', async () => {
        // Store items while offline
        await manager.setOnlineStatus(false);

        const points = Array.from({ length: 5 }, (_, i) => ({
            id: `sync-test-${i}`,
            latitude: 37.7749,
            longitude: -122.4194,
            timestamp: Date.now() - i * 1000,
            signalStrength: -70 - i,
            reliability: 0.95,
            type: 'wifi' as const
        }));

        await Promise.all(points.map(point => manager.storeCoveragePoint(point)));

        // Get pending sync count
        const pendingCount = await manager.getPendingSyncCount();
        expect(pendingCount).toBe(points.length);

        // Go online and verify sync
        await manager.setOnlineStatus(true);
        await manager.syncPendingItems();

        const remainingCount = await manager.getPendingSyncCount();
        expect(remainingCount).toBe(0);
    });
});
