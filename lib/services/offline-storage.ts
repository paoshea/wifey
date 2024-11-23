import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { CarrierCoverage } from '@/lib/carriers/types';

interface OfflineDBSchema extends DBSchema {
  pendingCoveragePoints: {
    key: string;
    value: {
      id: string;
      data: Omit<CarrierCoverage, 'id'>;
      timestamp: number;
      retryCount: number;
    };
    indexes: { 'by-timestamp': number };
  };
  coverageCache: {
    key: string;
    value: {
      points: CarrierCoverage[];
      timestamp: number;
      bounds: {
        minLat: number;
        maxLat: number;
        minLng: number;
        maxLng: number;
      };
    };
  };
}

type BoundingBox = {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
};

type PendingPoint = {
  id: string;
  data: Omit<CarrierCoverage, 'id'>;
  timestamp: number;
  retryCount: number;
};

interface SyncManager {
  register(tag: string): Promise<void>;
}

interface SyncServiceWorkerRegistration extends ServiceWorkerRegistration {
  sync: SyncManager;
}

export class OfflineStorage {
  private static instance: OfflineStorage;
  private db: IDBPDatabase<OfflineDBSchema> | null = null;
  private syncInProgress = false;

  private constructor() {}

  static getInstance(): OfflineStorage {
    if (!OfflineStorage.instance) {
      OfflineStorage.instance = new OfflineStorage();
    }
    return OfflineStorage.instance;
  }

  async initialize(): Promise<void> {
    if (!this.db) {
      this.db = await openDB<OfflineDBSchema>('wifey-offline', 1, {
        upgrade(db) {
          // Store for pending coverage points
          const pendingStore = db.createObjectStore('pendingCoveragePoints', {
            keyPath: 'id'
          });
          pendingStore.createIndex('by-timestamp', 'timestamp');

          // Store for cached coverage data
          db.createObjectStore('coverageCache', {
            keyPath: 'bounds'
          });
        },
      });

      // Listen for online/offline events
      window.addEventListener('online', () => this.syncPendingPoints());
      window.addEventListener('offline', () => this.handleOffline());
    }
  }

  // Store a coverage point for later sync
  async storePendingPoint(data: Omit<CarrierCoverage, 'id'>): Promise<string> {
    await this.initialize();
    
    const id = crypto.randomUUID();
    await this.db!.add('pendingCoveragePoints', {
      id,
      data,
      timestamp: Date.now(),
      retryCount: 0,
    });

    // Try to sync immediately if we're online
    if (navigator.onLine) {
      this.syncPendingPoints();
    }

    return id;
  }

  // Get all pending points
  async getPendingPoints(): Promise<Array<{
    id: string;
    data: Omit<CarrierCoverage, 'id'>;
    timestamp: number;
  }>> {
    await this.initialize();
    return this.db!.getAllFromIndex('pendingCoveragePoints', 'by-timestamp');
  }

  // Cache coverage data for offline use
  async cacheCoverageData(
    points: CarrierCoverage[],
    bounds: BoundingBox
  ): Promise<void> {
    await this.initialize();
    await this.db!.put('coverageCache', {
      points,
      timestamp: Date.now(),
      bounds,
    });
  }

  // Get cached coverage data
  async getCachedCoverage(bounds: BoundingBox): Promise<CarrierCoverage[] | null> {
    await this.initialize();
    if (!this.db) return null;
    
    const key = JSON.stringify(bounds);
    const cached = await this.db.get('coverageCache', key);
    
    if (cached && Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) { // 24 hours
      return cached.points;
    }
    return null;
  }

  // Sync pending points with server
  private async syncPendingPoints(): Promise<void> {
    if (this.syncInProgress || !navigator.onLine || !this.db) return;

    try {
      this.syncInProgress = true;
      const pending = await this.getPendingPoints();

      for (const point of pending) {
        try {
          const response = await fetch('/api/coverage/contribute', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(point.data),
          });

          if (response.ok) {
            await this.db.delete('pendingCoveragePoints', point.id);
          } else {
            // Update retry count and timestamp
            const updatedPoint = {
              id: point.id,
              data: point.data,
              timestamp: Date.now(),
              retryCount: ((point as PendingPoint).retryCount || 0) + 1
            };
            await this.db.put('pendingCoveragePoints', updatedPoint);
          }
        } catch (error) {
          console.error('Failed to sync point:', error);
        }
      }
    } finally {
      this.syncInProgress = false;
    }
  }

  // Handle going offline
  private handleOffline(): void {
    // Could show offline notification or update UI
    console.log('App is offline. Changes will be synced when connection is restored.');
  }

  // Clear old cached data
  async clearOldCache(): Promise<void> {
    await this.initialize();
    if (!this.db) return;
    
    const now = Date.now();
    const MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

    // Clear old coverage cache
    const allCache = await this.db.getAll('coverageCache');
    for (const cache of allCache) {
      if (now - cache.timestamp > MAX_AGE) {
        await this.db.delete('coverageCache', JSON.stringify(cache.bounds));
      }
    }

    // Clear failed pending points
    const MAX_RETRIES = 5;
    const pending = await this.db.getAll('pendingCoveragePoints');
    for (const point of pending) {
      const retryCount = (point as PendingPoint).retryCount || 0;
      if (retryCount >= MAX_RETRIES) {
        await this.db.delete('pendingCoveragePoints', point.id);
      }
    }
  }

  // Get storage stats
  async getStorageStats(): Promise<{
    pendingPoints: number;
    cacheSize: number;
    oldestPending: number;
    newestPending: number;
  }> {
    await this.initialize();
    if (!this.db) return {
      pendingPoints: 0,
      cacheSize: 0,
      oldestPending: 0,
      newestPending: 0
    };
    
    const pending = await this.getPendingPoints();
    const cache = await this.db.getAll('coverageCache');

    const timestamps = pending.map(p => p.timestamp);
    return {
      pendingPoints: pending.length,
      cacheSize: cache.length,
      oldestPending: timestamps.length ? Math.min(...timestamps) : 0,
      newestPending: timestamps.length ? Math.max(...timestamps) : 0
    };
  }

  // Register for background sync (if supported)
  async registerBackgroundSync(): Promise<void> {
    if (!('serviceWorker' in navigator)) return;
    
    const registration = await navigator.serviceWorker.ready as SyncServiceWorkerRegistration;
    if ('sync' in registration) {
      try {
        await registration.sync.register('sync-coverage-points');
      } catch (err) {
        if (err instanceof Error) {
          console.error('Background sync registration failed:', err.message);
        } else {
          console.error('Background sync registration failed with unknown error');
        }
      }
    }
  }
}

export const offlineStorage = OfflineStorage.getInstance();
