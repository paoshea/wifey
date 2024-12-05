'use client';

import { useEffect, useState } from 'react';
import { OfflineManager, SyncStatus } from '@/lib/offline';

interface StatusBarProps {
    className?: string;
}

export function OfflineStatusBar({ className = '' }: StatusBarProps) {
    const [status, setStatus] = useState<SyncStatus | null>(null);
    const [isMeasuring, setIsMeasuring] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);
    const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);

    useEffect(() => {
        const manager = OfflineManager.getInstance();

        const updateStatus = async () => {
            try {
                const syncStatus = await manager.getSyncStatus();
                const position = await manager.getCurrentLocation();

                setStatus(syncStatus);
                setIsMeasuring(manager.isMeasuring());
                setIsNavigating(manager.isNavigating());
                setCurrentLocation({
                    lat: position.latitude,
                    lng: position.longitude
                });
            } catch (error) {
                console.error('Failed to update status:', error);
            }
        };

        // Update status immediately and then every 5 seconds
        updateStatus();
        const interval = setInterval(updateStatus, 5000);

        // Force sync when coming online
        const handleOnline = () => {
            manager.syncNow().catch(console.error);
        };

        window.addEventListener('online', handleOnline);

        // Cleanup
        return () => {
            clearInterval(interval);
            window.removeEventListener('online', handleOnline);
        };
    }, []);

    if (!status) return null;

    return (
        <div className={`fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50 border-t ${className}`}>
            <div className="container flex items-center justify-between h-14 px-4">
                {/* Connection Status */}
                <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${status.isOnline ? 'bg-green-500' : 'bg-yellow-500'}`} />
                    <span className="text-sm font-medium">
                        {status.isOnline ? 'Online' : 'Offline'}
                    </span>
                </div>

                {/* Sync Status */}
                {status.pendingItems > 0 && (
                    <div className="flex items-center space-x-2">
                        <svg
                            className="animate-spin h-4 w-4 text-muted-foreground"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                        </svg>
                        <span className="text-sm text-muted-foreground">
                            Syncing {status.pendingItems} items...
                        </span>
                    </div>
                )}

                {/* Activity Status */}
                <div className="flex items-center space-x-4">
                    {isMeasuring && (
                        <div className="flex items-center space-x-1 text-sm">
                            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                            <span>Recording Coverage</span>
                        </div>
                    )}

                    {isNavigating && (
                        <div className="flex items-center space-x-1 text-sm">
                            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                            <span>Navigating</span>
                        </div>
                    )}
                </div>

                {/* Location Display */}
                {currentLocation && (
                    <div className="text-sm text-muted-foreground hidden md:block">
                        {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
                    </div>
                )}
            </div>

            {/* Error Display */}
            {status.syncErrors.length > 0 && (
                <div className="container px-4 py-2 bg-destructive/10 text-destructive text-sm">
                    Last error: {status.syncErrors[status.syncErrors.length - 1].error}
                </div>
            )}
        </div>
    );
}
