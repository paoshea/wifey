import { useState, useEffect } from 'react';
import {
    OfflineManager,
    CoveragePoint,
    LocationError,
    LocationErrorCode,
    MeasurementData
} from '@/lib/offline';
import { useOfflineError } from '@/components/offline/error-handler';

interface WiFiFinderProps {
    className?: string;
}

interface WiFiMeasurement extends MeasurementData {
    ssid?: string;
    security?: string;
    frequency?: number;
}

export function WiFiFinder({ className = '' }: WiFiFinderProps) {
    const [isMeasuring, setIsMeasuring] = useState(false);
    const [measurements, setMeasurements] = useState<WiFiMeasurement[]>([]);
    const [nearbyPoints, setNearbyPoints] = useState<CoveragePoint[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { handleError } = useOfflineError();

    useEffect(() => {
        loadNearbyPoints();
    }, []);

    const loadNearbyPoints = async () => {
        const manager = OfflineManager.getInstance();
        setIsLoading(true);

        try {
            const points = await manager.getNearbyPoints(1000); // 1km radius
            setNearbyPoints(points.filter(point =>
                point.measurements.some(m => m.networkType === 'wifi')
            ));
        } catch (error) {
            if (error instanceof LocationError) {
                handleError(error);
            } else {
                handleError(new LocationError(
                    'Failed to load nearby WiFi points',
                    LocationErrorCode.UNKNOWN,
                    error instanceof Error ? error : undefined
                ));
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleStartMeasuring = async () => {
        const manager = OfflineManager.getInstance();

        try {
            await manager.startCoverageMeasurement();
            setIsMeasuring(true);
            // Start collecting WiFi measurements
            startWiFiScanning();
        } catch (error) {
            if (error instanceof LocationError) {
                handleError(error);
            } else {
                handleError(new LocationError(
                    'Failed to start WiFi measurement',
                    LocationErrorCode.UNKNOWN,
                    error instanceof Error ? error : undefined
                ));
            }
        }
    };

    const handleStopMeasuring = async () => {
        const manager = OfflineManager.getInstance();

        try {
            const report = await manager.stopAndReportCoverage("WiFi measurement");
            setIsMeasuring(false);
            setMeasurements([]);
            await loadNearbyPoints(); // Refresh nearby points
        } catch (error) {
            if (error instanceof LocationError) {
                handleError(error);
            } else {
                handleError(new LocationError(
                    'Failed to save WiFi measurement',
                    LocationErrorCode.UNKNOWN,
                    error instanceof Error ? error : undefined
                ));
            }
        }
    };

    const startWiFiScanning = () => {
        // Mock WiFi scanning since Web API doesn't provide direct WiFi access
        const scanInterval = setInterval(() => {
            if (!isMeasuring) {
                clearInterval(scanInterval);
                return;
            }

            // Simulate WiFi measurement
            const mockMeasurement: WiFiMeasurement = {
                signalStrength: -Math.floor(Math.random() * 60 + 40), // -40 to -100 dBm
                networkType: 'wifi',
                networkSubtype: 'WiFi',
                timestamp: Date.now(),
                accuracy: 1,
                connectionQuality: 'good',
                ssid: `WiFi_${Math.floor(Math.random() * 1000)}`,
                security: Math.random() > 0.5 ? 'WPA2' : 'WPA3',
                frequency: 2400 + Math.floor(Math.random() * 2) * 2500 // 2.4GHz or 5GHz
            };

            setMeasurements(prev => [...prev, mockMeasurement]);
        }, 2000); // Scan every 2 seconds

        return () => clearInterval(scanInterval);
    };

    const getSignalQualityClass = (strength: number) => {
        if (strength > -50) return 'text-green-500';
        if (strength > -70) return 'text-yellow-500';
        return 'text-red-500';
    };

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Measurement Controls */}
            <div className="rounded-lg bg-card p-6">
                <h2 className="text-xl font-semibold mb-4">WiFi Scanner</h2>
                <div className="space-y-4">
                    {!isMeasuring ? (
                        <button
                            onClick={handleStartMeasuring}
                            className="w-full btn btn-primary"
                        >
                            Start WiFi Scan
                        </button>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-center space-x-2">
                                <span className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
                                <span>Scanning WiFi Networks...</span>
                            </div>
                            <button
                                onClick={handleStopMeasuring}
                                className="w-full btn btn-secondary"
                            >
                                Stop & Save
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Current Measurements */}
            {measurements.length > 0 && (
                <div className="rounded-lg bg-card p-6">
                    <h3 className="text-lg font-semibold mb-3">Current Scan</h3>
                    <div className="space-y-3">
                        {measurements.slice(-5).map((measurement, index) => (
                            <div key={index} className="p-3 bg-muted rounded-md">
                                <div className="flex justify-between items-center">
                                    <span className="font-medium">{measurement.ssid}</span>
                                    <span className={getSignalQualityClass(measurement.signalStrength)}>
                                        {measurement.signalStrength} dBm
                                    </span>
                                </div>
                                <div className="text-sm text-muted-foreground mt-1">
                                    <span>{measurement.security}</span>
                                    <span className="mx-2">•</span>
                                    <span>{(measurement.frequency! / 1000).toFixed(1)} GHz</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Nearby WiFi Points */}
            {nearbyPoints.length > 0 && (
                <div className="rounded-lg bg-card p-6">
                    <h3 className="text-lg font-semibold mb-3">Nearby WiFi Points</h3>
                    <div className="space-y-3">
                        {nearbyPoints.map((point, index) => (
                            <div key={index} className="p-3 bg-muted rounded-md">
                                <div className="flex justify-between items-center">
                                    <span className="font-medium">WiFi Hotspot</span>
                                    <span className={getSignalQualityClass(point.averageStrength)}>
                                        {point.averageStrength} dBm
                                    </span>
                                </div>
                                <div className="text-sm text-muted-foreground mt-1">
                                    <span>Reliability: {Math.round(point.reliability * 100)}%</span>
                                    <span className="mx-2">•</span>
                                    <span>Last updated: {new Date(point.lastUpdated).toLocaleDateString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Loading State */}
            {isLoading && (
                <div className="flex justify-center items-center p-4">
                    <svg className="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </div>
            )}
        </div>
    );
}
