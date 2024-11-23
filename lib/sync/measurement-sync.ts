import { measurementStore } from '@/lib/storage/measurement-store';
import type { SignalMeasurement } from '@/lib/types/monitoring';
import type { MeasurementRecord } from '@/lib/storage/measurement-store';

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
    // Check required fields
    if (!measurement.timestamp || 
        !measurement.carrier || 
        !measurement.network ||
        !measurement.networkType ||
        !measurement.geolocation ||
        !measurement.geolocation.lat ||
        !measurement.geolocation.lng ||
        !measurement.signalStrength ||
        !measurement.technology ||
        !measurement.provider) {
      return false;
    }

    // Validate latitude and longitude
    const { lat, lng } = measurement.geolocation;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return false;
    }

    // Validate signal strength (assuming dBm values between -120 and 0)
    if (measurement.signalStrength < -120 || measurement.signalStrength > 0) {
      return false;
    }

    return true;
  }

  private async syncBatch(measurements: MeasurementRecord[]): Promise<void> {
    // Validate measurements before syncing
    const validMeasurements = await Promise.all(
      measurements.map(async m => {
        const isValid = await this.validateMeasurement(m);
        return isValid ? m : null;
      })
    );

    // Filter out invalid measurements
    const filteredMeasurements = validMeasurements.filter((m): m is MeasurementRecord => m !== null);
    if (filteredMeasurements.length === 0) return;

    try {
      // Attempt to sync with server
      const response = await fetch(this.API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filteredMeasurements),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Mark measurements as synced
      await Promise.all(
        filteredMeasurements.map(m => 
          measurementStore.updateMeasurementStatus(
            m.id,
            'synced'
          )
        )
      );
    } catch (error) {
      // Mark measurements as failed
      await Promise.all(
        filteredMeasurements.map(m =>
          measurementStore.updateMeasurementStatus(
            m.id,
            'error',
            error instanceof Error ? error.message : 'Unknown error'
          )
        )
      );
      throw error;
    }
  }

  private async getSyncStats(): Promise<SyncStats> {
    const [allMeasurements, pendingMeasurements] = await Promise.all([
      measurementStore.getMeasurements(),
      measurementStore.getPendingMeasurements()
    ]) as [MeasurementRecord[], MeasurementRecord[]];
    
    return {
      pending: pendingMeasurements.length,
      syncing: allMeasurements.filter(m => m.syncStatus === 'syncing').length,
      synced: allMeasurements.filter(m => m.syncStatus === 'synced').length,
      failed: allMeasurements.filter(m => m.syncStatus === 'error').length,
    };
  }

  async sync(): Promise<void> {
    if (this.isSyncing) return;

    this.isSyncing = true;
    try {
      // Get pending measurements
      const pendingMeasurements = await measurementStore.getPendingMeasurements() as MeasurementRecord[];
      
      // Process in batches of 50
      const batchSize = 50;
      for (let i = 0; i < pendingMeasurements.length; i += batchSize) {
        const batch = pendingMeasurements.slice(i, i + batchSize);
        await this.syncBatch(batch);
      }

      // Clean up old measurements
      await measurementStore.clearOldMeasurements(30); // 30 days

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
