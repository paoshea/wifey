import { OfflineManager } from '../../lib/offline';

describe('Location Services', () => {
    let manager: OfflineManager;
    let mockGeolocation: { getCurrentPosition: jest.Mock };

    beforeEach(() => {
        // Setup mock geolocation
        mockGeolocation = {
            getCurrentPosition: jest.fn()
        };

        // Mock the global navigator object
        const mockNavigator = {
            geolocation: mockGeolocation
        };

        Object.defineProperty(global, 'navigator', {
            value: mockNavigator,
            writable: true
        });

        manager = OfflineManager.getInstance();
        manager.clearAllData();
    });

    describe('Find My Location', () => {
        it('should accurately detect current location', async () => {
            const mockPosition = {
                coords: {
                    latitude: 37.7749,
                    longitude: -122.4194,
                    accuracy: 10,
                    altitude: null,
                    altitudeAccuracy: null,
                    heading: null,
                    speed: null
                },
                timestamp: Date.now()
            };

            mockGeolocation.getCurrentPosition.mockImplementation((success) => success(mockPosition));

            const location = await manager.findCurrentLocation();
            expect(location).toEqual({
                latitude: mockPosition.coords.latitude,
                longitude: mockPosition.coords.longitude
            });
        });

        it('should handle location permission denial', async () => {
            mockGeolocation.getCurrentPosition.mockImplementation((success, error) =>
                error({ code: 1, message: 'Permission denied' }));

            await expect(manager.findCurrentLocation())
                .rejects.toThrow('Location permission denied');
        });

        it('should handle location timeout', async () => {
            mockGeolocation.getCurrentPosition.mockImplementation((success, error) =>
                error({ code: 3, message: 'Timeout' }));

            await expect(manager.findCurrentLocation())
                .rejects.toThrow('Location request timed out');
        });
    });

    describe('Distance Calculations', () => {
        it('should calculate accurate distances between points', async () => {
            // San Francisco to Oakland coordinates
            const start = {
                latitude: 37.7749,
                longitude: -122.4194
            };
            const end = {
                latitude: 37.8044,
                longitude: -122.2712
            };

            const route = await manager.calculateRoute(start, end);
            // Direct "as the crow flies" distance is ~13.4km
            expect(route.distance).toBeCloseTo(13.4, 1);
        });

        it('should handle same point distance', async () => {
            const point = {
                latitude: 37.7749,
                longitude: -122.4194
            };

            const route = await manager.calculateRoute(point, point);
            expect(route.distance).toBe(0);
        });

        it('should calculate distances across the date line', async () => {
            const point1 = {
                latitude: 35.6762,
                longitude: 179.9999
            };
            const point2 = {
                latitude: 35.6762,
                longitude: -179.9999
            };

            const route = await manager.calculateRoute(point1, point2);
            expect(route.distance).toBeLessThan(1);
        });
    });

    describe('Navigation Functions', () => {
        it('should generate valid routes between points', async () => {
            const start = {
                latitude: 37.7749,
                longitude: -122.4194
            };
            const end = {
                latitude: 37.8044,
                longitude: -122.2712
            };

            const route = await manager.calculateRoute(start, end);
            expect(route).toHaveProperty('distance');
            expect(route).toHaveProperty('duration');
            expect(route.steps.length).toBeGreaterThan(0);
            expect(route.steps[0]).toHaveProperty('instruction');
            expect(route.steps[0]).toHaveProperty('distance');

            expect(route.distance).toBeGreaterThan(0);
            expect(route.duration).toBeGreaterThan(0);
            route.steps.forEach(step => {
                expect(step.distance).toBeGreaterThan(0);
                expect(step.instruction).toBeTruthy();
            });
        });

        it('should provide turn-by-turn navigation updates', async () => {
            const start = {
                latitude: 37.7749,
                longitude: -122.4194
            };
            const end = {
                latitude: 37.8044,
                longitude: -122.2712
            };

            // Mock current location
            mockGeolocation.getCurrentPosition.mockImplementation((success) =>
                success({ coords: { latitude: start.latitude, longitude: start.longitude } }));

            // Start navigation
            await manager.startNavigation(end);

            const updates: Array<{
                distance: number;
                estimatedTime: number;
                nextInstruction: string;
                rerouting: boolean;
            }> = [];

            const unsubscribe = manager.onNavigationUpdate((update) => {
                updates.push(update);
            });

            // Simulate movement along the route
            await manager.updateCurrentLocation({
                latitude: 37.7849,
                longitude: -122.4094
            });

            await manager.updateCurrentLocation({
                latitude: 37.7949,
                longitude: -122.3994
            });

            // Stop navigation
            await manager.stopNavigation();
            unsubscribe();

            expect(updates.length).toBeGreaterThan(1);
            updates.forEach(update => {
                expect(update).toHaveProperty('distance');
                expect(update).toHaveProperty('estimatedTime');
                expect(update).toHaveProperty('nextInstruction');
                expect(update.distance).toBeGreaterThanOrEqual(0);
                expect(update.estimatedTime).toBeGreaterThan(0);
            });

            // Verify decreasing distance to destination
            expect(updates[0].distance).toBeGreaterThan(updates[updates.length - 1].distance);
        });

        it('should handle navigation recalculation', async () => {
            const destination = {
                latitude: 37.8044,
                longitude: -122.2712
            };

            // Mock current location
            mockGeolocation.getCurrentPosition.mockImplementation((success) =>
                success({ coords: { latitude: 37.7749, longitude: -122.4194 } }));

            // Start navigation
            await manager.startNavigation(destination);

            const updates: Array<{
                distance: number;
                estimatedTime: number;
                nextInstruction: string;
                rerouting: boolean;
            }> = [];

            const unsubscribe = manager.onNavigationUpdate((update) => {
                updates.push(update);
            });

            // Update to a location significantly off the expected route
            await manager.updateCurrentLocation({
                latitude: 37.7349,
                longitude: -122.4494
            });

            // Verify route recalculation
            expect(updates[updates.length - 1].rerouting).toBe(true);

            // Clean up
            await manager.stopNavigation();
            unsubscribe();
        });
    });

    describe('Map Interactions', () => {
        it('should handle map region changes', async () => {
            const region = {
                latitude: 37.7749,
                longitude: -122.4194,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421
            };

            const points = await manager.findCoveragePointsInRegion(region);
            expect(Array.isArray(points)).toBe(true);
        });

        it('should cluster nearby points', async () => {
            // Add test points
            const points = [
                { id: '1', latitude: 37.7749, longitude: -122.4194, timestamp: Date.now(), signalStrength: -70, reliability: 0.9, type: 'wifi' as const },
                { id: '2', latitude: 37.7750, longitude: -122.4195, timestamp: Date.now(), signalStrength: -72, reliability: 0.85, type: 'wifi' as const },
                { id: '3', latitude: 37.7751, longitude: -122.4196, timestamp: Date.now(), signalStrength: -75, reliability: 0.88, type: 'wifi' as const }
            ];

            await Promise.all(points.map(point => manager.storeCoveragePoint(point)));

            const region = {
                latitude: 37.7749,
                longitude: -122.4194,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421
            };

            const clusters = await manager.findClusteredPoints(region);
            expect(clusters.length).toBeLessThan(points.length);
            clusters.forEach(cluster => {
                expect(cluster).toHaveProperty('pointCount');
                expect(cluster).toHaveProperty('coordinate');
            });
        });

        it('should handle map style changes', async () => {
            const styles = await manager.getMapStyles();
            expect(Array.isArray(styles)).toBe(true);
            expect(styles.length).toBeGreaterThan(0);

            const newStyle = styles[0];
            await manager.updateMapStyle(newStyle);
            const currentStyle = await manager.getMapStyle();
            expect(currentStyle).toBe(newStyle);
        });
    });
});
