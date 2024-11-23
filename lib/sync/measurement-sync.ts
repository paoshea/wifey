import { measurementStore } from '../storage/measurement-store';
import { SignalMeasurement } from '../monitoring/signal-monitor';

interface SyncStats {
  pending: number;
  syncing: number;
  synced: number;
  failed: number;
}

export class MeasurementSync {
  private syncInterval: number | null = null;
  private isSyncing = false;
  private readonly API_ENDPOINT = '/api/measurements';
  private readonly SYNC_INTERVAL = 60000; // 1 minute
  private onSyncComplete?: (stats: SyncStats) => void;

  constructor() {
    // Register service worker for background sync
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(registration => {
        console.log('ServiceWorker registered:', registration);
      }).catch(error => {
        console.error('ServiceWorker registration failed:', error);
      });
    }
  }

  private async validateMeasurement(measurement: SignalMeasurement): Promise<boolean> {
    // Basic validation rules
    if (!measurement.timestamp || 
        !measurement.location?.lat || 
        !measurement.location?.lng ||
        typeof measurement.signalStrength !== 'number') {
      return false;
    }

    // Validate location bounds (rough worldwide bounds)
    if (measurement.location.lat < -90 || measurement.location.lat > 90 ||
        measurement.location.lng < -180 || measurement.location.lng > 180) {
      return false;
    }

    // Validate timestamp (not in future, not too old)
    const now = Date.now();
    const oneMonthAgo = now - (30 * 24 * 60 * 60 * 1000);
    if (measurement.timestamp > now || measurement.timestamp < oneMonthAgo) {
      return false;
    }

    // Validate signal strength (normalized between 0 and 4)
    if (measurement.signalStrength < 0 || measurement.signalStrength > 4) {
      return false;
    }

    return true;
  }

  private async syncBatch(measurements: SignalMeasurement[]): Promise<void> {
    const validMeasurements = measurements.filter(m => this.validateMeasurement(m));
    
    if (validMeasurements.length === 0) return;

    try {
      const response = await fetch(this.API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validMeasurements),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Mark measurements as synced
      await Promise.all(
        validMeasurements.map(m => 
          measurementStore.updateSyncStatus((m as any).id, 'synced')
        )
      );
    } catch (error) {
      // Mark measurements as failed
      await Promise.all(
        validMeasurements.map(m =>
          measurementStore.updateSyncStatus(
            (m as any).id,
            'error',
            error instanceof Error ? error.message : 'Unknown error'
          )
        )
      );
      throw error;
    }
  }

  private async getSyncStats(): Promise<SyncStats> {
    const [pending, failed] = await Promise.all([
      measurementStore.getPendingMeasurements(),
      measurementStore.getFailedMeasurements(),
    ]);

    return {
      pending: pending.length,
      syncing: pending.filter(m => m.syncStatus === 'syncing').length,
      synced: 0, // We don't keep synced measurements in memory
      failed: failed.length,
    };
  }

  async sync(): Promise<void> {
    if (this.isSyncing) return;

    this.isSyncing = true;
    try {
      // Get pending measurements
      const pendingMeasurements = await measurementStore.getPendingMeasurements();
      
      // Process in batches of 50
      const batchSize = 50;
      for (let i = 0; i < pendingMeasurements.length; i += batchSize) {
        const batch = pendingMeasurements.slice(i, i + batchSize);
        await this.syncBatch(batch);
      }

      // Clean up old measurements
      await measurementStore.cleanupOldMeasurements(30 * 24 * 60 * 60 * 1000); // 30 days

      // Get and report sync stats
      const stats = await this.getSyncStats();
      this.onSyncComplete?.(stats);
    } finally {
      this.isSyncing = false;
    }
  }

  startAutoSync(onSyncComplete?: (stats: SyncStats) => void): void {
    this.onSyncComplete = onSyncComplete;
    
    // Attempt initial sync
    this.sync().catch(console.error);

    // Set up periodic sync
    this.syncInterval = window.setInterval(() => {
      this.sync().catch(console.error);
    }, this.SYNC_INTERVAL);
  }

  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
}

export const measurementSync = new MeasurementSync();
