import { Position, LocationHistoryEntry, OfflineConfig } from './types';
import { OfflineStorage } from './storage';
import { LocationError, LocationErrorCode, parseGeolocationError } from './errors';

export class LocationTracker {
    private static instance: LocationTracker;
    private watchId: number | null = null;
    private storage: OfflineStorage;
    private lastPosition: Position | null = null;
    private locationListeners: Set<(position: Position) => void> = new Set();
    private errorListeners: Set<(error: LocationError) => void> = new Set();
    private config: OfflineConfig['location'];

    private constructor() {
        this.storage = OfflineStorage.getInstance();
        this.config = {
            trackingInterval: 10000, // 10 seconds
            minDistance: 10, // 10 meters
            maxAge: 30000, // 30 seconds
            timeout: 15000, // 15 seconds
            enableHighAccuracy: true
        };
    }

    static getInstance(): LocationTracker {
        if (!LocationTracker.instance) {
            LocationTracker.instance = new LocationTracker();
        }
        return LocationTracker.instance;
    }

    /**
     * Configure location tracking parameters
     */
    configure(config: Partial<OfflineConfig['location']>): void {
        this.config = { ...this.config, ...config };
    }

    /**
     * Start tracking location
     */
    async startTracking(): Promise<void> {
        if (!navigator.geolocation) {
            throw new LocationError(
                'Geolocation is not supported',
                LocationErrorCode.UNSUPPORTED
            );
        }

        if (this.watchId !== null) {
            return; // Already tracking
        }

        try {
            // Get initial position
            const position = await this.getCurrentPosition();
            await this.handleNewPosition(position);

            // Start continuous tracking
            this.watchId = navigator.geolocation.watchPosition(
                (position) => this.handleNewPosition(this.parsePosition(position)),
                (error) => this.handleError(error),
                {
                    enableHighAccuracy: this.config.enableHighAccuracy,
                    timeout: this.config.timeout,
                    maximumAge: this.config.maxAge
                }
            );
        } catch (error) {
            const locationError = error instanceof LocationError
                ? error
                : new LocationError(
                    'Failed to start location tracking',
                    LocationErrorCode.TRACKING_FAILED,
                    error instanceof Error ? error : undefined
                );
            this.handleError(locationError);
            throw locationError;
        }
    }

    /**
     * Stop tracking location
     */
    stopTracking(): void {
        if (this.watchId !== null && navigator.geolocation) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }
    }

    /**
     * Get current position
     */
    async getCurrentPosition(): Promise<Position> {
        if (!navigator.geolocation) {
            throw new LocationError(
                'Geolocation is not supported',
                LocationErrorCode.UNSUPPORTED
            );
        }

        try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: this.config.enableHighAccuracy,
                    timeout: this.config.timeout,
                    maximumAge: this.config.maxAge
                });
            });

            return this.parsePosition(position);
        } catch (error) {
            if (error instanceof GeolocationPositionError) {
                throw parseGeolocationError(error);
            }
            throw new LocationError(
                'Failed to get current position',
                LocationErrorCode.UNKNOWN,
                error instanceof Error ? error : undefined
            );
        }
    }

    /**
     * Add location change listener
     */
    addLocationListener(callback: (position: Position) => void): () => void {
        this.locationListeners.add(callback);
        return () => this.locationListeners.delete(callback);
    }

    /**
     * Add error listener
     */
    addErrorListener(callback: (error: LocationError) => void): () => void {
        this.errorListeners.add(callback);
        return () => this.errorListeners.delete(callback);
    }

    /**
     * Get location history between two timestamps
     */
    async getLocationHistory(startTime: number, endTime: number): Promise<LocationHistoryEntry[]> {
        return await this.storage.getLocationHistory(startTime, endTime);
    }

    /**
     * Calculate distance to a target position
     */
    getDistanceToTarget(target: Position): number | null {
        if (!this.lastPosition) return null;

        return this.calculateDistance(this.lastPosition, target);
    }

    /**
     * Get bearing to target position
     */
    getBearingToTarget(target: Position): number | null {
        if (!this.lastPosition) return null;

        return this.calculateBearing(this.lastPosition, target);
    }

    /**
     * Check if we're within a certain distance of a target
     */
    isWithinRange(target: Position, range: number): boolean {
        const distance = this.getDistanceToTarget(target);
        return distance !== null && distance <= range;
    }

    private async handleNewPosition(position: Position): Promise<void> {
        // Check if we've moved far enough to record new position
        if (this.lastPosition) {
            const distance = this.calculateDistance(this.lastPosition, position);
            if (distance < this.config.minDistance) {
                return; // Haven't moved far enough
            }
        }

        // Save position to storage
        const locationEntry: LocationHistoryEntry = {
            timestamp: position.timestamp,
            position: position,
            accuracy: position.accuracy,
            speed: position.speed,
            heading: position.heading
        };
        await this.storage.saveLocation(locationEntry);

        // Update last position and notify listeners
        this.lastPosition = position;
        this.locationListeners.forEach(listener => listener(position));
    }

    private handleError(error: LocationError | GeolocationPositionError): void {
        const locationError = error instanceof LocationError
            ? error
            : parseGeolocationError(error);

        this.errorListeners.forEach(listener => listener(locationError));
    }

    private parsePosition(geoPosition: GeolocationPosition): Position {
        return {
            latitude: geoPosition.coords.latitude,
            longitude: geoPosition.coords.longitude,
            accuracy: geoPosition.coords.accuracy,
            altitude: geoPosition.coords.altitude,
            altitudeAccuracy: geoPosition.coords.altitudeAccuracy,
            heading: geoPosition.coords.heading,
            speed: geoPosition.coords.speed,
            timestamp: geoPosition.timestamp
        };
    }

    private calculateDistance(pos1: Position, pos2: Position): number {
        const R = 6371e3; // Earth's radius in meters
        const φ1 = (pos1.latitude * Math.PI) / 180;
        const φ2 = (pos2.latitude * Math.PI) / 180;
        const Δφ = ((pos2.latitude - pos1.latitude) * Math.PI) / 180;
        const Δλ = ((pos2.longitude - pos1.longitude) * Math.PI) / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // Distance in meters
    }

    private calculateBearing(pos1: Position, pos2: Position): number {
        const φ1 = (pos1.latitude * Math.PI) / 180;
        const φ2 = (pos2.latitude * Math.PI) / 180;
        const λ1 = (pos1.longitude * Math.PI) / 180;
        const λ2 = (pos2.longitude * Math.PI) / 180;

        const y = Math.sin(λ2 - λ1) * Math.cos(φ2);
        const x = Math.cos(φ1) * Math.sin(φ2) -
            Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1);

        const θ = Math.atan2(y, x);
        return (θ * 180 / Math.PI + 360) % 360; // Bearing in degrees
    }
}
