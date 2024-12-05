/**
 * Type definitions for offline functionality
 */

export interface Position {
    latitude: number;
    longitude: number;
    accuracy: number;
    altitude: number | null;
    altitudeAccuracy: number | null;
    heading: number | null;
    speed: number | null;
    timestamp: number;
}

export interface MeasurementData {
    signalStrength: number;  // in dBm
    networkType: 'cellular' | 'wifi';
    networkSubtype?: string; // e.g., '4G', '5G', 'WiFi'
    carrier?: string;
    timestamp: number;
    accuracy: number;
    connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface CoverageReport {
    id?: number;
    position: Position;
    timestamp: number;
    measurements: MeasurementData[];
    averageSignalStrength: number;
    networkType: 'cellular' | 'wifi';
    carrier?: string;
    deviceInfo: DeviceInfo;
    notes?: string;
    isVerified: boolean;
    reliability: number;  // 0-1 score based on multiple measurements
}

export interface DeviceInfo {
    platform: 'ios' | 'android' | 'web';
    model?: string;
    osVersion?: string;
    appVersion: string;
    screenSize: {
        width: number;
        height: number;
    };
}

export interface MapTile {
    key: string;  // `${z}-${x}-${y}`
    data: Blob;
    timestamp: number;
    expires: number;
}

export interface CoveragePoint {
    id?: number;
    position: Position;
    measurements: MeasurementData[];
    averageStrength: number;
    reliability: number;
    lastUpdated: number;
    synced: boolean;
}

export interface LocationHistoryEntry {
    timestamp: number;
    position: Position;
    accuracy: number;
    speed: number | null;
    heading: number | null;
}

export interface PendingReport {
    id?: number;
    report: CoverageReport;
    attempts: number;
    lastAttempt: number;
    error?: string;
}

export interface StorageQuota {
    mapTiles: number;  // Maximum number of tiles to store
    locationHistory: number;  // Maximum number of location entries
    coveragePoints: number;  // Maximum number of coverage points
    pendingReports: number;  // Maximum number of pending reports
}

export interface SyncStatus {
    lastSync: number;
    pendingItems: number;
    syncErrors: Array<{
        timestamp: number;
        error: string;
        itemType: 'report' | 'location' | 'coverage';
    }>;
    isOnline: boolean;
}

export interface NavigationUpdate {
    currentPosition: Position;
    targetPosition: Position;
    distance: number;
    bearing: number;
    estimatedTime: number;  // in seconds
    nextInstruction: string;
}

export interface OfflineConfig {
    storage: StorageQuota;
    location: {
        trackingInterval: number;  // milliseconds
        minDistance: number;  // meters
        maxAge: number;  // milliseconds
        timeout: number;  // milliseconds
        enableHighAccuracy: boolean;
    };
    sync: {
        autoSyncInterval: number;  // milliseconds
        maxRetries: number;
        retryDelay: number;  // milliseconds
    };
    map: {
        maxZoom: number;
        minZoom: number;
        tileExpiration: number;  // milliseconds
        preloadRadius: number;  // kilometers
    };
}
