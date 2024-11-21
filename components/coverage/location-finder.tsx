'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocationService } from '@/lib/hooks/use-location-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, Navigation, Search, Loader2 } from 'lucide-react';
import { MarkedLocation } from '@/lib/services/enhanced-location-service';

export default function LocationFinder() {
    const [locationId, setLocationId] = useState('');
    const [selectedLocation, setSelectedLocation] = useState<MarkedLocation | null>(null);
    const [showCopySuccess, setShowCopySuccess] = useState(false);
    
    const {
        markLocation,
        getLocation,
        calculateDistance,
        currentLocation,
        isLoading,
        error,
        nearbyLocations
    } = useLocationService();

    const handleMarkLocation = async () => {
        try {
            const id = await markLocation();
            // Copy ID to clipboard
            await navigator.clipboard.writeText(id);
            setShowCopySuccess(true);
            setTimeout(() => setShowCopySuccess(false), 3000);
        } catch (err) {
            console.error('Failed to mark location:', err);
        }
    };

    const handleFindLocation = (e: React.FormEvent) => {
        e.preventDefault();
        const location = getLocation(locationId);
        setSelectedLocation(location);
    };

    const getDistanceDisplay = (location: MarkedLocation) => {
        if (!currentLocation) return 'Calculate distance...';
        
        const distance = calculateDistance(currentLocation, location.coordinates);
        return distance.kilometers < 1
            ? `${distance.meters} meters away`
            : `${distance.kilometers} km away`;
    };

    return (
        <div className="space-y-6">
            {/* Mark Location Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MapPin className="w-5 h-5" />
                        Mark Your Location
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Button
                        onClick={handleMarkLocation}
                        disabled={isLoading}
                        className="w-full"
                    >
                        {isLoading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <MapPin className="w-4 h-4 mr-2" />
                        )}
                        Mark This Spot
                    </Button>

                    <AnimatePresence>
                        {showCopySuccess && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="mt-2"
                            >
                                <Alert>
                                    <AlertDescription>
                                        Location ID copied to clipboard!
                                    </AlertDescription>
                                </Alert>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </CardContent>
            </Card>

            {/* Find Location Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Search className="w-5 h-5" />
                        Find Marked Location
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleFindLocation} className="space-y-4">
                        <div>
                            <Input
                                type="text"
                                placeholder="Enter 8-digit location ID"
                                pattern="\d{8}"
                                value={locationId}
                                onChange={(e) => setLocationId(e.target.value)}
                                required
                            />
                        </div>
                        <Button type="submit" className="w-full">
                            Find Location
                        </Button>
                    </form>

                    {selectedLocation && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-4 p-4 bg-gray-50 rounded-lg"
                        >
                            <h3 className="font-semibold mb-2">Location Found:</h3>
                            <p>ID: {selectedLocation.id}</p>
                            <p>Latitude: {selectedLocation.coordinates.latitude}</p>
                            <p>Longitude: {selectedLocation.coordinates.longitude}</p>
                            <p>{getDistanceDisplay(selectedLocation)}</p>
                            {selectedLocation.coverage && (
                                <div className="mt-2">
                                    <p>Provider: {selectedLocation.coverage.provider}</p>
                                    <p>Signal: {selectedLocation.coverage.signalStrength}%</p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </CardContent>
            </Card>

            {/* Nearby Locations */}
            {nearbyLocations.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Navigation className="w-5 h-5" />
                            Nearby Marked Locations
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {nearbyLocations.map((location) => (
                                <motion.div
                                    key={location.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="p-4 bg-gray-50 rounded-lg"
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold">ID: {location.id}</p>
                                            <p>{getDistanceDisplay(location)}</p>
                                            {location.coverage && (
                                                <p>Signal: {location.coverage.signalStrength}%</p>
                                            )}
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setSelectedLocation(location)}
                                        >
                                            Details
                                        </Button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
        </div>
    );
}
