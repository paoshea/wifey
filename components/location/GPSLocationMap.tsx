'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap } from 'react-leaflet';
import { Icon } from 'leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Navigation, Crosshair } from 'lucide-react';
import { GPSTracker, type Coordinates } from '@/lib/location/GPSTracker';
import 'leaflet/dist/leaflet.css';

// Custom marker icon
const locationIcon = new Icon({
    iconUrl: '/images/location-marker.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
});

interface MapUpdateProps {
    center: [number, number];
    zoom?: number;
}

function MapUpdate({ center, zoom }: MapUpdateProps) {
    const map = useMap();
    map.setView(center, zoom || map.getZoom());
    return null;
}

interface GPSLocationMapProps {
    className?: string;
    onLocationUpdate?: (location: { lat: number; lng: number }) => void;
}

export function GPSLocationMap({ className = '', onLocationUpdate }: GPSLocationMapProps) {
    const [tracker] = useState(() => new GPSTracker());
    const [location, setLocation] = useState<Coordinates | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [tracking, setTracking] = useState(false);
    const [accuracy, setAccuracy] = useState<'high' | 'medium' | 'low'>('medium');

    const handleLocationUpdate = useCallback((locationData: Coordinates) => {
        setLocation(locationData);
        if (onLocationUpdate) {
            onLocationUpdate({ lat: locationData.latitude, lng: locationData.longitude });
        }

        // Update accuracy status
        if (locationData.accuracy) {
            if (locationData.accuracy <= 10) {
                setAccuracy('high');
            } else if (locationData.accuracy <= 50) {
                setAccuracy('medium');
            } else {
                setAccuracy('low');
            }
        }
    }, [onLocationUpdate]);

    const startTracking = useCallback(() => {
        setError(null);
        tracker.watchPosition(
            handleLocationUpdate,
            (error) => setError(error.message)
        );
        setTracking(true);
    }, [tracker, handleLocationUpdate]);

    const stopTracking = useCallback(() => {
        tracker.stopWatching();
        setTracking(false);
    }, [tracker]);

    useEffect(() => {
        return () => {
            tracker.stopWatching();
        };
    }, [tracker]);

    const getAccuracyColor = (accuracy: 'high' | 'medium' | 'low'): string => {
        switch (accuracy) {
            case 'high':
                return 'bg-green-500';
            case 'medium':
                return 'bg-yellow-500';
            case 'low':
                return 'bg-red-500';
            default:
                return 'bg-gray-500';
        }
    };

    return (
        <Card className={`${className}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-md font-medium">
                    <div className="flex items-center space-x-2">
                        <Navigation className="h-4 w-4" />
                        <span>GPS Location Tracker</span>
                    </div>
                </CardTitle>
                <div className="flex items-center space-x-2">
                    {tracking && (
                        <Badge variant="outline" className={getAccuracyColor(accuracy)}>
                            {accuracy === 'high' ? 'High Accuracy' : 
                             accuracy === 'medium' ? 'Medium Accuracy' : 
                             'Low Accuracy'}
                        </Badge>
                    )}
                    <Button
                        variant={tracking ? "destructive" : "default"}
                        size="sm"
                        onClick={tracking ? stopTracking : startTracking}
                    >
                        {tracking ? 'Stop Tracking' : 'Start Tracking'}
                    </Button>
                </div>
            </CardHeader>

            <CardContent>
                {error && (
                    <div className="flex items-center space-x-2 bg-red-100 text-red-700 p-2 rounded-md mb-2">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm">{error}</span>
                    </div>
                )}

                <div className="h-[400px] w-full rounded-lg overflow-hidden">
                    <MapContainer
                        center={location ? [location.latitude, location.longitude] : [0, 0]}
                        zoom={15}
                        style={{ height: '100%', width: '100%' }}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        {location && (
                            <>
                                <Marker
                                    position={[location.latitude, location.longitude]}
                                    icon={locationIcon}
                                />
                                {location.accuracy && (
                                    <Circle
                                        center={[location.latitude, location.longitude]}
                                        radius={location.accuracy}
                                        pathOptions={{
                                            color: accuracy === 'high' ? 'green' :
                                                   accuracy === 'medium' ? 'yellow' : 'red',
                                            fillColor: accuracy === 'high' ? '#10B98120' :
                                                      accuracy === 'medium' ? '#F59E0B20' : '#EF444420',
                                            fillOpacity: 0.2
                                        }}
                                    />
                                )}
                                <MapUpdate
                                    center={[location.latitude, location.longitude]}
                                    zoom={15}
                                />
                            </>
                        )}
                    </MapContainer>
                </div>

                {location && (
                    <div className="mt-4 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                            <div className="text-sm">
                                <span className="text-muted-foreground">Latitude:</span>{' '}
                                <span className="font-mono">{location.latitude.toFixed(6)}°</span>
                            </div>
                            <div className="text-sm">
                                <span className="text-muted-foreground">Longitude:</span>{' '}
                                <span className="font-mono">{location.longitude.toFixed(6)}°</span>
                            </div>
                        </div>

                        {location.accuracy && (
                            <div className="text-sm">
                                <span className="text-muted-foreground">Accuracy:</span>{' '}
                                <span className="font-mono">±{Math.round(location.accuracy)}m</span>
                            </div>
                        )}

                        {location.timestamp && (
                            <div className="text-sm">
                                <span className="text-muted-foreground">Last Update:</span>{' '}
                                <span className="font-mono">
                                    {new Date(location.timestamp).toLocaleTimeString()}
                                </span>
                            </div>
                        )}

                        <div className="flex justify-end">
                            <Button
                                variant="outline"
                                size="sm"
                                asChild
                                className="text-xs"
                            >
                                <a
                                    href={tracker.getGoogleMapsUrl(location)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    View on Google Maps
                                </a>
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
