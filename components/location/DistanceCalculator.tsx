'use client';

import { useState } from 'react';
import { Card } from 'components/ui/card';
import { calculateDistance, formatDistance } from 'lib/utils/distance';
import { ArrowRightLeft } from 'lucide-react';

interface LocationPoint {
  lat: number;
  lng: number;
}

interface DistanceCalculatorProps {
  currentLocation: LocationPoint;
  selectedPoint: LocationPoint;
}

export function DistanceCalculator({ currentLocation, selectedPoint }: DistanceCalculatorProps) {
  const [distance] = useState(() => calculateDistance(
    { lat: currentLocation.lat, lng: currentLocation.lng },
    { lat: selectedPoint.lat, lng: selectedPoint.lng }
  ));

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm">
          <div>
            {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
          </div>
          <ArrowRightLeft className="h-4 w-4 mx-2 text-muted-foreground" />
          <div>
            {selectedPoint.lat.toFixed(6)}, {selectedPoint.lng.toFixed(6)}
          </div>
        </div>
        <div className="font-medium">
          {formatDistance(distance)}
        </div>
      </div>
    </Card>
  );
}
