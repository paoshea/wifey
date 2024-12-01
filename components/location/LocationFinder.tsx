'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { MapPin } from 'lucide-react';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
}

interface LocationFinderProps {
  onLocationFound?: (location: { lat: number; lng: number; accuracy: number }) => void;
  className?: string;
}

export function LocationFinder({ onLocationFound, className = '' }: LocationFinderProps) {
  const t = useTranslations('location');
  const [coords, setCoords] = useState<LocationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const getLocation = () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError(t('errors.notSupported'));
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const locationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        };
        setCoords(locationData);
        setLoading(false);
        
        if (onLocationFound) {
          onLocationFound({
            lat: locationData.latitude,
            lng: locationData.longitude,
            accuracy: locationData.accuracy
          });
        }
      },
      (error) => {
        setLoading(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setError(t('errors.permissionDenied'));
            break;
          case error.POSITION_UNAVAILABLE:
            setError(t('errors.unavailable'));
            break;
          case error.TIMEOUT:
            setError(t('errors.timeout'));
            break;
          default:
            setError(t('errors.unknown'));
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <Button
        onClick={getLocation}
        disabled={loading}
        variant="outline"
        className="w-full"
      >
        <MapPin className="mr-2 h-4 w-4" />
        {loading ? t('loading') : t('getLocation')}
      </Button>
      
      {coords && (
        <div className="text-sm space-y-1 bg-muted p-3 rounded-md">
          <p>{t('latitude')}: {coords.latitude.toFixed(6)}</p>
          <p>{t('longitude')}: {coords.longitude.toFixed(6)}</p>
          <p>{t('accuracy.high')}: ±{Math.round(coords.accuracy)} {t('meters')}</p>
        </div>
      )}
      
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
