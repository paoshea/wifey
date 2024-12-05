'use client';

import { useEffect, useState } from 'react';
import { OfflineLocationService } from '../lib/location/OfflineLocationService';

export function useOfflineLocation() {
    const [isInitialized, setIsInitialized] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [isTracking, setIsTracking] = useState(false);

    useEffect(() => {
        const service = OfflineLocationService.getInstance();
        service.init()
            .then(() => setIsInitialized(true))
            .catch(err => setError(err));
    }, []);

    const startTracking = async () => {
        try {
            const service = OfflineLocationService.getInstance();
            await service.startTracking();
            setIsTracking(true);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to start tracking'));
            setIsTracking(false);
        }
    };

    const stopTracking = () => {
        const service = OfflineLocationService.getInstance();
        service.stopTracking();
        setIsTracking(false);
    };

    const getLastLocation = () => {
        const service = OfflineLocationService.getInstance();
        return service.getLastLocation();
    };

    const getLocationHistory = () => {
        const service = OfflineLocationService.getInstance();
        return service.getLocationHistory();
    };

    return {
        isInitialized,
        isTracking,
        error,
        startTracking,
        stopTracking,
        getLastLocation,
        getLocationHistory
    };
}
