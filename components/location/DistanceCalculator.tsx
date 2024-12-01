'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { calculateDistance, formatDistance } from '@/lib/utils/distance';
import { ArrowsRightLeft } from 'lucide-react';

interface Point {
  lat: number;
  lng: number;
  name?: string;
  details?: {
    provider?: string;
    strength?: string;
    quality?: string;
  };
}

interface DistanceCalculatorProps {
  currentLocation: Point | null;
  selectedPoint: Point | null;
  className?: string;
}

export function DistanceCalculator({ 
  currentLocation, 
  selectedPoint,
  className = ''
}: DistanceCalculatorProps) {
  const t = useTranslations();

  if (!currentLocation || !selectedPoint) {
    return null;
  }

  const distance = calculateDistance(currentLocation, selectedPoint);
  const formattedDistance = formatDistance(distance);

  return (
    <Card className={`p-4 ${className}`}>
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <div>
            <p className="font-medium">{t('location.distance.from')}:</p>
            <p className="text-muted-foreground">
              {t('location.distance.currentLocation')}<br />
              {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
            </p>
          </div>
          <ArrowsRightLeft className="mx-2 text-muted-foreground" />
          <div className="text-right">
            <p className="font-medium">{t('location.distance.to')}:</p>
            <p className="text-muted-foreground">
              {selectedPoint.name || t('location.distance.selectedPoint')}<br />
              {selectedPoint.lat.toFixed(6)}, {selectedPoint.lng.toFixed(6)}
            </p>
          </div>
        </div>

        {selectedPoint.details && (
          <div className="text-sm border-t pt-2">
            <p className="font-medium">{t('location.coverage.details')}:</p>
            <p className="text-muted-foreground">
              {selectedPoint.details.provider && `${t('location.coverage.provider')}: ${selectedPoint.details.provider}`}<br />
              {selectedPoint.details.strength && `${t('location.coverage.strength')}: ${selectedPoint.details.strength}`}<br />
              {selectedPoint.details.quality && `${t('location.coverage.quality')}: ${selectedPoint.details.quality}`}
            </p>
          </div>
        )}

        <div className="text-center border-t pt-2">
          <p className="text-sm text-muted-foreground">{t('location.distance.label')}:</p>
          <p className="text-lg font-semibold">{formattedDistance}</p>
        </div>
      </div>
    </Card>
  );
}
