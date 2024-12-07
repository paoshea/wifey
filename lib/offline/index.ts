import { LocationError, LocationErrorCode, parseGeolocationError } from './errors';
import { OfflineDB } from './storage/db';

export { LocationError, LocationErrorCode, parseGeolocationError } from './errors';

export interface NavigationUpdate {
    distance: number;
    estimatedTime: number;
    nextInstruction: string;
}

export interface SyncStatus {
    isOnline: boolean;
    pendingItems: number;
    syncErrors: Array<{
        error: string;
        timestamp: number;
    }>;
}

export interface MeasurementData {
    signalStrength: number;
    networkType: 'wifi' | 'cellular';
    networkSubtype: string;
    timestamp: number;
    accuracy: number;
    connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface CoveragePoint {
    id: string;
    latitude: number;
    longitude: number;
    timestamp: number;
    signalStrength: number;
    reliability: number;
    type: 'wifi' | 'cellular';
    averageStrength: number;
    lastUpdated: number;
    measurements?: MeasurementData[];
}

export interface OfflineConfig {
    location: {
        trackingInterval: number;
        minDistance: number;
        maxAge: number;
        timeout: number;
        enableHighAccuracy: boolean;
    };
    sync: {
        autoSyncInterval: number;
        maxRetries: number;
        retryDelay: number;
    };
    map: {
        maxZoom: number;
        minZoom: number;
        tileExpiration: number;
        preloadRadius: number;
    };
}

export interface Region {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
}

export interface PointCluster {
    latitude: number;
    longitude: number;
    pointCount: number;
}

export class OfflineManager {
    private static instance: OfflineManager;
    public static readonly MAX_STORAGE_POINTS = 1000;
    private db: OfflineDB;
    private isOnline = true;
    private config: OfflineConfig | null = null;
    private currentTarget: CoveragePoint | null = null;
    private navigationListeners: ((update: NavigationUpdate) => void)[] = [];
    private errorListeners: ((error: LocationError) => void)[] = [];
    private measuring = false;
    private navigating = false;
    private syncErrors: Array<{ error: string; timestamp: number }> = [];

    private constructor() {
        this.db = OfflineDB.getInstance();
    }

    public static getInstance(): OfflineManager {
        if (!OfflineManager.instance) {
            OfflineManager.instance = new OfflineManager();
        }
        return OfflineManager.instance;
    }

    async initialize(config: OfflineConfig): Promise<void> {
        this.config = config;
        await this.db.initialize();
    }

    async setOnlineStatus(status: boolean): Promise<void> {
        this.isOnline = status;
    }

