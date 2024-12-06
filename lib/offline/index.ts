import { OfflineDB } from './storage/db';

export class OfflineManager {
    private static instance: OfflineManager;
    public static readonly MAX_STORAGE_POINTS = 1000;
    private db: OfflineDB;
    private isOnline = true;

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
        this.db.initialize();
    }

    async setOnlineStatus(status: boolean): Promise<void> {
        this.isOnline = status;
    }

    async storeCoveragePoint(point: CoveragePoint): Promise<void> {
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

    async syncPendingItems(): Promise<void> {
        if (!this.isOnline) return;

        const items = await this.db.getPendingSyncItems();
        for (const item of items) {
            try {
                await fetch('/api/sync', {
                    method: 'POST',
                    body: JSON.stringify(item.data),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                await this.db.removePendingSyncItem(item.id);
            } catch (error) {
                // Increment retry count and keep in queue
                await this.db.addPendingSync({
                    ...item,
                    retryCount: item.retryCount + 1
                });
            }
        }
    }

    async findCoveragePointsInRegion(region: Region): Promise<CoveragePoint[]> {
        const points = await this.db.getCoveragePoints();
        return points.filter(point => this.isPointInRegion(point, region));
    }

    async findClusteredPoints(region: Region): Promise<PointCluster[]> {
        const points = await this.findCoveragePointsInRegion(region);
        const clusters: Map<string, PointCluster> = new Map();

        points.forEach(point => {
            const key = `${Math.round(point.latitude * 1000)},${Math.round(point.longitude * 1000)}`;
            const existing = clusters.get(key);

            if (existing) {
                existing.pointCount++;
                // Update center
                existing.latitude = (existing.latitude * (existing.pointCount - 1) + point.latitude) / existing.pointCount;
                existing.longitude = (existing.longitude * (existing.pointCount - 1) + point.longitude) / existing.pointCount;
            } else {
                clusters.set(key, {
                    latitude: point.latitude,
                    longitude: point.longitude,
                    pointCount: 1
                });
            }
        });

        return Array.from(clusters.values());
    }

    async clearAllData(): Promise<void> {
        await this.db.clearAllData();
    }

    private isPointInRegion(point: CoveragePoint, region: Region): boolean {
        const latDiff = Math.abs(point.latitude - region.latitude);
        const lonDiff = Math.abs(point.longitude - region.longitude);
        return latDiff <= region.latitudeDelta / 2 && lonDiff <= region.longitudeDelta / 2;
    }
}

interface OfflineConfig {
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
