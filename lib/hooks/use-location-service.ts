import { useState, useEffect, useCallback, useMemo } from 'react';
import { EnhancedLocationService, Coordinates, MarkedLocation, DistanceResult } from '@/lib/services/enhanced-location-service';
import { useGamificationStore } from '@/lib/store/gamification-store';
import { CarrierCoverage } from '@/lib/carriers/types';

interface UseLocationServiceResult {
    markLocation: (coverage?: CarrierCoverage) => Promise<string>;
    getLocation: (id: string) => MarkedLocation | null;
    calculateDistance: (from: Coordinates, to: Coordinates) => DistanceResult;
    findNearbyLocations: (coordinates: Coordinates, radiusKm?: number) => MarkedLocation[];
    currentLocation: Coordinates | null;
    isLoading: boolean;
    error: string | null;
    nearbyLocations: MarkedLocation[];
}

export function useLocationService(): UseLocationServiceResult {
    const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [nearbyLocations, setNearbyLocations] = useState<MarkedLocation[]>([]);

    const { addContribution } = useGamificationStore();
    const locationService = useMemo(() => EnhancedLocationService.getInstance(), []);

    // Load saved locations on mount
    useEffect(() => {
        locationService.loadFromLocalStorage();
        return () => locationService.cleanup();
    }, [locationService]);

    // Get current location
    const getCurrentLocation = useCallback(async (): Promise<Coordinates> => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported by your browser'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const coords = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    };
                    locationService.updateCurrentLocation(coords);
                    resolve(coords);
                },
                (error) => {
                    reject(error);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 0
                }
            );
        });
    }, [locationService]);

    // Update nearby locations when current location changes
    useEffect(() => {
        if (currentLocation) {
            const nearby = locationService.findNearbyLocations(currentLocation);
            setNearbyLocations(nearby);
        }
    }, [currentLocation, locationService]);

    // Mark current location
    const markLocation = useCallback(async (coverage?: CarrierCoverage): Promise<string> => {
        setIsLoading(true);
        setError(null);
        try {
            const coords = await getCurrentLocation();
            addContribution();
            return locationService.markLocation(coords, coverage);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to mark location';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [getCurrentLocation, addContribution, locationService]);

    // Get location by ID
    const getLocation = useCallback((id: string): MarkedLocation | null => {
        return locationService.getLocation(id);
    }, [locationService]);

    // Calculate distance between two points
    const calculateDistance = useCallback((from: Coordinates, to: Coordinates): DistanceResult => {
        return locationService.calculateDistance(from, to);
    }, [locationService]);

    // Find nearby locations
    const findNearbyLocations = useCallback((coordinates: Coordinates, radiusKm?: number): MarkedLocation[] => {
        return locationService.findNearbyLocations(coordinates, radiusKm);
    }, [locationService]);

    // Update current location periodically
    useEffect(() => {
        let intervalId: NodeJS.Timeout;

        const updateLocation = async () => {
            try {
                const location = await getCurrentLocation();
                setCurrentLocation(location);
                setError(null);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to update location';
                setError(errorMessage);
            }
        };

        // Initial update
        updateLocation();

        // Update every 30 seconds
        intervalId = setInterval(updateLocation, 30000);

        return () => {
            clearInterval(intervalId);
        };
    }, [getCurrentLocation]);

    return {
        markLocation,
        getLocation,
        calculateDistance,
        findNearbyLocations,
        currentLocation,
        isLoading,
        error,
        nearbyLocations
    };
}
