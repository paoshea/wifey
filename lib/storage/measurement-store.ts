import { openDB, type IDBPDatabase, type DBSchema } from 'idb';
import type { SignalMeasurement } from '@/lib/types/monitoring';

export interface MeasurementRecord extends SignalMeasurement {
  id: string;  // Required for stored measurements
  syncStatus: 'pending' | 'syncing' | 'synced' | 'error';
  errorMessage?: string;
  retryCount: number;
}

interface WifeyDB extends DBSchema {
  measurements: {
    key: string;
    value: MeasurementRecord;
    indexes: {
      'by-timestamp': number;
      'by-sync-status': string;
    };
  };
}

export class MeasurementStore {
  private db: IDBPDatabase<WifeyDB> | null = null;
  private readonly DB_NAME = 'wifey-measurements';
  private readonly STORE_NAME = 'measurements';
  private readonly MAX_RETRY_COUNT = 3;

  async initialize(): Promise<void> {
    if (this.db) return;

    this.db = await openDB<WifeyDB>(this.DB_NAME, 1, {
      upgrade(db: IDBPDatabase<WifeyDB>) {
        const store = db.createObjectStore('measurements', {
          keyPath: 'id',
        });
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        store.createIndex('by-timestamp', 'timestamp');
        store.createIndex('by-sync-status', 'syncStatus');
      },
    });
  }

  async storeMeasurement(measurement: SignalMeasurement): Promise<string> {
    if (!this.db) await this.initialize();
    if (!this.db) throw new Error('Failed to initialize database');

    const id = crypto.randomUUID();
    const measurementWithMeta = {
      ...measurement,
      id,
      syncStatus: 'pending' as const,
      retryCount: 0,
    };

    await this.db.add('measurements', measurementWithMeta);
    return id;
  }

  async getMeasurements(limit = 100): Promise<Array<SignalMeasurement & { id: string }>> {
    if (!this.db) await this.initialize();
    if (!this.db) throw new Error('Failed to initialize database');

    return this.db.getAllFromIndex('measurements', 'by-timestamp', null, limit);
  }

  async getPendingMeasurements(): Promise<Array<SignalMeasurement & { id: string }>> {
    if (!this.db) await this.initialize();
    if (!this.db) throw new Error('Failed to initialize database');

    return this.db.getAllFromIndex('measurements', 'by-sync-status', 'pending');
  }

  async updateMeasurementStatus(
    id: string,
    status: 'syncing' | 'synced' | 'error',
    errorMessage?: string
  ): Promise<void> {
    if (!this.db) await this.initialize();
    if (!this.db) throw new Error('Failed to initialize database');

    const measurement = await this.db.get('measurements', id);
    if (!measurement) return;

    measurement.syncStatus = status;
    if (errorMessage) measurement.errorMessage = errorMessage;
    if (status === 'error') measurement.retryCount++;

    await this.db.put('measurements', measurement);
  }

  async clearOldMeasurements(olderThanDays = 30): Promise<void> {
    if (!this.db) await this.initialize();
    if (!this.db) throw new Error('Failed to initialize database');

    const cutoff = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;
    const tx = this.db.transaction('measurements', 'readwrite');
    const store = tx.objectStore('measurements');
    const index = store.index('by-timestamp');

    let cursor = await index.openCursor(IDBKeyRange.upperBound(cutoff));
    while (cursor) {
      await cursor.delete();
      cursor = await cursor.continue();
    }

    await tx.done;
  }
}

export const measurementStore = new MeasurementStore();
