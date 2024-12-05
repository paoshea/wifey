import {
    Position,
    MeasurementData,
    CoverageReport,
    CoveragePoint,
    DeviceInfo
} from './types';
import { OfflineStorage } from './storage';
import { LocationTracker } from './location-tracker';
import { LocationError, LocationErrorCode } from './errors';

export interface CoverageReportOptions {
    measurementInterval?: number;  // milliseconds
    minMeasurements?: number;     // minimum measurements before reporting
    signalThreshold?: number;     // minimum signal strength (dBm) to consider valid
    maxQueueSize?: number;        // maximum number of queued reports
}

export class CoverageReporter {
    private static instance: CoverageReporter;
    private storage: OfflineStorage;
    private locationTracker: LocationTracker;
    private currentMeasurements: MeasurementData[] = [];
    private measurementIntervalId: number | null = null;
    private options: Required<CoverageReportOptions>;
    private deviceInfo: DeviceInfo;

    private constructor() {
        this.storage = OfflineStorage.getInstance();
        this.locationTracker = LocationTracker.getInstance();
        this.options = {
            measurementInterval: 1000,  // Measure every second
            minMeasurements: 5,        // Need at least 5 measurements
            signalThreshold: -110,      // Typical minimum cellular signal
            maxQueueSize: 1000         // Maximum queued reports
        };
        this.deviceInfo = this.getDeviceInfo();
    }

    static getInstance(): CoverageReporter {
        if (!CoverageReporter.instance) {
            CoverageReporter.instance = new CoverageReporter();
        }
        return CoverageReporter.instance;
    }

    /**
     * Check if currently measuring
     */
    isMeasuring(): boolean {
        return this.measurementIntervalId !== null;
    }

    /**
     * Configure coverage reporting options
     */
    configure(options: CoverageReportOptions): void {
        this.options = { ...this.options, ...options };
    }

    /**
     * Start measuring coverage at current location
     */
    async startMeasuring(): Promise<void> {
        if (this.measurementIntervalId !== null) {
            return; // Already measuring
        }

        this.currentMeasurements = [];

        // Start interval for measurements
        this.measurementIntervalId = window.setInterval(
            () => this.takeMeasurement(),
            this.options.measurementInterval
        );
    }

    /**
     * Stop measuring coverage
     */
    stopMeasuring(): void {
        if (this.measurementIntervalId !== null) {
            clearInterval(this.measurementIntervalId);
            this.measurementIntervalId = null;
        }
    }

    /**
     * Create a coverage report at current location
     */
    async createReport(notes?: string): Promise<CoveragePoint> {
        if (this.currentMeasurements.length < this.options.minMeasurements) {
            throw new Error(`Need at least ${this.options.minMeasurements} measurements`);
        }

        try {
            const position = await this.locationTracker.getCurrentPosition();
            const averageStrength = this.calculateAverageSignalStrength();
            const reliability = this.calculateReliability();

            const report: CoverageReport = {
                position,
                timestamp: Date.now(),
                measurements: this.currentMeasurements,
                averageSignalStrength: averageStrength,
                networkType: this.determineNetworkType(),
                carrier: this.determineCarrier(),
                deviceInfo: this.deviceInfo,
                notes,
                isVerified: false,
                reliability
            };

            // Create coverage point
            const coveragePoint: Omit<CoveragePoint, 'id'> = {
                position,
                measurements: this.currentMeasurements,
                averageStrength,
                reliability,
                lastUpdated: Date.now(),
                synced: false
            };

            // Save coverage point
            const pointId = await this.storage.saveCoveragePoint(coveragePoint);

            // Queue report for syncing
            await this.queueReport(report);

            return { ...coveragePoint, id: pointId };
        } catch (error) {
            if (error instanceof LocationError) {
                throw error;
            }
            throw new LocationError(
                'Failed to create coverage report',
                LocationErrorCode.UNKNOWN,
                error instanceof Error ? error : undefined
            );
        }
    }

    /**
     * Get pending reports count
     */
    async getPendingReportsCount(): Promise<number> {
        const reports = await this.storage.getPendingReports();
        return reports.length;
    }

