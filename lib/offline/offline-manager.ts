import { LocationTracker } from './location-tracker';
import { NavigationService } from './navigation';
import { CoverageReporter } from './coverage-reporter';
import { SyncService } from './sync-service';
import { OfflineStorage } from './storage';
import { OfflineConfig, Position, CoveragePoint, NavigationUpdate, SyncStatus } from './types';
import { LocationError, LocationErrorCode } from './errors';

export class OfflineManager {
    private static instance: OfflineManager;
    private locationTracker: LocationTracker;
    private navigationService: NavigationService;
    private coverageReporter: CoverageReporter;
    private syncService: SyncService;
    private storage: OfflineStorage;

    private constructor() {
        this.locationTracker = LocationTracker.getInstance();
        this.navigationService = NavigationService.getInstance();
        this.coverageReporter = CoverageReporter.getInstance();
        this.syncService = SyncService.getInstance();
        this.storage = OfflineStorage.getInstance();
    }

    static getInstance(): OfflineManager {
        if (!OfflineManager.instance) {
            OfflineManager.instance = new OfflineManager();
        }
        return OfflineManager.instance;
    }

    /**
     * Initialize offline functionality
     */
    async initialize(config?: Partial<OfflineConfig>): Promise<void> {
        try {
            // Initialize storage first
            await this.storage.initialize();

            // Configure services if config provided
            if (config) {
                if (config.location) {
                    this.locationTracker.configure(config.location);
                }
                if (config.sync) {
                    this.syncService.configure(config.sync);
                }
            }

            // Start auto-sync
            this.syncService.startAutoSync();
        } catch (error) {
            throw new LocationError(
                'Failed to initialize offline functionality',
                LocationErrorCode.UNKNOWN,
                error instanceof Error ? error : undefined
            );
        }
    }

    /**
     * Find nearest coverage point and start navigation
     */
    async findAndNavigateToCoverage(): Promise<void> {
        try {
            await this.navigationService.startNavigationToNearestCoverage();
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
     * Get nearby coverage points within a radius
     */
    async getNearbyPoints(radius: number): Promise<CoveragePoint[]> {
        try {
            const position = await this.locationTracker.getCurrentPosition();
            return await this.storage.getNearestCoveragePoints(position, radius);
        } catch (error) {
            if (error instanceof LocationError) {
                throw error;
            }
            throw new LocationError(
                'Failed to get nearby points',
                LocationErrorCode.UNKNOWN,
                error instanceof Error ? error : undefined
            );
        }
    }

    /**
     * Start coverage measurement at current location
     */
    async startCoverageMeasurement(): Promise<void> {
        await this.coverageReporter.startMeasuring();
    }

    /**
     * Stop coverage measurement and create report
     */
    async stopAndReportCoverage(notes?: string): Promise<CoveragePoint> {
        const coveragePoint = await this.coverageReporter.createReport(notes);
        this.coverageReporter.stopMeasuring();
        return coveragePoint;
    }

    /**
     * Stop all active processes
     */
    stopAll(): void {
        this.locationTracker.stopTracking();
        this.navigationService.stopNavigation();
        this.coverageReporter.stopMeasuring();
        this.syncService.stopAutoSync();
    }

    /**
     * Add navigation update listener
     */
    onNavigationUpdate(callback: (update: NavigationUpdate) => void): () => void {
        return this.navigationService.addNavigationListener(callback);
    }

    /**
     * Add sync progress listener
     */
    onSyncProgress(callback: (progress: {
        total: number;
        completed: number;
        failed: number;
        remaining: number
    }) => void): () => void {
        return this.syncService.addProgressListener(callback);
    }

    /**
     * Get current location
     */
    async getCurrentLocation(): Promise<Position> {
        return await this.locationTracker.getCurrentPosition();
    }

    /**
     * Get sync status
     */
    async getSyncStatus(): Promise<SyncStatus> {
        return await this.syncService.getSyncStatus();
    }

    /**
     * Force sync
     */
    async syncNow(): Promise<void> {
        await this.syncService.sync();
    }

    /**
     * Check if currently navigating
     */
    isNavigating(): boolean {
        return this.navigationService.isCurrentlyNavigating();
    }

    /**
     * Get storage usage statistics
     */
    async getStorageUsage(): Promise<{ [key: string]: number }> {
        return await this.storage.getStorageUsage();
    }

    /**
     * Clear all stored data
     */
    async clearAllData(): Promise<void> {
        this.stopAll();
        await this.storage.clearAll();
    }

    /**
     * Get current target coverage point
     */
    getCurrentTarget(): CoveragePoint | null {
        return this.navigationService.getCurrentTarget();
    }

    /**
     * Check if currently measuring coverage
     */
    isMeasuring(): boolean {
        return this.coverageReporter.isMeasuring();
    }

    /**
     * Check if currently syncing
     */
    async isSyncing(): Promise<boolean> {
        const status = await this.getSyncStatus();
        return status.pendingItems > 0;
    }

    /**
     * Add location update listener
     */
    onLocationUpdate(callback: (position: Position) => void): () => void {
        return this.locationTracker.addLocationListener(callback);
    }

    /**
     * Add error listener
     */
    onError(callback: (error: LocationError) => void): () => void {
        return this.locationTracker.addErrorListener(callback);
    }
}
