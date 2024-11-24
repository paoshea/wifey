import { openDB, IDBPDatabase, deleteDB } from 'idb';
import { trackError } from '@/lib/monitoring/sentry';
import type { CarrierCoverage, StorageMetadata } from '@/lib/types';

interface CacheEntry {
  points: CarrierCoverage[];
  expiresAt: number;
  bounds: BoundingBox;
}

interface BoundingBox {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

interface EnhancedOfflineDBSchema {
  coverageCache: {
    key: string;
    value: CacheEntry;
  };
  pendingPoints: {
    key: string;
    value: {
      id: string;
      data: Omit<CarrierCoverage, 'id'>;
      timestamp: number;
      retryCount: number;
      priority: number;
      status: 'pending' | 'processing' | 'failed';
      error?: string;
    };
  };
  metadata: {
    key: string;
    value: StorageMetadata;
  };
}

class EnhancedOfflineStorage {
  private static instance: EnhancedOfflineStorage;
  private db: IDBPDatabase<EnhancedOfflineDBSchema> | null = null;
  private initialized = false;
  private metadata: StorageMetadata = {
    version: 1,
    lastCleanup: Date.now(),
    totalSize: 0,
    quotaUsage: 0
  };

  private constructor() {}

  static getInstance(): EnhancedOfflineStorage {
    if (!EnhancedOfflineStorage.instance) {
      EnhancedOfflineStorage.instance = new EnhancedOfflineStorage();
    }
    return EnhancedOfflineStorage.instance;
  }

