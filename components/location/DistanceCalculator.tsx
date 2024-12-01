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
  const t = useTranslations('distance');

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
            <p className="font-medium">{t('from')}:</p>
            <p className="text-muted-foreground">
              {t('currentLocation')}<br />
              {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
            </p>
          </div>
          <ArrowsRightLeft className="mx-2 text-muted-foreground" />
          <div className="text-right">
            <p className="font-medium">{t('to')}:</p>
            <p className="text-muted-foreground">
              {selectedPoint.name || t('selectedPoint')}<br />
              {selectedPoint.lat.toFixed(6)}, {selectedPoint.lng.toFixed(6)}
            </p>
          </div>
        </div>

        {selectedPoint.details && (
          <div className="text-sm border-t pt-2">
            <p className="font-medium">{t('coverageDetails')}:</p>
            <p className="text-muted-foreground">
              {selectedPoint.details.provider && `${t('provider')}: ${selectedPoint.details.provider}`}<br />
              {selectedPoint.details.strength && `${t('strength')}: ${selectedPoint.details.strength}`}<br />
              {selectedPoint.details.quality && `${t('quality')}: ${selectedPoint.details.quality}`}
            </p>
          </div>
        )}

        <div className="text-center border-t pt-2">
          <p className="text-sm text-muted-foreground">{t('distance')}:</p>
          <p className="text-lg font-semibold">{formattedDistance}</p>
        </div>
      </div>
    </Card>
  );
}
