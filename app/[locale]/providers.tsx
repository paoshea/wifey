'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';
import { OfflineManager } from '@/lib/offline';
import { ToastProvider } from '@/components/providers/toast-provider';
import { ThemeProvider } from 'next-themes';

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const initializeOffline = async () => {
      const manager = OfflineManager.getInstance();
      try {
        await manager.initialize({
          location: {
            trackingInterval: 5000,    // Update location every 5 seconds
            minDistance: 10,           // Minimum 10 meters movement to update
            maxAge: 30000,            // Location data valid for 30 seconds
            timeout: 15000,           // Location request timeout after 15 seconds
            enableHighAccuracy: true   // Use high accuracy GPS
          },
          sync: {
            autoSyncInterval: 60000,   // Try to sync every minute
            maxRetries: 3,             // Retry failed syncs 3 times
            retryDelay: 5000          // Wait 5 seconds between retries
          },
          map: {
            maxZoom: 18,              // Maximum zoom level for offline maps
            minZoom: 10,              // Minimum zoom level for offline maps
            tileExpiration: 7 * 24 * 60 * 60 * 1000, // Tiles expire after 7 days
            preloadRadius: 5          // Pre-download maps within 5km
          },
          storage: {
            mapTiles: 1000,           // Maximum number of map tiles to store
            locationHistory: 1000,     // Maximum number of location entries
            coveragePoints: 500,       // Maximum number of coverage points
            pendingReports: 100       // Maximum number of pending reports
          }
        });
        toast.success('Offline system initialized successfully');
      } catch (error) {
        toast.error('Failed to initialize offline system', {
          description: error instanceof Error ? error.message : 'Unknown error occurred'
        });
        console.error('Failed to initialize offline system:', error);
      }
    };

    initializeOffline();

    // Handle online/offline events
    const handleOnline = () => {
      toast.success('Connection restored', {
        description: 'Syncing pending changes...'
      });
    };

    const handleOffline = () => {
      toast('Working offline', {
        description: 'Changes will be synced when connection is restored'
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup when component unmounts
    return () => {
      const manager = OfflineManager.getInstance();
      manager.stopAll();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return <>{children}</>;
}

// Combine all providers
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ToastProvider />
      <OfflineProvider>
        {children}
      </OfflineProvider>
    </ThemeProvider>
  );
}
