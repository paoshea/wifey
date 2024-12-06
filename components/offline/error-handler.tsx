'use client';

import { useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { OfflineManager, LocationError, LocationErrorCode } from '@/lib/offline';

export function OfflineErrorHandler() {
    const handleError = useCallback((error: LocationError) => {
        let title = 'Error';
        let description = error.message;
        let duration = 5000; // 5 seconds

        // Customize error messages based on error code
        switch (error.code) {
            case LocationErrorCode.PERMISSION_DENIED:
                title = 'Location Access Denied';
                description = 'Please enable location access in your browser settings to use offline features.';
                duration = 10000; // Show longer for important permissions errors
                break;

            case LocationErrorCode.POSITION_UNAVAILABLE:
                title = 'Location Unavailable';
                description = 'Unable to determine your location. Please check your GPS settings.';
                break;

            case LocationErrorCode.TIMEOUT:
                title = 'Location Timeout';
                description = 'Location request timed out. Please try again.';
                break;

            case LocationErrorCode.UNSUPPORTED:
                title = 'Not Supported';
                description = 'Your device does not support the required location features.';
                duration = 10000;
                break;

            case LocationErrorCode.TRACKING_FAILED:
                title = 'Tracking Failed';
                description = 'Failed to track location. Please check your device settings.';
                break;
        }

        toast.error(title, {
            description,
            duration,
        });

        // Log error for debugging
        console.error('Offline System Error:', {
            code: error.code,
            message: error.message,
            originalError: error.originalError
        });
    }, []);

    useEffect(() => {
        const manager = OfflineManager.getInstance();

        // Add error listener
        const cleanup = manager.onError(handleError);

        // Handle offline/online transitions
        const handleOffline = () => {
            toast('Working Offline', {
                description: 'Changes will be synced when connection is restored',
                duration: 5000
            });
        };

        const handleOnline = () => {
            toast.success('Back Online', {
                description: 'Connection restored. Syncing changes...',
                duration: 3000
            });
        };

        window.addEventListener('offline', handleOffline);
        window.addEventListener('online', handleOnline);

        // Cleanup listeners
        return () => {
            cleanup();
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('online', handleOnline);
        };
    }, [handleError]);

    // This component doesn't render anything
    return null;
}

// Export a hook for components that need to handle errors manually
export function useOfflineError() {
    const handleError = useCallback((error: LocationError) => {
        toast.error(error.message, {
            description: error.originalError?.message,
            duration: 5000
        });
    }, []);

    return {
        handleError
    };
}

// Export a component for displaying specific error states
export function OfflineErrorDisplay({
    error,
    onRetry
}: {
    error: LocationError;
    onRetry?: () => void;
}) {
    return (
        <div className="rounded-lg bg-destructive/10 p-4 text-destructive">
            <div className="font-semibold">
                {error.code === LocationErrorCode.PERMISSION_DENIED ? (
                    'Location Access Required'
                ) : error.code === LocationErrorCode.UNSUPPORTED ? (
                    'Device Not Supported'
                ) : (
                    'Error Occurred'
                )}
            </div>
            <p className="mt-1 text-sm">{error.message}</p>
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="mt-2 text-sm font-medium hover:underline"
                >
                    Try Again
                </button>
            )}
        </div>
    );
}
