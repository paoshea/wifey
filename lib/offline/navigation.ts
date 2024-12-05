import { Position, CoveragePoint, NavigationUpdate } from './types';
import { LocationTracker } from './location-tracker';
import { OfflineStorage } from './storage';
import { LocationError, LocationErrorCode } from './errors';

export interface NavigationOptions {
    updateInterval?: number;  // milliseconds
    targetRadius?: number;    // meters
    speedEstimate?: number;   // meters per second
}

export class NavigationService {
    private static instance: NavigationService;
    private locationTracker: LocationTracker;
    private storage: OfflineStorage;
    private isNavigating: boolean = false;
    private target: CoveragePoint | null = null;
    private navigationListeners: Set<(update: NavigationUpdate) => void> = new Set();
    private options: Required<NavigationOptions>;
    private updateIntervalId: number | null = null;

    private constructor() {
        this.locationTracker = LocationTracker.getInstance();
        this.storage = OfflineStorage.getInstance();
        this.options = {
            updateInterval: 1000,    // Update every second
            targetRadius: 20,        // Consider arrived within 20 meters
            speedEstimate: 1.4       // Average walking speed (1.4 m/s)
        };
    }

    static getInstance(): NavigationService {
        if (!NavigationService.instance) {
            NavigationService.instance = new NavigationService();
        }
        return NavigationService.instance;
    }

    /**
     * Configure navigation options
     */
    configure(options: NavigationOptions): void {
        this.options = { ...this.options, ...options };
    }

    /**
     * Start navigation to nearest coverage point
     */
    async startNavigationToNearestCoverage(): Promise<void> {
        try {
            const currentPosition = await this.locationTracker.getCurrentPosition();
            const nearestPoints = await this.storage.getNearestCoveragePoints(currentPosition, 10000); // Search within 10km

            if (nearestPoints.length === 0) {
                throw new LocationError(
                    'No coverage points found within range',
                    LocationErrorCode.POSITION_UNAVAILABLE
                );
            }

            await this.startNavigation(nearestPoints[0]);
        } catch (error) {
            if (error instanceof LocationError) {
                throw error;
            }
            throw new LocationError(
                'Failed to start navigation',
                LocationErrorCode.UNKNOWN,
                error instanceof Error ? error : undefined
            );
        }
    }

    /**
     * Start navigation to specific coverage point
     */
    async startNavigation(target: CoveragePoint): Promise<void> {
        if (this.isNavigating) {
            this.stopNavigation();
        }

        this.target = target;
        this.isNavigating = true;

        // Start location tracking if not already started
        await this.locationTracker.startTracking();

        // Start sending navigation updates
        this.updateIntervalId = window.setInterval(
            () => this.sendNavigationUpdate(),
            this.options.updateInterval
        );

        // Add location listener for continuous updates
        this.locationTracker.addLocationListener((position) => {
            if (this.isNavigating) {
                this.handlePositionUpdate(position);
            }
        });
    }

    /**
     * Stop navigation
     */
    stopNavigation(): void {
        this.isNavigating = false;
        this.target = null;
        if (this.updateIntervalId !== null) {
            clearInterval(this.updateIntervalId);
            this.updateIntervalId = null;
        }
    }

    /**
     * Add navigation update listener
     */
    addNavigationListener(callback: (update: NavigationUpdate) => void): () => void {
        this.navigationListeners.add(callback);
        return () => this.navigationListeners.delete(callback);
    }

    /**
     * Check if currently navigating
     */
    isCurrentlyNavigating(): boolean {
        return this.isNavigating;
    }

    /**
     * Get current target
     */
    getCurrentTarget(): CoveragePoint | null {
        return this.target;
    }

    private async handlePositionUpdate(position: Position): Promise<void> {
        if (!this.target) return;

        const distance = this.locationTracker.getDistanceToTarget(this.target.position);

        // Check if we've reached the target
        if (distance !== null && distance <= this.options.targetRadius) {
            await this.handleArrival(position);
        }
    }

    private async sendNavigationUpdate(): Promise<void> {
        if (!this.isNavigating || !this.target) return;

        try {
            const currentPosition = await this.locationTracker.getCurrentPosition();
            const distance = this.locationTracker.getDistanceToTarget(this.target.position);
            const bearing = this.locationTracker.getBearingToTarget(this.target.position);

            if (distance === null || bearing === null) return;

            const update: NavigationUpdate = {
                currentPosition,
                targetPosition: this.target.position,
                distance,
                bearing,
                estimatedTime: this.calculateEstimatedTime(distance),
                nextInstruction: this.generateInstruction(distance, bearing)
            };

            this.navigationListeners.forEach(listener => listener(update));
        } catch (error) {
            console.error('Failed to send navigation update:', error);
        }
    }

    private async handleArrival(currentPosition: Position): Promise<void> {
        if (!this.target) return;

        const finalUpdate: NavigationUpdate = {
            currentPosition,
            targetPosition: this.target.position,
            distance: 0,
            bearing: 0,
            estimatedTime: 0,
            nextInstruction: 'You have arrived at the coverage point'
        };

        this.navigationListeners.forEach(listener => listener(finalUpdate));
        this.stopNavigation();
    }

    private calculateEstimatedTime(distance: number): number {
        return Math.ceil(distance / this.options.speedEstimate);
    }

    private generateInstruction(distance: number, bearing: number): string {
        // Convert bearing to cardinal direction
        const direction = this.getCardinalDirection(bearing);

        // Format distance
        let formattedDistance: string;
        if (distance > 1000) {
            formattedDistance = `${(distance / 1000).toFixed(1)} kilometers`;
        } else {
            formattedDistance = `${Math.round(distance)} meters`;
        }

        // Generate appropriate instruction based on distance
        if (distance <= this.options.targetRadius) {
            return 'You have arrived at the coverage point';
        } else if (distance <= 50) {
            return `Coverage point is ${formattedDistance} ahead`;
        } else {
            return `Head ${direction} for ${formattedDistance} to reach the coverage point`;
        }
    }

    private getCardinalDirection(bearing: number): string {
        const directions = ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest'];
        const index = Math.round(bearing / 45) % 8;
        return directions[index];
    }
}
