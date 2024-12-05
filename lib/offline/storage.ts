import {
    Position,
    MeasurementData,
    CoverageReport,
    MapTile,
    CoveragePoint,
    LocationHistoryEntry,
    PendingReport
} from './types';

const DB_NAME = 'wifey_offline';
const DB_VERSION = 1;

interface DBSchema {
    mapTiles: {
        key: string; // `${z}-${x}-${y}`
        value: MapTile;
    };
    coveragePoints: {
        key: number; // Auto-incrementing ID
        value: CoveragePoint;
    };
    locationHistory: {
        key: number; // Timestamp
        value: LocationHistoryEntry;
    };
    pendingReports: {
        key: number; // Auto-incrementing ID
        value: PendingReport;
    };
}

export class OfflineStorage {
    private static instance: OfflineStorage;
    private db: IDBDatabase | null = null;

    private constructor() { }

    static getInstance(): OfflineStorage {
        if (!OfflineStorage.instance) {
            OfflineStorage.instance = new OfflineStorage();
        }
        return OfflineStorage.instance;
    }

    async initialize(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                reject(new Error('Failed to open database'));
            };

            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                // Map tiles store
                if (!db.objectStoreNames.contains('mapTiles')) {
                    const mapTilesStore = db.createObjectStore('mapTiles', { keyPath: 'key' });
                    mapTilesStore.createIndex('timestamp', 'timestamp');
                    mapTilesStore.createIndex('expires', 'expires');
                }

                // Coverage points store
                if (!db.objectStoreNames.contains('coveragePoints')) {
                    const coveragePointsStore = db.createObjectStore('coveragePoints', { keyPath: 'id', autoIncrement: true });
                    coveragePointsStore.createIndex('position', ['position.latitude', 'position.longitude']);
                    coveragePointsStore.createIndex('synced', 'synced');
                }

                // Location history store
                if (!db.objectStoreNames.contains('locationHistory')) {
                    const locationHistoryStore = db.createObjectStore('locationHistory', { keyPath: 'timestamp' });
                    locationHistoryStore.createIndex('position', ['position.latitude', 'position.longitude']);
                }

