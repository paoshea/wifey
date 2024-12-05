export interface StorageMetadata {
    version: number;
    lastCleanup: number;
    totalSize: number;
    quotaUsage: number;
    lastUpdated?: number;
}
