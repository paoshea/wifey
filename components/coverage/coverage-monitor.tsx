'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useNotificationStore } from '@/lib/store/notification-store';
import { useCoverageStore } from '@/lib/store/coverage-store';
import type { SignalMeasurement } from '@/lib/types/monitoring';

const LOCATION_CHECK_INTERVAL = 30000; // 30 seconds
const COVERAGE_CHECK_RADIUS = 100; // 100 meters

interface Position {
  lat: number;
  lng: number;
}

function calculateDistance(pos1: Position, pos2: Position): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (pos1.lat * Math.PI) / 180;
  const φ2 = (pos2.lat * Math.PI) / 180;
  const Δφ = ((pos2.lat - pos1.lat) * Math.PI) / 180;
  const Δλ = ((pos2.lng - pos1.lng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export default function CoverageMonitor() {
  const { addNotification, lastCheckedLocation, setLastCheckedLocation } = useNotificationStore();
  const { coveragePoints } = useCoverageStore();
  const watchId = useRef<number | null>(null);

  const checkCoverageHistory = useCallback(
    (currentPosition: Position) => {
      // Don't check if we've checked recently in this location
      if (lastCheckedLocation) {
        const distance = calculateDistance(currentPosition, lastCheckedLocation);
        const timeSinceLastCheck = Date.now() - lastCheckedLocation.timestamp;
        
        if (distance < COVERAGE_CHECK_RADIUS && timeSinceLastCheck < LOCATION_CHECK_INTERVAL) {
          return;
        }
      }

      // Update last checked location
      setLastCheckedLocation(currentPosition);

      // Find historical coverage points near current position
      const nearbyPoints = coveragePoints.filter((point: SignalMeasurement) => {
        const distance = calculateDistance(currentPosition, point.geolocation);
        return distance <= COVERAGE_CHECK_RADIUS;
      });

      if (nearbyPoints.length > 0) {
        // Group by provider
        const providerGroups = nearbyPoints.reduce((acc: Record<string, SignalMeasurement[]>, point) => {
          if (!acc[point.provider]) {
            acc[point.provider] = [];
          }
          acc[point.provider].push(point);
          return acc;
        }, {});

        // Create notifications for significant coverage changes
        Object.entries(providerGroups).forEach(([provider, points]) => {
          const latestPoint = points.reduce((latest, point) => 
            new Date(point.timestamp) > new Date(latest.timestamp) ? point : latest
          );

          addNotification({
            title: 'Coverage Alert',
            message: `You've entered an area where ${provider} had ${latestPoint.signalStrength}% signal strength`,
            type: latestPoint.signalStrength >= 70 ? 'success' : 
                  latestPoint.signalStrength >= 40 ? 'info' : 'warning',
            location: currentPosition,
            coverageData: {
              provider: latestPoint.provider,
              signalStrength: latestPoint.signalStrength,
              timestamp: new Date(latestPoint.timestamp).toISOString(),
            },
          });
        });
      }
    },
    [lastCheckedLocation, coveragePoints, addNotification, setLastCheckedLocation]
  );

  useEffect(() => {
    // Start watching position
    if ('geolocation' in navigator) {
      watchId.current = navigator.geolocation.watchPosition(
        (position) => {
          const currentPosition = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          checkCoverageHistory(currentPosition);
        },
        (error) => {
          console.error('Error getting location:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      );
    }

    // Cleanup
    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, [checkCoverageHistory]);

  // This is a monitoring component, so it doesn't render anything
  return null;
}