                // Pending reports store
                if (!db.objectStoreNames.contains('pendingReports')) {
                    const pendingReportsStore = db.createObjectStore('pendingReports', { keyPath: 'id', autoIncrement: true });
                    pendingReportsStore.createIndex('lastAttempt', 'lastAttempt');
                    pendingReportsStore.createIndex('attempts', 'attempts');
                }
            };
        });
    }

    // Map Tiles Methods
    async saveMapTile(z: number, x: number, y: number, data: Blob): Promise<void> {
        const key = `${z}-${x}-${y}`;
        const tile: MapTile = {
            key,
            data,
            timestamp: Date.now(),
            expires: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days expiration
        };

        await this.putItem('mapTiles', tile);
    }

    async getMapTile(z: number, x: number, y: number): Promise<Blob | null> {
        const key = `${z}-${x}-${y}`;
        const tile = await this.getItem('mapTiles', key);
        if (!tile || Date.now() > tile.expires) {
            return null;
        }
        return tile.data;
    }

    async clearExpiredTiles(): Promise<void> {
        const store = await this.getStore('mapTiles', 'readwrite');
        const index = store.index('expires');
        const range = IDBKeyRange.upperBound(Date.now());

        return new Promise((resolve, reject) => {
            const request = index.openCursor(range);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                const cursor = request.result;
                if (cursor) {
                    cursor.delete();
                    cursor.continue();
                } else {
                    resolve();
                }
            };
        });
    }

    // Coverage Points Methods
    async saveCoveragePoint(point: Omit<CoveragePoint, 'id'>): Promise<number> {
        return await this.addItem('coveragePoints', point);
    }

    async getCoveragePoints(synced?: boolean): Promise<CoveragePoint[]> {
        const store = await this.getStore('coveragePoints');
        const index = store.index('synced');
        const range = synced !== undefined ? IDBKeyRange.only(synced) : undefined;

        return new Promise((resolve, reject) => {
            const request = range ? index.getAll(range) : store.getAll();

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    async getNearestCoveragePoints(position: Position, radius: number): Promise<CoveragePoint[]> {
        const points = await this.getCoveragePoints();
        return points
            .map(point => ({
                point,
                distance: this.calculateDistance(position, point.position)
            }))
            .filter(({ distance }) => distance <= radius)
            .sort((a, b) => a.distance - b.distance)
            .map(({ point }) => point);
    }

    async updateCoveragePoint(id: number, updates: Partial<CoveragePoint>): Promise<void> {
        const point = await this.getItem('coveragePoints', id);
        if (!point) throw new Error('Coverage point not found');

        await this.putItem('coveragePoints', { ...point, ...updates });
    }

    // Location History Methods
    async saveLocation(location: LocationHistoryEntry): Promise<void> {
        await this.putItem('locationHistory', location);
    }

    async getLocationHistory(start: number, end: number): Promise<LocationHistoryEntry[]> {
        const store = await this.getStore('locationHistory');
        const range = IDBKeyRange.bound(start, end);

        return new Promise((resolve, reject) => {
            const request = store.getAll(range);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    // Pending Reports Methods
    async queueReport(report: CoverageReport): Promise<number> {
        const pendingReport: Omit<PendingReport, 'id'> = {
            report,
            attempts: 0,
            lastAttempt: 0
        };
        return await this.addItem('pendingReports', pendingReport);
    }

    async getPendingReports(): Promise<PendingReport[]> {
        return await this.getAllItems('pendingReports');
    }

    async updateReportAttempt(id: number, error?: string): Promise<void> {
        const report = await this.getItem('pendingReports', id);
        if (!report) throw new Error('Report not found');

        await this.putItem('pendingReports', {
            ...report,
            attempts: report.attempts + 1,
            lastAttempt: Date.now(),
            error
        });
    }

    async removeReport(id: number): Promise<void> {
        await this.deleteItem('pendingReports', id);
    }

    // Storage Management
    async getStorageUsage(): Promise<{ [K in keyof DBSchema]: number }> {
        const usage: { [K in keyof DBSchema]: number } = {
            mapTiles: 0,
            coveragePoints: 0,
            locationHistory: 0,
            pendingReports: 0
        };

        for (const storeName of Object.keys(usage) as (keyof DBSchema)[]) {
            const store = await this.getStore(storeName);
            const request = store.count();
            usage[storeName] = await new Promise((resolve, reject) => {
                request.onerror = () => reject(request.error);
                request.onsuccess = () => resolve(request.result);
            });
        }

        return usage;
    }

    async clearAll(): Promise<void> {
        const stores: (keyof DBSchema)[] = ['mapTiles', 'coveragePoints', 'locationHistory', 'pendingReports'];
        for (const store of stores) {
            await this.clearStore(store);
        }
    }

    // Private helper methods
    private async getStore(name: keyof DBSchema, mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
        if (!this.db) {
            await this.initialize();
        }
        if (!this.db) throw new Error('Database not initialized');

        const transaction = this.db.transaction(name, mode);
        return transaction.objectStore(name);
    }

    private async getItem<T extends keyof DBSchema>(
        storeName: T,
        key: DBSchema[T]['key']
    ): Promise<DBSchema[T]['value'] | null> {
        const store = await this.getStore(storeName);
        return new Promise((resolve, reject) => {
            const request = store.get(key);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result || null);
        });
    }

    private async getAllItems<T extends keyof DBSchema>(
        storeName: T
    ): Promise<DBSchema[T]['value'][]> {
        const store = await this.getStore(storeName);
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    private async putItem<T extends keyof DBSchema>(
        storeName: T,
        value: DBSchema[T]['value']
    ): Promise<void> {
        const store = await this.getStore(storeName, 'readwrite');
        return new Promise((resolve, reject) => {
            const request = store.put(value);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }

    private async addItem<T extends keyof DBSchema>(
        storeName: T,
        value: Omit<DBSchema[T]['value'], 'id'>
    ): Promise<number> {
        const store = await this.getStore(storeName, 'readwrite');
        return new Promise((resolve, reject) => {
            const request = store.add(value);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result as number);
        });
    }

    private async deleteItem<T extends keyof DBSchema>(
        storeName: T,
        key: DBSchema[T]['key']
    ): Promise<void> {
        const store = await this.getStore(storeName, 'readwrite');
        return new Promise((resolve, reject) => {
            const request = store.delete(key);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }

    private async clearStore(storeName: keyof DBSchema): Promise<void> {
        const store = await this.getStore(storeName, 'readwrite');
        return new Promise((resolve, reject) => {
            const request = store.clear();
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
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
}