    private async takeMeasurement(): Promise<void> {
        try {
            const measurement: MeasurementData = {
                signalStrength: await this.getCurrentSignalStrength(),
                networkType: this.determineNetworkType(),
                networkSubtype: this.determineNetworkSubtype(),
                carrier: this.determineCarrier(),
                timestamp: Date.now(),
                accuracy: 1, // Placeholder for actual accuracy calculation
                connectionQuality: this.determineConnectionQuality()
            };

            if (measurement.signalStrength >= this.options.signalThreshold) {
                this.currentMeasurements.push(measurement);
            }
        } catch (error) {
            console.error('Failed to take measurement:', error);
        }
    }

    private async getCurrentSignalStrength(): Promise<number> {
        // Implementation depends on platform capabilities
        // This is a placeholder implementation
        if ('navigator' in globalThis && 'connection' in navigator) {
            const connection = (navigator as any).connection;
            if (connection && typeof connection.signalStrength === 'number') {
                return connection.signalStrength;
            }
        }
        // Fallback: estimate based on connection type/quality
        return -70; // Moderate signal strength
    }

    private determineNetworkType(): 'cellular' | 'wifi' {
        if ('navigator' in globalThis && 'connection' in navigator) {
            const connection = (navigator as any).connection;
            if (connection && connection.type === 'wifi') {
                return 'wifi';
            }
        }
        return 'cellular';
    }

    private determineNetworkSubtype(): string | undefined {
        if ('navigator' in globalThis && 'connection' in navigator) {
            const connection = (navigator as any).connection;
            if (connection && connection.effectiveType) {
                return connection.effectiveType; // '4g', '3g', etc.
            }
        }
        return undefined;
    }

    private determineCarrier(): string | undefined {
        // Implementation depends on platform capabilities
        return undefined;
    }

    private determineConnectionQuality(): 'excellent' | 'good' | 'fair' | 'poor' {
        const avgStrength = this.calculateAverageSignalStrength();

        if (avgStrength >= -70) return 'excellent';
        if (avgStrength >= -85) return 'good';
        if (avgStrength >= -100) return 'fair';
        return 'poor';
    }

    private calculateAverageSignalStrength(): number {
        if (this.currentMeasurements.length === 0) return 0;

        const sum = this.currentMeasurements.reduce(
            (acc, measurement) => acc + measurement.signalStrength,
            0
        );
        return sum / this.currentMeasurements.length;
    }

    private calculateReliability(): number {
        const count = this.currentMeasurements.length;
        if (count < this.options.minMeasurements) return 0;

        // Calculate standard deviation to assess measurement consistency
        const avg = this.calculateAverageSignalStrength();
        const squaredDiffs = this.currentMeasurements.map(m =>
            Math.pow(m.signalStrength - avg, 2)
        );
        const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / count;
        const stdDev = Math.sqrt(avgSquaredDiff);

        // Higher reliability for more measurements and lower standard deviation
        const measurementScore = Math.min(count / (this.options.minMeasurements * 2), 1);
        const consistencyScore = Math.max(1 - (stdDev / 20), 0); // Normalize stdDev

        return (measurementScore + consistencyScore) / 2;
    }

    private async queueReport(report: CoverageReport): Promise<void> {
        const pendingCount = await this.getPendingReportsCount();
        if (pendingCount >= this.options.maxQueueSize) {
            throw new Error('Report queue is full');
        }

        await this.storage.queueReport(report);
    }

    private getDeviceInfo(): DeviceInfo {
        return {
            platform: this.detectPlatform(),
            model: this.detectDeviceModel(),
            osVersion: this.detectOSVersion(),
            appVersion: '1.0.0', // Should come from app config
            screenSize: {
                width: window.screen.width,
                height: window.screen.height
            }
        };
    }

    private detectPlatform(): 'ios' | 'android' | 'web' {
        const ua = navigator.userAgent.toLowerCase();
        if (ua.includes('iphone') || ua.includes('ipad')) return 'ios';
        if (ua.includes('android')) return 'android';
        return 'web';
    }

    private detectDeviceModel(): string | undefined {
        // Implementation depends on platform capabilities
        return undefined;
    }

    private detectOSVersion(): string | undefined {
        // Implementation depends on platform capabilities
        return undefined;
    }
}
