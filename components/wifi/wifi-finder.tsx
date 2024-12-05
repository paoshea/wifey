'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    OfflineManager,
    CoveragePoint,
    LocationError,
    LocationErrorCode,
    MeasurementData
} from 'lib/offline';
import { useOfflineError } from 'components/offline/error-handler';
import {
    wifiFormSchema,
    type WiFiFormData
} from 'lib/schemas/coverage';
import { Input } from 'components/ui/input';
import { Button } from 'components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from 'components/ui/form';
import { Textarea } from 'components/ui/textarea';

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

    const form = useForm<WiFiFormData>({
        resolver: zodResolver(wifiFormSchema),
        defaultValues: {
            security: 'WPA2'
        }
    });

    const loadNearbyPoints = useCallback(async () => {
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
    }, [handleError]);

    useEffect(() => {
        loadNearbyPoints();
    }, [loadNearbyPoints]);

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

    const onSubmit = async (data: WiFiFormData) => {
        const manager = OfflineManager.getInstance();

        try {
            const report = await manager.stopAndReportCoverage(data.notes);
            setIsMeasuring(false);
            setMeasurements([]);
            await loadNearbyPoints(); // Refresh nearby points
            form.reset();
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
                {!isMeasuring ? (
                    <Button
                        onClick={handleStartMeasuring}
                        className="w-full"
                        variant="default"
                    >
                        Start WiFi Scan
                    </Button>
                ) : (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="ssid"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Network Name (SSID)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter network name" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="security"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Security Type</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select security type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="WPA2">WPA2</SelectItem>
                                                <SelectItem value="WPA3">WPA3</SelectItem>
                                                <SelectItem value="Open">Open</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="notes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Notes (Optional)</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Add any additional notes..."
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="flex items-center space-x-2">
                                <Button type="submit" className="flex-1">
                                    Save Measurement
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        const manager = OfflineManager.getInstance();
                                        manager.stopAll();
                                        setIsMeasuring(false);
                                        setMeasurements([]);
                                        form.reset();
                                    }}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </Form>
                )}
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
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                </div>
            )}
        </div>
    );
}
