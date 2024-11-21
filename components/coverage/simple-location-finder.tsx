'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, Navigation, Compass } from 'lucide-react';

interface Coordinates {
    latitude: number;
    longitude: number;
}

interface MarkedLocation {
    id: number;
    name: string;
    coordinates: Coordinates;
}

export default function SimpleLocationFinder() {
    const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(null);
    const [locationId, setLocationId] = useState('');
    const [locationName, setLocationName] = useState('');
    const [markedLocation, setMarkedLocation] = useState<MarkedLocation | null>(null);
    const [distance, setDistance] = useState<{ meters: number; kilometers: number } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Get current location
    const findMe = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 0
                });
            });

            const location = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            };

            setCurrentLocation(location);
        } catch (err) {
            setError('Failed to get your location. Please enable location services.');
        } finally {
            setIsLoading(false);
        }
    };

    // Calculate distance between two points using Haversine formula
    const calculateDistance = (point1: Coordinates, point2: Coordinates) => {
        const R = 6371000; // Earth's radius in meters
        const φ1 = toRadians(point1.latitude);
        const φ2 = toRadians(point2.latitude);
        const Δφ = toRadians(point2.latitude - point1.latitude);
        const Δλ = toRadians(point2.longitude - point1.longitude);

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distanceInMeters = R * c;

        return {
            meters: Math.round(distanceInMeters),
            kilometers: Math.round(distanceInMeters / 1000 * 100) / 100
        };
    };

    const toRadians = (degrees: number) => degrees * Math.PI / 180;

    // Mark current location
    const handleMarkLocation = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!locationName.trim()) {
            setError('Please enter a location name');
            return;
        }

        try {
            if (!currentLocation) {
                await findMe();
            }

            if (currentLocation) {
                // Here you would typically save to your database
                const newLocation: MarkedLocation = {
                    id: Date.now(), // Temporary ID generation
                    name: locationName,
                    coordinates: currentLocation
                };
                setMarkedLocation(newLocation);
                setLocationName('');
            }
        } catch (err) {
            setError('Failed to mark location');
        }
    };

    // Find distance to marked location
    const handleFindDistance = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!currentLocation) {
            setError('Please get your location first');
            return;
        }

        if (!markedLocation) {
            setError('Location not found');
            return;
        }

        const calculatedDistance = calculateDistance(currentLocation, markedLocation.coordinates);
        setDistance(calculatedDistance);
    };

    return (
        <div className="space-y-6">
            {/* Find Me Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Compass className="w-5 h-5" />
                        Find My Location
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Button
                        onClick={findMe}
                        disabled={isLoading}
                        className="w-full"
                    >
                        {isLoading ? 'Getting Location...' : 'Get My Location'}
                    </Button>

                    {currentLocation && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                            <p><strong>Your Location:</strong></p>
                            <p>Latitude: {currentLocation.latitude}</p>
                            <p>Longitude: {currentLocation.longitude}</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Mark Location Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MapPin className="w-5 h-5" />
                        Mark Location
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleMarkLocation} className="space-y-4">
                        <Input
                            placeholder="Enter location name"
                            value={locationName}
                            onChange={(e) => setLocationName(e.target.value)}
                            required
                        />
                        <Button type="submit" className="w-full">
                            Mark Current Location
                        </Button>
                    </form>

                    {markedLocation && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                            <p><strong>Marked Location:</strong></p>
                            <p>ID: {markedLocation.id}</p>
                            <p>Name: {markedLocation.name}</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Calculate Distance Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Navigation className="w-5 h-5" />
                        Calculate Distance
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Button
                        onClick={handleFindDistance}
                        disabled={!currentLocation || !markedLocation}
                        className="w-full"
                    >
                        Calculate Distance to Marked Location
                    </Button>

                    {distance && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                            <p><strong>Distance to {markedLocation?.name}:</strong></p>
                            <p>{distance.meters} meters</p>
                            <p>{distance.kilometers} kilometers</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
        </div>
    );
}
