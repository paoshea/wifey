'use client';

import { useState } from 'react';
import { Card } from 'components/ui/card';
import { calculateDistance, formatDistance } from 'lib/utils/distance';
import { ArrowRightLeft } from 'lucide-react';

interface Point {
  lat: number;
  lng: number;
}

interface DistanceCalculatorProps {
  point1: Point;
  point2: Point;
}

export function DistanceCalculator({ point1, point2 }: DistanceCalculatorProps) {
  const [distance] = useState(() => calculateDistance(point1, point2));

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm">
          <div>
            {point1.lat.toFixed(6)}, {point1.lng.toFixed(6)}
          </div>
          <ArrowRightLeft className="h-4 w-4 mx-2 text-muted-foreground" />
          <div>
            {point2.lat.toFixed(6)}, {point2.lng.toFixed(6)}
          </div>
        </div>
        <div className="font-medium">
          {formatDistance(distance)}
        </div>
      </div>
    </Card>
  );
}
