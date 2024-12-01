'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle, MapPin, Navigation, Crosshair } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LocationTracker as LocationTrackerClass } from '@/lib/location/LocationTracker';
import { useTranslations } from 'next-intl';

interface LocationTrackerProps {
  onLocationUpdate?: (location: { lat: number; lng: number }) => void;
  className?: string;
}

export function LocationTracker({ onLocationUpdate, className = '' }: LocationTrackerProps) {
  const t = useTranslations('location');
  const [tracker] = useState(() => new LocationTrackerClass());
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    accuracy?: number;
    timestamp?: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [watching, setWatching] = useState(false);
  const [accuracy, setAccuracy] = useState<'high' | 'medium' | 'low'>('medium');

  const handleLocationUpdate = useCallback((locationData: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    timestamp?: number;
  }) => {
    setLocation(locationData);
    if (onLocationUpdate) {
      onLocationUpdate({ lat: locationData.latitude, lng: locationData.longitude });
    }

    // Update accuracy status
    if (locationData.accuracy) {
      if (locationData.accuracy <= 10) {
        setAccuracy('high');
      } else if (locationData.accuracy <= 50) {
        setAccuracy('medium');
      } else {
        setAccuracy('low');
      }
    }
  }, [onLocationUpdate]);

  const startTracking = useCallback(() => {
    tracker.startTracking(
      handleLocationUpdate,
      (error) => setError(error.message)
    );
    setWatching(true);
  }, [tracker, handleLocationUpdate]);

  const stopTracking = useCallback(() => {
    tracker.stopTracking();
    setWatching(false);
  }, [tracker]);

  useEffect(() => {
    return () => {
      tracker.stopTracking();
    };
  }, [tracker]);

  const getAccuracyColor = (accuracy: 'high' | 'medium' | 'low') => {
    switch (accuracy) {
      case 'high':
        return 'bg-green-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Card className={`${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-md font-medium">
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4" />
            <span>{t('title')}</span>
          </div>
        </CardTitle>
        <div className="flex items-center space-x-2">
          {watching && (
            <Badge variant="outline" className={getAccuracyColor(accuracy)}>
              {t(`accuracy.${accuracy}`)}
            </Badge>
          )}
          <Button
            variant={watching ? "destructive" : "default"}
            size="sm"
            onClick={watching ? stopTracking : startTracking}
          >
            {watching ? t('stopTracking') : t('startTracking')}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="flex items-center space-x-2 bg-red-100 text-red-700 p-2 rounded-md mb-2">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {location && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm">
                <span className="text-muted-foreground">{t('latitude')}:</span>{' '}
                <span className="font-mono">{location.latitude.toFixed(6)}°</span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">{t('longitude')}:</span>{' '}
                <span className="font-mono">{location.longitude.toFixed(6)}°</span>
              </div>
            </div>

            {location.accuracy && (
              <div className="text-sm">
                <span className="text-muted-foreground">{t('accuracy')}:</span>{' '}
                <span className="font-mono">±{Math.round(location.accuracy)}m</span>
              </div>
            )}

            {location.timestamp && (
              <div className="text-sm">
                <span className="text-muted-foreground">{t('lastUpdate')}:</span>{' '}
                <span className="font-mono">
                  {new Date(location.timestamp).toLocaleTimeString()}
                </span>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                asChild
                className="text-xs"
              >
                <a
                  href={tracker.generateGoogleMapsUrl(location)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('viewOnMaps')}
                </a>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
