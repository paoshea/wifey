import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { CarrierCoverage } from '@/lib/carriers/types';
import { offlineStorage } from '@/lib/services/offline-storage';
import { useMonitoring } from '@/components/providers/monitoring-provider';

interface UseOfflineSyncResult {
  isOnline: boolean;
  isPending: boolean;
  pendingCount: number;
  markCoverageSpot: (data: Omit<CarrierCoverage, 'id'>) => Promise<string>;
  getCachedCoverage: (bounds: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  }) => Promise<CarrierCoverage[] | null>;
  syncStatus: {
    lastSync: Date | null;
    pendingPoints: number;
    cacheSize: number;
  };
}

export function useOfflineSync(): UseOfflineSyncResult {
  const { data: session } = useSession();
  const { trackEvent } = useMonitoring();
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isPending, setIsPending] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [syncStats, setSyncStats] = useState({
    pendingPoints: 0,
    cacheSize: 0,
  });

  // Initialize offline storage
  useEffect(() => {
    offlineStorage.initialize().catch(console.error);
  }, []);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      trackEvent('network_status_change', { status: 'online' });
    };

    const handleOffline = () => {
      setIsOnline(false);
      trackEvent('network_status_change', { status: 'offline' });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [trackEvent]);

  // Update pending count periodically
  useEffect(() => {
    const updatePendingCount = async () => {
      try {
        const stats = await offlineStorage.getStorageStats();
        setPendingCount(stats.pendingPoints);
        setSyncStats({
          pendingPoints: stats.pendingPoints,
          cacheSize: stats.cacheSize,
        });
      } catch (error) {
        console.error('Failed to get storage stats:', error);
      }
    };

    updatePendingCount();
    const interval = setInterval(updatePendingCount, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Mark coverage spot with offline support
  const markCoverageSpot = useCallback(async (
    data: Omit<CarrierCoverage, 'id'>
  ): Promise<string> => {
    setIsPending(true);
    try {
      // Add user ID if available
      const coverageData = session?.user?.id
        ? { ...data, userId: session.user.id }
        : data;

      // Try online first if available
      if (navigator.onLine) {
        try {
          const response = await fetch('/api/coverage/contribute', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(coverageData),
          });

          if (response.ok) {
            const result = await response.json();
            trackEvent('coverage_point_marked', { online: true });
            return result.id;
          }
        } catch (error) {
          console.warn('Failed to mark coverage online, falling back to offline storage');
        }
      }

      // Fall back to offline storage
      const id = await offlineStorage.storePendingPoint(coverageData);
      trackEvent('coverage_point_marked', { online: false });
      return id;
    } finally {
      setIsPending(false);
    }
  }, [session, trackEvent]);

  // Get cached coverage with bounds
  const getCachedCoverage = useCallback(async (bounds: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  }): Promise<CarrierCoverage[] | null> => {
    try {
      return await offlineStorage.getCachedCoverage(bounds);
    } catch (error) {
      console.error('Failed to get cached coverage:', error);
      return null;
    }
  }, []);

  // Register for background sync when online
  useEffect(() => {
    if (isOnline) {
      offlineStorage.registerBackgroundSync().catch(console.error);
    }
  }, [isOnline]);

  // Clean up old cache periodically
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      offlineStorage.clearOldCache().catch(console.error);
    }, 24 * 60 * 60 * 1000); // Once per day

    return () => clearInterval(cleanupInterval);
  }, []);

  return {
    isOnline,
    isPending,
    pendingCount,
    markCoverageSpot,
    getCachedCoverage,
    syncStatus: {
      lastSync,
      ...syncStats,
    },
  };
}
