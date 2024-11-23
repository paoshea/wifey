import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { SignalMeasurement } from '@/lib/monitoring/signal-monitor';

interface WifeyDB extends DBSchema {
  measurements: {
    key: string;
    value: SignalMeasurement & {
      id: string;
      syncStatus: 'pending' | 'syncing' | 'synced' | 'error';
      errorMessage?: string;
      retryCount: number;
    };
    indexes: {
      'by-timestamp': number;
      'by-sync-status': string;
    };
  };
}

class MeasurementStore {
  private db: IDBPDatabase<WifeyDB> | null = null;
  private readonly DB_NAME = 'wifey-measurements';
  private readonly STORE_NAME = 'measurements';
  private readonly MAX_RETRY_COUNT = 3;

  async initialize(): Promise<void> {
    if (this.db) return;

    this.db = await openDB<WifeyDB>(this.DB_NAME, 1, {
      upgrade(db) {
        const store = db.createObjectStore('measurements', {
          keyPath: 'id',
        });
        
        store.createIndex('by-timestamp', 'timestamp');
        store.createIndex('by-sync-status', 'syncStatus');
      },
    });
  }

  async storeMeasurement(measurement: SignalMeasurement): Promise<string> {
    await this.initialize();
    
    const id = crypto.randomUUID();
    const record = {
      ...measurement,
      id,
      syncStatus: 'pending' as const,
      retryCount: 0,
    };

    await this.db!.add('measurements', record);
    return id;
  }

  async getPendingMeasurements(): Promise<Array<WifeyDB['measurements']['value']>> {
    await this.initialize();
    return this.db!.getAllFromIndex(
      'measurements',
      'by-sync-status',
      'pending'
    );
  }

  async updateSyncStatus(
    id: string,
    status: 'syncing' | 'synced' | 'error',
    errorMessage?: string
  ): Promise<void> {
    await this.initialize();
    
    const record = await this.db!.get('measurements', id);
    if (!record) return;

    const updatedRecord = {
      ...record,
      syncStatus: status,
      errorMessage,
      retryCount: status === 'error' ? record.retryCount + 1 : record.retryCount,
    };

    await this.db!.put('measurements', updatedRecord);
  }

  async getMeasurementsByTimeRange(
    startTime: number,
    endTime: number
  ): Promise<Array<WifeyDB['measurements']['value']>> {
    await this.initialize();
    
    const range = IDBKeyRange.bound(startTime, endTime);
    return this.db!.getAllFromIndex('measurements', 'by-timestamp', range);
  }

  async cleanupOldMeasurements(maxAgeMs: number): Promise<void> {
    await this.initialize();
    
    const cutoffTime = Date.now() - maxAgeMs;
    const oldMeasurements = await this.getMeasurementsByTimeRange(0, cutoffTime);
    
    const tx = this.db!.transaction('measurements', 'readwrite');
    await Promise.all([
      ...oldMeasurements
        .filter(m => m.syncStatus === 'synced')
        .map(m => tx.store.delete(m.id)),
      tx.done,
    ]);
  }

  async getFailedMeasurements(): Promise<Array<WifeyDB['measurements']['value']>> {
    await this.initialize();
    const records = await this.db!.getAllFromIndex(
      'measurements',
      'by-sync-status',
      'error'
    );
    return records.filter(r => r.retryCount < this.MAX_RETRY_COUNT);
  }
}

export const measurementStore = new MeasurementStore();
