'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Wifi, WifiOff } from 'lucide-react';
import { OfflineLocationService } from '@/lib/location/OfflineLocationService';

interface LocationData {
  coords: {
    latitude: number;
    longitude: number;
    accuracy: number;
    heading?: number;
    speed?: number;
  };
  timestamp: number;
}

interface OfflineGPSMapProps {
  onLocationUpdate?: (location: { lat: number; lng: number; accuracy: number }) => void;
  className?: string;
}

export function OfflineGPSMap({ onLocationUpdate, className = '' }: OfflineGPSMapProps) {
  const t = useTranslations();
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [averageAccuracy, setAverageAccuracy] = useState<number | null>(null);
  const [currentSpeed, setCurrentSpeed] = useState<number | null>(null);

  const locationService = OfflineLocationService.getInstance();

  const handleLocationUpdate = useCallback((location: LocationData) => {
    setCurrentLocation(location);
    setAverageAccuracy(locationService.getAverageAccuracy());
    setCurrentSpeed(locationService.getCurrentSpeed());

    if (onLocationUpdate) {
      onLocationUpdate({
        lat: location.coords.latitude,
        lng: location.coords.longitude,
        accuracy: location.coords.accuracy
      });
    }
  }, [onLocationUpdate]);

  useEffect(() => {
    const handleOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);

    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);

  const startTracking = async () => {
    try {
      setError(null);
      await locationService.startTracking();
      const unsubscribe = locationService.addListener(handleLocationUpdate);
      setIsTracking(true);
      return () => {
        unsubscribe();
        locationService.stopTracking();
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start tracking');
      setIsTracking(false);
    }
  };

  const stopTracking = () => {
    locationService.stopTracking();
    setIsTracking(false);
  };

  const getAccuracyLevel = (accuracy: number) => {
    if (accuracy <= 10) return { level: t('location.accuracy.high'), color: 'bg-green-500' };
    if (accuracy <= 30) return { level: t('location.accuracy.medium'), color: 'bg-yellow-500' };
    return { level: t('location.accuracy.low'), color: 'bg-red-500' };
  };

  const formatSpeed = (speedMps: number) => {
    const speedKph = speedMps * 3.6;
    return `${speedKph.toFixed(1)} km/h`;
  };

  return (
    <Card className={`p-4 ${className}`}>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">
            {t('location.tracking.gps')}
          </h3>
          <Badge variant={isOnline ? 'default' : 'secondary'}>
            {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
            {isOnline ? t('location.status.online') : t('location.status.offline')}
          </Badge>
        </div>

        <Button
          onClick={isTracking ? stopTracking : startTracking}
          variant={isTracking ? 'destructive' : 'default'}
          className="w-full"
        >
          {isTracking ? t('location.tracking.stop') : t('location.tracking.start')}
        </Button>

        {currentLocation && (
          <div className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-muted-foreground">{t('location.coordinates.latitude')}:</p>
                <p className="font-medium">{currentLocation.coords.latitude.toFixed(6)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t('location.coordinates.longitude')}:</p>
                <p className="font-medium">{currentLocation.coords.longitude.toFixed(6)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge className={getAccuracyLevel(currentLocation.coords.accuracy).color}>
                {t(`location.accuracy.${getAccuracyLevel(currentLocation.coords.accuracy).level}`)}
              </Badge>
              <span className="text-muted-foreground">
                ±{Math.round(currentLocation.coords.accuracy)}{t('location.metrics.meters')}
              </span>
            </div>

            {currentLocation.coords.heading && (
              <div className="flex items-center gap-2">
                <Navigation className="h-4 w-4" />
                <span>{t('location.metrics.heading')}: {Math.round(currentLocation.coords.heading)}°</span>
              </div>
            )}

            {currentSpeed && (
              <div>
                <p className="text-muted-foreground">{t('location.metrics.speed')}:</p>
                <p className="font-medium">{formatSpeed(currentSpeed)}</p>
              </div>
            )}

            {averageAccuracy && (
              <div>
                <p className="text-muted-foreground">{t('location.metrics.averageAccuracy')}:</p>
                <p className="font-medium">±{Math.round(averageAccuracy)}{t('location.metrics.meters')}</p>
              </div>
            )}
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive">{t(`location.errors.${error}`)}</p>
        )}
      </div>
    </Card>
  );
}
