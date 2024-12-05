'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { useTranslations } from 'next-intl';
import { MapPin } from 'lucide-react';
import { useOfflineLocation } from '../../hooks/useOfflineLocation';

interface LocationFinderProps {
  onLocationFound?: (location: { lat: number; lng: number; accuracy: number }) => void;
  className?: string;
}

export function LocationFinder({ onLocationFound, className = '' }: LocationFinderProps) {
  const t = useTranslations();
  const [loading, setLoading] = useState(false);
  const {
    isInitialized,
    isTracking,
    error: locationError,
    startTracking,
    stopTracking,
    getLastLocation
  } = useOfflineLocation();

  useEffect(() => {
    if (isInitialized && isTracking) {
      const lastLocation = getLastLocation();
      if (lastLocation && onLocationFound) {
        onLocationFound({
          lat: lastLocation.coords.latitude,
          lng: lastLocation.coords.longitude,
          accuracy: lastLocation.coords.accuracy
        });
      }
    }
  }, [isInitialized, isTracking, onLocationFound]);

  const handleGetLocation = async () => {
    setLoading(true);
    try {
      await startTracking();
      const lastLocation = getLastLocation();
      if (lastLocation && onLocationFound) {
        onLocationFound({
          lat: lastLocation.coords.latitude,
          lng: lastLocation.coords.longitude,
          accuracy: lastLocation.coords.accuracy
        });
      }
    } catch (err) {
      console.error('Failed to get location:', err);
    } finally {
      setLoading(false);
    }
  };

  const lastLocation = getLastLocation();

  return (
    <div className={`space-y-3 ${className}`}>
      <Button
        onClick={handleGetLocation}
        disabled={loading || !isInitialized}
        variant="outline"
        className="w-full"
      >
        <MapPin className="mr-2 h-4 w-4" />
        {loading ? t('location.loading') : t('location.getLocation')}
      </Button>

      {lastLocation && (
        <div className="text-sm space-y-1 bg-muted p-3 rounded-md">
          <p>{t('location.coordinates.latitude')}: {lastLocation.coords.latitude.toFixed(6)}</p>
          <p>{t('location.coordinates.longitude')}: {lastLocation.coords.longitude.toFixed(6)}</p>
          <p>{t('location.accuracy.high')}: ±{Math.round(lastLocation.coords.accuracy)} {t('location.metrics.meters')}</p>
        </div>
      )}

      {locationError && (
        <p className="text-sm text-destructive">{locationError.message}</p>
      )}
    </div>
  );
}
