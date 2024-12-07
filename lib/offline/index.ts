import { OfflineDB } from './storage/db';

export class OfflineManager {
    private static instance: OfflineManager;
    public static readonly MAX_STORAGE_POINTS = 1000;
    private db: OfflineDB;
    private isOnline = true;
    private config: OfflineConfig | null = null;

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

    async storeCoveragePoint(point: CoveragePoint): Promise<void> {
        const points = await this.db.getCoveragePoints();

        // Check storage limit before storing
        if (points.length >= OfflineManager.MAX_STORAGE_POINTS) {
            // Find and remove oldest point
            const oldestPoint = points.reduce((oldest, current) =>
                current.timestamp < oldest.timestamp ? current : oldest
            );
            await this.db.removeCoveragePoint(oldestPoint.id);
        }

        // Store the new point
        await this.db.storeCoveragePoint(point);

        // Add to sync queue if offline
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
                if (item.retryCount >= maxRetries) {
                    await this.db.removePendingSyncItem(item.id);
                } else {
                    // Update retry count before removing old item
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
        const clusters: Map<string, PointCluster> = new Map();
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
