import { CoverageReport, SyncStatus } from './types';
import { OfflineStorage } from './storage';
import { LocationError, LocationErrorCode } from './errors';

export interface SyncOptions {
    maxRetries?: number;
    retryDelay?: number;
    batchSize?: number;
    maxConcurrent?: number;
}

type SyncProgressCallback = (progress: {
    total: number;
    completed: number;
    failed: number;
    remaining: number;
}) => void;

export class SyncService {
    private static instance: SyncService;
    private storage: OfflineStorage;
    private isSyncing: boolean = false;
    private syncInterval: number | null = null;
    private options: Required<SyncOptions>;
    private progressListeners: Set<SyncProgressCallback> = new Set();

    private constructor() {
        this.storage = OfflineStorage.getInstance();
        this.options = {
            maxRetries: 3,
            retryDelay: 5000, // 5 seconds
            batchSize: 10,    // Process 10 items at a time
            maxConcurrent: 3  // Maximum concurrent requests
        };

        // Listen for online/offline events
        if (typeof window !== 'undefined') {
            window.addEventListener('online', () => this.handleOnline());
            window.addEventListener('offline', () => this.handleOffline());
        }
    }

    static getInstance(): SyncService {
        if (!SyncService.instance) {
            SyncService.instance = new SyncService();
        }
        return SyncService.instance;
    }

    /**
     * Configure sync options
     */
    configure(options: SyncOptions): void {
        this.options = { ...this.options, ...options };
    }

    /**
     * Start automatic synchronization
     */
    startAutoSync(interval: number = 60000): void {
        if (this.syncInterval !== null) {
            this.stopAutoSync();
        }

        this.syncInterval = window.setInterval(() => {
            if (navigator.onLine) {
                this.sync();
            }
        }, interval);
    }

    /**
     * Stop automatic synchronization
     */
    stopAutoSync(): void {
        if (this.syncInterval !== null) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }

    /**
     * Manually trigger synchronization
     */
    async sync(): Promise<void> {
        if (this.isSyncing || !navigator.onLine) {
            return;
        }

        this.isSyncing = true;
        let progress = { total: 0, completed: 0, failed: 0, remaining: 0 };

        try {
            const pendingReports = await this.storage.getPendingReports();
            progress.total = pendingReports.length;
            progress.remaining = pendingReports.length;
            this.notifyProgress(progress);

            // Process in batches
            for (let i = 0; i < pendingReports.length; i += this.options.batchSize) {
                const batch = pendingReports.slice(i, i + this.options.batchSize);
                const results = await Promise.allSettled(
                    batch.map(report => this.syncReport(report.report, report.id!))
                );

                // Update progress
                results.forEach(result => {
                    if (result.status === 'fulfilled') {
                        progress.completed++;
                    } else {
                        progress.failed++;
                    }
                    progress.remaining--;
                });
                this.notifyProgress(progress);
            }
        } finally {
            this.isSyncing = false;
        }
    }

    /**
     * Add sync progress listener
     */
    addProgressListener(callback: SyncProgressCallback): () => void {
        this.progressListeners.add(callback);
        return () => this.progressListeners.delete(callback);
    }

    /**
     * Get current sync status
     */
    async getSyncStatus(): Promise<SyncStatus> {
        const pendingReports = await this.storage.getPendingReports();
        return {
            lastSync: await this.getLastSyncTime(),
            pendingItems: pendingReports.length,
            syncErrors: await this.getSyncErrors(),
            isOnline: navigator.onLine
        };
    }

    private async syncReport(report: CoverageReport, reportId: number): Promise<void> {
        let retries = 0;

        while (retries < this.options.maxRetries) {
            try {
                await this.uploadReport(report);
                await this.storage.removeReport(reportId);

                // Update coverage point sync status
                if (report.id) {
                    await this.storage.updateCoveragePoint(report.id, { synced: true });
                }

                return;
            } catch (error) {
                retries++;
                if (retries === this.options.maxRetries) {
                    await this.storage.updateReportAttempt(
                        reportId,
                        error instanceof Error ? error.message : 'Unknown error'
                    );
                    throw error;
                }
                await new Promise(resolve => setTimeout(resolve, this.options.retryDelay));
            }
        }
    }

    private async uploadReport(report: CoverageReport): Promise<void> {
        // Implementation would depend on your API
        const response = await fetch('/api/coverage/report', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(report)
        });

        if (!response.ok) {
            throw new Error(`Failed to upload report: ${response.statusText}`);
        }
    }

    private handleOnline(): void {
        // Attempt to sync when we come online
        this.sync().catch(error => {
            console.error('Failed to sync when coming online:', error);
        });
    }

    private handleOffline(): void {
        // Stop any ongoing sync when we go offline
        this.isSyncing = false;
    }

    private notifyProgress(progress: Parameters<SyncProgressCallback>[0]): void {
        this.progressListeners.forEach(listener => listener(progress));
    }

    private async getLastSyncTime(): Promise<number> {
        // Implementation would depend on your storage strategy
        return Date.now(); // Placeholder
    }

    private async getSyncErrors(): Promise<SyncStatus['syncErrors']> {
        const reports = await this.storage.getPendingReports();
        return reports
            .filter(report => report.error)
            .map(report => ({
                timestamp: report.lastAttempt,
                error: report.error!,
                itemType: 'report'
            }));
    }
}
