'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Crosshair } from 'lucide-react';
import dynamic from 'next/dynamic';
import type { MapPoint } from './map-view';

const MapView = dynamic(() => import('./map-view'), { ssr: false });

interface OfflineMapProps {
  currentLocation?: { lat: number; lng: number; accuracy: number } | null;
  coveragePoints?: MapPoint[];
  onLocationUpdate?: (location: { lat: number; lng: number }) => void;
  className?: string;
}

export function OfflineMap({
  currentLocation,
  coveragePoints = [],
  onLocationUpdate,
  className = ''
}: OfflineMapProps) {
  const t = useTranslations('location');
  const [mapCenter, setMapCenter] = useState<[number, number]>([9.9281, -84.0907]);
  const [mapZoom, setMapZoom] = useState(13);
  const [hoveredPoint, setHoveredPoint] = useState<MapPoint | null>(null);
  const [cursorPosition, setCursorPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null);

  useEffect(() => {
    if (currentLocation) {
      setMapCenter([currentLocation.lat, currentLocation.lng]);
      setMapZoom(15);
    }
  }, [currentLocation]);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setCursorPosition({ lat, lng });
  }, []);

  const handlePointHover = useCallback((point: MapPoint | null) => {
    setHoveredPoint(point);
  }, []);

  const handlePointSelect = useCallback((point: MapPoint) => {
    setSelectedPoint(point);
  }, []);

  const handleFindMe = useCallback(() => {
    if (currentLocation) {
      setMapCenter([currentLocation.lat, currentLocation.lng]);
      setMapZoom(15);
    }
  }, [currentLocation]);

  const calculateDistance = useCallback((point1: { lat: number; lng: number }, point2: { lat: number; lng: number }) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = point1.lat * Math.PI / 180;
    const φ2 = point2.lat * Math.PI / 180;
    const Δφ = (point2.lat - point1.lat) * Math.PI / 180;
    const Δλ = (point2.lng - point1.lng) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }, []);

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="relative">
        <div className="h-[500px] w-full">
          <MapView
            points={coveragePoints}
            activeLayer="coverage"
            center={mapCenter}
            zoom={mapZoom}
            onPointSelect={handlePointSelect}
            onPointHover={handlePointHover}
            onMapClick={handleMapClick}
            currentLocation={currentLocation}
          />
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="absolute bottom-4 right-4 shadow-lg"
          onClick={handleFindMe}
          disabled={!currentLocation}
        >
          <Crosshair className="w-4 h-4 mr-2" />
          {t('findMe')}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {cursorPosition && (
          <Card className="p-3">
            <h4 className="text-sm font-medium mb-2">{t('cursorPosition')}</h4>
            <div className="space-y-1 text-sm">
              <p>{t('latitude')}: {cursorPosition.lat.toFixed(6)}</p>
              <p>{t('longitude')}: {cursorPosition.lng.toFixed(6)}</p>
            </div>
          </Card>
        )}
        
        {hoveredPoint && currentLocation && (
          <Card className="p-3">
            <h4 className="text-sm font-medium mb-2">{t('distanceToPoint')}</h4>
            <div className="space-y-1 text-sm">
              <p>{t('distance')}: {(calculateDistance(currentLocation, {
                lat: hoveredPoint.coordinates[0],
                lng: hoveredPoint.coordinates[1]
              }) / 1000).toFixed(2)} km</p>
              <p>{hoveredPoint.name}</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
