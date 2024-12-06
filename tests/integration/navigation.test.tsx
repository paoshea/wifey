import { OfflineManager } from '../../lib/offline';

describe('Navigation System', () => {
    let manager: OfflineManager;

    beforeEach(async () => {
        manager = OfflineManager.getInstance();
        await manager.clearAllData();
    });

    it('should find nearest coverage point', async () => {
        // Store test coverage points at different distances
        const points = [
            {
                id: 'point-1',
                latitude: 37.7749,
                longitude: -122.4194,
                timestamp: Date.now(),
                signalStrength: -65,
                reliability: 0.98,
                type: 'wifi' as const
            },
            {
                id: 'point-2',
                latitude: 37.7847,
                longitude: -122.4294,
                timestamp: Date.now(),
                signalStrength: -70,
                reliability: 0.95,
                type: 'wifi' as const
            }
        ];

        await Promise.all(points.map(point => manager.storeCoveragePoint(point)));

        // Test finding nearest point from a location closer to point-1
        const currentLocation = {
            latitude: 37.7750,  // Very close to point-1
            longitude: -122.4195
        };

        const nearest = await manager.findNearestCoveragePoint(currentLocation);
        expect(nearest.id).toBe('point-1');
    });

    it('should calculate accurate routes', async () => {
        const start = {
            latitude: 37.7749,
            longitude: -122.4194
        };

        const end = {
            latitude: 37.7847,
            longitude: -122.4294
        };

        const route = await manager.calculateRoute(start, end);

        expect(route).toHaveProperty('distance');
        expect(route).toHaveProperty('duration');
        expect(route.steps.length).toBeGreaterThan(0);
        expect(route.steps[0]).toHaveProperty('instruction');
        expect(route.steps[0]).toHaveProperty('distance');
    });

    it('should provide navigation updates', async () => {
        const updates: any[] = [];

        // Subscribe to navigation updates
        const unsubscribe = manager.onNavigationUpdate((update) => {
            updates.push(update);
        });

        // Start navigation
        await manager.startNavigation({
            latitude: 37.7847,
            longitude: -122.4294
        });

        // Simulate movement with location updates
        await manager.updateCurrentLocation({
            latitude: 37.7800,
            longitude: -122.4240
        });

        await manager.updateCurrentLocation({
            latitude: 37.7820,
            longitude: -122.4260
        });

        // Stop navigation
        await manager.stopNavigation();
        unsubscribe();

        // Verify updates were received
        expect(updates.length).toBe(2);
        updates.forEach(update => {
            expect(update).toHaveProperty('distance');
            expect(update).toHaveProperty('estimatedTime');
            expect(update).toHaveProperty('nextInstruction');
        });
    });

    it('should handle navigation errors', async () => {
        // Test invalid coordinates
        await expect(manager.startNavigation({
            latitude: 999,  // Invalid latitude
            longitude: -122.4194
        })).rejects.toThrow();

        // Test navigation without location permission
        manager.setLocationPermission(false);
        await expect(manager.startNavigation({
            latitude: 37.7749,
            longitude: -122.4194
        })).rejects.toThrow('Location permission denied');

        // Test navigation with poor GPS signal
        manager.setLocationPermission(true);
        manager.setLocationAccuracy('poor');
        await expect(manager.startNavigation({
            latitude: 37.7749,
            longitude: -122.4194
        })).rejects.toThrow('GPS signal too weak');
    });

    it('should handle no coverage points scenario', async () => {
        const location = {
            latitude: 37.7749,
            longitude: -122.4194
        };

        await expect(manager.findNearestCoveragePoint(location))
            .rejects.toThrow('No coverage points available');
    });
});