  private async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      this.db = await openDB('enhanced-offline-storage', 1, {
        upgrade(db) {
          if (!db.objectStoreNames.contains('pendingPoints')) {
            const store = db.createObjectStore('pendingPoints', { keyPath: 'id' });
            store.createIndex('by-status', 'status');
            store.createIndex('by-timestamp', 'timestamp');
          }
          if (!db.objectStoreNames.contains('coverageCache')) {
            db.createObjectStore('coverageCache', { keyPath: 'bounds' });
          }
          if (!db.objectStoreNames.contains('metadata')) {
            db.createObjectStore('metadata', { keyPath: 'version' });
          }
        },
      });
      this.initialized = true;
      const storedMetadata = await this.db.get('metadata', 'version');
      if (storedMetadata) {
        this.metadata = storedMetadata;
      } else {
        await this.db.put('metadata', this.metadata);
      }
    } catch (error) {
      trackError(error as Error, { context: 'initialize-offline-storage' });
      throw new Error('Failed to initialize offline storage');
    }
  }

  // Public methods for enhanced offline storage
  async storePendingPoint(
    data: Omit<CarrierCoverage, 'id'>,
    priority: number = 1
  ): Promise<string> {
    await this.initialize();
    
    try {
      if (!this.db) return '';
      const id = crypto.randomUUID();
      const compressedData = await this.compressData(data);
      
      await this.db.add('pendingPoints', {
        id,
        data: compressedData,
        timestamp: Date.now(),
        retryCount: 0,
        priority,
        status: 'pending'
      });

      await this.updateStorageUsage();
      return id;
    } catch (error) {
      trackError(error as Error, { context: 'store-pending-point' });
      throw new Error('Failed to store pending point');
    }
  }

  async getPendingPoints(
    status: 'pending' | 'processing' | 'failed' = 'pending',
    limit: number = 50
  ): Promise<Array<{
    id: string;
    data: Omit<CarrierCoverage, 'id'>;
    timestamp: number;
    retryCount: number;
    priority: number;
    status: string;
    error?: string;
  }>> {
    await this.initialize();

    try {
      if (!this.db) return [];
      const points = await this.db.getAllFromIndex('pendingPoints', 'by-status', status);
      const sortedPoints = points
        .sort((a, b) => b.priority - a.priority || a.timestamp - b.timestamp)
        .slice(0, limit);

      return await Promise.all(
        sortedPoints.map(async point => ({
          ...point,
          data: await this.decompressData(point.data)
        }))
      );
    } catch (error) {
      trackError(error as Error, { context: 'get-pending-points' });
      throw new Error('Failed to retrieve pending points');
    }
  }

  async updatePointStatus(
    id: string,
    status: 'pending' | 'processing' | 'failed',
    error?: string
  ): Promise<void> {
    await this.initialize();

    try {
      if (!this.db) return;
      const point = await this.db.get('pendingPoints', id);
      if (!point) throw new Error('Point not found');

      await this.db.put('pendingPoints', {
        ...point,
        status,
        error,
        retryCount: status === 'failed' ? point.retryCount + 1 : point.retryCount
      });
    } catch (error) {
      trackError(error as Error, { context: 'update-point-status' });
      throw new Error('Failed to update point status');
    }
  }

  async cacheCoverageData(
    points: CarrierCoverage[],
    bounds: BoundingBox,
    ttl: number = 60 * 60 * 1000 // 1 hour default
  ): Promise<void> {
    await this.initialize();

    try {
      if (!this.db) return;
      const compressedData = await this.compressData(points);
      
      await this.db.put('coverageCache', {
        data: compressedData,
        bounds,
        expiresAt: Date.now() + ttl
      });

      await this.updateStorageUsage();
    } catch (error) {
      trackError(error as Error, { context: 'cache-coverage-data' });
      throw new Error('Failed to cache coverage data');
    }
  }

  async getCachedCoverage(bounds: BoundingBox): Promise<CarrierCoverage[] | null> {
    if (!this.db) return null;

    try {
      const cached = await this.db.get('coverageCache', this.generateCacheKey(bounds));
      if (!cached || cached.expiresAt < Date.now()) {
        return null;
      }

      return cached.points;
    } catch (error) {
      trackError(new Error('Failed to get cached coverage'), { context: error });
      return null;
    }
  }

  async removePendingPoint(id: string): Promise<void> {
    await this.initialize();

    try {
      if (!this.db) return;
      await this.db.delete('pendingPoints', id);
      await this.updateStorageUsage();
    } catch (error) {
      trackError(error as Error, { context: 'remove-pending-point' });
      throw new Error('Failed to remove pending point');
    }
  }

  async getStorageStats(): Promise<{
    pendingPoints: number;
    cacheSize: number;
    storageUsage: number;
    quotaUsage: number;
    lastCleanup: Date;
  }> {
    await this.initialize();

    try {
      if (!this.db) return {
        pendingPoints: 0,
        cacheSize: 0,
        storageUsage: 0,
        quotaUsage: 0,
        lastCleanup: new Date(0)
      };

      const [pendingPoints, cacheEntries] = await Promise.all([
        this.db.count('pendingPoints'),
        this.db.count('coverageCache')
      ]);

      return {
        pendingPoints,
        cacheSize: cacheEntries,
        storageUsage: this.metadata.totalSize || 0,
        quotaUsage: this.metadata.quotaUsage || 0,
        lastCleanup: new Date(this.metadata.lastCleanup || 0)
      };
    } catch (error) {
      trackError(error as Error, { context: 'get-storage-stats' });
      throw new Error('Failed to get storage stats');
    }
  }

  async clearExpiredData(): Promise<void> {
    await this.initialize();
    await this.performCleanup();
  }

  async resetStorage(): Promise<void> {
    if (this.db) {
      const dbName = this.db.name;
      this.db.close();
      this.db = null;
      await deleteDB(dbName);
      await this.initialize();
    }
  }

  private async compressData<T>(data: T): Promise<T> {
    // Implement compression logic here
    return data;
  }

  private async decompressData<T>(data: T): Promise<T> {
    // Implement decompression logic here
    return data;
  }

  private async updateStorageUsage(): Promise<void> {
    if (!this.db) return;

    try {
      const [pendingSize, cacheSize] = await Promise.all([
        this.calculateStoreSize('pendingPoints'),
        this.calculateStoreSize('coverageCache')
      ]);

      const totalSize = pendingSize + cacheSize;
      const quota = await this.getStorageQuota();
      const quotaUsage = quota ? (totalSize / quota) * 100 : 0;

      const metadata = {
        ...this.metadata,
        totalSize,
        quotaUsage,
        lastUpdated: Date.now()
      };

      await this.db.put('metadata', metadata, 'stats');
      this.metadata = metadata;
    } catch (error) {
      trackError(new Error('Failed to update storage usage'), { context: error });
    }
  }

  private async calculateStoreSize(storeName: keyof EnhancedOfflineDBSchema): Promise<number> {
    if (!this.db) return 0;

    try {
      const allKeys = await this.db.getAllKeys(storeName);
      const allValues = await this.db.getAll(storeName);
      return allValues.reduce((total, value) => total + JSON.stringify(value).length, 0);
    } catch (error) {
      trackError(new Error(`Failed to calculate size for store: ${storeName}`), { context: error });
      return 0;
    }
  }

  private async performCleanup(): Promise<void> {
    // Implement cleanup logic here
    return;
  }

  // Utility method to check if storage is available
  async isStorageAvailable(): Promise<boolean> {
    try {
      await this.initialize();
      const testKey = 'storage-test';
      await this.db!.put('pendingPoints', { id: testKey, data: 'test' });
      await this.db!.delete('pendingPoints', testKey);
      return true;
    } catch {
      return false;
    }
  }

  private generateCacheKey(bounds: BoundingBox): string {
    return JSON.stringify(bounds);
  }

  private async getStorageQuota(): Promise<number | null> {
    try {
      const quota = await navigator.storage.estimate();
      return quota.quota ?? null;
    } catch {
      return null;
    }
  }
}

export const enhancedOfflineStorage = EnhancedOfflineStorage.getInstance();