    async getCurrentLocation(): Promise<{ latitude: number; longitude: number }> {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new LocationError(
                    'Geolocation is not supported',
                    LocationErrorCode.UNSUPPORTED
                ));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    });
                },
                (error) => {
                    reject(parseGeolocationError(error));
                },
                {
                    enableHighAccuracy: this.config?.location.enableHighAccuracy ?? true,
                    timeout: this.config?.location.timeout ?? 10000,
                    maximumAge: this.config?.location.maxAge ?? 0
                }
            );
        });
    }

    async getSyncStatus(): Promise<SyncStatus> {
        const pendingItems = await this.getPendingSyncCount();
        return {
            isOnline: this.isOnline,
            pendingItems,
            syncErrors: this.syncErrors
        };
    }

    isMeasuring(): boolean {
        return this.measuring;
    }

    isNavigating(): boolean {
        return this.navigating;
    }

    async syncNow(): Promise<void> {
        if (!this.isOnline) {
            throw new Error('Cannot sync while offline');
        }
        await this.syncPendingItems();
    }

    onError(callback: (error: LocationError) => void): () => void {
        this.errorListeners.push(callback);
        return () => {
            this.errorListeners = this.errorListeners.filter(cb => cb !== callback);
        };
    }

    private notifyError(error: LocationError): void {
        this.errorListeners.forEach(callback => callback(error));
    }

    onNavigationUpdate(callback: (update: NavigationUpdate) => void): () => void {
        this.navigationListeners.push(callback);
        return () => {
            this.navigationListeners = this.navigationListeners.filter(cb => cb !== callback);
        };
    }

    async findAndNavigateToCoverage(): Promise<void> {
        this.navigating = true;
        try {
            // Implementation would go here
            // For now, just simulate finding a coverage point
            this.currentTarget = {
                id: 'test-point',
                latitude: 0,
                longitude: 0,
                timestamp: Date.now(),
                signalStrength: -70,
                reliability: 0.85,
                type: 'cellular',
                averageStrength: -75,
                lastUpdated: Date.now()
            };

            // Simulate navigation update
            this.navigationListeners.forEach(callback => {
                callback({
                    distance: 500,
                    estimatedTime: 300,
                    nextInstruction: "Head north for 500 meters"
                });
            });
        } catch (error) {
            if (error instanceof LocationError) {
                this.notifyError(error);
            } else {
                this.notifyError(new LocationError(
                    'Failed to find coverage',
                    LocationErrorCode.UNKNOWN,
                    error instanceof Error ? error : undefined
                ));
            }
            throw error;
        }
    }

    getCurrentTarget(): CoveragePoint | null {
        return this.currentTarget;
    }

    async startCoverageMeasurement(): Promise<void> {
        this.measuring = true;
        // Implementation would go here
    }

    async stopAndReportCoverage(notes?: string): Promise<void> {
        this.measuring = false;
        // Implementation would go here
    }

    stopAll(): void {
        this.measuring = false;
        this.navigating = false;
        this.navigationListeners = [];
        this.currentTarget = null;
    }

    async storeCoveragePoint(point: CoveragePoint): Promise<void> {
        const points = await this.db.getCoveragePoints();

        if (points.length >= OfflineManager.MAX_STORAGE_POINTS) {
            const oldestPoint = points.reduce((oldest, current) =>
                current.timestamp < oldest.timestamp ? current : oldest
            );
            await this.db.removeCoveragePoint(oldestPoint.id);
        }

        await this.db.storeCoveragePoint(point);

        if (!this.isOnline) {
            await this.db.addPendingSync({
                id: `sync-${point.id}`,
                type: 'coverage_point',
                data: point,
                timestamp: Date.now(),
                retryCount: 0
            });
        }
    }

    async getCoveragePoint(id: string): Promise<CoveragePoint | null> {
        return this.db.getCoveragePoint(id);
    }

    async getCoveragePointCount(): Promise<number> {
        const points = await this.db.getCoveragePoints();
        return points.length;
    }

    async getPendingSyncCount(): Promise<number> {
        const items = await this.db.getPendingSyncItems();
        return items.length;
    }

    async getNearbyPoints(radius: number): Promise<CoveragePoint[]> {
        const currentLocation = await this.getCurrentLocation();
        const points = await this.db.getCoveragePoints();

        return points.filter(point => {
            const distance = Math.sqrt(
                Math.pow(point.latitude - currentLocation.latitude, 2) +
                Math.pow(point.longitude - currentLocation.longitude, 2)
            ) * 111000; // Convert to meters (roughly)
            return distance <= radius;
        });
    }

    async syncPendingItems(): Promise<void> {
        if (!this.isOnline) return;

        const items = await this.db.getPendingSyncItems();
        const maxRetries = this.config?.sync.maxRetries ?? 3;
        const retryDelay = this.config?.sync.retryDelay ?? 1000;

        for (const item of items) {
            try {
                const response = await fetch('/api/sync', {
                    method: 'POST',
                    body: JSON.stringify(item.data),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error(`Sync failed with status: ${response.status}`);
                }

                await this.db.removePendingSyncItem(item.id);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                this.syncErrors.push({
                    error: errorMessage,
                    timestamp: Date.now()
                });

                if (item.retryCount >= maxRetries) {
                    await this.db.removePendingSyncItem(item.id);
                } else {
                    const updatedItem = {
                        ...item,
                        retryCount: item.retryCount + 1
                    };
                    await this.db.removePendingSyncItem(item.id);
                    await this.db.addPendingSync(updatedItem);
                }
                await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
        }
    }

    async findCoveragePointsInRegion(region: Region): Promise<CoveragePoint[]> {
        const points = await this.db.getCoveragePoints();
        return points.filter(point => {
            const latDiff = Math.abs(point.latitude - region.latitude);
            const lonDiff = Math.abs(point.longitude - region.longitude);
            const latRadius = region.latitudeDelta / 2;
            const lonRadius = region.longitudeDelta / 2;
            return latDiff <= latRadius && lonDiff <= lonRadius;
        });
    }

    async findClusteredPoints(region: Region): Promise<PointCluster[]> {
        const points = await this.findCoveragePointsInRegion(region);
        const clusters = new Map<string, PointCluster>();
        const gridSize = 0.01; // Approximately 1km at equator

        for (const point of points) {
            const gridLat = Math.floor(point.latitude / gridSize);
            const gridLon = Math.floor(point.longitude / gridSize);
            const key = `${gridLat},${gridLon}`;

            const existing = clusters.get(key);
            if (existing) {
                existing.pointCount++;
                const weight = 1 / existing.pointCount;
                existing.latitude = existing.latitude * (1 - weight) + point.latitude * weight;
                existing.longitude = existing.longitude * (1 - weight) + point.longitude * weight;
            } else {
                clusters.set(key, {
                    latitude: point.latitude,
                    longitude: point.longitude,
                    pointCount: 1
                });
            }
        }

        return Array.from(clusters.values());
    }

    async clearAllData(): Promise<void> {
        await this.db.clearAllData();
    }
}
